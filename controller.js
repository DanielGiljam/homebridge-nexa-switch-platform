'use strict';

const http = require('http');
const querystring = require('querystring');
const exec = require('child_process').exec;

const logger = require('homebridge/lib/logger').Logger;

module.exports = (config) => {
    new Controller(logger.withPrefix('NexaSwitchPlatform: Controller Server'), config);
};

function Controller(log, config) {
    this.log = log;
    this.config = config;
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
            if (postData.target != null) {
                if (postData.state != null) {
                    let state = (!postData.state);
                    this.log(`Target ${postData.target} was requested to alter into state ${state}`);
                    res.write(`Target ${postData.target} was requested to alter into state ${state}`);
                    exec(`sudo piHomeEasy 0 ${this.config.emitterId} ${postData.target} ${state}`);
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
    this.server.listen(this.config.controllerPort, () => {
        this.log(`Listening on port ${this.config.controllerPort}...`);
    });
}