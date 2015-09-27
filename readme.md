Exploring using GraphQL with the Heroku API and JSON Schemas.

```
npm install
npm start
```

Using [httpie](https://github.com/jkbrzt/httpie):

```
http post :3000/query "Accept: application/json" "Authorization: Bearer HEROKU_API_KEY" < example/query.graphql
```
