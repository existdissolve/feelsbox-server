import {gql} from 'apollo-server-express';

export const typeDefs = gql`
    type FeelFramePixel {
        color: String
        brightness: Float
        position: Int
    }

    type FeelFrame {
        isThumb: Boolean
        pixels: [FeelFramePixel]
    }

    type Feel @mongoose(model: "Feel") {
        _id: ID
        active: Boolean
        category: Category
        fps: Int
        frames: [FeelFrame]
        isOwner: Boolean
        isSubscribed: Boolean
        name: String
        private: Boolean
        repeat: Boolean
        reverse: Boolean
    }

    input FeelFramePixelInput {
        color: String
        brightness: Float
        position: Int
    }

    input FeelFrameInput {
        isThumb: Boolean
        pixels: [FeelFramePixelInput]
    }

    input FeelSearchCriteriaInput {
        searchType: FeelSearchType
        sortType: FeelSortType
        text: String
    }

    input FeelInput {
        category: ID
        fps: Int
        frames: [FeelFrameInput]
        name: String
        private: Boolean
        repeat: Boolean
        reverse: Boolean
    }

    extend type Mutation {
        addFeel(data: FeelInput!): Feel
        editFeel(_id: ID!, data: FeelInput!): Feel @isOwner(type: "feel")
        removeFeel(_id: ID!): Feel
        subscribe(_id: ID!): Feel
        unsubscribe(_id: ID!): Feel
    }

    extend type Query {
        feel(_id: ID!): Feel @isOwner(type: "feel")
        feels(criteria: FeelSearchCriteriaInput): [Feel]
    }
`;

const addFeel = async(root, params, context) => {
    const {dataSources} = context;

    return dataSources.feelAPI.add(params);
};

const editFeel = async(root, params, context) => {
    const {dataSources} = context;

    return dataSources.feelAPI.edit(params);
};

const removeFeel = async(root, params, context) => {
    const {dataSources} = context;

    return dataSources.feelAPI.delete(params);
};

const feel = async(root, params, context) => {
    const {dataSources} = context;

    return dataSources.feelAPI.get(params);
};

const feels = async(root, params, context) => {
    const {dataSources} = context;

    return dataSources.feelAPI.collect(params);
};

const subscribe = async(root, params, context) => {
    const {dataSources} = context;

    return dataSources.feelAPI.subscribe(params);
};

const unsubscribe = async(root, params, context) => {
    const {dataSources} = context;

    return dataSources.feelAPI.unsubscribe(params);
};

export const resolvers = {
    Mutation: {
        addFeel,
        editFeel,
        removeFeel,
        subscribe,
        unsubscribe
    },
    Query: {
        feel,
        feels
    }
};
