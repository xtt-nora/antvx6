<template>
   <!-- <button type="button" class="big" @click="zoomIn">放大</button>
 <button type="button" class="small" @click="zoomOut">缩小</button> -->
 <button type="button" class="small" @click="exports">输出</button>
 <div ref="graphContainer" style="width: 900px; height: 700px;"></div>
 </template>
 
 <script lang="ts" setup>
 // import { alldata } from "./allData.json"
 import { ref, onMounted } from 'vue';
 import { Graph, GraphDataModel, MaxToolbar, Client, Cell, Geometry, CellStyle, ImageBox, InternalEvent, constants, gestureUtils, styleUtils, RubberBandHandler, ConnectionHandler, Point, eventUtils, ModelXmlSerializer, popup } from '@maxgraph/core';
 
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
 // 当前缩放级别
 let zoomLevel = 1;
 // 坐标轴初始刻度值
 let xAxisScale = 20000;
 let yAxisScale = 20000;
 
 const initialContainerWidth = 20000; // 原始容器的宽度
 const initialContainerHeight = 20000; // 原始容器的高度
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
 
   const intersect = ((yi > point.y) !== (yj > point.y)) &&
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
     edge.setStyle({endArrow:"none",movable:false}); // 设置连接线无箭头且不能移动
   }
 } finally {
   model.endUpdate();
 }
 }
 function addDefaultDataPointsAndConnections(graph: Graph, data: any) {
     const dataPointStyle: CellStyle = {
       shape: 'ellipse', perimeter: 'ellipsePerimeter'
     };
 
     const edgeStyle: CellStyle = {
       strokeColor: '#000000',
       strokeWidth: 1,
       // edgeStyle: 'orthogonalEdgeStyle'
     };
     console.log(graph.getDataModel())
     const model = graph.getDataModel();
     model.beginUpdate();
     try {
       const parent = graph.getDefaultParent();
 
       // Add data points
       const pointsMap: { [key: string]: Cell } = {};
       data.point.forEach((point: any) => {
         if(point.type ==="T-NIU"){
           pointsMap[point.id] = graph.insertVertex(parent, null,point.id, point.x, point.y, 50, 40, {});
         }else if(point.type ==="I-NIU"){
           pointsMap[point.id] = graph.insertVertex(parent, null,point.id, point.x, point.y, 50, 40, {});
         }else if(point.type ==="Switch"){
           pointsMap[point.id] = graph.insertVertex(parent, null,"Switch", point.x, point.y, 40, 40, dataPointStyle);
         }else if(point.type ==="Link"){
           pointsMap[point.id] = graph.insertVertex(parent, null,"Link", point.x, point.y, 40, 40, {});
         }
       });
 
       // Add edges (connections) between data points
       data.to.forEach((link: any) => {
         graph.insertEdge(parent, null, '', pointsMap[link.from], pointsMap[link.to], edgeStyle);
       });
     } finally {
       model.endUpdate();
     }
   }
 onMounted(() => {
 init()
 });
 const init=()=>{
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
 
 // restrictedAreaCoordinates.forEach(point => {
 // point.x = (point.x / initialContainerWidth) * containerWidth;
 // point.y = containerHeight - (point.y / initialContainerHeight) * containerHeight;
 // });
   const container = createGraphContainer();
   div.appendChild(container);
   const model = new GraphDataModel();
   const graph = new Graph(container, model);
   graphs.value = graph
   const connectionHandler = graph.getPlugin('ConnectionHandler') as ConnectionHandler;
   connectionHandler.connectImage = new ImageBox(`${Client.imageBasePath}/connector.gif`, 16, 16);
   graph.setConnectable(true);
   graph.setMultigraph(false);
   graph.setCellsResizable(false);
   addDefaultDataPointsAndConnections(graph, dataList);
 
   new RubberBandHandler(graph);
   drawPolygon(graph, restrictedAreaCoordinates);
   drawAxes(graph); // 初始化时绘制坐标轴
   // 监听鼠标滚轮事件实现缩放
   container.addEventListener('wheel', handleMouseWheel);
 // 监听容器大小变化
 window.addEventListener('resize', () => {
 drawAxes(graph);
 });
   addVertex('images/rectangle.gif', 50, 40, {}, "T-NIU");
   addVertex('images/ellipse.gif', 40, 40, { shape: 'ellipse', perimeter: 'ellipsePerimeter' }, "Switch");
   addVertex('images/rectangle.gif', 50, 40, {}, "I-NIU");
   addVertex('images/rectangle.gif', 50, 40, {}, "Link");
 
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
         // x !== undefined && (vertex.geometry.x = x);
         // y !== undefined && (vertex.geometry.y = y);
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
       // graph.addCell(vertex, null);
       // graph.setSelectionCell(vertex);
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
 
     const isInRestrictedArea = isPointInRestrictedArea({ x: newX, y: newY });
     if (!isInRestrictedArea) {
       cell.geometry.x -= dx;
       cell.geometry.y -= dy;
     }
     console.log(dx,dy, cell.geometry.x , cell.geometry.y)
       }
     });
   });
   graphContainer.value.appendChild(div);
 }
 }
 function createGraphContainer(): HTMLDivElement {
 const container = document.createElement('div');
 container.style.width = '100%';
 container.style.height = '100%';
 container.style.border = "1px solid black"
 
 return container;
 }
 function handleMouseWheel(evt: WheelEvent) {
   if (!graphs.value) return;
 
   const delta = evt.deltaY;
   const container = graphContainer.value;
   const containerWidth = container.clientWidth - 34;
   const containerHeight = container.clientHeight;
   // // 根据滚轮滚动方向调整坐标轴刻度
   // if (delta > 0) {
   //   xAxisScale *= 1.1; // 缩小坐标轴刻度
   //   yAxisScale *= 1.1;
   // } else if (delta < 0) {
   //   xAxisScale *= 0.9; // 放大坐标轴刻度
   //   yAxisScale *= 0.9;
   // }
   const scaleMultiplier = delta > 0 ? 0.9 : 1.1; // 根据滚动方向决定放大或缩小
   
  // 计算新的刻度值
  let newScale = delta > 0 ? Math.floor(xAxisScale * scaleMultiplier) : Math.ceil(xAxisScale * scaleMultiplier);
 
 // 确保不超过最大值 20000
 newScale = Math.min(Math.max(newScale, 100), 20000);
 
 // 更新刻度值
 xAxisScale = newScale;
 yAxisScale = newScale;
 
   // 更新节点的显示坐标
   updateNodePositions(graphs.value,containerWidth,containerHeight);
 
   // 重新绘制坐标轴和节点
   redrawAxes();
 }
 // 更新节点的显示坐标
 function updateNodePositions(graph: Graph, containerWidth: number, containerHeight: number) {
   // 根据新的刻度重新计算节点的显示位置
   dataList.point.forEach(point => {
     const x = (point.x / initialContainerWidth) * containerWidth;
     const y = containerHeight - (point.y / initialContainerHeight) * containerHeight;
 
         const cell = graph.getDataModel().getCell(point.id);
         if (cell && cell.geometry) {
             cell.geometry.x = x;
             cell.geometry.y = y;
         }
   });
 
   // 更新限制区域坐标
   restrictedAreaCoordinates.forEach(point => {
     point.x = (point.x / initialContainerWidth) * containerWidth;
     point.y = containerHeight - (point.y / initialContainerHeight) * containerHeight;
   });
   
 }
 // 重新绘制坐标轴和节点
 function redrawAxes() {
   // 调用重新绘制坐标轴的函数
   drawAxes(graphs.value);
 }
 function configureImagesBasePath() {
 Client.imageBasePath = '/images';
 }
 function drawAxes(graph: Graph) {
   if (!graphContainer.value || !graph) return;
 
   // 清除现有的坐标轴和节点
   const model = graph.getDataModel();
   model.clear();
 
   // 计算新的容器尺寸
   const container = graphContainer.value;
   const containerWidth = container.clientWidth - 34;
   const containerHeight = container.clientHeight;
 
   // 重新绘制 X 轴
   drawXAxis(graph, containerWidth, containerHeight);
 
   // 重新绘制 Y 轴
   drawYAxis(graph, containerWidth, containerHeight);
 
   // 更新节点的位置
   updateNodePositions(graph,containerWidth,containerHeight);
   drawPolygon(graph, restrictedAreaCoordinates);
   addDefaultDataPointsAndConnections(graph, dataList);
   
 }
 
 // 绘制 X 轴
 function drawXAxis(graph: Graph, containerWidth: number, containerHeight: number) {
   const stepSize = Math.floor(xAxisScale / 20); // 刻度间隔，这里简单设定为总长度的十分之一
   const stepCount = Math.floor(xAxisScale / stepSize);
   const container = graphContainer.value;
   const parent = graph.getDefaultParent();
   const model = graph.getDataModel();
   model.beginUpdate();
 
   try {
     for (let i = 0; i <= stepCount; i++) {
       const label = (i * stepSize).toString();
       const x = (i / stepCount) * containerWidth;
       const y = containerHeight - 10;
       graph.insertVertex(parent, null, label, x, y, 1, 10, {
         strokeColor: '#000000',
         strokeWidth: 1,
         fillColor: '#000000',
         movable:false
       });
     }
   } finally {
     model.endUpdate();
   }
 }
 
 // 绘制 Y 轴
 function drawYAxis(graph: Graph, containerWidth: number, containerHeight: number) {
   const stepSize = Math.floor(yAxisScale / 20); // 计算刻度间隔，确保是整数
   const stepCount = Math.floor(yAxisScale / stepSize);
   const container = graphContainer.value;
   const parent = graph.getDefaultParent();
   const model = graph.getDataModel();
   model.beginUpdate();
 
   try {
     for (let i = 0; i <= stepCount; i++) {
       const label = (i * stepSize).toString();
       const x = 10;
       const y = containerHeight - (i / stepCount) * containerHeight;
       graph.insertVertex(parent, null, label, x, y, 10, 1, {
         strokeColor: '#000000',
         strokeWidth: 1,
         fillColor: '#000000',
         movable:false
       });
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
   const container = graphContainer.value;
   const containerWidth = container ? container.clientWidth : initialContainerWidth;
   const containerHeight = container ? container.clientHeight : initialContainerHeight;
 
   cells.forEach(cell => {
     if (cell.geometry) {
       const originalCoords = convertToOriginalCoordinates({ x: cell.geometry.x, y: cell.geometry.y }, containerWidth, containerHeight);
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
 
 </script>
 
 <style scoped>
 div {
 border: 1px solid #000;
 }
 </style>
 