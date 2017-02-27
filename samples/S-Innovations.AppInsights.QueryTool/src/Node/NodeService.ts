
import { Logger } from "../Logging/Logger";


declare global {
    interface Window {
        //callPhantom: Function;
        WebSocket: any;
        MozWebSocket: any;
    }
}

export class Defer<T>{
    resolve: (data?: T) => void;
    reject: (Error: string) => void;
    promise = new Promise<T>((resolve, reject) => { this.resolve = resolve; this.reject = reject });
}




function generateUUID() {
    var d = new Date().getTime();
    if (window.performance && typeof window.performance.now === "function") {
        d += performance.now();; //use high-precision timer if available
    }
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
}
const logger = new Logger();
export class Transport {
    private connection: WebSocket;
    private tasks: { [key: string]: Defer<any> } = {};
    
    constructor() {


       
    }

    static create() {
       
        return new Promise<Transport>((resolve, reject) => {
            logger.logInfo("Creating NodeService Transport");
  
            var transport = new Transport();
            

            // if user is running mozilla then use it's built-in WebSocket
            window.WebSocket = window.WebSocket || window.MozWebSocket;

            transport.connection = new WebSocket('ws://127.0.0.1:1337');

            transport.connection.onopen = () => {

                resolve(transport);
                // connection is opened and ready to use
                //let id = generateUUID();
                //logger.logInfo("Defining main with id={id} ",id);  
                
                //define(id, ["module"], (module: RequireModule) => {

                //    let config = module.config();

                //    console.log("MAIN RUNNING " + JSON.stringify(config));

                //});
                

            };

            transport.connection.onerror = function (error) {
                // an error occurred when sending/receiving data
            };

            transport.connection.onmessage = (message) => {
                // try to decode json (I assume that each message from server is json)
                try {
                    var json = JSON.parse(message.data);
                    if (json.id in transport.tasks) {
                        transport.tasks[json.id].resolve(json.data);
                    }
                } catch (e) {
                    console.log('This doesn\'t look like a valid JSON: ', message.data);
                    return;
                }
                // handle incoming message
            };
        });
    }


    sendCompleteMessae(data: any) {
        return this.sendWebSocketEvent("COMPLETE",data);
    }

    sendWebSocketEvent(type: string, data?: any) {
        let id = generateUUID();
        let task = {
            id: id,
            type: type,
            data: data,

        };


        this.connection.send(JSON.stringify(task));
        this.tasks[id] = new Defer<any>();
        return this.tasks[id].promise;
    }
}