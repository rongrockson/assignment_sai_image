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

const download2 = catchAsync(async (req, res) => {
    const { requestId } = req.query;

    try {
        const csvStream = await productCsvService.download2(requestId);

        // Set the headers to prompt a file download
        res.setHeader('Content-disposition', `attachment; filename=processed_product_images_${requestId}.csv`);
        res.setHeader('Content-type', 'text/csv');

        // Pipe the CSV stream to the response
        csvStream.pipe(res);
    } catch (error) {
        res.status(error.statusCode || 500).send(error.message);
    }
});

module.exports = {
    uploadCsv,
    getStatus,
    download,
    download2
};