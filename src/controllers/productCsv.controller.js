const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { productCsvService } = require('../services');
const ApiError = require('../utils/ApiError');

const uploadCsv = catchAsync(async (req, res) => {
    if (!req.files || !req.files.csv_file) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'No file uploaded');
    }
    const requestId = await productCsvService.uploadCsv(req.files.csv_file);
    res.status(httpStatus.CREATED).send({ requestId });
});


const getStatus = catchAsync(async (req, res) => {
    const status = await productCsvService.getStatus(req.query.requestId);
    res.send({ status });
});

const download = catchAsync(async (req, res) => {
    console.log(JSON.stringify(req.query));
    const { csv, filename } = await productCsvService.download(req.query.requestId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(csv);
});

module.exports = {
    uploadCsv,
    getStatus,
    download,
};