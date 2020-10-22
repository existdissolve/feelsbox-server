import mongoose from 'mongoose';

import {defaultSchemaOptions} from './utils';

const {Schema} = mongoose;
const UserSchema = new Schema({
    email: {
        type: String,
        unique: true
    },
    name: String,
    photo: String,
    provider: {
        type: String,
        enum: ['facebook', 'google']
    },
    subscriptions: [{
        type: Schema.Types.ObjectId,
        ref: 'Feel'
    }]
}, defaultSchemaOptions);

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
