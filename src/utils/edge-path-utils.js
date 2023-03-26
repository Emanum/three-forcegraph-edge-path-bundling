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
    Box3,
    CatmullRomCurve3
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
 * @param scene {THREE.Scene}
 *
 * @param options
 *    options: {
 *       maxDistortion: 0.5,
 *       edgeWeightFactor: 0.5,
 *    }
 */
function edgePathBundling(graphData, scene, options) {
    options = options || {};
    let edgeWeightFactor = options.edgeWeightFactor || 0.5;
    let maxDistortion = options.maxDistortion || 10;
    let catmullRomCurve_Points = options.catmullRomCurvePoints || 10;

    function calcControlPoints() {
        lock = new WeakMap();
        skip = new WeakMap();
        weight = new WeakMap();
        let sortedEdges = [];
        let controlPoints = new Map();

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

    //filter out nodes with only one control point
    let filteredControlPoints = new Map();
    for (let [key, value] of controlPoints) {
        if (value.length > 1) {
            filteredControlPoints.set(key, value);
        }
    }
    //group filtered control points by number of control points
    // let groupedControlPoints = new Map();
    // for (let [key, value] of filteredControlPoints) {
    //     if (groupedControlPoints.has(value.length)) {
    //         groupedControlPoints.get(value.length).push(key);
    //     } else {
    //         groupedControlPoints.set(value.length, [key]);
    //     }
    // }

    console.info("filteredControlPoints", filteredControlPoints);

    /**
     *
     * @param filteredControlPoints
     * filteredControlPoints: Map {
     *      key = edge
     *      value = array of nodes that are control points
     *  }
     * @param graphData
     */
    function updateThreejsEdges(filteredControlPoints, graphData) {
        for (let [edge, controlNodes] of filteredControlPoints) {
            let controlVectors = [];
            for (let i = 0; i < controlNodes.length; i++) {
                controlVectors.push(new Vector3(controlNodes[i].x, controlNodes[i].y, controlNodes[i].z));
            }
            let curve = new CatmullRomCurve3(controlVectors);
            //curveType – Type of the curve. Default is centripetal. Other options are chordal and catmullrom.
            const points = curve.getPoints(catmullRomCurve_Points * controlVectors.length);
            const geometry = new BufferGeometry().setFromPoints( points );
            const material = new LineBasicMaterial({color: 0x0000ff});
            scene.remove(edge.__lineObj);
            edge.__lineObj = new Line(geometry, material);
            scene.add(edge.__lineObj);
        }
    }

    updateThreejsEdges(filteredControlPoints, graphData);

    console.log(graphData);
}

function euclideanDistance(source, target) {
    return Math.sqrt(Math.pow(source.x - target.x, 2) + Math.pow(source.y - target.y, 2) + Math.pow(source.z - target.z, 2));
}


export { edgePathBundling };
