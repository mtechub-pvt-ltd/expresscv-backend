const  express = require('express');

const router = express.Router();
const controller = require("../../controllers/ImageUpload/imageUpload")
const auth =require('../../middlewares/auth')


router.post('/upload',controller.uploadImage);

module.exports= router