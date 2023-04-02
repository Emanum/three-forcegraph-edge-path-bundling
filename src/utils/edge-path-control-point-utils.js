// import {dijkstra} from "./dijkstra.js";
importScripts("dijkstra.js")

let lock = new WeakMap();
let skip = new WeakMap();
let weight = new WeakMap();


// Listen for messages from the main thread
self.onmessage = function (event) {
    console.info("onmessage", event);
    const { links, options } = event.data;

    // Call the calcControlPoints function with the links and options objects
    const controlPoints = calcControlPoints(links, options);

    // Send the result back to the main thread
    self.postMessage(controlPoints);
};

function calcControlPoints(links, options) {
    lock = new WeakMap();
    skip = new WeakMap();
    weight = new WeakMap();
    let sortedEdges = [];
    let controlPoints = new Map();

    function prepare() {
        function euclideanDistance(source, target) {
            return Math.sqrt(Math.pow(source.x - target.x, 2) + Math.pow(source.y - target.y, 2) + Math.pow(source.z - target.z, 2));
        }

        for (let i = 0; i < links.length; i++) {
            const link = links[i];
            lock.set(link, false);
            skip.set(link, false);
            weight.set(link, Math.pow(euclideanDistance(link.source, link.target), options.edgeWeightFactor));
        }

        //add weight as property to link
        //sort weight desc by value and store in new array
        for (let i = 0; i < links.length; i++) {
            const link = links[i];
            link.weight = weight.get(link);
            sortedEdges.push(link);
        }
        sortedEdges.sort(function (a, b) {
            return b.weight - a.weight;
        });
    }

    prepare();

    //iterate over sorted edges array
    for (let i = 0; i < sortedEdges.length; i++) {
        let e = sortedEdges[i];
        if (lock.get(e)) {
            continue;
        }
        skip.set(e, true);
        let s = e.source;
        let t = e.target;

        //Dijkstra's algorithm excluding edges in skip
        let p = dijkstra(links, s, t, weight, skip);
        if (p === null) {
            skip.set(e, true);
            continue;
        }
        if (p.length > options.maxDistortion * e.weight) {
            skip.set(e, false);
            continue;
        }
        for (let j = 0; j < p.length; j++) {
            lock.set(p[j], true);
        }
        controlPoints.set(e, p);//should be p.getVertexCoordinates()
    }
    return controlPoints;
}

// export {calcControlPoints};