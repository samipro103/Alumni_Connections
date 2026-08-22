export default function Home() {
  return (
    <main className="min-h-screen bg-[#09090B] text-white px-6 py-10">

      <div className="max-w-6xl mx-auto space-y-10">

        <section className="rounded-3xl bg-zinc-900 border border-zinc-800 p-8 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm text-zinc-400">Bienvenido de nuevo,</p>
              <h1 className="text-5xl font-bold">👋 Bienvenido</h1>
            </div>
            <p className="rounded-3xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white">
              Dashboard principal
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-4">
            <div className="rounded-3xl bg-zinc-950 border border-zinc-800 p-5">
              <p className="text-sm text-zinc-500">📊 Estadísticas</p>
              <p className="mt-3 text-3xl font-semibold">12</p>
            </div>
            <div className="rounded-3xl bg-zinc-950 border border-zinc-800 p-5">
              <p className="text-sm text-zinc-500">📝 Posts</p>
              <p className="mt-3 text-3xl font-semibold">34</p>
            </div>
            <div className="rounded-3xl bg-zinc-950 border border-zinc-800 p-5">
              <p className="text-sm text-zinc-500">👥 Seguidores</p>
              <p className="mt-3 text-3xl font-semibold">1.2k</p>
            </div>
            <div className="rounded-3xl bg-zinc-950 border border-zinc-800 p-5">
              <p className="text-sm text-zinc-500">💬 Mensajes</p>
              <p className="mt-3 text-3xl font-semibold">86</p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-zinc-900 border border-zinc-800 p-8 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold">🎓 Próximos eventos</h2>
              <p className="mt-2 text-zinc-400">Mantente al día con las próximas actividades y conferencias.</p>
            </div>
            <button className="rounded-3xl border border-zinc-800 px-5 py-2 text-sm font-semibold text-white hover:bg-zinc-800 transition">
              Ver todos
            </button>
          </div>

          <div className="mt-8 grid gap-4 xl:grid-cols-3">
            <article className="rounded-3xl bg-zinc-950 border border-zinc-800 p-6">
              <p className="text-sm uppercase tracking-[0.2em] text-blue-400 font-semibold">Jun 12</p>
              <h3 className="mt-4 text-2xl font-bold text-white">Hackathon Alumni</h3>
              <p className="mt-3 text-zinc-400">Networking, talleres y proyectos con mentores.</p>
              <p className="mt-4 text-sm text-zinc-500">📍 San Salvador</p>
            </article>
            <article className="rounded-3xl bg-zinc-950 border border-zinc-800 p-6">
              <p className="text-sm uppercase tracking-[0.2em] text-blue-400 font-semibold">Jun 18</p>
              <h3 className="mt-4 text-2xl font-bold text-white">Feria de empleo</h3>
              <p className="mt-3 text-zinc-400">Conoce empresas, aplica a vacantes y mejora tu CV.</p>
              <p className="mt-4 text-sm text-zinc-500">📍 Universidad Gerardo Barrios</p>
            </article>
            <article className="rounded-3xl bg-zinc-950 border border-zinc-800 p-6">
              <p className="text-sm uppercase tracking-[0.2em] text-blue-400 font-semibold">Jun 25</p>
              <h3 className="mt-4 text-2xl font-bold text-white">Charla de líderes</h3>
              <p className="mt-3 text-zinc-400">Panel de exalumnos con experiencias de carrera.</p>
              <p className="mt-4 text-sm text-zinc-500">📍 Virtual</p>
            </article>
          </div>
        </section>

      </div>

    </main>
  );
}
