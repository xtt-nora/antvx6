import { Graph } from "@antv/x6"

class Coordinate {
    axisColor: string;
    strokeWidth: number;
    xScaleCount: number;
    xMax:number;
    yMax:number;
    yScaleCount: number;
        constructor(axisColor:string= "black",strokeWidth:number = 1,xScaleCount:number = 1000,yScaleCount:number = 1000, xMax:number = 20000,yMax:number = 20000,) {
            this.axisColor = axisColor;
            this.strokeWidth = strokeWidth;
            this.xScaleCount = xScaleCount;
            this.yScaleCount = yScaleCount;
            this.xMax = xMax;
            this.yMax = yMax;
          }
    axis(graph:Graph){
      const edge =  graph.addEdge({
            shape: 'edge',
            attrs: {
              line: {
                stroke: this.axisColor,
                strokeWidth: this.strokeWidth,
              },
            },
            source: { x: 0, y: 0 },
            target: { x: graph.options.width, y: 0 },
          })
      const edge2 =  graph.addEdge({
            shape: 'edge',
            attrs: {
              line: {
                stroke: this.axisColor,
                strokeWidth: 2,
              },
            },
            source: { x: 0, y: 0 },
            target: { x: 0, y: graph.options.height },
          })
          edge.setProp({'isMove': 'yes','coor': 'yes',})
          edge2.setProp({'isMove': 'yes','coor': 'yes',})
    }
    paint(graph:Graph){
        this.axis(graph)
        const xRatio = graph.options.width / this.xMax;
        // const step =  graph.options.width/this.xScaleCount
        for(let i = this.xScaleCount;i<this.xMax;i+= this.xScaleCount){
            const scaledX = i * xRatio;
           const node =  graph.addNode({
                shape: "rect",
                x:scaledX ,
                y: -6,
                width: 0,
                height: 0,
                attrs: {
                  body: {
                    stroke: this.axisColor,
                    fill: this.axisColor,
                  },
                  text: {
                    text: i.toString(),
                    fontSize: 12,
                    fill: 'red',
                    transform:"scale(1, -1)",
                   
                  },
                },
              });
           const edge =  graph.addEdge({
                source:{x:scaledX,y:0},
                target:{x:scaledX,y:5},
                attrs: {
                    line: {
                      stroke: '#A2B1C3',
                      strokeWidth: 1,
                      targetMarker: null,
                    },
                  },
            })
            node.setProp({'isMove': 'yes','coor': 'yes',})
            edge.setProp({'isMove': 'yes','coor': 'yes',})
        }

        // const stepY = graph.options.height/this.xScaleCount
        const yRatio = graph.options.height / this.yMax;
        for(let i = this.yScaleCount;i<this.yMax;i+= this.yScaleCount){
            const scaledY = i * yRatio;
           const node =  graph.addNode({
                shape: "rect",
                x:-15,
                y: scaledY,
                width: 0,
                height: 0,
                attrs: {
                  body: {
                    stroke: this.axisColor,
                    fill: this.axisColor,
                  },
                  text: {
                    text:i.toString(),
                    fontSize: 12,
                    fill: 'red',
                    transform:"scale(1, -1)",
                  },
                },
              });
           const edge =  graph.addEdge({
                source:{x:0,y:scaledY},
                target:{x:5,y:scaledY},
                attrs: {
                    line: {
                      stroke: '#A2B1C3',
                      strokeWidth: 1,
                      targetMarker: null,
                    },
                  },
            })
            node.setProp({'isMove': 'yes','coor': 'yes',})
            edge.setProp({'isMove': 'yes','coor': 'yes',})
        }

    }
}
export default Coordinate