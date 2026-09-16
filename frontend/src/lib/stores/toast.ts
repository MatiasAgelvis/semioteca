import { writable } from 'svelte/store';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  text: string;
  type: ToastType;
}

export const toasts = writable<ToastMessage[]>([]);

let nextToastId = 1;
const dismissTimers = new Map<number, ReturnType<typeof setTimeout>>();

export function showToast(text: string, type: ToastType = 'info', duration = 1800) {
  const id = nextToastId++;
  toasts.update((list) => [...list, { id, text, type }]);

  if (duration > 0) {
    dismissTimers.set(
      id,
      setTimeout(() => {
        dismissToast(id);
      }, duration),
    );
  }
}

export function dismissToast(id: number) {
  const timer = dismissTimers.get(id);
  if (timer) {
    clearTimeout(timer);
    dismissTimers.delete(id);
  }
  toasts.update((list) => list.filter((t) => t.id !== id));
}

export function clearAllToasts() {
  for (const timer of dismissTimers.values()) clearTimeout(timer);
  dismissTimers.clear();
  toasts.set([]);
}
