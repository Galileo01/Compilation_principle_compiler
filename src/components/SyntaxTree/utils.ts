interface mermaidNode {
  id: string,//id 唯一 标识
  name: string,// 名称
  isToEmpty: boolean
}
//获取最近 名称为 name 的node
function getClosestNode(nodeList: mermaidNode[], name: string): mermaidNode {
  return Array.prototype.reverse.call([...nodeList]).find(node => node.name === name && !node.isToEmpty) as mermaidNode
}

//生成  mermaid 的语法
export function generateGraphGrammer(sponserOrder: string[], T: string[]): string {
  const EMPTY = 'ε';
  let graphContent = ` graph TD\n`;
  const nodeList: mermaidNode[] = [{
    id: 'n0',
    name: 'E',
    isToEmpty: false
  }];
  let num = 1;
  sponserOrder.forEach((item => {
    const [left, right] = item.split('->');
    const nodes = right.split(' ');//
    const closetedNode = getClosestNode(nodeList, left);
    nodes.forEach((name) => {
      const shape = T.includes(name) ? `{"${name}"}` : `(("${name}"))`;//终结符使用菱形
      graphContent += `${closetedNode.id}((${left}))---n${num}${shape}\n`;
      if (name === EMPTY) closetedNode.isToEmpty = true;//标记 这个节点 连接到一个 空字
      nodeList.push({
        id: `n${num++}`,
        name,
        isToEmpty: false
      })
    })
  }))
  return graphContent;
}