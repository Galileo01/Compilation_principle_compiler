import React, { memo, useState, useMemo } from 'react';
import { Modal, Row, Col, Button, notification, Input, Empty } from 'antd';
import DAGOptimize from '../../core/DAG_optimize';
import MermaidGraph from '../../components/MermaidGraph';
import { generateMermain } from './utils';
const { TextArea } = Input;
interface ModalComProps {
  visible: boolean;
  onClose: (e: React.MouseEvent<HTMLElement, MouseEvent>) => void;
}
const defalutStatement = `T0 = 3.14;
T1 = 2 * T0;
T2 = R + r;
A = T1 * T2;
B = A;
T3 = 2 * T0;
T4 = R + r;
T5 = T3 * T4;
T6 = R - r;
B = T5 * T6;`;
const DAGOptimizeModal: React.FC<ModalComProps> = ({ visible, onClose }) => {
  //基本块
  const [statements, setStatements] = useState(defalutStatement);
  const [optimized, setOptimized] = useState('');
  const [nodeGraph, setGraph] = useState('');
  const [spinning, setSpinning] = useState(false);
  function optimize() {
    const statementList = statements
      .split(';') //;分号 分隔
      .map(item => item.trim()) //首位 无效字符
      .filter(item => item); //过滤无效
    console.log(statementList);

    const { DAGNodeList, optimized } = DAGOptimize(statementList);
    const dealed = optimized.join(';\n');
    setOptimized(dealed);
    setGraph(generateMermain(DAGNodeList));
    notification.success({
      message: '优化成功',
    });
  }
  function reset() {
    setStatements(defalutStatement);
    setOptimized('');
    setGraph('');
  }
  return (
    <Modal
      className="dag-optimize-modal"
      visible={visible}
      onCancel={e => {
        onClose(e);
        reset();
      }}
      width={'100%'}
      footer={null}
      title="DAG优化基本块">
      <Row>
        <Col span={10}>
          <h4>待优化的基本语句块:</h4>
          <TextArea
            value={statements}
            autoSize
            onChange={e => {
              setStatements(e.target.value);
            }}
          />
          <Button
            type="primary"
            onClick={optimize}
            style={{
              marginTop: '10px',
            }}>
            优化
          </Button>
        </Col>
        <Col span={10} offset={2}>
          <section className="DAG-graph">
            <h4>DAG图:</h4>
            {nodeGraph.length > 0 ? <MermaidGraph graphContent={nodeGraph} /> : <Empty />}
          </section>
          <section className="optimized">
            <h4>优化后的基本语句块:</h4>
            {optimized.length > 0 ? (
              <TextArea
                value={optimized}
                autoSize
                onChange={e => {
                  setStatements(e.target.value);
                }}
              />
            ) : (
              <Empty />
            )}
          </section>
        </Col>
      </Row>
    </Modal>
  );
};

export default memo(DAGOptimizeModal);
