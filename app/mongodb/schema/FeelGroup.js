import mongoose from 'mongoose';

import {defaultSchemaOptions} from './utils';

const {Schema} = mongoose;

const FeelGroupSchema = new Schema({
    active: {
        type: Boolean,
        default: true
    },
    duration: {
        type: Number,
        default: 1000
    },
    feels: [{
        type: Schema.Types.ObjectId,
        ref: 'Feel'
    }],
    name: String,
    owners: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }]
}, defaultSchemaOptions);

FeelGroupSchema.methods.delete = async function() {
    this.active = false;

    return this.save();
}

export default FeelGroupSchema;
