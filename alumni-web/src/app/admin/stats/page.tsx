export default function AdminStatsPage() {
  return (
    <main className="min-h-screen bg-[#09090B] text-white p-8">

      <h1 className="text-5xl font-bold mb-10">
        📊 Estadísticas
      </h1>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">

        <div className="bg-zinc-900 rounded-3xl p-6">
          <h2 className="text-xl font-bold">
            👥 Usuarios
          </h2>
        </div>

        <div className="bg-zinc-900 rounded-3xl p-6">
          <h2 className="text-xl font-bold">
            📝 Publicaciones
          </h2>
        </div>

        <div className="bg-zinc-900 rounded-3xl p-6">
          <h2 className="text-xl font-bold">
            💬 Mensajes
          </h2>
        </div>

        <div className="bg-zinc-900 rounded-3xl p-6">
          <h2 className="text-xl font-bold">
            🎓 Eventos
          </h2>
        </div>

      </div>

    </main>
  );
}
