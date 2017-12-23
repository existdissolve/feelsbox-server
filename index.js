import express from 'express';
import http from 'http';
import socketio from 'socket.io';

import feelings from './feelings';

const app = express();
const server = http.createServer(app);
const io = socketio(server);
const port = process.env.PORT || 3000;

app.get('/emote/:feeling', (req, res) => {
    const {feeling} = req.params;
    const diagram = feelings[feeling];

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