const http = require('http');
const querystring = require('querystring');

const controller = require('./controller');

controller(51927);

const reqOptions = {
    hostname: 'localhost',
    port: 51927,
    path: '/config',
    method: 'GET'
};

const req = http.request(reqOptions, res => {
    let data = `Response status code: ${res.statusCode} –> ${res.statusMessage}\n`;
    res.on('data', chunk => {
        data += chunk.toString() + `\n`;
    });
    res.on('end', () => {
        data += 'No more data in response.';
        console.log(data);
    });
});

req.on('error', error => {
    console.error(`Problem with request: ${error.message}`);
});

req.end();

reqContent2 = querystring.stringify({
    target: 1,
    state: 'on'
});

const reqOptions2 = {
    hostname: 'localhost',
    port: 51927,
    method: 'POST',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(reqContent2)
    }
};

const req2 = http.request(reqOptions2, res => {
    let data = `Response status code: ${res.statusCode} –> ${res.statusMessage}\n`;
    res.on('data', chunk => {
        data += chunk.toString() + `\n`;
    });
    res.on('end', () => {
        data += `No more data in response.`;
        console.log(data);
    });
});

req2.on('error', error => {
    console.error(`Problem with request: ${error.message}`);
});

req2.write(reqContent2);

req2.end();