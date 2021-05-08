import React, { memo, useState } from 'react';
import { Button, Modal, notification, Popover, Row, Col, Empty } from 'antd';
import { TokenItem } from '../../types/compiler';
import { syntaxAnalyse_V2, SyntaxAnaluseResult } from '../../core/syntaxAnalyse';
import SyntaxTree from '../../components/SyntaxTree';
import SyntaxResult from '../../components/SyntaxResult';
interface Props {
  tokenList: TokenItem[];
}
const SyntaxAnalyseTab: React.FC<Props> = ({ tokenList }) => {
  const [analyseResult, setResult] = useState<SyntaxAnaluseResult | null>(null);
  const [treeVisible, setVisible] = useState(false);
  console.log('render stntacAnalyseTab');
  //语法分析 入口函数
  function entrance() {
    console.log(tokenList);

    const result = syntaxAnalyse_V2(tokenList); //测试
    // console.log(result);
    setResult(result);
    if (result) {
      notification.success({
        message: '分析成功',
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
          <Button onClick={() => setVisible(true)} disabled={!analyseResult}>
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
        <SyntaxTree graphContent={analyseResult?.graphContent || ''} />
      </Modal>
      {analyseResult ? <SyntaxResult syntaxResult={analyseResult} /> : <Empty />}
    </>
  );
};
export default memo(SyntaxAnalyseTab);
