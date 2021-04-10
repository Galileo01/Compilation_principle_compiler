//编译器 全局 类型定义
export enum ErrorType {
  LexicalError, //词法错误
  SyntaxError,
  SemanticError, //语义错误
  LogicalError, //逻辑错误
}

export interface CompilerError {
  typeCode: ErrorType;
  filename: string;
  row: number;
  col: number;
  msg: string;
}
//token项
export interface TokenItem {
  typeCode: number;
  word: string;
  row?: number | '未知';
  col?: number | '未知';
}

//声明 关键字
export enum TypeCode {
  char = 101,
  int,
  float,
  break,
  const,
  return,
  void,
  continue,
  do,
  while,
  if,
  else,
  for,
  include,
  //运算符
  '(' = 201,
  ')',
  '[',
  ']',
  '!',
  '*',
  '/',
  '%',
  '+',
  '-',
  '<',
  '=',
  '.',
  '>',
  '<=',
  '>=',
  '==',
  '!=',
  '+=',
  '-=',
  '/=',
  '*=',
  '&&',
  '||',
  '&',
  '|',
  ':',
  //界符
  '{' = 301,
  '}',
  ';',
  ',',
  '#',
  //单词种类
  '整数' = 400,
  '字符' = 500,
  '字符串' = 600,
  '标识符' = 700,
  '浮点数' = 800,
}

//词法识别的阶段要用到的 类型

//识别结果 的单词信息
export interface WordInfo {
  word: string;
  typeCode: number;
}

//识别错误
export type RegErr = {
  success: false;
  index: number;
  msg?: string;
};
//识别结果
export type RegRes = {
  success: true;
  info: WordInfo;
  index: number;
};
//单个识别程序的 的识别结果
export type RegResult = RegErr | RegRes;

//整个 手动此法 识别 函数的 识别结果
export type RegResults =
  | { success: true; data: TokenItem[] }
  | { success: false; data: CompilerError[] };

//语法分析（预测分析法） 用到的类型
// 候选式
export type Candidate = string[];
// followRelation 的一项
export type FRItem = {
  nonName: string; // 非终结符
  type: 'FIRST' | 'FOLLOW'; // 相关的类型，是和该非终结符的 First 集 相关 还是Follow 集相关
};
// 产生式 定义
export class Sponser {
  candidateList: Candidate[] = []; // 候选式 数组

  firstRelation: string[] = []; // 暂时没有求出 的相关first

  followRelation: FRItem[] = []; //  相关 follow

  First: Set<string> = new Set(); // First 集合

  Follow: Set<string> = new Set(); // First 集合
}
// 用 key-value 存储非终结符 及其数据
export interface SponserObject {
  [nonName: string]: Sponser;
}
