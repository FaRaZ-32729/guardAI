const ffmpeg = require('fluent-ffmpeg');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const Camera = require('../models/cameraModel');

// Set FFmpeg path (Windows example)
ffmpeg.setFfmpegPath('C:\\ProgramData\\ffmpeg-8.0.1-essentials_build\\bin\\ffmpeg.exe');

// Ensure the capture directory exists
const captureDir = path.join(__dirname, 'public', 'captures');
if (!fs.existsSync(captureDir)) {
    fs.mkdirSync(captureDir, { recursive: true });
}

// Roboflow Configuration
const ROBOFLOW_API_URL = "https://serverless.roboflow.com/cigarette-detect-kx3yu/1";
const ROBOFLOW_API_KEY = "5AClPrAwkdK3SDazhOji"; // ⚠️ Store in .env in production!

/**
 * Send image to Roboflow for inference
 */
const sendToRoboflow = async (imagePath, cameraName) => {
    try {
        // Read and convert image to base64
        const imageBuffer = fs.readFileSync(imagePath);
        const imageBase64 = imageBuffer.toString('base64');

        const response = await axios({
            method: "POST",
            url: ROBOFLOW_API_URL.trim(), // Remove any trailing spaces
            params: { api_key: ROBOFLOW_API_KEY },
            data: imageBase64,
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            timeout: 10000 // 10 second timeout
        });

        console.log(`🔍 Roboflow Response for ${cameraName}:`, JSON.stringify(response.data, null, 2));

        // 🎯 Process detections here (example: log cigarette detections)
        if (response.data?.predictions?.length > 0) {
            const cigarettes = response.data.predictions.filter(p => p.class === "cigarette");
            if (cigarettes.length > 0) {
                console.warn(`🚨 CIGARETTE DETECTED in ${cameraName}! Count: ${cigarettes.length}`);
                // TODO: Trigger alert, save to DB, send notification, etc.
            }
        }

        return response.data;

    } catch (error) {
        console.error(`❌ Roboflow API error for ${cameraName}:`, error.response?.data || error.message);
        // Don't throw - we don't want to break the capture loop
        return null;
    }
};

/**
 * Capture frame from camera stream
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
            console.log(`✅ Screenshot saved for ${camera.cameraName}: ${filename}`);

            // 🚀 Send to Roboflow AFTER successful save
            await sendToRoboflow(outputPath, camera.cameraName);
        })
        .on('error', (err) => {
            console.error(`❌ Error capturing frame for ${camera.cameraName}:`, err.message);
        });
};

/**
 * Start the capture service
 */
const startCameraCaptureService = () => {
    console.log('🎥 Camera Capture + Roboflow Service Started (Interval: 5 seconds)');

    setInterval(async () => {
        try {
            const cameras = await Camera.find({});
            if (cameras.length === 0) return;

            // Process cameras with slight delay to avoid overwhelming CPU/network
            cameras.forEach((camera, index) => {
                setTimeout(() => {
                    captureFrame(camera);
                }, index * 800); // 800ms stagger between cameras
            });

        } catch (error) {
            console.error('🔴 Error fetching cameras for capture:', error);
        }
    }, 1000);
};

module.exports = { startCameraCaptureService };





// const ffmpeg = require('fluent-ffmpeg');
// ffmpeg.setFfmpegPath('C:\\ProgramData\\ffmpeg-8.0.1-essentials_build\\bin\\ffmpeg.exe');
// // C:\ProgramData\ffmpeg-8.0.1-essentials_build\bin
// const Camera = require('../models/cameraModel');
// const fs = require('fs');
// const path = require('path');



// // Ensure the capture directory exists
// const captureDir = path.join(__dirname, 'public', 'captures');
// if (!fs.existsSync(captureDir)) {
//     fs.mkdirSync(captureDir, { recursive: true });
// }

// // Optional: Set FFmpeg path if not in system PATH
// // ffmpeg.setFfmpegPath('C:\\ffmpeg\\bin\\ffmpeg.exe'); // Windows example

// const captureFrame = (camera) => {
//     const filename = `camera_${camera._id}.jpg`;
//     const outputPath = path.join(captureDir, filename);
//     const isRtsp = camera.streamUrl.toLowerCase().startsWith('rtsp://');

//     let command = ffmpeg(camera.streamUrl)
//         .outputOptions('-frames:v 1')  // Capture only 1 frame
//         .outputOptions('-y');          // Overwrite output file

//     // Add RTSP-specific options ONLY for RTSP streams
//     if (isRtsp) {
//         command = command
//             .inputOption('-rtsp_transport tcp')
//             .inputOption('-timeout 5000000'); // 5 second timeout in microseconds
//     }

//     // For HTTP streams, you can add options like:
//     // command.inputOption('-stimeout 5000000'); // 5 second timeout for HTTP

//     command
//         .save(outputPath)
//         .on('end', () => {
//             console.log(`✅ Screenshot saved for ${camera.cameraName}: ${filename}`);
//         })
//         .on('error', (err) => {
//             console.error(`❌ Error capturing frame for ${camera.cameraName} (${camera.streamUrl}):`, err.message);
//         });
// };

// const startCameraCaptureService = () => {
//     console.log('🎥 Camera Capture Service Started (Interval: 5 seconds)');

//     setInterval(async () => {
//         try {
//             const cameras = await Camera.find({});
//             if (cameras.length === 0) return;

//             cameras.forEach(camera => {
//                 captureFrame(camera);
//             });

//         } catch (error) {
//             console.error('🔴 Error fetching cameras for capture:', error);
//         }
//     }, 5000);
// };

// module.exports = { startCameraCaptureService };



