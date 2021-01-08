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
  //为每一个节点标记索引
  let index = 0;
  for(let i = 0; i < root.descendants().length; i++){
    root.descendants()[i].index = index;
    index++;
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