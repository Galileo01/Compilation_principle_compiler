import { readGrammar, generateFollow, generateFirst, logSponserObj, getNonT_T, getFirst, getFollow } from './initUtils';
import { EMPTY } from './constant'
import { SponserObject, TokenItem, TypeCode, SyntaxTreeNode, TerminalPosition } from '../../types/compiler'
interface DissatisfyItem {
  nonName: string,//非终结符 名称
  reason: string,//不满足的原因
}
/*判断是否是 LL1 文法 并返回 不满足条件的 非终结符
1. 每个产生式 的候选式 之前 First  不能有交集
2. 对于First 含有空字的 候选式 还要看 First 和Follow 不能有交集
*/
function LL1Check(sponserObject: SponserObject, NonT: string[]): DissatisfyItem[] {
  const dissatisfyList: DissatisfyItem[] = []
  //遍历 非终结符
  loop: for (const nonName in sponserObject) {
    const sponser = sponserObject[nonName];//获取某个 对象
    const set = new Set<string>();//用于保存First  
    //2.检测  候选式的First是否有重叠
    // 遍历 候选式
    loop1: for (const candidate of sponser.candidateList) {
      const firstChar = candidate[0];
      if (NonT.includes(firstChar))//是非终结符
      {
        const FIRST = getFirst(sponserObject, firstChar);
        for (const char of FIRST) {
          if (set.has(char)) {
            dissatisfyList.push({
              nonName,
              reason: `该非终结符的候选式 First集 交集 非空`
            })
            break loop1;
          }
          else {
            set.add(char);
          }
        }

      }
      else {
        if (set.has(firstChar))//发现重复
        {
          dissatisfyList.push({
            nonName,
            reason: `该非终结符的候选式 First集 交集 非空`
          })
          break loop1;
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
          dissatisfyList.push({
            nonName,
            reason: `该非终结符的  First 包含空字，但是First 和Follow 交集非空`
          })
          break;
        }
      }
    }
  }
  return dissatisfyList;
}
//根据 First Follow 生成 预测分析表 ： 最新：预测分析表的元素值 为 一个数组
function generatePredicTable(sponserObject: SponserObject, NonT: string[], T: string[]) {
  // console.log(NonT, T);
  const predictTable: string[][][] = [];//对于 非 LL1 文法  预测分析表的 内容为一个 生成式 数组
  for (let i = 0; i < NonT.length; i++) {
    predictTable[i] = new Array(T.length).fill(undefined);
    for (let j = 0; j < T.length; j++) {
      predictTable[i][j] = new Array();//初始化 内容 
    }
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
            predictTable[row][col].push(`${nonName}->${candidate.join(' ')}`);//填充内容为 产生式 的形式
        })

      }//第一个字符是终结符
      else {
        const col = T.findIndex(item => item === firstChar);//找到对应的 列下标
        if (col >= 0)
          predictTable[row][col].push(`${nonName}->${candidate.join(' ')}`);//填充内容为 产生式 的形式
      }
    }
    if (getFirst(sponserObject, nonName).has(EMPTY))//如果 nonName 的First包含空字
    {
      const Follow = getFollow(sponserObject, nonName);
      Follow.forEach(char => {
        const col = T.findIndex(item => item === char);//找到对应的 列下标
        predictTable[row][col].push(`${nonName}->${EMPTY}`);//填充内容为 产生式 的形式
      })

    }

  }
  // console.log(predictTable);
  // logPredictTable(NonT, T, predictTable);
  return predictTable;
}

//打印 预测分析表
function logPredictTable(NonT: string[], T: string[], predictTable: string[][]) {
  console.log('    ', T.join(' '));

  for (let [row, nonName] of NonT.entries()) {
    // console.log(` ${nonName}  : ${predictTable[row].join(' | ')}`);
    console.log(nonName);
    console.table(predictTable[row]);
  }

}
/*完成一些初始化的 工作 
1. 读取文法
2. 求解 First 和 Follow
3. 生成 预测分析表
*/
function predictInit(grammerPath: string) {

  let { sponserObject, start } = readGrammar(grammerPath);
  let success = generateFirst(sponserObject);
  success && (success = generateFollow(sponserObject, start));
  // logSponserObj(sponserObject, 'BOTH');
  const { NonT, T } = getNonT_T(sponserObject);//获取 非终结符和终结符
  // console.log(NonT, T);
  const predictable = generatePredicTable(sponserObject, NonT, T);
  return {
    sponserObject,
    start,
    predictable,
    NonT, T
  }
}
//定义一个语法分析 错误
type SyntaxError = {
  word: string,
  msg: string
}
export interface PredictAnalyseResult {
  success: true | false,
  sponserOrder: string[],
  errList: SyntaxError[],
  terminalPositionList: TerminalPosition[]
}
//文法信息
interface GrammerInfo {
  start: string,
  predictable: string[][][],
  NonT: string[],
  T: string[]
}


//每一个分支的状态
interface ForkState {
  stack: string[],//产生 分支时   匹配栈的 数据  （全拷贝）
  indexInStr: number,//当前匹配到的 串内下标
  orderLength: number//当前 sponsorOrder 的长度   在 回溯 的时候 删除 分叉之后的 数据
  sponsorPosition: [number, number, number] //分支选择的 产生式子 在预测分析表的位置 [row,col,index]
  terminalPositionList: TerminalPosition[]
}

/*
处理产生式 为 语义分析作准备
1. 处理 包含id 的产生式
2.处理 包含 num_const 的产生式
*/
function dealSponsor(srcSponsor: string, current: string, type: 'ID' | 'NUM_CONST'): string {
  const params = {
    ID: {
      substr: 'id',
      length: 2
    },
    NUM_CONST: {
      substr: 'num_const',
      length: 9
    }
  }
  const { substr, length } = params[type];//参数
  const index = srcSponsor.indexOf(substr);
  const before = srcSponsor.slice(0, index + length + 1);//获取之前的部分
  const after = srcSponsor.slice(index + length);//之后的部分
  return before + ':' + current + after;
}

/* 根据种别码 转换 current.word    为文法里的符号
功能：
1. 比较 匹配
2. 查表转换 列下标 MARK

主要过程：
1. 标识符 统一转换为 id
2. 数字常量 转换为 num_const 
3. 其他情况直接返回
*/

function transformCurrent(current: TokenItem): string {
  const num_constTypeCodes: number[] = [TypeCode['整数'], TypeCode['浮点数']];
  //标识符转 id
  if (current.typeCode === TypeCode['标识符']) return 'id';
  // 数字常量转 num_const
  else if (num_constTypeCodes.includes(current.typeCode)) return 'num_const';
  //其他任意 内容 直接返回
  else return current.word;
}
/*转换最近一个 包含 id 和num_const 产生式的 形式   M
直接 更改数组元素
*/
function updateNearestSponsor(sponsorOrder: string[], current: string) {
  //倒序  查找 ，最近的一个
  for (let i = sponsorOrder.length - 1; i >= 0; i--) {
    const sponsor = sponsorOrder[i];
    const indexOfID = sponsor.indexOf('id');
    const indexofVoid = sponsor.indexOf('void');//排除 查找到 void 里的 id
    const indexOfNUM_CONST = sponsor.indexOf('num_const');

    //包含 id
    if (indexofVoid < 0 && indexOfID > -1) {
      const before = sponsor.slice(0, indexOfID + 2);//获取之前的部分
      const after = sponsor.slice(indexOfID + 2);//之后的部分
      sponsorOrder[i] = before + ':' + current + after;
      console.log('最新1,', sponsorOrder[i]);
      break;
    }
    else if (indexOfNUM_CONST > -1) {
      const before = sponsor.slice(0, indexOfNUM_CONST + 9);//获取之前的部分
      const after = sponsor.slice(indexOfNUM_CONST + 9);//之后的部分
      sponsorOrder[i] = before + ':' + current + after;
      console.log('最新2,', sponsorOrder[i]);
      break
    }
  }
}
/*预测分析法
可以 处理 非 LL1文法   加入 回溯来解决 多分支问题
*/
//测试  接受 token 串 为输入，
export function predictAnalyse(srcTokenList: TokenItem[], grammerinfo: GrammerInfo) {
  const result: PredictAnalyseResult = {
    success: true,
    sponserOrder: [],
    errList: [],
    terminalPositionList: []//存储 终结符的 位置信息
  }
  //预处理 token 
  let tokenList: TokenItem[] = [];
  const dealResult = dealTokenList(srcTokenList);
  if (dealResult.type === 'SyntaxError') {// 预处理 token 串 发现错误
    result.success = false;
    result.errList.push(dealResult.data)
    return result;
  }
  else {
    tokenList = dealResult.data;//赋值
  }
  console.log(tokenList);
  const { start, predictable, NonT, T, } = grammerinfo;

  let index = 0;
  let current = tokenList[index].word;//当前 所处的符号串下标
  let stack: string[] = ['#', start];//初始化 匹配栈
  let Top = stack.pop() as string;//匹配栈 栈顶 元素
  const forkStack: ForkState[] = [];//保存 分叉状态的的队列            MARK:
  while (Top !== '#' || current !== '#') {//当Top 和current  其中有一个 不为 井 号
    // console.log(`stack:${stack},Top:${Top},current:${current}`);
    if (Top === transformCurrent(tokenList[index]))//匹配成功
    {
      console.log(current, '匹配');
      if (Top === 'id' || Top === 'num_const') //更新最近的一个  产生式子
      {
        updateNearestSponsor(result.sponserOrder, current);
      }
      const { row, col } = tokenList[index];
      //记录位置信息
      result.terminalPositionList.push({
        row: row,
        col: col,
        terminalId: result.terminalPositionList.length
      })
      current = tokenList[++index].word;
      Top = stack.pop() as string;//栈顶 元素

    }
    else if (T.includes(Top)) {// 栈顶的 终结符和 当前出入串字符不匹配  尝试回溯
      console.log(`非法的 终结符/输入符号：${current},尝试回溯`);

      let msg = '';
      if (forkStack.length > 0) {
        const preFork = forkStack[forkStack.length - 1];//上一个 状态
        const { stack: preStack, indexInStr: preIndexInStr, orderLength: preLength, sponsorPosition, terminalPositionList: prePositionList } = preFork;
        //恢复状态
        stack = [...preStack];
        index = preIndexInStr;
        result.terminalPositionList = [...prePositionList];
        current = tokenList[index].word;
        result.sponserOrder.splice(preLength);//删除 产生分支之后的 数据
        const [preRow, preCol, preIndex] = sponsorPosition;

        if (preIndex + 1 === predictable[preRow][preCol].length) {//没有更多的 产生式子 可供选择 ,无法继续 回溯
          msg = `${tokenList[index].row}行${tokenList[index].col}列` + '非法的 终结符/输入符号,没有更多的 产生式子 可供选择 ,无法继续 回溯';
          result.errList.push({
            word: current
            , msg
          });
          current = tokenList[++index].word;//输入串 当前字符向后移
          console.log(msg);

        }
        else {
          msg = `非法的 终结符/输入符号，无法继续推导,回溯成功`;
          const nextSonsor = predictable[preRow][preCol][preIndex + 1];
          sponsorPosition[2]++;
          const [left, right] = nextSonsor.split('->');
          (right !== EMPTY) && (right.split(' ').reverse().forEach(char => stack.push(char)));//在预测表里有值 则逆序压栈(保证非空字)
          result.sponserOrder.push(nextSonsor);// MARK:
          console.log(msg, `\nnextSponsor:${nextSonsor}`);
        }
        Top = stack.pop() as string;//弹出栈顶 终结符
      }
      //无法回溯  错误处理
      else {
        msg = `非法的 终结符/输入符号,分析栈顶：${Top},输入串当前符号：${current}`;
        // return result;
        console.log(msg);
        result.errList.push({
          word: current,
          msg
        })
        Top = stack.pop() as string;//弹出栈顶 终结符
      }

    }
    //栈顶是 非终结符  尝试 匹配 产生式 
    else if (NonT.includes(Top)) {
      const row = NonT.findIndex(item => item === Top);//非终结符 为 行坐标
      const col = T.findIndex(item => item === transformCurrent(tokenList[index]));//计算 终结符的 列坐标 需要转换为 文法内的 符号
      // console.log(row, col);
      //查表 获取 产生式 
      const value = predictable[row][col];

      if (value && value.length > 0) {
        const sponsor = value[0]
        // console.log(`${value}`);
        console.log('匹配产生式子', value[0]);

        const [left, right] = sponsor.split('->');
        //还有 其他可选的 产生式子
        if (value.length > 1) {
          //保存 状态 之后
          forkStack.push({
            stack: [...stack],//栈要在 更新之前 进行保存
            indexInStr: index,
            orderLength: result.sponserOrder.length,
            sponsorPosition: [row, col, 0],
            terminalPositionList: [...result.terminalPositionList]
          })
          console.log('产生一个分支');

        }
        (right !== EMPTY) && (right.split(' ').reverse().forEach(char => stack.push(char)));//在预测表里有值 则逆序压栈(保证非空字)
        result.sponserOrder.push(sponsor)
      }
      else {//预测分析表 对应 位置没有  进行 回溯 回溯到 上一个分支状态  或者 进行错误处理

        // return result;
        // const msg = `predictable[${Top}][${current}]为空，无法继续推导,分析栈顶：${Top},输入串当前符号：${current}`;
        let msg = '';
        // 可以 回溯
        if (forkStack.length > 0) {
          const preFork = forkStack[forkStack.length - 1];//上一个 状态
          const { stack: preStack, indexInStr: preIndexInStr, orderLength: preLength, sponsorPosition, terminalPositionList: prePositionList } = preFork;
          //恢复状态
          stack = [...preStack];
          index = preIndexInStr;
          current = tokenList[index].word;
          result.terminalPositionList = [...prePositionList];
          result.sponserOrder.splice(preLength);//删除 产生分支之后的 数据
          const [preRow, preCol, preIndex] = sponsorPosition;
          if (preIndex + 1 === predictable[preRow][preCol].length) {//没有更多的 产生式子 可供选择 ,无法继续 回溯
            msg = `没有更多的 产生式子 可供选择 ,无法继续 回溯,Top:${Top},current:${current}`;
            result.errList.push({
              word: current
              , msg
            });
            current = tokenList[++index].word;//输入串 当前字符向后移
            console.log(msg);
            // break;
          }
          else {
            msg = `predictable[${Top}][${current}]为空，无法继续推导,回溯成功`;
            console.log(msg);

            const nextSonsor = predictable[preRow][preCol][preIndex + 1];
            sponsorPosition[2]++;
            const [left, right] = nextSonsor.split('->');
            (right !== EMPTY) && (right.split(' ').reverse().forEach(char => stack.push(char)));//在预测表里有值 则逆序压栈(保证非空字)
            result.sponserOrder.push(nextSonsor);// MARK:
          }
        }
        //无法回溯
        else {
          console.log(`redictable[${Top}][${current}]为空,无法回溯`);
          msg = `predictable[${Top}][${current}]为空，无法继续推导,分析栈顶：${Top},输入串当前符号：${current}`;
          result.errList.push({
            word: current
            , msg
          });
          current = tokenList[++index].word;//输入串 当前字符向后移
          // break;
          continue;
        }

      }
      Top = stack.pop() as string;//栈顶 元素
    }
    if (result.errList.length >= 10) {//错误数量超过 20 立即停止，此时的 结果已经么有意义
      result.errList.push({
        word: current
        , msg: '错误超过10 个 ，强制退出'
      });
      break;
    }
  }
  result.success = result.errList.length === 0;//根据错误个数来判断  
  return result;
}

//在 当前 syntaxTree 语法树 上 查找 最近的 名称为name 的节点
function getClosestNodeInSyntaxTree(root: SyntaxTreeNode, name: string) {
  let result = root;
  const queue: SyntaxTreeNode[] = [root];
  //层级遍历 整个语法树      通过覆盖 result 来达到最近的效果
  while (queue.length > 0) {
    const node = queue.splice(0, 1)[0];//出队
    for (const item of node.children) {
      queue.push(item);//入队
      if (item.name === name && item.children.length === 0)//名称相匹配 并且 子元素为空
        result = item;//保存 覆盖之前的
    }
  }
  return result;
}

/*根据 语法分析的结果生成 语法树和 mermaid 语法
1. 生成语法树
2. 生成mermaid 库的语法 用于绘制
*/
export function generateSyntaxTreeAndMermaid_(start: string, sponserOrder: string[], T: string[]) {
  let graphContent = ` graph TD\n`;
  const root: SyntaxTreeNode = {
    name: start,
    id: 'n0',
    children: []
  };//根 节点
  let num = 1;
  let terminalIndex = 0;// 终结符 节点下标
  sponserOrder.forEach((item => {
    const [left, right] = item.split('->');
    const nodes = right.split(' ');//
    const closetedNode = getClosestNodeInSyntaxTree(root, left);
    nodes.forEach((name) => {
      const isTerminal = T.includes(name) || name.includes('id:') || name.includes('num_const:');
      //计算 mermaid 语法
      const shape = isTerminal ? `{"${name}"}` : `(("${name}"))`;//终结符使用菱形 非终结符用圆形
      graphContent += `${closetedNode.id}((${left}))---n${num}${shape}\n`;
      // console.log(left, name);
      const newNode: SyntaxTreeNode = {
        id: 'n' + num++,
        name: name,
        children: []
      }
      // console.log(`${closetedNode.name}:${closetedNode.id}->${newNode.name}:${newNode.id}`);
      //更新 语法树
      closetedNode.children.push(newNode);
    })
  }))
  return {
    syntaxTree: root,
    graphContent
  }

}
type DealResult = { type: 'TokenList', data: TokenItem[] } | { type: 'SyntaxError', data: SyntaxError };
/* 将token 串传入 语法分析 之前 需要 处理token 串
1.拼接 main（）  解决词法分析 不能将main()一起识别的问题
2.添加 末尾井号 表示 输入串的 结束
*/
function dealTokenList(src: TokenItem[]): DealResult {
  //复制一份 并追加
  const tokenList = src.map(item => ({ ...item })).concat([{
    word: '#',
    typeCode: 305,
    row: 0,
    col: 0
  }]);
  const index = tokenList.findIndex((item) => item.word === 'main');
  if (index < 0) {
    return {
      type: "SyntaxError",
      data: {
        word: '',
        msg: '缺少入口函数,main()'
      }
    }
  }
  //main 之后必须跟随 （）
  else if (tokenList[index + 1].word !== '(' || tokenList[index + 2].word !== ')') {
    return {
      type: "SyntaxError",
      data: {
        word: '',
        msg: '入口函数,main() 书写错误，'
      }
    }
  }
  //拼接并删除main 之后的 （）
  else {
    tokenList[index].word += '()';
    tokenList.splice(index + 1, 2);
  }
  return {
    type: "TokenList",
    data: tokenList
  };
}
//保存 文法路径信息的 对象
const grammerPathObj = {
  expression: 'expression_grammer.txt',//不区分 算术，关系  全都当作 布尔语句来处理
  if_: 'grammer_if.txt',//不包含 函数调用
  if: 'grammer_if_2.txt',//包含 函数调用
  program: 'program_grammer.txt'
}
type GrammperName = 'expression' | 'if' | 'program' | 'if_';
//定义 语法 分析的入口函数

// 接受 token串为参数
export function syntaxAnalyse(tokenList: TokenItem[], grammerName: GrammperName = 'program') {

  // 初始化 得到预测分析表
  const { start, predictable, NonT, T, sponserObject } = predictInit(grammerPathObj[grammerName]);
  const dissatisfyList = LL1Check(sponserObject, NonT);
  if (dissatisfyList.length > 0) {
    console.log('文法，不满足 LL1:', dissatisfyList);
    // return;
  }
  const result = predictAnalyse(tokenList, { start, predictable, NonT, T });
  console.log(111, result.terminalPositionList);

  const { syntaxTree, graphContent } = generateSyntaxTreeAndMermaid_(start, result.sponserOrder, T,);
  // console.log(syntaxTree);
  return { ...result, syntaxTree, graphContent };
}
export type SyntaxAnaluseResult = ReturnType<typeof syntaxAnalyse>;
export default syntaxAnalyse;
// const result = syntaxAnalyse('i + ( i * i ) #');
// const result = syntaxAnalyse('*i*+i#');
// const result = syntaxAnalyse('id + ( id * id ) #', 'grammer6_back.txt');
// const result = syntaxAnalyse('id >= id ', 'rela_grammer.txt');
// const result = syntaxAnalyse('id || id >= num_const #', grammerPathObj.bool_final);
// const result = syntaxAnalyse('id ( id , num_const ) #', grammerPathObj.bool_final);
// const result = syntaxAnalyse('id || id * ( num_const - id / num_const ) >= num_const #', grammerPathObj.expression);
// const result = syntaxAnalyse('a b a #', grammerPathObj.test);
