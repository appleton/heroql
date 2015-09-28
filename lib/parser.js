const jsonpointer = require('jsonpointer');

// Recursively resolve a JSON reference for a given JSON schema
const schemaResolve = (schema, jsonRef) => {
  const name = jsonRef.split('/').pop();

  // Only resolve local references - use the JSON pointer after the fragment
  const value = jsonpointer.get(schema, jsonRef.replace(/^.*#/, ''));
  if (value.$ref) {
    return schemaResolve(schema, value.$ref);
  }
  return { name, value };
};

// Parse a JSON schema link href, and return a URL template and array of params
const parseSchemaLinkHref = (schema, schemaHref) => {
  const params = [];
  const templateUrl = schemaHref.replace(/{[^}]*}/g, (param) => {
    // Extract the JSON reference from the schema href
    const ref = decodeURIComponent(param).replace(/^{\(/, '').replace(/\)}$/, '');

    // Work out what the reference actually refers to in the schema
    const urlParam = schemaResolve(schema, ref);
    params.push(urlParam);

    // Replace complex JSON schema references with ':param' tokens
    return ':' + urlParam.name;
  });

  // Return a function that accepts URL parameters, and builds a URL with them
  const urlTemplate = (params) => {
    return templateUrl.replace(/:\w+/g, param => params[param.substr(1)]);
  };
  return { urlTemplate, params };
};

module.exports = { schemaResolve, parseSchemaLinkHref };
