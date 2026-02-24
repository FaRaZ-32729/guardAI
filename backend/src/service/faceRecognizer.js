const faceapi = require('@vladmandic/face');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

// Initialize face-api models (run once at app startup)
const initFaceModels = async () => {
    const modelPath = path.join(__dirname, '../models/face-models');

    // Download models if not present: https://github.com/justadudewhohacks/face-api.js/tree/master/weights
    await faceapi.nets.tinyFaceDetector.loadFromDisk(modelPath);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath);

    console.log('✅ Face recognition models loaded');
};

/**
 * Generate face embedding from image path
 */
const getFaceEmbedding = async (imagePath) => {
    try {
        const imgBuffer = await fs.readFile(imagePath);
        const img = await faceapi.fetchImage(imgBuffer);

        const detection = await faceapi
            .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (!detection) return null;

        // Convert Float32Array to plain array for MongoDB storage
        return Array.from(detection.descriptor);

    } catch (error) {
        console.error('❌ Error generating embedding:', error.message);
        return null;
    }
};

/**
 * Crop face from image using bounding box (from Roboflow)
 */
const cropFaceFromImage = async (imagePath, bbox, outputPath) => {
    try {
        await sharp(imagePath)
            .extract({
                left: Math.max(0, Math.floor(bbox.x - bbox.width * 0.2)),
                top: Math.max(0, Math.floor(bbox.y - bbox.height * 0.3)),
                width: Math.floor(bbox.width * 1.4),
                height: Math.floor(bbox.height * 1.6)
            })
            .resize(150, 150, { fit: 'fill' })
            .toFile(outputPath);
        return outputPath;
    } catch (error) {
        console.error('❌ Error cropping face:', error.message);
        return null;
    }
};

/**
 * Compare two embeddings using Euclidean distance
 * Threshold: < 0.6 = likely same person (adjust based on testing)
 */
const compareFaces = (embedding1, embedding2, threshold = 0.6) => {
    if (!embedding1 || !embedding2) return { match: false, distance: Infinity };

    const distance = embedding1.reduce((sum, val, i) => {
        const diff = val - embedding2[i];
        return sum + diff * diff;
    }, 0);

    const euclidean = Math.sqrt(distance);
    return {
        match: euclidean < threshold,
        distance: euclidean,
        confidence: Math.max(0, 1 - euclidean / threshold)
    };
};

module.exports = {
    initFaceModels,
    getFaceEmbedding,
    cropFaceFromImage,
    compareFaces
};