import mongoose from 'mongoose';
import {get} from 'lodash';
import logger from 'bristol';

import CategorySchema from '-/mongodb/schema/Category';
import DeviceSchema from '-/mongodb/schema/Device';
import DeviceGroupSchema from '-/mongodb/schema/DeviceGroup';
import FeelSchema from '-/mongodb/schema/Feel';
import HistorySchema from '-/mongodb/schema/History';
import MessageSchema from '-/mongodb/schema/Message';
import UserSchema from '-/mongodb/schema/User';

const initializeModels = () => {
    mongoose.model('Category', CategorySchema);
    mongoose.model('Device', DeviceSchema);
    mongoose.model('DeviceGroup', DeviceGroupSchema);
    mongoose.model('Feel', FeelSchema);
    mongoose.model('History', HistorySchema);
    mongoose.model('Message', MessageSchema);
    mongoose.model('User', UserSchema);
}

export const connect = async(keepTrying = true) => {
    const connectionString = process.env.MONGODB_CONNECTION_STRING;

    mongoose.connect(connectionString, {
        autoReconnect: true,
        keepAlive: 30000,
        connectTimeoutMS: 30000,
        useNewUrlParser: true
    });

    const {connection} = mongoose;

    connection.on('error', err => {
        logger.warn('MongoDb', `Error in connection: ${err}`);

        mongoose.disconnect();
    });

    connection.on('connected', () => {
        logger.info('MongoDb connected successfully');

        initializeModels();
    });

    connection.on('disconnected', () => {
        logger.info('MongoDb', 'disconnected');
    });
};