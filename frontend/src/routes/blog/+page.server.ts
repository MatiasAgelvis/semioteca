import { listBlogPosts } from '$lib/server/content';

export const prerender = true;

export async function load() {
	return {
		posts: await listBlogPosts()
	};
}
