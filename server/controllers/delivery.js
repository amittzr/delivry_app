const fs = require('fs');

// variables
const dataPath = './server/data/delivery.json';

// helper methods
const readFile = (callback, returnJson = false, filePath = dataPath, encoding = 'utf8') => {
    fs.readFile(filePath, encoding, (err, data) => {
        if (err) {
            console.log(err);
        }
        if (!data) data = "{}";
        callback(returnJson ? JSON.parse(data) : data);
    });
};

const writeFile = (fileData, callback, filePath = dataPath, encoding = 'utf8') => {
    fs.writeFile(filePath, fileData, encoding, (err) => {
        if (err) {
            console.log(err);
        }
        callback();
    });
};

module.exports = {
    // READ all packages for a company
    read_company_packages: function (req, res) {
        const companyId = req.params.id;
        
        fs.readFile(dataPath, 'utf8', (err, data) => {
            if (err) {
                console.log(err);
                return res.sendStatus(500);
            }
            
            const jsonData = !data ? {} : JSON.parse(data);
            const companyPackages = jsonData[companyId] || [];
            
            res.json({ 
                companyId: companyId,
                packages: companyPackages 
            });
        });
    },
    
    // READ all companies with packages
    read_all_companies: function (req, res) {
        fs.readFile(dataPath, 'utf8', (err, data) => {
            if (err) {
                console.log(err);
                return res.sendStatus(500);
            }
            
            const jsonData = !data ? {} : JSON.parse(data);
            const companies = Object.keys(jsonData);
            
            res.json({ companies: companies });
        });
    },
    
    // CREATE a new package for a company - Updated to handle both formats
    create_package: function (req, res) {
        readFile(data => {
            const companyId = req.params.id;
            let packageData = req.body;
            let packageId = '';
            let formattedPackageData = {};
            
            console.log('Creating package:', {
                companyId: companyId,
                body: packageData
            });
            
            // Detect if this is the Postman format or the original format
            if (packageData.id) {
                // Postman format - direct package object with id field
                packageId = packageData.id;
                formattedPackageData = {
                    [packageId]: packageData
                };
                
                // Initialize path array if it doesn't exist
                if (!formattedPackageData[packageId].path) {
                    formattedPackageData[packageId].path = [];
                    
                    // Add customer address as first point in path if coordinates exist
                    if (packageData.customer && 
                        packageData.customer.address && 
                        packageData.customer.address.lat && 
                        packageData.customer.address.lon) {
                        
                        formattedPackageData[packageId].path.push({
                            lat: packageData.customer.address.lat,
                            lon: packageData.customer.address.lon
                        });
                    }
                }
            } else {
                // Original format - from geocodeAndCreatePackage
                packageId = packageData.packageId;
                
                // Format for your original structure
                formattedPackageData = {
                    [packageId]: {
                        id: packageId,
                        prod_id: packageData.prodId,
                        customer: {
                            id: packageData.customerId,
                            name: packageData.customerName,
                            email: packageData.customerEmail,
                            address: {
                                street: packageData.street,
                                number: packageData.streetNumber,
                                city: packageData.city,
                                lon: packageData.lon || null,
                                lat: packageData.lat || null
                            }
                        },
                        start_date: packageData.startDate,
                        eta: packageData.eta,
                        status: packageData.status,
                        path: []
                    }
                };
                
                // If we have coordinates, add them to the path
                if (packageData.lat && packageData.lon) {
                    formattedPackageData[packageId].path.push({
                        lat: packageData.lat,
                        lon: packageData.lon
                    });
                }
            }
            
            // Initialize company array if it doesn't exist
            if (!data[companyId]) {
                data[companyId] = [];
            }
            
            // Add the new package
            data[companyId].push(formattedPackageData);
            
            writeFile(JSON.stringify(data, null, 2), () => {
                // Return success with the package ID for Postman compatibility
                res.status(201).json({ 
                    message: `New package added to company ${companyId}`,
                    id: packageId 
                });
            });
        }, true);
    },
    
    // UPDATE a package
    update_package: function (req, res) {
        readFile(data => {
            const companyId = req.params.companyId;
            const packageId = req.params.packageId;
            const packageData = req.body;
            
            // Check if company exists
            if (!data[companyId]) {
                return res.status(404).send(`Company ${companyId} not found`);
            }
            
            // Find and update the package
            let packageFound = false;
            data[companyId] = data[companyId].map(pkg => {
                const pkgKey = Object.keys(pkg)[0];
                if (pkgKey === packageId) {
                    packageFound = true;
                    return { [packageId]: packageData };
                }
                return pkg;
            });
            
            if (!packageFound) {
                return res.status(404).send(`Package ${packageId} not found in company ${companyId}`);
            }
            
            writeFile(JSON.stringify(data, null, 2), () => {
                res.status(200).send(`Package ${packageId} updated for company ${companyId}`);
            });
        }, true);
    },
    
    // DELETE a package
    delete_package: function (req, res) {
        readFile(data => {
            const companyId = req.params.companyId;
            const packageId = req.params.packageId;
            
            // Check if company exists
            if (!data[companyId]) {
                return res.status(404).send(`Company ${companyId} not found`);
            }
            
            // Find and remove the package
            const initialLength = data[companyId].length;
            data[companyId] = data[companyId].filter(pkg => {
                const pkgKey = Object.keys(pkg)[0];
                return pkgKey !== packageId;
            });
            
            if (data[companyId].length === initialLength) {
                return res.status(404).send(`Package ${packageId} not found in company ${companyId}`);
            }
            
            writeFile(JSON.stringify(data, null, 2), () => {
                res.status(200).send(`Package ${packageId} removed from company ${companyId}`);
            });
        }, true);
    },
    
    // ADD a location to a package's path
    add_location_to_path: function (req, res) {
        readFile(data => {
            const companyId = req.params.companyId;
            const packageId = req.params.packageId;
            const locationData = req.body;
            
            console.log('Adding location to path:', {
                companyId: companyId,
                packageId: packageId,
                body: locationData
            });
            
            // Validate location data
            if (!locationData.lat || !locationData.lon) {
                return res.status(400).json({ error: 'Missing lat and lon coordinates' });
            }
            
            // Check if company exists
            if (!data[companyId]) {
                return res.status(404).json({ error: `Company ${companyId} not found` });
            }
            
            // Find the package
            let foundPackage = null;
            let packageIndex = -1;
            
            for (let i = 0; i < data[companyId].length; i++) {
                const pkg = data[companyId][i];
                if (pkg[packageId]) {
                    foundPackage = pkg;
                    packageIndex = i;
                    break;
                }
            }
            
            if (!foundPackage) {
                return res.status(404).json({ error: `Package ${packageId} not found` });
            }
            
            // Initialize path array if it doesn't exist
            if (!foundPackage[packageId].path) {
                foundPackage[packageId].path = [];
            }
            
            // Check if this location already exists in the path
            const newLocation = {
                lat: locationData.lat,
                lon: locationData.lon
            };
            
            const locationExists = foundPackage[packageId].path.some(point => 
                point.lat === newLocation.lat && point.lon === newLocation.lon
            );
            
            if (locationExists) {
                return res.status(400).json({ error: 'This location already exists in the path' });
            }
            
            // Add the new location to the path
            foundPackage[packageId].path.push(newLocation);
            
            writeFile(JSON.stringify(data, null, 2), () => {
                res.status(200).json({ 
                    message: `Location added to package ${packageId} path`,
                    path: foundPackage[packageId].path
                });
            });
        }, true);
    }
};