const { Product } = require('../models');
const { Parser } = require('json2csv');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');

const saveProducts = async (products) => {
    await Product.insertMany(products);
};

const processImage = async (inputUrl) => {
    // Simulate image processing
    //reduce the size of the image to 50% of the original
    return `${inputUrl}/processed`;  // Example of processing
};

const processProducts = async (requestId) => {
    const products = await Product.find({ requestId });

    for (const product of products) {
        product.outputUrls = await Promise.all(product.inputUrls.map(processImage));
        product.processedAt = new Date();
        await product.save();
    }
};

const generateCsv = async (requestId) => {
    const products = await Product.find({ requestId });
    if (!products || products.length === 0) {
        throw new ApiError(httpStatus.NOT_FOUND, 'No products found for this request');
    }

    const fields = ['S. No.', 'Product Name', 'Input Image Urls', 'Output Image Urls'];
    const data = products.map(product => ({
        'S. No.': product.serialNumber,
        'Product Name': product.name,
        'Input Image Urls': product.inputUrls.join(', '), // Join URLs with comma
        'Output Image Urls': product.outputUrls.join(', '), // Join URLs with comma
    }));

    const parser = new Parser({ fields, delimiter: '|' });
    const csv = parser.parse(data);

    return {
        csv,
        filename: `processed_product_images_${requestId}.csv`
    };
};

module.exports = {
    saveProducts,
    processProducts,
    generateCsv,
};
