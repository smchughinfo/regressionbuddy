require(`./globals.js`).initialize();

const builder = require(`./builder.js`);
const server = require(`./server.js`);

builder.buildAll();
server.start();