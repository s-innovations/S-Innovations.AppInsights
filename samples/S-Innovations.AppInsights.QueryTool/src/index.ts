
import { KoLayout } from "kolayout";
import * as ko from "knockout";

import * as name from "template!./templates/rootlayout.html";


export class RootLayout extends KoLayout {
    constructor() {
        super({ name })
    }

}

ko.applyBindings(new RootLayout());