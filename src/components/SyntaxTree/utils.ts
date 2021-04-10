interface mermaidNode {
  id: string,
  name: string,
}
//获取最近 名称为 name 的id
function getClosestNodeID(nodeList: mermaidNode[], name: string): string {
  let i = nodeList.length - 1;
  let id = '';
  for (; i >= 0; i--) {//倒序查找  寻找到 后添加的 节点id
    if (nodeList[i].name === name) {
      id = nodeList[i].id;
      break;
    }
  }
  return id;
}
//生成  mermaid 的语法
export function generateGraphGrammer(sponserOrder: string[]): string {
  let graphContent = ` graph TD\n`;
  const nodeList: mermaidNode[] = [{
    id: 'n0',
    name: 'E',
  }];
  let num = 1;
  sponserOrder.forEach((item => {
    const [left, right] = item.split('->');
    const nodes = right.split(' ');//
    const closetedID = getClosestNodeID(nodeList, left);
    nodes.forEach((name) => {

      graphContent += `${closetedID}((${left}))---n${num}((${name}))\n`;
      nodeList.push({
        id: `n${num++}`,
        name,
      })
    })
  }))
  return graphContent;
}