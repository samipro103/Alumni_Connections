export default function Rightbar() {
  return (
    <aside className="hidden xl:block w-80 border-l border-zinc-800 p-6">

      <div className="bg-zinc-900 rounded-3xl p-5 mb-6">
        <h2 className="font-bold text-xl mb-4">
          🎓 Próximos eventos
        </h2>

        <div className="space-y-3">

          <div>
            <p className="font-semibold">
              Hackathon UGB
            </p>
            <p className="text-zinc-500 text-sm">
              Julio 2026
            </p>
          </div>

          <div>
            <p className="font-semibold">
              Feria de Empleo
            </p>
            <p className="text-zinc-500 text-sm">
              Agosto 2026
            </p>
          </div>

        </div>
      </div>

      <div className="bg-zinc-900 rounded-3xl p-5">

        <h2 className="font-bold text-xl mb-4">
          📊 Plataforma
        </h2>

        <div className="space-y-3">

          <p>👥 Estudiantes conectados</p>
          <p>💬 Mensajes enviados</p>
          <p>🎓 Eventos activos</p>

        </div>

      </div>

    </aside>
  );
}