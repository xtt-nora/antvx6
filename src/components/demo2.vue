<template>
    <div ref="goJsContainer" style="width: 800px; height: 600px; border: 1px solid black;"></div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import * as go from 'gojs';
  
  const goJsContainer = ref<HTMLDivElement | null>(null);
  
  const restrictedAreaCoordinates = [
    { x: 0, y: 0 },
    { x: 0, y: 400 },
    { x: 240, y: 400 },
    { x: 600, y: 0 }
  ];
  
  const isPointInPolygon = (point, vs) => {
    let x = point.x, y = point.y;
  
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
      let xi = vs[i].x, yi = vs[i].y;
      let xj = vs[j].x, yj = vs[j].y;
  
      let intersect = ((yi > y) !== (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
  
    return inside;
  };
  
  const initDiagram = () => {
    const $ = go.GraphObject.make;
    const diagram = $(go.Diagram, goJsContainer.value!, {
      "undoManager.isEnabled": true
    });
    // 创建背景网格
    diagram.grid = $(go.Panel, "Grid",
      { gridCellSize: new go.Size(10, 10) },
      $(go.Shape, "LineH", { stroke: "lightgray" }),
      $(go.Shape, "LineV", { stroke: "lightgray" })
    );
  
    // 创建可移动区域
    const createRestrictedArea = (coords) => {
      const points = coords.map(coord => new go.Point(coord.x, coord.y));
      const geo = new go.Geometry();
      geo.add(new go.PathFigure(points[0].x, points[0].y)
        .add(new go.PathSegment(go.PathSegment.Line, points[1].x, points[1].y))
        .add(new go.PathSegment(go.PathSegment.Line, points[2].x, points[2].y))
        .add(new go.PathSegment(go.PathSegment.Line, points[3].x, points[3].y))
        .add(new go.PathSegment(go.PathSegment.Line, points[0].x, points[0].y)));
      return geo;
    };
  
    const restrictedArea = $(go.Part, { 
        layerName: "Background",
        selectable: false, 
        pickable: false
      },
      $(go.Shape, { geometry: createRestrictedArea(restrictedAreaCoordinates), fill: "white", stroke: null })
    );
    diagram.add(restrictedArea);
    const gradScaleHoriz =
        new go.Part("Graduated",
            {graduatedMin: 0, graduatedTickUnit: 10, layerName: "ViewportBackground", alignment: go.Spot.TopLeft, isAnimated: false })
          .add(
            new go.Shape({ geometryString: "M0 0 H400" }),
            new go.Shape({ geometryString: "M0 0 V4", interval: 1 }),
            new go.Shape({ geometryString: "M0 0 V7", interval: 5 }),
            new go.Shape({ geometryString: "M0 0 V15", interval: 10 }),
            new go.TextBlock(
              {
                font: "10px sans-serif",
                interval: 10,
                alignmentFocus: go.Spot.TopLeft,
                segmentOffset: new go.Point(0, 12)
              })
          );

      const gradScaleVert =
        new go.Part("Graduated",
            { graduatedTickUnit: 10, layerName: "ViewportBackground", alignment: go.Spot.TopLeft, isAnimated: false })
          .add(
            new go.Shape({ geometryString: "M0 0 V400" }),
            new go.Shape({ geometryString: "M0 0 V4", interval: 1, alignmentFocus: go.Spot.Bottom }),
            new go.Shape({ geometryString: "M0 0 V7", interval: 5, alignmentFocus: go.Spot.Bottom }),
            new go.Shape({ geometryString: "M0 0 V15", interval: 10, alignmentFocus: go.Spot.Bottom }),
            new go.TextBlock(
              {
                font: "10px sans-serif",
                segmentOrientation: go.Orientation.Opposite,
                interval: 10,
                alignmentFocus: go.Spot.BottomLeft,
                segmentOffset: new go.Point(0, -7)
              })
          );
  
      function setupScalesAndIndicators() {
        diagram.commit(d => {
          // Add each node to the diagram
          d.add(gradScaleHoriz);
          d.add(gradScaleVert);
          updateScales();
        }, null);  // null says to skip UndoManager recording of changes
      }

      function updateScales(vb) {
        console.log(vb,'vb')
        if (!vb) vb = diagram.viewportBounds;
        if (!vb.isReal()) return;
        diagram.commit(diag => {
          // Update properties of horizontal scale to reflect viewport
          gradScaleHoriz.elt(0).width = vb.width * diag.scale;
          gradScaleHoriz.graduatedMin = 0;
          gradScaleHoriz.graduatedMax = vb.right;
          // Update properties of vertical scale to reflect viewport
          gradScaleVert.elt(0).height = vb.height * diag.scale;
          gradScaleVert.graduatedMin = 0;
          gradScaleVert.graduatedMax = vb.bottom;
        }, null);
      }
    // 节点模板
    diagram.nodeTemplate = $(go.Node, "Auto",
      {
        dragComputation: (part, pt) => {
          const nodeBounds = part.actualBounds;
          const newPosition = pt.copy();
          const corners = [
            new go.Point(newPosition.x, newPosition.y),
            new go.Point(newPosition.x + nodeBounds.width, newPosition.y),
            new go.Point(newPosition.x + nodeBounds.width, newPosition.y + nodeBounds.height),
            new go.Point(newPosition.x, newPosition.y + nodeBounds.height)
          ];
  
          if (corners.every(corner => isPointInPolygon(corner, restrictedAreaCoordinates))) {
            return pt;
          } else {
            return part.position;
          }
        }
      },
      new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
      $(go.Shape, "RoundedRectangle",
        { strokeWidth: 0 },
        new go.Binding("fill", "color")
      ),
      $(go.TextBlock,
        { margin: 8 },
        new go.Binding("text", "key")
      )
    );
  
    // 示例节点数据
    const nodeDataArray = [
      { key: "S0", loc: "0 40", color: "lightblue" },
      { key: "M0", loc: "40 0", color: "red" },
      { key: "M1", loc: "40 40", color: "red" },
      { key: "M2", loc: "40 80", color: "red" },
      { key: "M3", loc: "80 40", color: "red" },
      { key: "S1", loc: "80 80", color: "lightblue" },
      { key: "S2", loc: "120 40", color: "lightblue" }
    ];
  
    // 示例链接数据
    const linkDataArray = [
      { from: "S0", to: "M0" },
      { from: "M0", to: "M1" },
      { from: "M1", to: "M2" },
      { from: "M2", to: "S1" },
      { from: "M1", to: "M3" },
      { from: "M3", to: "S2" }
    ];
    diagram.addDiagramListener("InitialLayoutCompleted", setupScalesAndIndicators);
    diagram.model = new go.GraphLinksModel(nodeDataArray, linkDataArray);
  };
  
  onMounted(() => {
    initDiagram();
  });
  </script>
  
  <style scoped>
  /* Add your styles here */
  </style>
  