import { TokenItem } from '../../types/compiler';
//

export function detailStdout(stdout: string): TokenItem[] {
  const item = stdout.split('\n').filter((item) => +item.split(' ')[1] < 800); //过滤无意义 的 键值   !检查  lex

  return item.map((item) => {
    console.log(item);
    const keyValue = item.split(' '); //分割键值
    return {
      word: keyValue[0],
      typeCode: +keyValue[1],
      row: '未知',
      col: '未知',
    };
  });
}
