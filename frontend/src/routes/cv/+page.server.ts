import { SHOW_CV } from '$lib/config/features';
import { listPdfResources } from '$lib/server/content';

export const prerender = true;

export async function load() {
	if (!SHOW_CV) {
		return { resources: [] };
	}

	const resources = await listPdfResources();
	return {
		resources: resources.filter((resource) => resource.section === 'cv')
	};
}
