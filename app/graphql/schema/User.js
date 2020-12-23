import {gql} from 'apollo-server-express';

export const typeDefs = gql`
    type User @mongoose(model: "User") {
        _id: ID
        email: String
        name: String
    }

    input UserInput {
        email: String
    }

    input UserPushKeysInput {
        p256dh: String!
        auth: String!
    }

    input UserPushInput {
        endpoint: String!
        expirationTime: String
        keys: UserPushKeysInput!
    }

    extend type Query {
        pushFriends: [User]
    }

    extend type Mutation {
        addUser(data: UserInput!): User
        setDefaultDevice(_id: ID!): Null
        subscribeToPush(push: UserPushInput!): Null
    }
`;

const addUser = (root, params, context) => {
    const {dataSources} = context;

    return dataSources.userAPI.add(params);
};

const pushFriends = (root, params, context) => {
    const {dataSources} = context;

    return dataSources.userAPI.getPushFriends(params);
};

const setDefaultDevice = (root, params, context) => {
    const {dataSources} = context;

    return dataSources.userAPI.setDefaultDevice(params);
};

const subscribeToPush = (root, params, context) => {
    const {dataSources} = context;

    return dataSources.userAPI.subscribeToPush(params);
}

export const resolvers = {
    Mutation: {
        addUser,
        setDefaultDevice,
        subscribeToPush
    },
    Query: {
        pushFriends
    }
};
