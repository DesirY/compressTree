/***
 * 构造边对象
 *  -属性
 *    -source node
 *    -target node
 *  -方法
 * @constructor
 */
function Link(node, child){
  this.source = node
  this.target = child;
  this.plot = [];     // 插入的两个节点
}

/**
 * 生成该边的路径
 */
Link.prototype.getLinkPath = function (){
  let srcWid = (this.source.extension>1? 1:this.source.extension)*nodeWid;   // 计算父节点的宽度
  let srcStartX = this.source.x - srcWid/2;                                // 父节点的起始x坐标
  let band = srcWid / this.target.broNum;            // 父节点每个brand的宽度
  let tgtWid = (this.target.extension>1? 1:this.target.extension)*nodeWid;   // 计算孩子节点的宽度
  let hei = nodeHei+gap*2;  // 增加节点的宽度,使节点与边之间留出空隙
  let pathAttr;
  if (this.plot.length > 0){
    pathAttr = "M" + [srcStartX + band*(this.target.broID+1), this.source.y+hei/2].join(" ")
        + " L" + [srcStartX + band*(this.target.broID), this.source.y+hei/2].join(" ")
        + " L" + this.plot[0].join(" ")
        + " L" + [this.target.x-tgtWid/2, this.target.y-hei/2].join(" ")
        + " L" + [this.target.x+tgtWid/2, this.target.y-hei/2].join(" ")
        + " L" + this.plot[1].join(" ")+" Z";
  }
  else {
    pathAttr = "M" + [srcStartX + band*(this.target.broID+1), this.source.y+hei/2].join(" ")
        + " L" + [srcStartX + band*(this.target.broID), this.source.y+hei/2].join(" ")
        + "L" +[this.target.x - (this.target.extension>1? 1:this.target.extension)*nodeWid/2, this.target.y-nodeHei/2].join(" ")
        + " L" + [this.target.x-tgtWid/2, this.target.y-hei/2].join(" ")
        + " L" + [this.target.x+tgtWid/2, this.target.y-hei/2].join(" ")
        + " L" + [this.target.x + (this.target.extension>1? 1:this.target.extension)*nodeWid/2, this.target.y-nodeHei/2]+" Z";
  }

  return pathAttr;
}