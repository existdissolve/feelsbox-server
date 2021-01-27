import {gql} from 'apollo-server-express';

export const typeDefs = gql`
    directive @isOpen on FIELD_DEFINITION
    directive @isOwner(type: String) on FIELD_DEFINITION
    directive @mongoose(model: String, refPath: String) on OBJECT

    enum FeelSearchType {ALL, OWNER}
    enum FeelSortType {MOSTPOPULAR, MOSTRECENT}
    enum Permission {EMOTER, OWNER}

    type Query {
        _empty: String
    }

    type Mutation {
        _empty: String
    }

    type Subscription {
        _empty: String
    }
`;

export const resolvers = {};

export const mapApi = (dataSource, method, root, params, context) => {
    const {dataSources} = context;

    return dataSources[dataSource][method](params);
};