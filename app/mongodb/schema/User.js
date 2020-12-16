import mongoose from 'mongoose';

import {defaultSchemaOptions} from './utils';

const {Schema} = mongoose;
const UserSchema = new Schema({
    defaultDevice: {
        type: Schema.Types.ObjectId,
        ref: 'Device'
    },
    email: {
        type: String,
        unique: true
    },
    jointAccounts: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    name: String,
    photo: String,
    push: {
        endpoint: String,
        expirationTime: String,
        keys: {
            p256dh: String,
            auth: String
        }
    },
    provider: {
        type: String,
        enum: ['facebook', 'google']
    },
    subscriptions: [{
        type: Schema.Types.ObjectId,
        ref: 'Feel'
    }]
}, defaultSchemaOptions);

UserSchema.methods.setDefaultDevice = function(_id) {
    const payload = {defaultDevice: _id};

    return this.update(payload);
};

UserSchema.methods.subscribeToPush = function(opts) {
    const {push} = data;

    return this.update({
        $set: {push}
    });
}

UserSchema.methods.toggleSubscription = function(_id, subscribe) {
    return this.update({
        ...subscribe && {
            $addToSet: {
                subscriptions: _id
            }
        },
        ...!subscribe && {
            $pull: {
                subscriptions: _id
            }
        }
    })
};

module.exports = UserSchema;
