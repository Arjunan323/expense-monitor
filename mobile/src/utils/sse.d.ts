export class RNEventSource {
  constructor(url: string);
  on(event: string, cb: (data:any)=>void): void;
  off(event: string, cb: (data:any)=>void): void;
  close(): void;
  connect(): Promise<void>;
}
export const streamStatementJob: (baseUrl: string, jobId: string) => RNEventSource;
