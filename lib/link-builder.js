const GraphQL    = require('graphql');
const changeCase = require('change-case');

const GraphQLString     = GraphQL.GraphQLString;


module.exports = (schema, type) => {
  const name = changeCase.paramCase(type.name);
  const definition = schema.definitions[name];
  if (definition == null) return;

  const identity = definition.definitions.identity;

  const identities = identity && identity.anyOf && identity.anyOf.map((id) => {
    return id.$ref.split('/').pop();
  });

  if (!identities) return;

  const args = identities.reduce((memo, name) => {
    memo[name] = {
      description: 'Unique identifier',
      type: GraphQLString
    };
    return memo;
  }, {});

  const selfLink = definition.links.find((link) => link.rel === 'self');
  if (!selfLink) return;

  return {
    type: type,
    args: args,
    resolve: (heroku, params) => {
      const paramName = Object.keys(params).find((key) => identities.indexOf(key) !== 0) || '';
      const param = params[paramName] || '';
      console.log(paramName);
      console.log(param);

      return heroku.request({
        method: 'GET',
        path: selfLink.href.split('{(').shift() + param
      });
    }
  };
};

