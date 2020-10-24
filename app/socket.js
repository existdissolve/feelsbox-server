import socketio from 'socket.io';

let socket;

export const init = server => {
    socket = socketio(server);
};

export default () => {
    return socket;
};