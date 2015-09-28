const express    = require('express');
const bodyParser = require('body-parser');
const GraphQL    = require('graphql');
const Heroku     = require('heroku-client');
const token      = require('express-bearer-token');
const changeCase = require('change-case');
const hkSchema   = require('./schema/heroku.json');

const typeBuilder = require('./lib/type-builder');
const linkBuilder = require('./lib/link-builder');

const graphql           = GraphQL.graphql;
const GraphQLSchema     = GraphQL.GraphQLSchema;
const GraphQLObjectType = GraphQL.GraphQLObjectType;

const app = express();

const types = Object.keys(hkSchema.definitions).reduce((memo, key) => {
  const type = typeBuilder(hkSchema, key);
  if (type) memo[changeCase.pascalCase(key)] = type;
  return memo;
}, {});

const links = Object.keys(types).reduce((memo, key) => {
  const type = types[key];
  const link = linkBuilder(hkSchema, type);
  if (link) memo[key] = link;
  return memo;
}, {});

delete links.BuildResult;
delete links.ConfigVar;
delete links.OrganizationAppCollaborator;
delete links.SmsNumber;
delete links.UserPreferences;

const queryType = new GraphQLObjectType({
  name: 'Query',
  fields: () => links
});

const schema = new GraphQLSchema({ query: queryType });

app.post('/query', token(), bodyParser.text({ type: '*/*' }), function(req, res) {
  const heroku = new Heroku({ token: req.token });
  const query = req.body;

  graphql(schema, query, heroku).then((data) => {
    res.status(200).json(data);
  }).catch((error) => {;
    res.status(400).json({ error: error });
  });
});

app.use(express.static(__dirname + '/public'));

module.exports = app;
