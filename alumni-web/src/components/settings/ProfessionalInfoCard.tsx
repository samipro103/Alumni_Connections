"use client";

interface Props {
  university: string;
  career: string;
  city: string;
  country: string;

  setUniversity: (v: string) => void;
  setCareer: (v: string) => void;
  setCity: (v: string) => void;
  setCountry: (v: string) => void;
}

export default function ProfessionalInfoCard({
  university,
  career,
  city,
  country,
  setUniversity,
  setCareer,
  setCity,
  setCountry,
}: Props) {
  return (
    <section className="bg-zinc-900 rounded-3xl border border-zinc-800 p-8 shadow-xl">

      <h2 className="text-2xl font-bold mb-6">
        Información académica
      </h2>

      <div className="grid md:grid-cols-2 gap-6">

        <div>
          <label className="block mb-2 text-zinc-400">
            Universidad
          </label>

          <input
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
            className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-4 py-3 outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block mb-2 text-zinc-400">
            Carrera
          </label>

          <input
            value={career}
            onChange={(e) => setCareer(e.target.value)}
            className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-4 py-3 outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block mb-2 text-zinc-400">
            Ciudad
          </label>

          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-4 py-3 outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block mb-2 text-zinc-400">
            País
          </label>

          <input
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-4 py-3 outline-none focus:border-blue-500"
          />
        </div>

      </div>

    </section>
  );
}
