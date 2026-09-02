import { ArrowLeft } from 'lucide-react'

interface Props {
  onNavigate: (page: string) => void
  returnTo?: string
}

export function PrivacyPolicyPage({ onNavigate, returnTo = 'landing' }: Props) {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button onClick={() => onNavigate(returnTo)} className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-6 text-sm">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>
        <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white border-b-2 border-primary-500 pb-3 mb-6">Política de Privacidad</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Última actualización: 1 de julio de 2026</p>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-700 dark:text-gray-300 leading-relaxed">
          <p><strong>Table4Singles</strong> ("nosotros", "la app") se compromete a proteger la privacidad de sus usuarios. Esta política describe cómo recopilamos, usamos y protegemos su información personal.</p>

          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8">1. Responsable del tratamiento</h2>
          <p>El responsable del tratamiento de sus datos es Table4Singles. Para cualquier consulta: <strong>privacy@table4singles.online</strong></p>

          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8">2. Información que recopilamos</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Datos de registro:</strong> nombre, dirección de correo electrónico y contraseña cifrada.</li>
            <li><strong>Datos de perfil:</strong> nombre para mostrar, género, ciudad, preferencias de idioma.</li>
            <li><strong>Datos de uso:</strong> mesas creadas, reservas realizadas, mensajes enviados dentro de la app.</li>
            <li><strong>Datos de pago:</strong> procesados de forma segura a través de Stripe. No almacenamos datos de tarjetas de crédito.</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8">3. Base legal del tratamiento</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Ejecución del contrato:</strong> para prestar el servicio de reservas y comunicación entre comensales.</li>
            <li><strong>Consentimiento:</strong> para el envío de notificaciones y comunicaciones comerciales.</li>
            <li><strong>Interés legítimo:</strong> para mejorar el servicio y prevenir fraude.</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8">4. Cómo usamos su información</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Para crear y gestionar su cuenta.</li>
            <li>Para facilitar reservas en mesas y la comunicación entre comensales.</li>
            <li>Para procesar pagos y depósitos.</li>
            <li>Para enviar notificaciones relevantes sobre sus reservas.</li>
            <li>Para mejorar la experiencia del usuario y el funcionamiento de la app.</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8">5. Compartición de datos</h2>
          <p>No vendemos ni compartimos su información personal con terceros, excepto:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Stripe Inc. (EE.UU.):</strong> para procesar pagos de forma segura, bajo cláusulas contractuales tipo.</li>
            <li><strong>Supabase Inc. (EE.UU.):</strong> como proveedor de infraestructura y base de datos, bajo cláusulas contractuales tipo.</li>
            <li><strong>Otros usuarios:</strong> su nombre de perfil es visible para los comensales de la misma mesa.</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8">6. Sus derechos (RGPD)</h2>
          <p>Usted tiene derecho a: acceso, rectificación, supresión, portabilidad, oposición, limitación y retirada del consentimiento.</p>
          <p>Para ejercer estos derechos, contacte con: <strong>privacy@table4singles.online</strong></p>

          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8">7. Seguridad de datos</h2>
          <p>Implementamos medidas de seguridad técnicas y organizativas, incluyendo encriptación en tránsito (HTTPS/TLS), autenticación segura, y políticas de acceso a nivel de fila (RLS) en nuestra base de datos.</p>

          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8">8. Autoridad de control</h2>
          <p>Puede presentar una reclamación ante la Agencia Española de Protección de Datos (AEPD): <a href="https://www.aepd.es" className="text-primary-500 dark:text-primary-400 hover:text-primary-600 dark:hover:text-primary-300">www.aepd.es</a></p>
        </div>
      </div>
    </div>
  )
}
