import express from 'express';
import http from 'http';
import socketio from 'socket.io';
import firebase from 'firebase';
import {firebaseConfig, user} from './config';

const app = express();
const server = http.createServer(app);
const io = socketio(server);
const port = process.env.PORT || 3000;
let data = {};

firebase.initializeApp(firebaseConfig);
firebase.auth().signInWithEmailAndPassword(user.email, user.password);
firebase.auth().onAuthStateChanged(user => {
    if (user) {
        // user is signed in
        var feelings = firebase.database().ref('feelings').once('value').then(snapshot => {
            data = snapshot.val()
            console.log('Data is ready to go!');
        });
    }
});

app.get('/emote/:feeling', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,contenttype');
    res.setHeader('Access-Control-Allow-Credentials', true);
    const {feeling} = req.params;
    const raw = data[feeling];
    const diagram = [];

    Object.keys(raw).forEach((item, index) => {
        diagram.push({
            i: item,
            color: raw[item].c
        });
    });

    if (diagram) {
        io.emit('emote', diagram);
    }

    res.send('it worked');
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