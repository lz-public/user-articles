/*
 * UserArticles Service
 */

var server;
var db;

// Production HTTPS setup
// const https = require('https');
// const fs = require('fs');
// const privateKey  = fs.readFileSync('sslcert/privkey.pem', 'utf8');
// const certificate = fs.readFileSync('sslcert/cert.pem', 'utf8');
// const credentials = {key: privateKey, cert: certificate};

// Development HTTP setup
const http = require('http');

// node modules
const MongoClient = require('mongodb').MongoClient;
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.json());

// app modules
const environment = process.env.UA_ENVIRONMENT || 'default';
const config = require('./config-' + environment + '.json');
const userManager = require('./app_modules/users/index.js');
const articleManager = require('./app_modules/articles/index.js');

// init stats
var stats = {};

// authorization middleware
app.use(function (req, res, next) {
  if (
    req.headers &&
    req.headers['authorization'] &&
    req.headers['authorization'].split(' ')[1] === process.env.UA_API_KEY) {
    next();
    statsCounter('requests');
    return;
  }
  res.status(401);
  res.send('Not authorized');
  var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  console.log('unauthorized access', ip);
  statsCounter('authFails');
});

// health-check related routes
app.get('/', function (req, res) {
  res.send({ date: new Date() });
});
app.get('/stats', function (req, res) {
  res.send(stats);
});

// app-modules related routes
app.use('/user/', userManager);
app.use('/article/', articleManager);

// database and server startup
(async function () {
  // Connection URL
  const url = config.mongodbConnStr;
  // Database Name
  const dbName = config.mongoDbDatabaseName;
  let client;

  try {
    // Use connect method to connect to the Server
    client = await MongoClient.connect(url);

    // set the global db
    db = client.db(dbName);

    // provide the db connection to plugins
    userManager.db = db;
    articleManager.db = db;

    // server start

    // server = https.createServer(credentials, app);
    // server.listen(443);
    server = http.createServer(app);
    server.listen(config.serverPort);
    console.log('Starting UserArticles server (' + environment + ' environment) on HTTP:' + config.serverPort);
  } catch (err) {
    console.log(err.stack);
  }
})();

// a basic internal counter for
function statsCounter (resource) {
  var ts = getTodayStamp();
  if (!stats[ts]) {
    stats[ts] = {};
  }
  if (!stats[ts][resource]) {
    stats[ts][resource] = 0;
  }
  stats[ts][resource]++;
}

function getTodayStamp () {
  var d = new Date();
  return 'd' + d.getFullYear() + ((d.getMonth() + 1) < 10 ? '0' + (d.getMonth() + 1) : (d.getMonth() + 1)) + (d.getDate() < 10 ? '0' + d.getDate() : d.getDate());
}

// the admin pressed ctrl + c
process.on('SIGINT', () => {
  console.log('\nCaught interrupt signal. Server shutdown...');
  server.close();
  // do anything youneed here to shut down gracefully (log, db clean up, etc)
  setTimeout(() => {
    process.exit(0);
  }, 1000);
});
