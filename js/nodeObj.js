/**
 * 输入一个之间经过预处理过的D3 tree形式的节点，重新构造新的节点对象
 *
 * -属性
 *  -节点的当前坐标
 *  -节点的初始坐标
 *  -节点的索引
 *  -节点的id
 *  -深度
 *  -高度
 *  -该层中的位置   layerID
 *  -兄弟姐妹中的位置
 *  -兄弟姐妹的数量
 *  -父亲节点的index  -parent 返回值是list
 *  -孩子节点的index  -children 返回类型是list
 *  -节点当前的拉伸程度（1代表原始长度，<1代表压缩，>1代表拉伸）
 *  -
 *
 * -方法
 *
 * @param node
 * @constructor
 */
function Node(node){
  this.id = node.id;
  this.index = node.index;
  this.x = node.x;
  this.y = node.y;
  this.initialX = node.x;
  this.initialY = node.y;
  this.height = node.height;
  this.depth = node.depth;
  this.broID = node.broID;
  this.broNum = node.broNum;
  this.layerID = node.layerID;
  this.parent = getParentIDList(node);
  this.children = getChildrenIDList(node);
  this.extension = 1;
  this.focus = true;

  /**
   * 返回当前节点的父母节点ID
   * @param n
   * @returns {[]}
   */
  function getParentIDList(n){
    let result = [];
    if(n.parent != null){
      result.push(n.parent.index);
    }
    return result;
  }

  /**
   * 返回当前节点的父母节点ID
   * @param n
   * @returns {[]}
   */
  function getChildrenIDList(n){
    let result = [];
    if(n.height !== 0){
      for (let i = 0; i < n.children.length; i++){
        result.push(n.children[i].index);
      }
    }
    return result;
  }

}