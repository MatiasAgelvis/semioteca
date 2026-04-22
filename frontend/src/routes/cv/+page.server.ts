import { listPdfResources } from '$lib/server/content';

export const prerender = true;

export async function load() {
	const resources = await listPdfResources();
	return {
		resources: resources.filter((resource) => resource.section === 'cv')
	};
}
