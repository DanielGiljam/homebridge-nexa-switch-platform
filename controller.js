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
        switch (req.method) {
            case 'GET':
                this.GetRequestHandler(req, res);
                break;
            case 'POST':
                this.PostRequestHandler(req, res);
                break;
            default:
                res.writeHead(406);
                res.end();
                break;
        }
    });
    this.server.listen(port, () => {
        this.log(`Listening on port ${port}...`);
    });
}

Controller.prototype.GetRequestHandler = function(req, res) {
    this.log(`Received GET request: ${req.url}`);
    switch (req.url) {
        case '/config':
            const resObject = JSON.stringify({ accessoryInformation: [{
                    name: "Switch",
                    manufacturer: "NEXA",
                    model: "PER-1500",
                    serialNumber: "481-148-592",
                    state: "false"
                }] }); // TODO: replace example resObject with a real one
            // this.log(`Responding with configuration object: ${resObject}`);
            this.log('Responding with configuration object...');
            res.write(resObject);
            break;
        default:
            this.log('No response found for received GET request');
            res.writeHead(406);
            break;
    }
    res.end();
};

Controller.prototype.PostRequestHandler = function(req, res) {
    this.log('Received POST request');
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
};