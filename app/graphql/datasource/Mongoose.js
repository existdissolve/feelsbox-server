import DataLoader from 'dataloader';
import mongoose from 'mongoose';
import {get} from 'lodash';

import BaseAPI from '-/graphql/datasource/Base';

const isValidObjectId = mongoose.Types.ObjectId.isValid;

export default class MongooseAPI extends BaseAPI {
    constructor(model, config = {}) {
        super();

        this.Model = mongoose.model(model);
        this.model = model;
        this.config = config;
        this.loader = new DataLoader(async ids => {
            const results = await this.Model.find({_id: {$in: ids}});
            const idMap = results.reduce((map, doc) => {
                map[doc.id] = doc;

                return map;
            }, {});

            const loaderArray = ids.map(id => idMap[id]);

            return loaderArray;
        });
    }

    async add(params) {
        const payload = get(params, 'data', params);
        const user = this.getUser();
        const userInstance = await this.getUserInstance();
        const opts = {user};

        if (user) {
            payload.createdBy = user;
            payload.owner = user;
        }

        if (userInstance) {
            const {jointAccounts = []} = userInstance;

            jointAccounts.push(user);

            payload.owners = jointAccounts;
        }

        if (typeof this.Model.add === 'function') {
            return this.Model.add(payload, opts);
        } else {
            return this.Model.create(payload);
        }
    }

    async delete(params) {
        const {_id, ...rest} = params;
        const instance = await this.get({_id});
        const opts = {user: this.getUser()};

        if (typeof instance.delete === 'function') {
            return instance.delete(rest, opts);
        } else {
            return instance.remove();
        }
    }

    async edit(params) {
        const {_id, ...rest} = params;
        const instance = await this.get({_id});
        const opts = {new: true, user: this.getUser()};
        const payload = get(rest, 'data', rest);

        if (typeof instance.edit === 'function') {
            return instance.edit(payload, opts);
        } else {
            return this.Model.findByIdAndUpdate(_id, payload, opts);
        }
    }

    isValidId(_id) {
        return isValidObjectId(_id);
    }

    async get(params) {
        const args = this.isValidId(params) ? {_id: params} : params;
        const {_id, opts} = args;
        const {clear} = opts || {};

        if (!this.isValidId(_id)) {
            throw new Error(`ID provided to get() is not a valid ObjectId: ${_id}`);
        }

        if (clear) {
            // if clear is requested, evict any existing instance from dataloader cache so it re-queries
            this.loader.clear(_id);
        }

        const instance = await this.loader.load(_id);

        if (!instance) {
            throw new Error(`${this.model} not found: ${_id}`);
        }

        return instance;
    }

    collect(params) {
        const {query = {}, select} = params;

        return this.Model.find(query, select);
    }
}
