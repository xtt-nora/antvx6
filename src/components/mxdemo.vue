<template>
  <div ref="graphContainer" style="display: flex;">
    <div ref="toolbarContainer" style="display: flex; flex-direction: column; margin-right: .5rem;"></div>
    <div ref="graph"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Graph, GraphDataModel, MaxToolbar, ConnectionHandler, RubberBandHandler, Cell, Geometry, CellStyle, InternalEvent, styleUtils, cellArrayUtils, gestureUtils, ImageBox, Client } from '@maxgraph/core'; // 假设这里是maxGraph的引入路径

const graphContainer = ref<HTMLElement | null>(null);
const toolbarContainer = ref<HTMLElement | null>(null);

onMounted(() => {
  if (!graphContainer.value || !toolbarContainer.value) return;

  const graph = new Graph(graphContainer.value, new GraphDataModel());
  const toolbar = new MaxToolbar(toolbarContainer.value);
  toolbar.enabled = false;

  const connectionHandler = graph.getPlugin('ConnectionHandler') as ConnectionHandler;
  connectionHandler.connectImage = new ImageBox(`${Client.imageBasePath}/connector.gif`, 16, 16);

  graph.setConnectable(true);
  graph.setMultigraph(false);

  if (args.rubberBand) new RubberBandHandler(graph);

  addVertex('images/rectangle.gif', 100, 40, {});
  addVertex('images/rounded.gif', 100, 40, {
    rounded: true
  });
  addVertex('images/ellipse.gif', 40, 40, {
    shape: 'ellipse',
    perimeter: 'ellipsePerimeter'
  });
  addVertex('images/rhombus.gif', 40, 40, {
    shape: 'rhombus',
    perimeter: 'rhombusPerimeter'
  });
  addVertex('images/triangle.gif', 40, 40, {
    shape: 'triangle',
    perimeter: 'trianglePerimeter'
  });
  addVertex('images/cylinder.gif', 40, 40, {
    shape: 'cylinder'
  });
  addVertex('images/actor.gif', 30, 40, {
    shape: 'actor'
  });

  function addVertex(icon: string, w: number, h: number, style: CellStyle) {
    const vertex = new Cell(null, new Geometry(0, 0, w, h), style);
    vertex.setVertex(true);
    const img = addToolbarItem(graph, toolbar, vertex, icon);
    img.enabled = true;
    graph.getSelectionModel().addListener(InternalEvent.CHANGE, () => {
      const tmp = graph.isSelectionEmpty();
      styleUtils.setOpacity(img, tmp ? 100 : 20);
      img.enabled = tmp;
    });
  }

  function addToolbarItem(graph: Graph, toolbar: MaxToolbar, prototype: Cell, image: string) {
    const dropHandler = (graph: Graph, _evt: MouseEvent, _cell: Cell | null, x?: number, y?: number) => {
      graph.stopEditing(false);
      const vertex = cellArrayUtils.cloneCell(prototype)!;
      if (vertex?.geometry) {
        x !== undefined && (vertex.geometry.x = x);
        y !== undefined && (vertex.geometry.y = y);
      }
      graph.addCell(vertex, null);
      graph.setSelectionCell(vertex);
    };

    const img = toolbar.addMode(null, image, (evt: MouseEvent, cell: Cell) => {
      const pt = graph.getPointForEvent(evt);
      dropHandler(graph, evt, cell, pt.x, pt.y);
    }, '');

    InternalEvent.addListener(img, 'mousedown', (evt: MouseEvent) => {
      if (!img.enabled) {
        InternalEvent.consume(evt);
      }
    });
    gestureUtils.makeDraggable(img, graph, dropHandler);
    return img;
  }
});
</script>