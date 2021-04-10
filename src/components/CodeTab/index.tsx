import React, { useMemo } from 'react';
import { Tabs, Button } from 'antd';
import { Controlled as CodeMirror } from 'react-codemirror2';
import { PlusOutlined } from '@ant-design/icons';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/dracula.css';
import 'codemirror/mode/javascript/javascript';
import './index.less';
import { FileInfo } from '../../types/common';
interface Props {
  fileinfo: FileInfo;
  editContent: (content: string) => void;
  openFile: () => Promise<void>;
}
const CodeTab: React.FC<Props> = ({ fileinfo, editContent, openFile }) => {
  console.log('render in codetab');

  const tabTitle = useMemo(() => fileinfo.name + fileinfo.ext, [fileinfo]);
  return (
    <>
      {fileinfo.name ? (
        <Tabs type="card" size="small" className="code-tab">
          (
          <Tabs.TabPane tab={tabTitle} closable className="">
            <CodeMirror
              value={fileinfo.content}
              options={{
                mode: 'javascript',
                theme: 'dracula',
                lineNumbers: true,
              }}
              onBeforeChange={(editor, data, value) => editContent(value)}
            />
          </Tabs.TabPane>
          )
        </Tabs>
      ) : (
        <section className="default">
          <Button type="primary" onClick={openFile} icon={<PlusOutlined />}>
            打开文件
          </Button>
        </section>
      )}
    </>
  );
};

//只要 文件内容没有改变就不需要 重新渲染
export default React.memo(
  CodeTab,
  (prevProps, nextProps) =>
    prevProps.fileinfo.content === nextProps.fileinfo.content
);
