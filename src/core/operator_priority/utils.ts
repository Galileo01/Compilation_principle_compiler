import { Candidate, SponserEx, FRItem, SponserExObject } from '../../types/compiler';
import fs from 'fs';
import path from 'path';
export const EMPTY = 'ε';
export const defaultG =
  `E
: E + T
| T
;
T
: T * F
| F
;
F
: ( E )
| i
;
E'
: # E #
;`;
// 从文件读取文法
export function readGrammar(garmmer: string) {
  garmmer = garmmer || defaultG;
  const lines = garmmer.split('\n').map((item) => item.trim()); // 读取每一行的 内容 ,换行LF 对应\r\n ，CRLF \n
  const sponserObject: SponserExObject = {};
  let start = ''; // 记录起始符号
  let curNon = ''; // 当前正在处理的 非终结符
  let curSponser: SponserEx | null = null;
  const NOT: string[] = [];//非终结符
  const ALLChar: Set<string> = new Set();
  for (const line of lines) {
    // 候选式开头
    if ((line[0] === ':' || line[0] === '|') && curSponser) {
      const items = line.slice(2).split(' ');
      //保存出现的 所有单个字符 去重
      items.forEach(item => {
        ALLChar.add(item);
      })
      curSponser.candidateList.push(items); // 添加候选式
    } // 产生式 结束 定义
    else if (line[0] === ';' && curSponser) {
      sponserObject[curNon] = curSponser; // 停止保存
    }
    // 产生式左侧   非终结符
    else {
      start === '' && (start = line); // 记录起始符号
      curNon = line;
      NOT.push(curNon);
      curSponser = new SponserEx();
    }
  }

  //过滤调非终结符
  NOT.forEach(item => {
    ALLChar.delete(item);
  })
  return { sponserObject, start, NOT, T: [...ALLChar] };
}
