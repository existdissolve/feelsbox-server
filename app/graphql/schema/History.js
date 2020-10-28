import {gql} from 'apollo-server-express';

export const typeDefs = gql`
    type History @mongoose(model: "History") {
        _id: ID
        createdBy: User
        device: Device
        duration: Int
        frames: [FeelFrame]
        name: String
        repeat: Boolean
        reverse: Boolean
    }

    extend type Query {
        history: [History]
    }
`;

const history = async(root, params, context) => {
    const {dataSources} = context;

    return dataSources.historyAPI.collect(params);
};

export const resolvers = {
    Query: {
        history
    }
};
