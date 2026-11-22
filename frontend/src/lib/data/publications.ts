/**
 * Publication metadata keyed by the PDF file stem (the `title` returned by
 * `listPdfResources`). Authors are listed in the order printed on the paper.
 *
 * Missing entries simply render without an author or venue line.
 */
export interface PublicationMeta {
  /** Display title when it differs from the PDF file name. */
  title?: string;
  authors: string[];
  /** Journal or volume where the work was published. */
  venue?: string;
  /** Issue within the venue, e.g. "N° 26". */
  issue?: string;
  year?: number;
}

export const PUBLICATION_META: Record<string, PublicationMeta> = {
  'Catulo sujeto de la enunciación y Catulo sujeto narrativo': {
    authors: ['Mariel Balza', 'Valmore Agelvis'],
    venue: 'Lengua y Habla',
    issue: 'N° 26',
    year: 2022,
  },
  'El significado performativo en el discurso político. Significado indirecto y las implicaturas con significado presumible en el discurso político venezolano':
  {
    authors: ['Valmore Agelvis', 'Rostym Sulbarán'],
    venue: 'Lengua y Habla',
    issue: 'N° 25',
    year: 2021,
  },
  'La autocontradicción en enunciados de doble negación, menos por menos da más': {
    title: 'La autocontradicción en enunciados de doble negación: menos por menos da más',
    authors: ['Valmore Agelvis'],
    venue: 'Lengua y Habla',
    issue: 'N° 26',
    year: 2022,
  },
  'Las implicaturas conversacionales generalizadas y particularizadas en las manchetas del diario El Nacional':
  {
    authors: ['Valmore Agelvis', 'Frank Arellano'],
    venue: 'Lengua y Habla',
    issue: 'N° 19',
    year: 2015,
  },
  'Léxico fraseológico en el habla de Mérida': {
    authors: ['Valmore Agelvis', 'Nelson Rojas', 'Raquel Vento'],
    venue: 'Lengua y Habla',
    issue: 'N° 13',
    year: 2009,
  },
  'Me tiene controlada la habla acercamiento al discurso esquizofrénico desde la semiótica de las pasiones':
  {
    title:
      'Me tiene controlada la habla: acercamiento al discurso esquizofrénico desde la semiótica de las pasiones',
    authors: ['Jhennifer Rodríguez', 'Valmore Agelvis', 'Hernán Martínez'],
    venue: 'Lengua y Habla',
    issue: 'N° 19',
    year: 2015,
  },
};

export function publicationMeta(title: string): PublicationMeta | undefined {
  return PUBLICATION_META[title];
}

/** Venue line: "Lengua y Habla · N° 26 · 2022". */
export function publicationSource(meta: PublicationMeta | undefined): string {
  if (!meta) {
    return '';
  }
  return [meta.venue, meta.issue, meta.year?.toString()].filter(Boolean).join(' · ');
}
