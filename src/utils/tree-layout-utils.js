
//graphData.nodes = [{id: '0', weight: ''}
//graphData.links = [{source: '0', target: '1', weight: '0.6'}]
function applyTreeLayout(graphData) {
    connectGraphData(graphData)

    let components = findConnectedComponents(graphData);
    console.info(components)
    components.forEach(component => {
        let mst = prim(component);
        console.info(mst)
    })


    //find all links where mst_relevant is true
    let relevantLinks = graphData.links.filter(link => link.mst_relevant === true)
    //find all links where mst_relevant is false
    let irrelevantLinks = graphData.links.filter(link => link.mst_relevant === false)

    irrelevantLinks.forEach(link => {
        link.originalWeight = link.weight
        link.originalLinkWidth = link.linkWidth
        link.weight = 0 //set weight to 0 to ignore for layout
        link.linkWidth = 0 //set linkWidth to 0 to ignore for layout
    })

    // graphData.links.forEach(link => {
    //     if (link.mst_relevant === false) {
    //         //remove from graphData.links
    //         graphData.links.splice(graphData.links.indexOf(link), 1)
    //     }
    // });

    return graphData
}

function prim(graph) {
    const nodes = graph.nodes
    const links = graph.links
    const visited = {}
    const mstLinks = []

    // start with node 0
    visited[nodes[0].id] = true

    // loop until all nodes are visited
    while (Object.keys(visited).length < nodes.length) {
        let minWeight = Infinity
        let minLink = null

        // iterate through all visited nodes
        for (const nodeId in visited) {
            const node = nodes.find(n => n.id === nodeId)

            // iterate through all links of visited nodes
            for (const link of node.links) {
                // ignore links that are already in the MST
                if (link.mst_relevant) continue

                // check if the link connects to an unvisited node
                const otherNodeId = link.source === nodeId ? link.target : link.source
                if (!visited[otherNodeId]) {
                    // update minimum weight and minimum link
                    if (link.weight < minWeight) {
                        minWeight = link.weight
                        minLink = link
                    }
                }
            }
        }

        // mark the minimum link as part of the MST
        if (minLink) {
            minLink.mst_relevant = true
            mstLinks.push(minLink)
            visited[minLink.source] = true
            visited[minLink.target] = true
        }
    }

    // return the links required for the MST
    return mstLinks
}




function connectGraphData(graphData) {
    let nodes = new Map()
    graphData.nodes.forEach(node => {
        nodes.set(node.id, node)
        node.links = []
    });
    graphData.links.forEach(link => {
        link.source_obj = nodes.get(link.source)
        link.target_obj = nodes.get(link.target)
        nodes.get(link.source).links.push(link)
        nodes.get(link.target).links.push(link)
    });
}

function findConnectedComponents(graphData) {
    const visited = new Set();
    const components = []

    function dfs(node, component) {
        component.add(node);
        visited.add(node.id);
        node.links.forEach((link) => {
            let otherNode = link.source_obj === node ? link.target_obj : link.source_obj
            if (!visited.has(otherNode.id)) {
                dfs(otherNode, component);
            }
        });
    }

    graphData.nodes.forEach((node) => {
        if (!visited.has(node.id)) {
            const component = new Set();
            dfs(node, component);
            components.push({nodes: Array.from(component), links: []});
        }
    });

    components.forEach(component => {
        let addedLinks = new Set();
        component.nodes.forEach(node => {
            node.links.forEach(link => {
                if (!addedLinks.has(link)) {
                    link.mst_relevant = false
                    addedLinks.add(link)
                    component.links.push(link)
                }
            })
        })
    })

    return components;
}





export {applyTreeLayout}