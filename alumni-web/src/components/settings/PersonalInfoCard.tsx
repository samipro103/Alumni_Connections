"use client";

interface Props {
  fullName: string;
  username: string;
  bio: string;

  setFullName: (v: string) => void;
  setUsername: (v: string) => void;
  setBio: (v: string) => void;
}

export default function PersonalInfoCard({
  fullName,
  username,
  bio,
  setFullName,
  setUsername,
  setBio,
}: Props) {
  return (
    <section className="bg-zinc-900 rounded-3xl border border-zinc-800 p-8 shadow-xl">

      <h2 className="text-2xl font-bold mb-6">
        Información personal
      </h2>

      <div className="grid md:grid-cols-2 gap-6">

        <div>

          <label className="block mb-2 text-zinc-400">
            Nombre completo
          </label>

          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-4 py-3 outline-none focus:border-blue-500"
          />

        </div>

        <div>

          <label className="block mb-2 text-zinc-400">
            Username
          </label>

          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-4 py-3 outline-none focus:border-blue-500"
          />

        </div>

      </div>

      <div className="mt-6">

        <label className="block mb-2 text-zinc-400">
          Biografía
        </label>

        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={5}
          className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-4 py-3 outline-none resize-none focus:border-blue-500"
        />

      </div>

    </section>
  );
}
