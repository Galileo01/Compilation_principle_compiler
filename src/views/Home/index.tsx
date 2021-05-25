import React, { useState, useMemo, useReducer, useEffect } from 'react';
import fs from 'fs';
import path from 'path';
import { remote } from 'electron';
import { Button, Row, Col, Menu, Tabs } from 'antd';
import { FileInfo, LAStateType } from '../../types/common';
import { TokenItem, SyntaxTreeNode, TerminalPosition, SymbolTableUtil } from '../../types/compiler';
import CodeTab from '../../components/CodeTab';
import LexicalAnalyseTab from '../LexicalAnalyseTab';
import SyntaxAnalyseTab from '../SyntaxAnalyseTab';
import SemanticAnalyseTab from '../SemanticAnalyseTab';
import TranslateTransitionalTab from '../TranslateTransitionalTab';
//扩展 算法 tab
import OpratorPriorityModal from '../OpratorPriorityModal';
import DAGOptimizeModal from '../DAGOptimizeModal';
import LRAnalyseModal from '../LRAnalyseModal';
import NFADFA from '../NFADFA';
import './index.less';
const { dialog } = remote;
interface StateType {
  tokenList: TokenItem[]; //词法分析 token串
  syntaxTree: SyntaxTreeNode | null; //语法分析 结构 语法树
  terminalPositionList: TerminalPosition[]; //语法分析 终结符 位置信息
  symbolTableUtil: SymbolTableUtil | null;
}
interface ActionType {
  type: 'TOKENLIST' | 'SYNTAXTREE' | 'SYMBOLTABLEUTIL' | 'POSITIONLIST';
  payload: any;
}
const initialState: StateType | any = {
  tokenList: [],
  syntaxTree: null,
  terminalPositionList: [],
  symbolTableUtil: null,
};
//reducer 纯函数
function reducer(pre: StateType, action: ActionType): StateType {
  console.log(action);
  switch (action.type) {
    case 'TOKENLIST':
      return {
        ...pre,
        tokenList: action.payload,
      };
    case 'SYNTAXTREE':
      return {
        ...pre,
        syntaxTree: action.payload,
      };
    case 'POSITIONLIST':
      return {
        ...pre,
        terminalPositionList: action.payload,
      };
    case 'SYMBOLTABLEUTIL':
      return {
        ...pre,
        symbolTableUtil: action.payload,
      };
  }
}

export default function Index() {
  console.log('render');
  // 文件信息
  const [fileTab, setTabInfo] = useState<FileInfo>({
    name: '',
    ext: '',
    path: '',
    content: '',
  });

  const [state, dispatch] = useReducer(reducer, initialState);
  //扩展 算法modal

  const [isOPMVisible, setOPMVisible] = useState(false);
  const [isDAGMVisible, setDAGMVisible] = useState(false);
  const [isLRMVisible, setLRMVisible] = useState(false);
  const [isNDMVisibe, setDNMVisible] = useState(false);

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
      //扩展算法
      case 'NFA':
        setDNMVisible(true);
        break;
      case 'oprator_priority':
        setOPMVisible(true);
        break;
      case 'DAG':
        setDAGMVisible(true);
        break;
      case 'LR':
        setLRMVisible(true);
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
          <Menu.SubMenu title="扩展算法">
            <Menu.Item key="NFA">NFA相关算法</Menu.Item>
            <Menu.Item key="oprator_priority">算符优先分析法</Menu.Item>
            <Menu.Item key="LR">LR分析</Menu.Item>
            <Menu.Item key="DAG">DAG优化基本块</Menu.Item>
          </Menu.SubMenu>
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
                <LexicalAnalyseTab fileinfo={fileTab} dispatch={dispatch} />
              </Tabs.TabPane>
              <Tabs.TabPane tab="语法分析" key="syntax">
                <SyntaxAnalyseTab tokenList={state.tokenList} dispatch={dispatch} />
              </Tabs.TabPane>
              <Tabs.TabPane tab="语义分析" key="semantic">
                <SemanticAnalyseTab
                  syntaxTree={state.syntaxTree}
                  terminalPositionList={state.terminalPositionList}
                  dispatch={dispatch}
                />
              </Tabs.TabPane>
              <Tabs.TabPane tab="中间/目标代码" key="transitional">
                <TranslateTransitionalTab
                  dispatch={dispatch}
                  syntaxTree={state.syntaxTree}
                  symbolTableUtil={state.symbolTableUtil}
                />
              </Tabs.TabPane>
            </Tabs>
          </Col>
        </Row>
      </main>
      {/* 扩展 算法的 对话框 */}
      <OpratorPriorityModal
        visible={isOPMVisible}
        onClose={() => {
          setOPMVisible(false);
        }}
      />
      <DAGOptimizeModal
        visible={isDAGMVisible}
        onClose={() => {
          setDAGMVisible(false);
        }}
      />
      <LRAnalyseModal
        visible={isLRMVisible}
        onClose={() => {
          setLRMVisible(false);
        }}
      />
      <NFADFA
        visible={isNDMVisibe}
        onClose={() => {
          setDNMVisible(false);
        }}
      />
    </div>
  );
}
