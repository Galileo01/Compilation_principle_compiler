import React, { useState, memo } from 'react';
import { Button, notification, Row, Col, Empty, Table, Radio } from 'antd';
import { useGetMaxHeight } from '../../views/Home/useHooks';
import { SyntaxTreeNode, SymbolTableUtil } from '../../types/compiler';
import { ExtendTreeNode } from '../../core/semanticAnalyse';
import { TranslateResult, translateTransitionalCode } from '../../core/transitionalCode';
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
  //翻译 中间代码 入口函数
  function entrance() {
    console.log(analyseResult);

    if (!symbolTableUtil) return;
    const result = translateTransitionalCode(syntaxTree as ExtendTreeNode, symbolTableUtil); //测试
    // console.log(result);
    setResult(result);
    // dispatch({
    //   type: 'SYMBOLTABLEUTIL',
    //   payload: result.symbolTableUtil,
    // });
  }
  return (
    <>
      <Row>
        <Col span={7}>
          <Button type="primary" disabled={syntaxTree === null} onClick={entrance}>
            翻译生成中间/目标代码
          </Button>
        </Col>
        <Col span={4} offset={2}>
          <Button onClick={() => setResult(null)} disabled={!analyseResult} type="dashed">
            重置
          </Button>
        </Col>
        <Col span={10}>
          <Radio.Group
            onChange={value => {
              console.log(value);
            }}
            defaultValue="transitional"
            disabled={!analyseResult}>
            <Radio.Button value="transitional">中间代码</Radio.Button>
            <Radio.Button value="target">目标代码</Radio.Button>
          </Radio.Group>
        </Col>
      </Row>
      <section className="content">
        <div className="formula-list">
          {analyseResult?.formulaTable ? (
            <>
              <h4
                style={{
                  textAlign: 'center',
                  marginTop: '5px',
                }}>
                {currType === 'transitional' ? '四元式列表' : '目标汇编代码'}
              </h4>
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
            </>
          ) : (
            <Empty />
          )}
        </div>
      </section>
    </>
  );
};

export default memo(SematicAnalyseTab);
