/* global describe it before after */
var server = require('../index');
var http = require('http');
var request = require('request');
var assert = require('chai').assert;
var expect = require('chai').expect;
var apiKey = process.env.UA_API_KEY;

describe('server', function () {
  before(function () {
    server.listen(8088);
  });

  after(function () {
    server.shutdown();
  });
});

describe('testing server', function () {
  it('should return 200', function (done) {
    http.get('http://localhost:8088', function (res) {
      assert.equal(200, res.statusCode);
      done();
    });
  });

  it('should return a valid date', function (done) {
    http.get('http://localhost:8088/', function (res) {
      var data = '';

      res.on('data', function (chunk) {
        data += chunk;
      });

      res.on('end', function () {
        var content = JSON.parse(data);
        assert.notEqual((new Date(content.date)).toString(), 'Invalid Date');
        done();
      });
    });
  });
});

describe('user API', function () {
  it('can add a user', function (done) {
    var requestData = {
      url: 'http://localhost:8088/user/add',
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
    http.get('http://localhost:8088/user/get/all', function (res) {
      var data = '';

      res.on('data', function (chunk) {
        data += chunk;
      });

      res.on('end', function () {
        var testUserItem = null;
        JSON.parse(data).forEach(function (item) {
          if (item.name === 'TestUser') {
            testUserItem = item;
          }
        });
        expect(testUserItem).to.have.property('name', 'TestUser');
        done();
      });
    });
  });
});
