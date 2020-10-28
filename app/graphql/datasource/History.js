import MongooseAPI from '-/graphql/datasource/Mongoose';

export default class HistoryAPI extends MongooseAPI {
    constructor() {
        super('History');
    }

    async collect(params) {
        const user = this.getUser();
        const deviceAPI = this.getApi('device');
        const devices = await deviceAPI.collect();
        const deviceIds = devices
            .filter(device => device.owner.toString() === user.toString())
            .map(device => device._id);

        params.query = {
            device: {$in: deviceIds}
        };

        return super.collect(params);
    }

    add(params) {
        return this.Model.create(params);
    }
}
