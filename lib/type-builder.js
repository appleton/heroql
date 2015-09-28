const GraphQL    = require('graphql');
const changeCase = require('change-case');

const GraphQLObjectType = GraphQL.GraphQLObjectType;
const GraphQLString     = GraphQL.GraphQLString;
const GraphQLInt        = GraphQL.GraphQLInt;
const GraphQLBoolean    = GraphQL.GraphQLBoolean;

const typeMap = {
  // object:  GraphQLObjectType,
  string:  GraphQLString,
  integer: GraphQLInt,
  boolean: GraphQLBoolean
};

module.exports = (schema, type) => {
  const definition = schema.definitions[type];
  type = changeCase.pascalCase(type);
  if (definition.definitions == null) return;

  return new GraphQLObjectType({
    name: type,
    description: definition.description,
    fields: () => {
      return Object.keys(definition.definitions).reduce((memo, subKey) => {
        if (subKey === 'identity' || subKey === 'scopedIdentity') return memo;

        const subDefinition = definition.definitions[subKey];

        var type;
        try {
          type = typeMap[subDefinition.type[0]];
        } catch (err) {
          return memo;
        }

        if (type == null) return memo;

        memo[subKey] = {
          type:        type,
          description: subDefinition.description
        };

        return memo;
      }, {});
    }
  });

};
