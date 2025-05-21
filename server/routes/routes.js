const express = require('express');
const router = express.Router();
const delivery = require('../controllers/delivery');
const geocode = require('../controllers/geocode');

// Original routes
router.get('/companies', delivery.read_all_companies);
router.get('/company/:id/packages', delivery.read_company_packages);
router.post('/company/:id/package', delivery.create_package);
router.put('/company/:companyId/package/:packageId', delivery.update_package);
router.delete('/company/:companyId/package/:packageId', delivery.delete_package);
router.put('/company/:companyId/package/:packageId/path', delivery.add_location_to_path);

// Routes for geocoding
router.post('/geocode', geocode.geocodeAddress);
router.post('/geocode-and-create/:companyId', geocode.geocodeAndCreatePackage);

// Routes for Postman compatibility - map to the same controller functions
router.get('/buisness', delivery.read_all_companies); // Same as /companies
router.get('/buisness/:id/packages', delivery.read_company_packages); // Same as company/:id/packages
router.post('/buisness/:id/packages', delivery.create_package); // Same as company/:id/package
router.put('/buisness/:companyId/packages/:packageId', delivery.update_package); // Same as company/:companyId/package/:packageId
router.delete('/buisness/:companyId/packages/:packageId', delivery.delete_package); // Same as company/:companyId/package/:packageId
router.put('/buisness/:companyId/packages/:packageId/path', delivery.add_location_to_path); // Path endpoint for Postman

module.exports = router;