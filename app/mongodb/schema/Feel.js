import mongoose from 'mongoose';
import {pick} from 'lodash';

import {defaultSchemaOptions} from './utils';

const BLANK_CATEGORY = '000000000000000000000000';
const {Schema} = mongoose;

const FeelSchema = new Schema({
    active: {
        type: Boolean,
        default: true
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: 'Category'
    },
    duration: {
        type: Number,
        default: 1000
    },
    frames: [{
        _id: false,
        active: {
            type: Boolean,
            default: true
        },
        brightness: {
            type: Number,
            default: 100
        },
        duration: Number,
        isThumb: {
            type: Boolean,
            default: false
        },
        pixels: [{
            _id: false,
            color: String,
            position: Number
        }]
    }],
    global: {
        type: Boolean,
        default: false
    },
    name: String,
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    owners: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    private: {
        type: Boolean,
        default: true
    },
    repeat: {
        type: Boolean,
        default: false
    },
    reverse: {
        type: Boolean,
        default: false
    },
    subscriberCount: {
        type: Number,
        default: 0
    }
}, defaultSchemaOptions);

FeelSchema.methods.delete = async function() {
    this.active = false;

    return this.save();
}

FeelSchema.methods.toggleSubscription = function(subscribe) {
    const currentCount = this.get('subscriberCount');

    return this.update({
        ...subscribe && {
            $inc: {
                subscriberCount: 1
            }
        },
        ...!subscribe && currentCount && {
            $inc: {
                subscriberCount: -1
            }
        }
    })
};

FeelSchema.statics.cloneFromHistory = async function(history, opts = {}) {
    const {user} = opts;
    const {feelSnapshot} = history;
    const User = mongoose.model('User');
    const userInstance = await User.get(user);
    const {jointAccounts = []} = userInstance;
    const payload = {
        ...feelSnapshot,
        active: true,
        category: BLANK_CATEGORY,
        createdBy: user,
        owner: user,
        owners: jointAccounts.push(user),
        private: true
    };

    return this.create(payload);
}

FeelSchema.statics.copy = async function(feel, opts = {}) {
    const {user} = opts;
    const payload = pick(feel, ['active', 'duration', 'frames', 'name', 'repeat', 'reverse']);
    const User = mongoose.model('User');
    const userInstance = await User.get(user);
    const {jointAccounts = []} = userInstance;

    payload.createdBy = user;
    payload.private = true;
    payload.owner = user;
    payload.owners = jointAccounts.push(user);
    payload.category = BLANK_CATEGORY;

    return this.create(payload);
};

export default FeelSchema;
