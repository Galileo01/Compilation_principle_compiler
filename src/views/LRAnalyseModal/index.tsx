import React, { memo, useState, useMemo } from 'react';
import { Modal, Row, Col, Button, notification, Input, Empty, Spin, Table } from 'antd';
import { spawn } from 'child_process';
import generateSponsorList from './utils';
import './index.less';
const { TextArea } = Input;
interface ModalComProps {
  visible: boolean;
  onClose: (e: React.MouseEvent<HTMLElement, MouseEvent>) => void;
}
const LRAnalyseModal: React.FC<ModalComProps> = ({ visible, onClose }) => {
  const [code, setCode] = useState('if ( id < num_const ) \n{ int id ;\n id = num_const ;\n } #');
  const [sponsorStr, setStr] = useState('');
  const [spinning, setSpinning] = useState(false);
  const [table, setTable] = useState<string[][]>([]);
  function analyse() {
    setSpinning(true);
    const python3 = spawn('python3', ['src/views/LRAnalyseModal/LR/treeDraw.py', 'code']);
    python3.stdout.on('data', data => {
      const str = `${data}`;
      const { table } = generateSponsorList(str);
      setTable(table);
      setStr(data);
      setSpinning(false);
      notification.success({
        message: '分析成功',
      });
    });

    python3.stderr.on('data', data => {
      console.error(`stderr: ${data}`);
      notification.error({
        message: '分析出错',
      });
    });

    python3.on('close', code => {
      console.log(`子进程退出，退出码 ${code}`);
    });
  }
  return (
    <Modal
      className="lr-analyse"
      footer={null}
      title="LR分析法"
      visible={visible}
      width="80%"
      onCancel={e => {
        onClose(e);
        setCode('if ( id < num_const ) \n{ int id ;\n id = num_const ;\n } #');
        setStr('');
      }}>
      <Spin spinning={spinning}>
        {' '}
        <Row justify="center">
          <Col span={10}>
            <h4>输入待分析的程序代码:</h4>
            <TextArea
              value={code}
              autoSize
              onChange={e => {
                setCode(e.target.value);
              }}
            />
            <Row
              justify="center"
              style={{
                marginTop: '20px',
              }}>
              <Col span={3}>
                <Button type="primary" onClick={analyse}>
                  分析
                </Button>
              </Col>
            </Row>
          </Col>
          <Col span={10} offset={1}>
            <h4>规约使用的产生式子:</h4>
            {sponsorStr.length > 0 ? (
              <Table
                dataSource={table.map((item, index) => [index, ...item])}
                columns={[
                  {
                    title: '编号',
                    dataIndex: 0,
                    key: 0,
                  },
                  {
                    title: '左侧',
                    dataIndex: 1,
                    key: 1,
                  },
                  {
                    title: ' ',
                    dataIndex: 2,
                    key: 2,
                  },
                  {
                    title: '右侧',
                    dataIndex: 3,
                    key: 3,
                  },
                ]}
              />
            ) : (
              <Empty />
            )}
          </Col>
        </Row>
      </Spin>
    </Modal>
  );
};

export default memo(LRAnalyseModal);
