import {gql} from 'apollo-server-express';

export const typeDefs = gql`
    type DeviceGroup @mongoose(model: "DeviceGroup") {
        _id: ID
        devices: [Device]
        name: String
        owner: User
    }

    input DeviceGroupInput {
        name: String!
    }

    extend type Mutation {
        addDeviceGroup(data: DeviceGroupInput!): DeviceGroup
        addDeviceToGroup(_id: ID!, deviceId: ID!): DeviceGroup @isOwner(type: "deviceGroup")
        editDeviceGroup(_id: ID!, data: DeviceGroupInput!): DeviceGroup @isOwner(type: "deviceGroup")
        removeDeviceGroup(_id: ID!): Null @isOwner(type: "deviceGroup")
        removeDeviceFromGroup(_id: ID!, deviceId: ID!): DeviceGroup @isOwner(type: "deviceGroup")
    }

    extend type Query {
        deviceGroup(_id: ID!): DeviceGroup @isOwner(type: "deviceGroup")
        deviceGroups: [DeviceGroup]
    }
`;

const addDeviceGroup = async(root, params, context) => {
    const {dataSources} = context;

    return dataSources.deviceGroupAPI.add(params);
};

const addDeviceToGroup = async(root, params, context) => {
    const {dataSources} = context;

    return dataSources.deviceGroupAPI.addDevice(params);
};

const editDeviceGroup = async(root, params, context) => {
    const {dataSources} = context;

    return dataSources.deviceGroupAPI.edit(params);
};

const removeDeviceGroup = async(root, params, context) => {
    const {dataSources} = context;

    return dataSources.deviceGroupAPI.delete(params);
};

const removeDeviceFromGroup = async(root, params, context) => {
    const {dataSources} = context;

    return dataSources.deviceGroupAPI.removeDevice(params);
};

const deviceGroup = async(root, params, context) => {
    const {dataSources} = context;

    return dataSources.deviceGroupAPI.get(params);
};

const deviceGroups = async(root, params, context) => {
    const {dataSources} = context;

    return dataSources.deviceGroupAPI.collect(params);
};

export const resolvers = {
    Mutation: {
        addDeviceGroup,
        addDeviceToGroup,
        editDeviceGroup,
        removeDeviceGroup,
        removeDeviceFromGroup
    },
    Query: {
        deviceGroup,
        deviceGroups
    }
};
