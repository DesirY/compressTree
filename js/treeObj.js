/**
 * tree对象，管理tree的数据结构
 *  -属性
 *    -根节点ID  -rootID
 *    -树的高度 -height
 *    -树的节点数量 -nodeNum
 *    -每一层中的节点ID list -nodesInEachLayer
 *    -节点 -nodes
 *    -边 -links
 *    -节点和边的映射方式 {"parentIndex": edgeIndex, ,,,,,}
 *    -每个节点的最大压缩程度 miniExtent
 *
 *  -方法
 *    -对外接口
 *      -得到指定层中的所有节点
 *      -根据ID返回节点
 *      -返回某个节点的孩子节点
 *      -返回某个节点的父亲节点
 *      -返回以某个节点为父节点的边
 *      -返回以某个节点为子节点的边
 *      -focus某个点时，修改每个节点的extent   focusNode
 *      -重新计算某一层节点的位置  -reComputeLayerCoordinate
 *      -当前树的状态  折叠/展开
 *    -私有方法
 * @param root
 * @constructor
 */
function Tree(root){
  console.log(root.descendants());
  this.rootID = 0;
  this.height = root.height+1;
  this.nodeNum = root.descendants().length;
  this.nodesInEachLayer = getNodesInEachLayer(root);   // 每一层中节点的ID
  this.nodes = getAllNodeObj(root.descendants());            // 节点
  this.links = getAllLinkObj(this.nodes);       // 返回所有边
  this.nodeLinkMap = getNodeLinkMap(this.links);        // 父节点和边的映射
  this.miniExtent = 0.5;      //每个节点的最大压缩程度
  this.isFold = false;      // 标志当前整棵树是折叠状态还是展开状态

  /**
   * 返回每一层中的节点ID
   * @param node
   */
  function getNodesInEachLayer(node){
    let result = [];
    for (let i = 0; i < root.height+1; i++){
      result.push([]);
    }
    for(let i = 0; i < root.descendants().length; i++){
      result[root.descendants()[i].depth].push(root.descendants()[i].index);
    }
    return result;
  }

  /***
   * 返回节点对象列表，输入为列表
   * @param nodes
   */
  function getAllNodeObj(nodes){
    let result = [];
    for(let i = 0; i < nodes.length; i++){
      result.push(new Node(nodes[i]))
    }
    return result;
  }

  /***
   * 返回边对象列表
   * @param nodes
   */
  function getAllLinkObj(nodes){
    let result = [];
    for(let i = 0; i < nodes.length; i++){
      for (let j = 0; j < nodes[i].children.length; j++){
        result.push(new Link(nodes[i], nodes[nodes[i].children[j]]));
      }
    }
    return result;
  }

  /***
   * 返回节点与边的映射
   * @param links
   */
  function getNodeLinkMap(links){
    let result = {};
    for (let i = 0; i < links.length; i++){
      result[links[i].source.index.toString()] = i;
    }
    return result;
  }

  /**
   * 根据该层节点的伸缩程度，重新计算某一层节点的坐标
   * 该层的节点
   * @param layerNodes
   * @param extraExtension  这里代表整行是否需要延长（当某个节点的展开长度过于长的时候）或者缩短(当没有子节点的节点合并的时候)
   */
  function reComputeLayerCoordinate(layerNodes, extraExtension){
    // 计算第一个节点的起始位置
    layerNodes[0].x = (width - (layerNodes.length+extraExtension)*nodeWid)/2 + nodeWid*layerNodes[0].extension*0.5;

    //计算其余节点的位置
    for(let i = 1; i < layerNodes.length; i++){
      layerNodes[i].x = layerNodes[i-1].x+0.5*nodeWid*layerNodes[i-1].extension+0.5*nodeWid*layerNodes[i].extension;
    }
  }

  /***
   * 重新计算节点的坐标
   *  -在展开节点时。部分节点的extension设置大数值使得相邻节点之间有空隙，之后再将extension复原重新绘制
   * @param indexLst
   * 用到的节点index
   * @param nodes
   * 传入该树所有的节点
   */
  function reComputeNodesCoordinate(indexLst, nodes){
    for(let i = 0; i < indexLst.length; i++){
      nodes[indexLst[i]].x = nodes[indexLst[i]].extension*nodeWid/2;
    }
  }

  /***
   * 当鼠标点击或者悬浮在某一个节点的时候
   *  -改变该行所有节点的显示比例
   *  -改变该行每个节点的坐标
   * @param index
   * 代表focus节点的索引和目前的拉伸程度
   * @param extent
   */
  Tree.prototype.focusNode = function (index, extent){
    let layer = this.nodes[index].depth;
    let layerNodes = this.getNodesByLayer(layer); // 该层的所有节点
    let extraExtent = ((extent-1) - (this.nodesInEachLayer[layer].length-1)*(1-this.miniExtent));    // 每层需要往外延伸的长度比例

    let newExtent;
    if(extraExtent>0){  //节点需要往外延伸
      newExtent = this.miniExtent;
    }
    else{
      newExtent = 1-(extent-1)/(layerNodes.length-1);    // 该行非focus节点的压缩程度
      extraExtent = 0;      // 这种情况下不用再压缩
    }

    //修改所有节点的伸缩程度
    for (let i = 0; i < layerNodes.length; i++){
      layerNodes[i].extension = newExtent;
    }
    this.nodes[index].extension = extent;   // focus节点的压缩程度

    // 重新计算该行的坐标
    reComputeLayerCoordinate(layerNodes, extraExtent);
  }

  /***
   * 用于展开某一行的节点
   *  这个方法和focusNode方法可以考虑合在一起
   * @param layer
   *    展开节点所在的层
   * @param indexLst
   *    所有要展开节点的index
   * @param extension
   *    展开节点的虚拟长度，这里暂时默认为长度一致
   *
   */
  Tree.prototype.detailDisplay = function (layer, indexLst, extension){
    // 更新节点的位置
    let layerNodes = this.getNodesByLayer(layer); // 该层的所有节点
    let extraExtent = ((indexLst.length*extension)+(layerNodes.length-indexLst.length)*this.miniExtent - layerNodes.length);    // 每层需要往外延伸的长度比例

    let newExtent;
    if(extraExtent>0){  //节点需要往外延伸
      newExtent = this.miniExtent;
    }
    else{
      newExtent = (layerNodes.length - indexLst.length*extension)/(layerNodes.length-indexLst.length);
      extraExtent = 0;      // 这种情况下不用再压缩
    }

    //修改所有节点的伸缩程度
    for (let i = 0; i < layerNodes.length; i++){
      layerNodes[i].extension = newExtent;
    }

    //将要展开的节点的extension修改参数内的extension
    for(let i = 0; i < indexLst.length; i++){
      this.nodes[indexLst[i]].extension = extension;
    }

    // 重新计算该行的坐标
    reComputeLayerCoordinate(layerNodes, extraExtent);

    // 将要展开的节点的extension复原并重新计算这几个节点的位置
    for(let i = 0; i < indexLst.length; i++){
      this.nodes[indexLst[i]].extension = 1;
    }
    // reComputeNodesCoordinate(indexLst, this.nodes);
  }

  /**
   * 压缩整棵树
   *  -没有孩子节点的节点压缩程度设置为最大
   */
  Tree.prototype.compressTree = function (){
    // 重新计算每一层的坐标
    for (let i = 0; i < this.height; i++){
      let nodesInThisLayer = this.getNodesByLayer(i);   // 返回该层的节点
      let extraExtent = 0;
      for (let j = 0; j < nodesInThisLayer.length; j++){
        if(nodesInThisLayer[j].children.length===0){
          nodesInThisLayer[j].extension = this.miniExtent;
          extraExtent += (this.miniExtent-1);
        }
      }
      reComputeLayerCoordinate(this.getNodesByLayer(i), extraExtent);
    }
  }

  /**
   * 节点中心化，目的是使一条路径或者一个展开的tree的中心尽可能位于同一条垂直线上
   * @param layer
   * 所在的层
   * @param indexLst
   * 要平移的节点index，要么是一个节点，要么是连续的多个节点
   * @param offset
   * 这些节点的水平向右偏移量
   */
  Tree.prototype.centering = function (layer, indexLst, offset){
    // 在indexLst左边和右边的节点
    let leftNodes = [], rightNodes = [];
    let layerNodes = this.getNodesByLayer(layer);     // 该层的节点
    for(let i = 0; i < layerNodes.length; i++){
      if (layerNodes[i].index < indexLst[0]){
        // 在indexLst左边的节点
        leftNodes.push(layerNodes[i]);
      }
      else if(layerNodes[i].index > indexLst[indexLst.length-1]){
        // 在indexLst右边的节点
        rightNodes.push(layerNodes[i]);
      }
    }
    rightNodes.reverse();     // 右边的节点数组翻转，便于从左往右重新计算坐标

    if(offset>0){
      // 右边节点压缩，左边节点展开
      // 右边的节点压缩 offset
      // 计算右边的节点还可以压缩的最大程度
      let maxOffset = 0;
      for (let i = 0; i < rightNodes.length; i++){
        maxOffset += (rightNodes[i].extension - this.miniExtent);
      }
      offset = maxOffset < offset? maxOffset:offset;    // 如果最大的压缩程度都无法预留出足够的空间，就压缩程度设置为最大，反之设置为当前
      if(offset > 0.001){
        // 如果右边的节点已经压缩到最大，不用修改
        // 记录start
        let start = rightNodes[0].x + rightNodes[0].extension/2*nodeWid;
        // 重新分配每个节点的extension
        for (let i = 0; i < rightNodes.length; i++){
          rightNodes[i].extension -= offset/rightNodes.length;
        }
        //重新计算压缩节点的坐标
        rightNodes[0].x = start - rightNodes[0].extension*nodeWid/2;
        for (let i = 1; i < rightNodes.length; i++){
          rightNodes[i].x = rightNodes[i-1].x - (rightNodes[i].extension+rightNodes[i-1].extension)*nodeWid/2;
        }

        // 平移目前的节点
        for (let i = 0; i < indexLst.length; i++){
          this.nodes[indexLst[i]].x += offset*nodeWid;
        }

        // 左边的节点展开 offset
        // 左边的节点可以展开的最大程度
        maxOffset = 0;
        for (let i = 0; i < leftNodes.length; i++){
          maxOffset += (1 - leftNodes[i].extension);
        }
        offset = maxOffset < offset? maxOffset:offset;    // 如果最大的压缩程度都无法预留出足够的空间，就压缩程度设置为最大，反之设置为当前
        // 左边的起始点
        start = leftNodes[0].x - leftNodes[0].extension/2*nodeWid;
        // 重新分配每个节点的extension
        for (let i = 0; i < leftNodes.length; i++){
          leftNodes[i].extension += offset/leftNodes.length;
        }

        leftNodes[0].x = start - leftNodes[0].extension*nodeWid/2;
        for (let i = 1; i < leftNodes.length; i++){
          leftNodes[i].x = leftNodes[i-1].x + (leftNodes[i].extension+leftNodes[i-1].extension)*nodeWid/2;
        }
      }

    }
    else{
      offset = -offset;
      // 左边节点压缩，右边节点展开
      // 右边的节点压缩 offset
      // 计算右边的节点还可以压缩的最大程度
      let maxOffset = 0;
      for (let i = 0; i < leftNodes.length; i++){
        maxOffset += (leftNodes[i].extension - this.miniExtent);
      }
      offset = maxOffset < offset? maxOffset:offset;    // 如果最大的压缩程度都无法预留出足够的空间，就压缩程度设置为最大，反之设置为当前
      if(offset > 0.001){
        // 如果右边的节点已经压缩到最大，不用修改
        // 记录start
        let start = leftNodes[0].x - leftNodes[0].extension/2*nodeWid;
        // 重新分配每个节点的extension
        for (let i = 0; i < leftNodes.length; i++){
          leftNodes[i].extension -= offset/leftNodes.length;
        }
        //重新计算压缩节点的坐标
        leftNodes[0].x = start + leftNodes[0].extension*nodeWid/2;
        for (let i = 1; i < leftNodes.length; i++){
          leftNodes[i].x = leftNodes[i-1].x + (leftNodes[i].extension+leftNodes[i-1].extension)*nodeWid/2;
        }

        // 平移目前的节点
        for (let i = 0; i < indexLst.length; i++){
          this.nodes[indexLst[i]].x -= offset*nodeWid;
        }

        // 左边的节点展开 offset
        // 左边的节点可以展开的最大程度
        maxOffset = 0;
        for (let i = 0; i < rightNodes.length; i++){
          maxOffset += (1 - rightNodes[i].extension);
        }
        offset = maxOffset < offset? maxOffset:offset;    // 如果最大的压缩程度都无法预留出足够的空间，就压缩程度设置为最大，反之设置为当前
        // 左边的起始点
        start = rightNodes[0].x + rightNodes[0].extension/2*nodeWid;
        // 重新分配每个节点的extension
        for (let i = 0; i < rightNodes.length; i++){
          rightNodes[i].extension += offset/rightNodes.length;
        }
        //重新计算压缩节点的坐标
        rightNodes[0].x = start + rightNodes[0].extension*nodeWid/2;
        for (let i = 1; i < rightNodes.length; i++){
          rightNodes[i].x = rightNodes[i-1].x - (rightNodes[i].extension+rightNodes[i-1].extension)*nodeWid/2;
        }
      }
    }



  }

  /***
   * 返回两点之间的最短路径
   *  -参数代表路径起始点的index
   * @param src
   * @param des
   */
  Tree.prototype.getShortestPath = function (src, des){
    let min = Math.min(src, des), max = Math.max(src, des);
    let layers = this.nodes[max].depth - this.nodes[min].depth;
    let path = [max];
    let curNode = this.nodes[max];
    while(layers){
      curNode = this.nodes[curNode.parent[0]];
      path.push(curNode.index);
      layers--;
    }
    if(path[path.length-1] === min){
      return path;
    }
    return [];
  }

}

/***
 * 根据节点的索引返回节点
 * @param index
 */
Tree.prototype.getNodeByIndex = function (index){
  return this.nodes[index];
}
/***
 * 返回某一层的节点
 * @param layer
 */
Tree.prototype.getNodesByLayer = function (layer){
  let result = [];
  for(let i = 0; i < this.nodesInEachLayer[layer].length; i++){
    result.push(this.nodes[this.nodesInEachLayer[layer][i]]);
  }
  return result;
}
/***
 * 返回某个节点的父亲节点，返回值是列表
 * @param node
 */
Tree.prototype.getParentNodes = function (index){
  let result = [];
  if(this.nodes[index].parent.length>0){
    for(let i = 0; i < this.nodes[index].parent.length; i++){
      result.push(this.nodes[this.nodes[index].parent[i]]);
    }
  }
  return result;
}
/***
 * 返回某个节点的孩子节点，返回值是列表
 * @param index
 */
Tree.prototype.getChildrenNodes = function (index){
  let result = [];
  if(this.nodes[index].children.length>0){
    for(let i = 0; i < this.nodes[index].children.length; i++){
      result.push(this.nodes[this.nodes[index].children[i]]);
    }
  }
  return result;
}
/***
 * 返回以某个节点为父节点的边，其中index为该节点的索引
 * @param index
 */
Tree.prototype.getSelfLink = function (index){
  return this.links[this.nodeLinkMap[index.toString()]];
}
/***
 * 返回以该节点为子节点的边，index为该节点的索引
 * @param index
 */
Tree.prototype.getParentLink = function (index){
  return this.links[this.nodeLinkMap[this.nodes[index].parent[0].toString()]];
}
/***
 * 树恢复为默认的状态
 *  -每个节点的位置恢复为初始位置
 *  -每个节点的extension恢复为1
 */
Tree.prototype.recover = function (){
  for (let i = 0; i < this.nodes.length; i++){
    this.nodes[i].x = this.nodes[i].initialX;
    this.nodes[i].y = this.nodes[i].initialY;
    this.nodes[i].extension = 1;
  }
}

