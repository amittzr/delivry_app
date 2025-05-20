const express = require('express'),
    bodyParser = require('body-parser'),
    path = require('path'),
    fs = require('fs'),
    cors = require('cors'),
    routers = require('./server/routes/routes.js');
const port = 3001;
const companyService = require('./server/routes/companyService');

const app=express();

// app.use('/', express.static(path.join(__dirname, 'client/html/index.html')));
app.use('/main', express.static(path.join(__dirname, 'client/html/index.html')));
app.use('/list_users', express.static(path.join(__dirname, 'client/html/index.html')));
app.use('/add_user', express.static(path.join(__dirname, 'client/html/add_user_form.html')));

app.use('/js', express.static(path.join(__dirname, 'client/js')));

app.get('/',(req,res) => {fs.readFile('client/html/home_test.html',  (err, html) => {
    if (err) {
        throw err; 
    }       
    
    res.writeHeader(200, {"Content-Type": "text/html"});  
    res.write(html);  
    res.end();  
    })
});


app.get('/company/:id', async (req, res) => {
    res.sendFile(path.join(__dirname, 'client/html/company.html'));
});


app.use('/css', express.static(path.join(__dirname, 'client/css')));

//restfull 
//app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', routers);

const server = app.listen(port, () => {
    console.log('listening on port %s...', server.address().port);
});