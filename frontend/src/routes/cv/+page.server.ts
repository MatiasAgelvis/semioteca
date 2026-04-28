import { error } from '@sveltejs/kit';
import { SHOW_CV } from '$lib/config/features';
import { listPdfResources } from '$lib/server/content';

export const prerender = SHOW_CV;

export async function load() {
	if (!SHOW_CV) {
		error(404, 'Not found');
	}

	const resources = await listPdfResources();
	return {
		resources: resources.filter((resource) => resource.section === 'cv')
	};
}
