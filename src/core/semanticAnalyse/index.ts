//语义分析
import { EMPTY, TerminalPosition } from '../../types/compiler'
import { deepClone } from './utils'
//符号类型
enum SymbolType {
  var = 'VAR',
  const = 'CONST',
  fun = 'FUN'
}
//形式参数 项  
interface FormParam {
  idName: string,
  valueType: string  //int float,
  terminalId: number  //终结符id
}
//单个符号项   
export interface SymbolItem {
  name: string,//符号名称
  value?: string,//使用字符串的形式存储值， 使用时  根据值类型进行转换  空格分隔
  symbolType: SymbolType,//符号类型  
  valueType: string, //值 类型 包含了  函数返回值  void int float
  scope: string,//表示作用域的字符串 ：/0/1/2
  row: number,//符号 位置信息
  col: number,
  address?: string //在寄存器的 地址
  //当符号类型为 函数时 会有以下属性
  paramsList?: FormParam[]
}
// 采用键值对 key-value 的形式存储， 同名的符号 保存到一个数组里
export interface SymbolTable {
  [symbolName: string]: SymbolItem[]
}
//符号表 工具
export class SymbolTableUtil {
  table: SymbolTable = {};
  //添加 同名项
  insertItem(name: string, symbolItem: SymbolItem) {
    !this.table[name] && (this.table[name] = []);//如果不存在 初始化
    //首先检查 作用
    this.table[name].push(symbolItem);
    console.log(`插入符号表:`);
    console.log(`符号 ${symbolItem.name},符号类型：${symbolItem.symbolType},值类型:${symbolItem.valueType}`);
  }
  //更新 值 
  updateItemValue(name: string, scope: string, value: string) {
    const target = this.getItem('name', scope, true);
    if (target) {
      target['value'] = value
    }
  }

  //更新地址
  updateItemAddress(name: string, scope: string, address: string) {
    const target = this.getItem('name', scope, true);
    if (target) {
      target.address = address;
    }
  }
  //查找某个作用域 下的 符号项    作用域是否严格相等
  getItem(name: string, scope: string, isStrict: boolean = false) {
    if (!this.table[name]) return undefined;
    const scopeStack = scope.split('/');
    let result: SymbolItem | undefined = undefined;
    //严格 相等
    if (isStrict) {
      const scopeString = scopeStack.join('/')
      result = this.table[name].find(item => item.scope === scopeString);
      console.log(`查询:,${name},${result}`);
      return result;
    }
    while (scopeStack.length) {
      const scopeString = scopeStack.join('/')
      result = this.table[name].find(item => item.scope === scopeString);
      if (result)
        break;
      scopeStack.pop();//弹出 栈顶  生成新的作用域
    }
    console.log(`查询:,${name},${result}`);
    return result;
  }
  logTable() {
    for (const name in this.table) {
      this.table[name].forEach((item) => {
        console.log(`符号 ${item.name},位置：[${item.row},${item.col}],符号类型：${item.symbolType},值类型:${item.valueType},作用域:${item.scope},值:${item.value}`);
      })
    }
  }

}

//语义 错误
enum SemanticErrorType {
  TYPE_ERROR = '类型错误',
  USE_BEFORE_DECLARE = '声明前使用',
  MODIFY_CONST = '修改常量',
  USAGE_ERROR = '使用方式错误'
}
//语义错误
export interface SemanticError {
  terminalInfo: { name: string, row: number, col: number },
  type: SemanticErrorType,
  msg: string,
}
// 属性 扩展节点  比语法树多一些属性  用于遍历
export interface ExtendTreeNode {
  name: string,
  id: string
  children: ExtendTreeNode[],
  props: TraverseResult, //遍历产生的 综合继承属性
  [key: string]: any
}

//继承  TerminalPosition  可选 位置 信息
export interface RepeatedItem {
  value?: string,// 节点值
  idName?: string,//标识符 内容
  isFunCall?: boolean,//标识符 可能是 函数,
  terminalId?: number //终结符 id
  FRTemp?: string   //函数调用中临时 接收调用返回值的 临时变量 
}

//深度 遍历结果
export interface TraverseResult {
  declareType?: string,//声明的 方式类型      var const  fun  由终结符 向上传递
  valueType?: string,// 声明 的值类型
  curDefineFun?: string// 当前 子树 正在声明的 函数名   由 func_define 节点 向上传递
  paramsList?: FormParam[]//当前正在声明的 函数  的形式参数列表  由 func_params_list 节点向上 传递
  actualParamsList?: ActualParam[] //函数的实际参数 列表 actual_params_list 节点向上传递
  calledFunName?: string,//  当前正在调用的 函数   由 func_call 节点向上传递
  isInIfStatement?: boolean// 是否在 if语句 中  MARK:本属性 只向下 传递  向上返回属性时 必须阻止， 防止 影响到 其他节点
  leftSetId?: string //赋值语句 左侧 标识符   由  set_exp 节点 向下 传递
  repeatedPropsList: RepeatedItem[] //各个节点 都有可能存在的 属性 使用 数组 保存 ，防止覆盖

  [key: string]: any
}


//根据 func_params_list 节点的  repeatedPropsList  数组 求解 形式参数

function getFormParamsList(repeatedPropsList: RepeatedItem[]): FormParam[] {
  const params: FormParam[] = [];
  const sponsor = repeatedPropsList.map(item => item.value).join(' ');
  const items = sponsor.split(',');
  let index = 1; // 在标识符 下标 跳转   1 3 5 7... 
  items.forEach(item => {
    const [type, name] = item.trim().split(' ');
    const { terminalId } = repeatedPropsList[index];//得到 形式参数 标识符的 位置信息
    params.push({
      idName: name,
      valueType: type,
      terminalId: terminalId as number
    })
    index += 2;//每次 递增2 
  })
  return params;
}
//转换 常量
function transformConstValue(value: string): string {
  if (value.startsWith('id:'))
    return value.slice(3)
  else if (value.startsWith('num_const:'))
    return value.slice(10);
  else if (value.startsWith('char_const:'))
    return value.slice(11);
  else return value;
}

//根据 正则 判断 常量类型
function getConstType(value: string): string {
  //数字正则
  const intReg = /^[0-9]+$/;
  const floatReg = /^[0-9]*.[0-9]*$/;
  //字符 正则
  const charReg = /^'[a-zA-Z]'$/;

  if (intReg.test(value)) return 'int'
  else if (floatReg.test(value)) return 'float';
  else return 'char'
}


//实际参数 类型  
interface ActualParam {
  isID: boolean, //是否是标识符 根据 是否存在 RepeatedItem.idName 来判断
  value: string,
  terminalId: number, //终结符id
}

//从 repeatedPropsList 求解 MARK:  （）之间的  实际参数列表  不支持 参数是 布尔表达式
export function getActualParamsList(repeatedPropsList: RepeatedItem[]): ActualParam[] {
  //过滤 ，）
  return repeatedPropsList.filter(item => item.value !== ',' && item.value !== ')').map(({ idName, value, terminalId }) => ({
    isID: Boolean(idName),
    value,
    terminalId
  })) as ActualParam[];
}

//获取 声明语句 中id 的下标
function getCharIndexList(repeatedPropsList: RepeatedItem[], char: string): number[] {
  console.log('test getID', repeatedPropsList);
  const list: number[] = [];
  repeatedPropsList.forEach((item, index) => {
    if (item.value === char)
      list.push(index)
  })
  return list;
}
//处理 声明语句  由于 改进了 文法  可以做到在 声明语句 下 只进行一个 标识符的声明
//TODO: 暂时只支持一次 声明一个变量/常量  后面 再开发 处理多个
function handleDeclare(symbolTableUtil: SymbolTableUtil, currentProps: TraverseResult, treeNode: ExtendTreeNode, scope: string): SemanticError[] {
  const errorList: SemanticError[] = [];
  const startIndex = currentProps.declareType === SymbolType.const ? 1 : 0;//开始分析的 下标
  const valid = currentProps.repeatedPropsList.slice(startIndex + 1);
  const [first, ...rest] = valid;//first ：标示 符所在 的第一项
  //取出 信息
  const idName = first.idName as string;
  const terminalId = first.terminalId as number;
  const position = getTerminalPositionById(terminalId);
  const valueType = currentProps.valueType as string;//值类型
  const equalIndex = currentProps.repeatedPropsList.findIndex(item => item.value === '=');//寻找等号下标
  console.log('equalIndex', equalIndex);
  console.log('scope', scope);
  //如果是 函数声明
  if (currentProps.declareType === SymbolType.fun) {
    console.log('函数定义');

    const paramsList = currentProps.paramsList;// 获取 形式参数 第四个节点是 func_params

    console.log('形式参数列表444', currentProps.paramsList);

    //插入 函数到 符号表
    symbolTableUtil.insertItem(idName, {
      name: idName,
      symbolType: SymbolType.fun,
      valueType,
      scope: scope,
      ...position,
      paramsList
    });
    //参数列表 也要插入到 符号表内  并且 位于 函数内作用域
  }
  //test  变量 和常量 声明
  else {
    //至少存在 一个 初始化语句  就求解 I-V 对列表
    if (equalIndex >= 0) {
      console.log(1010, '存在初始化 语句');
      //计算 逗号和 等号的 下标
      const equalIndexList = getCharIndexList(valid, '=');
      const douIndexList = getCharIndexList(valid, ',');
      douIndexList.push(valid.length)
      console.log('equalIndexList', equalIndexList);
      console.log('douIndexList', douIndexList);
      console.log('valid', valid);
      equalIndexList.forEach((v, index) => {
        const equalIndex = equalIndexList[index];//等号下标
        const douIndex = douIndexList[index];// 逗号下标
        const idIndex = equalIndex - 1;//标识符下标
        const idName = valid[idIndex].idName as string;
        const position = getTerminalPositionById(valid[index].terminalId as number);
        //先检查 统一作用域 下是否存在 同名 标识符
        const symbolItem = symbolTableUtil.getItem(idName, scope);
        if (symbolItem && symbolItem.scope === scope)// 查找到 同作用域  同名变量
        {
          errorList
            .push(
              {
                terminalInfo: {
                  name: idName,
                  ...position,
                },
                type: SemanticErrorType.USAGE_ERROR,
                msg: '当前作用域已经存在同名变量'
              }
            )
        }
        //不存在
        else {
          const value = valid.slice(equalIndex + 1, douIndex);
          const valueStringArr = value.map(item => item.value);
          symbolTableUtil.insertItem(idName, {
            name: idName,
            symbolType: currentProps.declareType === SymbolType.const ? SymbolType.const : SymbolType.var,
            valueType,
            scope: scope,
            value: valueStringArr.join(''),//空格分隔
            ...position,
          });
          //检查 等号右边
          const rightErrorList = handleRightExpression(symbolTableUtil, scope, value, valueType);
          console.log('part', value);
          console.log(equalIndex + 1, douIndex);
          errorList.push(...rightErrorList);
        }
      })
    }
    //不存在 初始化  语句
    else {
      //先检查 统一作用域 下是否存在 同名 标识符
      const symbolItem = symbolTableUtil.getItem(idName, scope);
      if (symbolItem && symbolItem.scope === scope)// 查找到 同作用域  同名变量
      {
        errorList
          .push(
            {
              terminalInfo: {
                name: idName,
                ...position,
              },
              type: SemanticErrorType.USAGE_ERROR,
              msg: '当前作用域已经存在同名变量'
            }
          )
      }
      //不存在
      else {
        symbolTableUtil.insertItem(idName, {
          name: idName,
          symbolType: currentProps.declareType === SymbolType.const ? SymbolType.const : SymbolType.var,
          valueType,
          scope: scope,
          ...position,
        });
      }
    }
  }
  return errorList;
}

//单独 在func_params_list 节点 处理 函数的形式 参数定义   MARK:目的：保证在函数体 内 访问形式参数 时 已经定义
function preDeclareFunParams(symbolTableUtil: SymbolTableUtil, repeatedPropsList: RepeatedItem[], scope: number[]): FormParam[] {
  if (repeatedPropsList.length === 0)
    return [];
  const paramsList = getFormParamsList(repeatedPropsList);// 获取 当前 节点下  形式参数 
  //参数列表 也要插入到 符号表内  并且 位于 函数内作用域
  //不实用 ScopeNumber 的情况下  更新作用域
  const topNumber = scope[scope.length - 1];
  scope.push(topNumber + 1);
  paramsList.forEach(({ idName: paramName, valueType: paramValyeType, terminalId, }) => {
    const position = getTerminalPositionById(terminalId);
    symbolTableUtil.insertItem(paramName, {
      name: paramName,
      symbolType: SymbolType.var,
      valueType: paramValyeType,
      scope: scope.join('/'),//参数 位于 函数体 作用域
      ...position
    });
  })
  // console.log('提前声明 形式参数', paramsList);
  return paramsList;
}

//暂时 无意义的字符
const invalidCharReg = /^[\,\;\+\-\*\/\%\(\)]$/;
const ops = ['||', '&&', '!', '<', '>', '<=', '>=', '==', '!=', '*', '/', '-', '+', '%', '(', ')'];//符号
//处理 一个 右侧表达式   的语义 错误 1.赋值语句/ 也包含 变量初始化  2. 函数return
function handleRightExpression(symbolTableUtil: SymbolTableUtil, scope: string, rightPropsLIst: RepeatedItem[], leftValueType: string, expressType: 'SET' | 'RETURN' = 'SET'): SemanticError[] {
  console.log('处理右侧表达式', rightPropsLIst);
  const msgPrefix = expressType === 'SET' ? '等号两侧' : 'return 语句 与 函数返回值';
  const errorList: SemanticError[] = [];
  for (const { idName: rightIdName, value, isFunCall, terminalId } of rightPropsLIst) {
    const position = getTerminalPositionById(terminalId as number);
    if (value && (invalidCharReg.test(value) || ops.includes(value)))
      continue;
    //是 变量 非函数
    if (rightIdName && !isFunCall) {
      const symbolItem = symbolTableUtil.getItem(rightIdName, scope);
      if (!symbolItem) {

        errorList
          .push(
            {
              terminalInfo: {
                name: rightIdName,
                ...position
              },
              type: SemanticErrorType.USE_BEFORE_DECLARE,
              msg: '不能使用未定义的标识符'
            }
          )
      }
      else if (symbolItem.valueType !== leftValueType) {
        errorList
          .push(
            {
              terminalInfo: {
                name: rightIdName,
                ...position
              },
              type: SemanticErrorType.TYPE_ERROR,
              msg: `${msgPrefix}类型不匹配，标识符类型错误,${leftValueType}!=${symbolItem.valueType}`
            }
          )
      }
    }
    //右侧 是 函数 调用 这里只处理 函数返回值和  左侧类型是否匹配
    else if (rightIdName && isFunCall) {
      const symbolItem = symbolTableUtil.getItem(rightIdName, '0');//函数在 全局作用域查找
      if (!symbolItem) {
        errorList
          .push(
            {
              terminalInfo: {
                name: rightIdName,
                ...position
              },
              type: SemanticErrorType.USE_BEFORE_DECLARE,
              msg: '请先定义再使用函数'
            }
          )
      }
      else if (symbolItem.valueType !== leftValueType) {
        errorList
          .push(
            {
              terminalInfo: {
                name: rightIdName,
                ...position
              },
              type: SemanticErrorType.TYPE_ERROR,
              msg: `${msgPrefix}类型不匹配，标识符类型错误,${leftValueType}!=${symbolItem.valueType}`
            }
          )
      }
    }
    //是常量 类型不符合
    else if (!rightIdName && value) {
      const actualValue = transformConstValue(value);//处理 常量
      const actualParamType = getConstType(actualValue);
      if (actualParamType !== leftValueType) {
        // console.log('aaa', actualValue, getConstType(actualValue));
        errorList
          .push(
            {
              terminalInfo: {
                name: actualValue,
                ...position
              },
              type: SemanticErrorType.TYPE_ERROR,
              msg: `${msgPrefix}类型不匹配，标识符类型错误,${leftValueType}!=${actualParamType}`
            }
          )
      }
    }
  }
  return errorList;
}
//处理 执行语句  赋值语句 
function handleExec(symbolTableUtil: SymbolTableUtil, currentProps: TraverseResult, scope: string): SemanticError[] {
  const errorList: SemanticError[] = [];
  const [first, ...rest] = currentProps.repeatedPropsList;

  const idName = first.idName as string;//获取 标识符 名称
  const position = getTerminalPositionById(first.terminalId as number);
  const idSymbolItem = symbolTableUtil.getItem(idName, scope);
  if (!idSymbolItem) {
    errorList.push({
      terminalInfo: {
        name: idName,
        ...position
      },
      type: SemanticErrorType.USE_BEFORE_DECLARE,
      msg: '不能使用未定义的标识符'
    })
    return errorList;
  }
  //如果是常量
  if (idSymbolItem.symbolType === SymbolType['const']) {
    errorList
      .push(
        {
          terminalInfo: {
            name: idName,
            ...position
          },
          type: SemanticErrorType.MODIFY_CONST,
          msg: '常量不能修改'
        }
      )
    return errorList;
  }
  //变量类型
  const valueType = idSymbolItem.valueType;
  const rightValue = rest.slice(1).map(item => item.value).join(' ')
  // idSymbolItem.value = rightValue;//  MARK: 保存最新 值  不更新
  //检查 右侧 语义错误
  const rightErrorList = handleRightExpression(symbolTableUtil, scope, rest.slice(1), valueType);
  errorList.push(...rightErrorList);
  return errorList;
}

//处理函数 的参数传递 是否正确 标识符 是否 存在
function handleFunCall(symbolTableUtil: SymbolTableUtil, currentProps: TraverseResult, treeNode: ExtendTreeNode, scope: string): SemanticError[] {
  const errorList: SemanticError[] = [];
  const [first, ...rest] = currentProps.repeatedPropsList;
  const funName = currentProps.calledFunName as string;//取得函数  名称 第一个节点 是标识符
  const position = getTerminalPositionById(first.terminalId as number);
  first.FRTemp = `$TFR${funReturnTempNumber++}`;//保存 临时变量 
  //查表
  const funSymbolItem = symbolTableUtil.getItem(funName, '0');//只能在 全局 定义函数
  //没有定义函数立即 退出   MARK:
  if (!funSymbolItem) {
    errorList.push({
      terminalInfo: {
        name: funName,
        ...position
      },
      type: SemanticErrorType.USE_BEFORE_DECLARE,
      msg: '请先定义再使用函数'
    })
    return errorList;
  }
  //形式 参数 列表
  const formParamsList = funSymbolItem.paramsList as FormParam[];
  //传入 actual_params_list 节点 求解 实际参数 列表
  const actualParamsList = getActualParamsList(currentProps.repeatedPropsList.slice(2));
  currentProps.actualParamsList = actualParamsList;
  console.log(666, '实际参数列表', actualParamsList);

  if (formParamsList.length !== actualParamsList.length) {
    errorList.push({
      terminalInfo: {
        name: funName,
        ...position
      },
      type: SemanticErrorType.USAGE_ERROR,
      msg: '实际参数和形式参数个数不匹配'
    })
  }
  //开始 依次  比较 类型
  actualParamsList.forEach(({ isID, value, terminalId }, index) => {
    const position = getTerminalPositionById(terminalId as number);
    const { valueType: formParamValueType } = formParamsList[index];
    //是标识符
    if (isID) {
      const idSymbolItem = symbolTableUtil.getItem(value, scope);
      //查表 失败
      if (!idSymbolItem) {
        errorList.push({
          terminalInfo: {
            name: value,
            ...position
          }, type: SemanticErrorType.USE_BEFORE_DECLARE,
          msg: '不存在对应变量'
        })
      }
      //查表成功
      else {
        const { symbolType, valueType } = idSymbolItem;
        if (symbolType === SymbolType['fun'])
          errorList.push({
            terminalInfo: {
              name: value,
              ...position
            }, type: SemanticErrorType.TYPE_ERROR,
            msg: '实参数类型暂时不支持函数调用'
          })

        else if (valueType !== formParamValueType)//和 实惨类型不负
        {
          errorList.push({
            terminalInfo: {
              name: value,
              ...position
            }, type: SemanticErrorType.TYPE_ERROR,
            msg: `实参、形参类型不匹配,${formParamValueType}!=${valueType}`
          })
        }
      }
    }
    //是数字常量  类型不符
    else if (getConstType(value) !== formParamValueType) {
      errorList.push({
        terminalInfo: {
          name: value,
          ...position
        }, type: SemanticErrorType.TYPE_ERROR,
        msg: `实参、形参类型不匹配,${formParamValueType}!=${getConstType(value)}`
      })
    }
  })

  return errorList;
}

//处理函数 return语句
function handleReturn(symbolTableUtil: SymbolTableUtil, currentProps: TraverseResult, treeNode: ExtendTreeNode, scope: string): SemanticError[] {
  const errList: SemanticError[] = []
  // 父节点传递的 函数返回值
  const funValueType = currentProps.valueType as string;

  //void 函数  使用了return bool_exp 
  if (funValueType === 'void' && currentProps.repeatedPropsList.length > 1) {
    const { value, terminalId } = currentProps.repeatedPropsList[1];
    const position = getTerminalPositionById(terminalId as number)
    errList.push({
      terminalInfo: {
        name: value || '',
        ...position
      },
      type: SemanticErrorType.TYPE_ERROR,
      msg: 'void 函数不能有返回值'
    });
    return errList;// 直接返回
  }

  //调用 右侧表达式 处理      //传入 等号 之后的 表达式
  const rightErrList = handleRightExpression(symbolTableUtil, scope, currentProps.repeatedPropsList.slice(1), funValueType, 'RETURN');
  errList.push(...rightErrList);
  return errList;
}

let terminalCount = 0;//当前 遍历的 终结符个数 用于 在  terminalPositionList  数组下标 
let terminalPositionList: TerminalPosition[] = []; //存储 终结符位置信息   将位置信息也 存入符号表

//根据id 获取 终结符位置
function getTerminalPositionById(id: number) {
  const find = terminalPositionList.find(item => item.terminalId === id) as TerminalPosition;
  return {
    row: find.row,
    col: find.col
  }
}

//处理 终结符
function handlerTerminal(name: string): TraverseResult {
  const props: TraverseResult = { repeatedPropsList: [] };
  const repeated: RepeatedItem = {};
  // 非空 终结符   保存 位置信息
  if (name !== EMPTY) {
    const { row, col, terminalId } = terminalPositionList[terminalCount++];
    repeated.terminalId = terminalId;
    // console.log(555, '终结符:', name, row, col);
  }
  repeated.value = name;
  if (name === 'const') {
    props.declareType = SymbolType.const;
  }
  //节点内容是类型   保存 声明类型
  else if (typeList.includes(name)) {
    props.valueType = name;
  }
  //遇到 标识符 保存标识符 名称
  else if (name.startsWith('id:')) {
    repeated.value = repeated.idName = name.slice(3);
  }
  //遇到 数字常量
  else if (name.startsWith('num_const:'))
    repeated.value = name.slice(10);
  else if (name == EMPTY || name == ';') //   无意义的 终结符 清空 value
    repeated.value = undefined;
  repeated.value && props.repeatedPropsList.push(repeated);
  console.log(555, '终结符:', repeated.value, props.valueType);
  //向 父节点 返回属性
  return props;
}



//拷贝  不可 覆盖的  有意义的属性    拷模式 ：继承 ：全部覆盖    综合 选择性的 保存属性
function copyValidProps(target: TraverseResult, source: TraverseResult) {
  //声明类型
  source?.declareType && (target.declareType = source.declareType);
  //值类型
  source?.valueType && (target.valueType = source.valueType);
  //当前正在 声明的 函数名
  source?.curDefineFun && (target.curDefineFun = source.curDefineFun);
  //当前正在 声明的函数 形式参数
  source?.paramsList && (target.paramsList = source.paramsList);
  //当前 调用的 函数
  source?.calledFunName && (target.calledFunName = source.calledFunName);
  //但前 函数调用的 实际参数 
  source?.actualParamsList && (target.actualParamsList = source.actualParamsList);
  //保存 isInIfStatement
  source?.isInIfStatement && (target.isInIfStatement = source.isInIfStatement)
  //函数调用 返回值 临时变量
  source?.FRTemp && (target.FRTemp = source.FRTemp)
  // 等号 左侧  标识符 
  source?.leftSetId && (target.leftSetId = source.leftSetId)
}

//递增的 作用域标号 全局变量
let ScopeNumber = 0;
const declareStatementList = ["var_declare", 'const_declare', 'func_define'];//需要 检查的 声明语句
let semanticErrorList: SemanticError[] = [];//全局的 语义分析错误 列表
const typeList = ['int', 'float', 'char', 'void'];

//MARK:   用临时变量 名称代替 函数参与 之后的 中间代码 /目标代码 表达式计算
let funReturnTempNumber = 0;//临时变量 标号
// 扩展语法树的 深度 遍历函数
function traverse(treeNode: ExtendTreeNode, extendProps: TraverseResult, symbolTableUtil: SymbolTableUtil, scope: number[]): TraverseResult {

  let props: TraverseResult = { repeatedPropsList: [] };//本次遍历 字节点会产生的 综合属性  用于 传递
  copyValidProps(props, extendProps);//从父节点 继承 有意义的属性
  const { name, children } = treeNode;
  //当前节点是终结符
  if (children.length === 0) {
    const newProps = handlerTerminal(name);
    console.log('处理终结符');
    // console.log('属性', newProps);
    copyValidProps(props, newProps);//保存 新属性
    props.repeatedPropsList.push(...newProps.repeatedPropsList);//保存可重复的属性 
    //向 父节点 返回属性
    return props;
  }
  if (name === 'complicated_statement') {
    //进入 复合语句 需要更新作用域
    scope = [...scope, ++ScopeNumber];//赋予 新的引用 ，不影响 父节点 传递下来的 scope
  }
  //MARK:向子节点传递 当前处于 if 语句  用于中间代码生成 if语句的翻译
  else if (name === 'if_statement') {
    props.isInIfStatement = true;
  }

  //包含子节点
  //从左向右 递归 深度遍历  保存 综合属性
  children.forEach((child, index) => {
    //遍历 字节点的 同时传递 继承属性
    const newProps = traverse(child, props, symbolTableUtil, scope);
    console.log('遍历子节点：', child.name);
    // console.log(`777,子节点${child.name} 传递 的综合属性 valueType=`, newProps.valueType);

    copyValidProps(props, newProps);//保存 新属性
    props.repeatedPropsList.push(...newProps.repeatedPropsList);//每个节点可能 重复的 value 使用 数组来保存 拼接
    if (name === 'func_define' && index === 1)//当遍历到  func_define的 第二个子节点 提前 保存 函数名称
    {
      //保存当前 正在 定义的函数名
      props.curDefineFun = newProps.repeatedPropsList[0].idName;//函数明
      console.log('定义的函数名', props.curDefineFun);
    }
    //遇到 赋值语句 向子节点传递 leftSetId     保存遍历完 第一个 节点
    else if (name === 'set_exp' && index === 1) {
      props.leftSetId = props.repeatedPropsList[0].idName;//存储等号 左侧标识符 
    }
  })
  console.log('节点内容after', name);
  // console.log('currentProps', props.valueType, props.declareType);
  //是声明语句
  if (declareStatementList.includes(name) && props.valueType) {
    const index = declareStatementList.findIndex(item => item === name);
    const list = ['var', 'const', 'fun']
    props.declareType = SymbolType[list[index]];
    // console.log('currentProps', props.valueType, props.declareType);
    console.log('处理声明语句');
    const errList = handleDeclare(symbolTableUtil, props, treeNode, scope.join('/'));
    semanticErrorList.push(...errList);
  }
  //是函数调用
  else if (name === 'func_call') {
    props.repeatedPropsList[0].isFunCall = true;  //第一个子节点 则为函数 标识符 ， 表示该终结符是一个函数
    props.calledFunName = props.repeatedPropsList[0].idName;
    console.log('处理函数调用');
    const errList = handleFunCall(symbolTableUtil, props, treeNode, scope.join('/'));
    semanticErrorList.push(...errList);

  }
  //函数return 语句
  else if (name === 'return_statement') {
    console.log('处理return 语句');
    console.log('222', props.curDefineFun, props.valueType);
    const errList = handleReturn(symbolTableUtil, props, treeNode, scope.join('/'));
    semanticErrorList.push(...errList)
  }
  //遇到 赋值语句
  else if (name === 'set_exp') {
    console.log('处理执行语句');
    const errList = handleExec(symbolTableUtil, props, scope.join('/'));
    semanticErrorList.push(...errList)
  }
  else if (name === 'func_params_list') //在参数列表 删除 子节点 传递上来的 valueType declareType 属性
  {
    console.log(`333提前声明函数:${props.curDefineFun}的形式参数`);
    const paramsList = preDeclareFunParams(symbolTableUtil, props.repeatedPropsList, scope.slice(0));//传入scope 的拷贝  传引用 会被更改
    props.paramsList = paramsList;
  }

  treeNode.props = props;

  //返回props 之前 阻止 部分属性的 向上传递  //深度拷贝
  const returnProps = deepClone<TraverseResult>(props);

  //删除 函数定义的 形式参数 列表
  if (name === 'func_define') {
    //删除   标识符 节点 之后的 形式 参数
    returnProps.actualParamsList = undefined;
    returnProps.repeatedPropsList.splice(2);
  }
  else if (name === 'func_call') {
    // MARK: 阻止 实际参数列表 继续 往上传递 
    returnProps.repeatedPropsList.splice(1);//删除 （ 节点 之后的 
    returnProps.calledFunName = undefined; //阻止函数
  }
  else if (name === 'func_params_list') {
    // 手动阻止  参数类型 向上传递
    returnProps.valueType = undefined;
    returnProps.declareType = undefined;
  }
  //阻止 向上传递
  else if (name === 'if_statement') {
    returnProps.isInIfStatement = undefined;
  }
  else if (name === 'set_exp') {
    returnProps.leftSetId = undefined;
  }
  return returnProps;//向父节点 返回综合属性  浅拷贝
}

//语义分析 主函数
export function semanticAnalyse(syntaxTree: ExtendTreeNode, terminalPositions: TerminalPosition[]) {
  // console.log(syntaxTree);
  terminalCount = 0;
  ScopeNumber = 0;
  semanticErrorList = [];//重新赋值为空
  terminalPositionList = terminalPositions;
  const symbolTableUtil = new SymbolTableUtil();
  const scope: number[] = [0];//作用域 栈
  //语义 分析  遍历
  traverse(syntaxTree, { repeatedPropsList: [] }, symbolTableUtil, scope);
  console.log(semanticErrorList);
  symbolTableUtil.logTable();
  return {
    symbolTableUtil,
    semanticErrorList
  };
}
/*
支持的错误类型                                                          done       check
1.变量/常量定义  初始化值 和类型不匹配 （一次声明一个） 包含初始化 类型匹配             1        1
2. 。。。。                                多个
3. 统一作用域下 不允许 声明同名变量
3.常量 不允许 二次赋值                                                  1         1
4. 常量声明 没有初始化                                                  1       1
4. 函数调用   参数 个数、类型 不匹配                                     1        1
5.  赋值语句  等号两边  类型 不匹配                                     1        1
6. return  语句  和函数 返回值  不匹配                                1         1
7.函数形式参数 函数真正声明前声明                                     1           1
  */

export type SemanticAnaluseResult = ReturnType<typeof semanticAnalyse>