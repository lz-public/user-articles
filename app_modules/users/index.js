/*
 * Users module
 * Everything related to user actions
 */

const users = require('express').Router();

const usersHandlers = {
  addUser: (req, res, next) => {
    if (!usersHelpers.addUserValidation(req.body)) {
      res.status(400);
      res.send(req.body);
      return;
    }
    var result = { status: 'success' };
    Object.assign(result, req.body);
    res.send(JSON.stringify(result));
  },
  getUser: (req, res, next) => {
    if (!usersHelpers.getUserValidation(req.params)) {
      res.status(400);
      res.send('Bad request');
      return;
    }
    var result = { status: 'success' };
    Object.assign(result, req.params);
    res.send(JSON.stringify(result));
  }
};

const usersHelpers = {
  addUserValidation: (d) => d.name && d.name.length > 3 && d.avatar && (d.avatar.indexOf('https://') !== -1),
  getUserValidation: (d) => d.userId && d.userId > 0
};

users.post('/add', usersHandlers.addUser);
users.get('/get/:userId', usersHandlers.getUser);

module.exports = users;
