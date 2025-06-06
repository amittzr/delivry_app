// geocode.js

const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

// Import your delivery.js file to reuse its helper functions
const deliveryController = require('./delivery');

// LocationIQ API key
const API_KEY = process.env.GEOCODING_API_KEY;

// Geocode an address and create a package
exports.geocodeAndCreatePackage = async function(req, res) {
    try {
        const companyId = req.params.companyId;
        const packageData = req.body;
        
        // Build the address string for geocoding
        const address = `${packageData.streetNumber} ${packageData.street}, ${packageData.city}, Israel`;
        
        // Call LocationIQ API to geocode the address
        const geocodingUrl = `https://eu1.locationiq.com/v1/search.php?key=${API_KEY}&q=${encodeURIComponent(address)}&format=json`;
        
        const response = await axios.get(geocodingUrl);
        
        if (!response.data || response.data.length === 0) {
            return res.status(400).json({ error: 'Could not geocode the provided address' });
        }
        
        // Get the first result
        const location = response.data[0];

        // Extract latitude and longitude
        const lat = parseFloat(location.lat);
        const lon = parseFloat(location.lon);

        // Check if lat and lon are valid numbers
        if (isNaN(lat) || isNaN(lon)) {
            console.log('Geocoding error: Invalid coordinates returned', location);
            return res.status(400).json({ error: 'Failed to geocode address: Invalid coordinates returned' });
        }

        // Check if coordinates are within Israel's approximate boundaries
        // Israel's approximate boundaries: lat: 29.5-33.5, lon: 34.2-35.9
        if (lat < 29.5 || lat > 33.5 || lon < 34.2 || lon > 35.9) {
            console.log('Geocoding error: Coordinates outside Israel', { lat, lon });
            return res.status(400).json({ error: 'Address appears to be outside Israel' });
        }
        
        // Create package data in the format expected by delivery.create_package (Postman format)
        const packageForDelivery = {
            id: packageData.packageId,
            prod_id: packageData.prodId,
            name: packageData.packageName,
            customer: {
                id: packageData.customerId,
                name: packageData.customerName,
                email: packageData.customerEmail,
                address: {
                    street: packageData.street,
                    number: packageData.streetNumber,
                    city: packageData.city,
                    lon: lon,
                    lat: lat
                }
            },
            start_date: packageData.startDate,
            eta: packageData.eta,
            status: packageData.status,
            path: [
                {
                    lat: lat,
                    lon: lon
                }
            ]
        };
        
        // Modify the request to use the delivery controller
        req.body = packageForDelivery;
        req.params.id = companyId;
        
        // Use the delivery controller to create the package
        deliveryController.create_package(req, res);
        
    } catch (error) {
        console.error('Geocoding error:', error.message);
        res.status(500).json({ error: 'Failed to geocode address or create package' });
    }
};

// New function - Geocode address only
exports.geocodeAddress = async function(req, res) {
    try {
        const { city, street, streetNumber } = req.body;
        
        // Validate inputs
        if (!city || !street || !streetNumber) {
            return res.status(400).json({ error: 'City, street, and street number are required' });
        }
        
        // Build the address string for geocoding
        const address = `${streetNumber} ${street}, ${city}, Israel`;
        
        // Call LocationIQ API to geocode the address
        const geocodingUrl = `https://eu1.locationiq.com/v1/search.php?key=${API_KEY}&q=${encodeURIComponent(address)}&format=json`;
        
        const response = await axios.get(geocodingUrl);
        
        if (!response.data || response.data.length === 0) {
            return res.status(400).json({ error: 'Could not geocode the provided address' });
        }
        
        // Get the first result
        const location = response.data[0];

        // Extract latitude and longitude
        const lat = parseFloat(location.lat);
        const lon = parseFloat(location.lon);

        // Check if lat and lon are valid numbers
        if (isNaN(lat) || isNaN(lon)) {
            console.log('Geocoding error: Invalid coordinates returned', location);
            return res.status(400).json({ error: 'Failed to geocode address: Invalid coordinates returned' });
        }

        // Check if coordinates are within Israel's approximate boundaries
        // Israel's approximate boundaries: lat: 29.5-33.5, lon: 34.2-35.9
        if (lat < 29.5 || lat > 33.5 || lon < 34.2 || lon > 35.9) {
            console.log('Geocoding error: Coordinates outside Israel', { lat, lon });
            return res.status(400).json({ error: 'Address appears to be outside Israel' });
        }
        
        // Return the geocoded coordinates
        res.status(200).json({
            lat: lat,
            lon: lon,
            address: {
                street: street,
                number: streetNumber,
                city: city
            }
        });
        
    } catch (error) {
        console.error('Geocoding error:', error.message);
        res.status(500).json({ error: 'Failed to geocode address' });
    }
};