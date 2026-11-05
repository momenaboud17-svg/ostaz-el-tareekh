import { type FormEvent, useEffect, useId, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  CalendarCheck,
  ChevronDown,
  Compass,
  Menu,
  PenLine,
  Route,
  Users,
  X,
} from "lucide-react";
import {
  courses,
  days,
  eras,
  faqs,
  grades,
  nav,
  packages,
  reasons,
  type Course,
} from "@/components/site/content";

type Filter = "all" | "thanawi" | "bac";

type Booking = {
  id: string;
  name: string;
  phone: string;
  grade: string;
  pack: string;
  track: string;
  day: string;
  note: string;
  createdAt: string;
};

const STORAGE_KEY = "beshoy-history-bookings";

const reasonIcons = {
  story: Route,
  why: Compass,
  pen: PenLine,
  group: Users,
  record: BookOpen,
  plan: CalendarCheck,
} as const;

const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "كل المسارات" },
  { id: "thanawi", label: "الثانوي العام" },
  { id: "bac", label: "البكالوريا المصرية" },
];

function readBookings(): Booking[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.filter(isBooking).slice(0, 20);
  } catch {
    return [];
  }
}

function isBooking(value: unknown): value is Booking {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    typeof row.name === "string" &&
    typeof row.phone === "string" &&
    typeof row.grade === "string" &&
    typeof row.pack === "string" &&
    typeof row.track === "string" &&
    typeof row.day === "string" &&
    typeof row.note === "string" &&
    typeof row.createdAt === "string"
  );
}

function courseById(id: string): Course | undefined {
  return courses.find((course) => course.id === id);
}

export function HomePage() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("top");
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState<string | null>("sec-3");
  const [eraId, setEraId] = useState(eras[0].id);
  const [faqId, setFaqId] = useState<number | null>(0);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [grade, setGrade] = useState(grades[2]);
  const [pack, setPack] = useState("trial");
  const [track, setTrack] = useState("sec-3");
  const [day, setDay] = useState(days[0]);
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [latestId, setLatestId] = useState<string | null>(null);
  const menuTitleId = useId();

  useEffect(() => {
    setBookings(readBookings());
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const marker = window.scrollY + window.innerHeight * 0.33;
      let current = nav[0].id;
      for (const item of nav) {
        const node = document.getElementById(item.id);
        if (node && node.offsetTop <= marker) current = item.id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const shown = courses.filter(
    (course) => filter === "all" || course.stage === filter || course.stage === "shared",
  );
  const selected = shown.find((course) => course.id === selectedId) ?? null;
  const era = eras.find((item) => item.id === eraId) ?? eras[0];
  const chosenTrack = courseById(track);

  function chooseFilter(next: Filter) {
    setFilter(next);
    setSelectedId((current) => {
      if (!current) return current;
      const course = courseById(current);
      if (!course) return null;
      if (next === "all" || course.stage === next || course.stage === "shared") return current;
      return null;
    });
  }

  function bookCourse(id: string) {
    setTrack(id);
    setPack((current) => current || "trial");
    setOpen(false);
    document.getElementById("book")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (name.trim().length < 3) nextErrors.name = "اكتب الاسم الثنائي على الأقل.";
    const normalized = phone.replace(/\s|-/g, "");
    if (!/^01[0125]\d{8}$/.test(normalized)) {
      nextErrors.phone = "اكتب رقم موبايل مصري صحيح، مثل 01012345678.";
    }
    if (!grade) nextErrors.grade = "اختر المرحلة.";
    if (!pack) nextErrors.pack = "اختر نوع الحصة.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      const first = Object.keys(nextErrors)[0];
      document.getElementById(`field-${first}`)?.focus();
      return;
    }
    const booking: Booking = {
      id: `BSH-${Date.now().toString().slice(-6)}`,
      name: name.trim(),
      phone: normalized,
      grade,
      pack,
      track,
      day,
      note: note.trim(),
      createdAt: new Date().toISOString(),
    };
    const next = [booking, ...bookings].slice(0, 20);
    setBookings(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setLatestId(booking.id);
    setName("");
    setPhone("");
    setNote("");
    window.setTimeout(() => {
      document.getElementById("confirm")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 40);
  }

  function removeBooking(id: string) {
    const next = bookings.filter((item) => item.id !== id);
    setBookings(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    if (latestId === id) setLatestId(null);
  }

  return (
    <div className="min-h-screen">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:right-4 focus:z-50 focus:bg-gold focus:px-4 focus:py-3 focus:text-ink"
      >
        تخطَّ إلى المحتوى
      </a>
      <header className="fixed inset-x-0 top-0 z-40 border-b border-gold/25 bg-ink/90 backdrop-blur-md">
        <div className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
          <a href="#top" className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-gold font-display text-xl text-gold">
              ب
            </span>
            <span>
              <span className="block font-display text-lg leading-none text-ivory sm:text-xl">
                منصة أستاذ التاريخ
              </span>
              <span className="mt-1 block text-xs text-sand">مستر بيشوي بشرا</span>
            </span>
          </a>
          <nav className="hidden items-center gap-6 lg:flex" aria-label="أقسام الصفحة">
            {nav.map((item) => (
              <a
                key={item.id}
                href={item.href}
                data-active={active === item.id}
                className="nav-link text-sm text-sand"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <a href="#book" className="btn-gold hidden lg:inline-flex">
            احجز حصة
          </a>
          <button
            type="button"
            className="grid h-11 w-11 place-items-center border border-gold/40 text-ivory lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen(true)}
          >
            <Menu className="h-5 w-5" aria-hidden />
            <span className="sr-only">فتح القائمة</span>
          </button>
        </div>
      </header>

      {open ? (
        <div
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-labelledby={menuTitleId}
          className="fixed inset-0 z-50 flex flex-col bg-ink px-6 py-6"
        >
          <div className="flex items-center justify-between">
            <p id={menuTitleId} className="font-display text-2xl text-gold">
              القائمة
            </p>
            <button
              type="button"
              className="grid h-11 w-11 place-items-center border border-gold/40"
              onClick={() => setOpen(false)}
            >
              <X className="h-5 w-5" aria-hidden />
              <span className="sr-only">إغلاق القائمة</span>
            </button>
          </div>
          <nav className="mt-10 flex flex-col gap-2" aria-label="أقسام الصفحة">
            {nav.map((item) => (
              <a
                key={item.id}
                href={item.href}
                className="border-b border-gold/20 py-4 font-display text-4xl text-ivory"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <a href="#book" className="btn-gold mt-8" onClick={() => setOpen(false)}>
            احجز حصة تجريبية
          </a>
        </div>
      ) : null}

      <main id="content">
        <section id="top" className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 pt-28 pb-16 sm:px-8 lg:grid-cols-2 lg:pt-32 lg:pb-24">
          <div>
            <p className="mb-5 flex items-center gap-3 text-sm text-gold">
              <span className="h-px w-8 bg-gold" />
              الثانوي العام · البكالوريا المصرية
            </p>
            <h1 className="text-5xl leading-tight text-ivory sm:text-6xl lg:text-7xl">
              لا تحفظ التاريخ.
              <span className="mt-2 block text-gold">افهمه، ثم أجب.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-sand">
              مستر بيشوي بشرا يدرّس التاريخ للثانوي العام والبكالوريا المصرية. شرح يربط السبب
              بالنتيجة، وخرائط زمنية تختصر المنهج، وتدريب على كتابة الإجابة لا على تظليلها.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="#book" className="btn-gold w-full sm:w-auto">
                احجز حصة تجريبية
                <ArrowLeft className="h-4 w-4" aria-hidden />
              </a>
              <a href="#courses" className="btn-line w-full sm:w-auto">
                استعرض المسارات
              </a>
            </div>
            <dl className="mt-12 grid gap-5 sm:grid-cols-3">
              {[
                ["01", "مجموعات يبقى فيها السؤال مسموعًا"],
                ["02", "خطة أسبوعية بدل كومة المراجعات"],
                ["03", "تدريب على صياغة الإجابة"],
              ].map(([num, label]) => (
                <div key={num} className="border-t border-gold/30 pt-4">
                  <dt className="font-display text-2xl text-gold">{num}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-ivory">{label}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="relative mx-auto w-full max-w-md">
            <div className="portrait border border-gold/40">
              <img
                src="/teacher-formal.jpg"
                alt="مستر بيشوي بشرا بزي رسمي، مبتسم وذراعاه متقاطعتان"
                width={1010}
                height={1021}
              />
              <span className="pointer-events-none absolute top-3 right-3 h-10 w-10 border-t-2 border-r-2 border-gold" />
              <span className="pointer-events-none absolute bottom-3 left-3 h-10 w-10 border-b-2 border-l-2 border-gold" />
              <p className="caption-fade absolute inset-x-0 bottom-0 px-5 pt-16 pb-5">
                <span className="block font-display text-3xl text-ivory">مستر بيشوي بشرا</span>
                <span className="mt-1 block text-sm text-sand">مدرّس التاريخ</span>
              </p>
            </div>
          </div>
        </section>

        <section id="about" className="relative border-t border-gold/20">
          <div className="relative mx-auto grid w-full max-w-6xl gap-14 px-5 py-20 sm:px-8 lg:grid-cols-12 lg:py-28">
            <div className="lg:col-span-7">
              <p className="mb-4 flex items-center gap-3 text-sm text-gold">
                <span className="h-px w-8 bg-gold" />
                المدرّس
              </p>
              <h2 className="text-4xl leading-tight text-ivory sm:text-5xl">
                من يحوّل الحدث إلى فهم، لا إلى سطر يُنسى.
              </h2>
              <div className="mt-6 space-y-5 text-lg leading-relaxed text-sand">
                <p>
                  مستر بيشوي بشرا متخصص في مناهج التاريخ للثانوية العامة المصرية وللبكالوريا
                  المصرية. الحصّة عنده لا تعيد قراءة الكتاب: تبدأ بسؤال «لماذا؟»، ثم يُبنى الخط
                  الزمني، ثم تتحوّل الفكرة إلى إجابة تُكتب في الامتحان.
                </p>
                <p>
                  يرافق الطالب من أول مصطلح غامض حتى مراجعة ليلة الاختبار. الواجب قصير، والمجموعة
                  لا تبتلع السؤال، والخطة الأسبوعية تقول بوضوح: ماذا يُذاكر، وبأي ترتيب.
                </p>
              </div>
              <blockquote className="mt-8 border-r-2 border-gold pr-5 font-display text-2xl leading-relaxed text-ivory italic sm:text-3xl">
                «الطالب الذي يرى الحدث يربطه بغيره. والذي يحفظه وحده ينساه عند أول سؤال مختلف.»
              </blockquote>
            </div>
            <div className="lg:col-span-5">
              <div className="portrait border border-gold/40">
                <img
                  src="/teacher-armor.jpg"
                  alt="مستر بيشوي بشرا بزي تاريخي مدرّع، في لقطة من الشرح الحي"
                  width={1019}
                  height={1019}
                />
                <p className="caption-fade absolute inset-x-0 bottom-0 px-5 pt-16 pb-5 text-sm leading-relaxed text-ivory">
                  حين ينزل الدرس من الصفحة إلى المشهد — لقطة من أسلوب الشرح الحي.
                </p>
              </div>
            </div>
            <div className="min-w-0 lg:col-span-12">
              <h3 className="text-3xl text-ivory">أي عصر تسأل عنه؟</h3>
              <p className="mt-3 max-w-2xl text-sand">
                الطريقة واحدة في كل عصر: نرى المشهد، ثم نثبّت الرابط الذي سيُسأل عنه.
              </p>
              <div className="mt-6 flex max-w-full gap-3 overflow-x-auto pb-2">
                {eras.map((item) => {
                  const on = item.id === era.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setEraId(item.id)}
                      className={`shrink-0 border px-4 py-3 text-sm ${
                        on ? "border-gold bg-gold text-ink" : "border-gold/30 text-ivory"
                      }`}
                    >
                      {item.title}
                    </button>
                  );
                })}
              </div>
              <p className="mt-4 border border-gold/30 bg-navy px-5 py-6 font-display text-2xl leading-relaxed text-ivory">
                {era.note}
              </p>
            </div>
          </div>
        </section>

        <figure className="band">
          <img
            src="/history-temple.jpg"
            alt="قاعة أعمدة حجرية في معبد مصري قديم، يتخللها ضوء ذهبي"
            width={1600}
            height={900}
          />
          <div className="band-shade" />
          <figcaption className="band-copy mx-auto w-full max-w-4xl px-5 py-16 sm:px-8">
            <blockquote className="font-display text-3xl leading-snug text-ivory italic sm:text-5xl">
              كل حضارة تركت عمودًا. مهمتنا أن نعرف ماذا كان يحمل.
            </blockquote>
          </figcaption>
        </figure>

        <section id="courses" className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-4 flex items-center gap-3 text-sm text-gold">
                <span className="h-px w-8 bg-gold" />
                المسارات
              </p>
              <h2 className="text-4xl text-ivory sm:text-5xl">اختر مرحلتك، واقرأ ما ستأخذه.</h2>
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-sand">
                أربع مسارات أساسية وورشة للإجابة. التفاصيل مفتوحة، والحجز ينقل المسار مباشرة إلى
                النموذج.
              </p>
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="تصفية المسارات">
              {filters.map((item) => {
                const on = filter === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => chooseFilter(item.id)}
                    className={`min-h-11 border px-4 py-2 text-sm ${
                      on ? "border-gold bg-gold text-ink" : "border-gold/30 text-ivory"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {shown.map((course) => {
              const on = selected?.id === course.id;
              return (
                <article
                  key={course.id}
                  className={`flex flex-col border bg-navy p-6 ${on ? "border-gold" : "border-gold/25"}`}
                >
                  <p className="text-sm text-gold">{course.stageLabel}</p>
                  <h3 className="mt-3 text-3xl text-ivory">{course.title}</h3>
                  <p className="mt-1 text-sm text-sand">{course.grade}</p>
                  <p className="mt-4 flex-1 leading-relaxed text-sand">{course.summary}</p>
                  <p className="mt-4 text-sm text-ivory">
                    {course.duration} · {course.format}
                  </p>
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      className={on ? "btn-gold w-full sm:w-auto" : "btn-line w-full sm:w-auto"}
                      aria-expanded={on}
                      onClick={() => setSelectedId(on ? null : course.id)}
                    >
                      {on ? "إخفاء التفاصيل" : "تفاصيل المنهج"}
                    </button>
                    <button
                      type="button"
                      className="btn-line w-full sm:w-auto"
                      onClick={() => bookCourse(course.id)}
                    >
                      احجز هذا المسار
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {selected ? (
            <div id="course-detail" className="mt-4 border border-gold bg-navy p-6 sm:p-10">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm text-gold">{selected.grade}</p>
                  <h3 className="mt-2 text-4xl text-ivory">{selected.title}</h3>
                </div>
                <button type="button" className="btn-gold w-full sm:w-auto" onClick={() => bookCourse(selected.id)}>
                  احجز هذا المسار
                </button>
              </div>
              <dl className="mt-8 grid gap-4 border-y border-gold/20 py-6 sm:grid-cols-3">
                <div>
                  <dt className="text-sm text-sand">المدة</dt>
                  <dd className="mt-1 text-ivory">{selected.duration}</dd>
                </div>
                <div>
                  <dt className="text-sm text-sand">الإيقاع</dt>
                  <dd className="mt-1 text-ivory">{selected.cadence}</dd>
                </div>
                <div>
                  <dt className="text-sm text-sand">الشكل</dt>
                  <dd className="mt-1 text-ivory">{selected.format}</dd>
                </div>
              </dl>
              <ul className="topics mt-6 grid gap-3 text-ivory sm:grid-cols-2">
                {selected.topics.map((topic) => (
                  <li key={topic}>{topic}</li>
                ))}
              </ul>
              <p className="mt-8 text-lg leading-relaxed text-sand">{selected.outcome}</p>
            </div>
          ) : (
            <p className="mt-6 text-sand">اختر «تفاصيل المنهج» لقراءة الوحدات وناتج الحصة.</p>
          )}
        </section>

        <section id="why" className="border-y border-gold/20 bg-navy">
          <div className="mx-auto grid w-full max-w-6xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-12 lg:py-28">
            <div className="lg:col-span-4">
              <p className="mb-4 flex items-center gap-3 text-sm text-gold">
                <span className="h-px w-8 bg-gold" />
                لماذا يختارونه
              </p>
              <h2 className="text-4xl text-ivory sm:text-5xl">لأن الدرجة تأتي من الفهم، لا من تكرار الصفحة.</h2>
            </div>
            <ol className="lg:col-span-8">
              {reasons.map((reason, index) => {
                const Icon = reasonIcons[reason.id as keyof typeof reasonIcons];
                return (
                  <li key={reason.id} className="grid grid-cols-[auto_1fr] gap-4 border-t border-gold/25 py-6">
                    <span className="font-display text-3xl text-gold">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="flex items-center gap-3 text-2xl text-ivory">
                        <Icon className="h-5 w-5 text-gold" aria-hidden />
                        {reason.title}
                      </h3>
                      <p className="mt-2 leading-relaxed text-sand">{reason.text}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        <figure className="band">
          <img
            src="/history-cairo.jpg"
            alt="أسوار حجرية ومشربية في القاهرة التاريخية عند الغسق، مع ضوء فانوس دافئ"
            width={1600}
            height={900}
          />
          <div className="band-shade" />
          <figcaption className="band-copy mx-auto w-full max-w-4xl px-5 py-16 sm:px-8">
            <blockquote className="font-display text-3xl leading-snug text-ivory italic sm:text-5xl">
              قبل ورقة الامتحان تحتاج ساعة هادئة وخطة، لا مزيدًا من الصفحات المبعثرة.
            </blockquote>
          </figcaption>
        </figure>

        <section id="book" className="mx-auto grid w-full max-w-6xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-12 lg:py-28">
          <div className="lg:col-span-5">
            <p className="mb-4 flex items-center gap-3 text-sm text-gold">
              <span className="h-px w-8 bg-gold" />
              الحجز
            </p>
            <h2 className="text-4xl text-ivory sm:text-5xl">احجز مقعدك في الحصة التجريبية.</h2>
            <ol className="mt-8 space-y-5">
              {[
                ["١", "تكتب اسمك ورقم الواتساب والمرحلة."],
                ["٢", "تختار نوع الحصة والمسار إن كنت قد حددته."],
                ["٣", "تصلك بطاقة تأكيد برقم حجز يُحفظ على جهازك."],
              ].map(([step, text]) => (
                <li key={step} className="flex gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center border border-gold font-display text-xl text-gold">
                    {step}
                  </span>
                  <p className="pt-2 leading-relaxed text-sand">{text}</p>
                </li>
              ))}
            </ol>
            <div className="mt-10 border border-gold/30 p-5">
              <h3 className="text-2xl text-ivory">أسئلة قبل الحجز</h3>
              <div className="mt-4">
                {faqs.map((item, index) => {
                  const on = faqId === index;
                  return (
                    <div key={item.q} className="border-t border-gold/20">
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-4 py-4 text-start text-ivory"
                        aria-expanded={on}
                        onClick={() => setFaqId(on ? null : index)}
                      >
                        {item.q}
                        <ChevronDown
                          className={`h-4 w-4 shrink-0 text-gold transition ${on ? "rotate-180" : ""}`}
                          aria-hidden
                        />
                      </button>
                      {on ? <p className="pb-4 leading-relaxed text-sand">{item.a}</p> : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            {latestId ? (
              <div id="confirm" role="status" className="mb-4 border border-gold bg-navy p-6">
                <p className="text-sm text-gold">تم استلام الطلب</p>
                <p className="mt-2 font-display text-3xl text-ivory">رقم حجزك</p>
                <p dir="ltr" className="mt-2 text-left font-display text-4xl text-gold tabular-nums">
                  {latestId}
                </p>
                <p className="mt-3 text-sand">
                  احتفظ بالرقم. في هذه النسخة التجريبية يبقى الطلب على جهازك ولا يغادره.
                </p>
              </div>
            ) : null}

            <form onSubmit={submitBooking} className="border border-gold/35 bg-navy p-5 sm:p-8" noValidate>
              <h3 className="text-3xl text-ivory">نموذج الحجز</h3>
              {chosenTrack ? (
                <p className="mt-2 text-sm text-gold">المسار المختار: {chosenTrack.title}</p>
              ) : null}
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <Field
                  id="field-name"
                  label="الاسم"
                  error={errors.name}
                  value={name}
                  onChange={setName}
                  autoComplete="name"
                  placeholder="الاسم الثنائي"
                />
                <Field
                  id="field-phone"
                  label="واتساب"
                  error={errors.phone}
                  value={phone}
                  onChange={setPhone}
                  autoComplete="tel"
                  placeholder="01012345678"
                  dir="ltr"
                  inputMode="tel"
                />
                <SelectField
                  id="field-grade"
                  label="المرحلة"
                  error={errors.grade}
                  value={grade}
                  onChange={setGrade}
                  options={grades}
                />
                <SelectField
                  id="field-day"
                  label="اليوم الأنسب"
                  value={day}
                  onChange={setDay}
                  options={days}
                />
              </div>

              <fieldset className="mt-6">
                <legend className="mb-3 text-sm text-sand">نوع الحصة</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {packages.map((item) => {
                    const on = pack === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => setPack(item.id)}
                        className={`border p-4 text-start ${
                          on ? "border-gold bg-gold/10" : "border-gold/25"
                        }`}
                      >
                        <span className="flex items-baseline justify-between gap-3">
                          <span className="font-display text-xl text-ivory">{item.title}</span>
                          <span className="text-sm text-gold">{item.price}</span>
                        </span>
                        <span className="mt-2 block text-sm leading-relaxed text-sand">{item.detail}</span>
                      </button>
                    );
                  })}
                </div>
                {errors.pack ? <p className="mt-2 text-sm text-gold">{errors.pack}</p> : null}
                <p className="mt-3 text-xs leading-relaxed text-sand">
                  الأسعار نموذج للعرض في هذه النسخة التجريبية ويمكن تعديلها.
                </p>
              </fieldset>

              <div className="mt-6">
                <label htmlFor="field-track" className="mb-2 block text-sm text-sand">
                  المسار
                </label>
                <div className="relative">
                  <select
                    id="field-track"
                    className="field appearance-none pe-10"
                    value={track}
                    onChange={(event) => setTrack(event.target.value)}
                  >
                    <option value="">لم أحدد بعد</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.grade} — {course.title}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gold"
                    aria-hidden
                  />
                </div>
              </div>

              <div className="mt-6">
                <label htmlFor="field-note" className="mb-2 block text-sm text-sand">
                  ملاحظة
                </label>
                <textarea
                  id="field-note"
                  className="field"
                  value={note}
                  maxLength={400}
                  placeholder="مثلًا: أرتبك في أسئلة التعليل، أو أريد مراجعة الفصل الأخير."
                  onChange={(event) => setNote(event.target.value)}
                />
              </div>

              <button type="submit" className="btn-gold mt-6 w-full sm:w-auto">
                تأكيد الحجز
              </button>
            </form>

            <div className="mt-6">
              <h3 className="text-2xl text-ivory">حجوزات هذا الجهاز</h3>
              {bookings.length === 0 ? (
                <p className="mt-3 text-sand">لا توجد حجوزات بعد. أرسل النموذج لتظهر بطاقة التأكيد هنا.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {bookings.map((item) => {
                    const packTitle = packages.find((entry) => entry.id === item.pack)?.title ?? item.pack;
                    const trackTitle = courseById(item.track)?.title ?? "من دون مسار محدد";
                    return (
                      <li key={item.id} className="border border-gold/25 bg-navy p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p dir="ltr" className="text-left font-display text-2xl text-gold">
                              {item.id}
                            </p>
                            <p className="mt-1 text-ivory">{item.name}</p>
                            <p className="text-sm text-sand">
                              {item.grade} · {packTitle} · {trackTitle}
                            </p>
                            <p dir="ltr" className="mt-1 text-left text-sm text-sand">
                              {item.phone}
                            </p>
                            <p className="mt-1 text-xs text-sand">
                              {new Date(item.createdAt).toLocaleString("ar-EG", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })}
                            </p>
                          </div>
                          <button
                            type="button"
                            className="btn-line min-h-11 px-4"
                            onClick={() => removeBooking(item.id)}
                          >
                            حذف
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gold/30">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-display text-4xl text-ivory">منصة أستاذ التاريخ</p>
              <p className="mt-3 max-w-md leading-relaxed text-sand">
                مستر بيشوي بشرا — مدرّس التاريخ للثانوي العام والبكالوريا المصرية.
              </p>
            </div>
            <nav className="flex flex-wrap gap-x-5 gap-y-3" aria-label="تذييل">
              {nav.map((item) => (
                <a key={item.id} href={item.href} className="nav-link text-sm text-sand">
                  {item.label}
                </a>
              ))}
            </nav>
          </div>

          <div className="mt-14 border border-gold px-6 py-10 text-center">
            <p className="text-sm text-gold">التوقيع</p>
            <p dir="ltr" className="mt-3 font-sans text-xl text-ivory sm:text-3xl">
              Designed & Developed by Momen Aboud
            </p>
          </div>

          <p className="mt-8 text-center text-sm text-sand">
            © 2026 منصة أستاذ التاريخ — نسخة تجريبية للعرض
          </p>
        </div>
      </footer>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  placeholder,
  autoComplete,
  inputMode,
  dir,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: "tel" | "text";
  dir?: "ltr" | "rtl";
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm text-sand">
        {label}
      </label>
      <input
        id={id}
        className="field"
        value={value}
        dir={dir}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-2 text-sm text-gold">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  error?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm text-sand">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          className="field appearance-none pe-10"
          value={value}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(event) => onChange(event.target.value)}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gold"
          aria-hidden
        />
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-2 text-sm text-gold">
          {error}
        </p>
      ) : null}
    </div>
  );
}
