import Link from "next/link";

export default function NotFound() {
  return (
    <main className="alumni-not-found-page">
      <div className="alumni-not-found-inner">
        <span className="alumni-not-found-code">
          Error 404 · Alumni.
        </span>

        <h1>
          Esta página ya no está disponible.
        </h1>

        <p>
          Puede que el enlace haya cambiado, el contenido
          haya sido eliminado o la dirección no exista.
          Tu cuenta y tu sesión siguen intactas.
        </p>

        <div className="alumni-not-found-actions">
          <Link href="/feed">
            Volver al Feed
          </Link>

          <Link href="/explore">
            Explorar Alumni
          </Link>
        </div>
      </div>
    </main>
  );
}

/* ALUMNI_2_7_0_NOT_FOUND */
