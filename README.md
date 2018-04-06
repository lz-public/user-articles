# UserArticles Service #

This serivice provides support for mobile apps, managing users and articles exposing a REST API.

You can create users (currently, you can't make changes to them). However, you can add, update, delete and query articles. The service has been designed to be configured for different environments and has some catching logic in the article query. There is a lot we could do to improve this server. The section "Future improvements" is a small list of how it can be extend.


## Roadmap

### Steps
1. Project setup (npm, git, express, etc)
2. HTTP Server creation
3. Basic health check
4. Users and Article modules scaffolding
5. Basic test with Mocha
6. Basic Documentation
7. MongoDB
8. User module w/tests
9. Article module
10. User info expansion and cache for the Article module
11. Authentication using the API key
12. Improve server stats and graceful shutdown
13. Environment dependant config
14. Improved tests (refactor w/separate db)
15. Add tests for the Articles module
16. Validate installation steps in a new VM


### Future (possible) improvements

* Real-world operations like editing/deleting users, to be able to change a small number of properties when updating an article, etc.
* Increase security by adding tools such as limiters and slowloris
* Add caching and invalidate the cached records when changes are detected
* Use Redis/PubSub to share cache between running instances (in a scaled environment)
* Improve server internal stats and logging locally or to external resources
* Implement socket.io to provide real-time stats

## Requirements
* Node.js version 8+
* MongoDb version 3.6


## Install, build and run!

* Install the server
```sh
git clone https://github.com/lz-public/user-articles.git
cd user-articles
npm install
```
* Don't forget to start MongoDb daemon
* Now create the API key that will be used to authenticate the requests (It can be whatever you want). Then, start the server.
```sh
export UA_API_KEY=079ffec7dd3b4e03bff515ef62925aeb
node index
```
* Testing the server
```sh
npm test
```

> NOTE: The default database name for this service is `userarticles`. However, when running the test suite,
> the database `userarticle-test` is used. Please see the config options below.

## Config options
The current implementation can be configured and is environment-dependent. Each config file is located in the server's folder
and is named `config-*environment*.json` . The options are:

```
{
  "serverPort": "8088"        ---> The port where the server will run
  "serverHost": "localhost",  ---> The host name
  "serverProtocol": "http",   ---> The protocol. Currently, only HTTP is supported
  "mongodbConnStr": "mongodb://localhost:27017/database-name", ---> MongoDb connection
  "mongoDbDatabaseName": "database-name",                      ---> Mongo's database name
  "articlesMaxResultsPerPage": 50,          ---> The maximum number or documents
                                                 returned in the articles list
  "articlesMaxUserCacheExpiration": 30000   ---> User's cache TTL
}
```

> The test configuration uses a cache timeout of 3 seconds in order to test the user cache expiration faster. The overall test process should take about 5 seconds.

## Known issues
* Under certain circumstances, when running the tests many times, the port is not released (Linux/Ubuntu) causing the tests to fail.
* Unexpected authentication/test issues if the environment variable `UA_API_KEY` is not set.
* Tests might fail if MongoDb or the server takes too much time to start. Retry executing `npm test` and everything should work.

## Stop the server
Press `Ctrl` + `C` to stop the server.


## API Reference

To authenticate your requests, please add the following header to any request. If the API key does not match the environment
variable, a 401 "Not Authorized" will be returned.

Example header:
```
Authorization: BEARER 079ffec7dd3b4e03bff515ef62925aeb
```


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

### Article API

The Article API allows the creation of new articles, update, delete articles and filter by tags.

#### /article/add `[POST]`
> Creates a new article. Requires a body with the following parameters:
* `title`: The article's title
* `text`: The article's content
* `userId`: The id of the user (as string)
* `tags`: A list of tags in jsons array format. Ex: ["history", "funny"]

It returns the newly added article. For example:
```javascript
{ 
    "status": "success",
    "userId": "5ac4d2915940502cfa0fbb04",
    "title": "This is the book title",
    "text":"This book is made available for download for anyone",
    "tags": ["ideas", "creative"],
    "_id": "5ac66755e3ba686ebd437879"
}
```

#### /article/update `[PUT]`
> Updates an article. Requires a body with the following parameters:
* `articleId`: The id of the article to be updates (as string)
* `userId`: The id of the user (as string)
* `title`: The article's title
* `text`: The article's content
* `tags`: A list of tags in jsons array format. Ex: ["history", "funny"]

It returns the updated article. For example:
```javascript
{
    "status": "success",
    "userId": "5ac4d2915940502cfa0fbb04",
    "title": "First Book (edited)",
    "text": "Lorem ipsum dolor sit amet, consectetur ... ea commodo consequat.",
    "tags": ["lorem", "ipsum", "amet"]
}
```

#### /article/delete/*articleId* `[DELETE]`
> Deletes an article.

It returns the result of the delete transaction (may include MongoDb properties). For example:
```javascript
{
    "status": "success",
    "ok": 1,
    "n": 0
}
```

#### /article/get/*tag1*,*tag2*,... `[GET]`
> Lists all articles that match the comma-separated tag list. Tags are required.

Example request:
```
GET http://127.0.0.1:8088/article/get/writing
```

Example response:
```javascript
{
    "searchCriteria": ["writing"],
    "articles": [{
        "_id": "5ac529468fb6ac78820083a5",
        "userId": "5ac4d2865940502cfa0fbb03",
        "title": "Heyya!",
        "text": "Stumped for subjects? Don’t stress. You’ve come to ... book. Take a look!",
        "tags": ["subject", "writing", "ideas", "creative"],
        "userName": "Maria",
        "userAvatar": "https://something.gif"
    }, {
        "_id": "5ac528e58fb6ac78820083a4",
        "userId": "5ac4d2865940502cfa0fbb03",
        "title": "Example Book",
        "text": "Whether you’re writing fiction or non-fiction, a ... start writing!",
        "tags": ["writing", "template", "example"],
        "userName": "Maria",
        "userAvatar": "https://something.gif"
    }],
    "stats": {
        "results": 2,
        "cacheHits": 0,
        "cacheMiss": 1
    }
}
```

### Self-test / Health check API

The Self-test API allows monitoring the server from an external service. Examples:

#### /stats `[GET]`
> Returns the number of requests and authentication fauilures per day in `d``YYYYMMDD` format.

Example request:
```
GET http://127.0.0.1:8088/stats
```

Example response:
```javascript
{
    "d20180405": {
        "requests": 12,
        "authFails": 4
    }
}
```

#### / `[GET]`
> Returns the current date.

Example request:
```
GET http://127.0.0.1:8088/stats
```

Example response:
```javascript
{
    "date": "2018-04-05T18:47:40.699Z"
}
```
