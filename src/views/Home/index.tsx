import React, { useState, useMemo } from 'react';
import fs from 'fs';
import path from 'path';
import { remote } from 'electron';
import { Button, Row, Col, Menu, Tabs } from 'antd';
import { FileInfo, LAStateType } from '../../types/common';
import CodeTab from '../../components/CodeTab';
import LexicalAnalyseTab from '../LexicalAnalyseTab';
import SyntaxAnalyseTab from '../SyntaxAnalyseTab';
import './index.less';
const { dialog } = remote;

export default function Index() {
  console.log('render');
  // 文件信息
  const [fileTab, setTabInfo] = useState<FileInfo>({
    name: '',
    ext: '',
    path: '',
    content: '',
  });
  // 文件是否已经选择
  const filechosen = useMemo(() => fileTab.name !== '', [fileTab]);
  // 分析状态
  const [analyseState, setState] = useState<LAStateType>('unload');
  // 添加 tab
  async function openFile() {
    try {
      const { filePaths } = await dialog.showOpenDialog({
        title: '请选择文件',
      });
      // 解析并读取
      const { ext, name } = path.parse(filePaths[0]);
      const data = fs.readFileSync(filePaths[0], 'utf8').trim();
      // console.log(data);
      // 设置 tab 信息
      setTabInfo({
        name,
        ext,
        content: data,
        path: filePaths[0],
      });
    } catch (err) {}
  }

  // 保存到文件
  function saveFile() {
    dialog
      .showSaveDialog({
        title: '选择保存的路径',
      })
      .then(({ canceled, filePath }) => {
        console.log(canceled, filePath);
      });
  }
  // 菜单点击
  function menuClick(key: React.Key) {
    console.log(key);
    switch (key) {
      // 打开文件
      case 'open':
        openFile();
        break;
      // 结果保存到文件
      case 'save':
        saveFile();
        break;
      case 'reset':
        setTabInfo({
          name: '',
          ext: '',
          path: '',
          content: '',
        });
        break;
    }
  }

  // 编辑内容
  function editContent(content: string) {
    setTabInfo({
      ...fileTab,
      content,
    });
  }

  return (
    <div id="index">
      <Row className="topBtns" align="middle">
        <Menu mode="horizontal" onClick={e => menuClick(e.key)}>
          <Menu.SubMenu title="File">
            <Menu.Item key="open">{fileTab.name ? '重新' : ''}打开文件</Menu.Item>
            <Menu.Item key="save">保存</Menu.Item>
            <Menu.Item key="reset">重置所有</Menu.Item>
          </Menu.SubMenu>
          <Menu.SubMenu title="Btn1">
            {/* <Menu.Item key="lexical_analyse">词法分析</Menu.Item>
            <Menu.Item key="syntax_analyse">语法</Menu.Item> */}
          </Menu.SubMenu>
          <Menu.SubMenu title="Btn2" />
        </Menu>
      </Row>
      <main className="content">
        <Row>
          <Col span={12} className="code">
            {/* 代码预览 */}
            <CodeTab fileinfo={fileTab} editContent={editContent} openFile={openFile} />
          </Col>
          <Col span={12} className="analyse">
            <Tabs type="card" size="small">
              <Tabs.TabPane tab="词法分析" key="lexical">
                {/* 词法分析 tab*/}
                <LexicalAnalyseTab fileinfo={fileTab} />
              </Tabs.TabPane>
              <Tabs.TabPane tab="语法分析" key="syntax">
                <SyntaxAnalyseTab />
              </Tabs.TabPane>
              <Tabs.TabPane tab="语义分析" key="semantic">
                语义
              </Tabs.TabPane>
            </Tabs>
          </Col>
        </Row>
      </main>
    </div>
  );
}
