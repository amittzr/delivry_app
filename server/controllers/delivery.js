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
    
    // CREATE a new package for a company
    create_package: function (req, res) {
        readFile(data => {
            const companyId = req.params.id;
            const packageData = req.body;
            
            // Initialize company array if it doesn't exist
            if (!data[companyId]) {
                data[companyId] = [];
            }
            
            // Add the new package
            data[companyId].push(packageData);
            
            writeFile(JSON.stringify(data, null, 2), () => {
                res.status(200).send(`New package added to company ${companyId}`);
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
    }
};