import { listPdfResources } from '$lib/server/content';

export const prerender = true;

export async function load() {
	return {
		resources: await listPdfResources()
	};
}
