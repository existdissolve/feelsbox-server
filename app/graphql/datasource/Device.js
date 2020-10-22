import MongooseAPI from '-/graphql/datasource/Mongoose';

export default class DeviceAPI extends MongooseAPI {
    constructor() {
        super('Device');
    }

    async collect(params) {
        const user = this.getUser();

        params.query = {
            $or: [{
                owner: user
            }, {
                'access.user': user
            }]
        };

        const devices = await super.collect(params);

        return devices.map(device => {
            device.isOwner = device.owner.toString() === user.toString();

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
}
