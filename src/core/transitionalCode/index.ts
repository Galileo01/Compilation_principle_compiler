//中间代码生成   这里只定义 翻译函数， 融入到语义分析
import { ExtendTreeNode, SymbolTableUtil, } from '../semanticAnalyse/index';
//四元式
export type FourItemFormula = [string, string, string, string | number]; //[op,arg1,arg2,result] arg2 可为空
import { isOP, transformToSuffix } from './utils'
export interface FourItemFormulaTableItem {
  scope: string//四元式 的作用域  用于 回填 真假 出口时 确定作用域
  value: FourItemFormula
}

//四元式  表
export type FourItemFormulaTable = FourItemFormulaTableItem[];

//翻译函数
type TranslateFunction = (treeNode: ExtendTreeNode) => FourItemFormula[];

let tempNumber = 0;//临时变量 标号

//翻译 布尔表达式 包含了 算术 ，关系 表达式   通用 方法
export const translateBoolExp = (pre: string[], type: 'SET' | 'RETURN' | 'BOOL' = 'BOOL') => {
  const formulaList: FourItemFormula[] = [];
  console.log('pre', pre);
  //转换为 后缀 表达式 
  const suffix = transformToSuffix(pre);
  const numberStack: string[] = [];
  suffix.forEach(char => {
    //数字 压入 数字栈
    if (!isOP(char)) {
      numberStack.push(char)
    }
    //是数字  弹出2个操作数
    else {
      const arg1 = numberStack.pop() || '';
      //临时变量 用于 接受运算结果   也要push 到数字栈 方便其他四元 式子 引用
      const temp = '$T' + tempNumber++;
      if (char === '!') {//是单目运算符 ！
        formulaList.push([char, arg1 || '', '', temp])
      }
      else {
        const arg2 = numberStack.pop() || '';
        formulaList.push([char, arg2, arg1 || '', temp])
      }
      numberStack.push(temp);
    }
  })
  console.log('BoolExp', formulaList);
  return formulaList;
};

//翻译 赋值语句
export const translateSet_exp: TranslateFunction = ({ props }) => {
  console.log('setExp', props.repeatedPropsList);
  // props.calledFunName
  const formulaList: FourItemFormula[] = [];
  const idName = props.repeatedPropsList[0]?.idName as string;//左侧标识符
  //如果存在函数 结果临时变量   就是用临时变量
  const formula = props.repeatedPropsList.slice(2).map(item => item?.FRTemp ? item?.FRTemp : item?.value) as string[];
  // const right
  console.log('formula', formula);
  //布尔表达式 元素项超过3个 
  if (props.repeatedPropsList.length >= 5) {
    const boolExpFList = translateBoolExp(formula); //传入 return_statement' 节点 ？还是 bool_exp 节点？
    //得到 最后一个 临时变量 的名称
    const lastTemp = boolExpFList[boolExpFList.length - 1][3];
    //添加 赋值 四元式子
    formulaList.push(...boolExpFList, ['=', lastTemp + '', '', idName]);
  }
  //单目运算符  + 。。
  else if (props.repeatedPropsList.length === 4) {
    const temp = '$T' + tempNumber++;
    formulaList.push([formula[2], formula[3], '', temp], ['=', temp, '', idName]);
  }
  //直接单纯 赋值
  else if (props.repeatedPropsList.length === 3) {
    formulaList.push(['=', formula[0], '', idName]);
  }
  return formulaList;
};

// 翻译 函数定义
export const translateFunDefine: TranslateFunction = ({ props }) => {
  //取得函数名称
  const funName = props.curDefineFun as string;
  return [[funName, '', '', '']];
};

//翻译 return语句
export const translateReturnStatement: TranslateFunction = ({ props }) => {
  const formulaList: FourItemFormula[] = [];
  console.log('tc fun info', props?.curDefineFun, props?.valueType, props.repeatedPropsList);
  let returnId = '';
  //函数有返回值 
  if (props?.valueType !== 'void') {
    //return  布尔 表达式
    if (props.repeatedPropsList.length > 2)//说明返回了 值
    {
      //处理 return为  布尔表达式  返回
      const rightValueString = props.repeatedPropsList.slice(1).map(item => item?.value as string)
      // TODO: 完善                                                       //不包含 ；号
      const boolExpFList = translateBoolExp(rightValueString); //传入 return_statement' 节点 ？还是 bool_exp 节点？
      formulaList.push(...boolExpFList);
      returnId = boolExpFList[boolExpFList.length - 1][3] as string;//取出 最终的临时 变量
    }
    // return 单个 标识符
    else if (props.repeatedPropsList.length = 2) {
      returnId = props.repeatedPropsList[1]?.value as string;
    }
  }
  //MARK: 如果有返回值 ，则方法体内 的
  formulaList.push(['ret', '', '', returnId]);
  return formulaList;
};
//翻译 函数调用
export const translateFunCall: TranslateFunction = ({ props }) => {
  const formulaList: FourItemFormula[] = [];
  const funName = props.calledFunName;
  const actualParamsList = props.actualParamsList;
  const leftSetId = props?.leftSetId;
  const FRtemp = props.repeatedPropsList[0].FRTemp as string;
  console.log('leftSetId', leftSetId);

  //创建 参数传递 四元式子
  actualParamsList?.forEach(({ value }) => {
    formulaList.push([
      'para', value, '', ''
    ])
  })
  //创建 调用 四元式
  formulaList.push([
    'call', funName || '', '', ''
  ])
  // MARK: 创建 临时变量 接收 函数 返回值  的同时代替函数调用 在布尔表达式 中参与 运算
  //自定义四元式   接收 函数返回值  
  formulaList.push([
    'get_return', '', '', FRtemp
  ])
  // props.
  return formulaList;
};

//遍历 if 语句 的 bool_exp 节点 返回 由 逻辑运算符的链接的 各项
function getBoolStringItem(boolString: string[]): string[][] {
  const result: string[][] = []
  let preIndex = 0;
  //查找 逻辑运算符的  下标 分隔 每一个项
  boolString.forEach((value, index) => {
    if (value === '&&' || value === '||') {
      const item = boolString.slice(preIndex, index);
      result.push(item);//保存 布尔项
      result.push([value]);// 保存 运算符
      console.log('item', item);
      preIndex = index + 1;
    }
  })
  result.push(boolString.slice(preIndex));//单独一个 / 单独一个布尔项
  return result;
}

//翻译if 语句   根据
export const translateIfStatement: TranslateFunction = (treeNode) => {
  const { props } = treeNode;
  const formulaList: FourItemFormula[] = [];
  //计算 bool_exp 节点内容
  const boolString = treeNode.children[2].props.repeatedPropsList.map(item => item?.value) as string[];
  console.log('boolString', boolString);
  const boolItems = getBoolStringItem(boolString);
  console.log('boolItems', boolItems);

  const TChain: number[] = [];//真出口 链 保存 跳转到 真出口的 四元式子下标  用于 计算完成之后回填
  const FChain: number[] = [];//假 出口
  //遍历
  boolItems.forEach((current, index) => {
    const next = (index + 1 < boolItems.length) ? boolItems[index + 1][0] : undefined;
    //操作符
    if (current.length === 1 && isOP(current[0])) {

    }
    //布尔项的 内容为单个 字符 变量/常量  直接保存 进
    else if (current.length === 1 && !isOP(current[0])) {
      console.log('tc 222');

      //下一个 是  &&  或者当前就是最后 一项
      if (next === '&&' || !next) {
        //为真  
        formulaList.push([
          'jnz', current[0], '', formulaList.length - 1 + 3
        ])
        //为假 出口  临时填写 0 
        formulaList.push([
          'j', '', '', 0
        ]);
        // 保存 F链
        FChain.push(formulaList.length);
      }
      /// ||
      else if (next === '||') {
        //为真  临时填充 -1
        formulaList.push([
          'jnz', current[0], '', -1
        ]);
        //保存 T 链
        TChain
          .push(formulaList.length);
        //为假 出口
        formulaList.push([
          'j', '', '', formulaList.length - 1 + 1
        ])
      }
      console.log('formulaList');
      logFormulaList(formulaList);
    }
    //当前 布尔项 内容为 表达式  传入 translateBoolExp 翻译为多条语句  再替换最终
    else if (current.length > 1) {
      const boolExpFList = translateBoolExp(current);
      console.log('tc 333', boolExpFList);
      formulaList.push(...boolExpFList);//先保存
      const last = formulaList.slice(-1)[0];//取到最后当前 最后一项
      //修改最后一项  和保存 假 出口
      //下一个 是  &&  或者当前就是最后 一项
      if (next === '&&' || !next) {
        //真出口
        last[0] = 'jnz' + last[0];
        last[3] = formulaList.length - 1 + 2;
        //为假 出口  临时填写 0 
        formulaList.push([
          'j', '', '', 0
        ]);
        // 保存 F链
        FChain.push(formulaList.length);
      }
      /// ||
      else if (next === '||') {
        //真出口  临时填充 -1
        last[0] = 'jnz' + last[0];
        last[3] = -1;
        //保存 T 链
        TChain
          .push(formulaList.length);
        //为假 出口
        formulaList.push([
          'j', '', '', formulaList.length - 1 + 2
        ])
      }
      console.log('formulaList');
      logFormulaList(formulaList);
    }
  })
  console.log('tc,TChain:', TChain, 'FChain', FChain);
  return formulaList;
};


//在整个 树 翻译完之后 检查  前面的四元式 是否有 没有填充 假 出口（0） 如果有 则用
// 遇到 } 回填真假 出口
function backFillOut() {
  //遍历  对没有填充的 真假出口 进行回填
  for (let i = 0; i < globalFormulaTable.length; i++) {
    const item = globalFormulaTable[i];
    const { scope, value } = item;
    // console.log('tc scope:', scope, value);

    const scopeTopNumber = parseInt(scope.split('/').pop() as string);
    if (value[3] === -1) {//没有填充的 真出口
      console.log('发现没有填充的 真出口');
      let nextNumber = 0;
      //向后查找
      for (let j = i + 1; j < globalFormulaTable.length; j++) {
        const item2 = globalFormulaTable[j];
        console.log('item2.scope ', item2.scope);

        if (item2.scope === (scope + '/' + (scopeTopNumber + 1))) {//找到  if语句 作用域 下的 第一条语句
          nextNumber = j + 1;//
          break;
        }
      }
      //找到之后  进行 填充
      if (nextNumber !== 0) {
        value[3] = nextNumber;
        console.log('tc 回填 真出口', nextNumber, value);
      }
    }
    else if (value[3] === 0)//发现 没有填充的 假出口
    {
      console.log('发现没有填充的 假出口');
      let nextNumber = 0;
      //向后查找
      for (let j = i + 1; j < globalFormulaTable.length; j++) {
        const item2 = globalFormulaTable[j];
        if (item2.value[0].startsWith('j')) //跳过 真假出口 四元 式 以j 开头
          continue;
        if ((item2.scope === (scope + '/' + (scopeTopNumber + 2))) || (item2.scope === item.scope)) {//找到  else 语句内  或者 整个 if 语句之后的 第一条 四元式
          nextNumber = j + 1;//
          break;
        }
      }
      //找到之后  进行 填充
      if (nextNumber !== 0) {
        value[3] = nextNumber;
        console.log('tc 回填假出口', nextNumber, value);
      }
    }
  }
}

function traverseAndTranslateFuncall() {

}


//全局 四元式子 表
let globalFormulaList: FourItemFormula[] = [];

let globalFormulaTable: FourItemFormulaTable = [];
let ScopeNumber = 0;
//递归遍历函数
function traverse(treeNode: ExtendTreeNode, symbolTableUtil: SymbolTableUtil, scope: number[]) {
  const { name, children, props } = treeNode;
  if (children.length === 0) return;
  if (name === 'func_define') {
    const formulaList = translateFunDefine(treeNode);
    console.log('翻译函数定义');
    // console.log(formulaList);
    globalFormulaTable.push(...formulaList.map(item => ({
      scope: scope.join('/'),
      value: item
    })))
  }
  else if (name === 'func_call') {
    const formulaList = translateFunCall(treeNode);
    console.log('翻译函数调用语句');
    // console.log(formulaList);
    // console.log('kkk', treeNode.props.actualParamsList);
    globalFormulaTable.push(...formulaList.map(item => ({
      scope: scope.join('/'),
      value: item
    })))
  }
  else if (name === 'return_statement') {
    const formulaList = translateReturnStatement(treeNode);
    console.log('翻译return语句');
    console.log(formulaList);
    globalFormulaTable.push(...formulaList.map(item => ({
      scope: scope.join('/'),
      value: item
    })))
  }
  else if (name === 'if_statement') {
    const formulaList = translateIfStatement(treeNode);
    console.log('翻译if语句');
    // 插入全局的 同时更新 四元式 跳转 的 下标
    formulaList.forEach((item, index) => {
      if ((typeof (item[3]) === 'number') && item[3] > 0) {
        const distance = item[3] - index;// 相对 距离
        item[3] = globalFormulaTable.length + 1 + distance;
      }
      globalFormulaTable.push({
        scope: scope.join('/'),
        value: item
      })
    })
  }
  else if (name == 'program') {
    globalFormulaList.splice(0, 0, ['main', '', '', '']);//插入到 首部
  }

  if (name === 'complicated_statement') {
    //进入 复合语句 需要更新作用域
    scope = [...scope, ++ScopeNumber];//赋予 新的引用 ，不影响 父节点 传递下来的 scope
  }
  //递归遍历子节点
  children.forEach(child => {
    traverse(child, symbolTableUtil, scope);
  });


  //遍历完所有的 子节点 添加 结束 四元式
  if (name == 'program') {
    //插入到
    // globalFormulaList.push(formulaList[1])
    globalFormulaTable.push({
      scope: scope.join('/'),
      value: ['sys', '', '', '']
    })
    backFillOut();//遍历完 之后 统一回填
  }
  //MARK: 赋值语句要在 子节点/布尔表达式 遍历完 之后在 翻译 
  // 赋值语句  if  
  else if (name == 'set_exp') {
    const formulaList = translateSet_exp(treeNode);
    console.log('翻译赋值语句');
    console.log(formulaList);
    // console.log('kkk', treeNode.props.actualParamsList);
    globalFormulaTable.push(...formulaList.map(item => ({
      scope: scope.join('/'),
      value: item
    })))
  }
  //遇到包含了  初始化 的 声明语句 也要进行 赋值语句的 翻译
  else if (name === 's_id_declare' && props.repeatedPropsList.length > 2) {
    const formulaList = translateSet_exp(treeNode);
    console.log('翻译变量初始化语句');
    console.log(formulaList);
    // console.log('kkk', treeNode.props.actualParamsList);
    globalFormulaTable.push(...formulaList.map(item => ({
      scope: scope.join('/'),
      value: item
    })))
  }
}
//输出 四元式子 表
function logFormulaTable(globalFormulaTable: FourItemFormulaTable) {
  globalFormulaTable.forEach((item, index) => {
    console.log(index + 1, item.scope, item.value);

  })
}

// 翻译函数内 输出列表
function logFormulaList(globalFormulaTable: FourItemFormula[]) {
  globalFormulaTable.forEach((item, index) => {
    console.log(index, item);

  })
}
//生成 中间代码 --- 四元式
export function translateTransitionalCode(syntaxTree: ExtendTreeNode, symbolTableUtil: SymbolTableUtil) {
  globalFormulaTable = [];
  traverse(syntaxTree, symbolTableUtil, [0]);
  logFormulaTable(globalFormulaTable);
  return { formulaTable: globalFormulaTable, symbolTableUtil };
}
export type TranslateResult = ReturnType<typeof translateTransitionalCode>;