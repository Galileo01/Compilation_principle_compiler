import { readGrammar, generateFollow, generateFirst, logSponserObj, getNonT_T, getFirst, getFollow } from './initUtils';
import { SponserObject } from '../../types/compiler';
import { EMPTY } from './constant'
//根据 First Follow 生成 预测分析表
function generatePredict(sponserObject: SponserObject, NonT: string[], T: string[]) {
  // console.log(NonT, T);

  const predictTable: string[][] = []
  for (let i = 0; i < NonT.length; i++) {
    predictTable.push(new Array(T.length).fill(undefined));
  }
  // logPredictTable(NonT, T, predictTable);
  for (let [row, nonName] of NonT.entries()) {
    const sponser = sponserObject[nonName];
    //遍历 每个非终结符的候选式
    for (let candidate of sponser.candidateList) {
      const firstChar = candidate[0];
      if (NonT.includes(firstChar))//如果第一个字符 是 非终结符
      {
        const First = getFirst(sponserObject, firstChar);
        First.forEach(char => {
          const col = T.findIndex(item => item === char);//找到对应的 列下标
          if (col >= 0)
            predictTable[row][col] = `${nonName}->${candidate.join(' ')}`;//填充内容为 产生式 的形式
        })

      }//第一个字符是终结符
      else {
        const col = T.findIndex(item => item === firstChar);//找到对应的 列下标
        if (col >= 0)
          predictTable[row][col] = `${nonName}->${candidate.join(' ')}`;//填充内容为 产生式 的形式
      }
    }
    if (getFirst(sponserObject, nonName).has(EMPTY))//如果 nonName 的First包含空字
    {
      const Follow = getFollow(sponserObject, nonName);
      Follow.forEach(char => {
        const col = T.findIndex(item => item === char);//找到对应的 列下标
        predictTable[row][col] = `${nonName}->${EMPTY}`;//填充内容为 产生式 的形式
      })

    }

  }
  // console.log(predictTable);
  // logPredictTable(NonT, T, predictTable);
  return predictTable;
}
function logPredictTable(NonT: string[], T: string[], predictTable: string[][]) {
  console.log('    ', T.join(' '));

  for (let [row, nonName] of NonT.entries()) {
    // console.log(` ${nonName}  : ${predictTable[row].join(' | ')}`);
    console.log(nonName);
    console.table(predictTable[row]);
  }

}
export interface analyseResult {
  success: true | false,
  sponserOrder: string[]
}
//预测分析法
export function predictAnalyse(str: string) {
  const { start, predictable, NonT, T } = predictInit();
  const result: analyseResult = {
    success: true,
    sponserOrder: []
  }
  let index = 0;
  let current = str[index];
  const stack: string[] = ['#', start];//初始化 zhan
  let Top = stack.splice(stack.length - 1, 1)[0];//栈顶 元素
  while (Top !== '#') {//
    // console.log(Top, current);

    if (Top === current)//匹配成功
    {
      console.log(current, '匹配');
      current = str[++index];

    }
    else if (T.includes(Top)) {//报错 
      result.success = false;
      return result;
    }
    else if (NonT.includes(Top)) {
      const row = NonT.findIndex(item => item === Top);
      const col = T.findIndex(item => item === current);
      // console.log(row, col);

      const value = predictable[row][col];
      if (value) {
        console.log(`${value}`);
        const [left, right] = value.split('->');
        (right !== EMPTY) && (right.split(' ').reverse().forEach(char => stack.push(char)));//在预测表里有值 则逆序压栈
        result.sponserOrder.push(value)
      }
      else {//预测分析表 对应 位置没有
        result.success = false;
        return result;
      }
    }
    Top = stack.splice(stack.length - 1, 1)[0];//栈顶 元素
  }
  return result;
}
//完成一些初始化的 工作 
function predictInit() {

  let { sponserObject, start } = readGrammar('test.txt');
  let success = generateFirst(sponserObject);
  success && (success = generateFollow(sponserObject, start));
  // logSponserObj(sponserObject, 'BOTH');
  const { NonT, T } = getNonT_T(sponserObject);//获取 非终结符和终结符
  // console.log(NonT, T);
  const predictable = generatePredict(sponserObject, NonT, T);
  return {
    sponserObject,
    start,
    predictable,
    NonT, T
  }
}

// const result = predictAnalyse('i+i*i#');
// console.log(result.sponserOrder);
