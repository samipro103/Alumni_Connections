import LegalPage from "@/components/legal/LegalPage";

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Confianza"
      title="Privacidad"
      intro="Esta política explica, de forma clara, qué información utiliza Alumni, para qué la utiliza y qué controles tienes sobre tu cuenta."
      sections={[
        {
          title:
            "Información de tu cuenta",
          body: [
            "Alumni procesa datos necesarios para crear y proteger tu cuenta, como correo electrónico, identificador de usuario, nombre de usuario y datos de autenticación administrados por Supabase Auth. Alumni no muestra tu contraseña ni tiene acceso a la contraseña en texto plano.",
            "También puedes añadir información de perfil, académica, ubicación general, fotografía, portada y enlaces externos. Tú decides qué información completas dentro de los campos opcionales.",
          ],
        },
        {
          title:
            "Publicaciones, historias y mensajes",
          body: [
            "El contenido que publicas se almacena para poder mostrarlo a las personas autorizadas. Las cuentas privadas limitan publicaciones e historias a seguidores aprobados.",
            "Los mensajes y sus archivos están restringidos a los participantes de la conversación. Alumni utiliza controles de acceso a nivel de base de datos y almacenamiento para reducir el riesgo de acceso no autorizado.",
          ],
        },
        {
          title:
            "Medios de cuentas privadas",
          body: [
            "Las publicaciones e historias de cuentas privadas utilizan almacenamiento privado y enlaces temporales firmados. Estos enlaces expiran y solo se generan cuando la sesión tiene permiso para ver el contenido.",
            "La fotografía de perfil y otros elementos básicos de identidad pueden mantenerse visibles para permitir que otros miembros encuentren la cuenta, según el diseño actual de la plataforma.",
          ],
        },
        {
          title:
            "Seguridad",
          body: [
            "Alumni utiliza controles de sesión, RLS en Supabase, permisos por usuario, verificación de registro por correo, validación de enlaces, restricciones de almacenamiento y controles contra abuso.",
            "Ningún sistema puede garantizar riesgo cero. Si detectas actividad sospechosa, cambia tu contraseña, revisa tu autenticación y utiliza las herramientas de bloqueo y reporte.",
          ],
        },
        {
          title:
            "Publicidad, cookies y proveedores externos",
          body: [
            "Alumni puede mostrar publicidad de terceros en determinadas áreas públicas o sociales de la plataforma. Para operar y medir esos anuncios, proveedores como Google AdSense pueden utilizar cookies, identificadores o tecnologías similares de acuerdo con sus propias políticas y con las opciones de consentimiento aplicables.",
            "Cuando la normativa lo requiere, Alumni utiliza mecanismos de gestión de consentimiento para ofrecer opciones sobre el uso de datos con fines publicitarios. La disponibilidad de anuncios y su personalización pueden variar según la región, la configuración del usuario y las decisiones de consentimiento.",
            "Los mensajes privados no se utilizan como una superficie de anuncios dentro de Alumni. La publicidad se mantiene separada de las conversaciones privadas entre usuarios.",
          ],
        },
        {
          title:
            "Tus controles",
          body: [
            "Puedes cambiar tu contraseña, recuperar tu cuenta por correo, bloquear o silenciar personas, reportar conductas, cambiar la privacidad de la cuenta, descargar una copia de tus datos y solicitar la eliminación de tu cuenta desde Configuración.",
            "Al eliminar tu cuenta, Alumni inicia la eliminación del usuario y de los datos asociados que puedan vincularse directamente a él, sujeto a copias de seguridad, obligaciones legales, prevención de fraude y datos que deban conservarse durante un plazo razonable.",
          ],
        },
      ]}
    />
  );
}
