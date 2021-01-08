/*
* 入口文件
*   -负责读文件,渲染和交互
*/

const svg = d3.select("svg");
const width = 1200, height = 800;   //svg的长和宽
const padding = {top: 30, bottom: 30};    //为防止树溢出上下边界，设置padding
const nodeWid = 10, nodeHei = 20;   //svg中节点的宽和高

let tree;   // 树对象
let layers;   //绘制该树的层数
let separation;   //svg中层与层之前的高度
let numOfEachLayer = [];  //每层的节点个数
const gap = 1;     // 节点和边之间的间隔大小
const familyGap = 0.5;    // 不同父母的节点之间的gap，gap*节点宽度为实际的间隔

let Gradient;   // 颜色渐变器
let links;     // 边元素
let nodes;    //节点元素（包括分割线）

// 初始化绘制树
function renderInit(){
  // 移走之前绘制的边和点
  svg.selectAll("path").remove();
  svg.selectAll("rect").remove();
  svg.selectAll("line").remove();

  // 颜色渐变器
  Gradient = svg.append('defs').append('linearGradient')
      .attr('id', 'grad')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
  Gradient.append('stop')
      .attr('offset', '0%')
      .style('stop-color', 'orange')
      .style('stop-opacity', '0.35');
  Gradient.append('stop')
      .attr('offset', '100%')
      .style('stop-color', 'orange')
      .style('stop-opacity', '0.03');

  // 绘制边
  links = svg.selectAll(".links").data(tree.links).enter().append("g")
      .classed("linkG", "true")
      .each(function (d, i){
        //绘制边
        d3.select(this).append("path")
            .attr("stroke", "none")
            .attr("stroke-width", "0")
            .attr("fill", "url(#grad)")
            .attr("d", function (d){
              // 重新计算边
              let srcWid = (d.source.extension>1? 1:d.source.extension)*nodeWid;   // 计算父节点的宽度
              let srcStartX = d.source.x - srcWid/2;                                // 父节点的起始x坐标
              let band = srcWid / d.target.broNum;            // 父节点每个brand的宽度
              let tgtWid = (d.target.extension>1? 1:d.target.extension)*nodeWid;   // 计算孩子节点的宽度
              let hei = nodeHei+gap*2;  // 增加节点的宽度,使节点与边之间留出空隙
              let pathAttr = "M" + [srcStartX + band*(d.target.broID+1), d.source.y+hei/2].join(" ")
                  + " L" + [srcStartX + band*(d.target.broID), d.source.y+hei/2].join(" ")
                  + " L" + [d.target.x-tgtWid/2, d.target.y-hei/2].join(" ")
                  + " L" + [d.target.x+tgtWid/2, d.target.y-hei/2].join(" ")+" Z";
              return pathAttr;
            });

        // 绘制边的分割线
        if(d.target.broID === 0){
          // 第一个孩子节点
          d3.select(this).append("line")
              .attr("stroke", "white")
              .attr("stroke-width", "0.8")
              .attr("x1", d => {
                return d.source.x - (d.source.extension>1? 1:d.source.extension)*nodeWid/2;
              })
              .attr("y1", d =>{
                return d.source.y+(nodeHei+gap*2)/2;
              })
              .attr("x2", d => {
                return d.target.x-(d.target.extension>1? 1:d.target.extension)*nodeWid/2;
              })
              .attr("y2", d => {
                return d.target.y-(nodeHei+gap*2)/2;
              });
        }
        else if(d.target.broID === d.target.broNum-1){
          // 最后一个孩子节点
          d3.select(this).append("line")
              .attr("stroke", "white")
              .attr("stroke-width", "0.8")
              .attr("x1", d => {
                return d.source.x + (d.source.extension>1? 1:d.source.extension)*nodeWid/2;
              })
              .attr("y1", d =>{
                return d.source.y+(nodeHei+gap*2)/2;
              })
              .attr("x2", d => {
                return d.target.x+(d.target.extension>1? 1:d.target.extension)*nodeWid/2;
              })
              .attr("y2", d => {
                return d.target.y-(nodeHei+gap*2)/2;
              });
        }


      });

  // 绘制节点和分割线
  nodes = svg.selectAll(".nodes").data(tree.nodes).enter().append("g")
      .classed("nodeG", "true")
      .each(function (d, i){
        // 绘制节点
        d3.select(this).append("rect")
            .attr("x", d.x-nodeWid*d.extension/2)
            .attr("y", d.y-nodeHei/2)
            .attr("width", nodeWid*d.extension)
            .attr("height", nodeHei)
            .attr("fill", "#ced4da")
            .attr("fill-opacity", "0.3")
            .attr("stroke", "black")
            .attr("stroke-width", "0.7")
            .attr("stroke-opacity", "1")
            .attr("id", d => "node"+d.index)    // 为每个节点分配ID
            .on("dblclick", function (){
              console.log("rect单击事件")
              /*
               * 当鼠标停留在某一个节点上的时候该节点就会被拉长
               */
              if(d.extension <= 1){
                focusNodeEnter(d.index, 10);
              }
              else{
                focusNodeEnter(d.index, 1);
              }
            })
            .on("click", function (){
              /**
               * 双击节点显示出节点的父亲和孩子
               */
              console.log("双击事件@");
              tree.recover();
              detailDisplayEnter(d.index);
            });

        // 绘制分割线
        // if(d.layerID !== numOfEachLayer[d.depth]-1){
        //   d3.select(this).append("line")
        //       .attr("x1", d.x+nodeWid*d.extension/2)
        //       .attr("y1", d.y-nodeHei/2)
        //       .attr("x2", d.x+nodeWid*d.extension/2)
        //       .attr("y2", d.y+nodeHei/2)
        //       .attr("stroke", "orange")
        //       .attr("stroke-width", "1")
        //       .attr("stroke-dasharray", d => {
        //         if(d.broID+1 !== d.broNum){
        //           return "2, 2";
        //         }
        //         else{
        //           return "none";
        //         }
        //       });
        // }

      });
}

/**
 * 更新tree
 *  -节点
 *  -分割线
 *  -边
 */
function renderUpdate(){
  let nodesUpdate = d3.selectAll(".nodeG").selectAll("rect");
  let separationUpdate = d3.selectAll(".nodeG").selectAll("line");
  let linksUpdate = d3.selectAll(".linkG").selectAll("path");
  let linksSeparationUpdate = d3.selectAll(".linkG").selectAll("line");

  // 节点过渡
  nodesUpdate.transition()
      .duration(500)
      .attr("x", d => d.x - nodeWid/2*d.extension)
      .attr("y", d => d.y - nodeHei/2)
      .attr("width", d => nodeWid*d.extension)
      .attr("fill-opacity", function (d){
        return 0.3/Math.sqrt(d.extension);   // 根据 extension = 1 时， opacity 为 0.3 计算
  });
  // 分隔线过渡
  separationUpdate.filter(d => {
        return d.layerID !== numOfEachLayer[d.depth]-1;
      })
      .transition()
      .duration(500)
      .attr("x1", d => d.x+nodeWid*d.extension/2)
      .attr("x2", d => d.x+nodeWid*d.extension/2);

  // 边过渡
  linksUpdate.transition()
      .duration(500)
      .attr("d", d => {
        // 重新计算边
        let srcWid = (d.source.extension>1? 1:d.source.extension)*nodeWid;   // 计算父节点的宽度
        let srcStartX = d.source.x - srcWid/2;                                // 父节点的起始x坐标
        let band = srcWid / d.target.broNum;            // 父节点每个brand的宽度
        let tgtWid = (d.target.extension>1? 1:d.target.extension)*nodeWid;   // 计算孩子节点的宽度
        let hei = nodeHei+gap*2;  // 增加节点的宽度,使节点与边之间留出空隙
        let pathAttr = "M" + [srcStartX + band*(d.target.broID+1), d.source.y+hei/2].join(" ")
            + " L" + [srcStartX + band*(d.target.broID), d.source.y+hei/2].join(" ")
            + " L" + [d.target.x-tgtWid/2, d.target.y-hei/2].join(" ")
            + " L" + [d.target.x+tgtWid/2, d.target.y-hei/2].join(" ")+" Z";
        return pathAttr;
      });

  // 边分隔线过渡
  linksSeparationUpdate.transition()
      .duration(500)
      .attr("x1", d => {
        if (d.target.broID === 0){
          return d.source.x - (d.source.extension>1? 1:d.source.extension)*nodeWid/2;
        }
        else if(d.target.broID === d.target.broNum-1){
          return d.source.x + (d.source.extension>1? 1:d.source.extension)*nodeWid/2;
        }
      })
      .attr("y1", d =>{
        if (d.target.broID === 0){
          return d.source.y+(nodeHei+gap*2)/2;
        }
        else if(d.target.broID === d.target.broNum-1){
          return d.source.y+(nodeHei+gap*2)/2;
        }
      })
      .attr("x2", d => {
        if (d.target.broID === 0){
          return d.target.x-(d.target.extension>1? 1:d.target.extension)*nodeWid/2;
        }
        else if(d.target.broID === d.target.broNum-1){
          return d.target.x+(d.target.extension>1? 1:d.target.extension)*nodeWid/2;
        }
      })
      .attr("y2", d => {
        if (d.target.broID === 0){
          return d.target.y-(nodeHei+gap*2)/2;
        }
        else if(d.target.broID === d.target.broNum-1){
          return d.target.y-(nodeHei+gap*2)/2;
        }
      });

}

/***
 * 更新显示文本信息
 * @param index
 * 所在的节点的ID
 * @param update
 * false=》新出现一个文本
 * true=》删除该文本
 */
function textUpdate(index, update){
  if(update){
    // 删除该文本
    svg.select("#text"+index)
        .transition()
        .duration(500)
        .attr("opacity", "0")
        .remove();
  }
  else{
    // 出现一个新的文本
    svg.append("text")
        .attr("x", tree.nodes[index].x)
        .attr("y", tree.nodes[index].y)
        .attr("dy", "0.5em")
        .attr("text-anchor", "middle")
        .attr("id", "text"+index)
        .text("Tom Jerry")
        .attr("family-size", "1em")
        .attr("opacity", "0")
        .on("dblclick", function (){
            focusNodeEnter(index, 1);
        })
        .transition()
        .duration(500)
        .attr("opacity", "1");
  }

}


/***
 * 鼠标点击或者悬浮于某一个节点
 *  -数据处理
 *    -根据当前节点的伸展比例改变该行其他节点的显示比例
 *  -重新绘制节点和边
 *    -仅仅改变当前行节点的绘制和上下边的绘制
 * @param index
 */
function focusNodeEnter(index, extent){
  if(extent <= 1){
    textUpdate(index, true);
  }
  tree.focusNode(index, extent);
  renderUpdate();
  if(extent > 1){
    textUpdate(index, false);
  }
}

/***
 * 展开当前节点, 及其父亲，孩子
 * @param index
 * focus节点的index
 */
function detailDisplayEnter(index){
  let extension = 5;    // 展开的节点与周围的间隔
  let focus = [index];
  let parents = tree.nodes[index].parent, children = tree.nodes[index].children;

  // 分别计算三代
  tree.detailDisplay(tree.nodes[index].depth, focus, extension*2);
  if(parents.length !== 0){
    tree.detailDisplay(tree.nodes[index].depth-1, parents, extension);
  }
  if(children.length !== 0){
    tree.detailDisplay(tree.nodes[index].depth+1, children, extension);
  }

  // 在此基础上尽可能使得三代的中点在同一条直线上
  // 计算三代的中点 和 每代的中点
  let center = 0;
  let cFocus = tree.nodes[index].x, cParents = 0, cChildren = 0;
  for (let i = 0; i < parents.length; i++){
    cParents += tree.nodes[parents[i]].x;
  }
  for (let i = 0; i < children.length; i++){
    cChildren += tree.nodes[children[i]].x;
  }
  cParents /= parents.length;
  cChildren /= children.length;
  center = (cFocus+cParents+cChildren)/3;

  // 计算每一行的位移偏移量，作为参数传递
  // 分别计算三代
  // tree.centering(tree.nodes[index].depth, focus, (center-cFocus)/nodeWid);
  if(parents.length !== 0){
    tree.centering(tree.nodes[index].depth-1, parents, (center-cParents)/nodeWid);
  }
  if(children.length !== 0){
    tree.centering(tree.nodes[index].depth+1, children, (center-cChildren)/nodeWid);
  }



  // 重新绘制
  renderUpdate();
}
/**
 * 压缩整棵树
 *  -如果该节点没有孩子节点那么全部压缩到最小
 */
function compressTreeEnter(){
  tree.compressTree();
  renderUpdate();
}

/**
 * 整棵树恢复为初始状态
 */
function recoverTreeEnter(){
  tree.recover();
  renderUpdate();
}

/***
 * 显示两点之间的最短路径
 *  -参数代表这条路径的起始点 index
 * @param src
 * @param des
 */
function shortestPathEnter(src, des){
  let path = tree.getShortestPath(src, des);
  for (let i = 0; i < path.length; i++){
    tree.detailDisplay(tree.nodes[path[i]].depth, [path[i]], 8);
  }
  let center = 0;
  for (let i = 0; i < path.length; i++){
    center += tree.nodes[path[i]].x;
  }
  center /= path.length;
  for(let i = 0; i < path.length; i++){
    // tree.centering(tree.nodes[path[i]].depth, [path[i]], (center-tree.nodes[path[i]].x)/nodeWid);
  }
  renderUpdate();
}

/***
 * 重新调整每一层节点的坐标
 * @param tree
 */
function reConstructCoordi(tree){
  // 每一行重新计算位置
  for (let i = 0; i < layers; i++){
    let nodeSet = tree.getNodesByLayer(i);
    // 该方法改变的是initialxy 和 xy
    reInitialComputeLayerCoordinate(nodeSet, 0);
  }
}


//读取文件
d3.csv("./data/301_Friedrich-Wieck_200.csv").then(function (data){
  // 得到d3中tree的格式
  let treeTemp = d3.stratify().id(d=>d.name).parentId(d=>d.parent)(data);
  let rootTemp = d3.tree()(treeTemp);

  // 初始化
  layers = rootTemp.height + 1;
  separation = (height - padding.top - padding.bottom) / (layers - 1);
  for(let i = 0; i < layers; i++){
    numOfEachLayer.push(0);
  }
  for(let i =0; i < rootTemp.descendants().length; i++){
    numOfEachLayer[rootTemp.descendants()[i].depth]++;
  }

  // 节点预处理：为每个节点计算坐标，索引，并标注其在兄弟姐妹中的位置
  let rootNode = preprocessing(rootTemp);     // rootTemp和rootNode指向的是同一个对象

  // 初始化树，并调整每一层的节点位置，使不同父母接节点之间有间隙
  tree = new Tree(rootNode);
  reConstructCoordi(tree);
  console.log(tree);

  /**
   * 重新计算节点坐标
   *  -原来的节点不同父母的节点是靠在一起的
   *  -更新为不同父母节点的孩子之间有一个空隙
   */

  // svg添加双击compress树事件
  svg.on("dblclick", function (){
    console.log("svg单击事件");
    if(!tree.isFold){
      compressTreeEnter();
      tree.isFold = true;
    }
    else{
      recoverTreeEnter();
      tree.isFold = false;
    }
  })
  // 初始化绘制树
  renderInit();


  // 触发某个节点，focus节点展开，其余节点压缩
  // focusNodeEnter(10);

  // 压缩整棵树
  // compressTreeEnter();

  //显示两点之间的最短路径
  // shortestPathEnter(2, 195);



})


