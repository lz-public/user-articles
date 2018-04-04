/*
 * Users module
 * Everything related to user actions
 */

const users = require('express').Router();
const ObjectID = require('mongodb').ObjectID;

const usersHandlers = {
  addUser: (req, res, next) => {
    if (!usersHelpers.addUserValidation(req.body)) {
      res.status(400);
      res.send(req.body);
      return;
    }

    var newUser = new User(req.body.name, req.body.avatar);

    users.db.collection('users').insertOne(newUser, (err) => {
      if (err) {
        next(err);
        return;
      }
      var result = { status: 'success' };
      Object.assign(result, newUser);
      res.send(JSON.stringify(result));
    });
  },
  getAllUsers: (req, res, next) => {
    users.db.collection('users').find({}).toArray((err, userList) => {
      if (err) {
        next(err);
        return;
      }
      res.send(userList);
    });
  },
  getUser: (req, res, next) => {
    if (!usersHelpers.getUserValidation(req.params)) {
      res.status(400);
      res.send('Bad request');
      return;
    }
    users.db.collection('users').findOne({ _id: new ObjectID(req.params.userId) }, (err, userData) => {
      if (err) {
        next(err);
        return;
      }
      res.send(userData);
    });
  }
};

const usersHelpers = {
  addUserValidation: (d) => d.name && d.name.length > 3 && d.avatar && (d.avatar.indexOf('https://') !== -1),
  getUserValidation: (d) => d.userId && ObjectID.isValid(d.userId)
};

class User {
  constructor (name, avatar) {
    this.name = name;
    this.avatar = avatar;
  }
}

users.post('/add', usersHandlers.addUser);
users.get('/get/all', usersHandlers.getAllUsers);
users.get('/get/:userId', usersHandlers.getUser);

module.exports = users;
