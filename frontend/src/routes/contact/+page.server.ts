import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { env } from '$env/dynamic/private';

export const actions: Actions = {
  default: async ({ request }) => {
    const formData = await request.formData();
    
    // Add the accessKey required by staticforms.dev
    formData.append('accessKey', env.STATIC_FORMS_KEY || '');
    // Recommended to add a subject
    formData.append('subject', 'Contact Form Submission - Semioteca');

    try {
      const response = await fetch('https://api.staticforms.dev/submit', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        return { success: true };
      } else {
        return fail(400, { error: result.message || 'Something went wrong.' });
      }
    } catch (e) {
      return fail(500, { error: 'Failed to send message. Please try again later.' });
    }
  }
};
