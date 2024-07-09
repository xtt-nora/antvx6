<template>
    <div ref="graphContainer" style="width: 900px; height: 800px;"></div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import { ImageBox, Graph, RubberBandHandler, Shape, TriangleShape, EdgeHandler, ConnectionConstraint, Point, ConstraintHandler, GraphDataModel, Client } from '@maxgraph/core';
  
  const graphContainer = ref(null);
  
  onMounted(() => {
    const container = createGraphContainer();
    const model = new GraphDataModel();
    // Replaces the port image
    ConstraintHandler.prototype.pointImage =  new ImageBox(`${Client.imageBasePath}/connector.gif`, 16, 16);
    const graph = new Graph(container,model);
    graph.setConnectable(true);
  
    // Disables automatic handling of ports
    graph.setPortsEnabled(false);
  
    // Enables rubberband selection
    new RubberBandHandler(graph);
  
    // Gets the default parent for inserting new cells
    const parent = graph.getDefaultParent();
  
    // Ports are equal for all shapes...
    const ports = {
      w: { x: 0, y: 0.5, perimeter: true, constraint: 'west' },
      e: { x: 1, y: 0.5, perimeter: true, constraint: 'east' },
      n: { x: 0.5, y: 0, perimeter: true, constraint: 'north' },
      s: { x: 0.5, y: 1, perimeter: true, constraint: 'south' },
      nw: { x: 0, y: 0, perimeter: true, constraint: 'north west' },
      ne: { x: 1, y: 0, perimeter: true, constraint: 'north east' },
      sw: { x: 0, y: 1, perimeter: true, constraint: 'south west' },
      se: { x: 1, y: 1, perimeter: true, constraint: 'south east' }
    };
  
    // ... except for triangles
    const ports2 = {
      in1: { x: 0, y: 0, perimeter: true, constraint: 'west' },
      in2: { x: 0, y: 0.25, perimeter: true, constraint: 'west' },
      in3: { x: 0, y: 0.5, perimeter: true, constraint: 'west' },
      in4: { x: 0, y: 0.75, perimeter: true, constraint: 'west' },
      in5: { x: 0, y: 1, perimeter: true, constraint: 'west' },
      out1: { x: 0.5, y: 0, perimeter: true, constraint: 'north east' },
      out2: { x: 1, y: 0.5, perimeter: true, constraint: 'east' },
      out3: { x: 0.5, y: 1, perimeter: true, constraint: 'south east' }
    };
  
    // Extends shapes classes to return their ports
    Shape.prototype.getPorts = function () {
      return ports;
    };
    TriangleShape.prototype.getPorts = function () {
      return ports2;
    };
  
    const connectionHandler = graph.getPlugin('ConnectionHandler');
  
    // Disables floating connections (only connections via ports allowed)
    connectionHandler.isConnectableCell = function (cell) {
      return false;
    };
    EdgeHandler.prototype.isConnectableCell = function (cell) {
      return connectionHandler.isConnectableCell(cell);
    };
  
    // Disables existing port functionality
    graph.view.getTerminalPort = function (state, terminal, source) {
      return terminal;
    };
  
    // Returns all possible ports for a given terminal
    graph.getAllConnectionConstraints = function (terminal, source) {
      if (terminal != null && terminal.shape != null && terminal.shape.stencil != null) {
        if (terminal.shape.stencil != null) {
          return terminal.shape.stencil.constraints;
        }
      } else if (terminal != null && terminal.cell.isVertex()) {
        if (terminal.shape != null) {
          const ports = terminal.shape.getPorts();
          const cstrs = [];
          for (const id in ports) {
            const port = ports[id];
            const cstr = new ConnectionConstraint(new Point(port.x, port.y), port.perimeter);
            cstr.id = id;
            cstrs.push(cstr);
          }
          return cstrs;
        }
      }
      return null;
    };
  
    // Sets the port for the given connection
    graph.setConnectionConstraint = function (edge, terminal, source, constraint) {
      if (constraint != null) {
        const key = source ? 'sourcePort' : 'targetPort';
        if (constraint == null || constraint.id == null) {
          this.setCellStyles(key, null, [edge]);
        } else if (constraint.id != null) {
          this.setCellStyles(key, constraint.id, [edge]);
        }
      }
    };
  
    // Returns the port for the given connection
    graph.getConnectionConstraint = function (edge, terminal, source) {
      const key = source ? 'sourcePort' : 'targetPort';
      const id = edge.style[key];
      if (id != null) {
        const c = new ConnectionConstraint(null, null);
        c.id = id;
        return c;
      }
      return null;
    };
  
    // Returns the actual point for a port by redirecting the constraint to the port
    const graphGetConnectionPoint = graph.getConnectionPoint;
    graph.getConnectionPoint = function (vertex, constraint) {
      if (constraint.id != null && vertex != null && vertex.shape != null) {
        const port = vertex.shape.getPorts()[constraint.id];
        if (port != null) {
          constraint = new ConnectionConstraint(new Point(port.x, port.y), port.perimeter);
        }
      }
      return graphGetConnectionPoint.apply(this, arguments);
    };
  
    // Adds cells to the model in a single step
    graph.batchUpdate(() => {
      const v1 = graph.insertVertex(parent, null, 'A', 20, 20, 100, 40);
      const v2 = graph.insertVertex(parent, null, 'B', 80, 100, 100, 100, {
        shape: 'ellipse',
        perimeter: 'ellipsePerimeter'
      });
      const v3 = graph.insertVertex(parent, null, 'C', 190, 30, 100, 60, {
        shape: 'triangle',
        perimeter: 'trianglePerimeter',
        direction: 'south'
      });
      const e1 = graph.insertEdge(parent, null, '', v1, v2, {
        sourcePort: 's',
        targetPort: 'nw'
      });
      const e2 = graph.insertEdge(parent, null, '', v1, v3, {
        sourcePort: 'e',
        targetPort: 'out3'
      });
    });
  
    return container;
  })
  function createGraphContainer(): HTMLDivElement {
const container = document.createElement('div');
container.style.width = '900px';
container.style.height = '800px';
container.style.border = "1px solid black"
container.style.position = 'relative';
return container;
}
  </script>