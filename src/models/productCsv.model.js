const mongoose = require('mongoose');
const validator = require('validator');
const { toJSON, paginate } = require('./plugins');

const productImageSchema = mongoose.Schema(
    {
        inputUrl: {
            type: String,
            required: true,
            trim: true,
            validate(value) {
                if (!validator.isURL(value)) {
                    throw new Error('Invalid URL for input image');
                }
            },
        },
        outputUrl: {
            type: String,
            trim: true,
            validate(value) {
                if (value && !validator.isURL(value)) {
                    throw new Error('Invalid URL for output image');
                }
            },
        },
        processedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

const productSchema = mongoose.Schema(
    {
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
        images: [productImageSchema],
    },
    {
        timestamps: true,
    }
);

const productCSVSchema = mongoose.Schema(
    {
        requestId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        status: {
            type: String,
            required: true,
            enum: ['pending', 'processing', 'completed', 'failed'],
            default: 'pending',
        },
        products: [productSchema],
        completedAt: {
            type: Date,
        },
        error: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
productCSVSchema.plugin(toJSON);
productCSVSchema.plugin(paginate);

const ProductCSV = mongoose.model('ProductCSV', productCSVSchema);

module.exports = ProductCSV;
