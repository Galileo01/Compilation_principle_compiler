/*
语法分析 初始化工具
*/
import { Candidate, Sponser, FRItem, SponserObject } from '../../types/compiler';
import { EMPTY } from './constant';
import fs from 'fs';
import path from 'path';

// 从文件读取文法
export function readGrammar(syntaxPath: string) {
  const fileContent = fs.readFileSync(path.join(__dirname, './' + syntaxPath), 'utf-8');//拼接 路径  
  // const fileContent = fs.readFileSync('./test.txt', 'utf-8');
  const lines = fileContent.split('\r\n').map((item) => item.trim()); // 读取每一行的 内容
  const sponserObject: SponserObject = {};
  let start = ''; // 记录起始符号
  let curNon = ''; // 当前正在处理的 非终结符
  let curSponser: Sponser | null = null;
  for (const line of lines) {
    // 候选式开头
    if ((line[0] === ':' || line[0] === '|') && curSponser) {
      curSponser.candidateList.push(line.slice(2).split(' ')); // 添加候选式
    } // 产生式 结束 定义
    else if (line[0] === ';' && curSponser) {
      sponserObject[curNon] = curSponser; // 停止保存
    }
    // 产生式左侧   非终结符
    else {
      start === '' && (start = line); // 记录起始符号
      curNon = line;
      curSponser = new Sponser();
    }
  }

  return { sponserObject, start };
}

// 生成 First集
export function generateFirst(sponserObject: SponserObject) {
  // logSponserObj(sponserList);
  // 开始求解 First
  // 第一次  遍历
  for (const nonName in sponserObject) {
    const sponser = sponserObject[nonName];
    // 遍历候选式
    for (const candidate of sponser.candidateList) {
      // 若 候选式包含 空集
      if (candidate.includes(EMPTY)) {
        sponser.First.add(EMPTY);
        continue;
      }
      const first = candidate[0];// 获取第一个字符
      // 若第一个字符是终结符
      if (!isNon(sponserObject, first)) {
        sponser.First.add(first); // 直接保存到First
        continue;
      }
      // 遍历字符
      const firstRelationListItem: string[] = [];//列表项 保存每个候选式子的 FirstRelation
      for (const char of candidate) {
        firstRelationListItem.push(char);
        if (isNon(sponserObject, char)) break; // 一直向相关 first push 元素，直到 遇到非终结符（非终结符也要 push ）
      }
      sponser.firstRelation.push(firstRelationListItem); // 保存
    }
  }
  // logSponserObj(sponserObject, 'FT');
  // 之后的 一直循环
  let isModified = false;
  do {
    isModified = false; // 重置
    for (const nonName in sponserObject) {
      const sponser = sponserObject[nonName];
      // 遍历 相关first 集
      for (const index in sponser.firstRelation) {
        const FRItem = sponser.firstRelation[index];
        //遍历 每个 数组项
        const tempArr = [...FRItem];//用于 遍历  防止删除 元素对 遍历造成影响
        for (const charIndex in tempArr) {
          const Xi = tempArr[charIndex];
          // 判断 非终结符 Xi 是否 相关集合没有求解
          if (
            isNon(sponserObject, Xi)
            && !isRelationEmpty(sponserObject, Xi, 'FTR')
          ) {
            // console.log('continue');
            continue; // 跳过 没有求解 First集 的 非终结符
          }
          // console.log('nonName', nonName, 'Xi', Xi);
          // 如果是终结符 或者
          if (!isNon(sponserObject, Xi)) {
            // console.log('222');
            FRItem.splice(+charIndex)// 将后面的元素全部舍去
            break;
          }
          // 是一个非终结符
          else {
            const FirstofXi = getFirst(sponserObject, Xi); // 获取Xi的First 集
            const FirstofNon = getFirst(sponserObject, nonName); // 获取  非终结符 nonName 的First

            // 保存 Frist
            FirstofXi.forEach((item) => {
              if (item !== EMPTY) {
                FirstofNon.add(item);
                isModified = true; // First 发生改变
                // console.log('save:', item);
              }
            });
            // console.log('FirstofNon', FirstofNon);

            // 候选式内 空字 立即停止 ，
            if (!isCandidateHasEmpty(sponserObject, Xi)) {
              sponser.firstRelation.splice(+index);//从FR item中 删除 整个列表
              break;
            } else FRItem.splice(+charIndex, 1);//删除之后的 
            //如果当前是最后一个 非终结符
            if (FRItem.length === 0 && FirstofXi.has(EMPTY)) {  //当前是一个 非终结符 但是  所有的项都 被遍历并移除 
              FirstofNon.add(EMPTY);//
            }
          }

        }

      }
    }
    // logSponserObj(sponserObject);
  } while (isModified); // 一直 循环 直到First 稳定
  logSponserObj(sponserObject, 'FT');
  // 验证 每个非终结符的 First 集 非空以及 FirstRelation 集合 为空
  if (!checkState(sponserObject)) {
    console.log('文法错误 inFirst');
    return false;
  }

  return true;
}
// 生成Follow
export function generateFollow(sponserObject: SponserObject, start: string) {
  sponserObject[start].Follow.add('#'); // 开始符号 包含 # 对应（1）
  // 第一次循环 初始化 Follow
  for (const nonName in sponserObject) {
    const sponser = sponserObject[nonName];
    // 查找该非终结符 出现的候选式
    for (const nonName2 in sponserObject) {
      if (nonName === nonName2) continue; // 排除 相等
      // console.log(`nonName:${nonName},nonName2:${nonName2}`);
      const sponser2 = sponserObject[nonName2];
      for (const candidate of sponser2.candidateList) {
        // console.log('candidate', candidate);

        const index = [...candidate].findIndex(
          (item) => item === nonName,
        ); // 找到nonName 所在下标
        if (index >= 0) {
          // 如果能找到
          const after = candidate[index + 1];
          // 判断 之后是否 还有字符
          if (after) {
            // 是非终结符
            if (isNon(sponserObject, after)) {
              // 并且没有存储过
              if (
                !sponser.followRelation.find(
                  (item) => item.nonName === after
                    && item.type === 'FIRST',
                )
              ) {
                sponser.followRelation.push({
                  nonName: after,
                  type: 'FIRST',
                });
              }
              // //如果after 可以推导出 空字  对应 （4）.2    并且没有存储过
              if (
                isCandidateHasEmpty(sponserObject, after)
                && !sponser.followRelation.find(
                  (item) => item.nonName === nonName2
                    && item.type === 'FOLLOW',
                )
              ) {
                sponser.followRelation.push({
                  nonName: nonName2,
                  type: 'FOLLOW',
                });
              }
            }
            // 是终结符 对应 （2）
            else {
              sponser.Follow.add(after);
            }
          }
          // nonName2 是最后一个 字符  对应  （4）.1    并且没有存储过
          else if (
            !sponser.followRelation.find(
              (item) => item.nonName === nonName2
                && item.type === 'FOLLOW',
            )
          ) {
            sponser.followRelation.push({
              nonName: nonName2,
              type: 'FOLLOW',
            });
          }
        }
      }
    }
  }
  // logSponserObj(sponserObject, 'FW');
  let isModified = false;
  // 一直 循环  直到 Follow 稳定
  do {
    isModified = false;
    for (const nonName in sponserObject) {
      const sponser = sponserObject[nonName];
      // 遍历 followRelation 
      const tempArr = [...sponser.followRelation];//临时专门 用于遍历的 数组

      for (const index in tempArr) {
        const { nonName: FRNonName, type } = tempArr[
          index
        ];
        const Follow = getFollow(sponserObject, nonName); //等待更新的 Follow 集合

        // 如果是与该非终结符的 First 集合有关
        if (type === 'FIRST') {
          const FIRST = getFirst(sponserObject, FRNonName);//FIRST 默认不会为空
          FIRST.forEach((item) => {
            // 非空字符
            if (item !== EMPTY) Follow.add(item); // 保存 到 nonName 的Follow 集
          });
          isModified = true;//标记 变更
          sponser.followRelation.splice(+index, 1); // 删除本元素
        }
        else {
          if (sponserObject[FRNonName].followRelation.length !== 0) {//还没求解完
            continue;
          }
          const FOLLOW = getFollow(sponserObject, FRNonName);
          FOLLOW.forEach((item) => {
            // 非空字符
            if (item !== EMPTY) Follow.add(item); // 保存 到 nonName 的Follow 集
          });
          isModified = true;//标记 变更
          sponser.followRelation.splice(+index, 1); // 删除本元素
        }
      }
    }
  } while (isModified);
  if (!checkState(sponserObject, 'FOLLOW')) {
    console.log('文法错误 in Follow');
    return false;
  }
  // logSponserObj(sponserObject, 'FW');
  return true;
}

// 判断是否是 非终结符
const isNon = (sponserObject: SponserObject, name: string): boolean => name in sponserObject; // 判断是否有这个键

// 判断 候选式里是否包含 空子 判断 该候选字是否可以 推倒出空子  这里可以 推出 空字不和其他 字符 构成 候选式 
const isCandidateHasEmpty = (sponserObject: SponserObject, nonName: string): boolean => {
  // 得到 非终结符 候选式 包含的字符
  const charOfCandidate = sponserObject[nonName].candidateList.reduce((pre, cur) => pre.concat(cur), []);// 二维数组 扁平化
  return charOfCandidate.includes(EMPTY);
};
// 判断某个非终结符的 相关集合 是否为空
const isRelationEmpty = (sponserObject: SponserObject, nonName: string, type: 'FTR' | 'FWR'): boolean => {
  const key = type === 'FTR' ? 'firstRelation' : 'followRelation';
  return sponserObject[nonName][key].length === 0;
};

// 获取 非终结符的 First 集
export const getFirst = (sponserObject: SponserObject, nonName: string): Set<string> => sponserObject[nonName].First;

// 获取 非终结符的 Follow 集
export const getFollow = (sponserObject: SponserObject, nonName: string): Set<string> => sponserObject[nonName].Follow;

// 验证 造成没有变更的原因是 正常 终止还是 文法错误  type:标识
const checkState = (
  sponserObject: SponserObject,
  type: 'FOLLOW' | 'FIRST' = 'FIRST',
): boolean => {
  let success = true;
  if (type == 'FIRST') {
    for (const nonName in sponserObject) {
      const sponser = sponserObject[nonName];
      if (sponser.First.size === 0 || sponser.firstRelation.length > 0) {
        // 存在一个 非终结符 的First为空或者FR非空
        success = false; // 生成失败 标识 文法有错误
        break;
      }
    }
  } else {
    for (const nonName in sponserObject) {
      const sponser = sponserObject[nonName];
      if (
        sponser.Follow.size === 0
        || sponser.followRelation.length > 0
      ) {
        // 存在一个 非终结符 的First为空或者FR非空
        success = false; // 生成失败 标识 文法有错误
        break;
      }
    }
  }
  return success;
};


// 输出
type typeEnum = 'CD' | 'FT' | 'FW' | 'BOTH';
export function logSponserObj(sponserObject: SponserObject, type: typeEnum = 'CD'): void {
  for (const nonName in sponserObject) {
    const sponser = sponserObject[nonName];
    console.log(`${nonName}->`);
    switch (type) {
      case 'CD':
        console.log('candidateList');

        for (const item of sponser.candidateList) {
          console.log(item);
        }
        break;
      case 'FT':
        console.log('First:', sponser.First);
        console.log('First Relation', sponser.firstRelation);
        break;
      case 'FW':
        console.log('Follow:', sponser.Follow);
        console.log('Follow Relation', sponser.followRelation);
        break;
      case 'BOTH':
        console.log('First:', sponser.First);
        console.log('Follow:', sponser.Follow);
    }
  }
}

//获取 终结符和 非终结符 求解First 之后
export function getNonT_T(sponserObject: SponserObject) {
  const NonT: string[] = [];
  const T: Set<string> = new Set<string>();
  for (let nonName in sponserObject) {
    NonT.push(nonName);
    const sponser = sponserObject[nonName];
    sponser.First.forEach(item => item !== EMPTY && T.add(item));
    sponser.Follow.forEach(item => (item !== EMPTY && item !== '#') && T.add(item));
  }
  return {
    NonT,
    T: [...T, '#'],//保证  #在 末尾
  }
}
