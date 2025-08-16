// Minimal event bus for React Native (avoids Node 'events' dependency)
// Provides on/off/emit with typed events
export type EventHandler<T = any> = (payload: T) => void;

class SimpleEventBus {
  private listeners: Map<string, Set<EventHandler>> = new Map();

  on<T = any>(event: string, handler: EventHandler<T>): void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(handler as EventHandler);
  }

  off<T = any>(event: string, handler: EventHandler<T>): void {
    this.listeners.get(event)?.delete(handler as EventHandler);
    if (this.listeners.get(event)?.size === 0) this.listeners.delete(event);
  }

  emit<T = any>(event: string, payload: T): void {
    const handlers = this.listeners.get(event);
    if (!handlers) return;
    // Copy to array to avoid mutation issues if a handler unsubscribes during emit
    [...handlers].forEach(h => {
      try { h(payload); } catch (e) { /* swallow to avoid breaking others */ }
    });
  }

  once<T = any>(event: string, handler: EventHandler<T>): void {
    const wrap: EventHandler<T> = (p) => { this.off(event, wrap); handler(p); };
    this.on(event, wrap);
  }
}

export const authEvents = new SimpleEventBus();
export default SimpleEventBus;
