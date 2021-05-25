import React, { memo, useState, useMemo } from 'react';
import { Modal, Row, Col, Button, notification, Input, Tabs, Table } from 'antd';
import { defaultG } from '../../core/operator_priority/utils';
import OPAEntrance from '../../core/operator_priority';
const { TextArea } = Input;
interface ModalComProps {
  visible: boolean;
  onClose: (e: React.MouseEvent<HTMLElement, MouseEvent>) => void;
}

const OpratorPriorityModal: React.FC<ModalComProps> = ({ visible, onClose }) => {
  //文法内容
  const [grammerContent, setGrammer] = useState(defaultG);
  //分析 串
  const [charStr, setStr] = useState('i + ( i * i )');
  const [analyseSteps, setSteps] = useState<string[]>([]);
  const [priorityTable, setTable] = useState<string[][]>([]);
  const [terminalList, setList] = useState<string[]>([]);
  function analyse() {
    const result = OPAEntrance(charStr, grammerContent);
    setTable(result.priorityTable);
    setSteps(result.stpes);
    setList(result.T);
    notification.success({
      message: '分析成功',
    });
  }
  function reset() {
    setGrammer(defaultG);
    setList([]);
    setSteps([]);
    setStr('i + ( i * i )');
    setTable([]);
  }
  const priorityTableColumns = useMemo(() => {
    if (terminalList.length === 0) return [];
    const columns = [
      {
        title: '终结符',
        dataIndex: 0,
        key: 0,
      },
    ];
    terminalList.forEach((item, index) => {
      columns.push({
        title: item,
        dataIndex: index + 1,
        key: index + 1,
      });
    });
    return columns;
  }, [terminalList]);

  //处理 优先分析表 用于表格展示
  //数组 首部天际 终结符
  const dataSource = useMemo(() => priorityTable.map((item, index) => [terminalList[index], ...item]), [priorityTable]);
  return (
    <Modal
      className="oprator-priority-modal"
      visible={visible}
      onCancel={e => {
        onClose(e);
        reset();
      }}
      width={'100%'}
      footer={null}
      title="算法优先分析方法">
      <Row>
        <Col span={10}>
          <h4>算符文法:</h4>
          <TextArea
            value={grammerContent}
            autoSize
            onChange={e => {
              setGrammer(e.target.value);
            }}
          />
          <h4>待分析串(空格分隔):</h4>
          <Row>
            <Col span={20}>
              <Input
                placeholder="请输入待分析串"
                value={charStr}
                onChange={e => {
                  setStr(e.target.value);
                }}
              />
            </Col>
            <Col span={3}>
              <Button type="primary" onClick={analyse}>
                分析
              </Button>
            </Col>
          </Row>
        </Col>
        <Col span={10} offset={2}>
          <Tabs defaultActiveKey="table">
            <Tabs.TabPane key="table" tab="算符优先表">
              <Table dataSource={dataSource} rowKey="key" columns={priorityTableColumns} />
            </Tabs.TabPane>
            <Tabs.TabPane key="steps" tab="规约步骤">
              <Table
                dataSource={analyseSteps.map((item, index) => ({ key: index, sponsor: item }))}
                rowKey="key"
                columns={[
                  {
                    title: '编号',
                    dataIndex: 'key',
                    key: 'key',
                  },
                  {
                    title: '规约产生式',
                    dataIndex: 'sponsor',
                  },
                ]}
              />
            </Tabs.TabPane>
          </Tabs>
        </Col>
      </Row>
    </Modal>
  );
};

export default memo(OpratorPriorityModal);
