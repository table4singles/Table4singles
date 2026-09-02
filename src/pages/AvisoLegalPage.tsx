import { ArrowLeft } from 'lucide-react'

interface Props {
  onNavigate: (page: string) => void
  returnTo?: string
}

export function AvisoLegalPage({ onNavigate, returnTo = 'landing' }: Props) {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button onClick={() => onNavigate(returnTo)} className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-6 text-sm">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>
        <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white border-b-2 border-primary-500 pb-3 mb-6">Aviso Legal</h1>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-700 dark:text-gray-300 leading-relaxed">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8">1. Datos identificativos</h2>
          <p>En cumplimiento con el deber de información recogido en el artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y del Comercio Electrónico, a continuación se reflejan los siguientes datos:</p>
          <p><strong>Denominación:</strong> Table4Singles<br />
          <strong>Dominio web:</strong> table4singles.online<br />
          <strong>Contacto:</strong> info@table4singles.online</p>

          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8">2. Objeto</h2>
          <p>Table4Singles es una plataforma que facilita la organización de cenas compartidas entre personas en restaurantes colaboradores. El servicio permite a los usuarios crear y unirse a mesas, comunicarse con otros comensales y gestionar reservas.</p>

          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8">3. Condiciones de uso</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>El usuario se compromete a hacer un uso adecuado de la plataforma, conforme a la ley, la moral y el orden público.</li>
            <li>El usuario debe ser mayor de 18 años para registrarse y utilizar el servicio.</li>
            <li>El uso del servicio implica la aceptación de estas condiciones y de la Política de Privacidad.</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8">4. Propiedad intelectual</h2>
          <p>Todos los contenidos del sitio web (textos, imágenes, logotipos, código fuente, diseño gráfico) son propiedad de Table4Singles o de sus legítimos titulares. Queda prohibida su reproducción sin autorización expresa.</p>

          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8">5. Responsabilidad</h2>
          <p>Table4Singles no se hace responsable de los daños que pudieran derivarse del uso inadecuado de la plataforma por parte de los usuarios, ni de la conducta de los usuarios durante las cenas organizadas a través del servicio.</p>

          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8">6. Legislación aplicable</h2>
          <p>Las presentes condiciones se rigen por la legislación española. Para la resolución de cualquier controversia, las partes se someten a los Juzgados y Tribunales de Barcelona.</p>
        </div>
      </div>
    </div>
  )
}
