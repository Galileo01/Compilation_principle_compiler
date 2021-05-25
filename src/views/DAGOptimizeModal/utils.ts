import { DAGNode, getNodeById } from '../../core/DAG_optimize/index';

function getValue(node: DAGNode) {
  const value = [];
  node?.op && value.push(node.op);
  node?.constValue && value.push(node.constValue);
  value.push(...node.valueList);
  return value.join(',');
}
//生成 mermaid 语法
export function generateMermain(nodeList: DAGNode[]) {
  let graphContent = ` graph TD\n`;
  // 被引用的节点
  nodeList.forEach(node => {
    //对于 不被其他 节点引用的 节点 不生成新的 语句   对操作符 
    if (node.isUsed && node.symbolType === 'op') {
      const { left, right } = node;
      const leftNode = left > -1 ? getNodeById(nodeList, left) : undefined;
      const rightNode = right > -1 ? getNodeById(nodeList, right) : undefined;

      const curValue = getValue(node)
      if (leftNode)
        graphContent += `${node.id}(("${curValue}"))---${leftNode.id}(("${getValue(leftNode)}"))\n`;
      if (rightNode)
        graphContent += `${node.id}(("${curValue}"))---${rightNode.id}(("${getValue(rightNode)}"))\n`;
    }
    //没被引用的节点
    else if (!node.isUsed) {
      graphContent += `${node.id}(("${getValue(node)}"))\n`;
    }
  })
  console.log(graphContent);

  return graphContent;
}