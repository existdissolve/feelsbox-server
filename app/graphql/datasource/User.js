import logger from 'bristol';
import palin from 'palin';

import MongooseAPI from '-/graphql/datasource/Mongoose';

logger.addTarget('console').withFormatter(palin);

export default class UserAPI extends MongooseAPI {
    constructor() {
        super('User');
    }

    async login(params) {
        const {email} = params;
        const user = await this.Model.findOne({email});

        if (user) {
            try {
                const {user: authenticatedUser} = await this.context.authenticate("graphql-local", {email});

                await this.context.login(authenticatedUser);
            } catch (ex) {
                logger.error(ex);
            }
        }

        return !!user;
    }

    async setDefaultDevice(params) {
        const {_id} = params;
        const userInstance = await this.getUserInstance();

        if (!userInstance) {
            return;
        }

        return userInstance.setDefaultDevice(_id);
    }

    async subscribe(params) {
        const {_id} = params;
        const userInstance = await this.getUserInstance();

        if (!userInstance) {
            return;
        }

        return userInstance.toggleSubscription(_id, true);
    }

    async subscribeToPush(params) {
        const userInstance = await this.getUserInstance();

        if (!userInstance) {
            return;
        }

        return userInstance.subscribeToPush(params);
    }

    async unsubscribe(params) {
        const {_id} = params;
        const userInstance = await this.getUserInstance();

        if (!userInstance) {
            return;
        }

        return userInstance.toggleSubscription(_id, false);
    }
}
