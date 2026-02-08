import type { Chapter } from '../types';

export const CHAPTERS: Chapter[] = [
  {
    id: '1-1',
    title: 'スラッシュコマンド',
    phase: 1,
    genre: 'slash-command',
  },
  {
    id: '1-2',
    title: 'ショートカット',
    phase: 1,
    genre: 'shortcut',
  },
  {
    id: '1-3',
    title: 'ツール',
    phase: 1,
    genre: 'tool',
  },
  {
    id: '2-1',
    title: 'MCP サーバー',
    phase: 2,
    genre: 'mcp',
  },
  {
    id: '2-2',
    title: 'Hooks',
    phase: 2,
    genre: 'hooks',
  },
  {
    id: '2-3',
    title: 'メモリ管理',
    phase: 2,
    genre: 'memory',
  },
  {
    id: '3-1',
    title: 'プラグイン開発',
    phase: 3,
    genre: 'plugin',
  },
  {
    id: '3-2',
    title: 'カスタム設定',
    phase: 3,
    genre: 'settings',
  },
  {
    id: '3-3',
    title: 'Agent SDK',
    phase: 3,
    genre: 'agent-sdk',
  },
  {
    id: 'all',
    title: '全 Chapter',
    phase: 0,
    genre: null,
  },
];

export const getChapterById = (id: string): Chapter | undefined =>
  CHAPTERS.find((c) => c.id === id);
