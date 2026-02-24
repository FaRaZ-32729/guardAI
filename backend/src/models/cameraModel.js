const mongoose = require("mongoose");

const cameraSchema = new mongoose.Schema(
    {
        cameraName: {
            type: String,
            trim: true,
            default: null
        },

        streamUrl: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },
    },
    { timestamps: true }
);

const cameraModel = mongoose.model("Camera", cameraSchema);

module.exports = cameraModel;



// streamUrl: {
//     type: String,
//         // required: [true, "Stream URL is required"],
//         required: true,
//             trim: true,
//                 unique: true,
//             // validate: {
//             //     validator: function (v) {
//             //         // Basic URL validation (supports RTSP/HTTP/HTTPS)
//             //         return /^(rtsp|http|https):\/\/.+$/.test(v);
//             //     },
//             //     message: "Invalid stream URL format"
//             // }
//         },