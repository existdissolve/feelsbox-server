import {gql} from 'apollo-server-express';

export const typeDefs = gql`
    type DeviceAccess {
        permissions: [Permission]
        user: User
    }

    type Device @mongoose(model: "Device") {
        _id: ID
        access: [DeviceAccess]
        activation: Date
        capabilities: DeviceCapabilities
        code: String
        isDefault: Boolean
        isOwner: Boolean
        name: String
        owner: User
        owners: [User]
    }

    type DeviceCapabilities {
        messages: Boolean
        updates: Boolean
    }

    input DeviceInput {
        name: String!
        removals: [ID]
    }

    input DeviceAccessInput {
        permissions: [Permission]
        user: ID
    }

    extend type Mutation {
        activate(code: String!): Null
        editDevice(_id: ID!, data: DeviceInput!): Null @isOwner(type: "device")
        generateDeviceCode(_id: ID!): String @isOwner(type: "device")
        restart(_id: ID!): Null @isOwner(type: "device")
        setBrightness(_id: ID!, brightness: Int!): Null @isOwner(type: "device")
        setDevicePermissions(_id: ID!, data: DeviceAccessInput!): Null @isOwner(type: "device")
        submitAccessCode(code: Int!): Null
        turnOff(_id: ID!): Null @isOwner(type: "device")
        updateDevice(_id: ID!): Null @isOwner(type: "device")
        viewWeather: Null @isOwner(type: "device")
    }

    extend type Query {
        device(_id: ID!): Device @isOwner(type: "device")
        devices: [Device]
    }
`;

const activate = async(root, params, context) => {
    const {dataSources} = context;

    return dataSources.deviceAPI.activate(params);
};

const device = async(root, params, context) => {
    const {dataSources} = context;

    return dataSources.deviceAPI.get(params);
};

const devices = async(root, params, context) => {
    const {dataSources} = context;

    return dataSources.deviceAPI.collect(params);
};

const editDevice = async(root, params, context) => {
    const {dataSources} = context;

    return dataSources.deviceAPI.edit(params);
};

const generateDeviceCode = async(root, params, context) => {
    const {dataSources} = context;

    return dataSources.deviceAPI.generateCode(params);
};

const restart = async(root, params, context) => {
    const {dataSources} = context;

    return dataSources.deviceAPI.restart(params);
};

const setBrightness = async(root, params, context) => {
    const {dataSources} = context;

    return dataSources.deviceAPI.setBrightness(params);
}

const setDevicePermissions = async(root, params, context) => {
    const {dataSources} = context;

    return dataSources.deviceAPI.setPermissions(params);
};

const submitAccessCode = async(root, params, context) => {
    const {dataSources} = context;

    return dataSources.deviceAPI.submitCode(params);
}

const turnOff = async(root, params, context) => {
    const {dataSources} = context;

    return dataSources.deviceAPI.turnOff(params);
};

const updateDevice = async(root, params, context) => {
    const {dataSources} = context;

    return dataSources.deviceAPI.updateDevice();
};

const viewWeather = async(root, params, context) => {
    const {dataSources} = context;

    return dataSources.deviceAPI.viewWeather(params);
};

export const resolvers = {
    Mutation: {
        activate,
        editDevice,
        generateDeviceCode,
        restart,
        setBrightness,
        setDevicePermissions,
        submitAccessCode,
        turnOff,
        updateDevice,
        viewWeather
    },
    Query: {
        device,
        devices
    }
};
