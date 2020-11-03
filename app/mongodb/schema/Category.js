import mongoose from 'mongoose';

import {defaultSchemaOptions} from './utils';

const {Schema} = mongoose;
const CategorySchema = new Schema({
    active: {
        type: Boolean,
        default: true
    },
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
    }]
}, defaultSchemaOptions);

module.exports = CategorySchema;
