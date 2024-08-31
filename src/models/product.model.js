const mongoose = require('mongoose');
const validator = require('validator');

const productSchema = mongoose.Schema({
    requestId: {
        type: String,
        required: true,
        index: true,  // Reference to ProductCsv
    },
    serialNumber: {
        type: Number,
        required: true,
        validate(value) {
            if (value <= 0) {
                throw new Error('Serial number must be a positive integer');
            }
        },
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    inputUrls: [{
        type: String,
        required: true,
        validate(value) {
            if (!validator.isURL(value)) {
                throw new Error('Invalid URL for input image');
            }
        },
    }],
    outputUrls: [{
        type: String,
        validate(value) {
            if (value && !validator.isURL(value)) {
                throw new Error('Invalid URL for output image');
            }
        },
    }],
    processedAt: {
        type: Date,
    },
}, {
    timestamps: true,
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
