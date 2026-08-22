export default function Feed() {
  return (
    <section className="flex-1 max-w-2xl mx-auto p-6">

      {/* CREATE POST */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-6">
        
        <input
          type="text"
          placeholder="¿Qué está pasando?"
          className="w-full bg-transparent outline-none text-white placeholder:text-zinc-500"
        />

        <div className="flex justify-end mt-4">
          <button className="bg-blue-500 hover:bg-blue-600 transition px-5 py-2 rounded-full font-semibold">
            Publicar
          </button>
        </div>
      </div>

      {/* POST */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">

        <div className="flex items-center gap-3">

          <div className="w-12 h-12 rounded-full bg-zinc-700"></div>

          <div>
            <h2 className="font-semibold">
              Samuel Rivera
            </h2>

            <p className="text-zinc-500 text-sm">
              Universidad Gerardo Barrios
            </p>
          </div>
        </div>

        <p className="mt-4 text-zinc-200">
          Bienvenidos a AlumniConnections 🚀
        </p>

        <div className="mt-5 rounded-2xl bg-zinc-800 h-72"></div>

        <div className="flex gap-6 mt-5 text-zinc-400">
          <button>❤️ 24</button>
          <button>💬 12</button>
          <button>🔁 5</button>
        </div>
      </div>
    </section>
  );
}