import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// realtime-js 2.95.3 が new Transport(url) で呼ぶが、WebSocketFactory 経由だと
// new WS(url, undefined) になりブラウザが Sec-WebSocket-Protocol: undefined を送信して切断される。
// ref: https://github.com/supabase/supabase-js/issues/1473
class SafeWebSocket extends WebSocket {
  constructor(url: string | URL) {
    super(url);
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    transport: SafeWebSocket,
    logger: (kind: string, msg: string, data?: unknown) => {
      console.log(`[Supabase RT] ${kind}: ${msg}`, data ?? '');
    },
  },
});
