<script lang="ts">
  import { ExternalLink, FileText } from '@lucide/svelte';
  import PageSection from '$lib/components/PageSection.svelte';
  import {
    SHOW_CV_MANAGEMENT,
    SHOW_CV_RESEARCH,
    SHOW_CV_TEACHING,
    SHOW_CV_TRAJECTORY,
  } from '$lib/config/features';
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

  const management = [
    {
      period: 'Desde 1993',
      role: 'Representante de la Facultad ante el CDCHTA',
    },
    {
      period: '1995',
      role: 'Jefe encargado del Departamento de Lingüística',
    },
    { period: '1996–1998', role: 'Director de la Escuela de Letras' },
    {
      period: '1996',
      role: 'Decano encargado de la Facultad de Humanidades y Educación',
    },
    {
      period: '2001',
      role: 'Director de la Escuela de Medios Audiovisuales',
    },
    {
      period: '2006–2009',
      role: 'Coordinador del Doctorado en Lingüística',
    },
    { period: '2007–2008', role: 'Director de la Escuela de Letras' },
    {
      period: '2008',
      role: 'Decano encargado de la Facultad de Humanidades y Educación',
    },
  ];

  const research = [
    {
      title:
        'Semántica discursiva y léxica del español de Venezuela. Estudios sincrónicos y diacrónicos',
      detail: 'CDCHTA · con Danielle Triay, Juana Elvira Ramos y Delci Torres',
    },
    {
      title: 'Zapatazos: la sociedad caracterizada',
      detail: 'CDCHTA · responsable principal',
    },
    {
      title:
        'Las pasiones de Medea: hacia un análisis semiótico de las pasiones en la Medea de Séneca',
      detail: 'CDCHTA · con María Labarca',
    },
    {
      title: 'Alienación e identidad en el filme «Santa Sangre» (1989) de Alejandro Jodorowsky',
      detail: 'CDCHTA · con Giordana García Sojo',
    },
  ];
</script>

<svelte:head>
  <title>Curriculum | Significado Total</title>
  <meta
    name="description"
    content={`Formación académica y publicaciones seleccionadas de ${SITE_AUTHOR}.`}
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
      {#if SHOW_CV_TRAJECTORY}
        <a class="btn btn-outline btn-sm" href="#trayectoria">Trayectoria</a>
      {/if}
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

  {#if SHOW_CV_TRAJECTORY}
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
  {/if}

  {#if SHOW_CV_MANAGEMENT}
    <section class="scroll-mt-24">
      <PageSection
        title="Gestión y coordinación"
        description="Cargos académicos y de dirección desempeñados en la Universidad de Los Andes."
      >
        <ul class="grid gap-4 sm:grid-cols-[6.5rem_1fr] sm:gap-x-6 sm:gap-y-4">
          {#each management as entry (entry.period + entry.role)}
            <li class="contents">
              <span class="text-sm font-bold text-primary">{entry.period}</span>
              <p class="leading-6 text-base-content">{entry.role}</p>
            </li>
          {/each}
        </ul>
      </PageSection>
    </section>
  {/if}

  {#if SHOW_CV_RESEARCH}
    <section class="scroll-mt-24">
      <PageSection
        title="Investigación"
        description="Proyectos culminados con el Consejo de Desarrollo Científico, Humanístico, Tecnológico y de las Artes (CDCHTA)."
      >
        <ul class="grid gap-4">
          {#each research as project (project.title)}
            <li class="rounded-box border border-base-300/70 bg-base-100/90 px-5 py-4">
              <p class="font-semibold leading-6 text-base-content">
                {project.title}
              </p>
              <p class="mt-1 text-sm leading-6 text-base-content/60">
                {project.detail}
              </p>
            </li>
          {/each}
        </ul>
      </PageSection>
    </section>
  {/if}

  {#if SHOW_CV_TEACHING}
    <section class="scroll-mt-24">
      <PageSection title="Docencia y reconocimientos">
        <ul class="grid gap-4">
          <li class="rounded-box border border-base-300/70 bg-base-100/90 px-5 py-4">
            <p class="font-semibold text-base-content">
              Teoría lingüística, semántica, pragmática y semiótica
            </p>
            <p class="mt-1 text-sm leading-6 text-base-content/60">
              Departamento de Lingüística, Escuela de Letras, Universidad de Los Andes.
            </p>
          </li>
          <li class="rounded-box border border-base-300/70 bg-base-100/90 px-5 py-4">
            <p class="font-semibold text-base-content">
              Seminario «Semiótica de las pasiones y arte»
            </p>
            <p class="mt-1 text-sm leading-6 text-base-content/60">
              Profesor invitado, Doctorado en Ciencias Humanas, Universidad de Los Andes (2014).
            </p>
          </li>
          <li class="rounded-box border border-base-300/70 bg-base-100/90 px-5 py-4">
            <p class="font-semibold text-base-content">Profesor Meritorio Nivel III</p>
            <p class="mt-1 text-sm leading-6 text-base-content/60">
              Reconocimiento de la FAPUV al mérito académico (1998 y 2003).
            </p>
          </li>
          <li class="rounded-box border border-base-300/70 bg-base-100/90 px-5 py-4">
            <p class="font-semibold text-base-content">Dirección y jurado de tesis</p>
            <p class="mt-1 text-sm leading-6 text-base-content/60">
              Tutor de tesis doctorales y trabajos de maestría en Lingüística, y jurado en
              tribunales de la Universidad de Los Andes.
            </p>
          </li>
        </ul>
      </PageSection>
    </section>
  {/if}

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
