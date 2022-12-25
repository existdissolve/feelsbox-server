import {createCanvas} from 'canvas';

export const pixelsToImage = (pixels, opts = {}) => {
    const {canvasSize = 160, squareSize = 20} = opts;
    const canvas = createCanvas(canvasSize, canvasSize, 'png');
    const ctx = canvas.getContext('2d');

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

    return canvas.toBuffer();
};
