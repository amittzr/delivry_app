const express = require('express'),
    bodyParser = require('body-parser'),
    path = require('path'),
    fs = require('fs'),
    cors = require('cors'),
    routers = require('./server/routes/routes.js');
const port = 3001;
const app = express();

// Serve static files
app.use(express.static(path.join(__dirname, 'client')));

// Routes for main pages
app.get('/list', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/html/list.html'));
});

app.get('/list/:companyId', (req, res) => {
    // Send the company packages page
    res.sendFile(path.join(__dirname, 'client/html/company_packages.html'));
});

app.get('/add_package/:companyId', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/html/add_package.html'));
});

app.get('/map-popup.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/html/map-popup.html'));
});

// Configure middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/', routers);

// Start the server
const server = app.listen(port, () => {
    console.log('listening on port %s...', server.address().port);
});