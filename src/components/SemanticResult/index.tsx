import React, { memo, useMemo } from 'react';
import { Table, Alert } from 'antd';
import { useGetMaxHeight } from '../../views/Home/useHooks';
import { SemanticAnaluseResult, SemanticError } from '../../core/semanticAnalyse';
interface props {
  semanticResult: SemanticAnaluseResult;
}
const columns = [
  {
    title: '编号',
    dataIndex: 'index',
    key: 'index',
  },
  {
    title: '行号',
    dataIndex: 'row',
    key: 'row',
  },
  {
    title: '列号',
    dataIndex: 'col',
    key: 'col',
  },
  {
    title: '符号名称',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: '符号类型',
    dataIndex: 'symbolType',
    key: 'symbolType',
  },
  {
    title: '值类型',
    dataIndex: 'valueType',
    key: 'valueType',
  },
];
const SyntaxResult: React.FC<props> = ({ semanticResult }) => {
  console.log('render in semanticResult token-table');
  const maxHeight = useGetMaxHeight('.analyse-result', 140);
  function computeMessage({ terminalInfo, type }: SemanticError): string {
    const { row, col, name } = terminalInfo;
    return `错误类型：${type},${row + 1}行,${col + 1}列,符号:${name}`;
  }
  const dataSource = [];
  //生成表哥 数据源头
  for (const [key, value] of Object.entries(semanticResult.symbolTableUtil.table)) {
    dataSource.push(...value);
  }
  return (
    <section className="analyse-result">
      {semanticResult.semanticErrorList.length === 0 ? (
        <section className="symbol-list">
          <h4
            style={{
              textAlign: 'center',
            }}>
            符号表
          </h4>
          <Table
            dataSource={dataSource.map((item, index) => ({
              index,
              ...item,
              key: 'symbol-item' + index,
            }))}
            columns={columns}
            rowKey="key"
            size="small"
            scroll={{ y: maxHeight }}
            pagination={{
              pageSize: 30,
            }}
          />
        </section>
      ) : (
        <section className="err_info">
          {semanticResult.semanticErrorList.map((item, index) => (
            <Alert message={computeMessage(item)} type="error" description={item.msg} showIcon key={'err' + index} />
          ))}
        </section>
      )}
    </section>
  );
};

export default memo(SyntaxResult);
