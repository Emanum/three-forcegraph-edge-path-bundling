function updateLinkVisibility(scene, graphData) {
    let camera = (scene.parent.camera === undefined) ? scene.camera : scene.parent.camera;

    if(camera === undefined) {
        return
    }
    camera.updateMatrix(); // make sure camera's local matrix is updated
    camera.updateMatrixWorld(); // make sure camera's world matrix is updated

    var frustum = new THREE.Frustum();
    frustum.setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse ))


    graphData.nodes.forEach(node => {
        if(node.__threeObj !== undefined) {
            node.__threeObj.updateMatrix();// make sure plane's local matrix is updated
            node.__threeObj.updateMatrixWorld(); // make sure plane's world matrix is updated
            node.frustumVisible = frustum.containsPoint(node.__threeObj.position);
        }
    });
    // console.log("visible nodes", graphData.nodes.filter(node => node.frustumVisible).length);
    graphData.links.forEach(link => {
        if(link.__lineObj_edgePath !== undefined && link.source_obj !== undefined && link.target_obj !== undefined) {
            link.__lineObj_edgePath.visible = (link.source_obj.frustumVisible && link.target_obj.frustumVisible);
        }

    });

}

export { updateLinkVisibility}