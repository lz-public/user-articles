/*
 * Articles module
 * Everything that can be done with articles
 */

const articles = require('express').Router();

const articleHandlers = {
  addArticle: (req, res, next) => {
    if (!articleHelpers.addArticleValidation(req.body)) {
      res.status(400);
      res.send('Bad request');
      return;
    }
    var result = { status: 'success' };
    Object.assign(result, req.body);
    res.send(JSON.stringify(result));
  },
  updateArticle: (req, res, next) => {
    if (!articleHelpers.updateArticleValidation(req.body)) {
      res.status(400);
      res.send('Bad request');
      return;
    }
    var result = { status: 'success' };
    Object.assign(result, req.body);
    res.send(JSON.stringify(result));
  },
  deleteArticle: (req, res, next) => {
    if (!articleHelpers.deleteArticleValidation(req.params)) {
      res.status(400);
      res.send('Bad request');
      return;
    }
    var result = { status: 'success' };
    Object.assign(result, req.params);
    res.send(JSON.stringify(result));
  },
  getArticlesByTag: (req, res, next) => {
    // if no tags available, list them all
    if (!req.params.tags || req.params.tags === '') {
      res.send(JSON.stringify({ status: 'success', content: 'a list of all articles' }));
      return;
    }

    var tags = articleHelpers.getArticleTagParser(req.params.tags);

    var result = { status: 'success' };
    Object.assign(result, tags);
    res.send(JSON.stringify(result));
  }
};

const articleHelpers = {
  addArticleValidation: (d) => d.title && d.title.length > 3 && d.text && d.tags && d.userId,
  updateArticleValidation: (d) => d.title && d.title.length > 3 && d.text && d.tags && d.articleId && d.userId,
  deleteArticleValidation: (d) => d.articleId,
  getArticleTagParser: (d) => d.split(',')
};

articles.post('/add', articleHandlers.addArticle);
articles.put('/update', articleHandlers.updateArticle);
articles.delete('/delete/:articleId', articleHandlers.deleteArticle);
articles.get('/get/:tags', articleHandlers.getArticlesByTag);

module.exports = articles;
