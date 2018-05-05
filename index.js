import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import http from 'http';
import socketio from 'socket.io';
import firebase from 'firebase';
import pg from 'pixel-getter';
import {rgbaToHex} from 'hex-and-rgba';
import Busboy from 'busboy';
import {firebaseConfig, user} from './config';

const app = express();
app.use(cors());
app.use(bodyParser.json());
const server = http.createServer(app);
const io = socketio(server);
const port = process.env.PORT || 3000;
let data = {};

const refreshData = () => {
    var feelings = firebase.database().ref('feelings').once('value').then(snapshot => {
        data = snapshot.val()
        console.log('Data is ready to go!');
    });
};

firebase.initializeApp(firebaseConfig);
firebase.auth().signInWithEmailAndPassword(user.email, user.password);
firebase.auth().onAuthStateChanged(user => {
    if (user) {
        refreshData();
    }
});

app.post('/upload', (req, res) => {
    const busboy = new Busboy({ headers: req.headers });
    const feel = {};
    let name;
    let category;
    console.log('uploading!!!')

    busboy.on('field', function (fieldname, val) {
        if (fieldname === 'emoji') {
            name = val;
        }
        if (fieldname === 'category') {
            category = val;
        }
    });

    busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
        const buffers = [];

        file.on('data', buffer => {
            buffers.push(buffer);
        });

        file.on('end', function() {
            const buffer = Buffer.concat(buffers);

            pg.get(buffer, function(err, pixels) {
                if (Array.isArray(pixels)) {
                    const frame = pixels[0];
                    if (frame.length === 64) {
                        frame.forEach((item, index) => {
                            const  {r, g, b, a} = item;

                            if (a) {
                                let hex = rgbaToHex(r, g, b, 255).replace('fe01', '');
                                hex = hex.replace('#', '');
                                feel[index + 1] = {
                                    c: hex
                                }
                            }
                        });
                    }
                }
            }, 1);
        });
    });

    busboy.on('finish', function() {
        setTimeout(() => {
            if (Object.keys(feel).length && name) {
                // save some stuff
                const newKey = `feelings/${name}`;

                firebase.database().ref().update({
                    [newKey]: {
                        category,
                        pixels: feel
                    }
                }).then(result => {
                    refreshData();
                    res.end('File has finished uploading successfully!');
                }).catch(err => {
                    res.end('Huh, something went wrong. <works on my machine>');
                });
            } else {
                res.end('File could not be uploaded. Sorry for that.');
            }
        }, 3000);
    });

    req.pipe(busboy);
});

app.get('/emote/:feeling', (req, res) => {
    const {feeling} = req.params;
    const raw = data[feeling];
    const diagram = [];
    const pixels = raw.pixels;

    Object.keys(pixels).forEach((item, index) => {
        diagram.push({
            i: item,
            c: pixels[item].c
        });
    });

    if (diagram) {
        io.emit('emote', diagram);
    }

    res.send('it worked');
});

app.post('/emote/pixels', (req, res) => {
    const pixels = req.body;
    const diagram = [];

    Object.keys(pixels).forEach(item => {
        diagram.push({
            i: item,
            c: pixels[item].c
        });
    });

    if (diagram.length) {
        io.emit('emote', diagram);
    }

    res.send(diagram);
});

app.get('/stop', (req, res) => {
    io.emit('stop');
    res.send('');
});

app.get('/weather', (req, res) => {
    io.emit('weather');
    res.send('');
});

io.on('connection', socket => {
    console.log('a user connected');
});

server.listen(port, () => {
    console.log('listening on *:3000');
});