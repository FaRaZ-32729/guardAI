const cameraModel = require("../models/cameraModel");

const isValidStreamUrl = (url) => {
    return /^(rtsp|http|https):\/\/[^\s]+$/.test(url);
};


const registerCam = async (req, res) => {
    try {
        const { cameraName, streamUrl } = req.body;

        if (!streamUrl) {
            return res.status(400).json({ message: "Stream URL is required" });
        }

        if (!isValidStreamUrl(streamUrl)) {
            return res.status(400).json({ message: "Invalid stream URL format" });
        }

        const existing = await cameraModel.findOne({ streamUrl });

        if (existing) {
            return res.status(400).json({ message: "Camera with this stream URL already exists" });
        }

        const camera = new cameraModel({
            cameraName: cameraName || null,
            streamUrl
        });

        await camera.save();

        return res.status(201).json({
            message: "Camera registered successfully",
            camera
        });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const getAllCam = async (req, res) => {
    try {
        const cameras = await cameraModel.find().sort({ createdAt: -1 });

        return res.status(200).json({
            count: cameras.length,
            cameras
        });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const getSingleCam = async (req, res) => {
    try {
        const { id } = req.params;

        const camera = await cameraModel.findById(id);

        if (!camera) {
            return res.status(404).json({ message: "Camera not found" });
        }

        return res.status(200).json(camera);

    } catch (error) {
        return res.status(500).json({ message: "Invalid camera ID" });
    }
};

const updateCam = async (req, res) => {
    try {
        const { id } = req.params;
        const { cameraName, streamUrl } = req.body;

        const camera = await cameraModel.findById(id);

        if (!camera) {
            return res.status(404).json({ message: "Camera not found" });
        }

        if (streamUrl) {
            if (!isValidStreamUrl(streamUrl)) {
                return res.status(400).json({ message: "Invalid stream URL format" });
            }

            const existing = await cameraModel.findOne({
                streamUrl,
                _id: { $ne: id }
            });

            if (existing) {
                return res.status(400).json({ message: "Stream URL already in use" });
            }

            camera.streamUrl = streamUrl;
        }

        if (cameraName !== undefined) {
            camera.cameraName = cameraName || null;
        }

        await camera.save();

        return res.status(200).json({
            message: "Camera updated successfully",
            camera
        });

    } catch (error) {
        return res.status(500).json({ message: "Invalid camera ID" });
    }
};

const deleteCam = async (req, res) => {
    try {
        const { id } = req.params;

        const camera = await cameraModel.findById(id);

        if (!camera) {
            return res.status(404).json({ message: "Camera not found" });
        }

        await camera.deleteOne();

        return res.status(200).json({
            message: "Camera deleted successfully"
        });

    } catch (error) {
        return res.status(500).json({ message: "Invalid camera ID" });
    }
};

module.exports = {
    registerCam,
    getAllCam,
    getSingleCam,
    updateCam,
    deleteCam
}