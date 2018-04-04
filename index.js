/*
 * UserArticles Service
 */

var server;

// Production HTTPS setup
// const https = require('https');
// const privateKey  = fs.readFileSync('sslcert/privkey.pem', 'utf8');
// const certificate = fs.readFileSync('sslcert/cert.pem', 'utf8');
// const credentials = {key: privateKey, cert: certificate};

// Development mode
const http = require('http');

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.json());

// App-specific modules
const userManager = require('./app_modules/users/index.js');
const articleManager = require('./app_modules/articles/index.js');

// init stats
var stats = {};

// routes
app.use(function (req, res, next) {
  if (req.headers && req.headers['x-app-auth'] !== 'appAccessKey') {
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

app.get('/', function (req, res) {
  res.send({ date: new Date() });
});

app.get('/stats', function (req, res) {
  res.send(stats);
});

app.use('/user/', userManager);
app.use('/article/', articleManager);

// server start

// server = https.createServer(credentials, app);
// server.listen(443);
server = http.createServer(app);
server.listen(8088);
console.log('Starting developmment mode on HTTP:8088');

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

/*
function shutdown () {
  process.stdout.write('Server shutting down...\n');
  server.close();
  process.exit(0);
}
*/
