const ffmpeg = require('fluent-ffmpeg');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const Camera = require('../models/cameraModel');
const Student = require('../models/userModel'); // Your student model
const { cropFaceFromImage, compareFaces, getFaceEmbedding } = require('../utils/faceRecognizer');

ffmpeg.setFfmpegPath('C:\\ProgramData\\ffmpeg-8.0.1-essentials_build\\bin\\ffmpeg.exe');

const captureDir = path.join(__dirname, 'public', 'captures');
const tempDir = path.join(__dirname, 'public', 'temp');
[captureDir, tempDir].forEach(dir => {
    if (!fs.existsSync) require('fs').mkdirSync(dir, { recursive: true });
});

// Roboflow Config
const CIGARETTE_MODEL = {
    url: "https://serverless.roboflow.com/cigarette-detect-kx3yu/1",
    key: process.env.ROBOFLOW_API_KEY || "5AClPrAwkdK3SDazhOji"
};

const FACE_MODEL = {
    url: "https://serverless.roboflow.com/face-detection-mik1i/27",
    key: process.env.ROBOFLOW_API_KEY || "5AClPrAwkdK3SDazhOji"
};

/**
 * Stage 1: Detect cigarette
 */
const detectCigarette = async (imagePath, cameraName) => {
    try {
        const imageBuffer = await fs.readFile(imagePath);
        const imageBase64 = imageBuffer.toString('base64');

        const response = await axios.post(CIGARETTE_MODEL.url.trim(), imageBase64, {
            params: { api_key: CIGARETTE_MODEL.key },
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            timeout: 10000
        });

        const cigarettes = response.data?.predictions?.filter(p =>
            p.class.toLowerCase().includes('cigarette') && p.confidence > 0.5
        ) || [];

        return { detected: cigarettes.length > 0, predictions: response.data };
    } catch (error) {
        console.error(`❌ Cigarette detection failed for ${cameraName}:`, error.message);
        return { detected: false, error: error.message };
    }
};

/**
 * Stage 2: Detect face & match with students
 */
const identifySmoker = async (imagePath, cameraName) => {
    try {
        // 1️⃣ Send to face detection model
        const imageBuffer = await fs.readFile(imagePath);
        const imageBase64 = imageBuffer.toString('base64');

        const faceResponse = await axios.post(FACE_MODEL.url.trim(), imageBase64, {
            params: { api_key: FACE_MODEL.key },
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            timeout: 10000
        });

        const faces = faceResponse.data?.predictions?.filter(p =>
            p.class.toLowerCase().includes('face') && p.confidence > 0.6
        ) || [];

        if (faces.length === 0) {
            console.log(`👤 No face detected in ${cameraName}`);
            return null;
        }

        // 2️⃣ Use the largest/most confident face
        const primaryFace = faces.reduce((prev, current) =>
            (current.confidence > prev.confidence) ? current : prev
        );

        // 3️⃣ Crop the detected face
        const croppedPath = path.join(tempDir, `temp_face_${Date.now()}.jpg`);
        await cropFaceFromImage(imagePath, primaryFace, croppedPath);

        // 4️⃣ Generate embedding for cropped face
        const detectedEmbedding = await getFaceEmbedding(croppedPath);
        if (!detectedEmbedding) {
            console.log('⚠️ Could not generate embedding for detected face');
            return null;
        }

        // 5️⃣ Fetch all students WITH their embeddings
        const students = await Student.find({ role: 'student' })
            .select('+faceEmbedding') // Include private field
            .lean();

        // 6️⃣ Compare with each registered student
        let bestMatch = null;
        let bestScore = 0;

        for (const student of students) {
            if (!student.faceEmbedding) continue;

            const result = compareFaces(detectedEmbedding, student.faceEmbedding);

            if (result.match && result.confidence > bestScore) {
                bestScore = result.confidence;
                bestMatch = { ...student, confidence: result.confidence };
            }
        }

        // Cleanup temp file
        await fs.unlink(croppedPath).catch(() => { });

        return bestMatch;

    } catch (error) {
        console.error(`❌ Face identification failed for ${cameraName}:`, error.message);
        return null;
    }
};

/**
 * Main capture + two-stage AI pipeline
 */
const captureFrame = async (camera) => {
    const filename = `camera_${camera._id}.jpg`;
    const outputPath = path.join(captureDir, filename);
    const isRtsp = camera.streamUrl.toLowerCase().startsWith('rtsp://');

    let command = ffmpeg(camera.streamUrl)
        .outputOptions('-frames:v 1')
        .outputOptions('-y');

    if (isRtsp) {
        command = command
            .inputOption('-rtsp_transport tcp')
            .inputOption('-timeout 5000000');
    }

    command
        .save(outputPath)
        .on('end', async () => {
            console.log(`✅ Screenshot saved: ${camera.cameraName}`);

            // 🔍 Stage 1: Cigarette detection
            const cigaretteResult = await detectCigarette(outputPath, camera.cameraName);

            if (!cigaretteResult.detected) {
                return; // No cigarette, skip face recognition
            }

            console.warn(`🚨 CIGARETTE DETECTED in ${camera.cameraName}! Starting face identification...`);

            // 👤 Stage 2: Face detection + matching
            const matchedStudent = await identifySmoker(outputPath, camera.cameraName);

            if (matchedStudent) {
                console.log('\n🎯 MATCH FOUND - SMOKER IDENTIFIED:');
                console.log('┌─────────────────────────────');
                console.log(`│ 👤 Name:    ${matchedStudent.name}`);
                console.log(`│ 🆔 Roll:    ${matchedStudent.studentRollNumber}`);
                console.log(`│ 📧 Email:   ${matchedStudent.email}`);
                console.log(`│ 🎓 Dept:    ${matchedStudent.department}`);
                console.log(`│ 🎯 Confidence: ${(matchedStudent.confidence * 100).toFixed(1)}%`);
                console.log(`│ 📷 Camera:  ${camera.cameraName}`);
                console.log(`│ 🕐 Time:    ${new Date().toLocaleString()}`);
                console.log('└─────────────────────────────\n');

                // 🎯 TODO: Trigger alert, save to DB, send notification
                // await Alert.create({ ... });
                // io.emit('smoking-alert', { ... });

            } else {
                console.log(`⚠️ Cigarette detected but no matching student found in ${camera.cameraName}`);
            }
        })
        .on('error', (err) => {
            console.error(`❌ Capture error for ${camera.cameraName}:`, err.message);
        });
};

const startCameraCaptureService = () => {
    console.log('🎥🔍👤 Camera Capture + Two-Stage AI Service Started');

    setInterval(async () => {
        try {
            const cameras = await Camera.find({});
            if (cameras.length === 0) return;

            cameras.forEach((camera, index) => {
                setTimeout(() => captureFrame(camera), index * 1000);
            });
        } catch (error) {
            console.error('🔴 Error in capture loop:', error);
        }
    }, 1000); // Check every second, but FFmpeg handles throttling
};

module.exports = { startCameraCaptureService };