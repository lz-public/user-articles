/* global describe it before after */
const MongoClient = require('mongodb').MongoClient;
const server = require('../index');
const request = require('request');
const assert = require('chai').assert;
const expect = require('chai').expect;
const apiKey = process.env.UA_API_KEY;
const environment = process.env.UA_ENVIRONMENT || 'test';
const config = require('../config-' + environment + '.json');
const baseUri = config.serverProtocol + '://' + config.serverHost + ':' + config.serverPort;

var testUser;
var testArticle;

describe('server', function () {
  before(function () {
    // nothing useful - just to make our linter happy
    server.something = null;
  });

  it(`${environment} db cleanup`, function (done) {
    MongoClient.connect(config.mongodbConnStr, (err, client) => {
      if (err) {
        assert.equal(null, err);
        done();
        return;
      }
      // set the global db
      client.db(config.mongoDbDatabaseName).dropDatabase(function (err, result) {
        assert.equal(null, err);
        done();
      });
    });
  });

  after(function () {
    server.something = null;
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
      testUser = testUserItem;
      testUser._id = testUserItem._id.toString();
      done();
    });
  });
});

describe.skip('articles API', function () {
  it('can add an article', function (done) {
    var requestData = {
      url: baseUri + '/article/add',
      headers: { 'Authorization': 'BEARER ' + apiKey, 'Content-Type': 'application/json' },
      body: '{"title": "TestArticle#1", "text": "Sed ut perspiciatis unde omnis iste natus", "userId": ' + testUser._id + ', "tags": ["tag1", "tag2"] }'
    };
    request.post(requestData, function (err, res, body) {
      if (err) done(err);
      var resultvars = JSON.parse(res.body);
      expect(resultvars).to.have.property('title', 'TestArticle#1');
      expect(resultvars).to.have.property('text', 'Sed ut perspiciatis unde omnis iste natus');
      expect(resultvars).to.have.property('userId', testUser._id);
      expect(resultvars).to.have.property('tags');
      testArticle = resultvars;
      testArticle._id = testArticle._id.toString();
      done();
    });
  });

  it('can get the complete the article', function (done) {
    var requestData = {
      url: baseUri + '/article/get/tag1',
      headers: { 'Authorization': 'BEARER ' + apiKey, 'Content-Type': 'application/json' },
      body: '{}'
    };
    request.get(requestData, function (err, res, body) {
      if (err) done(err);
      var articleList = JSON.parse(res.body);
      expect(articleList).to.have.property('searchCriteria', ['tag1']);
      expect(articleList.articles[0]).to.have.property('_id', testArticle._id);
      expect(articleList.articles[0]).to.have.property('userId', testUser._id);
      expect(articleList.articles[0]).to.have.property('title', 'TestArticle#1');
      expect(articleList.stats).to.have.property('results', '1');
      expect(articleList.stats).to.have.property('cacheHits', '0');
      expect(articleList.stats).to.have.property('cacheMiss', '1');
      done();
    });
  });

  it('can update the article', function (done) {
    var requestData = {
      url: baseUri + '/article/update',
      headers: { 'Authorization': 'BEARER ' + apiKey, 'Content-Type': 'application/json' },
      body: '{"articleId": "' + testArticle._id + '", title": "TestArticleEdited", "text": "Ut enim ad minima veniam", "userId": ' + testUser._id + ', "tags": ["aaa", "bbb"] }'
    };
    request.post(requestData, function (err, res, body) {
      if (err) done(err);
      var resultvars = JSON.parse(res.body);
      expect(resultvars).to.have.property('title', 'TestArticleEdited');
      expect(resultvars).to.have.property('text', 'Ut enim ad minima veniam');
      expect(resultvars).to.have.property('userId', testUser._id);
      expect(resultvars).to.have.property('tags');
      testArticle = resultvars;
      testArticle._id = testArticle._id.toString();
      done();
    });
  });

  it('can see changes in the article', function (done) {
    var requestData = {
      url: baseUri + '/article/get/bbb,aaa',
      headers: { 'Authorization': 'BEARER ' + apiKey, 'Content-Type': 'application/json' },
      body: '{}'
    };
    request.get(requestData, function (err, res, body) {
      if (err) done(err);
      var articleList = JSON.parse(res.body);
      expect(articleList.articles[0]).to.have.property('_id', testArticle._id);
      expect(articleList.articles[0]).to.have.property('userId', testUser._id);
      expect(articleList.articles[0]).to.have.property('title', 'TestArticleEdited');
      expect(articleList.articles[0]).to.have.property('text', 'Ut enim ad minima veniam');
      expect(articleList.stats).to.have.property('results', '2');
      expect(articleList.stats).to.have.property('cacheHits', '1');
      expect(articleList.stats).to.have.property('cacheMiss', '0');
      done();
    });
  });
});
