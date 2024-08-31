const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const productCsvSchema = mongoose.Schema(
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
productCsvSchema.plugin(toJSON);
productCsvSchema.plugin(paginate);

const ProductCsv = mongoose.model('ProductCsv', productCsvSchema);

module.exports = ProductCsv;
