import {
  Home,
  Search,
  Calendar,
  MessageCircle,
  User,
} from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="w-64 border-r border-zinc-800 p-6 hidden md:flex flex-col">
      
      <h1 className="text-2xl font-bold mb-10">
        AlumniConnections
      </h1>

      <nav className="flex flex-col gap-3">

        <button className="flex items-center gap-3 hover:bg-zinc-900 p-3 rounded-xl transition">
          <Home size={20} />
          Inicio
        </button>

        <button className="flex items-center gap-3 hover:bg-zinc-900 p-3 rounded-xl transition">
          <Search size={20} />
          Explorar
        </button>

        <button className="flex items-center gap-3 hover:bg-zinc-900 p-3 rounded-xl transition">
          <Calendar size={20} />
          Eventos
        </button>

        <button className="flex items-center gap-3 hover:bg-zinc-900 p-3 rounded-xl transition">
          <MessageCircle size={20} />
          Mensajes
        </button>

        <button className="flex items-center gap-3 hover:bg-zinc-900 p-3 rounded-xl transition">
          <User size={20} />
          Perfil
        </button>
      </nav>
    </aside>
  );
}