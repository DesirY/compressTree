/*
* 该文件在d3格式上的tree进行进一步处理
*   -返回结果会传入树的构造函数中
* */

/**
 * 该函数传入d3 tree结构节点，对其进行预处理
 *  -为每个节点增加以下属性
 *    -该节点在该行的位置 -layerID
 *    -该节点的兄弟姐妹的数量 -broNum
 *    -该节点在其兄弟姐妹中的位置 -broID
 *    -该节点的坐标 -x -y
 *    -该节点的索引 -index 目的是为了高效检索节点
 *  -返回该节点
 * @param node
 */
function preprocessing(root){
  let rowCounter = [];    // 用来跟踪每个节点在该行的位置
  for(let i = 0; i < layers; i++){
    rowCounter.push(0);
  }
  // 递归前对根节点的兄弟姐妹信息预处理，因为递归时，对兄弟姐妹信息的处理是从第二层开始的
  root.broID = 0;
  root.broNum = 1;

  traverse(root);


  //为每一个节点标记索引 和 虚拟状态
  let realVirtualMap = {"56387R": ["56387V"]};    // 该变量在后期作为参数传进来
  realVirtualMap = {};    // 这个要针对不同的数据单独设置
  let nodeIndexMap = {};      // 节点和index的字典映射
  /**
   * virtualStatus : 0-普通节点 1-虚拟节点 2-虚拟节点对应的实际节点
   * counterpart：[index] / index
   * @type {number}
   */
  let index = 0;
  for(let i = 0; i < root.descendants().length; i++){
    root.descendants()[i].index = index;

    // 标注每一个节点的virtualStatus,
    // 并生成字典  每个节点的name： 索引位置 {'real': index, 'virtual': index}
    let tag = root.descendants()[i].data.name.charAt(root.descendants()[i].data.name.length -1);
    if (tag === "V"){
      root.descendants()[i].virtualStatus = 1;
      nodeIndexMap[root.descendants()[i].data.name] = index;
    }
    else if(tag === "R"){
      root.descendants()[i].virtualStatus = 2;
      nodeIndexMap[root.descendants()[i].data.name] = index;
    }
    else{
      root.descendants()[i].virtualStatus = 0;
    }
    root.descendants()[i].counterpart = [];   // 初始化为空

    index++;
  }
  // 为虚拟节点分配对应实际节点的index，为实际节点分配对应虚拟节点的index list
  for (let key in realVirtualMap){
    let realIndex = nodeIndexMap[key];
    for (let i = 0; i < realVirtualMap[key].length; i++){
      let virtualIndex = nodeIndexMap[realVirtualMap[key][i]];
      root.descendants()[realIndex].counterpart.push(virtualIndex);
      root.descendants()[virtualIndex].counterpart.push(realIndex);
    }
  }
  return root;

  function traverse(node){
    let layer = node.depth;
    node.layerID = rowCounter[layer];
    rowCounter[layer]++;
    node.y = padding.top+separation*layer;
    node.x = (0.5+node.layerID)*nodeWid+(width-nodeWid*numOfEachLayer[layer])/2;


    if(node.height === 0){
      return undefined;
    }
    else{
      let len = node.children.length;
      for(let i = 0; i < len; i++){
        // 为每个子节点记录下其兄弟姐妹的个数和他的相对位置
        node.children[i].broNum = len;
        node.children[i].broID = i;
        traverse(node.children[i]);
      }
    }

  }
}