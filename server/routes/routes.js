const express = require('express');
const router = express.Router();
const delivery = require('../controllers/delivery');
const geocode = require('../controllers/geocode');

// Delivery routes
router.get('/companies', delivery.read_all_companies);
router.get('/company/:id/packages', delivery.read_company_packages);
router.post('/company/:id/package', delivery.create_package);
router.put('/company/:companyId/package/:packageId', delivery.update_package);
router.delete('/company/:companyId/package/:packageId', delivery.delete_package);

// Geocoding route
router.post('/geocode-and-create/:companyId', geocode.geocodeAndCreatePackage);
router.post('/geocode', geocode.geocodeAddress);  // New endpoint for address geocoding

module.exports = router;