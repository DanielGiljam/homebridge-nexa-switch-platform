'use strict';

const http = require('http');
const querystring = require('querystring');

module.exports = (port) => {
    const server = http.createServer(RequestHandler);
    server.listen(port, () => {
        console.log(`Listening on port ${port}...`);
    });
};

function RequestHandler(req, res) {
    switch (req.method) {
        case 'GET':
            GetRequestHandler(req, res);
            break;
        case 'POST':
            PostRequestHandler(req, res);
            break;
        default:
            res.writeHead(406);
            res.end();
            break;
    }
}

function GetRequestHandler(req, res) {
    console.log(`Received GET request: ${req.url}`);
    switch (req.url) {
        case '/config':
            const resObject = JSON.stringify({ statusArray: ['on'] }); // TODO: replace example resObject with a real one
            console.log('Responding with configuration object');
            res.write(resObject);
            break;
        default:
            console.warn('No response found for received GET request');
            res.writeHead(406);
            break;
    }
    res.end();
}

function PostRequestHandler(req, res) {
    console.log('Received POST request');
    let reqData = '';
    req.on('data', chunk => {
        reqData += chunk.toString();
    });
    req.on('end', () => {
        const postData = querystring.parse(reqData);
        if (postData.target) {
            if (postData.state) {
                console.log(`Target ${postData.target} was requested to alter into state ${postData.state}`);
                res.write(`Target ${postData.target} was requested to alter into state ${postData.state}`);
            } else {
                console.warn('Incomplete request: a target state was not provided');
                res.writeHead(406, 'Incomplete request: target state was not provided');
            }
        } else {
            console.warn('Incomplete request: a target was not provided');
            res.writeHead(406, 'Incomplete request: a target was not provided');
        }
        res.end();
    });
}