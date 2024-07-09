<template>
 <div style="width:100%; height:100%; display: flex; flex-direction: row;">
  <input type="file" id="input" name="input" @change="handle" style="position: absolute;bottom: 10px;left: 20px;z-index: 9999;"/>
  <div ref="stencil" id="stencil"></div>
  <div ref="graphContainer" id="container"></div>
</div>
</template>

<script setup lang="ts">
import { CellView, Graph } from '@antv/x6';
import { Stencil } from '@antv/x6-plugin-stencil';
import { Transform } from '@antv/x6-plugin-transform';
import { Selection } from '@antv/x6-plugin-selection';
import { Snapline } from '@antv/x6-plugin-snapline';
import { Keyboard } from '@antv/x6-plugin-keyboard';
import { Clipboard } from '@antv/x6-plugin-clipboard';
import { History } from '@antv/x6-plugin-history';
import { onMounted, ref } from 'vue';
import Coordinate from './coordinate';
import { alldata } from "./allData.json"
import NodeEdge from './nodeEdge';
const graphContainer = ref<HTMLElement | null>(null);
  let coordinate = new Coordinate()
  let nodeEdge = new NodeEdge()
  let graphValue: Graph;
onMounted(()=>{
  init()
})
function init (){
  const graph = new Graph({
  container: graphContainer.value,
  // autoResize: true,
  panning:true,
  // mousewheel: true,
  background: {
    color: '#F2F7FA',
  },
  grid: {
        visible: true,
        type: 'doubleMesh',
        args: [
          {
            color: '#eee', // 主网格线颜色
            thickness: 1, // 主网格线宽度
          },
          {
            color: '#ddd', // 次网格线颜色
            thickness: 1, // 次网格线宽度
            factor: 4, // 主次网格线间隔
          },
        ],
      },
    // 设置滚动条、缩放
    scroller: {
        enabled: true,
        pannable: true,
      },
      interacting: function (cellView: CellView) {
      if (cellView.cell.getProp("isMove")) {
        return { vertexAdd: false, nodeMovable: false,edgeMovable: false };
      }
      return true;
    },
})
graph.zoom(-0.2)
console.log(graph,'graph')
graphValue = graph;
coordinate.paint(graph)
let dom = document.querySelector(".x6-graph-svg")
dom.style.transform = 'scale(1,-1)'
const stencil = new Stencil({
  title: '流程图',
  target: graph,
  stencilGraphWidth: 200,
  stencilGraphHeight: 180,
  collapsable: true,
  groups: [
    {
      title: '基础流程图',
      name: 'group1',
    },
  ],
  layoutOptions: {
    columns: 2,
    columnWidth: 80,
    rowHeight: 55,
  },
})
document.getElementById('stencil')!.appendChild(stencil.container)
// document.getElementById('stencil')!.appendChild(stencil.container)
graph
.use(
    new Transform({
      resizing: true,
      rotating: true,
    }),
  )
  .use(
    new Selection({
      rubberband: true,
      showNodeSelectionBox: true,
    }),
  )
  .use(new Snapline())
  .use(new Keyboard())
  .use(new Clipboard())
  .use(new History())

  initNode(graph,stencil)
  keyBoard(graph)
  graphContainer.value.addEventListener('wheel', (event) => {
  event.preventDefault();
  zoom(graphValue, event.deltaY);
});
  const showPorts = (ports: NodeListOf<SVGElement>, show: boolean) => {
  for (let i = 0, len = ports.length; i < len; i += 1) {
    ports[i].style.visibility = show ? 'visible' : 'hidden'
  }
}
graph.on('node:mouseenter', () => {
  const container = document.getElementById('container')!
  const ports = container.querySelectorAll(
    '.x6-port-body',
  ) as NodeListOf<SVGElement>
  showPorts(ports, true)
})
graph.on('node:mouseleave', () => {
  const container = document.getElementById('container')!
  const ports = container.querySelectorAll(
    '.x6-port-body',
  ) as NodeListOf<SVGElement>
  showPorts(ports, false)
})
}
function initNode (graph:Graph,stencil:Stencil){
  const ports = {
  groups: {
    top: {
      position: 'top',
      attrs: {
        circle: {
          r: 4,
          magnet: true,
          stroke: '#5F95FF',
          strokeWidth: 1,
          fill: '#fff',
          style: {
            visibility: 'hidden',
          },
        },
      },
    },
    right: {
      position: 'right',
      attrs: {
        circle: {
          r: 4,
          magnet: true,
          stroke: '#5F95FF',
          strokeWidth: 1,
          fill: '#fff',
          style: {
            visibility: 'hidden',
          },
        },
      },
    },
    bottom: {
      position: 'bottom',
      attrs: {
        circle: {
          r: 4,
          magnet: true,
          stroke: '#5F95FF',
          strokeWidth: 1,
          fill: '#fff',
          style: {
            visibility: 'hidden',
          },
        },
      },
    },
    left: {
      position: 'left',
      attrs: {
        circle: {
          r: 4,
          magnet: true,
          stroke: '#5F95FF',
          strokeWidth: 1,
          fill: '#fff',
          style: {
            visibility: 'hidden',
          },
        },
      },
    },
  },
  items: [
    {
      group: 'top',
    },
    {
      group: 'right',
    },
    {
      group: 'bottom',
    },
    {
      group: 'left',
    },
  ],
}
Graph.registerNode(
  'custom-rect',
  {
    inherit: 'rect',
    width: 60,
    height: 36,
    attrs: {
      body: {
        strokeWidth: 1,
        stroke: '#5F95FF',
        fill: '#EFF4FF',
      }
    },
    
    ports: { ...ports },
  },
  true,
)
Graph.registerNode(
  'custom-circle',
  {
    inherit: 'circle',
    width: 45,
    height: 45,
    attrs: {
      body: {
        strokeWidth: 1,
        stroke: '#5F95FF',
        fill: '#EFF4FF',
      },
      text: {
        fontSize: 12,
        fill: '#262626',
      },
    },
    ports: { ...ports },
  },
  true,
)
const r2 = graph.createNode({
  shape: 'custom-rect',
  // label: '过程',
    attrs: {
    text: {
      fontSize: 12,
      fill: '#262626',
      transform:"scale(1, -1)"
    }
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
  ],
})
const r6 = graph.createNode({
  shape: 'custom-circle',
  // label: '连接',
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
stencil.load([r2, r6], 'group1')
nodeEdge.getPoint(graph)
}
function keyBoard (graph:Graph){
  graph.bindKey(['meta+c', 'ctrl+c'], () => {
  const cells = graph.getSelectedCells()
  if (cells.length) {
    graph.copy(cells)
  }
  return false
})
graph.bindKey(['meta+x', 'ctrl+x'], () => {
  const cells = graph.getSelectedCells()
  if (cells.length) {
    graph.cut(cells)
  }
  return false
})
graph.bindKey(['meta+v', 'ctrl+v'], () => {
  if (!graph.isClipboardEmpty()) {
    const cells = graph.paste({ offset: 32 })
    graph.cleanSelection()
    graph.select(cells)
  }
  return false
})

// undo redo
graph.bindKey(['meta+z', 'ctrl+z'], () => {
  if (graph.canUndo()) {
    graph.undo()
  }
  return false
})
graph.bindKey(['meta+shift+z', 'ctrl+shift+z'], () => {
  if (graph.canRedo()) {
    graph.redo()
  }
  return false
})

// select all
graph.bindKey(['meta+a', 'ctrl+a'], () => {
  const nodes = graph.getNodes()
  if (nodes) {
    graph.select(nodes)
  }
})

// delete
graph.bindKey('backspace', () => {
  const cells = graph.getSelectedCells()
  if (cells.length) {
    graph.removeCells(cells)
  }
})

// zoom
graph.bindKey(['ctrl+1', 'meta+1'], () => {
  const zoom = graph.zoom()
  if (zoom < 1.5) {
    graph.zoom(0.1)
  }
})
graph.bindKey(['ctrl+2', 'meta+2'], () => {
  const zoom = graph.zoom()
  if (zoom > 0.5) {
    graph.zoom(-0.1)
  }
})
}
function handle(e: any) {
  nodeEdge.handle(e, graphValue);
}
function zoom(graph: Graph, delta: number) {
    const scaleFactor = delta > 0 ? 1.1 : 0.9;
    console.log(coordinate.xMax,coordinate.yMax,graph)
    const xRatio = graph.options.width / coordinate.xMax;
    const yRatio = graph.options.height / coordinate.yMax;
    //新的坐标轴最大值
    const newXMax = coordinate.xMax * scaleFactor;
    const newYMax = coordinate.yMax * scaleFactor;
    //所有节点
    const nodes = graph.getNodes()
    console.log(nodes,'nodes')
   let notCoorList = []
  nodes.filter(ele=>{
      const coor = ele.getProp('coor')
      console.log(coor,'coor')
      if(coor !== 'yes'){
        notCoorList.push(ele)
      }
    })
    console.log(notCoorList)
     graph.clearCells();
  coordinate.xMax = newXMax;
  coordinate.yMax = newYMax;
  coordinate.paint(graph);
const xNewRatio = graph.options.width /newXMax;
const yNewRatio = graph.options.height / newXMax;
  notCoorList.forEach(node=>{
    const orginX =node.position().x / xRatio
    const orginY =node.position().y / yRatio
    const newX = orginX * xNewRatio
    const newY = orginY * yNewRatio

    graph.addNode({
      id: node.id,
      shape: node.shape,
      x: newX,
      y: newY,
      width: node.width,
      height: node.height,
      attrs: node.attrs,
    })
  })
}
</script>
<style scoped>
  #stencil {
      width: 200px;
      height: 100%;
      position: relative;
      border-right: 1px solid #dfe3e8;
    }
    #container {
      flex: 1px;
      height: 100%;
      position: relative;
      border-right: 1px solid #dfe3e8;
    }
</style>
