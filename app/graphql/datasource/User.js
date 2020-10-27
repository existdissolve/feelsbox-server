import MongooseAPI from '-/graphql/datasource/Mongoose';

export default class UserAPI extends MongooseAPI {
    constructor() {
        super('User');
    }

    async login(params) {
        const {email} = params;
        const user = await this.Model.findOne({email});

        if (user) {
            const {user: authenticatedUser} = await this.context.authenticate("graphql-local", {email});

            await this.context.login(authenticatedUser);
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

    async unsubscribe(params) {
        const {_id} = params;
        const userInstance = await this.getUserInstance();

        if (!userInstance) {
            return;
        }

        return userInstance.toggleSubscription(_id, false);
    }
}
