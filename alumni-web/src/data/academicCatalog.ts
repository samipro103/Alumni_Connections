export type AcademicUniversity = {
  id: string
  name: string
  shortName: string
  mark: "shield" | "circle" | "diamond" | "arch" | "hex" | "book"
  careers: string[]
}

export const ACADEMIC_UNIVERSITIES: AcademicUniversity[] = [
  {
    id: "ugb",
    name: "Universidad Gerardo Barrios",
    shortName: "UGB",
    mark: "diamond",
    careers: [
      "Arquitectura",
      "Doctorado en Medicina",
      "Ingeniería Agroindustrial",
      "Ingeniería Civil",
      "Ingeniería Industrial",
      "Ingeniería en Inteligencia de Negocios",
      "Ingeniería en Sistemas y Redes Informáticas",
      "Licenciatura en Administración de Empresas",
      "Licenciatura en Administración de Empresas y Desarrollo Turístico",
      "Licenciatura en Ciencias Jurídicas",
      "Licenciatura en Comunicaciones",
      "Licenciatura en Contaduría Pública",
      "Licenciatura en Enfermería",
      "Licenciatura en Idioma Inglés",
      "Licenciatura en Marketing y Negocios Digitales",
      "Licenciatura en Psicología",
      "Licenciatura en Relaciones y Negocios Internacionales",
      "Profesorado en Educación Inicial y Parvularia",
      "Profesorado en Idioma Inglés para Tercer Ciclo de Educación Básica y Media",
      "Profesorado en Lenguaje y Literatura para Tercer Ciclo de Educación Básica y Media",
      "Profesorado en Matemática para Tercer Ciclo de Educación Básica y Media",
      "Técnico en Diseño Gráfico",
      "Técnico en Enfermería",
      "Técnico en Idioma Inglés",
      "Técnico en Ingeniería Civil y Construcción",
      "Técnico en Ingeniería en Sistemas y Redes Informáticas",
      "Técnico en Marketing y Publicidad Digital"
    ]
  },
  {
    id: "uca",
    name: "Universidad Centroamericana José Simeón Cañas",
    shortName: "UCA",
    mark: "arch",
    careers: [
      "Arquitectura",
      "Ingeniería de Alimentos",
      "Ingeniería Civil",
      "Ingeniería Eléctrica",
      "Ingeniería Energética",
      "Ingeniería Industrial",
      "Ingeniería Informática",
      "Ingeniería Mecánica",
      "Ingeniería Química",
      "Licenciatura en Administración de Empresas",
      "Licenciatura en Ciencias Jurídicas",
      "Licenciatura en Ciencias Sociales",
      "Licenciatura en Comunicación Social",
      "Licenciatura en Contaduría Pública",
      "Licenciatura en Diseño",
      "Licenciatura en Economía",
      "Licenciatura en Filosofía",
      "Licenciatura en Finanzas",
      "Licenciatura en Idioma Inglés",
      "Licenciatura en Mercadeo",
      "Licenciatura en Psicología",
      "Licenciatura en Teología",
      "Profesorado en Teología",
      "Técnico en Contaduría",
      "Técnico en Desarrollo de Software",
      "Técnico en Marketing Digital",
      "Técnico en Producción Multimedia"
    ]
  },
  {
    id: "ues",
    name: "Universidad de El Salvador",
    shortName: "UES",
    mark: "shield",
    careers: [
      "Ingeniería Agronómica",
      "Ingeniería Agroindustrial",
      "Ingeniería de Sistemas Informáticos",
      "Ingeniería Geológica",
      "Ingeniería Industrial",
      "Licenciatura en Administración de Empresas",
      "Licenciatura en Antropología Sociocultural",
      "Licenciatura en Biología",
      "Licenciatura en Biología Marina",
      "Licenciatura en Ciencias Químicas",
      "Licenciatura en Contaduría Pública",
      "Licenciatura en Economía",
      "Licenciatura en Enseñanza de las Ciencias Naturales",
      "Licenciatura en Enseñanza de la Matemática",
      "Licenciatura en Enseñanza del Inglés",
      "Licenciatura en Estadística y Ciencia de Datos",
      "Licenciatura en Filosofía",
      "Licenciatura en Física",
      "Licenciatura en Geofísica",
      "Licenciatura en Historia",
      "Licenciatura en Informática Educativa",
      "Licenciatura en Matemática",
      "Licenciatura en Medicina Veterinaria y Zootecnia",
      "Licenciatura en Mercadeo Internacional",
      "Licenciatura en Sociología"
    ]
  },
  {
    id: "udb",
    name: "Universidad Don Bosco",
    shortName: "UDB",
    mark: "circle",
    careers: [
      "Licenciatura en Ciencias de la Comunicación",
      "Licenciatura en Diseño Gráfico",
      "Licenciatura en Idiomas con Especialidad en la Adquisición de Lenguas Extranjeras",
      "Licenciatura en Idiomas con Especialidad en Turismo",
      "Licenciatura en Marketing",
      "Técnico en Asesoría Financiera Sostenible",
      "Técnico en Diseño Gráfico",
      "Técnico en Gestión del Talento Humano",
      "Técnico en Guía de Turismo Bilingüe",
      "Técnico en Ingeniería en Computación",
      "Técnico en Multimedia"
    ]
  },
  {
    id: "uees",
    name: "Universidad Evangélica de El Salvador",
    shortName: "UEES",
    mark: "book",
    careers: [
      "Doctorado en Cirugía Dental",
      "Doctorado en Medicina",
      "Ingeniería en Desarrollo de Software y Ciencia de Datos",
      "Ingeniería en Tecnologías Emergentes y Robótica",
      "Licenciatura en Administración de Empresas",
      "Licenciatura en Ciencias Jurídicas",
      "Licenciatura en Enfermería",
      "Licenciatura en Lenguas Modernas en Inglés y Francés",
      "Licenciatura en Marketing",
      "Licenciatura en Nutrición y Dietética",
      "Licenciatura en Psicología",
      "Licenciatura en Relaciones Públicas con especialidad en Marketing",
      "Licenciatura en Relaciones y Negocios Internacionales",
      "Licenciatura en Teología",
      "Licenciatura en Traducción e Interpretación del Idioma Inglés",
      "Profesorado y Licenciatura en Educación Inicial y Parvularia",
      "Técnico en Asistencia Odontológica",
      "Técnico en Ciberseguridad",
      "Técnico en Enfermería",
      "Técnico en Marketing Digital"
    ]
  },
  {
    id: "utec",
    name: "Universidad Tecnológica de El Salvador",
    shortName: "UTEC",
    mark: "hex",
    careers: [
      "Arquitectura",
      "Ingeniería en Sistemas y Computación",
      "Ingeniería Industrial",
      "Licenciatura en Administración de Empresas",
      "Licenciatura en Administración de Empresas con énfasis en Computación",
      "Licenciatura en Administración de Empresas Turísticas",
      "Licenciatura en Antropología",
      "Licenciatura en Arqueología",
      "Licenciatura en Ciencias Jurídicas",
      "Licenciatura en Comunicaciones",
      "Licenciatura en Contaduría Pública",
      "Licenciatura en Diseño Gráfico",
      "Licenciatura en Idioma Inglés",
      "Licenciatura en Informática",
      "Licenciatura en Mercadeo",
      "Licenciatura en Negocios Internacionales",
      "Licenciatura en Psicología",
      "Técnico en Administración Turística",
      "Técnico en Diseño Gráfico",
      "Técnico en Ingeniería de Hardware",
      "Técnico en Ingeniería de Redes Computacionales",
      "Técnico en Ingeniería de Software",
      "Técnico en Mercadeo y Ventas",
      "Técnico en Periodismo",
      "Técnico en Relaciones Públicas"
    ]
  }
]

export const UNIVERSITY_ALIASES: Record<string, string> = {
  "universidad gerardo barrios": "ugb",
  "ugb": "ugb",
  "universidad centroamericana jose simeon canas": "uca",
  "universidad centroamericana josé simeón cañas": "uca",
  "uca": "uca",
  "universidad de el salvador": "ues",
  "ues": "ues",
  "universidad don bosco": "udb",
  "udb": "udb",
  "universidad evangelica de el salvador": "uees",
  "universidad evangélica de el salvador": "uees",
  "uees": "uees",
  "universidad tecnologica de el salvador": "utec",
  "universidad tecnológica de el salvador": "utec",
  "utec": "utec"
}

export function normalizeAcademicText(value?: string | null) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

export function findUniversity(value?: string | null) {
  const normalized = normalizeAcademicText(value)
  const alias = UNIVERSITY_ALIASES[normalized]
  if (alias) return ACADEMIC_UNIVERSITIES.find((u) => u.id === alias) ?? null

  return (
    ACADEMIC_UNIVERSITIES.find(
      (u) =>
        normalizeAcademicText(u.name) === normalized ||
        normalizeAcademicText(u.shortName) === normalized
    ) ?? null
  )
}

export function careersForUniversity(value?: string | null) {
  return findUniversity(value)?.careers ?? []
}
