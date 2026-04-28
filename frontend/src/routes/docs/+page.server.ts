import { error } from '@sveltejs/kit';
import { SHOW_DOCS } from '$lib/config/features';
import { listPdfResources } from '$lib/server/content';

export const prerender = SHOW_DOCS;

export async function load() {
	if (!SHOW_DOCS) {
		error(404, 'Not found');
	}

	return {
		resources: await listPdfResources()
	};
}
