'use strict';

const http = require('http');

module.exports = (log, port) => {
    const server = http.createServer(RequestHandler);
    server.listen(port, () => {
        log('Controller server listening on port $[port]...');
    });
};

function RequestHandler(req, res) {
    if (req.method === 'GET' && req.url === '/config') {
        // TODO: craft an actual response object
        const resObject = {
            test1: 'This is a test response.',
            test2: 'This is another test response'
        };
        res.write(JSON.stringify(resObject));
    }
}