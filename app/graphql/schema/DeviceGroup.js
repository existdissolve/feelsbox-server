import {gql} from 'apollo-server-express';

import {mapApi} from '-/graphql/schema/Base';

export const typeDefs = gql`
    type DeviceGroup @mongoose(model: "DeviceGroup") {
        _id: ID
        devices: [Device]
        name: String
        owners: [User]
    }

    input DeviceGroupInput {
        name: String!
        devices: [ID]
    }

    extend type Mutation {
        addDeviceGroup(data: DeviceGroupInput!): DeviceGroup
        addDeviceToGroup(_id: ID!, deviceId: ID!): DeviceGroup @isOwner(type: "deviceGroup")
        editDeviceGroup(_id: ID!, data: DeviceGroupInput!): DeviceGroup @isOwner(type: "deviceGroup")
        removeDeviceGroup(_id: ID!): Null @isOwner(type: "deviceGroup")
        removeDeviceFromGroup(_id: ID!, deviceId: ID!): DeviceGroup @isOwner(type: "deviceGroup")
        turnOffDeviceGroup(_id: ID!): Null @isOwner(type: "deviceGroup")
    }

    extend type Query {
        deviceGroup(_id: ID!): DeviceGroup @isOwner(type: "deviceGroup")
        deviceGroups: [DeviceGroup]
    }
`;

const defaultApi = 'deviceGroupAPI';

export const resolvers = {
    Mutation: {
        addDeviceGroup: mapApi.bind(null, defaultApi, 'add'),
        addDeviceToGroup: mapApi.bind(null, defaultApi, 'addDevice'),
        editDeviceGroup: mapApi.bind(null, defaultApi, 'edit'),
        removeDeviceGroup: mapApi.bind(null, defaultApi, 'delete'),
        removeDeviceFromGroup: mapApi.bind(null, defaultApi, 'removeDevice'),
        turnOffDeviceGroup: mapApi.bind(null, defaultApi, 'turnOff')
    },
    Query: {
        deviceGroup: mapApi.bind(null, defaultApi, 'get'),
        deviceGroups: mapApi.bind(null, defaultApi, 'collect')
    }
};
