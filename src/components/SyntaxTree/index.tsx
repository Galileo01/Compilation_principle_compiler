import React, { useState, useEffect } from 'react';
import mermaid from 'mermaid';
interface Props {
  graphContent: string; //画图语法的 内容
}
//语法树组件
const SyntaxTree: React.FC<Props> = ({ graphContent }) => {
  console.log('render Tree');

  const [html, setHtml] = useState('');
  //绘制函数
  function rerender() {
    const element = document.querySelector('.mermaid') as Element;
    const insertSvg = (svgCode: string) => {
      element.innerHTML = svgCode;
    };
    const graph = mermaid.mermaidAPI.render('graphDiv', graphContent, insertSvg);
    setHtml(graph);
  }
  //更新刷新 树
  useEffect(() => {
    rerender();
  }, [graphContent]);

  return (
    <div className="syntax-tree">
      <div className="mermaid" dangerouslySetInnerHTML={{ __html: html }}></div>
    </div>
  );
};

export default SyntaxTree;
