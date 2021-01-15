import {gql} from 'apollo-server-express';

export const typeDefs = gql`
    type Message @mongoose(model: "Message") {
        _id: ID
        createdAt: Date
        createdBy: User
        feelSnapshot: FeelSnapshot
        message: String
        recipient: User
    }

    extend type Query {
        messages: [Message]
    }
`;

const messages = async(root, params, context) => {
    const {dataSources} = context;

    return dataSources.messageAPI.collect(params);
};

export const resolvers = {
    Query: {
        messages
    }
};
