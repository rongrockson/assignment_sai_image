const csv = require('csv-parser');
const { Parser } = require('json2csv');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const httpStatus = require('http-status');
const { ProductCsv } = require('../models');
const ApiError = require('../utils/ApiError');
const { Readable } = require('stream');  // Import Readable stream
const logger = require('../config/logger');



const imageProcessor = async (inputUrl) => {
    return inputUrl;
};

const uploadCsv = async (file) => {
    if (!file || !file.data) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid file upload');
    }

    const requestId = uuidv4();
    const results = [];

    return new Promise((resolve, reject) => {
        const stream = Readable.from(file.data);

        stream
            .pipe(csv({
                separator: '|', // Use | as the field delimiter
                trim: true // Trim whitespace from fields
            }))
            .on('data', (data) => {
                // Split the 'Input Image Urls' field into an array of URLs using comma as separator
                const images = data['Input Image Urls']
                    .split(',')
                    .map(url => ({
                        inputUrl: url.trim(), // Trim whitespace from each URL
                    }))
                    .filter(url => url.inputUrl !== ''); // Remove any empty entries

                // Log to check if the URLs are being split correctly
                logger.info(images);

                results.push({
                    serialNumber: data['S. No.'],
                    name: data['Product Name'],
                    images,  // Store the array of images
                });
            })
            .on('end', async () => {
                try {
                    const productCsv = new ProductCsv({
                        requestId,
                        status: 'pending',
                        products: results,
                    });

                    await productCsv.save();

                    // Start asynchronous processing
                    processCSV(requestId);

                    resolve(requestId);
                } catch (error) {
                    logger.error('Failed to save CSV data:', error.message);
                    reject(new ApiError(httpStatus.BAD_REQUEST, 'Failed to save CSV data'));
                }
            })
            .on('error', (error) => {
                logger.error('Error processing CSV file:', error.message);
                reject(new ApiError(httpStatus.BAD_REQUEST, 'Error processing CSV file'));
            });
    });
};


const getStatus = async (requestId) => {
    logger.info("requestId", requestId);
    const productCsv0 = await ProductCsv.findOne({ requestId });
    if (!productCsv0) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Request not found');
    }
    return productCsv0.status;
};

const download = async (requestId) => {
    logger.info("requestId", requestId);
    const productCSV = await ProductCsv.findOne({ requestId });

    if (!productCSV) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Request not found');
    }

    if (productCSV.status !== 'completed') {
        throw new ApiError(httpStatus.BAD_REQUEST, 'CSV processing not yet completed');
    }

    // Define the fields for CSV
    const fields = ['S. No.', 'Product Name', 'Input Image Urls', 'Output Image Urls'];
    const opts = { fields, delimiter: '|', };

    // Map the data to match the CSV format
    const data = productCSV.products.map(product => ({
        'S. No.': product.serialNumber,
        'Product Name': product.name,
        'Input Image Urls': product.images.map(img => img.inputUrl).join(', '),
        'Output Image Urls': product.images.map(img => img.outputUrl || '').join(', ')  // Handles missing output URLs
    }));

    try {
        // Generate CSV using the json2csv Parser
        const parser = new Parser(opts);
        const csv = parser.parse(data);

        return {
            csv,
            filename: `processed_product_images_${requestId}.csv`
        };
    } catch (err) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error generating CSV');
    }
};

const processCSV = async (requestId) => {
    try {
        const productCsv0 = await ProductCsv.findOne({ requestId });
        if (!productCsv0) {
            throw new Error('ProductCsv not found');
        }

        productCsv0.status = 'processing';
        await productCsv0.save();

        for (const product of productCsv0.products) {
            for (const image of product.images) {
                image.outputUrl = await imageProcessor(image.inputUrl);
                image.processedAt = new Date();
            }
        }

        productCsv0.status = 'completed';
        await productCsv0.save();
    } catch (error) {
        await ProductCsv.findOneAndUpdate(
            { requestId },
            {
                status: 'failed',
                error: error.message
            }
        );
    }
};

const download2 = async (requestId) => {
    logger.info("requestId", requestId);
    const productCSV = await ProductCsv.findOne({ requestId });

    if (!productCSV) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Request not found');
    }

    if (productCSV.status !== 'completed') {
        throw new ApiError(httpStatus.BAD_REQUEST, 'CSV processing not yet completed');
    }

    // Define the fields for CSV
    const fields = ['S. No.', 'Product Name', 'Input Image Urls', 'Output Image Urls'];
    const opts = {
        fields,
        delimiter: '|', // Set the delimiter to |
    };

    // Map the data to match the CSV format
    const data = productCSV.products.map(product => ({
        'S. No.': product.serialNumber,
        'Product Name': product.name,
        'Input Image Urls': product.images.map(img => img.inputUrl).join(', '), // Join URLs with comma
        'Output Image Urls': product.images.map(img => img.outputUrl || '').join(', ') // Join URLs with comma
    }));

    try {
        // Generate CSV using the json2csv Parser
        const parser = new Parser(opts);
        const csv = parser.parse(data);

        // Create a Readable stream from the CSV string
        const csvStream = Readable.from(csv);

        return csvStream;
    } catch (err) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error generating CSV');
    }
};

module.exports = {
    uploadCsv,
    getStatus,
    download,
    download2
};