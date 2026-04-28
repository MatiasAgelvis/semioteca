import type { CardRecord } from '$lib/types/content';

function normalizeSpace(text: string): string {
	return text.replace(/\s+/g, ' ').trim();
}

function stripImageMarkers(text: string): string {
	return text.replace(/\[\[IMAGE:\d+\]\]\n?/g, ' ');
}

/** Baseline APA-like citation for a card; can be evolved later to stricter format rules. */
export function buildCardCitationAPA(card: CardRecord): string {
	const author = normalizeSpace(card.author || 'Autor desconocido');
	const year = normalizeSpace(card.year || 'n.d.');
	const title = normalizeSpace(card.book || 'Sin titulo');
	const page = normalizeSpace(card.page || 's. p.');
    
	return `${author}. (${year}). ${title} (p. ${page}). Semioteca.`;
}

export function buildCardFullText(card: CardRecord): string {
	const author = normalizeSpace(card.author || 'Autor desconocido');
	const year = normalizeSpace(card.year || 'n.d.');
	const title = normalizeSpace(card.book || 'Sin titulo');
	const page = normalizeSpace(card.page || 's. p.');
	const content = normalizeSpace(stripImageMarkers(card.content));

	return `${author}. ${title} (${year}), p. ${page}.\n\n${content}`;
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
	if (typeof window === 'undefined') return false;

	try {
		if (navigator.clipboard?.writeText) {
			await navigator.clipboard.writeText(text);
			return true;
		}
	} catch {
		// Fallback below.
	}

	try {
		const textarea = document.createElement('textarea');
		textarea.value = text;
		textarea.setAttribute('readonly', 'true');
		textarea.style.position = 'fixed';
		textarea.style.opacity = '0';
		document.body.appendChild(textarea);
		textarea.focus();
		textarea.select();
		const copied = document.execCommand('copy');
		document.body.removeChild(textarea);
		return copied;
	} catch {
		return false;
	}
}
