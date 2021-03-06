import React, { memo } from 'react';
import { TokenItem, RegResults } from '../../types/compiler';
import { Table, Alert } from 'antd';
import { useGetMaxHeight } from '../../views/Home/useHooks';
import './index.less';
interface props {
  lexicalResult: RegResults;
}
const columns = [
  {
    title: '单词',
    dataIndex: 'word',
    key: 'word',
  },
  {
    title: '种别码',
    dataIndex: 'typeCode',
    key: 'typeCode',
  },
  {
    title: '行数',
    dataIndex: 'row',
    key: 'row',
  },
  {
    title: '列数',
    dataIndex: 'col',
    key: 'col',
  },
];
const LexicalResult: React.FC<props> = ({ lexicalResult }) => {
  console.log('render in  lexicalResult token-table');

  const maxHeight = useGetMaxHeight('.analyse-result', 140);
  return (
    <section className="analyse-result">
      {lexicalResult.success === true ? (
        <section className="token_list">
          <h4>Token 串</h4>
          <Table
            dataSource={lexicalResult.data.map((item, index) => ({
              ...item,
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
          {lexicalResult.data.map((item, index) => (
            <Alert message="词法错误-LexicalError" type="error" description={item.msg} showIcon key={'err' + index} />
          ))}
        </section>
      )}
    </section>
  );
};

export default memo(LexicalResult);
