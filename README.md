# README #

This is the "User-Articles" server. 
* This service provides a HTTP API to manage users and articles that can be posted by them
* Under heavy development

## Roadmap

### Done
1. Project setup (npm, git, express, etc)
2. HTTP Server creation
3. Basic health check
4. Users and Article modules scaffolding
5. Basic test with Mocha
6. Documentation
7. MongoDB
8. User module

### Next steps

* Article module
* More documentation...
* Authentication using the API key
* Add tests for the Users module
* Add tests for the Articles module
* Improve server stats and graceful shutdown

## Build and install

* Download/clone from repo 
* npm install
* Start the server
```sh
node index.js
```
* Test the server
```sh
npm test
```

## API Reference

### User API

The User API allows the creation of new users, list them and get information about a single user.

#### /user/add `[POST]`
> Creates a new user. Requires a body with the following parameters:
* `name`: The name of the user
* `avatar`: The URL (https!) of the user's avatar

It returns the newly added user. For example:
```javascript
{
    "status": "success",
    "name": "Carol",
    "avatar": "https://carols-avatar.gif",
    "_id": "5ac4d8e255b36032d34d3a99"
}
```


#### /user/getAll `[GET]`
> List all users. Doesn't require any parameters
Example
```javascript
[{
    "_id": "5ac4d2865940502cfa0fbb03",
    "name": "Maria",
    "avatar": "https://something.gif"
}, {
    "_id": "5ac4d2915940502cfa0fbb04",
    "name": "Carlos",
    "avatar": "https://else.gif"
}, {
    "_id": "5ac4d8e255b36032d34d3a99",
    "name": "Carol",
    "avatar": "https://carols-avatar.gif"
}]
```

#### /user/get/:id `[GET]`
> Gets data from a specific user. Requires the following parameter:
* `usedId`: The 24 hex id of the user

It returns the user information. For example:
```javascript
{
    "name": "Carol",
    "avatar": "https://carols-avatar.gif",
    "_id": "5ac4d8e255b36032d34d3a99"
}
```
