import React, { memo, useState, useMemo } from 'react';
import { Modal, Row, Col, Button, notification, Input, Tabs, Table } from 'antd';
import { spawn } from 'child_process';
const { TextArea } = Input;
interface ModalComProps {
  visible: boolean;
  onClose: (e: React.MouseEvent<HTMLElement, MouseEvent>) => void;
}
const NFADFAMdoal: React.FC<ModalComProps> = ({ visible, onClose }) => {
  const [code, setCode] = useState(''); //(ab)*(a*|b*)a|b*(ba)*|aa*
  function analyse() {
    const python3 = spawn('python3', ['src/views/NFADFA/nfa_dfa.py', code]);
    python3.stdout.on('data', data => {
      // console.log(`stdout: ${data}`);
      notification.success({
        message: '执行成功',
      });
    });

    python3.stderr.on('data', data => {
      console.error(`stderr: ${data}`);
      notification.error({
        message: '执行出错',
      });
    });

    python3.on('close', code => {
      console.log(`子进程退出，退出码 ${code}`);
    });
  }
  return (
    <Modal
      className="NFA"
      footer={null}
      title="NFA-DFA-SDFA"
      visible={visible}
      width="50%"
      onCancel={e => {
        onClose(e);
        setCode('');
      }}>
      <Row justify="center"></Row>
      <Row justify="center">
        <Col span={10}>
          <Input
            value={code}
            onChange={e => {
              setCode(e.target.value);
            }}
            placeholder="输入待转换的正规式子"
          />
        </Col>
        <Col span={3} offset={1}>
          <Button type="primary" onClick={analyse}>
            正规式转换
          </Button>
        </Col>
      </Row>
    </Modal>
  );
};

export default memo(NFADFAMdoal);
