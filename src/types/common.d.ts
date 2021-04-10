export interface FileInfo {
  name: string;
  ext: string;
  path: string;
  content: string;
}
//词法分析 的状态
export type LAStateType = 'unload' | 'unanalyse' | 'success' | 'error';