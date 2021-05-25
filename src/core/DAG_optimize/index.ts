
//DAG 优化
const numberReg = /^[0-9]+.?[0-9]*$/;
const idReg = /^[_]?[a-zA-Z]+[_]?[0-9]*[_]?/;
const ops = ['||', '&&', '<', '>', '<=', '>=', '==', '!=', '*', '/', '-', '+', '%',]
//全局 id 递增
let Gid = 0;
export class DAGNode {
  id: number;
  valueList: string[] = [];
  isUsed: boolean = false;
  symbolType: string = 'var';//var const op
  op?: string
  constValue?: string
  right: number = -1;
  left: number = -1;
  constructor(value?: string) {
    this.id = Gid++;
    value && this.valueList.push(value);
  }
}
//查找 可复用 的节点
function findNodeByValue(nodeList: DAGNode[], value: string) {
  const type = getSymbolType(value);
  return nodeList.find(node => {
    if (type === 'const') {
      return node?.constValue === value;
    }
    else if (type === 'op') {
      return node?.op === value;
    }
    else return node.valueList.includes(value);
  });//如果 查找操作符 则op 相等，如果是查找变量 
}

// 根据id 查找 节点
export function getNodeById(nodeList: DAGNode[], id: number) {
  return nodeList.find(item => item.id === id) as DAGNode;
}

//根据内容 计算  value 类型
function getSymbolType(value: string) {
  if (numberReg.test(value)) return 'const';
  else if (ops.includes(value)) return 'op';
  else return 'var'
}


//优化 主程序
export default function DAGOptimize(statementList: string[]) {
  const nodeList: DAGNode[] = [];
  const optimized: string[] = [];
  for (const statement of statementList) {
    let [left, right] = statement.split('=');
    left = left.trim();
    const rightItems = right.trim().split(' ');
    //查找 左侧 是否已经 被附加
    const findLeft = findNodeByValue(nodeList, left);
    if (findLeft) {
      const index = findLeft.valueList.findIndex(item => item === left) as number;
      findLeft.valueList.splice(index, 1);//移除
    }
    //没有运算 直接赋值
    if (rightItems.length === 1) {
      let targetNode = findNodeByValue(nodeList, rightItems[0]);
      //没有就创建
      if (!targetNode) {
        const symbolType = getSymbolType(rightItems[0]);
        if (symbolType === 'const') {
          targetNode = new DAGNode();
          targetNode.constValue = rightItems[0];
        }
        else
          targetNode = new DAGNode(rightItems[0]);
        targetNode.symbolType = symbolType;
        nodeList.push(targetNode);
      }
      //附加标示
      targetNode.valueList.push(left);
    }
    else if (rightItems.length === 2) {
      const [op, y] = rightItems;
      let findY = findNodeByValue(nodeList, y);
      if (!findY) {
        findY = new DAGNode(y);
        findY.symbolType = getSymbolType(y);
        nodeList.push(findY);
      }
      let findOp = findNodeByValue(nodeList, op);
      //创建
      if (!findOp) {
        findOp = new DAGNode(op);
        findOp.symbolType = 'op';
        findOp.op = op;
        nodeList.push(findOp);
      }
      //链接
      findOp.valueList.push(left);// 存储附加标示
      findOp.right = findY.id;
      findOp.isUsed = findY.isUsed = true;//标记被引用
    }
    else if (rightItems.length === 3) {
      const [y, op, z] = rightItems;
      let findY = findNodeByValue(nodeList, y);
      let findZ = findNodeByValue(nodeList, z);
      // console.log('findY', findY, 'findZ', findZ);

      const symbolY = findY ? findY.symbolType : getSymbolType(y);
      const symbolZ = findZ ? findZ.symbolType : getSymbolType(z);
      // console.log(symbolY, symbolZ);
      //都是常量 则直接计算
      if (symbolY === 'const' && symbolZ === 'const') {
        const valueZ = findZ ? findZ?.constValue : z;
        const exp = `${y}${op}${valueZ}`;
        console.log(exp);

        const result = eval(exp) + '';//调用计算
        //查表 常量 是否已经存在
        let findResult = findNodeByValue(nodeList, result);
        if (!findResult) {
          findResult = new DAGNode();
          findResult.symbolType = 'const';

          findResult.constValue = result;
          //添加
          nodeList.push(findResult);
        }
        findResult.valueList.push(left);//附加 标识符
        continue;//跳过之后的
      }
      if (!findY) {
        findY = new DAGNode(y);
        findY.symbolType = symbolY;
        nodeList.push(findY);
      }
      if (!findZ) {
        findZ = new DAGNode(z);
        findZ.symbolType = symbolZ;
        nodeList.push(findZ);
      }

      //y z 都存在  查找是都有 存在 左右子节点 正好是 y z
      let findOp = findNodeByValue(nodeList, op);
      //数组中 存在 完全一样的  链接方式 直接复用
      if (findOp && findOp.left === findY.id && findOp.right === findZ.id) {//若存在
        console.log(`复用:${y} ${op} ${z}`);
        findOp.valueList.push(left);//
      }
      else {
        //创建
        findOp = new DAGNode();
        findOp.symbolType = 'op';
        findOp.op = op;
        nodeList.push(findOp);
        findOp.valueList.push(left);
        //链接
        findOp.right = findZ.id;
        findOp.left = findY.id;
        findOp.isUsed = findY.isUsed = findZ.isUsed = true;//标记被引用
      }
    }
  }
  console.log(nodeList);
  //遍历 节点数组
  //生成 新的语句列表
  nodeList.forEach(node => {
    //对于 不被其他 节点引用的 节点 不生成新的 语句   对操作符 
    if (node.isUsed && node.symbolType === 'op') {
      const { left, right } = node;
      const leftNode = left > -1 ? getNodeById(nodeList, left) : undefined;
      const rightNode = right > -1 ? getNodeById(nodeList, right) : undefined;
      //计算 应该参与表达式的 值 ，低于常量来说  直接使用 常量 生成
      const leftValue = leftNode ? (leftNode.symbolType === 'const' ? leftNode?.constValue : leftNode.valueList[0]) : '';
      const rightValue = rightNode ? (rightNode.symbolType === 'const' ? leftNode?.constValue : rightNode.valueList[0]) : '';
      const statement = `${node.valueList[0]} = ${leftValue} ${node?.op} ${rightValue}`;
      optimized.push(statement);
    }
  })
  // console.log(optimized);

  return {
    DAGNodeList: nodeList,
    optimized: optimized
  };
}

// function test() {
//   const statementList = ['T0 = 3.14', 'T1 = 2 * T0', 'T2 = R + r', 'A = T1 * T2', 'B = A', 'T3 = 2 * T0', 'T4 = R + r', 'T5 = T3 * T4', 'T6 = R - r', 'B = T5 * T6']
//   DAGOptimize(statementList)
// }
// test();
// console.log(numberReg.test('3.14'));
