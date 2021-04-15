const cloudinary = require('cloudinary').v2; // from documentation
const { CloudinaryStorage } = require('multer-storage-cloudinary'); // from documentation

//from .env file. once we require('dotenv') from app.js, we can use process.env method to get the key pair value from .env file
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
});

// passing cloudinary to storage. setting up instance of cloudinary storage in this file
const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'YelpCamp',
        allowedFormats: ['jpeg', 'png', 'jpg']
    }
});

module.exports = {
    cloudinary,
    storage
}