import React, { memo, useState } from 'react';
import { Button, Modal, notification, Popover, Row, Col, Empty } from 'antd';
import { TokenItem } from '../../types/compiler';
import { syntaxAnalyse, SyntaxAnaluseResult } from '../../core/syntaxAnalyse';
import MermaidGraph from '../../components/MermaidGraph';
import SyntaxResult from '../../components/SyntaxResult';
interface Props {
  tokenList: TokenItem[];
  dispatch: Function;
}
const SyntaxAnalyseTab: React.FC<Props> = ({ tokenList, dispatch }) => {
  const [analyseResult, setResult] = useState<SyntaxAnaluseResult | null>(null);
  const [treeVisible, setVisible] = useState(false);
  console.log('render stntacAnalyseTab');
  //语法分析 入口函数
  function entrance() {
    console.log(tokenList);

    const result = syntaxAnalyse(tokenList); //测试
    console.log(result.syntaxTree);
    setResult(result);
    if (result && result.success) {
      notification.success({
        message: '分析成功',
      });
      //保存语法树
      dispatch({
        type: 'SYNTAXTREE',
        payload: result.syntaxTree,
      });
      //保存 终结符信息
      dispatch({
        type: 'POSITIONLIST',
        payload: result.terminalPositionList,
      });
    } else {
      notification.error({
        message: '分析失败',
      });
    }
  }

  return (
    <>
      <Row>
        <Col span={4}>
          {tokenList.length === 0 ? (
            <Button type="primary" disabled>
              语法分析
            </Button>
          ) : (
            <Popover content="采用预测分析法自上而下的进行分析，支持非LL1文法">
              <Button onClick={entrance} type="primary">
                语法分析
              </Button>
            </Popover>
          )}
        </Col>
        <Col span={4} offset={1}>
          <Button onClick={() => setVisible(true)} disabled={!analyseResult || !analyseResult.success}>
            查看语法树
          </Button>
        </Col>
        <Col span={4} offset={1}>
          <Button onClick={() => setResult(null)} disabled={!analyseResult} type="dashed">
            重置
          </Button>
        </Col>
      </Row>
      <Modal visible={treeVisible} onCancel={() => setVisible(false)} title="语法分析树" footer={null} width="80%">
        <MermaidGraph graphContent={analyseResult?.graphContent || ''} />
      </Modal>
      {analyseResult ? <SyntaxResult syntaxResult={analyseResult} /> : <Empty />}
    </>
  );
};
export default memo(SyntaxAnalyseTab);
