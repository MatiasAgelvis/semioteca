import { writable } from 'svelte/store';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
	id: number;
	text: string;
	type: ToastType;
}

export const toast = writable<ToastMessage | null>(null);

let nextToastId = 1;
let dismissTimer: ReturnType<typeof setTimeout> | null = null;

export function showToast(text: string, type: ToastType = 'info', duration = 1800) {
	if (dismissTimer) {
		clearTimeout(dismissTimer);
		dismissTimer = null;
	}

	toast.set({
		id: nextToastId++,
		text,
		type
	});

	if (duration > 0) {
		dismissTimer = setTimeout(() => {
			toast.set(null);
			dismissTimer = null;
		}, duration);
	}
}

export function clearToast() {
	if (dismissTimer) {
		clearTimeout(dismissTimer);
		dismissTimer = null;
	}
	toast.set(null);
}
