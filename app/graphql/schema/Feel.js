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
        categories: [Category]
        duration: Int
        frames: [FeelFrame]
        isOwner: Boolean
        isSubscribed: Boolean
        isSubscriptionOwner: Boolean
        name: String
        private: Boolean
        repeat: Boolean
        reverse: Boolean
    }

    type FeelSnapshot {
        duration: Int
        frames: [FeelFrame]
        name: String
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
        categories: [ID]
        duration: Int
        frames: [FeelFrameInput]
        name: String
        private: Boolean
        repeat: Boolean
        reverse: Boolean
    }

    input FeelCarouselInput {
        devices: [ID]
        duration: Int
    }

    input TestFeelInput {
        duration: Int
        frames: [FeelFrameInput]
        repeat: Boolean
        reverse: Boolean
    }

    input SendFeelInput {
        devices: [ID]
        isNotification: Boolean
        notification: String
        users: [ID]
    }

    extend type Mutation {
        addFeel(data: FeelInput!): Feel
        cloneFromHistory(_id: ID!): Null
        copyFeel(_id: ID!): Null
        editFeel(_id: ID!, data: FeelInput!): Feel @isOwner(type: "feel")
        removeFeel(_id: ID!): Feel
        subscribe(_id: ID!): Feel
        sendCarousel(feels: [ID]!, data: FeelCarouselInput): Null
        sendFeel(_id: ID!, data: SendFeelInput): Null
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

const cloneFromHistory = async(root, params, context) => {
    const {dataSources} = context;

    return dataSources.feelAPI.cloneFromHistory(params);
};

const copyFeel = async(root, params, context) => {
    const {dataSources} = context;

    return dataSources.feelAPI.copy(params);
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

const sendCarousel = async(root, params, context) => {
    const {dataSources} = context;

    return dataSources.feelAPI.sendCarousel(params);
};

const sendFeel = async(root, params, context) => {
    const {dataSources} = context;

    return dataSources.feelAPI.send(params);
};

const testFeel = async(root, params, context) => {
    const {dataSources} = context;

    return dataSources.feelAPI.test(params);
};

const unsubscribe = async(root, params, context) => {
    const {dataSources} = context;

    return dataSources.feelAPI.unsubscribe(params);
};

export const resolvers = {
    Mutation: {
        addFeel,
        cloneFromHistory,
        copyFeel,
        editFeel,
        removeFeel,
        subscribe,
        sendCarousel,
        sendFeel,
        testFeel,
        unsubscribe
    },
    Query: {
        feel,
        feels
    }
};
