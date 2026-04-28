export interface HighlightSegment {
	text: string;
	match: boolean;
}

function foldChar(char: string): string {
	return char.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function buildFoldedIndex(text: string) {
	let folded = '';
	const foldedToOriginal: number[] = [];

	for (let index = 0; index < text.length; index += 1) {
		const chunk = foldChar(text[index]);
		for (const foldedChar of chunk) {
			folded += foldedChar;
			foldedToOriginal.push(index);
		}
	}

	return { folded, foldedToOriginal };
}

function mergeRanges(ranges: Array<{ start: number; end: number }>) {
	if (ranges.length <= 1) return ranges;
	ranges.sort((left, right) => left.start - right.start);

	const merged = [ranges[0]];
	for (let index = 1; index < ranges.length; index += 1) {
		const current = ranges[index];
		const previous = merged[merged.length - 1];
		if (current.start <= previous.end) {
			previous.end = Math.max(previous.end, current.end);
			continue;
		}
		merged.push(current);
	}

	return merged;
}

export function tokenizeQuery(query: string): string[] {
	return [...new Set(
		query
			.split(/[\s,.;:!?()\[\]{}"'“”‘’/\\|+-]+/)
			.map((part) => foldChar(part.trim()))
			.filter((part) => part.length > 0)
	)];
}

export function getMatchCount(text: string, terms: string[]): number {
	if (terms.length === 0) return 0;
	const { folded } = buildFoldedIndex(text);
	let count = 0;

	for (const term of terms) {
		let fromIndex = 0;
		while (fromIndex < folded.length) {
			const matchIndex = folded.indexOf(term, fromIndex);
			if (matchIndex === -1) break;
			count += 1;
			fromIndex = matchIndex + term.length;
		}
	}

	return count;
}

export function matchesAllTerms(text: string, terms: string[]): boolean {
	if (terms.length === 0) return true;
	const { folded } = buildFoldedIndex(text);
	return terms.every((term) => folded.includes(term));
}

export function matchesAnyTerm(text: string, terms: string[]): boolean {
	if (terms.length === 0) return false;
	const { folded } = buildFoldedIndex(text);
	return terms.some((term) => folded.includes(term));
}

export function getHighlightSegments(text: string, terms: string[]): HighlightSegment[] {
	if (!text) return [{ text: '', match: false }];
	if (terms.length === 0) return [{ text, match: false }];

	const { folded, foldedToOriginal } = buildFoldedIndex(text);
	const ranges: Array<{ start: number; end: number }> = [];

	for (const term of terms) {
		let fromIndex = 0;
		while (fromIndex < folded.length) {
			const matchIndex = folded.indexOf(term, fromIndex);
			if (matchIndex === -1) break;
			const matchEnd = matchIndex + term.length;
			const originalStart = foldedToOriginal[matchIndex];
			const originalEnd = foldedToOriginal[matchEnd - 1] + 1;
			ranges.push({ start: originalStart, end: originalEnd });
			fromIndex = matchEnd;
		}
	}

	if (ranges.length === 0) return [{ text, match: false }];

	const mergedRanges = mergeRanges(ranges);
	const segments: HighlightSegment[] = [];
	let cursor = 0;

	for (const range of mergedRanges) {
		if (cursor < range.start) {
			segments.push({ text: text.slice(cursor, range.start), match: false });
		}
		segments.push({ text: text.slice(range.start, range.end), match: true });
		cursor = range.end;
	}

	if (cursor < text.length) {
		segments.push({ text: text.slice(cursor), match: false });
	}

	return segments;
}

export function createExcerpt(text: string, terms: string[], radius = 110): string {
	if (!text) return '';
	if (terms.length === 0) return text;

	const { folded, foldedToOriginal } = buildFoldedIndex(text);
	let bestIndex = -1;

	for (const term of terms) {
		const matchIndex = folded.indexOf(term);
		if (matchIndex !== -1 && (bestIndex === -1 || matchIndex < bestIndex)) {
			bestIndex = matchIndex;
		}
	}

	if (bestIndex === -1) return text;

	const originalCenter = foldedToOriginal[bestIndex];
	let start = Math.max(0, originalCenter - radius);
		let end = Math.min(text.length, originalCenter + radius);

	if (start > 0) {
		const previousSpace = text.lastIndexOf(' ', start);
		if (previousSpace !== -1) start = previousSpace + 1;
	}
	if (end < text.length) {
		const nextSpace = text.indexOf(' ', end);
		if (nextSpace !== -1) end = nextSpace;
	}

	const excerpt = text.slice(start, end).trim();
	return `${start > 0 ? '…' : ''}${excerpt}${end < text.length ? '…' : ''}`;
}