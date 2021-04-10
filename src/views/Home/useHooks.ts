import { useEffect, useState } from 'react';
//计算 表格最大高度
export function useGetMaxHeight(className: string, otherHeight: number) {
  const [maxHeight, setHeight] = useState(0);
  useEffect(() => {
    const ele = document.querySelector(className);
    if (!ele) return;
    //声明 处理函数
    const handler = () => {
      const { maxHeight } = getComputedStyle(ele);
      setHeight(parseInt(maxHeight) - otherHeight);
    };
    handler();
    window.addEventListener('resize', handler);
    //组件卸载 取消事件 监听
    return () => {
      window.removeEventListener('resize', handler);
    };
  }, []);
  return maxHeight;
}
