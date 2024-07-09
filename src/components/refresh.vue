<template>
  <input type="file" id="input" name="input" @change="handle"/>
  <button type="button" class="small" @click="exports">输出</button>
  <div ref="graphContainer" style="width: 900; height: 700px;"></div>
  </template>
  
  <script lang="ts" setup>
  import { xml2json } from 'xml-js';
  import { alldata } from "./allData.json"
  import { ref, onMounted } from 'vue';
  import { Graph, GraphDataModel, MaxToolbar, Client, Cell, Geometry, CellStyle, ImageBox, InternalEvent, constants, gestureUtils, styleUtils, RubberBandHandler, ConnectionHandler, Point, eventUtils, ModelXmlSerializer, popup, EdgeStyle, GraphHierarchyEdge, EdgeHandler, ConnectionConstraint, Shape, TriangleShape } from '@maxgraph/core';
  
  // Extend the Shape class to include the getPorts method
  interface ShapeWithPorts extends Shape {
    getPorts(): Record<string, any>;
  }
  
  // Extend the TriangleShape class to include the getPorts method
  interface TriangleShapeWithPorts extends TriangleShape {
    getPorts(): Record<string, any>;
  }
  const inputElement = document.getElementById("input");
  const graphContainer = ref<HTMLElement | null>(null);
  const graphs = ref<any>()
  // 默认节点数据
  let dataList = {
  "point": [{
    id:"M01",
    type:"T-NIU",
    x:5000,
    y:9000
  },{
    id:"M02",
    type:"T-NIU",
    x:2400,
    y:6000
  },{
    id:"S01",
    type:"I-NIU",
    x:2600,
    y:4000
  },{
    id:"S02",
    type:"I-NIU",
    x:2800,
    y:1200
  },{
    id:"S03",
    type:"Switch",
    x:3500,
    y:2000
  }],
  "to":[
  {from:"M01",to:"S01"},
  {from:"M02",to:"S02"},
  {from:"S01",to:"S02"},
  ]
  };
  
  // 限制区域数据
  let restrictedAreaCoordinates = [
    { x: 0, y: 0 },
    { x: 0, y: 4000 },
    { x: 15000, y: 17000 },
    { x: 12400, y: 4000 },
    { x: 15000, y: 0 },
    
  ];
  function isPointInPolygon(point: { x: number, y: number }, polygon: { x: number, y: number }[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
  
    const intersect = ((yi > point.y) !== (yj > point.y )) &&
      (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
  }
  function isPointInRestrictedArea(point: { x: number, y: number }): boolean {
  // 使用你之前定义的 isPointInPolygon 函数来判断点是否在限制区域内
  return isPointInPolygon(point, restrictedAreaCoordinates);
  }
  function drawPolygon(graph: Graph, coordinates:any) {
  const model = graph.getDataModel();
  model.beginUpdate();
  try {
    const parent = graph.getDefaultParent();
  
    // 创建多边形顶点
    const points = [];
    coordinates.forEach(coord => {
      const vertex = graph.insertVertex(parent, null, '', coord.x, coord.y, 0, 0, {shape: 'ellipse', movable:false});
      vertex.setConnectable(false); // 防止顶点被连接
      points.push(vertex);
    });
  
    // 连接多边形顶点
    for (let i = 0; i < points.length; i++) {
      const source = points[i];
      const target = points[(i + 1) % points.length];
      const edge = graph.insertEdge(parent, null, '', source, target);
      edge.setStyle({endArrow:"none",movable:false, edgeStyle:'noEdgeStyle',deletable:false,strokeColor:'inherit'}); // 设置连接线无箭头且不能移动
    }
  } finally {
    model.endUpdate();
  }
  }
  const initialContainerWidth = 20000; // 原始容器的宽度
  const initialContainerHeight = 20000; // 原始容器的高度
  onMounted(() => {
    getDataMessage()
  });
  const init = ()=>{
    if (graphContainer.value) {
    configureImagesBasePath();
  
    const div = document.createElement('div');
    div.style.display = 'flex';
    div.style.width = '100%';
    div.style.height = '100%';
  
    const tbContainer = document.createElement('div');
    tbContainer.style.display = 'flex';
    tbContainer.style.flexDirection = 'column';
    tbContainer.style.marginRight = '.5rem';
    div.appendChild(tbContainer);
  
    const toolbar = new MaxToolbar(tbContainer);
    toolbar.enabled = false;
    const containerWidth = graphContainer.value.clientWidth;
    const containerHeight = graphContainer.value.clientHeight;
  
    dataList.point.forEach(point => {
  point.x = (point.x / initialContainerWidth) * containerWidth;
  point.y = containerHeight - (point.y / initialContainerHeight) * containerHeight;
  });
  
  restrictedAreaCoordinates.forEach(point => {
  point.x = (point.x / initialContainerWidth) * containerWidth;
  point.y = containerHeight - (point.y / initialContainerHeight) * containerHeight;
  });
    const container = createGraphContainer();
    div.appendChild(container);
    const model = new GraphDataModel();
    const graph = new Graph(container, model);
    graphs.value = graph
    const connectionHandler = graph.getPlugin('ConnectionHandler') as ConnectionHandler;
    connectionHandler.connectImage = new ImageBox(`${Client.imageBasePath}/connector.gif`, 16, 16);
     new RubberBandHandler(graph);
    graph.setPortsEnabled(false);
    graph.setConnectable(true);
    graph.setMultigraph(false);
    graph.setCellsResizable(false);
  
    const parent = graph.getDefaultParent();
  
  // Ports are equal for all shapes...
  const ports: Record<string, any> = {
    w: { x: 0, y: 0.5, perimeter: true, constraint: 'west' },
    e: { x: 1, y: 0.5, perimeter: true, constraint: 'east' },
    n: { x: 0.5, y: 0, perimeter: true, constraint: 'north' },
    s: { x: 0.5, y: 1, perimeter: true, constraint: 'south' },
    nw: { x: 0, y: 0, perimeter: true, constraint: 'north west' },
    ne: { x: 1, y: 0, perimeter: true, constraint: 'north east' },
    sw: { x: 0, y: 1, perimeter: true, constraint: 'south west' },
    se: { x: 1, y: 1, perimeter: true, constraint: 'south east' },
  };
  
  // ... except for triangles
  const ports2: Record<string, any> = {
    in1: { x: 0, y: 0, perimeter: true, constraint: 'west' },
    in2: { x: 0, y: 0.25, perimeter: true, constraint: 'west' },
    in3: { x: 0, y: 0.5, perimeter: true, constraint: 'west' },
    in4: { x: 0, y: 0.75, perimeter: true, constraint: 'west' },
    in5: { x: 0, y: 1, perimeter: true, constraint: 'west' },
    out1: { x: 0.5, y: 0, perimeter: true, constraint: 'north east' },
    out2: { x: 1, y: 0.5, perimeter: true, constraint: 'east' },
    out3: { x: 0.5, y: 1, perimeter: true, constraint: 'south east' },
  };
  
  // Extends shapes classes to return their ports
  Shape.prototype.getPorts = function () {
    return ports;
  };
  
  TriangleShape.prototype.getPorts = function () {
    return ports2;
  };
  
  
    connectionHandler.isConnectableCell = function (cell) {
        return true;
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
              // for stencils with existing constraints...
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
  
  
  const initpoints = addDefaultDataPointsAndConnections(graph, dataList); 
    new RubberBandHandler(graph);
    drawPolygon(graph, restrictedAreaCoordinates);
    drawAxes(graph); // 初始化时绘制坐标轴
  
  // 监听容器大小变化
  window.addEventListener('resize', () => {
  drawAxes(graph);
  });
    // addVertex('images/rectangle.gif', 20, 10, {}, "T-NIU");
    addVertex('images/ellipse.gif', 20, 20, { shape: 'ellipse', perimeter: 'ellipsePerimeter',fillColor:'yellow' }, "Switch");
    // addVertex('images/rectangle.gif', 20, 10, {}, "I-NIU");
    addVertex('images/rectangle.gif', 10, 10, {fillColor:'blue'}, "Link");
  
    function addVertex(icon: string, w: number, h: number, style: CellStyle, title: string) {
      const vertex = new Cell(title, new Geometry(0, 0, w, h), style);
      vertex.setVertex(true);
      const img: any = addToolbarItem(graph, toolbar, vertex, icon);
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
        const vertex = graph.getDataModel().cloneCell(prototype)!;
        if (vertex?.geometry) {
          const isInRestrictedArea = isPointInRestrictedArea({ x: x || 0, y: y || 0 });
    if (isInRestrictedArea) {
      // 如果在限制区域内，则添加新节点
      x !== undefined && (vertex.geometry.x = x);
      y !== undefined && (vertex.geometry.y = y);
      graph.addCell(vertex, null);
      graph.setSelectionCell(vertex);
    } else {
      // 如果不在限制区域内，则不添加新节点
      console.log("Cannot drop outside the restricted area.");
    }
        }
      };
  
      const img: any = toolbar.addMode(null, image, (evt: MouseEvent, cell: Cell) => {
        const pt = graph.getPointForEvent(evt);
        dropHandler(graph, evt, cell, pt.x, pt.y);
      }, '');
  
      InternalEvent.addListener(img, 'mousedown', (evt: MouseEvent) => {
        if (img.enabled == false) {
          InternalEvent.consume(evt);
        }
      });
  
      gestureUtils.makeDraggable(img, graph, dropHandler);
      return img;
    }
  
    function addDefaultDataPointsAndConnections(graph: Graph, data: any) {
      const dataPointStyle: CellStyle = {
        shape: 'ellipse', perimeter: 'ellipsePerimeter'
      };
      const edgeStyle: CellStyle = {
        edgeStyle:'noEdgeStyle',
        // edgeStyle: 'elbowEdgeStyle', 
        strokeColor: 'gray',
        strokeWidth: 1,
        dashed: true,
      };
      const style = graph.getStylesheet().getDefaultEdgeStyle();
    // @ts-ignore TODO fix the type, this works
    style.edgeStyle = EdgeStyle.ElbowConnector;
    style.strokeColor = '#000000'
      const model = graph.getDataModel();
      model.beginUpdate();
      try {
        const parent = graph.getDefaultParent();
  
        // Add data points
        const pointsMap: { [key: string]: Cell } = {};
        dataList.point.forEach(point => {
          const vertexWidth = 20;
          const vertexHeight = 10;
          const adjustedX = point.x - vertexWidth / 2;
          const adjustedY = point.y - vertexHeight / 2;
          const iniuStyle: CellStyle = {
       fillColor: point.type === "I-NIU"? '#F8CECC':'inherit'
      };
          pointsMap[point.id] = graph.insertVertex(parent, null, point.id, adjustedX, adjustedY, vertexWidth, vertexHeight, iniuStyle);
          pointsMap[point.id].setConnectable(true);
        });
  
        dataList.to.forEach(toItem => {
          const sourceCell = pointsMap[toItem.from];
          const targetCell = pointsMap[toItem.to];
          if (sourceCell && targetCell) {
            const edge = graph.insertEdge(parent, null, '', sourceCell, targetCell, edgeStyle);
            edge.setConnectable(true);
          }
        });
        return pointsMap
    // 监听单元格移动事件以更新标签
    // graph.addListener(InternalEvent.CELLS_MOVED, function(sender: any, evt) {
    //     const cells = evt.getProperty('cells');
    //     if (cells) {
    //       for (let i = 0; i < cells.length; i++) {
    //         const cell = cells[i];
    //         if (cell.isVertex()) {
    //           const geometry = cell.getGeometry();
    //           if (geometry) {
    //             const customX = Math.round(geometry.x);
    //             const customY = Math.round(geometry.y);
    //             let newLabel = ''
    //             newLabel = `${cell.value}\n(${customX}, ${customY})`; // 更新标签
    //             graph.model.beginUpdate();
    //             try {
    //               graph.cellLabelChanged(cell, newLabel, false);
    //             } finally {
    //               graph.model.endUpdate();
    //             }
    //           }
    //         }
    //       }
    //     }
    //   });
      } finally {
        model.endUpdate();
      }
    }
    graph.addListener(InternalEvent.CELLS_MOVING, (sender, evt) => {
      const cells = evt.getProperty('cells');
      const dx = evt.getProperty('dx');
      const dy = evt.getProperty('dy');
  
      cells.forEach((cell: Cell) => {
        if (cell.geometry) {
          const newX = cell.geometry.x + dx;
          const newY = cell.geometry.y + dy;
          const isInRestrictedArea = isPointInPolygon({ x: newX, y: newY }, restrictedAreaCoordinates);
          console.log(dx,dy, cell.geometry.x , cell.geometry.y)
      if (!isInRestrictedArea) {
        evt.consume(); 
      }
        }
      });
    });
  
    graph.addListener(InternalEvent.CELLS_MOVED, (sender, evt) => {
      const cells = evt.getProperty('cells');
      const dx = evt.getProperty('dx');
      const dy = evt.getProperty('dy');
  
      cells.forEach((cell: Cell) => {
        if (cell.geometry) {
          const newX = cell.geometry.x + dx;
          const newY = cell.geometry.y + dy;
          const height = cell.geometry.height;
          console.log({ x: newX, y: newY + height })
      const isInRestrictedArea = isPointInRestrictedArea({ x: newX, y: newY });
      const isInRestrictedAreatop = isPointInRestrictedArea({ x: newX, y: newY - height });
      const isInRestrictedAreabottom = isPointInRestrictedArea({ x: newX, y: newY + height });
      if (!isInRestrictedArea && !isInRestrictedAreatop && !isInRestrictedAreabottom) {
        cell.geometry.x -= dx;
        cell.geometry.y -= dy;
      }
      // console.log(dx,dy, cell.geometry.x , cell.geometry.y)
        }
      });
    });
  connectionHandler.addListener(InternalEvent.CONNECT, (sender, evt) => {
      const edge = evt.getProperty('cell') as Cell;
      const source = edge.getTerminal(true);
      const target = edge.getTerminal(false);
      
      if (source && target) {
        // 1.获取初始化默认cell(注意是cell，不是获取的默认json)
        console.log(initpoints,'initpoints')
        // 2.深度遍历找到与之相关边
        // 3.建成path链表 
        // getNeighbors(graph,initpoints)
        // 4.path链表集成数组paths
        // 5.paths中链表头部和尾部有相同删除默认线条
        // findAndRemoveDefaultEdges(graph,initpoints)
      }
  });
  
    graphContainer.value.appendChild(div);
  }
  }
  function getNeighbors(graph:Graph, cell) {
    const model = graph.getDataModel();
    const neighbors = [];
  
    const edges = graph.getEdges(cell);
    edges.forEach(edge => {
      const source = edge.source;
      const target = edge.target;
      if (source !== cell) {
        neighbors.push(source);
      } else {
        neighbors.push(target);
      }
    });
  
    return neighbors;
  }
  
  function findPaths(graph:Graph, sourceId, targetId, visited, path, paths) {
    visited.add(sourceId);
    path.push(sourceId);
  
    if (sourceId === targetId) {
      paths.push([...path]);
      console.log(paths,'paths')
    } else {
      const cell = graph.getDataModel().getCell(sourceId);
      const neighbors = getNeighbors(graph, cell);
      console.log(neighbors,'neb')
      for (const neighbor of neighbors) {
        const neighborId = neighbor.getId();
        if (!visited.has(neighborId)) {
          findPaths(graph, neighborId, targetId, visited, path, paths);
        }
      }
    }
  
    path.pop();
    visited.delete(sourceId);
  }
  
  function findAndRemoveDefaultEdges(graph:Graph, pointsMap) {
    const model = graph.getDataModel();
    const paths = [];
  
    // const initPointKeys = Object.keys(pointsMap);
    const initPointKeys = Object.values(pointsMap);
  // console.log(initPointKeys,'initkey',Object.values(pointsMap))
    // 查找所有默认点之间的路径
    for (let i = 0; i < initPointKeys.length; i++) {
      for (let j = i + 1; j < initPointKeys.length; j++) {
        const sourceId = initPointKeys[i].id;
        const targetId = initPointKeys[j].id;
        const visited = new Set();
        const path = [];
        findPaths(graph, sourceId, targetId, visited, path, paths);
        console.log(paths,'pathspaths')
      }
    }
  
    // 删除默认连接线
    // const edgesToRemove = [];
    // paths.forEach(path => {
    //   for (let i = 0; i < path.length - 1; i++) {
    //     const source = path[i];
    //     const target = path[i + 1];
    //     const edges = graph.getEdgesBetween(model.getCell(source), model.getCell(target));
    //     edgesToRemove.push(...edges);
    //   }
    // });
  
    // if (edgesToRemove.length > 0) {
    //   graph.removeCells(edgesToRemove);
    // }
  }
  
  function createGraphContainer(): HTMLDivElement {
  const container = document.createElement('div');
  container.style.width = '100%';
  container.style.height = '100%';
  container.style.border = "1px solid black"
  
  return container;
  }
  
  function configureImagesBasePath() {
  Client.imageBasePath = '/images';
  }
  function drawAxes(graph: Graph) {
  const container = graphContainer.value;
  if (!container || !graph) return;
  
  const containerWidth = container.clientWidth - 34;
  const containerHeight = container.clientHeight;
  
  const model = graph.getDataModel();
  model.beginUpdate();
  try {
    const parent = graph.getDefaultParent();
  
    // X轴
    const xAxisLength = 20000; // X轴的总长度
    const xAxisStep = 1000; // X轴刻度间隔
    for (let i = 0; i <= xAxisLength; i += xAxisStep) {
      const label = i.toString();
      const x = (i / xAxisLength) * containerWidth;
      graph.insertVertex(parent, null, label, x, containerHeight - 10, 1, 10, {strokeColor: '#000000', strokeWidth: 1, fillColor: '#000000',movable:false});
    }
  
    // Y轴
    const yAxisLength = 20000; // Y轴的总长度
    const yAxisStep = 1000; // Y轴刻度间隔
    for (let i = 0; i <= yAxisLength; i += yAxisStep) {
      const label = i.toString();
      const y = (i / yAxisLength) * containerHeight;
      graph.insertVertex(parent, null, label, 10, containerHeight - y, 10, 1, {strokeColor: '#000000', strokeWidth: 1, fillColor: '#000000',movable:false});
    }
  } finally {
    model.endUpdate();
  }
  }
  function convertToOriginalCoordinates(point: { x: number, y: number }, containerWidth: number, containerHeight: number): { x: number, y: number } {
    const originalX = (point.x / containerWidth) * initialContainerWidth;
    const originalY = initialContainerHeight - (point.y / containerHeight) * initialContainerHeight;
    return { x: originalX, y: originalY };
  }
  
  const exports = () => {
    const model = graphs.value.getDataModel();
    const parent = graphs.value.getDefaultParent();
    const cells = graphs.value.getChildVertices(parent);
    console.log(cells,'cells')
    const container = graphContainer.value;
    const containerWidth = container ? container.clientWidth : initialContainerWidth;
    const containerHeight = container ? container.clientHeight : initialContainerHeight;
  
    // cells.forEach(cell => {
    //   if (cell.geometry) {
    //     const originalCoords = convertToOriginalCoordinates({ x: cell.geometry.x, y: cell.geometry.y }, containerWidth, containerHeight);
    //     cell.geometry.x = originalCoords.x;
    //     cell.geometry.y = originalCoords.y;
    //   }
    // });
    const vertexWidth = 20;
      const vertexHeight = 10;
  
      cells.forEach(cell => {
          if (cell.geometry) {
              const adjustedX = cell.geometry.x + vertexWidth / 2;
              const adjustedY = cell.geometry.y + vertexHeight / 2;
              const originalCoords = convertToOriginalCoordinates({ x: adjustedX, y: adjustedY }, containerWidth, containerHeight);
              cell.geometry.x = originalCoords.x;
              cell.geometry.y = originalCoords.y;
          }
      });
  
    const xml = new ModelXmlSerializer(model).export();
    popup(xml, true);
  
    // Convert back to view coordinates if necessary
    cells.forEach(cell => {
      if (cell.geometry) {
        const viewCoords = {
          x: (cell.geometry.x / initialContainerWidth) * containerWidth,
          y: containerHeight - (cell.geometry.y / initialContainerHeight) * containerHeight
        };
        cell.geometry.x = viewCoords.x;
        cell.geometry.y = viewCoords.y;
      }
    });
  };
  const getDataMessage = ()=>{
    // console.log(alldata,'all')
    restrictedAreaCoordinates = []
    dataList.point = []
    alldata.map((item)=>{
      if(item.type ==="vertex"){
       const items = {
            ...item,
            x: item["x-pos"],
            y: item["y-pos"]
        }
        restrictedAreaCoordinates.push(items)
      }else{
        const items2 = {
          id: item.name,
            ...item,
            x: item["x-pos"],
            y: item["y-pos"]
        }
        dataList.point.push(items2)
      }
    })
  }
  
  function removeDefaultConnectionsByPaths(graph: Graph, pointsMap: { [key: string]: Cell }, paths: string[][]) {
    const model = graph.getDataModel();
    model.beginUpdate();
    try {
      paths.forEach(path => {
        for (let i = 0; i < path.length - 1; i++) {
          const fromId = path[i];
          const toId = path[i + 1];
          
          // 获取连接线
          const edges = graph.getEdgesBetween(pointsMap[fromId], pointsMap[toId]);
          edges.forEach(edge => {
            if (edge.isEdge() && edge.getStyle().strokeColor === 'gray') {
              graph.removeCells([edge]);
            }
          });
        }
      });
    } finally {
      model.endUpdate();
    }
  }
  inputElement?.addEventListener("change",(event)=>{
    console.log(event,'event')
  })
  const handle = (e) => {
    console.log(e);
    let file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
      const xmlText = e.target.result;
      try {
        const jsonResult = xml2json(xmlText, { compact: true, spaces: 4 });
        console.log(JSON.parse(jsonResult));
        const conectData  = JSON.parse(jsonResult)
        const data = conectData.object.object[0].properties.entry
        let match;
        let matchs;
        let toList = [];
        data.forEach((items:any)=>{
          if(items._attributes["key"] ==='connectivity' ){
            // console.log(items.entry,'entry')
            items.entry.forEach((item:any)=>{
              // item._attributes["key"]
              const regex = /specification:([A-Z]\d)\/I\/0/g;
             match =  regex.exec(item._attributes["key"])
            //  console.log(match[1],'title')
             item.entry.forEach((its:any)=>{
              if(its._attributes["value"] ==="True"){
                const regex = /specification:([A-Z]\d)\/T\/0/g;
                matchs =  regex.exec(its._attributes["key"])
                // console.log(matchs,'m')
                toList.push({from: match[1],to: matchs[1]},)
              }
             })
            })
            console.log(toList,'toList')
            dataList.to = toList
            init()
          }
        })
        console.log(data,'data')
      } catch (e) {
        console.error('Error converting XML to JSON:', e);
      }
    };
    reader.readAsText(file);
  };
  document.onkeydown = function (e) {
        console.log('e',e.code,e.key);
        if (e.key === 'Backspace' || e.key === 'Delete') {
          e.preventDefault(); // 阻止默认的删除行为
          const selectionCell = graphs.value.getSelectionCell()
          if(selectionCell&&selectionCell.isEdge()){
            console.log(selectionCell)
            graphs.value.getDataModel().beginUpdate();
              try {
                if(selectionCell.style.deletable === false) return
                graphs.value.getDataModel().remove(selectionCell);
              } finally {
                graphs.value.getDataModel().endUpdate();
              }
          
            
          }
      }
      }
  </script>
  
  <style scoped>
  div {
  border: 1px solid #000;
  }
  </style>
  