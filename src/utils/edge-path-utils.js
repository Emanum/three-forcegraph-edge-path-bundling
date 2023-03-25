import {
    Group,
    Mesh,
    MeshLambertMaterial,
    Color,
    BufferGeometry,
    BufferAttribute,
    Matrix4,
    Vector3,
    SphereGeometry,
    CylinderGeometry,
    TubeGeometry,
    ConeGeometry,
    Line,
    LineBasicMaterial,
    QuadraticBezierCurve3,
    CubicBezierCurve3,
    Box3
} from 'three';

import {dijkstra} from "./dijkstra.js";

let lock = new WeakMap();
let skip = new WeakMap();
let weight = new WeakMap();

/**
 *
 * @param graphData
 *     graphData: {
 *         nodes: [
 *             {
 *             id: 1,
 *             __threeObj: {...},# threejs object
 *             index: 1,
 *             x: -132.12,
 *             y: -123.12,
 *             z: -123123.12,
 *             vx: 0.01,
 *             vy: 0.232,
 *             vz: 0.123,
 *             },
 *         ],
 *         links: [
 *             {
 *                 __lineObj: {}, # threejs object
 *                 source: {
 *                     id: 2,
 *                     __threeObj: {
 *                      ...
 *                     },
 *                     index: 2,
 *                     x: -132.12,
 *                     y: -123.12,
 *                     z: -123123.12,
 *                     vx: 0.01,
 *                     vy: 0.232,
 *                     vz: 0.123,
 *                 },
 *                 target: {...}
 *             },
 *             ...
 *         ]
 *     }
 * @param options
 *    options: {
 *       maxDistortion: 0.5,
 *       edgeWeightFactor: 0.5,
 *    }
 */
function edgePathBundling(graphData, options) {
    options = options || {};
    let edgeWeightFactor = options.edgeWeightFactor || 0.5;
    let maxDistortion = options.maxDistortion || 10;

    function calcControlPoints() {
        lock = new WeakMap();
        skip = new WeakMap();
        weight = new WeakMap();
        let sortedEdges = [];
        let controlPoints = new WeakMap();

        function prepare() {
            for (let i = 0; i < graphData.links.length; i++) {
                const link = graphData.links[i];
                lock.set(link, false);
                skip.set(link, false);
                weight.set(link, Math.pow(euclideanDistance(link.source, link.target), edgeWeightFactor));
            }

            //add weight as property to link
            //sort weight desc by value and store in new array
            for (let i = 0; i < graphData.links.length; i++) {
                const link = graphData.links[i];
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
            let p = dijkstra(graphData.links, s, t, weight, skip);
            if (p === null) {
                skip.set(e, true);
                continue;
            }
            if (p.length > maxDistortion * e.weight) {
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

    let controlPoints = calcControlPoints();


    console.log(controlPoints);
}

function euclideanDistance(source, target) {
    return Math.sqrt(Math.pow(source.x - target.x, 2) + Math.pow(source.y - target.y, 2) + Math.pow(source.z - target.z, 2));
}


export { edgePathBundling };
