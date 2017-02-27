export class Logger {
    logInfo(msg: string, ...params: any[]) {
        let i = 0;
        msg = msg.replace(/\{(.+?)\}/g, (m, key) => {
            return params[i++];
        });
        console.log(msg);
    }
}