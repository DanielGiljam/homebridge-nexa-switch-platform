'use strict';

const http = require('http');
const querystring = require('querystring');

const logger = require('homebridge/lib/logger').Logger;

module.exports = port => {
    new Controller(logger.withPrefix('NexaSwitchPlatform: Controller Server'), port);
};

function Controller(log, port) {
    this.log = log;
    this.server = http.createServer((req, res) => {
        this.log('Received a request');
        if (req.method !== 'POST') {
            this.log('Request invalid and ignored');
            res.writeHead(406);
            res.end();
            return;
        }
        let reqData = '';
        req.on('data', chunk => {
            reqData += chunk.toString();
        });
        req.on('end', () => {
            const postData = querystring.parse(reqData);
            if (postData.target) {
                if (postData.state) {
                    this.log(`Target ${postData.target} was requested to alter into state ${postData.state}`);
                    res.write(`Target ${postData.target} was requested to alter into state ${postData.state}`);
                } else {
                    this.log('Incomplete request: a target state was not provided');
                    res.writeHead(406, 'Incomplete request: target state was not provided');
                }
            } else {
                this.log('Incomplete request: a target was not provided');
                res.writeHead(406, 'Incomplete request: a target was not provided');
            }
            res.end();
        });
    });
    this.server.listen(port, () => {
        this.log(`Listening on port ${port}...`);
    });
}