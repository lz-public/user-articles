/*
 * Articles module
 * Everything that can be done with articles
 */

const articles = require('express').Router();
const ObjectID = require('mongodb').ObjectID;
const environment = process.env.UA_ENVIRONMENT || 'default';
const config = require('../../config-' + environment + '.json');

var userCache = [];
var userCacheExpirationTime = 0;

const articleHandlers = {
  addArticle: (req, res, next) => {
    if (!articleHelpers.addArticleValidation(req.body)) {
      res.status(400);
      res.send('Bad request');
      return;
    }

    var newArticle = new Article(
      req.body.userId,
      req.body.title,
      req.body.text,
      req.body.tags
    );

    articles.db.collection('articles').insertOne(newArticle, (err) => {
      if (err) {
        next(err);
        return;
      }
      var result = { status: 'success' };
      Object.assign(result, newArticle);
      res.send(JSON.stringify(result));
    });
  },
  updateArticle: (req, res, next) => {
    if (!articleHelpers.updateArticleValidation(req.body)) {
      res.status(400);
      res.send('Bad request');
      return;
    }

    articles.db.collection('articles').findOne({ _id: new ObjectID(req.body.articleId), userId: req.body.userId }, (err, articleData) => {
      if (err) {
        next(err);
        return;
      }
      if (!articleData || articleData.length === 0) {
        res.send(JSON.stringify({ 'status': 'error', 'errorDescription': 'Unable to find article with id ' + req.body.articleId + ' and belongs to userId ' + req.body.userId }));
        return;
      }

      var renewedArticle = new Article(
        req.body.userId,
        req.body.title,
        req.body.text,
        req.body.tags
      );

      articles.db.collection('articles').replaceOne({ _id: new ObjectID(req.body.articleId) }, renewedArticle, (err) => {
        if (err) {
          next(err);
          return;
        }
        var result = { status: 'success' };
        Object.assign(result, renewedArticle);
        res.send(JSON.stringify(result));
      });
    });
  },
  deleteArticle: (req, res, next) => {
    if (!articleHelpers.deleteArticleValidation(req.params)) {
      res.status(400);
      res.send('Bad request');
      return;
    }
    articles.db.collection('articles').remove({ _id: new ObjectID(req.params.articleId) }, (err, removalResult) => {
      if (err) {
        next(err);
        return;
      }
      var result = { status: 'success' };
      Object.assign(result, removalResult.result);
      res.send(result);
    });
  },
  getArticlesByTag: (req, res, next) => {
    // if no tags available, list them all
    if (!req.params.tags || req.params.tags === '') {
      res.send(JSON.stringify({ status: 'success', content: 'a list of all articles' }));
      return;
    }

    var tags = articleHelpers.articleTagParser(req.params.tags);
    var searchCondition = {};

    // Tag sorting is a good idea, when adding query caching, since the result of requesting "tag1,tag2" is
    // equal than the result of "tag2,tag1". Responses are similar, but querys are different. Sorting the tags
    // causes all similar request to be responded with the same cache entry.
    // tags.sort();

    // build a complete search condition
    // the shortcut { tags: tag } can't find documents if arrays don't match exactly
    if (tags.length > 1) {
      searchCondition.tags = { '$in': tags };
    } else {
      searchCondition.tags = tags[0];
    }

    articles.db.collection('articles')
      .find(searchCondition)
      .sort({ '_id': -1 }) // newer articles first.
      .limit(config.articlesMaxResultsPerPage) // @todo: pagination
      .toArray((err, filteredArticles) => {
        if (err) {
          next(err);
          return;
        }

        // expand user list: provide names and avatars instead of userId. The approach assumes
        // we want to do minimal processing in the app. Thus, each article entry will have the
        // users info embeded. An optimal case would be to send the user list separately and let
        // the app mix the results.

        // lookup in cache first using only plain arrays with ids, for maximum performance
        var unknownUsersList = [];
        var knownUsersList = [];

        // invalidate the cache if its expiration value is lower than the current timestamp
        if (userCacheExpirationTime < new Date().getTime()) {
          userCache = [];
          userCacheExpirationTime = 0;
        }
        userCache.forEach((user) => { knownUsersList.push(user._id); });
        filteredArticles.forEach((article) => {
          if (knownUsersList.indexOf(article.userId) < 0) {
            unknownUsersList.push(new ObjectID(article.userId));
          }
        });

        // search user data in mongo for id we don't have in cache
        articles.db.collection('users')
          .find({ _id: { $in: unknownUsersList } })
          .toArray((err, usersToBeAddedInCache) => {
            if (err) {
              next(err);
              return;
            }
            usersToBeAddedInCache.forEach((user) => {
              // @todo: we could add an expiration time or ttl for this cache item
              user._id = user._id.toString(); // mongodb's ObjectId -> string
              userCache.push(user);
            });

            // update our filteredArticles array
            for (let i in filteredArticles) {
              // lookup the user name and avatar in the users cache
              for (let j in userCache) {
                if (userCache[j]._id === filteredArticles[i].userId) {
                  filteredArticles[i].userName = userCache[j].name;
                  filteredArticles[i].userAvatar = userCache[j].avatar;
                  break;
                }
              }
            }

            // make the response more app-friendly and add some stat info, just for curiosity
            let response = {
              searchCriteria: tags,
              articles: filteredArticles,
              stats: {
                results: filteredArticles.length,
                cacheHits: knownUsersList.length,
                cacheMiss: unknownUsersList.length
              }
            };

            // first, send the filteredArticles with the user data expanded
            res.send(response);

            // second, update the userCache expiration time if necessary
            if (userCacheExpirationTime === 0) {
              userCacheExpirationTime = new Date().getTime() + config.articlesMaxUserCacheExpiration;
            }
          });
      });
  }
};

const articleHelpers = {
  addArticleValidation: (d) => d.title && d.title.length > 0 && d.text && d.tags && d.userId,
  updateArticleValidation: (d) => d.title && d.title.length > 0 && d.text && d.tags && d.tags.length > 0 && d.articleId && d.userId && ObjectID.isValid(d.userId) && ObjectID.isValid(d.articleId),
  deleteArticleValidation: (d) => d.articleId,
  articleTagParser: (d) => d.split(',')
};

class Article {
  constructor (userId, title, text, tags) {
    this.userId = userId;
    this.title = title;
    this.text = text;
    this.tags = tags;
  }
}

articles.post('/add', articleHandlers.addArticle);
articles.put('/update', articleHandlers.updateArticle);
articles.delete('/delete/:articleId', articleHandlers.deleteArticle);
articles.get('/get/:tags', articleHandlers.getArticlesByTag);

module.exports = articles;
