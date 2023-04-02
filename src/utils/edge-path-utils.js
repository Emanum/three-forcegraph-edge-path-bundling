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

import { calcControlPoints } from './edge-path-control-point-utils.js';

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

    // Create a new web worker instance that loads the edgePathBundlingWorker.js file
    // const worker= new Worker(calcControlPoints, { type: "module" });
    const worker = new Worker('../../webworker/edge-path-control-point-utils.js');
    // const worker = new Worker('./edge-path-control-point-utils.js', { type: "module" });

    // Listen for messages from the worker
    worker.onmessage = function (event) {
        let controlPoints = event.data;

        //filter out nodes with only one control point
        let filteredControlPoints = new Map();
        for (let [key, value] of controlPoints) {
            if (value.length > 1) {
                filteredControlPoints.set(key, value);
            }
        }
        console.info("filteredControlPoints", filteredControlPoints);
        updateThreejsEdges(filteredControlPoints, graphData);

        console.log(graphData);
    };

    function transformLinksToBasicObject(links) {
        let linksObj = [];
        for (let i = 0; i < links.length; i++) {
            let link = links[i];
            linksObj.push({
                source: {"id": link.source.id, "x": link.source.x, "y": link.source.y, "z": link.source.z},
                target: {"id": link.target.id, "x": link.target.x, "y": link.target.y, "z": link.target.z},
                weight: link.weight,
            });
        }
        return linksObj;
    }

    let links = transformLinksToBasicObject(graphData.links);
    worker.postMessage({links, options });


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
            const points = curve.getPoints(options.catmullRomCurvePoints * controlVectors.length);
            const geometry = new BufferGeometry().setFromPoints( points );
            const material = new LineBasicMaterial({color: 0x0000ff});
            let line = new Line(geometry, material);
            scene.remove(edge.__lineObj);
            scene.add(line);
            // edge.__lineObj = line; TODO anaylze why when setting the new object to the edge, only a straight line is drawn
        }
    }


}


export { edgePathBundling };
