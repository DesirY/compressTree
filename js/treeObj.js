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
 *    -状态
 *      -0 普通 -2 显示子节点的属性矩形
 *    -虚实节点集合
 *    -当前的focus节点
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
 *      -当前树的状态   -0：默认状态 1：点击了一下确定了focus节点及其邻接节点高亮 2：展开邻居节点 3：显示属性框
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
  this.status = 0;        // 默认状态是0
  this.VRNodes = getVRNodes(this.nodes);    // 所有的虚实节点
  this.focus = null;      // 树中的关注节点

  function getVRNodes(nodes){
    let res = [];
    for (let i = 0; i < nodes.length; i++){
      if (nodes[i].virtualStatus !==0){
        res.push(nodes[i]);
      }
    }
    return res;
  }

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

    // 重新遍历一次，为实节点的父亲节点，继续增加父亲节点
    for(let i = 0; i < nodes.length; i++){
      if (result[i].virtualStatus === 2){
        for (let j = 0; j < result[i].counterpart.length; j++){
          result[i].parent.push(result[result[i].counterpart[j]].parent[0]);
        }
      }
    }

    return result;
  }

  /***
   * 返回边对象列表
   *  -边的排列顺序和节点的排列顺序 平移一个
   *  -根节点没有父母，因此就没对应的边
   * @param nodes
   */
  function getAllLinkObj(nodes){
    let result = [];
    for(let i = 1; i < nodes.length; i++){
      result.push(new Link(nodes[nodes[i].parent[0]], nodes[i]));
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
   * 这些节点的水平向右/左偏移量
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
          if (i !== 1 && rightNodes[i-1].broID === 0){
            rightNodes[i].x -= familyGap*nodeWid;
          }
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
          if(leftNodes[i].broID === 0){
            leftNodes[i].x += familyGap*nodeWid;
          }
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
        leftNodes[0].x = start - leftNodes[0].extension*nodeWid/2;
        for (let i = 1; i < leftNodes.length; i++){
          leftNodes[i].x = leftNodes[i-1].x + (leftNodes[i].extension+leftNodes[i-1].extension)*nodeWid/2;
          if(leftNodes[i].broID === 0){
            leftNodes[i].x += familyGap*nodeWid;
          }
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
          if (i !== 1 && rightNodes[i-1].broID === 0){
            rightNodes[i].x -= familyGap*nodeWid;
          }
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
    let path1 = [max];    // 两条路径，第一条是src-》共同祖先（由下往上），如果des正好是共同祖先，第二条路径为空
    let path2 = [];     // 第二条路径是由上往下的
    let curNode = this.nodes[max];
    while(layers){
      curNode = this.nodes[curNode.parent[0]];
      path1.push(curNode.index);
      layers--;
    }
    if(path1[path1.length-1] !== min){
      path2 = [min]
      let left = path1[path1.length-1];
      let right = min;
      while (left !== right){
        left = this.nodes[left].parent[0];
        right = this.nodes[right].parent[0];
        path1.push(left);
        path2.push(right);
      }
    }
    return [path1, path2];
  }

}

/**
 * 根据该层节点的伸缩程度，重新计算某一层节点的坐标
 * 该层的节点
 * @param layerNodes
 * @param extraExtension  这里代表整行是否需要延长（当某个节点的展开长度过于长的时候）或者缩短(当没有子节点的节点合并的时候)
 */
function reComputeLayerCoordinate(layerNodes, extraExtension){
  // 计算该层有多少个家族的孩子
  let numOfFamily = 0;
  for (let i = 0; i < layerNodes.length; i++){
    if (layerNodes[i].broID === 0){
      numOfFamily++;
    }
  }
  // 计算这一层分隔不同家族的空间大小
  let gapExtension = (numOfFamily-1)*familyGap;

  // 计算第一个节点的起始位置
  layerNodes[0].x = (width - (layerNodes.length+extraExtension)*nodeWid - gapExtension*nodeWid)/2 + nodeWid*layerNodes[0].extension*0.5;

  //计算其余节点的位置
  for(let i = 1; i < layerNodes.length; i++){
    layerNodes[i].x = layerNodes[i-1].x+0.5*nodeWid*layerNodes[i-1].extension+0.5*nodeWid*layerNodes[i].extension;
    // 如果该节点为1，就往后平移一个familyGap
    if (layerNodes[i].broID === 0){
      layerNodes[i].x += familyGap*nodeWid;
    }
  }
}

/**
 * 根据该层节点的伸缩程度，重新计算某一层节点的坐标
 * 该层的节点，该方法的区别在于：他会修改 initialxy的值只在初始化的时候调用
 * @param layerNodes
 * @param extraExtension  这里代表整行是否需要延长（当某个节点的展开长度过于长的时候）或者缩短(当没有子节点的节点合并的时候)
 */
function reInitialComputeLayerCoordinate(layerNodes, extraExtension){
  // 计算该层有多少个家族的孩子
  let numOfFamily = 0;
  for (let i = 0; i < layerNodes.length; i++){
    if (layerNodes[i].broID === 0){
      numOfFamily++;
    }
  }
  // 计算这一层分隔不同家族的空间大小
  let gapExtension = (numOfFamily-1)*familyGap;

  // 计算第一个节点的起始位置
  layerNodes[0].x = (width - (layerNodes.length+extraExtension)*nodeWid - gapExtension*nodeWid)/2 + nodeWid*layerNodes[0].extension*0.5;
  layerNodes[0].initialX = layerNodes[0].x;

  //计算其余节点的位置
  for(let i = 1; i < layerNodes.length; i++){
    layerNodes[i].x = layerNodes[i-1].x+0.5*nodeWid*layerNodes[i-1].extension+0.5*nodeWid*layerNodes[i].extension;
    // 如果该节点为1，就往后平移一个familyGap
    if (layerNodes[i].broID === 0){
      layerNodes[i].x += familyGap*nodeWid;
    }
    layerNodes[i].initialX = layerNodes[i].x;
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
    this.nodes[i].status = 0;
  }
}
/**
 * 对树状结构进行鱼眼变换，只进行Y轴方向上的变换
 *  -该变换为区域变换，也就是focus节点的一步邻居放大的倍数一样
 *  -其余的节点回会进行压缩
 * @param index  当前的focus节点index
 * @param m      放大倍数
 */
Tree.prototype.fishEye = function (index, m){
  // 得到focus节点所在层
  let focusLayer = this.nodes[index].depth;
  let cY = abstractTree[focusLayer+1];

  for (let i = 0; i < this.height; i++){
    if (i !== focusLayer){
      let beta;
      let bi;
      if (i > focusLayer){
        bi = abstractTree[abstractTree.length-1];
        beta = (abstractTree[i+1]-cY)/(bi-cY);
      }
      else {
        bi = abstractTree[0];
        beta = (abstractTree[i+1]-cY)/(bi-cY);
      }
      let beta_ = (m+1)*beta/(m*beta+1);
      let translateY = cY+(bi - cY)*beta_ - abstractTree[i+1];  // 每行平移的位置

      // 得到该行所有的节点
      let nodesInRow = this.nodesInEachLayer[i];
      for (let j = 0; j < nodesInRow.length; j++){
        this.nodes[nodesInRow[j]].y += translateY;
      }
    }
  }
}

