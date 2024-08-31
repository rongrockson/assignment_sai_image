const express = require('express');
const imagesRoute = require('./images.route');

const router = express.Router();

const defaultRoutes = [
  {
    path: '/images',
    route: imagesRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
