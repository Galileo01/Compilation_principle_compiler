import React, { memo, useState } from 'react';
import { Button, Modal, notification } from 'antd';
import { TokenItem } from '../../types/compiler';
import { predictAnalyse, analyseResult } from '../../core/syntaxAnalyse';
import SyntaxTree from '../../components/SyntaxTree';
interface Props {
  tokenList?: TokenItem[];
}
const SyntaxAnalyseTab: React.FC<Props> = ({ tokenList = [] }) => {
  const [analyseResult, setResult] = useState<analyseResult>({ success: false, sponserOrder: [] });
  const [treeVisible, setVisible] = useState(false);
  console.log('render stntacAnalyseTab');
  //语法分析 入口函数
  function entrance() {
    const result = predictAnalyse('i+i*i#'); //测试
    // console.log(result);
    setResult(result);
    if (result.success) {
      notification.success({
        message: '分析成功',
      });
    } else {
      notification.error({
        message: '分析失败',
      });
    }
  }

  return (
    <>
      <Button onClick={entrance}>语法分析</Button>
      <Button onClick={() => setVisible(true)} disabled={!analyseResult.success}>
        查看语法树
      </Button>

      <Modal visible={treeVisible} onCancel={() => setVisible(false)} title="语法分析树" footer={null}>
        <SyntaxTree analyseSponser={analyseResult.sponserOrder} />
      </Modal>
    </>
  );
};
export default memo(SyntaxAnalyseTab);
