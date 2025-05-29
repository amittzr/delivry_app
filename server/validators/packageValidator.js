// validators/packageValidator.js

// Helper: Validate incoming package data
function validatePackageData(data) {
    const errors = [];

    console.log('=== VALIDATION DEBUG START ===');
    console.log('Raw input data:', JSON.stringify(data, null, 2));

    const packageId = data.packageId || data.id;
    const prodId = data.prodId || data.prod_id;
    const customer = data.customer || {};
    const address = customer.address || {};

    const customerId = data.customerId || customer.id;
    const customerName = data.customerName || customer.name;
    const customerEmail = data.customerEmail || customer.email;

    const street = data.street || address.street;
    const streetNumber = data.streetNumber || address.number;
    const city = data.city || address.city;

    console.log('Extracted values:');
    console.log('- packageId:', packageId);
    console.log('- prodId:', prodId);
    console.log('- customerId:', customerId);
    console.log('- customerName:', customerName);
    console.log('- customerEmail:', customerEmail);
    console.log('- street:', street);
    console.log('- streetNumber:', streetNumber);
    console.log('- city:', city);

    // Validation checks with debug info
    if (!packageId || packageId.length < 4) {
        console.log('❌ Package ID validation failed:', packageId);
        errors.push('Invalid package ID (min 4 characters)');
    } else {
        console.log('✅ Package ID validation passed:', packageId);
    }

    if (!prodId || prodId.length < 4) {
        console.log('❌ Product ID validation failed:', prodId);
        errors.push('Invalid product ID (min 4 characters)');
    } else {
        console.log('✅ Product ID validation passed:', prodId);
    }

    if (!customerId) {
        console.log('❌ Customer ID validation failed:', customerId);
        errors.push('Customer ID is required');
    } else {
        console.log('✅ Customer ID validation passed:', customerId);
    }

    if (!customerName || customerName.length < 3) {
        console.log('❌ Customer name validation failed:', customerName);
        errors.push('Invalid customer name (min 3 characters)');
    } else {
        console.log('✅ Customer name validation passed:', customerName);
    }

    if (!customerEmail) {
        console.log('❌ Customer email validation failed: email is required');
        errors.push('Customer email is required');
    } else {
        console.log('✅ Customer email validation passed:', customerEmail);
    }

    // Check for coordinates and validate Israel boundaries (optional check)
    const lat = data.lat || (address && address.lat);
    const lon = data.lon || (address && address.lon);
    
    console.log('Coordinates check (optional):');
    console.log('- lat:', lat);
    console.log('- lon:', lon);

    // Only validate Israel boundaries IF coordinates are provided
    if (lat !== undefined && lon !== undefined && lat !== null && lon !== null) {
        const latNum = parseFloat(lat);
        const lonNum = parseFloat(lon);
        
        console.log('- parsed lat:', latNum);
        console.log('- parsed lon:', lonNum);

        // Check if coordinates are valid numbers
        if (isNaN(latNum) || isNaN(lonNum)) {
            console.log('❌ Coordinates validation failed: Invalid numbers');
            errors.push('Invalid coordinates: lat and lon must be valid numbers');
        } else {
            // Check if coordinates are within Israel's approximate boundaries
            // Israel's approximate boundaries: lat: 29.5-33.5, lon: 34.2-35.9
            if (latNum < 29.5 || latNum > 33.5 || lonNum < 34.2 || lonNum > 35.9) {
                console.log('❌ Israel boundaries validation failed:', { lat: latNum, lon: lonNum });
                errors.push('Address coordinates appear to be outside Israel boundaries');
            } else {
                console.log('✅ Israel boundaries validation passed:', { lat: latNum, lon: lonNum });
            }
        }
    } else {
        console.log('ℹ️ No coordinates provided - skipping Israel boundaries check (this is normal for non-geocoded packages)');
    }
    
    // Address validation (commented out as in your original code)
    if (!street || !/^[a-zA-Z\s.-]+$/.test(street)) errors.push('Street name must contain only letters, spaces, dot, or dash');
    if (!streetNumber || !/^\d+$/.test(streetNumber.toString())) errors.push('Street number must be digits only');
    if (!city || !/^[a-zA-Z\s.-]+$/.test(city)) errors.push('City must contain only letters and spaces');

    console.log('Total validation errors:', errors.length);
    if (errors.length > 0) {
        console.log('Validation errors:', errors);
    }
    console.log('=== VALIDATION DEBUG END ===');

    return errors;
}

// Middleware function for package validation
exports.validatePackageData = (req, res, next) => {
    try {
        console.log('📦 Package validation middleware called');
        console.log('Request method:', req.method);
        console.log('Request URL:', req.url);
        console.log('Request params:', req.params);
        
        const packageData = req.body;
        console.log('Request body type:', typeof packageData);
        console.log('Request body keys:', Object.keys(packageData || {}));
        
        // Run server-side validation
        const errors = validatePackageData(packageData);
        
        if (errors.length > 0) {
            console.log('🚫 Validation failed, returning 400 error');
            return res.status(400).json({ 
                error: 'Validation failed', 
                details: errors 
            });
        }
        
        console.log('✅ Validation passed, continuing to next middleware/controller');
        // If validation passes, continue to the next middleware/controller
        next();
        
    } catch (error) {
        console.error('💥 Validation middleware error:', error.message);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ error: 'Internal validation error' });
    }
};

// Export the validation function for direct use if needed
exports.validatePackageDataDirect = validatePackageData;