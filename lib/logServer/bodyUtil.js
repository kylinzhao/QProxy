/**
 * Created by Ellery1 on 16/5/24.
 */
var zlib = require('zlib'),
    Promise = require('bluebird');

function unzipBody(stream) {

    var buffers = [], size = 0;
    return new Promise(function (resolve, reject) {

        stream
            .on('data', function (chunk) {
                
                buffers.push(chunk);
                size += chunk.length;
            })
            .on('end', function () {

                var encoding = stream.headers['content-encoding'],
                    buf = Buffer.concat(buffers, size);

                if (encoding === 'gzip') {

                    zlib.gunzip(buf, function (err, data) {

                        if (!err) {

                            resolve(data.toString());
                        }
                        else {

                            reject(err);
                        }
                    });
                }
                else if (encoding === 'deflate') {

                    zlib.inflate(buf, function (err, data) {

                        if (!err) {

                            resolve(data.toString());
                        }
                        else {

                            reject(err);
                        }
                    });
                }
                else {

                    resolve(buf.toString());
                }
            })
            .on('error', function (err) {

                reject(err);
            });
    });
}

function _extractJSON(jsonStr) {

    var rjson = /(?:^|\()\s*(\{(.|[\n\r])*}|\[(.|[\n\r])*])/;
    var mjson = jsonStr.match(rjson);

    if (mjson) {

        try {

            return JSON.parse(mjson[1]);
        }
        catch (e) {

            return "not a valid json";
        }
    }

    return "not a valid json";
}

function parseBody(body) {

    return {raw: body, json: _extractJSON(body)};
}

module.exports = {
    unzipBody: unzipBody,
    parseBody: parseBody
};