import socketio from 'socket.io';
import logger from 'bristol';
import palin from 'palin';

let instance;
logger.addTarget('console').withFormatter(palin);

export const init = server => {
    instance = socketio(server);
    instance.sockets.on('connection', socket => {
        socket.on('joinroom', (room, ip, version) => {
            logger.info('room', room);
            socket.join(room);
            logger.info('IP/Version', ip, version);
        });
    });
};

export default () => {
    return instance;
};