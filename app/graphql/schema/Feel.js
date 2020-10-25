import {gql} from 'apollo-server-express';

import socket from '-/socket';

export const typeDefs = gql`
    type FeelFramePixel {
        color: String
        position: Int
    }

    type FeelFrame {
        brightness: Float
        duration: Int
        isThumb: Boolean
        pixels: [FeelFramePixel]
    }

    type Feel @mongoose(model: "Feel") {
        _id: ID
        active: Boolean
        category: Category
        duration: Int
        frames: [FeelFrame]
        isOwner: Boolean
        isSubscribed: Boolean
        name: String
        private: Boolean
        repeat: Boolean
        reverse: Boolean
    }

    type FeelTest {
        duration: Int
        frames: [FeelFrame]
        repeat: Boolean
        reverse: Boolean
    }

    input FeelFramePixelInput {
        color: String
        position: Int
    }

    input FeelFrameInput {
        brightness: Float
        duration: Int
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
        duration: Int
        frames: [FeelFrameInput]
        name: String
        private: Boolean
        repeat: Boolean
        reverse: Boolean
    }

    input TestFeelInput {
        duration: Int
        frames: [FeelFrameInput]
        repeat: Boolean
        reverse: Boolean
    }

    extend type Mutation {
        addFeel(data: FeelInput!): Feel
        editFeel(_id: ID!, data: FeelInput!): Feel @isOwner(type: "feel")
        removeFeel(_id: ID!): Feel
        subscribe(_id: ID!): Feel
        testFeel(feel: TestFeelInput!): Null
        unsubscribe(_id: ID!): Feel
    }

    extend type Query {
        feel(_id: ID!): Feel @isOwner(type: "feel")
        feels(criteria: FeelSearchCriteriaInput): [Feel]
    }

    extend type Subscription {
        onFeel: Feel
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

const onFeel = {
    subscribe: () => pubsub.asyncIterator(['onFeel']),
};

const subscribe = async(root, params, context) => {
    const {dataSources} = context;

    return dataSources.feelAPI.subscribe(params);
};

const testFeel = async(root, params, context) => {
    socket().emit('emote', params)
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
        testFeel,
        unsubscribe
    },
    Query: {
        feel,
        feels
    }
};
