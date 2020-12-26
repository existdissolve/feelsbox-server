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
    friends: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
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

UserSchema.methods.getPushFriends = function() {
    const User = mongoose.model('User');
    const friends = this.get('friends');

    return User.find({
        _id: {$in: friends},
        'push.endpoint': {$exists: true}
    });
};

UserSchema.methods.getSubscriptions = async function() {
    const mySubscriptions = (this.get('subscriptions') || []).slice();
    const jointAccounts = this.get('jointAccounts') || [];

    if (jointAccounts.length) {
        const User = mongoose.model('User');
        const coOwners = await User.find({_id: {$in: jointAccounts}});
        const coSubscriptions = coOwners.reduce((subscriptions, user) => {
            const theirSubscriptions = user.get('subscriptions') || [];

            subscriptions.push(...theirSubscriptions);

            return subscriptions;
        }, []);

        mySubscriptions.push(...coSubscriptions);
    }

    return mySubscriptions;
}

UserSchema.methods.setDefaultDevice = function(_id) {
    const payload = {defaultDevice: _id};

    return this.update(payload);
};

UserSchema.methods.subscribeToPush = function(data) {
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
