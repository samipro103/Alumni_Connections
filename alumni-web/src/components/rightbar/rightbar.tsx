export default function Rightbar() {
  return (
    <aside className="
      hidden
      xl:block
      w-80
      p-6
      sticky
      top-0
      h-screen
    ">

      {/* EVENTOS */}
      <div className="glass rounded-3xl p-5 shadow-2xl mb-6">

        <h2 className="font-bold text-xl mb-4">
          🎓 Próximos eventos
        </h2>

        <div className="space-y-4">

          <div className="bg-zinc-800 rounded-2xl p-4">
            <p className="text-sm text-zinc-500">
              Julio 2026
            </p>

            <h3 className="font-semibold">
              Hackathon UGB
            </h3>
          </div>

          <div className="bg-zinc-800 rounded-2xl p-4">
            <p className="text-sm text-zinc-500">
              Agosto 2026
            </p>

            <h3 className="font-semibold">
              Feria de Empleo
            </h3>
          </div>

        </div>

      </div>

      {/* USUARIOS DESTACADOS */}
      <div className="glass rounded-3xl p-5 shadow-2xl mb-6">

        <h2 className="font-bold text-xl mb-4">
          👥 Usuarios destacados
        </h2>

        <div className="space-y-4">

          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-full bg-zinc-700"></div>

            <div>
              <p className="font-medium">
                @samuel
              </p>

              <p className="text-xs text-zinc-500">
                Ingeniería en Sistemas
              </p>
            </div>

          </div>

          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-full bg-zinc-700"></div>

            <div>
              <p className="font-medium">
                @alumni
              </p>

              <p className="text-xs text-zinc-500">
                Universidad
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* ESTADÍSTICAS */}
      <div className="glass rounded-3xl p-5 shadow-2xl">

        <h2 className="font-bold text-xl mb-4">
          📈 Comunidad
        </h2>

        <div className="space-y-3">

          <div className="flex justify-between">
            <span className="text-zinc-400">
              Usuarios
            </span>

            <span>
              125
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-zinc-400">
              Publicaciones
            </span>

            <span>
              742
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-zinc-400">
              Eventos
            </span>

            <span>
              12
            </span>
          </div>

        </div>

      </div>

    </aside>
  );
}
