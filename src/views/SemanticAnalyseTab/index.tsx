import React, { useState, memo } from 'react';
import { Button, notification, Row, Col, Empty } from 'antd';
import { SyntaxTreeNode, TerminalPosition } from '../../types/compiler';
import { semanticAnalyse, SemanticAnaluseResult, ExtendTreeNode } from '../../core/semanticAnalyse';
import SemanticResult from '../../components/SemanticResult';
interface Props {
  syntaxTree: SyntaxTreeNode | null;
  terminalPositionList: TerminalPosition[];
  dispatch: Function;
}
const SematicAnalyseTab: React.FC<Props> = ({ syntaxTree, dispatch, terminalPositionList }) => {
  const [analyseResult, setResult] = useState<SemanticAnaluseResult | null>(null);
  //语法分析 入口函数
  function entrance() {
    console.log(analyseResult);

    const result = semanticAnalyse(syntaxTree as ExtendTreeNode, terminalPositionList); //测试
    // console.log(result);
    setResult(result);
    //向 index 传递 符号 控制 对象
    dispatch({
      type: 'SYMBOLTABLEUTIL',
      payload: result.symbolTableUtil,
    });
    if (result && result.semanticErrorList.length === 0) {
      notification.success({
        message: '分析成功',
      });
    } else {
      notification.error({
        message: '分析失败,发现错误',
      });
    }
  }
  return (
    <>
      <Row>
        <Col span={4}>
          <Button type="primary" disabled={syntaxTree === null} onClick={entrance}>
            语义分析
          </Button>
        </Col>
        <Col span={4} offset={1}>
          <Button onClick={() => setResult(null)} disabled={!analyseResult} type="dashed">
            重置
          </Button>
        </Col>
      </Row>
      {analyseResult ? <SemanticResult semanticResult={analyseResult} /> : ''}
    </>
  );
};

export default memo(SematicAnalyseTab);
