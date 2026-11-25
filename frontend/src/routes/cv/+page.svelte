<script lang="ts">
  import { ExternalLink, FileText } from '@lucide/svelte';
  import PageSection from '$lib/components/PageSection.svelte';
  import { publicationMeta, publicationSource } from '$lib/data/publications';
  import { SITE_AUTHOR, SITE_AUTHOR_URL } from '$lib/config/site';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const articles = $derived(
    [...data.articles].sort((a, b) => {
      const yearA = publicationMeta(a.title)?.year ?? 0;
      const yearB = publicationMeta(b.title)?.year ?? 0;
      return yearB - yearA;
    }),
  );

  type EducationEntry = {
    period: string;
    title: string;
    detail?: string;
    link?: { href: string; label: string };
  };

  const education: EducationEntry[] = [
    {
      period: '2006',
      title: 'Doctor en Filología Hispánica',
      detail: 'Universidade da Coruña, España · Sobresaliente Cum Laude',
      link: {
        href: 'https://ruc.udc.es/handle/2183/992',
        label: 'Tesis doctoral: Discurso visual y discurso verbal (repositorio UDC)',
      },
    },
    {
      period: '1988',
      title: 'Magíster Scientiae en Lingüística',
      detail: 'Universidad de Los Andes, Mérida',
    },
    {
      period: '1982',
      title: 'Licenciado en Letras',
      detail: 'Universidad Central de Venezuela',
    },
  ];

  type TrajectoryEntry = {
    period: string;
    title: string;
    detail?: string;
  };

  const trajectory: TrajectoryEntry[] = [
    {
      period: '1983–1986',
      title: 'Docente de Lengua Materna',
      detail: 'Centro Educacional APULA «Dr. Carlos Emilio Muñoz Oraá», Mérida',
    },
    {
      period: '1987–1990',
      title: 'Becario del Plan II',
      detail: 'Universidad de Los Andes · Mérida',
    },
    {
      period: '1991–1993',
      title: 'Profesor Instructor',
      detail:
        'Departamento de Lingüística, Escuela de Letras · Universidad de Los Andes · Dedicación exclusiva',
    },
    {
      period: '1993–1997',
      title: 'Profesor Asistente',
      detail:
        'Departamento de Lingüística, Escuela de Letras · Universidad de Los Andes · Dedicación exclusiva',
    },
    {
      period: '1997–2001',
      title: 'Profesor Agregado',
      detail:
        'Departamento de Lingüística, Escuela de Letras · Universidad de Los Andes · Dedicación exclusiva',
    },
    {
      period: '2001–2006',
      title: 'Profesor Asociado',
      detail:
        'Departamento de Lingüística, Escuela de Letras · Universidad de Los Andes · Dedicación exclusiva',
    },
    {
      period: 'Desde 2006',
      title: 'Profesor Titular',
      detail:
        'Departamento de Lingüística, Escuela de Letras · Universidad de Los Andes · Dedicación exclusiva',
    },
  ];
</script>

<svelte:head>
  <title>Curriculum | Significado Total</title>
  <meta
    name="description"
    content={`Trayectoria académica y publicaciones seleccionadas de ${SITE_AUTHOR}.`}
  />
</svelte:head>

<div class="mx-auto flex w-full max-w-7xl flex-col gap-10 px-5 py-10 lg:px-10">
  <section
    class="rounded-box border border-base-300/70 bg-base-100/90 p-8 shadow-xl shadow-base-content/5 lg:p-10"
  >
    <p class="text-xs font-semibold tracking-[0.25em] text-primary uppercase">Curriculum</p>
    <h1 class="mt-3 text-4xl font-black tracking-tight text-base-content sm:text-5xl">
      {SITE_AUTHOR}
    </h1>
    <p class="mt-2 text-sm font-semibold tracking-[0.15em] text-base-content/50 uppercase">
      Semiótica · Pragmática · Teoría lingüística
    </p>
    <p class="mt-5 max-w-3xl leading-8 text-base-content/70">
      Profesor Titular de la Universidad de Los Andes (Mérida, Venezuela), donde ejerce desde hace
      más de veinticinco años la docencia y la investigación en teoría lingüística, semántica,
      pragmática y semiótica. Doctor en Filología Hispánica por la Universidade da Coruña.
    </p>
    <div class="mt-7 flex flex-wrap items-center gap-3">
      <a class="btn btn-neutral btn-sm" href="#formacion">Formación</a>
      <a class="btn btn-outline btn-sm" href="#trayectoria">Trayectoria</a>
      <a class="btn btn-outline btn-sm" href="#publicaciones">Publicaciones</a>
      <a class="btn btn-ghost btn-sm" href={SITE_AUTHOR_URL} target="_blank" rel="noreferrer">
        Sitio personal
      </a>
    </div>
  </section>

  <section id="formacion" class="scroll-mt-24">
    <PageSection title="Formación académica">
      <ul class="grid gap-4 sm:grid-cols-[6.5rem_1fr] sm:gap-x-6 sm:gap-y-5">
        {#each education as entry (entry.title)}
          <li class="contents">
            <span class="text-sm font-bold text-primary">{entry.period}</span>
            <div>
              <p class="font-semibold text-base-content">
                {entry.title}
              </p>
              {#if entry.detail}
                <p class="mt-0.5 text-sm leading-6 text-base-content/60">
                  {entry.detail}
                </p>
              {/if}
              {#if entry.link}
                <a
                  class="mt-1 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                  href={entry.link.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  {entry.link.label}
                  <ExternalLink class="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              {/if}
            </div>
          </li>
        {/each}
      </ul>
    </PageSection>
  </section>

  <section id="trayectoria" class="scroll-mt-24">
    <PageSection
      title="Trayectoria académica"
      description="Etapa previa y carrera docente en la Universidad de Los Andes."
    >
      <ul class="grid gap-4 sm:grid-cols-[6.5rem_1fr] sm:gap-x-6 sm:gap-y-5">
        {#each trajectory as entry (entry.period + entry.title)}
          <li class="contents">
            <span class="text-sm font-bold text-primary">{entry.period}</span>
            <div>
              <p class="font-semibold text-base-content">
                {entry.title}
              </p>
              {#if entry.detail}
                <p class="mt-0.5 text-sm leading-6 text-base-content/60">
                  {entry.detail}
                </p>
              {/if}
            </div>
          </li>
        {/each}
      </ul>
    </PageSection>
  </section>

  <section id="publicaciones" class="scroll-mt-24">
    <PageSection
      title="Publicaciones seleccionadas"
      description="Artículos publicados en revistas y volúmenes académicos."
    >
      {#if articles.length === 0}
        <p class="text-sm text-base-content/60">No hay publicaciones disponibles por ahora.</p>
      {:else}
        <div class="grid gap-3">
          {#each articles as article (article.url)}
            {@const meta = publicationMeta(article.title)}
            {@const label = meta?.title ?? article.title}
            {@const source = publicationSource(meta)}
            <article
              class="flex flex-col gap-4 rounded-box border border-base-300/70 bg-base-100/90 px-5 py-4 shadow-md shadow-base-content/5 transition hover:border-primary/30 hover:shadow-lg sm:flex-row sm:items-center sm:justify-between"
            >
              <div class="flex min-w-0 items-start gap-3">
                <FileText class="mt-0.5 h-4 w-4 shrink-0 text-base-content/40" aria-hidden="true" />
                <div class="min-w-0">
                  <p class="font-semibold leading-6 text-base-content">
                    {label}
                  </p>
                  {#if meta?.authors.length}
                    <p class="mt-1 text-sm leading-6 text-base-content/60">
                      {meta.authors.join(' · ')}
                    </p>
                  {/if}
                  {#if source}
                    <p class="mt-1 text-xs leading-5 text-base-content/50">
                      {source}
                    </p>
                  {/if}
                </div>
              </div>
              <div class="flex shrink-0 gap-2">
                <a
                  class="btn btn-outline btn-sm"
                  href={article.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Ver
                </a>
                <a class="btn btn-neutral btn-sm" href={article.url} download>Descargar</a>
              </div>
            </article>
          {/each}
        </div>
      {/if}
    </PageSection>
  </section>
</div>
