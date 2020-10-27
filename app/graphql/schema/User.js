import {gql} from 'apollo-server-express';

export const typeDefs = gql`
    type User @mongoose(model: "User") {
        _id: ID
        email: String
    }

    input UserInput {
        email: String
    }

    extend type Mutation {
        addUser(data: UserInput!): User
        setDefaultDevice(_id: ID!): Null
    }
`;

const addUser = async(root, params, context) => {
    const {dataSources} = context;

    return dataSources.userAPI.add(params);
};

const setDefaultDevice = async(root, params, context) => {
    const {dataSources} = context;

    return dataSources.userAPI.setDefaultDevice(params);
};

export const resolvers = {
    Mutation: {
        addUser,
        setDefaultDevice
    }
};
