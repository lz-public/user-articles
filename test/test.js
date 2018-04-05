/* global describe it before after */
// const MongoClient = require('mongodb').MongoClient;
const server = require('../index');
const request = require('request');
const assert = require('chai').assert;
const expect = require('chai').expect;
const apiKey = process.env.UA_API_KEY;
const environment = process.env.UA_ENVIRONMENT || 'test';
const config = require('../config-' + environment + '.json');
const baseUri = config.serverProtocol + '://' + config.serverHost + ':' + config.serverPort;

describe('server', function () {
  before(function () {
    server.listen(config.serverPort);
  });

  after(function () {
    server.shutdown();
  });
});

describe('testing server', function () {
  it('should return 401 when API key is not correct', function (done) {
    var requestData = {
      url: baseUri,
      headers: { 'Authorization': 'BEARER wrongKey', 'Content-Type': 'application/json' }
    };
    request.get(requestData, function (err, res, body) {
      if (err) done(err);
      assert.equal(401, res.statusCode);
      done();
    });
  });

  it('should return 200 and the current date', function (done) {
    var requestData = {
      url: baseUri + '/',
      headers: { 'Authorization': 'BEARER ' + apiKey, 'Content-Type': 'application/json' },
      body: '{}'
    };
    request.get(requestData, function (err, res, body) {
      if (err) done(err);
      assert.equal(200, res.statusCode);
      var resultvars = JSON.parse(res.body);
      assert.notEqual((new Date(resultvars.date)).toString(), 'Invalid Date');
      done();
    });
  });
});

describe('user API', function () {
  it('can add a user', function (done) {
    var requestData = {
      url: baseUri + '/user/add',
      headers: { 'Authorization': 'BEARER ' + apiKey, 'Content-Type': 'application/json' },
      body: '{"name": "TestUser", "avatar": "https://testavatar.jpeg"}'
    };
    request.post(requestData, function (err, res, body) {
      if (err) done(err);
      var resultvars = JSON.parse(res.body);
      expect(resultvars).to.have.property('name', 'TestUser');
      expect(resultvars).to.have.property('avatar', 'https://testavatar.jpeg');
      done();
    });
  });

  it('can get the complete list of users', function (done) {
    var requestData = {
      url: baseUri + '/user/get/all',
      headers: { 'Authorization': 'BEARER ' + apiKey, 'Content-Type': 'application/json' },
      body: '{}'
    };
    request.get(requestData, function (err, res, body) {
      if (err) done(err);
      var testUserItem = null;
      JSON.parse(res.body).forEach(function (item) {
        if (item.name === 'TestUser') {
          testUserItem = item;
        }
      });
      expect(testUserItem).to.have.property('name', 'TestUser');
      expect(testUserItem).to.have.property('avatar', 'https://testavatar.jpeg');
      done();
    });
  });
});
