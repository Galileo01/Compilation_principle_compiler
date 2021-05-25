//算符优先
import { readGrammar } from './utils'

import { SponserExObject } from '../../types/compiler';
//生成 FIRSTVT 或者 LASTVT

export function generateFirstVT_LASTVT(sponsorEx: SponserExObject, NOT: string[], T: string[], type: 'FIRSTVT' | 'LASTVT') {
  //使用一个 行为非终结符  列为终结符的 二维数组， 在不断遍历中被修改
  const F: number[][] = [];
  for (let i = 0; i < NOT.length; i++) {
    F[i] = new Array(T.length).fill(undefined);

  }
  //开始遍历 直到 F 没有更新

  let isModified = false;
  do {
    isModified = false;

    for (const nonName in sponsorEx) {
      const sponser = sponsorEx[nonName];
      // 遍历候选式
      for (const candidate of sponser.candidateList) {
        const [first, second] = type === 'FIRSTVT' ? candidate : [...candidate].reverse();//如果是 LASTVT 则需要使用临时 数组的倒序
        // console.log(first, second);

        //P->a 
        if (T.includes(first))//第一个项就是 终结符
        {
          //计算 行列下标
          const row = NOT.findIndex(item => item === nonName);
          const col = T.findIndex(item => item === first);
          //标记 
          if (!F[row][col]) {
            F[row][col] = 1;
            isModified = true;
          }
          // console.log(1, col);

        }
        //P->Q   
        else if (NOT.includes(first)) {
          const rowOfQ = NOT.findIndex(item => item === first);
          const row = NOT.findIndex(item => item === nonName);
          const VTOfQ = F[rowOfQ];
          //补充P 
          VTOfQ.forEach((item, index) => {
            if (item && !F[row][index]) {
              F[row][index] = 1;
              isModified = true;
            }
          })
          // console.log(2);
        }
        //P->Qa
        if (NOT.includes(first) && T.includes(second)) {
          // console.log('aaa', first, second);

          //计算 行列下标
          const row = NOT.findIndex(item => item === nonName);
          const col = T.findIndex(item => item === second);
          //标记 
          if (!F[row][col]) {
            F[row][col] = 1;
            isModified = true;
          }
          // console.log(3, col);
        }
      }
    }

    //遍历F 生成每个 非终结符的
    for (let i = 0; i < F.length; i++) {
      const nonName = NOT[i];
      const target = type === 'FIRSTVT' ? sponsorEx[nonName].FirstVT : sponsorEx[nonName].LastVT;
      for (let j = 0; j < F[i].length; j++) {
        const value = F[i][j];
        const TName = T[j];
        value && target.add(TName);//存储TirstVT
      }
    }
  }
  while (isModified);
}

//生成优先 关系 表
export function generatePriorityTable(sponsorEx: SponserExObject, T: string[]) {
  const table: string[][] = [];
  //吃刷
  for (let i = 0; i < T.length; i++) {
    table[i] = new Array(T.length).fill('');
  }

  for (const nonName in sponsorEx) {
    const sponser = sponsorEx[nonName];
    // 遍历候选式
    for (const candidate of sponser.candidateList) {
      // 遍历每一项
      for (const [index, item] of candidate.entries()) {
        if (!T.includes(item)) //跳过非终结符
          continue;
        const col = T.findIndex(item2 => item2 === item);//列号
        const pre = candidate[index - 1];
        const next = candidate[index + 1];
        const pre2 = candidate[index - 2];
        const next2 = candidate[index + 2];
        //左侧 是非终结符 则添加  P->Rb
        if (pre && !T.includes(pre)) {
          // console.log(item, 'push LastVT', pre);
          sponsorEx[pre].LastVT.forEach(vtItem => {
            const row = T.findIndex(item3 => item3 === vtItem);
            table[row][col] = '>';
            // console.log(row, col);

          })


        }
        //P->ab
        else if (pre && T.includes(pre)) {
          const row = T.findIndex(item3 => item3 === pre);
          table[row][col] = '=';
        }
        //右侧是非终结符  则添加  P->bR
        if (next && !T.includes(next)) {
          // console.log(item, 'push FirstVT', next);
          sponsorEx[next].FirstVT.forEach(vtItem => {
            const row = T.findIndex(item3 => item3 === vtItem);
            table[col][row] = '<';
            // console.log(col, row);

          })


        }
        //P->ab
        else if (next && T.includes(next)) {
          const row = T.findIndex(item3 => item3 === next);
          table[col][row] = '=';
        }
        //P->aQb
        if (pre2 && T.includes(pre2)) {
          const row = T.findIndex(item3 => item3 === pre2);
          table[row][col] = '=';
        }
        if (next2 && T.includes(next2)) {
          const row = T.findIndex(item3 => item3 === next2);
          table[col][row] = '=';
        }
      }
    }
  }
  logPriorityTable(table, T);
  return table;
}

function logPriorityTable(table: string[][], T: string[]) {
  console.log('算符优先表');
  console.log(' ', T);
  table.forEach((item, index) => {
    console.log(T[index], item);

  })
}


/*完成一些初始化的 工作 
1. 读取文法
2. 求解 FirstVT 和 LastVT
3. 生成 优先表
*/
function predictInit(grammer: string) {

  let { sponserObject, start, NOT, T } = readGrammar(grammer);
  console.log(sponserObject, start, T, NOT);
  generateFirstVT_LASTVT(sponserObject, NOT, T, 'FIRSTVT');
  generateFirstVT_LASTVT(sponserObject, NOT, T, 'LASTVT');
  // console.log(sponserObject);
  const priorityTable = generatePriorityTable(sponserObject, T);
  return {
    sponserObject,
    start,
    priorityTable,
    T
  }
}
//返回 栈内 最上面的 终结符
function getTopT(stack: string[], T: string[]) {
  let index = 0;
  let value = '';
  for (let i = stack.length - 1; i >= 0; i--) {
    const item = stack[i];
    if (T.includes(item)) {
      index = i;
      value = item;
      // console.log('item', item, 'index', i);
      break;
    }
  }
  return {
    index, value
  };
}

//查表 获得优先级
const getPriority = (priorityTable: string[][], T: string[], pre: string, after: string) => {
  const row = T.findIndex(item => item === pre);
  const col = T.findIndex(item => item === after)
  return priorityTable[row][col];
}

//获取 栈内的最左素短语  向下查找
function getLeftPhrase(stack: string[], topTIndex: number, priorityTable: string[][], T: string[]) {
  let boundary = topTIndex;//左侧边界
  for (let i = topTIndex; i >= 0; i--) {
    boundary = i;
    const cur = stack[i];
    const pre = stack[i - 1];
    const pre2 = stack[i - 2];
    // console.log(`cur:${cur},pre:${pre},pre2:${pre2}`);

    if (!T.includes(cur)) continue;//跳过非终结符
    //   ab
    if (pre && T.includes(pre)) {
      const priotity = getPriority(priorityTable, T, pre, cur);
      if (priotity !== '=') {//不是相等关系 立即停止
        break;
      }
    }
    // aRb
    else if (pre2 && T.includes(pre2)) {
      const priotity = getPriority(priorityTable, T, pre2, cur);
      if (priotity !== '=') {//不是相等关系 立即停止
        boundary = i - 1;//要多保存一位 
        break;
      }
    }

  }
  return boundary;
}

//根据 最左素短语 得到最接近的 产生式
function getCloseSponsor(sponsorExObj: SponserExObject, leftPhrase: string[], T: string[]) {
  let rightCandidate = '';
  let leftNonName = '';
  loop1: for (const nonName in sponsorExObj) {
    const sponser = sponsorExObj[nonName];
    // 遍历候选式
    for (const candidate of sponser.candidateList) {
      // console.log(candidate);
      // console.log(leftPhrase);

      //判断是否 和 最左素短语 "接近” ；1.完全相等 2.长度一样 并且非终结符的位置 相等   
      if (candidate.length !== leftPhrase.length) continue;

      //查看 终结符 是否匹配
      //获取 终结符下标
      const TIndexs1 = candidate.map((item, index) => T.includes(item) ? index : undefined).filter(item => typeof item === 'number');
      const Tindexs2 = leftPhrase.map((item, index) => T.includes(item) ? index : undefined).filter(item => typeof item === 'number');
      // console.log('TIndexs1', TIndexs1);
      // console.log('TIndexs2', Tindexs2);
      if (TIndexs1.length !== Tindexs2.length) continue;
      let isClose = true;
      for (let i = 0; i < TIndexs1.length; i++) {
        const index1 = TIndexs1[i] as number;
        const index2 = Tindexs2[i] as number;
        //终结符下标 不同
        if (index1 !== index2) {
          isClose = false;
          break;
        }//终结符 不同
        else if (candidate[index1] !== leftPhrase[index2]) {
          isClose = false;
          break;
        }
      }
      //跳过之后的
      if (!isClose) continue;
      else {
        rightCandidate = candidate.join(' ');
        leftNonName = nonName;
        break loop1;
      }
    }
  }
  return {
    leftNonName,
    rightCandidate
  };
}

//算符优先分析
function OPA(sponserObject: SponserExObject, src: string[], priorityTable: string[][], T: string[], start: string) {
  const stack: string[] = ['#'];//符号 栈
  let top = stack.slice(-1)[0];//
  let indexOfSrc = 0;
  const steps: string[] = [];
  // stack=#start   indexOfSrc到末尾  停止
  while (top !== start || indexOfSrc < src.length - 1) {
    //更新 状态
    top = stack.slice(-1)[0];
    // console.log('stack', stack);

    //得到 栈最顶端的 终结符
    const { value: topT, index: topTIndex } = getTopT(stack, T);


    const current = src[indexOfSrc];
    //查表 得到优先级
    const priority = getPriority(priorityTable, T, topT, current);
    // console.log('topT', topT, 'priority', priority, 'current', current);
    // aj  > aj+1 规约 
    if (priority === '>') {
      const boundary = getLeftPhrase(stack, topTIndex, priorityTable, T);//计算最左素短语 左侧边界
      // console.log('boundary', boundary, 'topTIndex', topTIndex);
      //计算 最左素短语
      const leftPhrase = stack.slice(boundary);// 从栈顶开始 向下
      console.log('最左素短语', leftPhrase);
      //求解 最接近的 产生式
      const { leftNonName, rightCandidate } = getCloseSponsor(sponserObject, leftPhrase, T);
      const newStep = `${leftNonName}->${rightCandidate}`;
      console.log('规约', newStep);
      stack.splice(boundary);//出栈 规约部分
      stack.push(leftNonName);//入栈 产生式 左部
      steps.push(newStep);//

    }
    //aj  <= aj+1  入栈
    else if (priority) {
      console.log('入栈', current);
      stack.push(current);
      indexOfSrc++;//规约递增
    }
    top = stack.slice(-1)[0];
  }
  return steps;
}

//入口函数
export default function OPAEntrance(str: string, grammer: string) {
  const { sponserObject, priorityTable, T, start } = predictInit(grammer);
  !str.endsWith('#') && (str += ' #');
  const stpes = OPA(sponserObject, str.split(' '), priorityTable, T, start);
  return {
    priorityTable,
    stpes,
    T
  }

}

// OPAEntrance('i + ( i * i )', '')