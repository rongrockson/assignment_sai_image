const httpStatus = require('http-status');
const axios = require('axios');
const catchAsync = require('../utils/catchAsync');
const imagesService = require('../services/images.service');
const config = require('../config/config');
const logger = require('../config/logger');

// call the main service after processing the images
const sendOutput = async (requestId, serialNumber, outputUrls) => {
  try {
    const url = `${config.mainServiceUrl}/v1/product-image-csv/webhook`;
    logger.info(`Sending output to main service ${url}`);
    const response = await axios.post(`${url}`, {
      requestId,
      serialNumber,
      outputUrls,
    });
    return response.data;
  } catch (error) {
    logger.error('Error sending output to main service', error);
    throw new Error('Error sending output to main service', error);
  }
};

const processImages = catchAsync(async (req, res) => {
  try {
    const { imageUrls, requestId, serialNumber } = req.body;
    const { s3Urls } = await imagesService.processImages(imageUrls, requestId, serialNumber);
    await sendOutput(requestId, serialNumber, s3Urls);
  } catch (error) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ error: error.message });
  }
});

module.exports = {
  processImage: processImages,
};
