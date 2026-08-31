import LegalPage from "@/components/legal/LegalPage";

export default function CommunityPage() {
  return (
    <LegalPage
      eyebrow="Comunidad Alumni"
      title="Normas de comunidad"
      intro="Alumni está pensado para crear conexiones académicas y profesionales útiles. Estas reglas ayudan a mantener un espacio confiable."
      sections={[
        {
          title:
            "Respeto primero",
          body: [
            "No se permite acoso, intimidación, amenazas, hostigamiento persistente ni ataques dirigidos a otra persona.",
            "Si una interacción no te interesa, puedes silenciar o bloquear a la persona. Un bloqueo corta seguimiento, mensajes y acceso a contenido privado entre ambas cuentas.",
          ],
        },
        {
          title:
            "Identidad y confianza",
          body: [
            "No suplantes a otra persona, institución o empresa. No utilices perfiles, logotipos o credenciales de forma engañosa para obtener confianza, dinero o información.",
            "No publiques datos privados de otra persona sin autorización.",
          ],
        },
        {
          title:
            "Spam, fraude y abuso",
          body: [
            "No envíes mensajes masivos no solicitados, enlaces maliciosos, esquemas fraudulentos, estafas, malware ni instrucciones destinadas a vulnerar la plataforma.",
            "Las oportunidades académicas o laborales deben describirse de forma honesta y no pueden utilizarse como pretexto para capturar credenciales o pagos engañosos.",
          ],
        },
        {
          title:
            "Contenido no permitido",
          body: [
            "No se permite contenido que explote o sexualice a menores, promueva odio o violencia contra personas por características protegidas, facilite actividades ilegales, distribuya material sexual explícito o intente engañar a otras personas mediante fraude, malware o prácticas abusivas.",
            "Alumni puede retirar contenido o limitar cuentas cuando una publicación, historia, mensaje público o perfil incumpla estas normas o represente un riesgo para la comunidad.",
          ],
        },
        {
          title:
            "Reportar",
          body: [
            "Desde un perfil puedes reportar spam, acoso, suplantación, contenido inapropiado, fraude, problemas de privacidad u otras conductas. Los reportes se almacenan para revisión y seguimiento.",
            "Utiliza los reportes de buena fe. Los reportes deliberadamente falsos o abusivos también pueden considerarse una infracción.",
          ],
        },
      ]}
    />
  );
}
