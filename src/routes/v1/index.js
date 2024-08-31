const express = require('express');
const imagesRoute = require('./productCsv.route');
const config = require('../../config/config');

const router = express.Router();

const defaultRoutes = [
  {
    path: '/product-image-csv',
    route: imagesRoute,
  }
];


defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});


module.exports = router;
