export interface CardImage {
	path: string;
	filename: string;
	internal_path: string | null;
	caption: string | null;
	placeholder_id: number | null;
	alt_text: string | null;
}

export interface CardRecord {
	title: string;
	author: string;
	book: string;
	year: string;
	id: string;
	page: string | null;
	raw_marker: string | null;
	content: string;
	source_path: string;
	source_format: string;
	images: CardImage[];
}

export interface CardBook {
	title: string;
	author: string;
	book: string;
	year: string;
	cards: CardRecord[];
}

export interface CardsDataset {
	books: CardBook[];
}

export interface BlogPostMeta {
	slug: string;
	title: string;
	excerpt: string;
	coverImage: string | null;
}

export interface BlogPost extends BlogPostMeta {
	html: string;
	markdown: string;
}

export interface PdfResource {
	title: string;
	section: string;
	url: string;
}
