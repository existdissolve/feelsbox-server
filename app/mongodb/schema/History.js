import mongoose from 'mongoose';

import {defaultSchemaOptions} from './utils';

const {Schema} = mongoose;

const HistorySchema = new Schema({
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    device: {
        type: Schema.Types.ObjectId,
        ref: 'Device'
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
    name: String,
    repeat: {
        type: Boolean,
        default: false
    },
    reverse: {
        type: Boolean,
        default: false
    }
}, {
    collection: 'history',
    ...defaultSchemaOptions
});

export default HistorySchema;
