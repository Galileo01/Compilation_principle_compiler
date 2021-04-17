import { readGrammar, generateFollow, generateFirst, logSponserObj, getNonT_T, getFirst, getFollow } from './initUtils';
import { SponserObject } from '../../types/compiler';
import { EMPTY } from './constant'

//判断是否是 LL1 文法
//1.不含左递归 默认文法已经 满足
function isLL1(sponserObject: SponserObject, NonT: string[]): boolean {
  let result = true;

  //遍历 非终结符
  loop: for (const nonName in sponserObject) {
    const sponser = sponserObject[nonName];//获取某个 对象
    const set = new Set<string>();//用于保存First  
    //2.检测  候选式的First是否有重叠

    // 遍历 候选式
    for (const candidate of sponser.candidateList) {
      const firstChar = candidate[0];
      if (NonT.includes(firstChar))//是非终结符
      {
        const FIRST = getFirst(sponserObject, firstChar);
        for (const char of FIRST) {
          if (set.has(char)) {
            result = false;
            break loop;//跳出 最外层循环
          }
          else {
            set.add(char);
          }
        }

      }
      else {
        if (set.has(firstChar))//发现重复
        {
          result = false;
          break loop;
        }
        else set.add(firstChar);
      }
    }
    //3. 对于候选式  FIRST 包含空字的 非终结符  还要判断 这个非终结符的 First 和Follow 是否有交集
    if (getFirst(sponserObject, nonName).has(EMPTY)) {
      const temp = new Set<string>(getFirst(sponserObject, nonName));
      const FOLLOW = getFollow(sponserObject, nonName);
      for (const char of FOLLOW) {
        if (temp.has(char)) {
          result = false;
          break loop;//跳出 最外层循环
        }
      }
    }
  }
  return result;
}
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
  sponserOrder: string[],
  T: string[]
}
//预测分析法
export function predictAnalyse(str: string) {
  const { start, predictable, NonT, T, sponserObject } = predictInit();
  const isll1 = isLL1(sponserObject, NonT);
  console.log('is LL1 Grammer?', isll1);
  const result: analyseResult = {
    success: true,
    sponserOrder: [],
    T
  }
  if (!isll1) {
    result.success = false;
    return result;
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
