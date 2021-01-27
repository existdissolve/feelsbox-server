import {cloneDeep} from 'lodash';
import logger from 'bristol';
import palin from 'palin';
import socket from '-/socket';

import MongooseAPI from '-/graphql/datasource/Mongoose';

export default class FeelGroupAPI extends MongooseAPI {
    constructor() {
        super('FeelGroup');
    }

    collect(params) {
        const user = this.getUser();

        params.query = {
            active: true,
            owners: user
        };

        return super.collect(params);
    }

    async send(params) {
        const {_id, data = {}} = params;
        const feelAPI = this.getApi('feel');
        const deviceAPI = this.getApi('device');
        const {devices = []} = data;
        const deviceIds = cloneDeep(devices);
        const feelGroup = await super.get(_id);
        const feelIds = feelGroup.get('feels');
        const feels = await feelAPI.simpleQuery({
            query: {
                _id: {$in: feelIds}
            }
        });

        if (feels.length) {
            const rooms = [];
            const feel = {
                duration: feelGroup.get('duration'),
                frames: [],
                repeat: true
            };

            feelIds.forEach(feelId => {
                const feelInstance = feels.find(feel => feel._id.toString() === feelId);

                if (feelInstance) {
                    feel.frames.push(...feelInstance.frames);
                }
            });

            if (!devices.length) {
                const userInstance = await this.getUserInstance();
                const defaultDevice = userInstance.get('defaultDevice');
                const device = await deviceAPI.get(defaultDevice);
                const code = device.get('code');

                deviceIds.push(defaultDevice);
                rooms.push(code);
            } else {
                const codes = await deviceAPI.getDeviceCodes(data);

                rooms.push(...codes);
            }

            rooms.forEach(room => {
                logger.info('pushing to room', room)
                socket().to(room).emit('emote', {feel});
            });
        }
    }
}
