import mongoose from 'mongoose';
import {pick} from 'lodash';
import {createCanvas} from 'canvas';
import fs from 'fs-extra';
import {v4 as uuidv4} from 'uuid';
import aws from 'aws-sdk';

import {defaultSchemaOptions} from './utils';

const BLANK_CATEGORY = '000000000000000000000000';
const {Schema} = mongoose;
const transpose = (pixels, definition = {}) => {
    const {start = 0, length = 20} = definition;
    const colCount = 8;
    const range = [];

    let startIdx = start;

    for (let x = 0; x < colCount; x++) {
        startIdx = startIdx + (x === 0 ? 0 : length);

        for (let y = 0; y < colCount; y++) {
            const {color} = pixels[startIdx + y];

            range.push({color, position: (x * colCount) + y});
        }
    }

    return range;
};

const FeelSchema = new Schema({
    active: {
        type: Boolean,
        default: true
    },
    categories: [{
        type: Schema.Types.ObjectId,
        ref: 'Category'
    }],
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
    panorama: {
        height: Number,
        pixels: [{
            _id: false,
            color: String,
            position: Number
        }],
        steps: [{
            _id: false,
            terminal: Number
        }],
        width: Number
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

FeelSchema.methods.toImage = async function() {
    const {AWS_SECRET: secretAccessKey, AWS_ACCESS_ID: accessKeyId} = process.env;
    const frames = this.get('frames');
    const duration = this.get('duration');
    const repeat = this.get('repeat') ? 0 : -1;
    const images = [];
    const s3 = new aws.S3({
        accessKeyId,
        secretAccessKey
    });
    const uid = uuidv4();
    const canvas = createCanvas(160, 160, 'png');
    const ctx = canvas.getContext('2d');
    const frame = frames.find(frame => frame.isThumb) || frames[0];

    const squareSize = 20;
    const {pixels = []} = frame;

    let position = 0;

    for (let i = 0; i < 8; i++) {
        for (let x = 0; x < 8; x++) {
            const xOffset = x * squareSize;
            const yOffset = i * squareSize;
            const pixel = pixels.find(px => px.position === position) || {};
            const {color = '000000'} = pixel;

            ctx.fillStyle = `#${color}`;
            ctx.fillRect(xOffset, yOffset, squareSize, squareSize);

            position++;
        }
    }

    const fileName = await new Promise((resolve, reject) => {
        return s3.upload({
            Bucket: 'feelsbox-push',
            Key: `${uid}.png`,
            Body: canvas.toBuffer(),
            ContentEncoding: 'base64',
            ContentType: 'image/png',
            ACL:'public-read'
        }, (err, data) => {
            if (err) {
                throw err;
            } else {
                resolve(data.Location)
            }
        })
    });

    return fileName;
};

FeelSchema.methods.isPanorama = function() {
    const pixels = this.get('panorama.pixels') || [];

    return pixels.length;
};

FeelSchema.methods.stepsToFrames = function() {
    const {height, pixels, steps, width} = this.get('panorama');
    const frames = steps.map(step => {
        const {terminal} = step;
        const definition = {start: terminal, length: width};

        return transpose(pixels, definition);
    });
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
        categories: [BLANK_CATEGORY],
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
    const userInstance = await User.findById(user);
    const {jointAccounts = []} = userInstance;

    jointAccounts.push(user);

    payload.createdBy = user;
    payload.private = true;
    payload.owner = user;
    payload.owners = jointAccounts;
    payload.categories = [BLANK_CATEGORY];

    return this.create(payload);
};

export default FeelSchema;
