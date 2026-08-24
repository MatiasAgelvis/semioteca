<script lang="ts">
  import PageSection from '$lib/components/PageSection.svelte';
</script>

<svelte:head>
  <title>Guía de uso | Significado Total</title>
  <meta
    name="description"
    content="Cómo buscar y filtrar tarjetas, armar un documento y exportarlo a PDF en Significado Total."
  />
</svelte:head>

<div class="mx-auto w-full max-w-3xl px-5 py-10 lg:px-10">
  <PageSection
    title="Guía de uso"
    description="Aprende a buscar tarjetas bibliográficas, armar un documento y exportarlo a PDF."
    headingLevel="h1"
  >
    <p class="text-base-content/80">
      Significado Total es un repositorio de fichas bibliográficas extraídas de manuscritos fuente.
      La forma más potente de usarlo es buscar las tarjetas que te interesan, agruparlas en un
      <em>documento</em> y exportarlas a PDF. Despliega cada sección para ver cómo hacerlo.
    </p>

    <div class="mt-8">
      <div class="join join-vertical w-full">
        <div id="inicio-rapido" class="collapse collapse-arrow join-item">
          <input type="radio" name="guia-accordion" checked />
          <div class="collapse-title text-base font-semibold">Empezar en 30 segundos</div>
          <div class="collapse-content">
            <ol class="list-decimal space-y-2 pl-5 text-base-content/80">
              <li>Abre <a class="link" href="/cards">Tarjetas</a>.</li>
              <li>
                Encuentra una tarjeta y añádela a tu documento con el botón
                <span class="btn btn-xs btn-ghost" aria-hidden="true">+ Añadir</span>.
              </li>
              <li>
                Con varias tarjetas, abre el <em>constructor de documento</em> al pie de la pantalla
                y pulsa <span class="btn btn-primary btn-sm" aria-hidden="true">Exportar PDF</span>.
              </li>
            </ol>
            <p class="mt-3 text-sm text-base-content/60">
              Ya tienes tu primer documento. Explora el resto de secciones para buscar, filtrar y
              ordenar las tarjetas.
            </p>
          </div>
        </div>

        <div id="buscar" class="collapse collapse-arrow join-item">
          <input type="radio" name="guia-accordion" />
          <div class="collapse-title text-base font-semibold">Buscar tarjetas</div>
          <div class="collapse-content">
            <p class="text-base-content/80">
              El buscador está siempre visible en la parte superior de la vista de tarjetas (también
              con el atajo <kbd class="kbd kbd-sm">⌘K</kbd> en escritorio). Escribe cualquier término
              y los resultados coincidentes aparecerán al instante.
            </p>
            <ul class="mt-2 list-disc space-y-1 pl-5 text-base-content/80">
              <li>La búsqueda recalca el texto coincidente dentro de cada tarjeta.</li>
              <li>Al pulsar el campo de búsqueda se abre un panel con opciones avanzadas.</li>
            </ul>
            <!-- TODO: captura de pantalla del buscador -->
          </div>
        </div>

        <div id="filtrar" class="collapse collapse-arrow join-item">
          <input type="radio" name="guia-accordion" />
          <div class="collapse-title text-base font-semibold">
            Filtrar por libro, autor y etiquetas
          </div>
          <div class="collapse-content">
            <p class="text-base-content/80">
              Además del texto libre, puedes acotar los resultados por libro o con los filtros de la
              <strong>búsqueda avanzada</strong>:
            </p>
            <ul class="mt-2 list-disc space-y-1 pl-5 text-base-content/80">
              <li>
                <strong>Libro:</strong> la barra lateral <em>Contenido</em> lista los libros; selecciona
                uno para acotar la vista.
              </li>
              <li>
                <strong>Búsqueda avanzada:</strong> al pulsar el campo de búsqueda se abre el panel
                donde puedes elegir tantos <em>autores</em> o <em>etiquetas</em> como quieras.
              </li>
              <li>
                <strong>Modo de coincidencia:</strong> en ese mismo panel puedes exigir que una
                tarjeta cumpla <em>todas</em> las condiciones o que baste con <em>cualquiera</em>.
              </li>
            </ul>
            <!-- TODO: captura de pantalla de los filtros avanzados -->
          </div>
        </div>

        <div id="compositor" class="collapse collapse-arrow join-item">
          <input type="radio" name="guia-accordion" />
          <div class="collapse-title text-base font-semibold">
            Armar un documento y exportarlo a PDF
          </div>
          <div class="collapse-content">
            <p class="text-base-content/80">
              Puedes agrupar varias tarjetas en un único documento y exportarlo para leerlo o
              imprimirlo.
            </p>
            <ol class="mt-2 list-decimal space-y-2 pl-5 text-base-content/80">
              <li>
                Añade al documento las tarjetas que quieras con el botón
                <span class="btn btn-xs btn-ghost" aria-hidden="true">+ Añadir</span> de cada tarjeta.
              </li>
              <li>
                El <em>constructor de documento</em> aparece al pie de la pantalla con el total de tarjetas
                seleccionadas.
              </li>
              <li>
                Pulsa en el contador para abrirlo y reordenar las tarjetas con las flechas
                <span class="btn btn-ghost btn-xs" aria-hidden="true">↑</span> y
                <span class="btn btn-ghost btn-xs" aria-hidden="true">↓</span>.
              </li>
              <li>
                Pulsa <span class="btn btn-primary btn-sm" aria-hidden="true">Exportar PDF</span> para
                descargar el documento con las fichas en orden, cada una con su cita completa.
              </li>
              <li>
                También puedes abrir el <a class="link" href="/cards/compose">compositor completo</a
                > para una edición más amplia.
              </li>
            </ol>
            <!-- TODO: GIF corto del reordenado + exportación -->
          </div>
        </div>

        <div id="indice" class="collapse collapse-arrow join-item">
          <input type="radio" name="guia-accordion" />
          <div class="collapse-title text-base font-semibold">Índice y navegación rápida</div>
          <div class="collapse-content">
            <p class="text-base-content/80">
              La barra lateral derecha (botón
              <span class="btn btn-primary btn-sm" aria-hidden="true">Índice</span> en el móvil) lista
              todas las tarjetas del libro actual. Haz clic en una entrada para saltar directamente a
              esa tarjeta.
            </p>
            <!-- TODO: captura de pantalla del índice -->
          </div>
        </div>

        <div id="grafo" class="collapse collapse-arrow join-item">
          <input type="radio" name="guia-accordion" />
          <div class="collapse-title text-base font-semibold">
            Explorar la red de relaciones (grafo)
          </div>
          <div class="collapse-content">
            <p class="text-base-content/80">
              Cada tarjeta puede estar conectada con otras mediante <em>relaciones</em>. La vista de
              red las muestra como un grafo interactivo para descubrir vínculos entre autores y
              obras.
            </p>
            <ol class="mt-2 list-decimal space-y-2 pl-5 text-base-content/80">
              <li>
                Abre una tarjeta y pulsa su botón
                <span class="btn btn-xs btn-ghost" aria-hidden="true">relacionadas</span>.
              </li>
              <li>
                En el panel de <em>Tarjetas relacionadas</em>, pulsa
                <span class="btn btn-soft btn-sm" aria-hidden="true">Explorar en red &rarr;</span>.
              </li>
              <li>
                En el grafo, cada <strong>nodo</strong> es una tarjeta y cada <strong>línea</strong>
                una relación. Los colores indican el autor (abre la
                <span class="btn btn-ghost btn-xs" aria-hidden="true">leyenda</span> para verlos).
              </li>
              <li>
                Usa el control de <strong>profundidad</strong> (1–3) para ver más o menos niveles de relaciones;
                la rueda del ratón hace zoom y puedes arrastrar para moverte por el lienzo.
              </li>
              <li>
                Haz clic en un nodo para ver su vista previa, abrir su propia red o saltar a la
                tarjeta completa.
              </li>
            </ol>
            <!-- TODO: captura de pantalla del grafo -->
          </div>
        </div>
      </div>
    </div>
  </PageSection>
</div>
