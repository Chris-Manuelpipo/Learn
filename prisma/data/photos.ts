// Visuels de démonstration, chargés depuis les CDN publics d'Unsplash et de pravatar.cc.

const unsplash = (id: string, variant = 0) => {
  // Variantes de cadrage : une même photo reste visuellement distincte d'un cours à l'autre.
  const crop = ["", "&crop=focalpoint&fp-x=0.3&fp-y=0.45&fp-z=1.6", "&crop=focalpoint&fp-x=0.7&fp-y=0.55&fp-z=1.8"][variant];
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=70&w=1200&h=750${crop}`;
};

// Une couverture par cours, dans l'ordre des cours de chaque catégorie (prisma/data/courses.ts).
const COVERS: Record<string, [string, number][]> = {
  "developpement-web": [
    ["1517694712202-14dd9538aa97", 0],
    ["1461749280684-dccba630e2f6", 0],
    ["1555066931-4365d14bab8c", 0],
    ["1498050108023-c5249f4df085", 0],
    ["1542831371-29b0f74f9713", 0],
    ["1580894894513-541e068a3e2b", 0],
    ["1587620962725-abab7fe55159", 0],
    ["1531482615713-2afd69097998", 0],
    ["1519389950473-47ba0277781c", 0],
    ["1558494949-ef010cbdcc31", 0],
  ],
  "data-ia": [
    ["1526374965328-7f61d4dc18c5", 0],
    ["1551288049-bebda4e38f71", 0],
    ["1518770660439-4636190af475", 0],
    ["1677442136019-21780ecad995", 0],
    ["1544197150-b99a580bb7a8", 0],
    ["1550751827-4bd374c3f58b", 0],
    ["1504868584819-f8e8b4b6d7e3", 0],
    ["1434030216411-0b793f4b4173", 0],
    ["1573164713714-d95e436ab8d6", 0],
    ["1460925895917-afdab827c52f", 0],
  ],
  "design-ux": [
    ["1558655146-9f40138edfeb", 0],
    ["1586717791821-3f44a563fa4c", 0],
    ["1545235617-9465d2a55698", 0],
    ["1581291518857-4e27b48ff24e", 0],
    ["1561070791-2526d30994b5", 0],
    ["1551650975-87deedd944c3", 0],
    ["1522202176988-66273c2fd55f", 0],
    ["1432888498266-38ffec3eaf0a", 0],
    ["1499750310107-5fef28a66643", 0],
    ["1456513080510-7bf3a84b82f8", 0],
  ],
  business: [
    ["1556761175-5973dc0f32e7", 0],
    ["1554224154-26032ffc0d07", 0],
    ["1552664730-d307ca884978", 0],
    ["1507679799987-c73779587ccf", 0],
    ["1542744173-8e7e53415bb0", 0],
    ["1573164713714-d95e436ab8d6", 1],
    ["1519389950473-47ba0277781c", 1],
    ["1524178232363-1fb2b075b655", 0],
    ["1555774698-0b77e0d5fac6", 0],
    ["1451187580459-43490279c0fa", 0],
  ],
  marketing: [
    ["1557838923-2985c318be48", 0],
    ["1460925895917-afdab827c52f", 1],
    ["1512941937669-90a1b58e7e9c", 0],
    ["1555774698-0b77e0d5fac6", 1],
    ["1533750349088-cd871a92f312", 0],
    ["1551650975-87deedd944c3", 1],
    ["1499750310107-5fef28a66643", 1],
    ["1507679799987-c73779587ccf", 1],
    ["1611974789855-9c2a0a7236a3", 0],
    ["1551288049-bebda4e38f71", 1],
  ],
  langues: [
    ["1543269865-cbf427effbad", 0],
    ["1523240795612-9a054b0db644", 0],
    ["1456513080510-7bf3a84b82f8", 1],
    ["1503676260728-1c00da094a0b", 0],
    ["1543269865-cbf427effbad", 1],
    ["1522202176988-66273c2fd55f", 1],
    ["1434030216411-0b793f4b4173", 1],
    ["1524178232363-1fb2b075b655", 1],
    ["1523240795612-9a054b0db644", 1],
    ["1503676260728-1c00da094a0b", 1],
  ],
  mobile: [
    ["1512941937669-90a1b58e7e9c", 1],
    ["1551650975-87deedd944c3", 2],
    ["1607252650355-f7fd0460ccdb", 0],
    ["1555774698-0b77e0d5fac6", 2],
    ["1545235617-9465d2a55698", 1],
    ["1563986768609-322da13575f3", 0],
    ["1512941937669-90a1b58e7e9c", 2],
    ["1579621970563-ebec7560ff3e", 0],
    ["1587620962725-abab7fe55159", 1],
    ["1621761191319-c6fb62004040", 0],
  ],
  "cloud-securite": [
    ["1550751827-4bd374c3f58b", 1],
    ["1526374965328-7f61d4dc18c5", 1],
    ["1558494949-ef010cbdcc31", 1],
    ["1451187580459-43490279c0fa", 1],
    ["1526374965328-7f61d4dc18c5", 2],
    ["1580894894513-541e068a3e2b", 1],
    ["1558494949-ef010cbdcc31", 2],
    ["1544197150-b99a580bb7a8", 1],
    ["1563986768609-322da13575f3", 1],
    ["1518770660439-4636190af475", 1],
  ],
  "developpement-personnel": [
    ["1434030216411-0b793f4b4173", 2],
    ["1499750310107-5fef28a66643", 2],
    ["1524178232363-1fb2b075b655", 2],
    ["1522202176988-66273c2fd55f", 2],
    ["1507679799987-c73779587ccf", 2],
    ["1456513080510-7bf3a84b82f8", 2],
    ["1506126613408-eca07ce68773", 0],
    ["1432888498266-38ffec3eaf0a", 1],
    ["1523240795612-9a054b0db644", 2],
    ["1543269865-cbf427effbad", 2],
  ],
  finance: [
    ["1579621970563-ebec7560ff3e", 1],
    ["1554224155-6726b3ff858f", 0],
    ["1611974789855-9c2a0a7236a3", 1],
    ["1621761191319-c6fb62004040", 1],
    ["1554224154-26032ffc0d07", 1],
    ["1460925895917-afdab827c52f", 2],
    ["1504868584819-f8e8b4b6d7e3", 1],
    ["1579621970563-ebec7560ff3e", 2],
    ["1551288049-bebda4e38f71", 2],
    ["1556761175-5973dc0f32e7", 1],
  ],
};

export function courseCover(category: string, index: number) {
  const entry = COVERS[category]?.[index];
  return entry ? unsplash(entry[0], entry[1]) : null;
}

// Photo d'illustration de l'accueil : deux apprenants au travail.
export const HERO_PHOTO = unsplash("1531482615713-2afd69097998");

// Portraits pravatar.cc retenus (les photos fantaisistes ou d'enfants sont écartées), classés par genre.
const pravatar = (n: number) => `https://i.pravatar.cc/300?img=${n}`;

export const INSTRUCTOR_PHOTOS: Record<string, number> = {
  "Aïcha Mbarga": 16,
  "Thomas Dubois": 13,
  "Ibrahim Diallo": 51,
  "Prisca Owona": 34,
  "Léa Martin": 36,
  "Junior Ekambi": 56,
  "Fatou Ndiaye": 35,
  "Michel Atangana": 59,
  "Estelle Kamga": 44,
  "Karim Traoré": 12,
  "Grace Moukoko": 42,
  "Daniel Fotso": 18,
  "Rachel Ngono": 32,
  "Samuel Essomba": 68,
  "Hawa Camara": 48,
  "Nadège Fokou": 26,
  "Olivier Kouassi": 53,
  "Mariam Sylla": 47,
};

export const DEMO_STUDENT_PHOTO = pravatar(8);

const FEMALE_FIRST_NAMES = new Set([
  "Aïcha", "Chantal", "Estelle", "Grace", "Inès", "Laure", "Nadège", "Prisca", "Rachel", "Tatiana", "Vanessa", "Yasmine", "Carine", "Dorothée",
  "Fatou", "Hawa", "Joëlle", "Léa", "Nina", "Rokia", "Sandrine", "Awa", "Diane", "Flora", "Ivana", "Kelly", "Mariam", "Ruth", "Thècle", "Zoé", "Orphée",
]);

const STUDENT_PHOTOS = {
  f: [5, 9, 10, 19, 20, 21, 23, 24, 25, 27, 28, 29, 30, 31, 38, 40, 41, 43, 45, 49],
  m: [3, 7, 11, 14, 17, 33, 52, 54, 55, 57, 58, 60, 61, 62, 63, 64, 65, 67, 70],
};

/** Attribue un portrait unique à certains étudiants ; les autres gardent leurs initiales. */
export function studentPhoto(fullName: string, chance: () => number) {
  const pool = FEMALE_FIRST_NAMES.has(fullName.split(" ")[0]) ? STUDENT_PHOTOS.f : STUDENT_PHOTOS.m;
  if (!pool.length || chance() > 0.5) return null;
  return pravatar(pool.shift()!);
}

export const instructorPhoto = (name: string) => (INSTRUCTOR_PHOTOS[name] ? pravatar(INSTRUCTOR_PHOTOS[name]) : null);
