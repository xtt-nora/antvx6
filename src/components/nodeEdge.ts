import { Graph } from "@antv/x6"
import Coordinate from "./coordinate";
import { alldata } from "./allData.json"
import { xml2json } from 'xml-js';
class NodeEdge extends Coordinate {
   restrictedAreaCoordinates:  [] = [];
   polygonPoints: { x: number; y: number }[] = [];
   dataList = {
   "point": [],
   "to":[]
   };
  constructor(xMax:number=20000,yMax:number=20000){
    super("black", 1, 1000, 1000, xMax, yMax);
  }
  getPoint(graph:Graph){
const xRatio = graph.options.width / this.xMax;
const yRatio = graph.options.height / this.yMax;
this.restrictedAreaCoordinates = []
this.dataList.point = []
let parentNodes: any[] = [];
let childNodes:any[] = []
alldata.map((item)=>{
if(item.type ==="vertex"){
const items = graph.addNode({
  ...item,
  x: item['x-pos'] * xRatio,
  y: item['y-pos'] * yRatio,
  shape: "rect",
  width: 1,
  height: 1,
attrs: {
text: {
  fontSize: 12,
  fill: '#262626',
  transform:"scale(1, -1)"
},
},
tools: [
{
  name: 'node-editor',
  args: {
    attrs: {
      backgroundColor: 'red',
    },
  },
},
]
})
  items.setProp('isMove','yes')
  items.setProp('initType','vertex')
  this.restrictedAreaCoordinates.push(items)
  parentNodes.push(items);
}else{
const items2 = graph.addNode({
  ...item,
  x: item['x-pos'] * xRatio,
  y: item['y-pos'] * yRatio,
shape: 'custom-rect',
attrs: {
text: {
  text:item.name,
  fontSize: 12,
  fill: '#262626',
  transform:"scale(1, -1)"
},
},
tools: [
{
  name: 'node-editor',
  args: {
    attrs: {
      backgroundColor: 'red',
    },
  },
},
]
})
// items2.setProp('isMove','yes')
  this.dataList.point.push(items2)
  childNodes.push(items2);
}
})
for (let i = 0; i < this.restrictedAreaCoordinates.length - 1; i++) {
  graph.addEdge({
      source: { cell: parentNodes[i].id },
      target: { cell: parentNodes[i + 1].id },
      attrs: {
          line: {
              stroke: '#5F95FF',
              strokeWidth: 2,
              targetMarker: null
          }
      }
  });
}
this.polygonPoints = this.restrictedAreaCoordinates.map(node => {
  console.log(this.restrictedAreaCoordinates,'this.restrictedAreaCoordinates')
  const pos = node.position();
  return { x: pos.x, y: pos.y };
});
  }
   // 用于检查点是否在多边形内部的函数
   isPointInPolygon(point: { x: number; y: number }, polygon: { x: number, y: number }[] = this.polygonPoints): boolean {
    let isInside = false;
    const { x, y } = point;
    const points = polygon;
    console.log(points,'points')
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const xi = points[i].x, yi = points[i].y;
      const xj = points[j].x, yj = points[j].y;
      const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) isInside = !isInside;
    }
    return isInside;
  }
  handle(e: { target: { files: any[]; }; },graph:Graph){
    let file = e.target.files[0];
    let childNodes:any[] = this.dataList.point
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const xmlText = e.target?.result;
      try {
        const jsonResult = xml2json(xmlText, { compact: true, spaces: 4 });
        console.log(JSON.parse(jsonResult));
        const conectData  = JSON.parse(jsonResult)
        const data = conectData.object.object[0].properties.entry
        let match: any[] | null;
        let matchs;
        let toList: { from: any; to: string; }[] = [];
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
           this.dataList.to = toList
          }
        })
        console.log(this.dataList,'toto')
        this.dataList.to.forEach(item=>{
            const sourceCell = this.dataList.point.find(ele=>ele.store.data.name === item.from)
            const targetCell =  this.dataList.point.find(ele=>ele.store.data.name === item.to)
            if (sourceCell && targetCell) {
              console.log(sourceCell.id,targetCell)
              graph.addEdge({
                source: { cell: sourceCell.id },
                target: { cell: targetCell.id },
                attrs: {
                    line: {
                        stroke: 'gray',
                        strokeWidth: 1,
                        strokeDasharray: '5 5', //虚线
                        targetMarker: null
                    }
                }
            });
            }
        })
      } catch (e) {
        console.error('Error converting XML to JSON:', e);
      }
    };
    reader.readAsText(file);


  };
}
export default NodeEdge