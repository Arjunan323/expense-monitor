import * as SecureStore from 'expo-secure-store';

export class RNEventSource {
  private url: string;
  private aborted = false;
  private controller: AbortController | null = null;
  private listeners: { [evt: string]: ((data: any)=>void)[] } = {};

  constructor(url: string) { this.url = url; }

  on(event: string, cb: (data:any)=>void) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(cb);
  }

  off(event: string, cb: (data:any)=>void) {
    this.listeners[event] = (this.listeners[event]||[]).filter(f => f!==cb);
  }

  close() { this.aborted = true; if (this.controller) this.controller.abort(); }

  async connect() {
    const token = await SecureStore.getItemAsync('token');
    this.controller = new AbortController();
    try {
      const res = await fetch(this.url, {
        method: 'GET',
        headers: { 'Accept': 'text/event-stream', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        signal: this.controller.signal,
      });
      if (!res.ok || !res.body) {
        this.emit('error', { status: res.status });
        return;
      }
      // React Native fetch body is a ReadableStream in modern runtimes; using experimental getReader
      const reader: any = (res.body as any).getReader ? (res.body as any).getReader() : null;
      if (!reader) {
        // Fallback: no streaming support
        this.emit('error', { message: 'Streaming not supported' });
        return;
      }
      const decoder = new TextDecoder('utf-8');
      let buf = '';
      while(!this.aborted) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let idx;
        while((idx = buf.indexOf('\n\n')) >= 0) {
          const raw = buf.slice(0, idx).trim();
          buf = buf.slice(idx+2);
          if (!raw) continue;
          let event = 'message';
          let dataLines: string[] = [];
          raw.split(/\n/).forEach(line => {
            if (line.startsWith('event:')) event = line.slice(6).trim();
            else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
          });
          const dataStr = dataLines.join('\n');
          try { this.emit(event, JSON.parse(dataStr)); } catch { this.emit(event, dataStr); }
        }
      }
      this.emit('close', {});
    } catch (e) {
      if (!this.aborted) this.emit('error', e);
    }
  }

  private emit(event: string, data: any) {
    (this.listeners[event]||[]).forEach(cb => { try { cb(data); } catch {} });
  }
}

export const streamStatementJob = (baseUrl: string, jobId: string) => {
  return new RNEventSource(`${baseUrl}/statement-jobs/${jobId}/stream`);
};
