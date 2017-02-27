
import { KoLayout } from "kolayout";
import * as ko from "knockout";
import * as c3 from "c3";

interface C3GraphLayoutOptions {
    title: string;
    id: string;
    chartType: string;
    chartOptions?: c3.ChartConfiguration;
    onUpdateColumns?: () => Array<any>
    onRendered?: () => void;
}
export class C3GraphLayout extends KoLayout {

    

    constructor(protected chartOptions: C3GraphLayoutOptions) {
        super({
            name: `<div id="${chartOptions.id}" style="width:100%;height:100%;"></div>`,
            afterRender: (nodes)=> this.afterRender(nodes)
        });
       


    }
    
    chart: c3.ChartAPI;
    afterRender(nodes: Node[]) {

        var actionTypesChart = this.chart = c3.generate(this.chartOptions.chartOptions || {
            bindto: `#${this.chartOptions.id}`,
            data: {
                x: 'x',
                xFormat: '%Y-%m-%dT%H:%M:%SZ',
                columns: [],
                type: this.chartOptions.chartType,
                
            },
            onrendered: this.chartOptions.onRendered,
            donut: {
                title: this.chartOptions.title
            },
            axis: {
                x: {
                    type: 'timeseries',
                    tick: {
                        format: '%Y-%m-%d %H:%M:%S'
                    }
                }
            }
        });


        
    }
}