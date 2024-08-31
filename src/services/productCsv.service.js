const csv = require('csv-parser');
const { v4: uuidv4 } = require('uuid');
const { Readable } = require('stream');
const { ProductCsv } = require('../models');
const productService = require('./product.service');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');

const uploadCsv = async (file) => {
    const requestId = uuidv4();
    const products = [];

    const stream = Readable.from(file.data);
    stream.pipe(csv({ separator: '|', trim: true }))
        .on('data', (data) => {
            const inputUrls = data['Input Image Urls']
                .split(',')
                .map(url => url.trim())
                .filter(url => url !== '');

            products.push({
                requestId,
                serialNumber: data['S. No.'],
                name: data['Product Name'],
                inputUrls,
            });
        })
        .on('end', async () => {
            try {
                // Delegate saving products to ProductService
                await productService.saveProducts(products);

                // Create the ProductCsv entry to track status
                await ProductCsv.create({ requestId, status: 'pending' });

                // Start processing each product's images
                await productService.processProducts(requestId);

                // Update the ProductCsv status
                await ProductCsv.findOneAndUpdate({ requestId }, { status: 'completed', completedAt: new Date() });
            } catch (error) {
                await ProductCsv.findOneAndUpdate({ requestId }, { status: 'failed', error: error.message });
                throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to process CSV');
            }
        });

    return requestId;
};

const getStatus = async (requestId) => {
    const status = await ProductCsv.findOne({ requestId }).select('status');
    if (!status) throw new ApiError(httpStatus.NOT_FOUND, 'Request not found');
    return status.status;
};

const downloadCsv = async (requestId) => {
    // Delegate fetching and preparing CSV data to ProductService
    const { csv, filename } = await productService.generateCsv(requestId);
    return { csv, filename };
};

module.exports = {
    uploadCsv,
    getStatus,
    downloadCsv,
};
