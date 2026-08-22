import AdminGuard from "@/components/admin/AdminGuard";

export default function AdminPage() {
  return (
    <AdminGuard>
      <main className="min-h-screen bg-[#09090B] text-white">

      <div className="max-w-7xl mx-auto p-8">

        <h1 className="text-5xl font-bold mb-8">
          👑 Panel Administrador
        </h1>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">

          <a
            href="/admin/users"
            className="block bg-zinc-900 border border-zinc-800 rounded-3xl p-6 hover:border-blue-500 transition"
          >
            <h2 className="text-xl font-bold">
              👥 Usuarios
            </h2>

            <p className="text-zinc-400 mt-3">
              Gestionar usuarios registrados.
            </p>
          </a>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
            <h2 className="text-xl font-bold">
              🎓 Eventos
            </h2>

            <p className="text-zinc-400 mt-3">
              Crear y administrar eventos.
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
            <h2 className="text-xl font-bold">
              📝 Publicaciones
            </h2>

            <p className="text-zinc-400 mt-3">
              Moderar contenido.
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
            <h2 className="text-xl font-bold">
              📊 Estadísticas
            </h2>

            <p className="text-zinc-400 mt-3">
              Ver actividad de la plataforma.
            </p>
          </div>

        </div>

      </div>

    </main>
    </AdminGuard>
  );
}
