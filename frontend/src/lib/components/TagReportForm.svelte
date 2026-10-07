<script lang="ts">
  import { showToast } from '$lib/stores/toast';
  import Tag from '$lib/components/Tag.svelte';
  import { tagDefinitions } from '$lib/utils/tagDescriptions';
  import type { CardRecord } from '$lib/types/content';

  let {
    card,
    ondone,
  }: {
    card: CardRecord;
    ondone: () => void;
  } = $props();

  let incorrectTags = $state<Set<string>>(new Set());
  let correctedTags = $state<Set<string>>(new Set());
  let comment = $state('');
  let submitting = $state(false);

  const allTagNames = Object.keys(tagDefinitions);
  const currentTags = card.tags ?? [];
  const hasTags = $derived(currentTags.length > 0);
  const availableCorrections = $derived(allTagNames.filter((t) => !currentTags.includes(t)));

  function toggleIncorrect(tag: string) {
    const next = new Set(incorrectTags);
    if (next.has(tag)) next.delete(tag);
    else next.add(tag);
    incorrectTags = next;
  }

  function toggleCorrected(tag: string) {
    const next = new Set(correctedTags);
    if (next.has(tag)) next.delete(tag);
    else next.add(tag);
    correctedTags = next;
  }

  async function submit() {
    submitting = true;
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          card_id: card.id,
          incorrect_tags: [...incorrectTags],
          corrected_tags: [...correctedTags],
          comment: comment.trim(),
          website: '', // honeypot
        }),
      });
      if (res.ok) {
        showToast('¡Gracias por tu reporte!', 'success');
        ondone();
      } else {
        showToast('No se pudo enviar el reporte', 'error');
      }
    } catch {
      showToast('No se pudo enviar el reporte', 'error');
    } finally {
      submitting = false;
    }
  }

  const canSubmit = $derived(
    incorrectTags.size > 0 || correctedTags.size > 0 || comment.trim().length > 0,
  );
</script>

<div class="mt-2 rounded-box border border-base-300 bg-base-200/50 p-3 text-xs space-y-3">
  <p class="font-semibold opacity-70">
    {hasTags
      ? '¿Hay etiquetas incorrectas?'
      : 'Esta tarjeta no tiene etiquetas. Ayúdanos a categorizarla:'}
  </p>

  {#if hasTags}
    <div class="space-y-1">
      <p class="opacity-50">Etiquetas actuales — marca las incorrectas:</p>
      <div class="flex flex-wrap gap-1">
        {#each currentTags as tag (tag)}
          <Tag
            {tag}
            variant={incorrectTags.has(tag) ? 'error' : 'outline'}
            hoverColor="error"
            onclick={() => toggleIncorrect(tag)}
          />
        {/each}
      </div>
    </div>
  {/if}

  {#if availableCorrections.length > 0}
    <div class="space-y-1">
      <p class="opacity-50">
        {hasTags ? '¿Falta alguna etiqueta? (opcional)' : '¿Qué etiquetas le añadirías?'}
      </p>
      <div class="flex flex-wrap gap-1">
        {#each availableCorrections as tag (tag)}
          <Tag
            {tag}
            variant={correctedTags.has(tag) ? 'success' : 'outline'}
            hoverColor="success"
            onclick={() => toggleCorrected(tag)}
          />
        {/each}
      </div>
    </div>
  {/if}

  <div class="space-y-1">
    <input
      type="text"
      class="input input-xs w-full"
      placeholder="Comentario (opcional)"
      bind:value={comment}
      maxlength="500"
    />
  </div>

  <!-- Honeypot field — hidden from humans, bots fill it in -->
  <input
    type="text"
    name="website"
    class="hidden"
    tabindex="-1"
    autocomplete="off"
    aria-hidden="true"
  />

  <div class="flex gap-2">
    <button
      type="button"
      class="btn btn-primary btn-xs"
      disabled={!canSubmit || submitting}
      onclick={submit}
    >
      {submitting ? 'Enviando…' : 'Enviar'}
    </button>
    <button type="button" class="btn btn-ghost btn-xs" onclick={ondone}> Cancelar </button>
  </div>
</div>
