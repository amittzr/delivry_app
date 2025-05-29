// validators/packageValidator.js
const fs = require('fs');
const path = require('path');

// Helper: Check if package ID already exists
async function checkPackageIdExists(packageId, companyId = null) {
    try {
        console.log(`🔍 Checking if package ID "${packageId}" exists in company ${companyId || 'any'}`);
        
        const dataPath = path.join(process.cwd(), 'server', 'data', 'delivery.json');
        console.log('🗂️ Looking for file at:', dataPath);
        console.log('🗂️ Current working directory:', process.cwd());
        console.log('🗂️ __dirname:', __dirname);
        
        // Also try alternative paths in case the file is elsewhere
        const alternativePaths = [
            path.join(__dirname, '..', 'data', 'delivery.json'),
            path.join(__dirname, '..', '..', 'data', 'delivery.json'),
            path.join(process.cwd(), 'data', 'delivery.json'),
            './server/data/delivery.json',
            './data/delivery.json'
        ];
        
        let foundPath = null;
        
        // Check if the file exists at expected location
        if (fs.existsSync(dataPath)) {
            foundPath = dataPath;
            console.log('✅ Found delivery.json at expected path:', dataPath);
        } else {
            console.log('❌ delivery.json not found at expected path:', dataPath);
            
            // Try alternative paths
            for (const altPath of alternativePaths) {
                console.log('🔍 Trying alternative path:', altPath);
                if (fs.existsSync(altPath)) {
                    foundPath = altPath;
                    console.log('✅ Found delivery.json at alternative path:', altPath);
                    break;
                }
            }
        }
        
        if (!foundPath) {
            console.log('📄 delivery.json file does not exist at any checked location - no duplicates possible');
            console.log('📄 Checked paths:', [dataPath, ...alternativePaths]);
            return false;
        }
        
        // Read the JSON file
        const fileContent = fs.readFileSync(foundPath, 'utf8');
        console.log('📄 File content length:', fileContent.length);
        console.log('📄 First 200 characters:', fileContent.substring(0, 200));
        
        // Handle empty file
        if (!fileContent.trim()) {
            console.log('📄 delivery.json file is empty - no duplicates possible');
            return false;
        }
        
        const data = JSON.parse(fileContent);
        console.log('📊 Loaded delivery data structure:', typeof data);
        
        // Your JSON structure: { "companyId": [{ "packageId": { package_object } }] }
        console.log(`📈 Found ${Object.keys(data).length} companies in data`);
        
        // Search through all companies and their packages
        for (const [currentCompanyId, companyPackageArray] of Object.entries(data)) {
            console.log(`🏢 Checking company ${currentCompanyId}`);
            
            // If companyId is specified, only check that company
            if (companyId && currentCompanyId !== companyId.toString()) {
                console.log(`⏭️ Skipping company ${currentCompanyId} (not target company)`);
                continue;
            }
            
            // Each company has an array, usually with one object containing all packages
            if (!Array.isArray(companyPackageArray)) {
                console.log(`⚠️ Company ${currentCompanyId} data is not an array, skipping`);
                continue;
            }
            
            console.log(`📦 Company ${currentCompanyId} has ${companyPackageArray.length} package container(s)`);
            
            // Loop through the array (usually just one element)
            for (const packageContainer of companyPackageArray) {
                if (typeof packageContainer !== 'object' || packageContainer === null) {
                    continue;
                }
                
                // Now check each package ID in this container
                for (const [pkgId, packageData] of Object.entries(packageContainer)) {
                    console.log(`🔍 Found package ID: ${pkgId} in company ${currentCompanyId}`);
                    
                    if (pkgId === packageId) {
                        console.log(`❌ Found duplicate package ID "${packageId}" in company ${currentCompanyId}`);
                        return true;
                    }
                }
            }
        }
        
        console.log(`✅ Package ID "${packageId}" is unique`);
        return false;
        
    } catch (error) {
        console.error('💥 Error checking package ID existence:', error.message);
        console.error('File path attempted:', path.join(process.cwd(), 'data', 'delivery.json'));
        
        // If there's a JSON parsing error, log it but don't block validation
        if (error instanceof SyntaxError) {
            console.error('🚨 JSON parsing error - file may be corrupted');
        }
        
        throw error;
    }
}

// Helper: Validate incoming package data
async function validatePackageData(data, companyId = null, isUpdate = false, currentPackageId = null) {
    const errors = [];

    console.log('=== VALIDATION DEBUG START ===');
    console.log('Raw input data:', JSON.stringify(data, null, 2));
    console.log('Company ID:', companyId);
    console.log('Is Update:', isUpdate);
    console.log('Current Package ID:', currentPackageId);

    const packageId = data.packageId || data.id || data.PACK_ID;
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
        console.log('✅ Package ID format validation passed:', packageId);
        
        // Check for duplicate package ID (only if not updating the same package)
        if (!isUpdate || (isUpdate && packageId !== currentPackageId)) {
            try {
                const packageExists = await checkPackageIdExists(packageId, companyId);
                if (packageExists) {
                    console.log('❌ Package ID duplicate validation failed:', packageId);
                    errors.push(`Package ID "${packageId}" already exists. Please use a unique package ID.`);
                } else {
                    console.log('✅ Package ID uniqueness validation passed:', packageId);
                }
            } catch (error) {
                console.error('Error during duplicate check:', error);
                errors.push('Unable to verify package ID uniqueness. Please try again.');
            }
        } else {
            console.log('ℹ️ Skipping duplicate check - updating same package ID');
        }
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
    
    // Address validation
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

// Middleware function for package validation (CREATE)
exports.validatePackageData = async (req, res, next) => {
    try {
        console.log('📦 Package validation middleware called (CREATE)');
        console.log('Request method:', req.method);
        console.log('Request URL:', req.url);
        console.log('Request params:', req.params);
        
        const packageData = req.body;
        const companyId = req.params.id || req.params.companyId;
        
        console.log('Request body type:', typeof packageData);
        console.log('Request body keys:', Object.keys(packageData || {}));
        
        // Run server-side validation (isUpdate = false for new packages)
        const errors = await validatePackageData(packageData, companyId, false);
        
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

// Middleware function for package validation (UPDATE)
exports.validatePackageDataForUpdate = async (req, res, next) => {
    try {
        console.log('📦 Package validation middleware called (UPDATE)');
        console.log('Request method:', req.method);
        console.log('Request URL:', req.url);
        console.log('Request params:', req.params);
        
        const packageData = req.body;
        const companyId = req.params.companyId;
        const currentPackageId = req.params.packageId;
        
        console.log('Request body type:', typeof packageData);
        console.log('Request body keys:', Object.keys(packageData || {}));
        
        // Run server-side validation (isUpdate = true for updates)
        const errors = await validatePackageData(packageData, companyId, true, currentPackageId);
        
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