import { error } from '@sveltejs/kit';

import { getBlogPostBySlug, listBlogPosts } from '$lib/server/content';

export const prerender = true;

export async function entries() {
	const posts = await listBlogPosts();
	return posts.map((post) => ({ slug: post.slug }));
}

export async function load({ params }) {
	const post = await getBlogPostBySlug(params.slug);
	if (!post) {
		error(404, 'Post not found');
	}

	return { post };
}
