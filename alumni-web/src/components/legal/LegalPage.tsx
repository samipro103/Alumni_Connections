import Link from "next/link";
import BrandMark from "@/components/brand/BrandMark";

export default function LegalPage({
  eyebrow,
  title,
  intro,
  sections,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  sections: Array<{
    title: string;
    body: string[];
  }>;
}) {
  return (
    <main className="min-h-screen bg-[#090b0f] text-white">
      <div className="mx-auto w-full max-w-[820px] px-5 py-10 sm:px-8 sm:py-14">
        <Link href="/">
          <BrandMark className="text-xl text-white" />
        </Link>

        <p className="mt-12 text-[10px] font-black uppercase tracking-[0.17em] text-[#8d98ff]">
          {eyebrow}
        </p>

        <h1 className="mt-3 text-4xl font-black tracking-[-0.045em] sm:text-5xl">
          {title}
        </h1>

        <p className="mt-5 max-w-2xl text-sm leading-7 text-zinc-500">
          {intro}
        </p>

        <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-700">
          Actualizado: 25 de agosto de 2026
        </p>

        <div className="mt-10 divide-y divide-white/[0.07] border-y border-white/[0.07]">
          {sections.map(
            (section) => (
              <section
                key={
                  section.title
                }
                className="py-7"
              >
                <h2 className="text-lg font-black tracking-[-0.025em] text-zinc-200">
                  {
                    section.title
                  }
                </h2>
                <div className="mt-3 space-y-3">
                  {section.body.map(
                    (
                      paragraph,
                      index
                    ) => (
                      <p
                        key={index}
                        className="text-sm leading-7 text-zinc-500"
                      >
                        {
                          paragraph
                        }
                      </p>
                    )
                  )}
                </div>
              </section>
            )
          )}
        </div>

        <div className="mt-8 flex flex-wrap gap-5 text-xs font-bold text-zinc-600">
          <Link
            href="/legal/privacy"
            className="hover:text-white"
          >
            Privacidad
          </Link>
          <Link
            href="/legal/terms"
            className="hover:text-white"
          >
            Términos
          </Link>
          <Link
            href="/legal/community"
            className="hover:text-white"
          >
            Comunidad
          </Link>
          <Link
            href="/settings?section=account"
            className="hover:text-white"
          >
            Controles de cuenta
          </Link>
        </div>
      </div>
    </main>
  );
}
