import LegalPage from "@/components/legal/LegalPage";

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Alumni."
      title="Términos de uso"
      intro="Estos términos establecen las reglas básicas para utilizar Alumni de manera segura, profesional y respetuosa."
      sections={[
        {
          title:
            "Tu cuenta",
          body: [
            "Debes proporcionar información razonablemente auténtica, proteger tus credenciales y no compartir el acceso a tu cuenta de forma que ponga en riesgo a otras personas o a la plataforma.",
            "Eres responsable de las acciones realizadas desde tu sesión mientras no hayas reportado un acceso no autorizado.",
          ],
        },
        {
          title:
            "Uso aceptable",
          body: [
            "No puedes utilizar Alumni para acosar, amenazar, suplantar identidades, distribuir malware, cometer fraude, recolectar datos de forma no autorizada, enviar spam o intentar vulnerar las medidas de seguridad.",
            "Tampoco puedes intentar acceder a información, mensajes, archivos o funciones para los que tu cuenta no tenga autorización.",
          ],
        },
        {
          title:
            "Tu contenido",
          body: [
            "Conservas la responsabilidad sobre el contenido que publicas. Al publicarlo, autorizas a Alumni a procesarlo y mostrarlo dentro de la plataforma según la configuración de privacidad y las funciones necesarias para prestar el servicio.",
            "Debes contar con los derechos o permisos necesarios sobre fotografías, textos, documentos y demás material que compartas.",
          ],
        },
        {
          title:
            "Moderación y seguridad",
          body: [
            "Alumni puede limitar, ocultar o eliminar contenido y puede restringir cuentas cuando sea necesario para proteger a usuarios, cumplir obligaciones legales o hacer cumplir estas reglas.",
            "Los reportes se utilizan como señales de revisión; un reporte no implica automáticamente que una persona haya infringido las normas.",
          ],
        },
        {
          title:
            "Cambios y disponibilidad",
          body: [
            "Alumni puede actualizar funciones, medidas de seguridad y características del servicio por motivos de desempeño, cumplimiento, protección de la comunidad o mejora del producto.",
            "Estos términos también pueden actualizarse cuando cambie el servicio o sea necesario reflejar nuevas obligaciones. Cuando un cambio sea relevante para el uso de la plataforma, Alumni procurará comunicarlo de forma razonable.",
          ],
        },
      ]}
    />
  );
}
