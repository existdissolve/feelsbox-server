import {gql} from 'apollo-server-express';

export const typeDefs = gql`
    extend type Mutation {
        login(email: String!): Boolean @isOpen
        logout: Null @isOpen
    }
`;

const login = async(root, params, context) => {
    const {dataSources} = context;

    return dataSources.userAPI.login(params);
};

const logout = async(root, params, context) => {
    const {dataSources} = context;

    return dataSources.userAPI.logout(params);
};

export const resolvers = {
    Mutation: {
        login,
        logout
    }
};
