import { PrismaClient, type Prisma, type Level } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { CATEGORIES, QUESTION_BANK, type Lvl } from "./data/courses";
import { BADGES } from "../src/lib/badges";
import { courseCover, DEMO_STUDENT_PHOTO, instructorPhoto, studentPhoto } from "./data/photos";

const db = new PrismaClient();

// PRNG déterministe pour un seed reproductible.
let state = 20261103;
function rand() {
  state |= 0;
  state = (state + 0x6d2b79f5) | 0;
  let t = Math.imul(state ^ (state >>> 15), 1 | state);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const int = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;
const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];
const shuffle = <T,>(arr: readonly T[]) => [...arr].sort(() => rand() - 0.5);
const id = () => randomUUID();
const daysAgo = (d: number, h = int(7, 22)) => {
  const date = new Date();
  date.setDate(date.getDate() - d);
  date.setHours(h, int(0, 59), 0, 0);
  if (date.getTime() > Date.now()) return new Date(Date.now() - int(5, 240) * 60000);
  return date;
};
const slugify = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70);

const LEVELS: Record<Lvl, Level> = { B: "BEGINNER", I: "INTERMEDIATE", A: "ADVANCED" };

// Vidéos libres de droits servies localement (public/videos) : la démo fonctionne même hors-ligne.
const VIDEOS = ["/videos/sintel-trailer.mp4", "/videos/bunny-trailer.mp4", "/videos/flower.mp4", "/videos/movie.mp4", "/videos/bunny-10s.mp4"];

const FIRST = ["Aïcha", "Brice", "Chantal", "Daniel", "Estelle", "Fabrice", "Grace", "Hervé", "Inès", "Junior", "Kevin", "Laure", "Michel", "Nadège", "Olivier", "Prisca", "Quentin", "Rachel", "Samuel", "Tatiana", "Ulrich", "Vanessa", "William", "Yasmine", "Zacharie", "Armel", "Blaise", "Carine", "Dorothée", "Emmanuel", "Fatou", "Gaël", "Hawa", "Ibrahim", "Joëlle", "Karim", "Léa", "Moussa", "Nina", "Oumar", "Patrick", "Rokia", "Sandrine", "Thierry", "Awa", "Boris", "Cédric", "Diane", "Éric", "Flora", "Ghislain", "Hugo", "Ivana", "Jordan", "Kelly", "Lionel", "Mariam", "Noël", "Orphée", "Paul", "Ruth", "Steve", "Thècle", "Valdès", "Wilfried", "Yvan", "Zoé"];
const LAST = ["Mbarga", "Nkoulou", "Fotso", "Tchoumi", "Essomba", "Ndiaye", "Kamga", "Diallo", "Mballa", "Ngono", "Atangana", "Traoré", "Owona", "Bello", "Koné", "Ekambi", "Tchakounté", "Manga", "Ndongo", "Sow", "Fokou", "Abena", "Eto'o", "Biya", "Moukoko", "Djeumen", "Kouam", "Onana", "Mvondo", "Ngassa", "Dubois", "Martin", "Lefèvre", "Mendy", "Camara", "Toure", "Yao", "Kouassi", "Sylla", "Keita"];
const COUNTRIES = ["Cameroun", "Cameroun", "Cameroun", "Sénégal", "Côte d'Ivoire", "Gabon", "France", "Belgique", "Canada", "Bénin", "Togo", "Mali", "Congo"];
const COLORS = ["violet", "coral", "mint", "sky", "sun", "pink", "lime", "ocean"];

const REVIEWS: [number, string][] = [
  [5, "Exactement ce qu'il me fallait. Les explications sont limpides et les quiz m'ont vraiment aidé à retenir."],
  [5, "Le meilleur cours que j'ai suivi en ligne. Rythme parfait, on ne s'ennuie jamais."],
  [5, "Super pédagogie ! Les chapitres courts permettent d'avancer même avec un emploi du temps chargé."],
  [5, "J'ai obtenu mon certificat et je l'ai ajouté à LinkedIn. Merci pour ce contenu de qualité !"],
  [5, "Formateur passionné et passionnant. Les exemples concrets font toute la différence."],
  [4, "Très bon cours, quelques passages un peu rapides mais les fiches mémo compensent largement."],
  [4, "Contenu riche et bien structuré. J'aurais aimé encore plus d'exercices pratiques."],
  [5, "Je partais de zéro et maintenant je me sens vraiment à l'aise. Bravo !"],
  [4, "Clair, efficace, bien rythmé. Je recommande à tous les débutants."],
  [5, "Les quiz à la fin de chaque chapitre sont une excellente idée pour vérifier qu'on a compris."],
  [3, "Bon cours dans l'ensemble, mais certaines vidéos mériteraient d'être actualisées."],
  [5, "Une vraie mine d'or. J'ai déjà appliqué plusieurs techniques dans mon travail."],
  [4, "Très pratique, j'apprends dans le bus grâce aux leçons courtes. Top !"],
  [5, "Le système de séries de jours m'a motivé à apprendre tous les jours. Addictif dans le bon sens !"],
  [4, "Bien expliqué, avec de bons exemples. Le chapitre final est particulièrement réussi."],
  [5, "Accessible, moderne, motivant. Exactement l'expérience que j'attendais."],
  [3, "Intéressant, mais j'aurais aimé un niveau un peu plus avancé sur la fin."],
  [5, "J'ai adoré la progression étape par étape. On sent que le cours a été pensé pour nous."],
];

const MIDDLE_LESSONS: [string, "VIDEO" | "ARTICLE"][] = [
  ["Démonstration pas à pas", "VIDEO"],
  ["Atelier pratique", "VIDEO"],
  ["Les erreurs fréquentes", "VIDEO"],
  ["Cas concret", "VIDEO"],
  ["Fiche mémo : l'essentiel", "ARTICLE"],
  ["Exercice guidé", "VIDEO"],
  ["Aller plus loin", "ARTICLE"],
  ["Astuces de pro", "VIDEO"],
];

const OUTCOME_SUFFIX = [
  " : les notions clés expliquées simplement",
  " : mise en pratique sur des cas réels",
  " : les bonnes pratiques des pros",
  " : sans tomber dans les pièges classiques",
];

const REQUIREMENTS: Record<Lvl, string[]> = {
  B: ["Aucun prérequis : on part de zéro", "Un ordinateur ou un smartphone avec une connexion internet", "L'envie d'apprendre 15 minutes par jour"],
  I: ["Avoir acquis les bases du domaine", "Un ordinateur avec une connexion internet", "Être prêt·e à pratiquer entre les leçons"],
  A: ["Une expérience solide du domaine", "Être à l'aise avec les concepts intermédiaires", "Du temps pour les projets pratiques"],
};

function article(courseTitle: string, chapter: string, lesson: string) {
  return `## Objectifs de la leçon

- Comprendre le rôle de **${chapter}** dans « ${courseTitle} »
- Identifier les notions clés à retenir
- Savoir les appliquer dans une situation concrète

## L'essentiel

Dans cette leçon, « ${lesson} », chaque idée est décomposée en petites étapes. C'est volontaire : on retient mieux des informations courtes, reliées entre elles et revues régulièrement.

Lisez d'abord cette fiche une première fois sans prendre de notes. Fermez-la ensuite et reformulez les points importants avec vos propres mots : c'est le **rappel actif**, l'une des techniques d'apprentissage les plus efficaces.

### Les trois idées à retenir

1. Une notion n'est comprise que lorsqu'on peut l'expliquer simplement.
2. La pratique régulière vaut mieux qu'une longue session isolée.
3. Les erreurs font partie du processus : elles indiquent ce qu'il faut revoir.

> **Conseil** — Notez dans l'onglet « Mes notes » une question qui reste ouverte. Vous y reviendrez après le quiz du chapitre.

## Pour aller plus loin

Appliquez dès aujourd'hui ce que vous venez d'apprendre sur un petit exemple personnel. Dix minutes de pratique suffisent pour ancrer durablement la leçon.`;
}

type Method = "CARD" | "ORANGE_MONEY" | "MTN_MOMO" | "PAYPAL";

// Parcours de l'étudiant de démo : [formation, commencée il y a N jours, avis laissé, moyen de paiement]
const DEMO_COMPLETED: [string, number, boolean, Method?][] = [
  ["anglais-les-bases-pour-debutants", 150, true],
  ["html-css-creer-votre-premier-site", 120, true],
  ["git-github-sans-prise-de-tete", 100, false],
  ["javascript-moderne-de-zero", 85, true, "MTN_MOMO"],
  ["apprendre-a-apprendre", 60, true],
  ["ux-design-les-fondamentaux", 48, false, "ORANGE_MONEY"],
  ["sql-interroger-les-bases-de-donnees", 32, true, "CARD"],
];
// [formation, progression %, commencée il y a N jours, moyen de paiement]
const DEMO_IN_PROGRESS: [string, number, number, Method?][] = [
  ["react-19-interfaces-reactives", 60, 25, "MTN_MOMO"],
  ["ia-generative-et-prompt-engineering", 40, 18, "ORANGE_MONEY"],
  ["figma-de-a-a-z", 25, 12, "ORANGE_MONEY"],
  ["python-les-fondamentaux", 10, 4],
];

async function main() {
  console.log("Nettoyage…");
  await db.$transaction([
    db.notification.deleteMany(),
    db.activity.deleteMany(),
    db.userBadge.deleteMany(),
    db.badge.deleteMany(),
    db.favorite.deleteMany(),
    db.note.deleteMany(),
    db.review.deleteMany(),
    db.certificate.deleteMany(),
    db.payment.deleteMany(),
    db.lessonProgress.deleteMany(),
    db.enrollment.deleteMany(),
    db.quizAttempt.deleteMany(),
    db.course.deleteMany(),
    db.category.deleteMany(),
    db.instructorApplication.deleteMany(),
    db.user.deleteMany(),
  ]);

  console.log("Badges…");
  await db.badge.createMany({ data: BADGES.map((b) => ({ ...b })) });
  const badges = await db.badge.findMany();
  const badgeBySlug = Object.fromEntries(badges.map((b) => [b.slug, b]));

  console.log("Utilisateurs…");
  const password = await bcrypt.hash("Learn2026!", 10);
  const usedUsernames = new Set<string>();
  const uname = (name: string) => {
    let base = slugify(name).replace(/-/g, ".");
    let u = base;
    let i = 1;
    while (usedUsernames.has(u)) u = `${base}${++i}`;
    usedUsernames.add(u);
    return u;
  };

  const admin = await db.user.create({
    data: { name: "Équipe Learn", username: uname("admin"), email: "admin@learn.dev", passwordHash: password, role: "ADMIN", avatarColor: "violet", headline: "Administration de la plateforme", country: "Cameroun", xp: 0 },
  });

  const instructorProfiles = [
    ["Aïcha Mbarga", "Développeuse full-stack & mentor", "developpement-web"],
    ["Thomas Dubois", "Architecte web, ex-lead tech", "developpement-web"],
    ["Ibrahim Diallo", "Data scientist & chercheur en IA", "data-ia"],
    ["Prisca Owona", "Analyste data, formatrice certifiée", "data-ia"],
    ["Léa Martin", "Product designer senior", "design-ux"],
    ["Junior Ekambi", "Directeur artistique", "design-ux"],
    ["Fatou Ndiaye", "Entrepreneure en série, coach startup", "business"],
    ["Michel Atangana", "Consultant en stratégie", "business"],
    ["Estelle Kamga", "Growth marketer", "marketing"],
    ["Karim Traoré", "Expert SEO & contenu", "marketing"],
    ["Grace Moukoko", "Professeure de langues, polyglotte", "langues"],
    ["Daniel Fotso", "Développeur mobile Flutter & Kotlin", "mobile"],
    ["Rachel Ngono", "Ingénieure iOS", "mobile"],
    ["Samuel Essomba", "Ingénieur cloud & sécurité", "cloud-securite"],
    ["Hawa Camara", "Pentesteuse certifiée", "cloud-securite"],
    ["Nadège Fokou", "Psychologue & coach en apprentissage", "developpement-personnel"],
    ["Olivier Kouassi", "Analyste financier", "finance"],
    ["Mariam Sylla", "Experte-comptable", "finance"],
  ] as const;

  const instructors = [];
  for (const [i, [name, headline, cat]] of instructorProfiles.entries()) {
    instructors.push(
      await db.user.create({
        data: {
          name,
          username: uname(name),
          email: i === 0 ? "formateur@learn.dev" : `${slugify(name).replace(/-/g, ".")}@learn.dev`,
          passwordHash: password,
          role: "INSTRUCTOR",
          instructorVerified: i % 5 !== 4,
          headline,
          expertise: cat,
          bio: `${headline}. J'accompagne des apprenants depuis plus de ${int(4, 12)} ans, avec une conviction : on apprend mieux en pratiquant, pas à pas, à son rythme.`,
          avatarUrl: instructorPhoto(name),
          avatarColor: pick(COLORS),
          country: pick(COUNTRIES),
          xp: int(300, 2500),
          createdAt: daysAgo(int(200, 500)),
        },
      }),
    );
  }

  const studentRows: Prisma.UserCreateManyInput[] = [];
  for (let i = 0; i < 240; i++) {
    const name = `${pick(FIRST)} ${pick(LAST)}`;
    studentRows.push({
      id: id(),
      name,
      username: uname(name),
      email: `${slugify(name).replace(/-/g, ".")}.${i}@exemple.cm`,
      passwordHash: password,
      avatarUrl: studentPhoto(name, rand),
      avatarColor: pick(COLORS),
      country: pick(COUNTRIES),
      headline: pick(["Étudiant·e en informatique", "Développeur·se junior", "Entrepreneur·e", "En reconversion", "Étudiant·e en gestion", "Passionné·e de design", "Chef de projet", "Lycéen·ne curieux·se", null]),
      dailyGoalMinutes: pick([10, 15, 15, 20, 30]),
      createdAt: daysAgo(int(10, 300)),
    });
  }
  await db.user.createMany({ data: studentRows });

  const demo = await db.user.create({
    data: {
      name: "Alex Nkoulou",
      username: uname("alex"),
      email: "etudiant@learn.dev",
      passwordHash: password,
      avatarUrl: DEMO_STUDENT_PHOTO,
      avatarColor: "coral",
      headline: "Étudiant en génie logiciel",
      bio: "Curieux de tout, j'apprends le développement web et le design en parallèle de mes études.",
      country: "Cameroun",
      dailyGoalMinutes: 20,
      createdAt: daysAgo(45),
    },
  });

  console.log("Catégories et cours…");
  const courseRows: Prisma.CourseCreateManyInput[] = [];
  const chapterRows: Prisma.ChapterCreateManyInput[] = [];
  const lessonRows: Prisma.LessonCreateManyInput[] = [];
  const quizRows: Prisma.QuizCreateManyInput[] = [];
  const questionRows: Prisma.QuestionCreateManyInput[] = [];
  const optionRows: Prisma.OptionCreateManyInput[] = [];

  type CourseMeta = { id: string; slug: string; price: number; certified: boolean; lessons: { id: string; minutes: number; type: string }[]; finalQuizId: string; quizIds: string[]; published: boolean; instructorId: string };
  const courses: CourseMeta[] = [];

  const addQuestions = (quizId: string, bank: (typeof QUESTION_BANK)[string], count: number) => {
    shuffle(bank)
      .slice(0, count)
      .forEach(([text, answers, explanation], qi) => {
        const qid = id();
        questionRows.push({ id: qid, quizId, text, explanation, position: qi });
        shuffle(answers.map((a, ai) => ({ a, correct: ai === 0 }))).forEach((o, oi) =>
          optionRows.push({ id: id(), questionId: qid, text: o.a, isCorrect: o.correct, position: oi }),
        );
      });
  };

  let courseIndex = 0;
  for (const cat of CATEGORIES) {
    const category = await db.category.create({ data: { name: cat.name, slug: cat.slug, icon: cat.icon, color: cat.color } });
    const catInstructors = instructors.filter((u) => u.expertise === cat.slug);
    const bank = QUESTION_BANK[cat.slug];

    for (const [ci, [title, subtitle, lvl, price, chapters]] of cat.courses.entries()) {
      const courseId = id();
      const slug = slugify(title);
      const instructor = catInstructors[ci % catInstructors.length];
      const certified = price > 0 || ci % 2 === 0;
      const published = !(courseIndex === 9 || courseIndex === 38);
      const meta: CourseMeta = { id: courseId, slug, price, certified, lessons: [], finalQuizId: id(), quizIds: [], published, instructorId: instructor.id };
      let duration = 0;

      chapters.forEach((chTitle, chi) => {
        const chapterId = id();
        chapterRows.push({ id: chapterId, courseId, title: chTitle, position: chi, summary: `Tout ce qu'il faut savoir sur « ${chTitle} », en leçons courtes et pratiques.` });
        const middle = shuffle(MIDDLE_LESSONS).slice(0, int(1, 3));
        const lessons: [string, "VIDEO" | "ARTICLE" | "QUIZ"][] = [[chTitle, "VIDEO"], ...middle, [`Quiz · ${chTitle}`, "QUIZ"]];
        lessons.forEach(([lt, type], li) => {
          const lessonId = id();
          const minutes = type === "QUIZ" ? 3 : type === "ARTICLE" ? int(3, 6) : int(4, 14);
          duration += minutes;
          lessonRows.push({
            id: lessonId,
            chapterId,
            title: lt,
            type,
            position: li,
            durationMinutes: minutes,
            isPreview: chi === 0 && li < 2,
            videoUrl: type === "VIDEO" ? VIDEOS[(courseIndex + chi + li) % VIDEOS.length] : null,
            content: type === "QUIZ" ? null : article(title, chTitle, lt),
          });
          meta.lessons.push({ id: lessonId, minutes, type });
          if (type === "QUIZ") {
            const quizId = id();
            meta.quizIds.push(quizId);
            quizRows.push({ id: quizId, courseId, lessonId, title: `Quiz · ${chTitle}`, passingScore: 60 });
            addQuestions(quizId, bank, 3);
          }
        });
      });

      if (certified) {
        quizRows.push({ id: meta.finalQuizId, courseId, title: `Examen final · ${title}`, isFinal: true, passingScore: 70 });
        addQuestions(meta.finalQuizId, bank, 8);
      }

      courseRows.push({
        id: courseId,
        slug,
        title,
        subtitle,
        description: `${subtitle}\n\nCette formation a été conçue pour que vous progressiez à votre rythme, avec des leçons courtes, des démonstrations concrètes et des quiz réguliers pour ancrer durablement vos connaissances. Vous avancerez chapitre par chapitre : ${chapters.slice(0, -1).join(", ")} et enfin ${chapters[chapters.length - 1]}.\n\nÀ la fin, vous saurez mettre en pratique ce que vous avez appris sur un vrai projet${certified ? " et vous pourrez obtenir un certificat vérifiable à partager sur LinkedIn" : ""}.`,
        coverUrl: courseCover(cat.slug, ci),
        color: cat.courses.length ? [cat.color, "violet", "coral", "mint", "sky", "pink", "sun", "ocean", "lime"][(ci * 3) % 9] : cat.color,
        level: LEVELS[lvl],
        price,
        certified,
        featured: ci === 0 || ci === 3,
        status: published ? "PUBLISHED" : "PENDING",
        outcomes: chapters.slice(0, 5).map((c, i) => c + OUTCOME_SUFFIX[i % OUTCOME_SUFFIX.length]),
        requirements: REQUIREMENTS[lvl],
        tags: [cat.name, LEVELS[lvl] === "BEGINNER" ? "Débutant" : LEVELS[lvl] === "INTERMEDIATE" ? "Intermédiaire" : "Avancé"],
        durationMinutes: duration,
        instructorId: instructor.id,
        categoryId: category.id,
        createdAt: daysAgo(int(30, 400)),
        publishedAt: published ? daysAgo(int(5, 300)) : null,
      });
      courses.push(meta);
      courseIndex++;
    }
  }

  const chunked = async <T,>(rows: T[], fn: (chunk: T[]) => Promise<unknown>, size = 2000) => {
    for (let i = 0; i < rows.length; i += size) await fn(rows.slice(i, i + size));
  };
  await db.course.createMany({ data: courseRows });
  await db.chapter.createMany({ data: chapterRows });
  await chunked(lessonRows, (c) => db.lesson.createMany({ data: c }));
  await db.quiz.createMany({ data: quizRows });
  await chunked(questionRows, (c) => db.question.createMany({ data: c }));
  await chunked(optionRows, (c) => db.option.createMany({ data: c }));
  console.log(`   ${courseRows.length} cours, ${lessonRows.length} leçons, ${questionRows.length} questions`);

  console.log("Inscriptions, progression, avis…");
  const enrollRows: Prisma.EnrollmentCreateManyInput[] = [];
  const progressRows: Prisma.LessonProgressCreateManyInput[] = [];
  const paymentRows: Prisma.PaymentCreateManyInput[] = [];
  const reviewRows: Prisma.ReviewCreateManyInput[] = [];
  const certRows: Prisma.CertificateCreateManyInput[] = [];
  const attemptRows: Prisma.QuizAttemptCreateManyInput[] = [];
  const activityRows: Prisma.ActivityCreateManyInput[] = [];
  const userBadgeRows: Prisma.UserBadgeCreateManyInput[] = [];
  const xpByUser = new Map<string, number>();
  const published = courses.filter((c) => c.published);
  // Popularité inégale : certains cours attirent beaucoup plus.
  const weights = published.map((c, i) => (i % 10 < 2 ? 5 : i % 10 < 5 ? 2.5 : 1) * (c.price === 0 ? 2 : 1));
  const weightedPick = () => {
    const total = weights.reduce((a, b) => a + b, 0);
    let r = rand() * total;
    for (let i = 0; i < published.length; i++) if ((r -= weights[i]) <= 0) return published[i];
    return published[published.length - 1];
  };
  const code = () => {
    const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let s = "";
    for (let i = 0; i < 12; i++) s += a[Math.floor(rand() * a.length)];
    return `LRN-${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8)}`;
  };

  const enroll = (userId: string, course: CourseMeta, progressPct: number, startDaysAgo: number, opts: { review?: boolean; method?: "CARD" | "ORANGE_MONEY" | "MTN_MOMO" | "PAYPAL" } = {}) => {
    const total = course.lessons.length;
    const done = Math.round((total * progressPct) / 100);
    const enrollmentDate = daysAgo(startDaysAgo);
    let xp = 5;
    course.lessons.slice(0, done).forEach((l, i) => {
      const when = daysAgo(Math.max(0, startDaysAgo - Math.floor((i / Math.max(1, done)) * startDaysAgo)));
      progressRows.push({ id: id(), userId, lessonId: l.id, completed: true, completedAt: when, watchedSeconds: l.minutes * 60 });
      xp += 10;
      activityRows.push({ id: id(), userId, type: "lesson", label: "Leçon terminée", xp: 10, minutes: l.minutes, createdAt: when });
    });
    const quizzesDone = course.quizIds.slice(0, Math.floor((course.quizIds.length * progressPct) / 100));
    for (const quizId of quizzesDone) {
      const score = pick([67, 100, 100, 67, 100]);
      attemptRows.push({ id: id(), userId, quizId, score, passed: score >= 60, answers: {}, createdAt: daysAgo(int(0, startDaysAgo)) });
      xp += 25;
    }
    const completed = done === total;
    let completedAt: Date | null = null;
    if (completed) {
      completedAt = daysAgo(Math.max(0, startDaysAgo - int(5, Math.max(6, startDaysAgo))));
      xp += 100;
      if (course.certified) {
        const score = int(72, 100);
        attemptRows.push({ id: id(), userId, quizId: course.finalQuizId, score, passed: true, answers: {}, createdAt: completedAt });
        certRows.push({ id: id(), code: code(), userId, courseId: course.id, score, issuedAt: completedAt });
        xp += 150;
      }
    }
    enrollRows.push({
      id: id(),
      userId,
      courseId: course.id,
      progress: Math.round((done / total) * 100),
      lastLessonId: course.lessons[Math.min(done, total - 1)].id,
      createdAt: enrollmentDate,
      lastAccessAt: daysAgo(int(0, Math.min(startDaysAgo, 20))),
      completedAt,
    });
    if (course.price > 0) {
      const currency = pick(["XAF", "XAF", "XAF", "EUR", "USD"]);
      const rate = currency === "EUR" ? 655.957 : currency === "USD" ? 600 : 1;
      paymentRows.push({
        id: id(),
        reference: `PAY-${randomUUID().slice(0, 8).toUpperCase()}`,
        userId,
        courseId: course.id,
        amount: currency === "XAF" ? course.price : Math.round((course.price / rate) * 100),
        currency,
        amountXaf: course.price,
        method: opts.method ?? pick(["CARD", "ORANGE_MONEY", "MTN_MOMO", "MTN_MOMO", "ORANGE_MONEY", "PAYPAL"]),
        status: "SUCCEEDED",
        createdAt: enrollmentDate,
      });
    }
    if (opts.review ?? (progressPct >= 40 && rand() < 0.55)) {
      const [rating, comment] = pick(REVIEWS);
      reviewRows.push({ id: id(), userId, courseId: course.id, rating, comment, createdAt: daysAgo(int(0, startDaysAgo)) });
      xp += 15;
    }
    xpByUser.set(userId, (xpByUser.get(userId) ?? 0) + xp);
    return { completed, certified: completed && course.certified };
  };

  const students = await db.user.findMany({ where: { role: "STUDENT", id: { not: demo.id } } });
  for (const s of students) {
    const n = int(1, 7);
    const chosen = new Set<CourseMeta>();
    while (chosen.size < n) chosen.add(weightedPick());
    let certs = 0;
    let finished = 0;
    for (const c of chosen) {
      const pct = pick([0, 10, 25, 40, 60, 80, 100, 100, 100]);
      const r = enroll(s.id, c, pct, int(3, 120));
      if (r.completed) finished++;
      if (r.certified) certs++;
    }
    // Activité récente (séries de jours) pour le classement hebdomadaire.
    const active = rand() < 0.7;
    const streak = active ? int(0, 25) : 0;
    for (let d = 0; d < streak; d++) {
      const xp = int(10, 60);
      activityRows.push({ id: id(), userId: s.id, type: "lesson", label: "Révision", xp, minutes: int(5, 30), createdAt: daysAgo(d) });
      xpByUser.set(s.id, (xpByUser.get(s.id) ?? 0) + xp);
    }
    const xp = xpByUser.get(s.id) ?? 0;
    await db.user.update({ where: { id: s.id }, data: { xp, streak, bestStreak: Math.max(streak, int(streak, streak + 15)), lastActiveDate: streak ? new Date() : daysAgo(int(2, 40)) } });
    const earned = ["enrolled", "first-step"];
    if (n >= 5) earned.push("collector");
    if (streak >= 3) earned.push("streak-3");
    if (streak >= 7) earned.push("streak-7");
    if (finished) earned.push("finisher");
    if (certs) earned.push("certified");
    if (certs >= 3) earned.push("triple-cert");
    if (xp >= 1000) earned.push("xp-1000");
    if (Math.floor(Math.sqrt(xp / 50)) + 1 >= 5) earned.push("level-5");
    if (rand() < 0.4) earned.push("quiz-ace");
    earned.forEach((slug) => userBadgeRows.push({ userId: s.id, badgeId: badgeBySlug[slug].id, earnedAt: daysAgo(int(0, 60)) }));
  }

  // Compte de démonstration étudiant, avec un parcours réaliste.
  const bySlug = (s: string) => courses.find((c) => c.slug === s)!;
  // Sept formations terminées sur plusieurs mois (six certificats : Git est gratuite et non certifiante), quatre en cours.
  for (const [slug, startedDaysAgo, review, method] of DEMO_COMPLETED) enroll(demo.id, bySlug(slug), 100, startedDaysAgo, { review, method });
  for (const [slug, progress, startedDaysAgo, method] of DEMO_IN_PROGRESS) enroll(demo.id, bySlug(slug), progress, startedDaysAgo, { review: false, method });
  for (let d = 0; d < 6; d++) {
    activityRows.push({ id: id(), userId: demo.id, type: "lesson", label: "Leçon terminée", xp: 30, minutes: int(12, 28), createdAt: daysAgo(d) });
    xpByUser.set(demo.id, (xpByUser.get(demo.id) ?? 0) + 30);
  }
  await db.user.update({ where: { id: demo.id }, data: { xp: xpByUser.get(demo.id) ?? 0, streak: 6, bestStreak: 11, lastActiveDate: daysAgo(1) } });
  const demoXp = xpByUser.get(demo.id) ?? 0;
  const demoBadges = ["enrolled", "first-step", "collector", "streak-3", "finisher", "certified", "triple-cert", "critic", "quiz-ace", "quiz-10", "night-owl", "level-5", "xp-1000"];
  if (Math.floor(Math.sqrt(demoXp / 50)) + 1 >= 10) demoBadges.push("level-10");
  for (const slug of demoBadges) {
    userBadgeRows.push({ userId: demo.id, badgeId: badgeBySlug[slug].id, earnedAt: daysAgo(int(1, 40)) });
  }

  // Les formateurs apprennent aussi (et apparaissent dans le classement).
  for (const t of instructors) {
    for (let d = 0; d < int(0, 6); d++) activityRows.push({ id: id(), userId: t.id, type: "lesson", label: "Révision", xp: int(10, 40), minutes: int(5, 20), createdAt: daysAgo(d) });
  }

  await chunked(enrollRows, (c) => db.enrollment.createMany({ data: c, skipDuplicates: true }));
  await chunked(progressRows, (c) => db.lessonProgress.createMany({ data: c, skipDuplicates: true }));
  await chunked(attemptRows, (c) => db.quizAttempt.createMany({ data: c }));
  await chunked(paymentRows, (c) => db.payment.createMany({ data: c }));
  await chunked(reviewRows, (c) => db.review.createMany({ data: c, skipDuplicates: true }));
  await chunked(certRows, (c) => db.certificate.createMany({ data: c, skipDuplicates: true }));
  await chunked(activityRows, (c) => db.activity.createMany({ data: c }));
  await chunked(userBadgeRows, (c) => db.userBadge.createMany({ data: c, skipDuplicates: true }));

  console.log("Statistiques des cours…");
  await db.$executeRaw`
    UPDATE "Course" c SET
      "studentsCount" = COALESCE((SELECT COUNT(*) FROM "Enrollment" e WHERE e."courseId" = c.id), 0),
      "ratingCount" = COALESCE((SELECT COUNT(*) FROM "Review" r WHERE r."courseId" = c.id), 0),
      "ratingAvg" = COALESCE((SELECT ROUND(AVG(r.rating)::numeric, 1) FROM "Review" r WHERE r."courseId" = c.id), 0)`;

  console.log("Favoris, notes, notifications, candidatures…");
  await db.favorite.createMany({
    data: ["next-js-le-framework-full-stack", "design-system-penser-a-l-echelle", "machine-learning-premiers-modeles"].map((s) => ({ userId: demo.id, courseId: bySlug(s).id })),
  });
  const reactLessons = bySlug("react-19-interfaces-reactives").lessons;
  await db.note.createMany({
    data: [
      { userId: demo.id, lessonId: reactLessons[0].id, content: "Un composant = une fonction qui retourne du JSX. Toujours commencer par découper la maquette.", timestamp: 42 },
      { userId: demo.id, lessonId: reactLessons[0].id, content: "Revoir la différence entre props et state avant le quiz.", timestamp: 118 },
      { userId: demo.id, lessonId: reactLessons[5].id, content: "useEffect : penser au tableau de dépendances !", timestamp: 65 },
    ],
  });
  await db.notification.createMany({
    data: [
      { userId: demo.id, title: "Série de 6 jours", body: "Encore un jour pour obtenir le badge « Semaine complète ».", icon: "flame", href: "/badges", createdAt: daysAgo(0, 8) },
      { userId: demo.id, title: "Certificat obtenu", body: "Félicitations, vous êtes certifié en « Apprendre à apprendre ».", icon: "graduation-cap", href: "/certificates", read: true, createdAt: daysAgo(10) },
      { userId: demo.id, title: "Nouvelle formation disponible", body: "« Créer un chatbot avec l'API Claude » vient d'être publiée.", icon: "sparkles", href: "/courses/creer-un-chatbot-avec-l-api-claude", createdAt: daysAgo(2) },
    ],
  });
  await db.notification.create({ data: { userId: admin.id, title: "Nouvelles candidatures formateur", body: "3 candidatures attendent votre validation.", icon: "user-check", href: "/admin/applications" } });

  const applicants = shuffle(students).slice(0, 4);
  await db.instructorApplication.createMany({
    data: applicants.map((u, i) => ({
      userId: u.id,
      expertise: pick(["Développement web", "Design UX/UI", "Marketing digital", "Data science", "Langues"]),
      motivation: "Je souhaite partager mon expérience terrain avec la nouvelle génération et rendre l'apprentissage accessible à tous, en français et avec des exemples locaux.",
      experience: `${int(3, 10)} ans d'expérience professionnelle, dont ${int(1, 4)} ans à former des équipes et des étudiants.`,
      portfolio: "https://linkedin.com/in/" + u.username,
      status: i === 3 ? "REJECTED" : "PENDING",
      createdAt: daysAgo(int(1, 15)),
    })),
  });

  const counts = await Promise.all([db.user.count(), db.course.count({ where: { status: "PUBLISHED" } }), db.enrollment.count(), db.certificate.count()]);
  console.log(`Terminé : ${counts[0]} utilisateurs, ${counts[1]} cours publiés, ${counts[2]} inscriptions, ${counts[3]} certificats.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
