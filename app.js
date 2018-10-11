const dotenv = require('dotenv').config();
var express = require("express");
var https = require("https");
var bodyParser = require("body-parser");
const crypto = require('crypto');
const cookie = require('cookie');
const nonce = require('nonce')();
const querystring = require('querystring');
const request = require('request-promise');
var app = express();

var port = process.env.PORT || 4800;

// set the view engine to ejs
app.set('view engine', 'ejs');
// make express look in the public directory for assets (css/js/img)
app.use(express.static(__dirname + '/public'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

var routes = require("./routes/routes.js")(app);

var server = app.listen(port, () => {
    console.log("Serve listening on port:" + port);
});