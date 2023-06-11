

function updateLinkVisibility(scene, graphData) {
    let camera = scene.camera;
    if(camera === undefined) {
        return
    }
    camera.updateMatrix(); // make sure camera's local matrix is updated
    camera.updateMatrixWorld(); // make sure camera's world matrix is updated
    camera.matrixWorldInverse.getInverse( camera.matrixWorld );

    var frustum = new THREE.Frustum();
    frustum.setFromProjectionMatrix( camera.projectionMatrix );

    graphData.nodes().forEach(node => {
        node.__threeObj.updateMatrix();// make sure plane's local matrix is updated
        node.__threeObj.updateMatrixWorld(); // make sure plane's world matrix is updated
        node.frustumVisible = frustum.containsPoint(node.__threeObj.position);
    });
    console.log("visible nodes", graphData.nodes().filter(node => node.frustumVisible).length);
    // graphData.links.forEach(link => {
    //
    // });

}

function filterLink(link, camera) {
    let sourceObj = link.source_obj.__threeObj;//ThreeJS Mesh
    let targetObj = link.target_obj.__threeObj;

    camera.updateMatrix();
    camera.updateMatrixWorld();

    var frustum = new THREE.Frustum();
    var projScreenMatrix = new THREE.Matrix4();
    projScreenMatrix.multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse );

    frustum.setFromProjectionMatrix( camera.projectionMatrix );

    return frustum.containsPoint(sourceObj.position) && frustum.containsPoint(targetObj.position);

}

export { filterLink, updateLinkVisibility}