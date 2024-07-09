<template>
     <div class="sampleWrapper">
    <div style="width: 100%; height: fit-content; display: flex; flex: 2">
      <div id="myPaletteDiv" style="width: 100px; margin-right: 2px; position: relative;">
        <!-- 原始 HTML 中的内容 -->
      </div>
      <div  id="myDiagramDiv" ref="goJsContainer" style="flex-grow: 1;width: 70%; height: 810px; position: relative;"></div>
    </div>
    <div style="flex: 1; min-width: 425px">
      <button @click="save">Save</button>
      <button @click="load">Load</button>
      Diagram Model saved in JSON format:
      <textarea id="mySavedModel" style="width: 100%; height: 375px">{ "class": "GraphLinksModel",
      "nodeDataArray": [
    {"key":-1,"category":"Start","loc":"95 33","text":"Start"},
    {"key":-2,"category":"End","loc":"523 82","text":"End"},
    {"category":"Conditional","text":"Is data\ntree-like?","key":-14,"loc":"239 195"},
    {"text":"Use a GraphLinksModel","key":-6,"loc":"380 301"},
    {"text":"Create new Diagram associated with DIV","key":-9,"loc":"259 72"},
    {"text":"Style node templates","key":-10,"loc":"146 359"},
    {"text":"Style link templates","key":-15,"loc":"352 359"},
    {"category":"Conditional","text":"Should nodes be auto-positioned?","key":-16,"loc":"436 143"},
    {"text":"Set location in node data and bind","key":-17,"loc":"159 287"},
    {"category":"End","text":"End","key":-13,"loc":"547 202"},
    {"category":"Start","text":"Start","key":-19,"loc":"83 137"}
    ],
      "linkDataArray": [
    {"from":-15,"to":-2,"points":[377.88515218098956,338.8717666625977,377.88515218098956,328.8717666625977,377.88515218098956,328.8717666625977,588,328.8717666625977,588,108,523,108,523,111.08173450203824,523,101.08173450203824]},
    {"from":-9,"to":-14,"points":[259,100.25646667480467,259,110.25646667480467,259,135.5,239,135.5,239,160.7435333251953,239,170.7435333251953]},
    {"from":-17,"to":-10,"points":[185.11458587646484,315.2564666748047,185.11458587646484,333.2564666748047,165.55729293823242,333.2564666748047,165.55729293823242,328.8717666625977,146,328.8717666625977,146,338.8717666625977]},
    {"from":-10,"to":-15,"points":[228.9330596923828,359,238.9330596923828,359,251.63880157470703,359,251.63880157470703,359,264.34454345703125,359,274.34454345703125,359]},
    {"from":-14,"to":-6,"points":[295.58078874860496,195,305.58078874860496,195,380,195,380,228.93588333129884,380,262.8717666625977,380,280.8717666625977]},
    {"from":-1,"to":-9,"points":[127.97542971233992,33.000000000000014,137.97542971233992,33.000000000000014,153.37410935690238,33.000000000000014,153.37410935690238,71.99999999999999,168.77278900146484,71.99999999999999,178.77278900146484,71.99999999999999]},
    {"from":-15,"to":-17,"points":[352,338.8717666625977,352,328.8717666625977,352,328.8717666625977,185.11458587646484,328.8717666625977,185.11458587646484,325.2564666748047,185.11458587646484,315.2564666748047]},
    {"from":-10,"to":-13,"points":[173.64435323079425,338.8717666625977,173.64435323079425,328.8717666625977,173.64435323079425,328.8717666625977,244,328.8717666625977,244,268,308,268,308,201.99999999999997,509.6877323416777,201.99999999999997,519.6877323416777,201.99999999999997]},
    {"from":-19,"to":-6,"points":[115.97542971233987,137,125.97542971233987,137,334.90914154052734,137,334.90914154052734,203.93588333129884,334.90914154052734,270.8717666625977,334.90914154052734,280.8717666625977]},
    {"from":-16,"to":-17,"points":[342.89907618931363,143,332.89907618931363,143,159,143,159,195.87176666259765,159,248.7435333251953,159,258.7435333251953]},
    {"from":-6,"to":-16,"points":[434.10903015136716,280.8717666625977,434.10903015136716,270.8717666625977,434.10903015136716,224.0641166687012,436,224.0641166687012,436,177.2564666748047,436,167.2564666748047]},
    {"from":-6,"to":-14,"points":[425.09085845947266,280.8717666625977,425.09085845947266,254.87176666259768,425.09085845947266,195,365.3358236040388,195,305.58078874860496,195,295.58078874860496,195]},
    {"from":-16,"to":-2,"points":[529.1009238106865,143,539.1009238106865,143,539.1009238106865,109.91263391361677,485.68773234167764,109.91263391361677,485.68773234167764,81.99999999999996,495.68773234167764,81.99999999999996]}
    ]}
    </textarea>
      <p id="hidden" style="padding: 0; height: 0px">this forces the font to load in Chromium browsers</p>
    </div>
  </div>
</template>
<script setup lang="ts">
import * as go from 'gojs';
import { onMounted, ref } from 'vue';
const restrictedAreaCoordinates = [
  { x: 0, y: 0 },
  { x: 0, y: 400 },
  { x: 540, y: 400 },
  { x: 700, y: 0 }
];
const isPointInPolygon = (point:any, vs: any) => {
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
const goJsContainer = ref<HTMLDivElement | null>(null);
let prePos : any;
let myDiagram : any;
let myPalette : any;
const initDiagram = () => {
   const $ = go.GraphObject.make;
  myDiagram = $(go.Diagram, goJsContainer.value!, {
    'undoManager.isEnabled': true, // enable undo & redo
      'themeManager.changesDivBackground': true,
    });
  // 创建背景网格
  myDiagram.grid = $(go.Panel, "Grid",
    { gridCellSize: new go.Size(10, 10) },
    $(go.Shape, "LineH", { stroke: "lightgray" }),
    $(go.Shape, "LineV", { stroke: "lightgray" })
  );

  // 创建可移动区域
  const createRestrictedArea = (coords:any) => {
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
  myDiagram.add(restrictedArea);
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
      myDiagram.commit(d => {
        // Add each node to the diagram
        d.add(gradScaleHoriz);
        d.add(gradScaleVert);
        updateScales();
      }, null);  // null says to skip UndoManager recording of changes
    }

    function updateScales(vb: any) {
      console.log(vb,'vb')
      if (!vb) vb = myDiagram.viewportBounds;
      if (!vb.isReal()) return;
      myDiagram.commit(diag => {
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
  myDiagram.addDiagramListener('Modified', (e:any) => {
    const button = document.getElementById('SaveButton');
    if (button) button.disabled = !myDiagram.isModified;
    const idx = document.title.indexOf('*');
    if (myDiagram.isModified) {
      if (idx < 0) document.title += '*';
    } else {
      if (idx >= 0) document.title = document.title.slice(0, idx);
    }
  });

  myDiagram.themeManager.set('light', {
    colors: {
      text: '#fff',
      start: '#064e3b',
      step: '#49939e',
      conditional: '#6a9a8a',
      end: '#7f1d1d',
      comment: '#a691cc',
      bgText: '#000',
      link: '#dcb263',
      linkOver: '#cbd5e1',
      div: '#ede9e0',
    },
  });

    defineFigures();

  function nodeStyle(node:any) {
    node
      // the Node.location is at the center of each node
      .set({ locationSpot: go.Spot.Center })
      // The Node.location comes from the "loc" property of the node data,
      // converted by the Point.parse static method.
      // If the Node.location is changed, it updates the "loc" property of the node data,
      // converting back using the Point.stringify static method.
      .bindTwoWay('location', 'loc', go.Point.parse, go.Point.stringify);
  }

  function shapeStyle(shape:any) {
    // make the whole node shape a port
    shape.set({ strokeWidth: 0, portId: '', cursor: 'pointer' });
  }

  function textStyle(textblock:any) {
    textblock.set({ font: 'bold 11pt Figtree, sans-serif' }).theme('stroke', 'text');
  }

  // define the Node templates for regular nodes
  myDiagram.nodeTemplateMap.add(
    '', // the default category
    new go.Node('Auto').apply(nodeStyle).add(
      new go.Shape('Rectangle', {
        fromLinkable: true,
        toLinkable: true,
        fromSpot: go.Spot.AllSides,
        toSpot: go.Spot.AllSides,
      })
        .apply(shapeStyle)
        .theme('fill', 'step'),
      new go.TextBlock({
        margin: 12,
        maxSize: new go.Size(160, NaN),
        wrap: go.Wrap.Fit,
        editable: true,
      })
        .apply(textStyle)
        .bindTwoWay('text')
    )
  );

  myDiagram.nodeTemplateMap.add(
    'Conditional',
    new go.Node('Auto').apply(nodeStyle).add(
      new go.Shape('Conditional', { fromLinkable: true, toLinkable: true }).apply(shapeStyle).theme('fill', 'conditional'),
      new go.TextBlock({
        margin: 8,
        maxSize: new go.Size(160, NaN),
        wrap: go.Wrap.Fit,
        textAlign: 'center',
        editable: true,
      })
        .apply(textStyle)
        .bindTwoWay('text')
    )
  );

  myDiagram.nodeTemplateMap.add(
    'Start',
    new go.Node('Auto')
      .apply(nodeStyle)
      .add(
        new go.Shape('Capsule', { fromLinkable: true }).apply(shapeStyle).theme('fill', 'start'),
        new go.TextBlock('Start', { margin: new go.Margin(5, 6) }).apply(textStyle).bind('text')
      )
  );
  

  myDiagram.nodeTemplateMap.add(
    'End',
    new go.Node('Auto')
      .apply(nodeStyle)
      .add(
        new go.Shape('Capsule', { toLinkable: true }).apply(shapeStyle).theme('fill', 'end'),
        new go.TextBlock('End', { margin: new go.Margin(5, 6) }).apply(textStyle).bind('text')
      )
  );
  // replace the default Link template in the linkTemplateMap
  myDiagram.linkTemplate = new go.Link({
    routing: go.Routing.AvoidsNodes,
    curve: go.Curve.JumpOver,
    corner: 5,
    toShortLength: 4,
    relinkableFrom: true,
    relinkableTo: true,
    reshapable: true,
    resegmentable: true,
    // mouse-overs subtly highlight links:
    mouseEnter: (e, link) => (link.findObject('HIGHLIGHT').stroke = link.diagram.themeManager.findValue('linkOver', 'colors')),
    mouseLeave: (e, link) => (link.findObject('HIGHLIGHT').stroke = 'transparent'),
    // context-click creates an editable link label
    contextClick: (e, link) => {
      e.diagram.model.commit((m) => {
        m.set(link.data, 'text', 'Label');
      });
    },
  })
    .bindTwoWay('points')
    .add(
      // the highlight shape, normally transparent
      new go.Shape({
        isPanelMain: true,
        strokeWidth: 8,
        stroke: 'transparent',
        name: 'HIGHLIGHT',
      }),
      // the link path shape
      new go.Shape({ isPanelMain: true, strokeWidth: 2 }).theme('stroke', 'link'),
      // the arrowhead
      new go.Shape({ toArrow: 'standard', strokeWidth: 0, scale: 1.5 }).theme('fill', 'link'),
      // the link label
      new go.Panel('Auto', { visible: false })
        .bind('visible', 'text', (t) => typeof t === 'string' && t.length > 0) // only shown if there is text
        .add(
          // a gradient that fades into the background
          new go.Shape('Ellipse', { strokeWidth: 0 }).theme('fill', 'div', null, null, (c) => {
            return new go.Brush(go.BrushType.Radial, {
              colorStops: new go.Map([
                { key: 0, value: c },
                { key: 0.5, value: `${c}00` },
              ]),
            });
          }),
          new go.TextBlock({
            name: 'LABEL',
            font: '9pt Figtree, sans-serif',
            margin: 3,
            editable: true,
          })
            .theme('stroke', 'bgText')
            .bindTwoWay('text')
        )
    );

  // temporary links used by LinkingTool and RelinkingTool are also orthogonal:
  myDiagram.toolManager.linkingTool.temporaryLink.routing = go.Routing.Orthogonal;
  myDiagram.toolManager.relinkingTool.temporaryLink.routing = go.Routing.Orthogonal;
  const arr = [];
for (let value of myDiagram.nodeTemplateMap.values()) {
arr.push(value);
}
arr.forEach((value) => {
if (value instanceof go.Node) {
    value.dragComputation = function(part, pt) {
  const nodeBounds = part.actualBounds;
  const newPosition = pt.copy();
  const topLeft = newPosition.copy().offset(-nodeBounds.width / 2, -nodeBounds.height / 2);
  const bottomRight = newPosition.copy().offset(nodeBounds.width / 2, nodeBounds.height / 2);

  if (
    isPointInPolygon(newPosition, restrictedAreaCoordinates) &&
    isPointInPolygon(topLeft, restrictedAreaCoordinates) &&
    isPointInPolygon(bottomRight, restrictedAreaCoordinates)
  ) {
    return pt;
  } else {
    return part.location;
  }
};
}
});

  load(); 
  myDiagram.addDiagramListener("InitialLayoutCompleted", setupScalesAndIndicators);
  myPalette = new go.Palette(
    'myPaletteDiv', // must name or refer to the DIV HTML element
    {
      nodeTemplateMap: myDiagram.nodeTemplateMap, // share the templates used by myDiagram
      themeManager: myDiagram.themeManager, // share the ThemeManager used by myDiagram
      model: new go.GraphLinksModel([
        // specify the contents of the Palette
        { category: 'Start', text: 'Start' },
        { text: 'Step' },
        { category: 'Conditional', text: '???' },
        { category: 'End', text: 'End' },
        // { category: 'Comment', text: 'Comment' },
      ]),
    }
  );

} // end init

// define some custom shapes for node templates
function defineFigures() {
  go.Shape.defineFigureGenerator('Conditional', (shape, w, h) => {
    const geo = new go.Geometry();
    const fig = new go.PathFigure(w * 0.15, 0, true);
    geo.add(fig);
    fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.85, 0));
    fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.5 * h));
    fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.85, h));
    fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.15, h));
    fig.add(new go.PathSegment(go.SegmentType.Line, 0, 0.5 * h).close());
    geo.spot1 = new go.Spot(0.15, 0);
    geo.spot2 = new go.Spot(0.85, 1);
    return geo;
  });

  // taken from https://unpkg.com/create-gojs-kit@3.0.3/dist/extensions/Figures.js:
  go.Shape.defineFigureGenerator('File', (shape, w, h) => {
    const geo = new go.Geometry();
    const fig = new go.PathFigure(0, 0, true); // starting point
    geo.add(fig);
    fig.add(new go.PathSegment(go.SegmentType.Line, 0.75 * w, 0));
    fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.25 * h));
    fig.add(new go.PathSegment(go.SegmentType.Line, w, h));
    fig.add(new go.PathSegment(go.SegmentType.Line, 0, h).close());
    const fig2 = new go.PathFigure(0.75 * w, 0, false);
    geo.add(fig2);
    // The Fold
    fig2.add(new go.PathSegment(go.SegmentType.Line, 0.75 * w, 0.25 * h));
    fig2.add(new go.PathSegment(go.SegmentType.Line, w, 0.25 * h));
    geo.spot1 = new go.Spot(0, 0.25);
    geo.spot2 = go.Spot.BottomRight;
    return geo;
  });
}

// Show the diagram's model in JSON format that the user may edit
function save() {
  document.getElementById('mySavedModel').value = myDiagram.model.toJson();
  myDiagram.isModified = false;
}
function load() {
  myDiagram.model = go.Model.fromJson(document.getElementById('mySavedModel').value);
}
onMounted(()=>{
    initDiagram()
})

// window.addEventListener('DOMContentLoaded', () => {
//   // 在 DOMContentLoaded 事件中初始化
//   initDiagram();
// });
</script>
<style>
.sampleWrapper {
  display: flex;
  flex-direction: column;
  width: 100%;;
  @media (min-width: 1280px) {
    flex-direction: row;
  }

  & > div:first-child {
    margin-bottom: 0.5rem;

    @media (min-width: 1280px) {
      margin-right: 0.5rem;
      margin-bottom: 0;
    }
  }
}
</style>