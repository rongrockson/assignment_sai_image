const path = require('path');
const sharp = require('sharp');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
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

const uploadToS3 = async (buffer, filename) => {
  try {
    logger.info(`Uploading file to S3${filename}`);
    const params = {
      Bucket: config.s3Bucket,
      Key: filename,
      Body: buffer,
      ContentType: 'image/jpeg', // Adjust the content type if needed
    };
    const data = await s3.upload(params).promise();
    logger.info('File uploaded to S3', data.Location);
    return data.Location;
  } catch (error) {
    logger.error('Error uploading file to S3', error);
    throw new Error('Error uploading file to S3');
  }
};

const processImages = async (imageUrls, requestId, serialNumber) => {
  const s3Urls = await Promise.all(
    imageUrls.map(async (inputUrl) => {
      try {
        const imageBuffer = await downloadImage(inputUrl);
        const filename = `${uuidv4()}${path.extname(inputUrl)}`;
        logger.info(`Processing image ${inputUrl} with filename ${filename}`);

        const processedBuffer = await sharp(imageBuffer)
          .jpeg({ quality: 50 })
          .png({ quality: 50 })
          .webp({ quality: 50 })
          .toBuffer();

        const s3Url = await uploadToS3(processedBuffer, filename);
        return s3Url;
      } catch (error) {
        logger.error(`Error processing image ${inputUrl}`, error);
        throw error;
      }
    })
  );

  return { s3Urls, requestId, serialNumber };
};

module.exports = {
  processImages,
  downloadImage,
  uploadToS3,
};
