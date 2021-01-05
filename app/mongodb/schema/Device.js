import mongoose from 'mongoose';
import moment from 'moment';
import crs from 'crypto-random-string';

import {defaultSchemaOptions} from './utils';

const {Schema} = mongoose;
const DeviceSchema = new Schema({
    access: [{
        _id: false,
        permissions: {
            type: [String],
            enum: ['EMOTER', 'OWNER']
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    accessCodes: [{
        _id: false,
        code: Number,
        expiration: Date
    }],
    activation: Date,
    capabilities: {
        messages: {
            type: Boolean,
            default: false
        },
        updates: {
            type: Boolean,
            deafult: false
        }
    },
    code: {
        type: String,
        unique: true
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

DeviceSchema.methods.edit = function(data) {
    const {name, removals = []} = data;
    const payload = {
        $set: {name},
        ...removals.length && {
            $pull: {
                'access.user': {$in: removals}
            }
        }
    }

    return this.update(payload);
};

DeviceSchema.methods.generateCode = async function() {
    const Device = mongoose.model('Device');

    for (let x = 0; x < 10; x++) {
        const code = crs({length: 8, type: 'numeric'});
        // make sure it doesn't exist
        const doesCodeExist = await Device.exists({'accessCodes.code': code});

        if (!doesCodeExist) {
            await this.update({
                $push: {
                    accessCodes: {
                        code,
                        expiration: moment().utc().add(2, 'weeks')
                    }
                }
            });

            return code;
        }
    }

    throw new Error('Could not generate access code!');
};

DeviceSchema.methods.setPermissions = async function(data) {
    const {permissions = [], user} = data;

    if (!permissions.length) {
        return this.update({
            $pull: {
                access: {user}
            }
        });
    } else {
        const access = this.get('access');
        const perms = access.find(item => item.user.toString() === user);

        if (!perms) {
            access.push(data);
        } else {
            perms['permissions'] = permissions;
        }

        return this.save();
    }
};

DeviceSchema.statics.submitCode = async function(code, opts = {}) {
    const {user} = opts;
    const error = new Error('Access code is not valid');
    // find the device by access code, but make sure the requesting user isn't also the owner or already authorized
    const device = await this.findOne({
        'access.user': {$ne: user},
        'accessCodes.code': code,
        owners: {$ne: user}
    });

    if (!device) {
        throw error;
    }

    const codes = device.get('accessCodes');
    // make sure access code is real
    const accessCode = codes.find(item => item.code === code);

    if (!accessCode) {
        throw error;
    }

    const {expiration} = accessCode;
    const now = moment().utc();
    const isExpired = moment(expiration).isBefore(now);

    if (isExpired) {
        throw error;
    }

    await device.update({
        $push: {
            access: {user}
        }
    });

    return;
};

module.exports = DeviceSchema;
