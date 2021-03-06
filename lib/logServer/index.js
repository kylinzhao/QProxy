/**
 * Created by Ellery1 on 16/5/24.
 */
var io = require('socket.io'),
    app = require('express')(),
    http = require('http').createServer(app),
    wsServer = io(http),
    URL = require('url'),
    unzipBody = require('./bodyUtil').unzipBody,
    parseBody = require('./bodyUtil').parseBody;

function queryToObj(queryStr) {

    return queryStr.split('&').reduce(function (acc, query) {

        var splitQuery = query.split('=');
        acc[splitQuery[0]] = splitQuery[1];
        return acc;
    }, {});
}

function sendLog(req, res, bodies) {

    var parsedUrl = req.url ? URL.parse(req.url) : "",
        parsedQuery = {};

    if (parsedUrl.query) {

        parsedQuery = queryToObj(parsedUrl.query);
    }

    wsServer.sockets.emit('log', {
        request: {
            headers: req.headers,
            body: bodies[0].json,
            raw: bodies[0].raw,
            query: parsedQuery
        },
        response: {
            headers: res.headers,
            body: bodies[1].json,
            raw: bodies[1].raw
        },
        statusCode: res.statusCode,
        method: req.method,
        url: req.url,
        time: new Date().toString(),
        parsedUrl: parsedUrl
    });
}

function Logger() {

    this.req = null;
    this.res = null;
    this.rets = [];
}

Logger.prototype = {
    collect: function (stream, type, noBody) {

        var self = this;

        if (type === 'req') {

            this.req = stream;
        }
        else if (type === 'res') {

            this.res = stream;
        }

        if (!noBody) {

            unzipBody(stream).then(function (ret) {

                self.rets.push(parseBody(ret));

                if (self.rets.length === 2) {

                    sendLog(self.req, self.res, self.rets);
                }
            });
        }
        else {

            self.rets.push("");
        }
        return this;
    }
};

module.exports = {
    wsServer: wsServer,
    Logger: Logger
};

