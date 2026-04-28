import { SHOW_DOCS } from '$lib/config/features';
import { listPdfResources } from '$lib/server/content';

export const prerender = true;

export async function load() {
	if (!SHOW_DOCS) {
		return { resources: [] };
	}

	return {
		resources: await listPdfResources()
	};
}
