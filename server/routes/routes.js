// routes.js
const express = require('express');
const router = express.Router();
const delivery = require('../controllers/delivery');
const geocode = require('../controllers/geocode');
const { validatePackageData } = require('../validators/packageValidator');

// Original routes
router.get('/companies', delivery.read_all_companies);
router.get('/company/:id/packages', delivery.read_company_packages);
router.post('/company/:id/package', validatePackageData, delivery.create_package);
router.put('/company/:companyId/package/:packageId', delivery.update_package);
router.put('/company/:companyId/package/:packageId/path', delivery.add_location_to_path)
// router.delete('/company/:companyId/package/:packageId', delivery.delete_package);

// Routes for geocoding
router.post('/geocode', geocode.geocodeAddress);
router.post('/geocode-and-create/:companyId', validatePackageData, geocode.geocodeAndCreatePackage);

// Routes for Postman compatibility
router.get('/buisness', delivery.read_all_companies);
router.get('/buisness/:id/packages', delivery.read_company_packages);
router.post('/buisness/:id/packages', validatePackageData, delivery.create_package);
router.put('/buisness/:companyId/packages/:packageId', delivery.update_package);

module.exports = router;