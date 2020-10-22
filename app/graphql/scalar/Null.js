import {GraphQLScalarType} from 'graphql';

function toNull() {
    return null;
}

export default new GraphQLScalarType({
    name: 'Null',
    description: 'Produces a legitimate `null` scalar type',
    serialize: toNull,
    parseValue: toNull,
    parseLiteral: toNull
});
