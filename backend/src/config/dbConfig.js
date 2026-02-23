const mongoose = require("mongoose");
require("dotenv").config();


console.log(process.env.MONGODB_URL)

const dbConfig = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("DB Connected Successfully");
    } catch (error) {
        console.log("error while connection with mongoDB", error.message);
    }
}

module.exports = dbConfig;