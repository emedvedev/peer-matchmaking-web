class Visualizer extends React.Component {

    constructor(props) {
        super(props);
        this.state = { nodes: [], edges: [], nodes_map: {} };
        this.updateGraph = this.updateGraph.bind(this);
        this.network = null;
        this.options = {
            autoResize: true,
            height: '100%',
            width: '100%',
            locale: 'en',
            layout: {
                improvedLayout: true
            },
            interaction: {
                dragView: true,
                zoomView: false
            },
            edges: {
                color: '#aaa',
                length: 5,
                smooth: {
                    enabled: true,
                    type: 'cubicBezier',
                    roundness: .7,
                    forceDirection: true
                },
                physics: true
            },
            physics: {
                enabled: true,
                stabilization: true,
                solver: 'forceAtlas2Based',
                forceAtlas2Based: {
                    gravitationalConstant: -15,
                    avoidOverlap: 1.0,
                    centralGravity: 0.005,
                    damping: .8,
                    //springConstant: 0.6
                }
            },
            nodes: {
                shape: 'box',
                color: {
                    background: '#fff'
                },
                scaling: {
                    label: {
                        enabled: true,
                        min: 14,
                        max: 18
                    }
                },
            },
            groups: {
                ixp: {
                    level: 1,
                    fixed: {
                        y: true
                    },
                    color: {
                        border: '#99cc99'
                    },
                    borderWidth: 3,
                    mass: 20,
                    //value: 0
                },
                isp: {
                    level: 2,
                    color: {
                        border: '#aaa',
                        background: '#aaa'
                    },
                    borderWidth: 2,
                    mass: 5,
                    //value: 0,
                    shape: 'dot',
                    size: 8,
                    label: undefined
                },
                node: {
                    level: 3,
                    mass: 2,
                    //value: 0
                }
            },
        };
    }

    updateGraph() {
        this.network = new vis.Network(
            document.getElementById('visualizer'),
            { nodes: new vis.DataSet(this.state.nodes), edges: new vis.DataSet(this.state.edges) },
            this.options
        );
    }

    componentDidMount() {
        $.ajax({
            url: 'assets/sample.json',
            dataType: 'json',
            cache: false,
            success: function(data) {
                this.setState(Visualizer.visFromPeermap(data));
            }.bind(this),
            error: function(xhr, status, err) {
                console.error(status, err.toString());
            }.bind(this)
        });
    }

    static visFromPeermap(peermap) {
        var nodes = [];
        var edges = [];
        var node_map = {};
        peermap.forEach(function(node) {
            node_map[node.id.toString()] = node;
            var node_settings = {
                id: node.id,
                group: node.type
            };
            switch (node.type) {
            case 'ixp':
                node_settings.y = 0;
                node_settings.label = node.label;
                break;
            case 'isp':
                node_settings.y = 1;
                break;
            case 'node':
                node_settings.y = -1;
                node_settings.label = node.subnet;
                break;
            }
            nodes.push(node_settings);
            if (node.peering) {
                node.peering.forEach(function(connection) {
                    connection = { from: node.id, to: connection };
                    if (edges.indexOf(connection) == -1) {
                        edges.push(connection);
                    }
                });
            }
        });
        edges = edges.map(function(edge) {
            if (node_map[edge.from].type == 'isp' && node_map[edge.to].type == 'isp') {
                edge.color = { opacity: .5 };
                edge.dashes = true;
                edge.width = 2;
            }
            return edge;
        });
        return {
            nodes: nodes,
            edges: edges
        };
    }

    componentDidUpdate() {
        this.updateGraph();
    }

    render() {
        return null;
    }

}

export default Visualizer;
