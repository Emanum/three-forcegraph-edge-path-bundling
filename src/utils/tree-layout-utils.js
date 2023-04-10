import {GraphWeightedUndirectedAdjacencyList} from './PrimMST.js'

//graphData.nodes = [{id: '0', weight: ''}
//graphData.links = [{source: '0', target: '1', weight: '0.6'}]
function applyTreeLayout(graphData) {
    connectGraphData(graphData)

    let components = findConnectedComponents(graphData);
    console.info(components)
    components.forEach(component => {
        let mst = calc_mst(component);
        console.info(mst)
    })


    //find all links where mst_relevant is true
    let relevantLinks = graphData.links.filter(link => link.mst_relevant === true)
    //find all nodes where mst_relevant is false
    let irrelevantNodes = graphData.nodes.filter(node => node.mst_relevant === false)

    return graphData
}

function calc_mst(subgraph) {
    let g = new GraphWeightedUndirectedAdjacencyList();
    let addedLinks = new Set();
    subgraph.nodes.forEach(node => {
        g.addNode(node.id)
        node.links.forEach(link => {
            if (!addedLinks.has(link)) {
                addedLinks.add(link)
                g.addEdge(link.source, link.target, link.weight)
            }
        })
    })
    return g.PrimMST(subgraph.nodes[0])
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
                    addedLinks.add(link)
                    component.links.push(link)
                }
            })
        })
    })

    return components;
}





export {applyTreeLayout}