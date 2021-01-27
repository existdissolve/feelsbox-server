import mongoose from 'mongoose';

import {defaultSchemaOptions} from './utils';

const {Schema} = mongoose;
const DeviceGroupSchema = new Schema({
    active: {
        type: Boolean,
        default: true
    },
    devices: [{
        type: Schema.Types.ObjectId,
        ref: 'Device'
    }],
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

DeviceGroupSchema.methods.delete = function() {
    this.active = false;

    return this.save();
}

DeviceGroupSchema.methods.addDevice = async function(deviceId) {
    const Device = mongoose.model('Device');
    const device = await Device.findById(deviceId);

    if (!device) {
        throw new Error(`Could not find device: ${deviceId}`);
    }

    return this.update({
        $addToSet: {
            devices: device
        }
    });
};

DeviceGroupSchema.methods.removeDevice = async function(deviceId) {
    const Device = mongoose.model('Device');
    const device = await Device.findById(deviceId);

    if (!device) {
        throw new Error(`Could not find device: ${deviceId}`);
    }

    return this.update({
        $pull: {
            devices: deviceId
        }
    });
};

module.exports = DeviceGroupSchema;
