
import { KoLayout } from "kolayout";
import * as ko from "knockout";

import * as name from "template!./templates/rootlayout.html";

import { C3GraphLayout } from "./C3/C3GraphLayout";
import { Transport, Defer } from "./Node/NodeService";


export class RootLayout extends KoLayout {

    graph = new C3GraphLayout({
        id: "test", chartType: "line", title: "My Awesome Graph", onRendered: this.graphRendered.bind(this)
    });

    onNextRenderTimeout = 0;
    onNextRender: Defer<void>;
    graphRendered() {
        console.log("GraphRendered" + this.onNextRender);
        if (this.onNextRender) {
            clearTimeout(this.onNextRenderTimeout);
            this.onNextRenderTimeout = window.setTimeout(() => {
                this.onNextRender.resolve();
                this.onNextRender = null;
            }, 100);
        }
    }
    renderGraph(options: { appId: string, appKey: string, query: string }) {
        return this._rendered.promise.then(() => new Promise((resolve, reject) => {
            let hr = new XMLHttpRequest();
            hr.onreadystatechange = () => {
                if (hr.readyState == XMLHttpRequest.DONE) {
                    let data = JSON.parse(hr.responseText);
                    console.log(data);

                    // let columns = data["Tables"][0]["Columns"].map((c:any) => c["ColumnName"]);
                    let time = data["Tables"][0]["Rows"].map((row: [string, number]) => row[0]) as Array<number | string>;
                    let x = data["Tables"][0]["Rows"].map((row: [string, number]) => row[1]) as Array<number | string>;
                    x.unshift("queueLenght");
                    time.unshift("x");

                    this.onNextRender = new Defer<void>();
                    this.graph.chart.load({

                        columns: [
                            x,
                            time
                        ],
                      //  done: 
                    });
                    resolve(this.onNextRender.promise);



                }
            }
            hr.open('POST', `https://api.applicationinsights.io/beta/apps/${options.appId}/query`, true);
            hr.setRequestHeader("x-api-key", options.appKey);
            hr.setRequestHeader("content-type", "application/json");
            hr.send(JSON.stringify({ "csl": "set truncationmaxrecords = 10000; set truncationmaxsize = 67108864; " + options.query }));
        }));

    }

    _rendered = new Defer<void>();

    constructor() {
        super({
            name, afterRender: () => {
                this._rendered.resolve();
            }
        })
    }

}


let rootLayout = new RootLayout();

Transport.create().then(transport => {
    console.log("Transport created");


    transport.sendWebSocketEvent("LOADED")
        .then((options) => rootLayout.renderGraph(options)
            .then(d => transport.sendWebSocketEvent("PAGE_RENDER", { path: "test.png" })
                .then(() => transport.sendCompleteMessae("hello world"))));



}, (reason) => console.log(reason));


ko.applyBindings(rootLayout);