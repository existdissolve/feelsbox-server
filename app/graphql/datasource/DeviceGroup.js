import MongooseAPI from '-/graphql/datasource/Mongoose';
import socket from '-/socket';

export default class DeviceGroupAPI extends MongooseAPI {
    constructor() {
        super('DeviceGroup');
    }

    collect(params) {
        const user = this.getUser();

        params.query = {active: true, owners: user};

        return super.collect(params);
    }

    async addDevice(params) {
        const {_id, deviceId} = params;
        const {dataSources} = this.context;
        const deviceGroup = await this.get(_id);

        if (!deviceGroup) {
            throw new Error(`Could not find device group: ${_id}`);
        }

        await deviceGroup.addDevice(deviceId);

        return this.get(_id, {clear: true});
    }

    async removeDevice(params) {
        const {_id, deviceId} = params;
        const deviceGroup = await this.get(_id);

        if (!deviceGroup) {
            throw new Error(`Could not find device group: ${_id}`);
        }

        await deviceGroup.removeDevice(deviceId);

        return this.get(_id, {clear: true});
    }

    async turnOff(params) {
        const {_id} = params;
        const deviceGroup = await this.get(_id);
        const deviceIds = deviceGroup.get('devices');
        const deviceAPI = this.getApi('device');
        const rooms = await deviceAPI.Model.distinct('code', {
            _id: {$in: deviceIds}
        });

        for (const room of rooms) {
            socket().to(room).emit('stop');
        }
    };
}
