<script lang="ts">
    import {
        BookOpen,
        Briefcase,
        ChartColumn,
        Download,
        FileText,
        Gavel,
        GraduationCap,
        ScrollText,
        Users,
    } from "@lucide/svelte";
    import PageSection from "$lib/components/PageSection.svelte";
    import { publicationMeta, publicationSource } from "$lib/data/publications";
    import { SITE_AUTHOR, SITE_AUTHOR_URL } from "$lib/config/site";
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();

    const articles = $derived(
        [...data.articles].sort((a, b) => {
            const yearA = publicationMeta(a.title)?.year ?? 0;
            const yearB = publicationMeta(b.title)?.year ?? 0;
            return yearB - yearA;
        }),
    );

    type DocMeta = {
        label: string;
        description: string;
        icon: typeof Briefcase;
    };

    const DOC_META: Record<string, DocMeta> = {
        "Experiencia Academica": {
            label: "Experiencia académica",
            description: "Trayectoria docente e investigadora.",
            icon: Briefcase,
        },
        "Formacion Academica": {
            label: "Formación académica",
            description: "Estudios de pregrado y posgrado.",
            icon: GraduationCap,
        },
        Jurado: {
            label: "Jurado",
            description:
                "Participación en tribunales y comisiones evaluadoras.",
            icon: Gavel,
        },
        "Productividad Academica": {
            label: "Productividad académica",
            description:
                "Producción científica y actividades de investigación.",
            icon: ChartColumn,
        },
        Publicaciones: {
            label: "Publicaciones",
            description: "Listado completo de publicaciones.",
            icon: BookOpen,
        },
        Tutorias: {
            label: "Tutorías",
            description: "Acompañamiento de trabajos de grado y tesistas.",
            icon: Users,
        },
    };

    function docMeta(title: string): DocMeta {
        return (
            DOC_META[title] ?? {
                label: title,
                description: "Documento en PDF.",
                icon: ScrollText,
            }
        );
    }
</script>

<svelte:head>
    <title>Curriculum | Significado Total</title>
    <meta
        name="description"
        content={`Trayectoria académica, documentos y publicaciones de ${SITE_AUTHOR}.`}
    />
</svelte:head>

<div class="mx-auto flex w-full max-w-7xl flex-col gap-10 px-5 py-10 lg:px-10">
    <section
        class="rounded-box border border-base-300/70 bg-base-100/90 p-8 shadow-xl shadow-base-content/5 lg:p-10"
    >
        <p
            class="text-xs font-semibold tracking-[0.25em] text-primary uppercase"
        >
            Curriculum
        </p>
        <h1
            class="mt-3 text-4xl font-black tracking-tight text-base-content sm:text-5xl"
        >
            {SITE_AUTHOR}
        </h1>
        <p
            class="mt-2 text-sm font-semibold tracking-[0.15em] text-base-content/50 uppercase"
        >
            Semiótica · Pragmática · Teoría de la interpretación
        </p>
        <p class="mt-5 max-w-3xl leading-8 text-base-content/70">
            Investigación y docencia en semiótica, pragmática y teoría de la
            interpretación. Este espacio reúne su trayectoria académica, los
            documentos y la producción publicada.
        </p>
        <div class="mt-7 flex flex-wrap items-center gap-3">
            <a class="btn btn-neutral btn-sm" href="#documentos">Documentos</a>
            <a class="btn btn-outline btn-sm" href="#publicaciones"
                >Publicaciones</a
            >
            <a
                class="btn btn-ghost btn-sm"
                href={SITE_AUTHOR_URL}
                target="_blank"
                rel="noreferrer"
            >
                Sitio personal
            </a>
        </div>
    </section>

    <section id="documentos" class="scroll-mt-24">
        <PageSection
            title="Documentos"
            description="Resumen profesional en PDF. Cada documento se puede consultar en línea o descargar."
        >
            <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {#each data.resources as resource (resource.url)}
                    {@const meta = docMeta(resource.title)}
                    {@const Icon = meta.icon}
                    <article
                        class="flex flex-col rounded-box border border-base-300/70 bg-base-100/90 p-5 shadow-md shadow-base-content/5 transition hover:border-primary/30 hover:shadow-lg"
                    >
                        <Icon class="h-5 w-5 text-primary" aria-hidden="true" />
                        <h3 class="mt-3 text-lg font-black text-base-content">
                            {meta.label}
                        </h3>
                        <p class="mt-1 text-sm leading-6 text-base-content/60">
                            {meta.description}
                        </p>
                        <div class="mt-auto flex flex-wrap gap-2 pt-5">
                            <a
                                class="btn btn-outline btn-sm"
                                href={resource.url}
                                target="_blank"
                                rel="noreferrer"
                            >
                                Ver
                            </a>
                            <a
                                class="btn btn-neutral btn-sm gap-1"
                                href={resource.url}
                                download
                            >
                                <Download class="h-4 w-4" aria-hidden="true" />
                                Descargar
                            </a>
                        </div>
                    </article>
                {/each}
            </div>
        </PageSection>
    </section>

    <section id="publicaciones" class="scroll-mt-24">
        <PageSection
            title="Publicaciones"
            description="Artículos publicados en revistas y volúmenes académicos."
        >
            {#if articles.length === 0}
                <p class="text-sm text-base-content/60">
                    No hay publicaciones disponibles por ahora.
                </p>
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
                                <FileText
                                    class="mt-0.5 h-4 w-4 shrink-0 text-base-content/40"
                                    aria-hidden="true"
                                />
                                <div class="min-w-0">
                                    <p
                                        class="font-semibold leading-6 text-base-content"
                                    >
                                        {label}
                                    </p>
                                    {#if meta?.authors.length}
                                        <p
                                            class="mt-1 text-sm leading-6 text-base-content/60"
                                        >
                                            {meta.authors.join(" · ")}
                                        </p>
                                    {/if}
                                    {#if source}
                                        <p
                                            class="mt-1 text-xs leading-5 text-base-content/50"
                                        >
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
                                <a
                                    class="btn btn-neutral btn-sm"
                                    href={article.url}
                                    download>Descargar</a
                                >
                            </div>
                        </article>
                    {/each}
                </div>
            {/if}
        </PageSection>
    </section>
</div>
