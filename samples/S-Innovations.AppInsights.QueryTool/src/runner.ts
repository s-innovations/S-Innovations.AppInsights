

import phantom = require('phantom');
import websocket = require('websocket');
import http = require("http");
import fs = require("fs");
import { Logger } from "./Logging/Logger";



declare module "phantom" {

    interface WebPage {
        evaluateJavaScript<R>(str: string): Promise<R>;

    }
}


var onConsoleMessage = function (msg: string) {

    console.log(msg);

}
var onConsoleError = function (msg: string) {

    console.log(msg);

}

export default function <T, T2>(option: { host: string, options: any }, callback: (err: string, success?: T) => void) {
    let logger = new Logger();
    logger.logInfo("Node Runner is initializing for {url}", option.host);
    let all = phantom.create().then(instance =>
        instance.createPage().then(page => {
            logger.logInfo("Node Runner Page created for {url}", option.host);
            var WebSocketServer = websocket.server;
            var server = http.createServer(function (request, response) {
                // process HTTP request. Since we're writing just WebSockets server
                // we don't have to implement anything.
            });
            server.listen(1337, function () { });

            // create the server
            let wsServer = new WebSocketServer({
                httpServer: server
            });

            let wait = new Promise<T2>((resolve, reject) => {
               
                page.property('viewportSize', { width: 2000, height: 1000 });

                page.property('onConsoleMessage', onConsoleMessage);
                page.property('onError', onConsoleMessage);

                wsServer.on('request', function (request) {
                    var connection = request.accept(null, request.origin);
                    logger.logInfo("Node Runner[{url}]: Websocket connection opened for {origin}", option.host, request.origin);

                    connection.on('message', function (message) {
                        if (message.type === 'utf8') {
                            // process WebSocket message

                            let event = JSON.parse(message.utf8Data);

                            switch (event.type) {
                                case "CHANGE_VIEWPORT_SIZE":

                                    page.property('viewportSize', event.data).then(() => {
                                        if (event.id) {
                                            connection.send(JSON.stringify({ id: event.id }));
                                        }
                                    });

                                    break;
                                case "PAGE_RENDER":
                                    page.render(event.data.path).then(() => {
                                        if (event.id) {
                                            connection.send(JSON.stringify({ id: event.id }));
                                        }
                                    });

                                    break;
                                case "READ_FILE":

                                    fs.readFile(event.data.path, event.data.encoding || 'utf8', (err, data) => {

                                        console.log("read file");
                                        console.log(err);
                                        console.log(data);
                                        if (event.id) {

                                            connection.send(JSON.stringify({ id: event.id, data: data, err: err }));
                                        }
                                    });

                                    break;
                                case "WRITE_FILE":


                                    fs.writeFile(event.data.path, event.data.content, function (err) {
                                        if (err) {
                                            console.log(err);
                                        } else {
                                            console.log("The file was saved!");
                                        }


                                        if (event.id) {
                                            connection.send(JSON.stringify({ id: event.id }));
                                        }

                                    });

                                    break;
                                case "LOADED":

                                    logger.logInfo(`Client Loaded`);

                                    if (event.id) {
                                        connection.send(JSON.stringify({ id: event.id, data: option.options}));
                                    }


                                    break;

                                case "COMPLETE":
                                    setTimeout(() => {

                                        resolve(event.data);

                                    }, 0);
                                    break;
                                case "FAIL":
                                    setTimeout(() => {
                                        resolve(event.data);
                                    }, 0);
                            }
                        }


                    });

                    connection.on('close', function (connection) {
                        // close user connection
                        console.log("HostRunner websocket connection closed");
                    });
                });
                logger.logInfo("Node Runner Page  Opening {url}", option.host);
                page.open(option.host).then(status => {
                    logger.logInfo("Node Runner Page Opened with {status} for {url} ", status, option.host);
                    if (status === "success") {

                    }

                });
            });

            return wait.then((data) => {
                console.log("Exit");
                page.close();
                instance.exit();

                wsServer.closeAllConnections();
                server.close();


                return data;
            }, err => {
                console.log("Exit");
                console.log(err);
                callback(err, null);
            });

        }));



    all.then(callback.bind(callback, null), callback);

}