/* global describe it before after */
var server = require('../index');
var assert = require('assert');
var http = require('http');

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
  it('can get data from user #1', function (done) {
    http.get('http://localhost:8088/user/get/1', function (res) {
      var data = '';

      res.on('data', function (chunk) {
        data += chunk;
      });

      res.on('end', function () {
        assert.equal('{"status":"success","userId":"1"}', data);
        done();
      });
    });
  });
});
