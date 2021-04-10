/*
词法分析-单词识别器
*/
import {
  TypeCode,
  TokenItem,
  CompilerError,
  ErrorType,
  WordInfo,
  RegErr,
  RegRes,
  RegResult,
  RegResults
} from '../../types/compiler';

//正则表达式

const nextLineReg = /[\n\r]/;
const aZReg = /[a-z]|[A-Z]/;
const numReg = /[0-9]/;
const boundReg = /[{};,]/; //界符判断
// const boundReg=/ /;
//判断 关键字或者 标识符的 种别码
function getTypeCode(word: string) {
  //首先判断是不是关键字
  for (let code = 101; code <= 113; code++) {
    if (TypeCode[code] === word) return code;
  }
  //不是关键字就是 标识符
  return TypeCode['标识符'];
}

//识别标识符
function regIdentifier(code: string, start: number): RegResult {
  let state = 0; //初始状态
  let index = start;
  const info: WordInfo = {
    word: '',
    typeCode: 0,
  };

  while (state !== 2) {
    const char = code[index];
    // console.log(char);
    switch (state) {
      case 0:
        if (aZReg.test(char) || char === '_') state = 1; //变迁到 状态1

        break;
      case 1:
        if (aZReg.test(char) || char === '_') {
          state = 1;
        } else {
          //遇到其他字符 变化为 状态2
          info.word = code.slice(start, index); //MARK:
          info.typeCode = getTypeCode(info.word);
          state = 2;
        }

        break;
    }
    index++;
  }
  return {
    success: true,
    info,
    index,
  };
}
//识别数字
function regNumber(code: string, start: number): RegResult {
  const info: WordInfo = {
    word: '',
    typeCode: 0,
  };
  let index = start;
  let state = 0;
  let isFloat = false; //是否是 浮点数
  let floatLength = 0;
  while (state !== 2) {
    const char = code[index];
    switch (state) {
      case 0:
        if (numReg.test(char))
          //是数字
          state = 1;
        break;
      case 1:
        if (numReg.test(char)) {
          state = 1;
          if (isFloat) {
            floatLength++; //统计 小数的位数
            if (floatLength > 6)
              //位数超出
              return {
                success: false,
                index,
                msg: '小数位数超限',
              };
          }
        } else if (char === '.') {
          if (!isFloat) {
            //小数点
            isFloat = true;
            state = 1;
          } //在小数部分又遇到 .直接报错 !!!
          else
            return {
              success: false,
              index,
              msg: '小数识别报错',
            };
        } else {
          //遇到其他字符 变化为 状态2
          info.word = code.slice(start, index);
          info.typeCode = isFloat ? TypeCode['浮点数'] : TypeCode['整数'];
          state = 2;
        }
        break;
    }
    index++;
  }
  return {
    success: true,
    info,
    index,
  };
}

//识别字符
function regChar(code: string, start: number): RegResult {
  const info: WordInfo = {
    word: '',
    typeCode: TypeCode['字符'],
  };
  let index = start;
  let state = 0;
  while (state !== 4) {
    const char = code[index];
    switch (state) {
      case 0:
        if (char === "'") state = 1;
        break;
      case 1:
        state = 2;
        break;
      case 2:
        if (char == "'") {
          state = 3;
        } //-->包含多个字符 直接返回
        else
          return {
            success: false,
            index,
            msg: '字符非法长度'
          };
        break;
      case 3:
        info.word = code.slice(start, index);
        state = 4;
        break;
    }
    index++;
  }
  return {
    success: true,
    info,
    index,
  };
}
//识别字符串
function regString(code: string, start: number): RegResult {
  const info: WordInfo = {
    word: '',
    typeCode: TypeCode['字符串'],
  };
  let index = start;
  let state = 0;
  while (state !== 3) {
    const char = code[index];
    switch (state) {
      case 0:
        if (char === '"') state = 1;
        break;
      case 1:
        if (char === '"') {
          state = 2;
        }
        break;
      case 2:
        state = 3; //终态
        info.word = code.slice(start, index);
        break;
    }
    index++;
  }
  return {
    success: true,
    info,
    index,
  };
}
//识别 运算符
function regOperator(code: string, start: number): RegResult {
  const info: WordInfo = {
    word: '',
    typeCode: 0,
  };
  let index = start;
  let state = 0;
  const mulReg = /[\<\>\=\!\-\+\*\/]/; //可能有两个字符的 操作符前缀
  while (state !== 3 && state !== 5) {
    const char = code[index];
    switch (state) {
      case 0:
        if (mulReg.test(char)) {
          state = 1;
        } else state = 4;
        break;
      case 1:
        if (char === '=') state = 2;
        //匹配到两个 字符的 运算符>= <= != ==
        else {
          info.word = code.slice(start, index);
          info.typeCode = TypeCode[info.word];
          state = 3;
        }
        break;
      case 2:
        info.word = code.slice(start, index);
        info.typeCode = TypeCode[info.word];
        state = 3;
        break;
      case 4:
        info.word = code.slice(start, index);
        info.typeCode = TypeCode[info.word];
        state = 5;
        break;
    }
    index++;
  }
  return {
    success: true,
    info,
    index,
  };
}

//识别 界符
function regBound(code: string, start: number): RegResult {
  const info: WordInfo = {
    word: code[start],
    typeCode: TypeCode[code[start]],
  };
  return {
    success: true,
    info,
    index: start + 1,
  };
}
//实验1 单词识别
export default function recognizer(sourceCode: string): RegResults {
  // console.log([...sourceCode]);
  let row = 0; //行号
  let col = 0; //列号
  let index = 0;
  let preNextLineIndex = 0; //上一个换行符的下标
  const tokenList: TokenItem[] = [];
  let isInComment = false; //当前是否 在 单行 注释里
  let isInMulComment = false; //当前是否在 多行注释里
  const errList: CompilerError[] = [];//错误信息
  // if(!nextLineReg.test(sourceCode[sourceCode.length-1]))
  while (index < sourceCode.length) {
    const char = sourceCode[index];
    let result: RegResult | null = null; //识别结果

    if (isInComment) {
      //当前字符 在单行注释里面
      if (nextLineReg.test(char)) {
        //遇到 换行符 结束注释
        row++;
        col = 0;
        isInComment = false; //重置为false
        console.log('单行注释结束');
      }
      index++;
      continue;
    }
    //多行注释
    if (isInMulComment) {
      if (nextLineReg.test(char)) {
        row++;
        col = 0;
      } else if (char === '/' && sourceCode[index - 1] === '*') {
        console.log('多行注释结束');
        isInMulComment = false; //重置为false
      }
      index++;
      continue;
    }

    if (nextLineReg.test(char)) {
      const lineEndReg = /[{}();>]/;// 在非注释内  一行末尾只能是 这几种字符 
      if (!lineEndReg.test(sourceCode[index - 1])) {
        const err: CompilerError = {
          typeCode: ErrorType.LexicalError,
          filename: '',
          row,
          col,
          msg: `${row + 1}行${col + 1}列,"${sourceCode[index - 1]}",行末 语法错误`,
        };
        errList.push(err)
      }
      console.log(char);
      //将要换行
      col = 0;
      // preNextLineIndex = index;
      if (nextLineReg.test(sourceCode[index + 1])) { //连续的 两个
        index += 2;
        row += 2;
        preNextLineIndex = index - 1;
        // console.log('double');

      }
      else {
        index++;
        row++;
        preNextLineIndex = index;
      }

      // index++;
      // row++;
      // preNextLineIndex = index;
      // if (nextLineReg.test(sourceCode[index + 1])) {
      //   index++;
      //   console.log('double');
      // }
      console.log('换行');
      continue;
    }
    if (sourceCode[index].trim().length === 0) {
      col++;
      index++;
      continue;
    } //无意义的字符

    //进行 标识符的识别  //字母 下划线
    if (aZReg.test(char) || char === '_') {
      console.log('识别标识符');
      result = regIdentifier(sourceCode, index);
    }
    //识别注释：优先单行注释  多行注释
    else if (char === '/' && sourceCode[index + 1] === '/') {
      isInComment = true;
      console.log('单行注释开始');
      index++;
      continue;
    }
    //开始识别 多行注释
    else if (char === '/' && sourceCode[index + 1] === '*') {
      isInMulComment = true;
      console.log('多行注释开始');
      index++;
      continue;
    }
    //是数字
    else if (numReg.test(char)) {
      console.log('识别数字');
      result = regNumber(sourceCode, index);
    } else if (char === "'") {
      console.log('识别字符');
      result = regChar(sourceCode, index);
    } else if (char === '"') {
      console.log('识别字符串');
      result = regString(sourceCode, index);
    } else if (char in TypeCode) {
      console.log('识别运算符');
      result = regOperator(sourceCode, index);
    } else if (boundReg.test(char)) {
      console.log('识别界符');
      result = regBound(sourceCode, index);
    }

    if (result?.success) {
      //识别成功
      const { info, index: newIndex } = result;
      index = newIndex - 1; //回退一个
      //存储
      col = index - info.word.length - preNextLineIndex;
      tokenList.push({
        word: info.word,
        typeCode: info.typeCode,
        row,
        col,
      });
    }
    //抛出词法错误
    /* 监测到 出错 并不立即 停止识别 尝试向后  继续读取到最近的一个界 符号 */
    else {
      console.log('出错 开始向后查找');

      const startIndex = result?.index ? result.index - 1 : index;
      let currentChar = sourceCode[startIndex];
      const tempBoundReg = /[{};,()]/;//临时加入 括号的识别
      let i = startIndex;
      while (!tempBoundReg.test(currentChar) && !nextLineReg.test(currentChar)) {
        i++;
        currentChar = sourceCode[i];
        console.log('继续查找');

      }
      console.log('log', i, currentChar, tempBoundReg.test(currentChar), nextLineReg.test(currentChar));

      //停止循环时 i 指向一个界符
      //向后继续查找 下一个 界符

      const err: CompilerError = {
        typeCode: ErrorType.LexicalError,
        filename: '',
        row,
        col,
        msg: `${row + 1}行${col + 1}列` + (startIndex === index ? '非法字符' : `${sourceCode.slice(index, i + 1)} ${result?.msg}`),
      };
      errList.push(err);
      index = i + 1; //回退一个
      if (nextLineReg.test(currentChar))//退出 的原因是 遇到了 换行符 执行换行的 操作
      {
        row++;
        col = 0;
        index = index + (nextLineReg.test(sourceCode[index + 1]) ? 2 : 1); //连续的 两个
        preNextLineIndex = index;
      }
    }
  }
  if (errList.length === 0) {
    return {
      success: true,
      data: tokenList
    }
  }
  else
    return {
      success: false,
      data: errList,
    };
}
