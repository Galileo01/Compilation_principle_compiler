import React, { useState, useEffect } from 'react';
import mermaid from 'mermaid';
import { generateGraphGrammer } from './utils';
interface Props {
  analyseSponser: string[];
  T: string[]
}
//语法树组件
const SyntaxTree: React.FC<Props> = ({ analyseSponser, T }) => {
  const graphContent = generateGraphGrammer(analyseSponser, T);
  console.log(graphContent);

  //更新刷新 树
  useEffect(() => {
    mermaid.init('.mermaid');
  }, [graphContent]);

  return (
    <div className="syntax-tree">
      <div className="mermaid" dangerouslySetInnerHTML={{ __html: graphContent }}></div>
    </div>
  );
};

export default SyntaxTree;
