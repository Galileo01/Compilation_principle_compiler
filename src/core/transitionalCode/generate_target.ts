import { FourItemFormulaTable, FourItemFormulaTableItem } from './index'
import { SymbolTableUtil, SymbolItem } from '../semanticAnalyse/index'
type ASMCodeItem = string;

interface ASMCodeTableItem {
  number: number, //四元式 编号  用于标示每个 汇编代码块
  funName?: string,//对于函数定义语句 块 要包含 函数  在目标代嘛中 标示
  codeList: ASMCodeItem[] //本块 内的 汇编代码 数组
}
type ASMCodeTable = ASMCodeTableItem[];

let DSIndex = 259;//DS 寄存器 当前 可分配的 起始地址   用于存储变量
let ESIndex = 0; //ES 寄存器 当前 可分配的  起始地址   用于存储临时变量 Tn
const DSItemSize = 2; //DS ES 每一个想占用的 大小  也就是 步进
const ESItemSize = 2;

//分配 DS 地址  存放变量
function allocateDS() {
  const address = `ds:[${DSIndex}]`;
  DSIndex += DSItemSize
  return address;
}

//分配 ES 存放临时地址
function allocateES() {
  const address = `es:[${ESIndex}]`;
  ESIndex += ESItemSize
  return address;
}

const intReg = /^[0-9]+$/;
const floatReg = /^[0-9]*.[0-9]*$/;
const idReg = /^[_]?[a-zA-Z]+[_]?[0-9]*[_]?/;
//临时 变量 存储 ，
interface TempItem {
  name: string,
  address: string
}
//存储 生成过程中 的临时变量
const globalTempList: TempItem[] = [];

//通过name 才临时变量表查找
const getTempAddressByName = (name: string) => globalTempList.find(item => item.name === name)?.address;

//是否是 常量
const isTempValue = (arg: string) => arg.startsWith('$T');

//判断 四元式 的参数 是否需要 替换为 地址
const isNeedReplace = (arg: string) => idReg.test(arg) || isTempValue(arg);


//处理 四元 式 中的 标识符   MARK: 返回 新分配的地址/返回符号表的 地址
function getAddress(name: string, symbolTableUtil: SymbolTableUtil, scope: string) {
  //是否是 临时变量
  const isTemp = isTempValue(name);
  let address = '';
  // 不是临时变量 查找 符号表
  if (!isTemp) {
    const symbolItem = symbolTableUtil.getItem(name, scope, true);
    symbolItem && (address == symbolItem?.address);
  }
  else {
    const find = getTempAddressByName(name);
    find && (address = find);
  }
  //无论 符号表还是 临时变量表 没有保存 地址 则 立即分配
  if (!address) {
    //临时变量
    if (isTemp) {
      address = allocateES();
      //保存 进临时 变量表
      globalTempList.push({
        name,
        address
      })
    }
    // 非临时 变量
    else {
      address = allocateDS();
      //更新符号表
      symbolTableUtil.updateItemAddress(name, scope, address);
    }
  }
  return address;
}

//生成函数类
type GenerateFunction = (tableItem: FourItemFormulaTableItem, symbolTableUtil: SymbolTableUtil, index?: number) => ASMCodeItem[];

//+
const generateSum: GenerateFunction = ({ value, scope }, symbolTableUtil) => {
  const codeList: ASMCodeItem[] = [];
  let [op, A, B, T] = value;
  //A 需要替换
  isNeedReplace(A) && (A = getAddress(A, symbolTableUtil, scope))
  codeList.push(`MOV AX,${A}`);

  // B
  isNeedReplace(B) && (B = getAddress(B, symbolTableUtil, scope))
  codeList.push(`ADD AX,${B}`);

  //T
  (typeof T === 'string' && isNeedReplace(T)) && (T = getAddress(T, symbolTableUtil, scope))
  codeList.push(`MOV ${T},AX`);

  return codeList;
}

//-
const generateSub: GenerateFunction = (item, symbolTableUtil) => {
  //复用 ADD 逻辑
  const codeList = generateSum(item, symbolTableUtil);
  codeList[1] = codeList[1].replace('ADD', 'SUB');//替换  ADD
  return codeList;
}

// *
const generateMul: GenerateFunction = ({ value, scope }, symbolTableUtil) => {
  const codeList: ASMCodeItem[] = [];
  let [op, A, B, T] = value;
  //A 需要替换
  isNeedReplace(A) && (A = getAddress(A, symbolTableUtil, scope))
  codeList.push(`MOV AX,${A}`);

  // B
  isNeedReplace(B) && (B = getAddress(B, symbolTableUtil, scope))
  codeList.push(`MOV AX,${B}`);

  codeList.push(`MUL BX`);
  //T
  (typeof T === 'string' && isNeedReplace(T)) && (T = getAddress(T, symbolTableUtil, scope))
  codeList.push(`MOV ${T},AX`);
  return codeList;
}

// /
const generateDivide: GenerateFunction = ({ value, scope }, symbolTableUtil) => {
  const codeList: ASMCodeItem[] = [];
  let [op, A, B, T] = value;
  //A 需要替换
  isNeedReplace(A) && (A = getAddress(A, symbolTableUtil, scope))
  codeList.push(`MOV AX,${A}`);

  codeList.push('MOV DX,0')
  // B
  isNeedReplace(B) && (B = getAddress(B, symbolTableUtil, scope))
  codeList.push(`MOV BX,${B}`);

  codeList.push('DIV BX');
  //T
  (typeof T === 'string' && isNeedReplace(T)) && (T = getAddress(T, symbolTableUtil, scope))
  codeList.push(`MOV ${T},AX`);
  return codeList;
}

//%
const generateMod: GenerateFunction = (item, symbolTableUtil) => {
  //复用 除法 逻辑
  const codeList = generateDivide(item, symbolTableUtil);
  codeList[4] = codeList[4].replace('AX', 'DX');
  return codeList
}
//<
const generateLesser: GenerateFunction = ({ value, scope }, symbolTableUtil) => {
  const codeList: ASMCodeItem[] = [];
  let [op, A, B, T] = value;

  codeList.push('MOV DX,1')
  //A 需要替换
  isNeedReplace(A) && (A = getAddress(A, symbolTableUtil, scope))
  codeList.push(`MOV AX,${A}`);

  // B
  isNeedReplace(B) && (B = getAddress(B, symbolTableUtil, scope))
  codeList.push(`CMP AX,${B}`);

  codeList.push('JB _LT', 'MOV DX 0');

  //T
  (typeof T === 'string' && isNeedReplace(T)) && (T = getAddress(T, symbolTableUtil, scope))
  codeList.push(`_LT: MOV ${T} ,DX`);
  return codeList
}
//<=
const generateLE: GenerateFunction = (item, symbolTableUtil) => {
  //复用 <
  const codeList = generateLesser(item, symbolTableUtil);
  codeList[3] = 'JNA _LE';
  codeList[5] = codeList[5].replace('LT', 'LE')
  return codeList
}

//>
const generateGreater: GenerateFunction = (item, symbolTableUtil) => {
  //复用 <
  const codeList = generateLesser(item, symbolTableUtil);
  codeList[3] = 'JNB _GE';
  codeList[5] = codeList[5].replace('LT', 'GE')
  return codeList
}

//>=
const generateGE: GenerateFunction = (item, symbolTableUtil) => {
  //复用 <
  const codeList = generateLesser(item, symbolTableUtil);
  codeList[3] = 'JA _GT';
  codeList[5] = codeList[5].replace('L', 'G')
  return codeList
}
//==
const generateEqual: GenerateFunction = (item, symbolTableUtil) => {
  //复用 <
  const codeList = generateLesser(item, symbolTableUtil);
  codeList[3] = 'JE _EQ';
  codeList[5] = codeList[5].replace('LT', 'EQ')
  return codeList
}

//&&
const generateAnd: GenerateFunction = ({ value, scope }, symbolTableUtil) => {
  const codeList: ASMCodeItem[] = [];
  let [op, A, B, T] = value;
  codeList.push('MOV DX,0');
  //A 需要替换
  isNeedReplace(A) && (A = getAddress(A, symbolTableUtil, scope))
  codeList.push(`MOV AX,${A}`);

  codeList.push('CMP AX,0', 'JE _AND')
  // B
  isNeedReplace(B) && (B = getAddress(B, symbolTableUtil, scope))
  codeList.push(`ADD AX,${B}`);
  codeList.push('CMP AX,0', 'JE _AND', 'MOV DX,1');
  //T
  (typeof T === 'string' && isNeedReplace(T)) && (T = getAddress(T, symbolTableUtil, scope))
  codeList.push(`_AND: MOV ${T},DX`);

  return codeList;
}

//||
const generateOr: GenerateFunction = (item, symbolTableUtil) => {
  const codeList = generateAnd(item, symbolTableUtil);
  codeList[0] = 'MOV DX,1';
  codeList[3] = codeList[6] = 'JNE _OR';
  codeList[7] = 'MOV DX,0';
  codeList[8] = codeList[8].replace('AND', 'OR');
  return codeList;
}

//!=
const generateNot: GenerateFunction = ({ value, scope }, symbolTableUtil) => {
  const codeList: ASMCodeItem[] = [];
  let [op, A, B, T] = value;
  codeList.push('MOV DX,1');
  //A 需要替换
  isNeedReplace(A) && (A = getAddress(A, symbolTableUtil, scope))
  codeList.push(`MOV AX,${A}`);

  codeList.push('CMP AX,0', 'JE _NOT', 'MOV DX,0');

  //T
  (typeof T === 'string' && isNeedReplace(T)) && (T = getAddress(T, symbolTableUtil, scope))
  codeList.push(`_NOT: MOV ${T},DX`);

  return codeList;
}

//赋值 
const generateSet: GenerateFunction = ({ value, scope }, symbolTableUtil) => {
  const codeList: ASMCodeItem[] = [];
  let [op, A, B, T] = value;
  //A 需要替换
  isNeedReplace(A) && (A = getAddress(A, symbolTableUtil, scope))
  codeList.push(`MOV AX,${A}`);
  //T
  (typeof T === 'string' && isNeedReplace(T)) && (T = getAddress(T, symbolTableUtil, scope))
  codeList.push(`MOV ${T},AX`);

  return codeList;
}

//自定义 四元 式 函数返回值
const generateGetReturn: GenerateFunction = ({ value, scope }, symbolTableUtil) => {
  const codeList: ASMCodeItem[] = [];
  let [op, A, B, T] = value;
  //替换 临时变量
  (typeof T === 'string') && (T = getAddress(T, symbolTableUtil, scope))
  codeList.push(`MOV ${T},AX`); //函数调用之后 会把 结果存储在 AX 

  return codeList;
}

//直接 跳转
const generateJ: GenerateFunction = ({ value, scope }, symbolTableUtil) => {
  let [op, A, B, T] = value;
  return [`JMP far ptr ${T}`];
}

//jz
const generateJz: GenerateFunction = ({ value, scope }, symbolTableUtil) => {
  const codeList: ASMCodeItem[] = [];
  let [op, A, B, T] = value;
  //A 需要替换
  isNeedReplace(A) && (A = getAddress(A, symbolTableUtil, scope))
  codeList.push(`MOV AX,${A}`);

  codeList.push('CMP AX,0', 'JE _NE');

  codeList.push(`JMP far ptr ${T}`, '_NE : NOP');

  return codeList;
}
//jnz
const generateJnz: GenerateFunction = ({ value, scope }, symbolTableUtil) => {
  const codeList: ASMCodeItem[] = [];
  let [op, A, B, T] = value;
  //A 需要替换
  isNeedReplace(A) && (A = getAddress(A, symbolTableUtil, scope))
  codeList.push(`MOV AX,${A}`);

  codeList.push('CMP AX,0', 'JE _EZ');

  codeList.push(`JMP far ptr ${T}`, '_EZ : NOP');

  return codeList;
}

//j>
const generateJG: GenerateFunction = ({ value, scope }, symbolTableUtil) => {
  const codeList: ASMCodeItem[] = [];
  let [op, A, B, T] = value;
  //A 需要替换
  isNeedReplace(A) && (A = getAddress(A, symbolTableUtil, scope))
  codeList.push(`MOV AX,${A}`);
  //B
  isNeedReplace(B) && (B = getAddress(B, symbolTableUtil, scope))
  codeList.push(`CMP AX,${B}`)

  codeList.push(`JG ${T}`);
  return codeList;
}

//j>=
const generateJGE: GenerateFunction = (item, symbolTableUtil) => {
  const codeList = generateJG(item, symbolTableUtil);
  codeList[2] = codeList[2].replace('JG', 'JGE');
  return codeList;
}

//j<
const generateJL: GenerateFunction = (item, symbolTableUtil) => {
  const codeList = generateJG(item, symbolTableUtil);

  codeList[2] = codeList[2].replace('JG', 'JL');
  return codeList;
}

//j>=
const generateJLE: GenerateFunction = (item, symbolTableUtil) => {
  const codeList = generateJG(item, symbolTableUtil);
  codeList[2] = codeList[2].replace('JG', 'JLE');
  return codeList;
}


//para 参数传递
const generatePara: GenerateFunction = ({ value, scope }, symbolTableUtil) => {
  const codeList: ASMCodeItem[] = [];
  let [op, A, B, T] = value;
  //A 需要替换
  isNeedReplace(A) && (A = getAddress(A, symbolTableUtil, scope))
  codeList.push(`MOV AX,${A}`);

  codeList.push('PUSH AX');
  return codeList;
}

//函数调用
const generateFunCall: GenerateFunction = ({ value, scope }, symbolTableUtil) => {
  let [op, A, B, T] = value;
  return [`CALL ${A}`];
}

//return 语句
const generateReturn: GenerateFunction = ({ value, scope }, symbolTableUtil) => {
  const codeList: ASMCodeItem[] = [];
  let [op, A, B, T] = value;
  //存在 返回值 
  if (T && typeof T === 'string') {
    T = getAddress(T, symbolTableUtil, scope);
    codeList.push(`MOV AX,${T}`);
  }
  codeList.push('MOV SP,BP', 'POP BP', 'RET');
  return codeList;
}

//程序 退出
const generateSysQuit: GenerateFunction = () => {
  return [
    'quit: mov ah,4ch',
    'INT 21H',
    'code ends',
    'end start'
  ]
}
const startCodes = `
assume cs:code,ds:data,ss:stack,es:extended   
extended segment 
db 1024 dup (0)   
extended ends   
stack segment   
db 1024 dup (0)   
stack ends   
data segment   
t_buff_p db 256 dup (24h)   
t_buff_s db 256 dup (0)    
data ends    
code segment   
start: mov ax,extended:   
mov es,ax   
mov ax,stack    
mov ss,ax   
mov sp,1024   
mov bp,sp    
mov ax,data   
mov ds,ax   
  
  

`


function logCodeTable(asmCodeTable: ASMCodeTable) {
  asmCodeTable.forEach(({ number, codeList }) => {
    codeList.forEach((item, index) => {
      console.log(` ${index === 0 ? number : '  '}`, item);
    })
  })
}

//生成 字符串 形式的 最终代码 
export function generateFinalCode(asmCodeTable: ASMCodeTable, funCodeTable: FUNASMCodeTable) {
  let codeStr = startCodes;
  const codes: string[] = [];
  asmCodeTable.forEach(({ number, codeList, funName }) => {
    codeList.forEach((item, index) => {
      //第一条 代码 输出块 编号
      const line = `${index === 0 ? number + ':' : '   '}   ${item}\n`;
      codeStr += line;
      codes.push(line);
    })
    codeStr += '\n';
  })
  codeStr += `\n\n
      `
  codes.push('\n', '\n');
  //函数定义语句
  for (const funName in funCodeTable) {
    const codeList = funCodeTable[funName];
    codeList.forEach((item, index) => {
      //第一条 代码 输出块 编号
      const line = `${index === 0 ? funName + ':' : '    '}   ${item}\n`;
      codeStr += line;
      codes.push(line);
    })
  }

  return { codeStr, codes };
}


interface FUNASMCodeTable {
  [key: string]: ASMCodeItem[];
}
// 主要的 目标代码 生成      接收 四元式 表   符号表
export function generateMainCode(formulaTable: FourItemFormulaTable, symbolTableUtil: SymbolTableUtil) {
  const asmCodeTable: ASMCodeTable = []; //普通 汇编代码 表
  const funCodeTable: FUNASMCodeTable = {};//函数定义 以及函数体 汇编代码表
  let isInFunDefine = false;//当前是否处于 函数 定义  
  let funName = '';//正在 处理 函数定义的 函数明
  //依次 遍历 根据 四元式 生成 汇编
  formulaTable.forEach((item, index) => {
    const { scope, value } = item;
    const [op, A, B, T] = value;
    let codeList: ASMCodeItem[] = []
    // 控制 语句
    //函数定义
    if (op === 'sys') {
      codeList = generateSysQuit(item, symbolTableUtil);
      console.log('转换 SYS', codeList);
    }
    else if (op && !A && !B && !T) {
      codeList = ['PUSH BP', 'MOV BP,SP', 'SUB SP'];
      isInFunDefine = true;//之后的语句都属于 函数体
      funName = op;
      funCodeTable[op] = [];
    }
    //赋值语句
    else if (op === '=') {
      codeList = generateSet(item, symbolTableUtil);
      console.log('转换 SET', codeList);
    }
    //接收返回值
    else if (op === 'get_return') {
      codeList = generateGetReturn(item, symbolTableUtil);
      console.log('转换 GET RETURN', codeList);
    }
    //直接跳转
    else if (op === 'j') {
      codeList = generateJ(item, symbolTableUtil);
      console.log('转换 J', codeList);
    }
    //为假 跳转
    else if (op === 'jz') {
      codeList = generateJz(item, symbolTableUtil);
      console.log('转换 JZ', codeList);
    }
    //为真 跳转
    else if (op === 'jnz') {
      codeList = generateJnz(item, symbolTableUtil);
      console.log('转换 JNZ', codeList);
    }
    //参数 传递
    else if (op === 'para') {
      codeList = generatePara(item, symbolTableUtil);
      console.log('转换 PARA', codeList);
    }
    //函数调用
    else if (op === 'call') {
      codeList = generateFunCall(item, symbolTableUtil);
      console.log('转换 FUN CALL', codeList);
    }
    else if (op === 'ret') {
      codeList = generateReturn(item, symbolTableUtil);
      console.log('转换 RETURN', codeList);
    }
    //基础运算

    else if (op === '+') {
      codeList = generateSum(item, symbolTableUtil);
      console.log('转换 ADD', codeList);
    }
    else if (op === '-') {
      codeList = generateSub(item, symbolTableUtil);
      console.log('转换 SUB', codeList);
    }
    else if (op === '*') {
      codeList = generateMul(item, symbolTableUtil);
      console.log('转换 MUL', codeList);
    }
    else if (op === '/') {
      codeList = generateDivide(item, symbolTableUtil);
      console.log('转换 DEVIDE', codeList);
    }
    else if (op === '%') {
      codeList = generateMod(item, symbolTableUtil);
      console.log('转换 MOD', codeList);
    }
    else if (op === '<') {
      codeList = generateLesser(item, symbolTableUtil);
      console.log('转换 LESSER', codeList);
    }
    else if (op === '<=') {
      codeList = generateLE(item, symbolTableUtil);
      console.log('转换 LESS EQUAL', codeList);
    }
    else if (op === '>') {
      codeList = generateGreater(item, symbolTableUtil);
      console.log('转换 GREATER', codeList);
    }
    else if (op === '>=') {
      codeList = generateGE(item, symbolTableUtil);
      console.log('转换 GREATER EQUAL', codeList);
    }
    else if (op === '==') {
      codeList = generateEqual(item, symbolTableUtil);
      console.log('转换 EQUAL', codeList);
    }
    else if (op === '&&') {
      codeList = generateAnd(item, symbolTableUtil);
      console.log('转换 AND', codeList);
    }
    else if (op === '||') {
      codeList = generateOr(item, symbolTableUtil);
      console.log('转换 OR', codeList);
    }
    else if (op === '!') {
      codeList = generateNot(item, symbolTableUtil);
      console.log('转换 NOT', codeList);
    }
    if (!isInFunDefine)
      asmCodeTable.push({
        number: index + 1,
        codeList
      })
    else {
      funCodeTable[funName].push(...codeList)
      if (op === 'ret') {
        isInFunDefine = false;//return 语句保存之后 结束函数定义
      }
    }

  })
  // console.log('主要 汇编代码');
  // logCodeTable(asmCodeTable);
  // console.log('函数定义 汇编代码');
  // logCodeTable(funCodeTable);
  const final = generateFinalCode(asmCodeTable, funCodeTable);
  // console.log('最终 汇编代码');
  // console.log(final);
  return final;

}

