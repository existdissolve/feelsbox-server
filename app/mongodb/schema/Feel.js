import mongoose from 'mongoose';

import {defaultSchemaOptions} from './utils';

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
    duration: Number,
    frames: [{
        _id: false,
        active: {
            type: Boolean,
            default: true
        },
        brightness: {
            type: Number,
            default: 1
        },
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

export default FeelSchema;
