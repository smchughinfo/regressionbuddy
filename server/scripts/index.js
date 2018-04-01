require(`./globals.js`).initialize();

const builder = require(`./builder.js`);
const server = require(`./server.js`);

builder.build();
server.start();
// hello github