import React, { useState, useMemo, memo } from 'react';
import { exec } from 'child_process';
import { Row, Col, Select, Button, notification, Empty } from 'antd';
import iconv from 'iconv-lite';
import recognizer from '../../core/lexicalAnalyse';
import { RegResults } from '../../types/compiler';
import { FileInfo } from '../../types/common';
import LexicalResult from '../../components/LexicalResult';
import { detailStdout } from './utils';
const { Option } = Select;
import './index.less';
interface Props {
  fileinfo: FileInfo;
  dispatch: Function;
}

const LexicalAnalyseTab: React.FC<Props> = ({ fileinfo, dispatch }) => {
  // 词法分析的 方式
  const [LA_method, setMethod] = useState<'manual' | 'auto'>('manual');
  // 统一的 分析结果
  const [lexicalResult, setResult] = useState<RegResults | null>(null);
  // 手动 分析
  function manualLexAnalyse() {
    const result = recognizer(fileinfo.content);
    console.log(result);
    setResult(result);
    if (result.success) {
      notification.success({
        message: '分析成功',
      });
      dispatch({
        type: 'TOKENLIST',
        payload: result.data,
      });
      // setState('success');
    } else {
      notification.error({
        message: '分析失败，存在词法错误',
      });
      // setState('error');
    }
  }
  // 调用lex  自动分析
  function autoLexAnalyse() {
    const child = exec(`.\\src\\core\\lexicalAnalyse\\lex.yy.exe ${fileinfo.path}`, {
      encoding: 'buffer',
    });
    // 监听标准输入输出事件
    child.stdout?.on('data', data => {
      const result = iconv.decode(data, 'cp936');
      console.log(result.split('\n'));

      notification.success({
        message: '分析成功',
      });
      setResult({
        data: detailStdout(result), // 处理标准输出
        success: true,
      }); // 分析并存为表格
    });

    child.stderr?.on('data', data => {
      const error = iconv.decode(data, 'cp936');
      notification.error({
        message: '分析失败，存在词法错误',
      });
      setResult({
        data: [],
        success: false,
      });
      // setState('error');
    });
  }

  // 调用词法分析入口
  function lexical_analyse() {
    switch (LA_method) {
      case 'manual': // 手动 调用函数进行分析
        manualLexAnalyse();
        break;
      case 'auto': // 调用lex 执行命令行
        console.log('auto'); // .\\src\\core\\lex.yy.exe
        autoLexAnalyse();
        break;
    }
  }
  // 重置 结果
  function resetResult() {
    setResult(null);
    dispatch({
      type: 'TOKENLIST',
      payload: [],
    });
  }
  // 文件是否已经选择
  const filechosen = useMemo(() => fileinfo.content !== '', [fileinfo]);
  return (
    <>
      <Row className="input-wapper">
        <Col span={6}>
          <Select onChange={value => setMethod(value)} value={LA_method} disabled={!filechosen}>
            <Option value="manual">手动-Js</Option>
            <Option value="auto">自动-Lex</Option>
          </Select>
        </Col>
        <Col span={3} offset={1}>
          <Button type="primary" disabled={!filechosen} onClick={lexical_analyse}>
            开始分析
          </Button>
        </Col>
        <Col span={3} offset={2}>
          <Button type="dashed" disabled={!filechosen} onClick={resetResult}>
            重置
          </Button>
        </Col>
      </Row>
      {/* token 列表 */}
      {lexicalResult ? <LexicalResult lexicalResult={lexicalResult} /> : <Empty />}
    </>
  );
};

//只要 文件内容没有改变就不需要 重新渲染
export default React.memo(
  LexicalAnalyseTab,
  (prevProps, nextProps) => prevProps.fileinfo.content === nextProps.fileinfo.content
);
