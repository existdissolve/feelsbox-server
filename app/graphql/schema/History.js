import {gql} from 'apollo-server-express';

export const typeDefs = gql`
    type History @mongoose(model: "History") {
        _id: ID
        createdAt: Date
        createdBy: User
        device: Device
        feelSnapshot: FeelSnapshot
    }

    input HistoryCriteriaInput {
        device: ID!
    }

    extend type Query {
        history(criteria: HistoryCriteriaInput): [History]
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
