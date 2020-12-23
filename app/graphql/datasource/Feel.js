import {cloneDeep, pick} from 'lodash';
import logger from 'bristol';
import palin from 'palin';
import MongooseAPI from '-/graphql/datasource/Mongoose';
import socket from '-/socket';
import webpush from 'web-push';

logger.addTarget('console').withFormatter(palin);

export default class FeelAPI extends MongooseAPI {
    constructor() {
        super('Feel');
    }

    async collect(params) {
        const user = this.getUser();
        const {criteria = {}} = params;
        const {searchType = 'OWNER', sortType, text} = criteria;
        const userInstance = await this.getUserInstance();
        const subscriptions = userInstance.get('subscriptions');

        params.query = {
            active: true,
            ...searchType === 'OWNER' && {
                $or: [{
                    owners: user
                }, {
                    _id: {$in: subscriptions}
                }]
            },
            ...searchType !== 'OWNER' && {
                private: {$ne: true},
                owners: {$ne: user}
            },
            ...text && {
                name: {
                    $regex: new RegExp(text, 'gi')
                }
            }
        };

        let feels;

        if (sortType) {
            const property = sortType === 'MOSTPOPULAR' ? 'subscriberCount' : 'createdAt';

            feels = await super.collect(params).sort({[property]: -1});
        } else {
            feels = await super.collect(params);
        }

        return feels.map(feel => {
            const {_id, owners = []} = feel;
            const allOwners = owners.map(owner => owner.toString());
            const frame = feel.frames.find(frame => frame.isThumb) || feel.frames[0];

            frame.pixels = frame.pixels.filter(pixel => pixel.color && pixel.position != null);
            feel.isOwner = allOwners.includes(user.toString());
            feel.isSubscribed = subscriptions.some(sub => sub.toString() === _id.toString());
            feel.frames = [frame];

            return feel;
        });
    }

    async cloneFromHistory(params) {
        const {_id} = params;
        const user = this.getUser();
        const historyAPI = this.getApi('history');
        const history = await historyAPI.get(_id);

        if (!history) {
            throw new Error(`Could not find history for ${_id}`);
        }

        return this.Model.cloneFromHistory(history, {user});
    }

    async copy(params) {
        const {_id} = params;
        const user = this.getUser();
        const feel = await this.get(_id);

        return this.Model.copy(feel, {user});
    }

    async sendCarousel(params) {
        const {feels: _ids, data = {}} = params;
        const {devices = [], duration} = data;
        const user = this.getUser();
        const feels = await super.collect({
            query: {
                _id: {$in: _ids}
            }
        });

        const deviceIds = cloneDeep(devices);

        if (feels.length) {
            const deviceAPI = this.getApi('device');
            const historyAPI = this.getApi('history');
            const rooms = [];
            const feel = {
                duration,
                frames: [],
                repeat: true
            };

            feels.forEach(feelInstance => {
                feel.frames.push(...feelInstance.frames);
            })

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

        return;
    }

    async send(params) {
        const {_id, data = {}} = params;
        const {devices = [], users = ['5e7fc4eeed6ac73e8f6e01cf']} = data;
        const user = this.getUser();
        const feel = await this.get(_id);
        const deviceIds = cloneDeep(devices);

        if (feel) {
            const deviceAPI = this.getApi('device');
            const historyAPI = this.getApi('history');
            const rooms = [];
            const userInstance = await this.getUserInstance();

            if (!devices.length) {
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
                socket().to(room).emit('emote', {feel: feel.toObject()});
            });

            if (users.length) {
                const userAPI = this.getApi('user');
                const pushUsers = await userAPI.collect({
                    query: {
                        _id: {$in: users}
                    }
                });

                const pushes = pushUsers.reduce((pushes, user) => {
                    const {push} = user;

                    if (push) {
                        pushes.push(push);
                    }

                    return pushes;
                }, []);

                if (pushes.length) {
                    const {VAPID_SECRET: privateKey, VAPID_PUBLIC_KEY: publicKey} = process.env;

                    webpush.setVapidDetails('mailto:existdissolve@gmail.com', publicKey, privateKey);

                    const image = await feel.toImage();
                    const payload = {
                        title: `${userInstance.name || userInstance.email} sent you a feel!`,
                        image: 'https://feelsbox-push.s3.amazonaws.com/eb16a655-3e5a-4c94-ba22-6d51964e9acc.gif'//`https://feelsbox-server-v2.herokuapp.com/public_images/${image}`
                    };

                    for (const push of pushes) {
                        try {
                            await webpush.sendNotification(push, JSON.stringify(payload));
                        } catch (ex) {
                            const {body, endpoint, headers, message, statusCode} = ex;
                            logger.error('ERROR in webpush', body, endpoint, headers, message, statusCode);
                        }
                    }
                }
            }

            const historyPayload = {
                createdBy: user,
                feelSnapshot: {
                    ...pick(feel, ['duration', 'frames', 'name', 'repeat', 'reverse'])
                }
            };

            for (const deviceId of deviceIds) {
                await historyAPI.add({
                    ...historyPayload,
                    device: deviceId
                });
            }
        }

        return;
    }

    async subscribe(params) {
        const {_id} = params;
        const feel = await this.get(_id);

        if (feel) {
            const {subscriberCount: currentCount} = feel;
            const userAPI = this.getApi('user');
            const subscriberCount = currentCount + 1;

            await userAPI.subscribe({_id});
            await feel.toggleSubscription(true);
        }

        feel.isSubscribed = true;

        return feel;
    }

    async test(params) {
        const userInstance = await this.getUserInstance();
        const defaultDevice = userInstance.get('defaultDevice');

        if (!defaultDevice) {
            throw new Error('Default device hasn\'t been set');
        }

        const deviceAPI = this.getApi('device');
        const device = await deviceAPI.get(defaultDevice);

        if (!device) {
            throw new Error('Could not find device');
        }

        const code = device.get('code');

        socket().to(code).emit('emote', params);
    }

    async unsubscribe(params) {
        const {_id} = params;
        const feel = await this.get(_id);

        if (feel) {
            const {subscriberCount: currentCount} = feel;
            const userAPI = this.getApi('user');
            const subscriberCount = currentCount > 0 ? (currentCount - 1) : 0;

            await userAPI.unsubscribe({_id});
            await feel.toggleSubscription(false);
        }

        feel.isSubscribed = false;

        return feel;
    }
}
