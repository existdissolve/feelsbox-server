import {get} from 'lodash';

import MongooseAPI from '-/graphql/datasource/Mongoose';

export default class MessageAPI extends MongooseAPI {
    constructor() {
        super('Message');
    }

    async collect(params) {
        const user = this.getUser();

        params.query = {
            recipient: user
        };
        params.sort = {
            createdAt: -1
        };
        params.limit = 50

        return super.collect(params);
    }

    add(params) {
        return this.Model.create(params);
    }
}
