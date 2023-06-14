import {BufferGeometry, CatmullRomCurve3, Line, LineBasicMaterial, Mesh, TubeGeometry, Vector3} from 'three';

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
    options.edgeWeightFactor = options.edgeWeightFactor || 0.5;
    options.maxDistortion = options.maxDistortion || 10;
    options.catmullRomCurvePoints = options.catmullRomCurvePoints || 10;

    function calcControlPoints(graphData, options) {
        return new Promise((resolve, reject) => {
            try {
                let controlPoints = calcControlPointsSync(graphData, options);
                resolve(controlPoints);
            } catch (e) {
                reject(e);
            }
        });

        function calcControlPointsSync(graphData, options) {
            lock = new WeakMap();
            skip = new WeakMap();
            weight = new WeakMap();
            let sortedEdges = [];
            let controlPoints = new Map();

            function prepare() {
                function euclideanDistance(source, target) {
                    return Math.sqrt(Math.pow(source.x - target.x, 2) + Math.pow(source.y - target.y, 2) + Math.pow(source.z - target.z, 2));
                }

                for (let i = 0; i < graphData.links.length; i++) {
                    const link = graphData.links[i];
                    lock.set(link, false);
                    skip.set(link, false);
                    weight.set(link, Math.pow(euclideanDistance(link.source, link.target), options.edgeWeightFactor));
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
    }

    /**
     *
     * @param controlPoints
     * filteredControlPoints: Map {
     *      key = edge
     *      value = array of nodes that are control points
     *  }
     * @param graphData
     */
    function updateThreejsEdges(controlPoints, graphData) {
        //filter out nodes with only one control point
        let filteredControlPoints = new Map();
        for (let [key, value] of controlPoints) {
            if (value.length > 1) {
                filteredControlPoints.set(key, value);
            }
        }
        console.info("filteredControlPoints", filteredControlPoints);

        for (let [edge, controlNodes] of filteredControlPoints) {
            let controlVectors = [];
            for (let i = 0; i < controlNodes.length; i++) {
                controlVectors.push(new Vector3(controlNodes[i].x, controlNodes[i].y, controlNodes[i].z));
            }
            let curve = new CatmullRomCurve3(controlVectors);
            //curveType – Type of the curve. Default is centripetal. Other options are chordal and catmullrom.
            const points = curve.getPoints(options.catmullRomCurvePoints * controlVectors.length);
            const geometry = new BufferGeometry().setFromPoints(points);
            const material = new LineBasicMaterial({color: 0x0000ff});
            let line = new Line(geometry, material);
            scene.remove(edge.__lineObj);
            scene.add(line);
            edge.__lineObj_edgePath = line;
            // edge.__lineObj = line; TODO analyze why when setting the new object to the edge, only a straight line is drawn
        }

        console.info("edgePathBundling finished", filteredControlPoints, graphData);
    }

    calcControlPoints(graphData, options)
        .then((controlPoints) => {
            updateThreejsEdges(controlPoints, graphData);
        })
        .catch((e) => {
            console.error('edgePathBundling failed', e);
        });

    console.log("edgePathBundling started in background");

}


export {edgePathBundling};
