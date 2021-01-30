import {uniq} from 'lodash';

import MongooseAPI from '-/graphql/datasource/Mongoose';
import socket from '-/socket';

export default class DeviceAPI extends MongooseAPI {
    constructor() {
        super('Device');
    }

    async collect(params = {}) {
        const user = await this.getUserInstance();
        const defaultDevice = user.get('defaultDevice') || '';

        params.query = {
            $or: [{
                owners: user
            }, {
                'access.user': user
            }]
        };

        const devices = await super.collect(params);

        return devices.map(device => {
            const owners = device.owners.map(owner => owner.toString());

            device.isOwner = owners.includes(user._id.toString());
            device.isDefault = device._id.toString() === defaultDevice.toString();

            return device;
        });
    }

    async edit(params) {
        const {_id, data = {}} = params;
        const device = await this.get(_id);

        if (!device) {
            throw new Error(`Device not found: ${_id}`);
        }

        await device.edit(data);

        return null;
    }

    async generateCode(params) {
        const {_id} = params;
        const device = await this.get(_id);

        if (!device) {
            throw new Error(`Device not found: ${_id}`);
        }

        return device.generateCode(_id);
    }

    async getDeviceCodes(params) {
        const {devices = [], deviceGroups = []} = params;
        const instances = await this.Model.find({_id: {$in: devices}});
        const codes = instances.map(device => device.code);

        if (deviceGroups.length) {
            const deviceGroupAPI = this.getApi('deviceGroup');
            const groups = await deviceGroupAPI.Model.find({
                _id: {
                    $in: deviceGroups
                }
            });
            const deviceIds = groups.reduce((groupDevices, group) => {
                const {devices = []} = group;
                const ids = devices.map(id => id.toString());

                groupDevices.push(...ids);

                return groupDevices;
            }, []);

            const deviceInstances = await this.Model.find({_id: {$in: deviceIds}});
            const extraCodes = deviceInstances.map(device => device.code);

            codes.push(...extraCodes);
        }

        return uniq(codes);
    }

    async getDeviceCode(params) {
        const userInstance = await this.getUserInstance();
        const defaultDevice = userInstance.get('defaultDevice');
        const device = await this.get(defaultDevice);

        return device.get('code');
    }

    async restart(params) {
        const {_id} = params;
        const device = await this.get(_id);
        const {code: room} = device;

        socket().to(room).emit('restart');
    };

    async setBrightness(params) {
        const {_id, brightness} = params;
        const device = await this.get(_id);
        const {code: room} = device;

        socket().to(room).emit('brightness', brightness);
    }

    async setPermissions(params) {
        const {_id, data = {}} = params;
        const device = await this.get(_id);

        if (!device) {
            throw new Error(`Device not found: ${_id}`);
        }

        return device.setPermissions(data);
    }

    submitCode(params) {
        const {code} = params;
        const user = this.getUser();

        return this.Model.submitCode(code, {user});
    }

    async turnOff(params) {
        const {_id} = params;
        const device = await this.get(_id);
        const {code: room} = device;

        socket().to(room).emit('stop');
    };

    async updateDevice() {
        const room = await this.getDeviceCode();

        socket().to(room).emit('update');
    };

    async viewWeather(params) {
        const room = await this.getDeviceCode();

        socket().to(room).emit('weather');
    };
}
