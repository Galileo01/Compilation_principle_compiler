import React, { useState, memo } from 'react';
import { Button, notification, Row, Col, Empty, Table, Radio } from 'antd';
import { useGetMaxHeight } from '../../views/Home/useHooks';
import { SyntaxTreeNode, SymbolTableUtil } from '../../types/compiler';
import { ExtendTreeNode } from '../../core/semanticAnalyse';
import { TranslateResult, translateTransitionalCode } from '../../core/transitionalCode';
import { generateMainCode } from '../../core/transitionalCode/generate_target';
interface Props {
  syntaxTree: SyntaxTreeNode | null;
  symbolTableUtil: SymbolTableUtil | null;
  dispatch: Function;
}

const columns = [
  {
    title: '编号',
    dataIndex: 'index',
    key: 'index',
  },
  {
    title: '值',
    dataIndex: 'value',
    key: 'value',
  },
  {
    title: '作用域',
    dataIndex: 'scope',
    key: 'scope',
  },
];
const SematicAnalyseTab: React.FC<Props> = ({ syntaxTree, dispatch, symbolTableUtil }) => {
  const maxHeight = useGetMaxHeight('.analyse-result', 140);
  const [analyseResult, setResult] = useState<TranslateResult | null>(null);
  const [currType, setType] = useState('transitional');
  const [targetCode, setCode] = useState<{
    codeStr: string;
    codes: string[];
  }>({
    codeStr: '',
    codes: [],
  });
  //翻译 中间代码 入口函数
  function entrance() {
    console.log(analyseResult);
    if (currType === 'transitional') {
      if (!symbolTableUtil) return;
      const result = translateTransitionalCode(syntaxTree as ExtendTreeNode, symbolTableUtil); //测试
      // console.log(result);
      setResult(result);
    } else {
      if (!analyseResult) {
        notification.error({
          message: '请先进行中间代码的翻译',
        });
        return;
      }
      const result = generateMainCode(analyseResult.formulaTable, analyseResult.symbolTableUtil); //解决换行
      // console.log(result);
      setCode(result);
    }
  }
  const TransitionalCode = (
    <Table
      dataSource={analyseResult?.formulaTable.map((item, index) => ({
        scope: item.scope,
        value: `[ ${item.value.join(' , ')} ]`,
        index: index + 1,
        key: 'fi' + index,
      }))}
      columns={columns}
      rowKey="key"
      size="small"
      scroll={{ y: maxHeight }}
      pagination={{
        pageSize: 30,
      }}
    />
  );
  const TargetCode = (
    <div className="taget-code">
      {targetCode.codes.map((item, index) => (
        <p key={index}>{item}</p>
      ))}
    </div>
  );

  return (
    <>
      <Row>
        <Col span={3}>
          <Button type="primary" disabled={syntaxTree === null} onClick={entrance}>
            翻译{currType === 'transitional' ? '四元式列表' : '目标汇编代码'}
          </Button>
        </Col>
        <Col span={2} offset={3}>
          <Button onClick={() => setResult(null)} disabled={!analyseResult} type="dashed">
            重置
          </Button>
        </Col>
        <Col span={5}>
          <Radio.Group defaultValue="transitional" disabled={!analyseResult}>
            <Radio.Button
              value="transitional"
              onClick={() => {
                setType('transitional');
              }}>
              中间代码
            </Radio.Button>
            <Radio.Button
              value="target"
              onClick={() => {
                setType('target');
              }}>
              目标代码
            </Radio.Button>
          </Radio.Group>
        </Col>
        <Col span={5}>
          <Button
            className="copy-btn"
            disabled={targetCode.codeStr.length === 0}
            onClick={() => {
              //点击向系统剪贴板 复制内容

              navigator.clipboard
                .writeText(targetCode.codeStr)
                .then(res => {
                  notification.success({
                    message: '复制成功',
                  });
                })
                .catch(err => {
                  notification.error({
                    message: '复制失败',
                  });
                  console.log(err);
                });
            }}>
            复制目标代码
          </Button>
        </Col>
      </Row>
      <section className="content">
        <div className="formula-list analyse-result">
          {analyseResult?.formulaTable ? (
            <>
              <h4
                style={{
                  textAlign: 'center',
                  marginTop: '5px',
                }}>
                {currType === 'transitional' ? '四元式列表' : '目标汇编代码'}
              </h4>
              {currType === 'transitional' ? TransitionalCode : TargetCode}
            </>
          ) : (
            <Empty />
          )}
        </div>
        <div className="target-code"></div>
      </section>
    </>
  );
};

export default memo(SematicAnalyseTab);
