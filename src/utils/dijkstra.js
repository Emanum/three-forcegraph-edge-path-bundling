

// return path from s to t
function dijkstra(edges, s, t, weight, skip) {
    const Q = new PriorityQueue((a, b) => a.priority - b.priority);
    let dist = new Map();
    let prev = new Map();

    // initialize distances and previous nodes
    for (let i = 0; i < edges.length; i++) {
        const e = edges[i];
        dist.set(e.source, Infinity);
        dist.set(e.target, Infinity);
        prev.set(e.source, null);
        prev.set(e.target, null);
    }

    // set source distance to 0
    dist.set(s, 0);
    Q.enqueue({ node: s, priority: 0 });

    while (!Q.isEmpty()) {
        let u = Q.dequeue().node;
        if (u === t) {
            break;
        }
        let neighbors = findNeighbors(edges, u, skip);
        for (let i = 0; i < neighbors.length; i++) {
            let v = neighbors[i];
            let alt = dist.get(u) + weight.get(getEdge(edges, u, v));
            if (alt < dist.get(v)) {
                dist.set(v, alt);
                prev.set(v, u);
                Q.enqueue({ node: v, priority: alt });
            }
        }
    }

    // build path from source to target
    let path = [];
    let u = t;
    while (prev.get(u) !== null) {
        path.unshift(u);
        u = prev.get(u);
    }
    path.unshift(u);
    if (path.length === 0) {
        return null;
    }
    return path;
}

// helper function to find all neighbors of a node
function findNeighbors(edges, node, skip) {
    let neighbors = [];
    for (let i = 0; i < edges.length; i++) {
        const e = edges[i];
        if (e.source === node && !skip.get(e)) {
            neighbors.push(e.target);
        } else if (e.target === node && !skip.get(e)) {
            neighbors.push(e.source);
        }
    }
    return neighbors;
}

// helper function to get an edge between two nodes
function getEdge(edges, u, v) {
    for (let i = 0; i < edges.length; i++) {
        const e = edges[i];
        if ((e.source === u && e.target === v) || (e.source === v && e.target === u)) {
            return e;
        }
    }
    return null;
}

class PriorityQueue {
    constructor(comparator = (a, b) => a - b) {
        this._heap = [];
        this._comparator = comparator;
    }

    get size() {
        return this._heap.length;
    }

    isEmpty() {
        return this._heap.length === 0;
    }

    peek() {
        return this._heap[0];
    }

    enqueue(value) {
        this._heap.push(value);
        this._siftUp();
    }

    dequeue() {
        const root = this._heap[0];
        const last = this._heap.pop();
        if (this._heap.length > 0) {
            this._heap[0] = last;
            this._siftDown();
        }
        return root;
    }

    _siftUp() {
        let nodeIdx = this._heap.length - 1;
        while (nodeIdx > 0) {
            const parentIdx = Math.floor((nodeIdx - 1) / 2);
            if (this._compare(nodeIdx, parentIdx) < 0) {
                this._swap(nodeIdx, parentIdx);
                nodeIdx = parentIdx;
            } else {
                break;
            }
        }
    }

    _siftDown() {
        let nodeIdx = 0;
        while (nodeIdx * 2 + 1 < this._heap.length) {
            const leftChildIdx = nodeIdx * 2 + 1;
            const rightChildIdx = nodeIdx * 2 + 2;
            const minChildIdx = rightChildIdx < this._heap.length &&
            this._compare(rightChildIdx, leftChildIdx) < 0 ? rightChildIdx : leftChildIdx;
            if (this._compare(minChildIdx, nodeIdx) < 0) {
                this._swap(nodeIdx, minChildIdx);
                nodeIdx = minChildIdx;
            } else {
                break;
            }
        }
    }

    _swap(i, j) {
        [this._heap[i], this._heap[j]] = [this._heap[j], this._heap[i]];
    }

    _compare(i, j) {
        return this._comparator(this._heap[i], this._heap[j]);
    }
}


export { dijkstra };