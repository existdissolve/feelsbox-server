import {gql} from 'apollo-server-express';

import socket from '-/socket';
import {mapApi} from '-/graphql/schema/Base';

export const typeDefs = gql`
    type FeelGroup @mongoose(model: "FeelGroup") {
        _id: ID
        active: Boolean
        duration: Int
        feels: [Feel]
        name: String
    }

    input FeelGroupInput {
        duration: Int!
        feels: [ID]!
        name: String!
    }

    input FeelGroupSendInput {
        devices: [ID]
    }

    extend type Mutation {
        addFeelGroup(data: FeelGroupInput!): FeelGroup
        editFeelGroup(_id: ID!, data: FeelGroupInput!): FeelGroup @isOwner(type: "feelGroup")
        removeFeelGroup(_id: ID!): FeelGroup
        sendFeelGroup(_id: ID!, data: FeelGroupSendInput): Null
    }

    extend type Query {
        feelGroup(_id: ID!): FeelGroup @isOwner(type: "feelGroup")
        feelGroups: [FeelGroup]
    }
`;

const defaultApi = 'feelGroupAPI';

export const resolvers = {
    Mutation: {
        addFeelGroup: mapApi.bind(null, defaultApi, 'add'),
        editFeelGroup: mapApi.bind(null, defaultApi, 'edit'),
        removeFeelGroup: mapApi.bind(null, defaultApi, 'delete'),
        sendFeelGroup: mapApi.bind(null, defaultApi, 'send')
    },
    Query: {
        feelGroup: mapApi.bind(null, defaultApi, 'get'),
        feelGroups: mapApi.bind(null, defaultApi, 'collect')
    }
};
