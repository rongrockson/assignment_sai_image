const httpStatus = require('http-status');
const axios = require('axios');
const catchAsync = require('../utils/catchAsync');
const imagesService = require('../services/images.service');

// call the main service after processing the images
// https://assignment-spyne-rongrockson-rockson-rongs-projects.vercel.app/v1/product-image-csv/webhook
const sendOutput = async (requestId, serialNumber, outputUrls) => {
  try {
    const response = await axios.post(
      'https://assignment-spyne-rongrockson-rockson-rongs-projects.vercel.app/v1/product-image-csv/webhook',
      {
        requestId,
        serialNumber,
        outputUrls,
      }
    );
    return response.data;
  } catch (error) {
    throw new Error('Error sending output to main service');
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
