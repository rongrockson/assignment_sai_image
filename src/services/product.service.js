const path = require('path');
const sharp = require('sharp');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const httpStatus = require('http-status');
const { Parser } = require('json2csv');
const { Product } = require('../models');
const ApiError = require('../utils/ApiError');
const { s3 } = require('../config/config');
const logger = require('../config/logger');
const config = require('../config/config');

const downloadImage = async (url) => {
  const response = await axios({
    url,
    responseType: 'arraybuffer',
  });

  return Buffer.from(response.data, 'binary');
};

const saveProducts = async (products) => {
  await Product.insertMany(products);
};

const uploadToS3 = async (buffer, filename) => {
  try {
    logger.info('Uploading file to S3' + filename);
    const params = {
      Bucket: config.s3Bucket,
      Key: filename,
      Body: buffer,
      ContentType: 'image/jpeg', // Adjust the content type if needed
    };
    const data = await s3.upload(params).promise();
    logger.info('File uploaded to S3', data.Location);
    // Returns the URL of the uploaded file
    return data.Location;
  } catch (error) {
    logger.error('Error uploading file to S3', error);
    throw new Error('Error uploading file to S3');
  }
};

const processImage = async (inputUrl) => {
  try {
    const imageBuffer = await downloadImage(inputUrl);
    const filename = `${uuidv4()}${path.extname(inputUrl)}`;
    logger.info(`Processing image ${inputUrl} with filename ${filename}`);
    // reduce the quality of the image to 50%
    const processedBuffer = await sharp(imageBuffer)
      .jpeg({ quality: 50 })
      .png({ quality: 50 })
      .webp({ quality: 50 })
      .toBuffer();
    const s3Url = await uploadToS3(processedBuffer, filename);

    return s3Url;
  } catch (error) {
    logger.error(`Error processing image ${inputUrl}`, error);
    throw new Error(`Error processing image ${inputUrl}`);
  }
};

const processProducts = async (requestId) => {
  const products = await Product.find({ requestId });

  logger.info(`Processing ${products.length} products`);

  const promises = products.map((product) =>
    Promise.all(product.inputUrls.map(processImage)).then((outputUrls) => {
      return Product.findByIdAndUpdate(
        product._id,
        {
          outputUrls,
          processedAt: new Date(),
        },
        { new: true }
      );
    })
  );

  await Promise.allSettled(promises);
};

const generateCsv = async (requestId) => {
  const products = await Product.find({ requestId });
  if (!products || products.length === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No products found for this request');
  }

  const fields = ['S. No.', 'Product Name', 'Input Image Urls', 'Output Image Urls'];
  const data = products.map((product) => ({
    'S. No.': product.serialNumber,
    'Product Name': product.name,
    'Input Image Urls': product.inputUrls.join(', '),
    'Output Image Urls': product.outputUrls.join(', '),
  }));

  const parser = new Parser({ fields, delimiter: '|' });
  const csvData = parser.parse(data);

  return {
    csvData,
    filename: `processed_product_images_${requestId}.csv`,
  };
};

module.exports = {
  saveProducts,
  processProducts,
  generateCsv,
};
