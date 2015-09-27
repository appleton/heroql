const express    = require('express');
const bodyParser = require('body-parser');
const GraphQL    = require('graphql');
const Heroku     = require('heroku-client');
const token      = require('express-bearer-token');
const hkSchema   = require('./schema/heroku.json');

const graphql           = GraphQL.graphql;
const GraphQLSchema     = GraphQL.GraphQLSchema;
const GraphQLObjectType = GraphQL.GraphQLObjectType;
const GraphQLString     = GraphQL.GraphQLString;
const GraphQLInt        = GraphQL.GraphQLInt;
const GraphQLBoolean    = GraphQL.GraphQLBoolean;

const app = express();

const typeMap = {
  object:  GraphQLObjectType,
  string:  GraphQLString,
  integer: GraphQLInt,
  boolean: GraphQLBoolean
};

const types = Object.keys(hkSchema.definitions).reduce((memo, key) => {
  const definition = hkSchema.definitions[key];
  if (key.indexOf('-' !== -1)) key = key.replace(/\-/g, '_');

  memo[key] = new GraphQLObjectType({
    name: key,
    description: definition.description,
    fields: () => {
      return Object.keys(definition.definitions).reduce((memo, subKey) => {
        if (subKey === 'identity') return memo;

        const subDefinition = definition.definitions[subKey];
        const type = typeMap[subDefinition.type[0]];
        if (type == null) return memo;

        memo[subKey] = {
          type:        type,
          description: subDefinition.description
        };

        return memo;
      }, {});
    }
  });

  return memo;
}, {});

const queryType = new GraphQLObjectType({
  name: 'Query',
  fields: () => {
    // TODO: this should also be generated from the schema
    return {
      account: {
        type: types.account,
        args: {
          id: {
            description: 'Unique identifier',
            type: GraphQLString
          }
        },
        resolve: (heroku) => {
          return heroku.account().info();
        },
      },
      app: {
        type: types.app,
        args: {
          id: {
            description: 'App ID',
            type: GraphQLString
          },
          name: {
            description: 'App name',
            type: GraphQLString
          }
        },
        resolve: (heroku, params) => {
          return heroku.apps(params.id || params.name).info();
        },
      }
    };
  }
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
