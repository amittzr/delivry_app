// routes.js
const express = require('express');
const router = express.Router();
const delivery = require('../controllers/delivery');
const geocode = require('../controllers/geocode');
const { validatePackageData, validatePackageDataForUpdate } = require('../validators/packageValidator');

// Original routes
router.get('/companies', delivery.read_all_companies);
router.get('/company/:id/packages', delivery.read_company_packages);
router.post('/company/:id/package', validatePackageData, delivery.create_package);
router.put('/company/:companyId/package/:packageId', validatePackageDataForUpdate, delivery.update_package);
router.put('/company/:companyId/package/:packageId/path', delivery.add_location_to_path);
// router.delete('/company/:companyId/package/:packageId', delivery.delete_package);

// Routes for geocoding
router.post('/geocode', geocode.geocodeAddress);
router.post('/geocode-and-create/:companyId', validatePackageData, geocode.geocodeAndCreatePackage);

// API route to check if package ID exists (for client-side validation)
router.get('/api/check-package-id/:companyId/:packageId', async (req, res) => {
    try {
        const { companyId, packageId } = req.params;
        const { validatePackageDataDirect } = require('../validators/packageValidator');
        
        console.log(`📋 Checking package ID "${packageId}" for company ${companyId}`);
        
        // Create a minimal data object just for the duplicate check
        const testData = { packageId: packageId };
        
        // Run validation to check for duplicates
        const errors = await validatePackageDataDirect(testData, companyId, false);
        
        // Check if any error mentions package ID already exists
        const packageIdExists = errors.some(error => 
            error.includes('already exists') || error.includes('duplicate')
        );
        
        res.json({ 
            exists: packageIdExists,
            message: packageIdExists ? `Package ID "${packageId}" is already in use.` : 'Package ID is available.'
        });
        
    } catch (error) {
        console.error('Error checking package ID:', error);
        res.status(500).json({ 
            error: 'Unable to check package ID',
            exists: false // Default to false so form isn't blocked
        });
    }
});

// Routes for Postman compatibility
router.get('/buisness', delivery.read_all_companies);
router.get('/buisness/:id/packages', delivery.read_company_packages);
router.post('/buisness/:id/packages', validatePackageData, delivery.create_package);
router.put('/buisness/:companyId/packages/:packageId', validatePackageDataForUpdate, delivery.update_package);

module.exports = router;