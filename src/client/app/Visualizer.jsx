class Visualizer extends React.Component {

    constructor(props) {
        super(props);
        this.state = { nodes: new vis.DataSet(), edges: new vis.DataSet(), nodes_map: {}, top_edges: [] };
        this.updateGraph = this.updateGraph.bind(this);
        this.addTopEdges = this.addTopEdges.bind(this);
        this.visFromPeermap = this.visFromPeermap.bind(this);
        this.network = null;
        this.value_map = {};
        this.api = {
            'graph': 'assets/sample.json',
            'toptalkers': 'assets/edges.json',
            'route': '/v1/route'
        }
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
                color: '#ccc',
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
                        max: 24
                    }
                },
                value: 1,
                size: 1
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
                    mass: 15,
                    value: 10,
                    size: 24
                    //value: 0
                },
                isp: {
                    level: 2,
                    color: {
                        border: '#9999cc',
                        background: '#9999cc'
                    },
                    borderWidth: 2,
                    mass: 4,
                    //value: 0,
                    shape: 'dot',
                    value: 1,
                    label: undefined
                },
                bisp: {
                    level: 2,
                    color: {
                        border: '#9999cc',
                        background: '#9999cc'
                    },
                    borderWidth: 2,
                    mass: 5,
                    //value: 0,
                    shape: 'dot',
                    value: 4,
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

        var edges = this.state.edges;
        var node_map = this.state.node_map;

        if (this.state.top_edges.length && this.state.nodes.length) {
            this.addTopEdges();
        }

        /*
        edges = edges.map(function(edge) {
            if (node_map[edge.from].type == 'isp' && node_map[edge.to].type == 'isp') {
                edge.color = { color: '#cc0000', opacity: .5 };
                edge.dashes = true;
                edge.width = 2;
            }
            return edge;
        });
        */

        if (!this.network) {
            this.network = new vis.Network(
                document.getElementById('visualizer'),
                { nodes: this.state.nodes, edges: this.state.edges },
                this.options
            );
        }/* else {
            this.network.setData({
                nodes: new vis.DataSet(this.state.nodes),
                edges: new vis.DataSet(this.state.edges)
            });
        }*/
    }

    addTopEdges() {
        var edges = this.state.edges;
        var value_map = this.value_map;
        var queue = [];
        var top_edges = this.state.top_edges;
        var top_edges_new = this.state.top_edges_new;
        $('html').keyup(function(e){
          var e = e || window.event; // for IE to cover IEs window event-object
          if(e.altKey && e.which == 65) {

        top_edges.forEach(function(edge) {
            var items = edges.get({
                filter: function (item) {
                    return (
                        (item.to == edge.to && item.from == edge.from)
                        ||
                        (item.to == edge.from && edge.to == item.from)
                    );
                }
            });
            if (items.length) {
                if (!(items[0].id in value_map)) {
                    value_map[items[0].id] = 0;
                }

                value_map[items[0].id] += edge.value;

                queue.push({ id: items[0].id, value: value_map[items[0].id] });
            }
        });
        edges.update(queue);
            return false;
          }
        });

        $('html').keyup(function(e){
          var e = e || window.event; // for IE to cover IEs window event-object
          if(e.altKey && e.which == 68) {
            edges.get().forEach(function (edge) {
                edges.update({id: edge.id, value: 0});
            });

            top_edges_new.forEach(function(edge) {
            var items = edges.get({
                filter: function (item) {
                    return (
                        (item.to == edge.to && item.from == edge.from)
                        ||
                        (item.to == edge.from && edge.to == item.from)
                    );
                }
            });
            if (items.length) {
                if (!(items[0].id in value_map)) {
                    value_map[items[0].id] = 0;
                }

                value_map[items[0].id] += edge.value;

                queue.push({ id: items[0].id, value: value_map[items[0].id] });
            }
        });
        edges.update(queue);
          }});

    }

    componentDidMount() {
        $.ajax({
            url: this.api['graph'],
            dataType: 'json',
            cache: false,
            success: function(data) {
                this.setState(this.visFromPeermap(data));
            }.bind(this),
            error: function(xhr, status, err) {
                console.error(status, err.toString());
            }.bind(this)
        });
        $.ajax({
            url: this.api['toptalkers'],
            dataType: 'json',
            cache: false,
            success: function(data) {
                this.setState({ top_edges: Visualizer.visToptalkers(data.unoptimal), top_edges_new: Visualizer.visToptalkers(data.optimal) });
            }.bind(this),
            error: function(xhr, status, err) {
                console.error(status, err.toString());
            }.bind(this)
        });

    }

    visFromPeermap(peermap) {
        var nodes = [];
        var edges = [];
        var node_map = {};
        var type_map = {
            'ixp': [],
            'isp': [],
            'node': []
        };
        peermap.forEach(function(node) {
            node_map[node.id.toString()] = node;
            type_map[node.type].push(node.id);
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
            if (node.source) {
                node_settings.color = { 'background': '#aaeeaa', 'border': '#aaccaa' };
            }
            nodes.push(node_settings);
            if (node.peering) {
                node.peering.forEach(function(connection) {
                    connection = { from: node.id, to: connection, value: undefined };
                    if (edges.indexOf(connection) == -1) {
                        if (node.type == 'node') {
                            //connection.color = {'color': '#aaaaee'};
                        }
                        edges.push(connection);
                    }
                });
            }
        });
        this.state.nodes.add(nodes);
        this.state.edges.add(edges);

        var set_edges = this.state.edges;
        var set_nodes = this.state.nodes;
        set_nodes.get({
            filter: function(node) {
                var is_isp = (node.group === 'isp');
                var node_connections = set_edges.get({
                    filter: function(edge) {
                        return (
                            (edge.from === node.id && type_map['node'].indexOf(edge.to) >= 0)
                            ||
                            (edge.to === node.id && type_map['node'].indexOf(edge.from) >= 0)
                        );
                    }
                });
                if (is_isp && ! node_connections.length) {
                    return true;
                }
            }
        }).forEach(function(node) {
            set_nodes.update({ id: node.id, group: 'bisp' });
        });



        $('html').keyup(function(e){
          var e = e || window.event; // for IE to cover IEs window event-object
          if(e.altKey && e.which == 83) {
            set_edges.forEach(function(edge) {
            set_edges.update({ id: edge.id, color: {'color': '#eeaaaa'} });
        });
        set_edges.get({
            filter: function(edge) {

                var from_type = node_map[edge.from].type;
                var to_type = node_map[edge.to].type;

                if (set_nodes.get(edge.from).group == 'bisp' || set_nodes.get(edge.to).group == 'bisp') {
                    return false;
                }

                return (
                    (from_type == 'node' || to_type == 'node')
                    ||
                    (from_type == 'isp' && to_type == 'ixp')
                    ||
                    (from_type == 'ixp' && to_type == 'isp')
                );

            }
        }).forEach(function(edge) {
            set_edges.update({ id: edge.id, color: {'color': '#aaddaa'} });
        });
            return false;
          }
        });


        return {
            node_map: node_map
        };
    }

    static visToptalkers(edges) {
        return edges.map(function(edge) {
            return { from: edge.pair[0], to: edge.pair[1], value: edge.traffic }
        });
    }

    componentDidUpdate() {
        this.updateGraph();
    }

    render() {
        return null;
    }

}

export default Visualizer;
