const express = require('express');
const imagesRoute = require('./productCsv.route');

const router = express.Router();

const defaultRoutes = [
  {
    path: '/product-image-csv',
    route: imagesRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
