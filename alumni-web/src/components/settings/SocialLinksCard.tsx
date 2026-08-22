"use client";

interface Props {
  website: string;
  github: string;
  linkedin: string;
  instagram: string;

  setWebsite: (v: string) => void;
  setGithub: (v: string) => void;
  setLinkedin: (v: string) => void;
  setInstagram: (v: string) => void;
}

export default function SocialLinksCard({
  website,
  github,
  linkedin,
  instagram,
  setWebsite,
  setGithub,
  setLinkedin,
  setInstagram,
}: Props) {
  return (
    <section className="bg-zinc-900 rounded-3xl border border-zinc-800 p-8 shadow-xl">

      <h2 className="text-2xl font-bold mb-6">
        Redes y enlaces
      </h2>

      <div className="space-y-5">

        <div>
          <label className="block mb-2 text-zinc-400">
            Sitio web
          </label>

          <input
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-4 py-3 outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block mb-2 text-zinc-400">
            GitHub
          </label>

          <input
            value={github}
            onChange={(e) => setGithub(e.target.value)}
            className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-4 py-3 outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block mb-2 text-zinc-400">
            LinkedIn
          </label>

          <input
            value={linkedin}
            onChange={(e) => setLinkedin(e.target.value)}
            className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-4 py-3 outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block mb-2 text-zinc-400">
            Instagram
          </label>

          <input
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-4 py-3 outline-none focus:border-blue-500"
          />
        </div>

      </div>

    </section>
  );
}
