import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// realtime-js 2.95.3 が new WS(url, undefined) を呼び、一部ブラウザが
// Sec-WebSocket-Protocol: undefined を送信して接続失敗する問題の回避策。
// undefined / 空文字 / 空配列 のときだけ protocols を省略し、有効な値はそのまま渡す。
// ref: https://github.com/supabase/supabase-js/issues/1473
class SafeWebSocket extends WebSocket {
  constructor(url: string | URL, protocols?: string | string[]) {
    const isEmptyArray = Array.isArray(protocols) && protocols.length === 0;
    const isEmptyString = typeof protocols === 'string' && protocols.length === 0;
    if (protocols == null || isEmptyArray || isEmptyString) {
      super(url);
    } else {
      super(url, protocols);
    }
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    transport: SafeWebSocket,
    logger: (kind: string, msg: string, data?: unknown) => {
      if (import.meta.env.DEV) {
        console.log(`[Supabase RT] ${kind}: ${msg}`, data ?? '');
      }
    },
  },
});
