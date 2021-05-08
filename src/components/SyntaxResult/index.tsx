import React, { memo } from 'react';
import { Table, Alert } from 'antd';
import { useGetMaxHeight } from '../../views/Home/useHooks';
import { SyntaxAnaluseResult } from '../../core/syntaxAnalyse/index';
interface props {
  syntaxResult: SyntaxAnaluseResult;
}
const columns = [
  {
    title: '编号',
    dataIndex: 'index',
    key: 'index',
  },
  {
    title: '产生式',
    dataIndex: 'content',
    key: 'content',
  },
];
const SyntaxResult: React.FC<props> = ({ syntaxResult }) => {
  console.log('render in token-table');

  const maxHeight = useGetMaxHeight('.analyse-result', 100);
  return (
    <section className="analyse-result">
      {syntaxResult.success === true ? (
        <section className="token_list">
          <Table
            dataSource={syntaxResult.sponserOrder.map((item, index) => ({
              index,
              content: item,
              key: 'item' + index,
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
          {syntaxResult.errList.map((item, index) => (
            <Alert message="语法错误-SyntaxError" type="error" description={item.msg} showIcon key={'err' + index} />
          ))}
        </section>
      )}
    </section>
  );
};

export default memo(SyntaxResult);
