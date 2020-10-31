import socketio from 'socket.io';

let instance;

export const init = server => {
    instance = socketio(server);
    instance.sockets.on('connection', socket => {
        socket.on('joinroom', room => {
            console.log('room', room);
            socket.join(room);
        });
    });
};

export default () => {
    return instance;
};