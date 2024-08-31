const express = require('express');
const imagesController = require('../../controllers/images.controller');

const router = express.Router();

router.route('/process').post(imagesController.processImage);

module.exports = router;
