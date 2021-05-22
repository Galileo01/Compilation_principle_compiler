//中间代码  工具函数
//优先级
const Priority: {
  [key: string]: number
} = {
  '||': 0,
  '&&': 1,
  '!': 2,
}

const ops = ['||', '&&', '!', '<', '>', '<=', '>=', '==', '!=', '*', '/', '-', '+', '%', '(', ')'];//符号
//关系 运算符
Priority['<'] = Priority['>'] = Priority['<='] = Priority['>='] = Priority['=='] = Priority['!='] = 3;
Priority['+'] = Priority['-'] = 4;
Priority['*'] = Priority['/'] = Priority['%'] = 5;
Priority['('] = -1;

export const isOP = (char: string) => ops.includes(char);

//利用栈 将前缀 表达式 转换为 后缀表达式
export function transformToSuffix(mid: string[]) {
  const opStack: string[] = [];
  const suffix: string[] = [];
  mid.forEach(char => {
    //不是 操作符
    if (!isOP(char)) {
      suffix.push(char);//保存后缀 表达式
    }
    // 左括号 压入 符号栈
    else if (char === '(') {
      opStack.push(char);
    }
    //右 括号 弹出 元素 知道遇到（
    else if (char === ')') {
      let top = opStack.pop();
      while (top && top !== '(') {
        //压入 后缀 
        suffix.push(top);
        top = opStack.pop();
      }
    }
    //为 运算符号 
    else {
      const top = opStack.slice(-1)[0];//取出栈顶
      if (!top || (Priority[top] < Priority[char])) {//大于栈 顶元素 优先级
        opStack.push(char);
      }
      else {
        let top_ = opStack.slice(-1)[0];
        // console.log('top_:', top_, 'char', char);
        // console.log(Priority[top_], Priority[char]);

        //直到 优先级 大于栈顶 运算符
        while (top_ && (Priority[top_] >= Priority[char])) {//栈 顶元素 大于 char 优先级
          // console.log('char:', char, '> tpo_', top);
          suffix.push(top_);//存入 后缀
          opStack.pop();
          top_ = opStack.slice(-1)[0];
        }
        opStack.push(char);
      }
    }
  })
  suffix.push(...opStack.reverse());//倒序 保存 剩余 运算符
  return suffix;
}

// console.log(transformToSuffix(['a', '+', '(', '3', '-', '1', ')', '*', '3', '+', '10', '/', '2']));
// console.log(transformToSuffix(['(', 'a', '+', '1', ')', '&&', 'b']));