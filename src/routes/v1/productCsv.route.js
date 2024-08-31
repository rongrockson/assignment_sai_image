const express = require('express');
const imagesController = require('../../controllers/productCsv.controller');

const router = express.Router();

router
    .route('/upload')
    .post(imagesController.uploadCsv);

router
    .route('/status')
    .get(imagesController.getStatus);

router
    .route('/download')
    .get(imagesController.download);

module.exports = router;
