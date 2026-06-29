export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 text-slate-950 sm:px-6 sm:py-16">
      <article className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <header className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-800">
            Demo controlada SentiQ
          </p>
          <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
            Aviso de privacidad provisional para demo controlada
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-600">
            Esta página explica, en lenguaje simple, cómo se tratan los datos
            capturados durante una demo controlada de SentiQ. Es un aviso
            provisional y no sustituye una revisión legal definitiva.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Qué es este aviso</h2>
          <p className="leading-7 text-slate-700">
            Este aviso sirve solo para acompañar una demo controlada de la
            encuesta SentiQ. No es un aviso de privacidad legal definitivo para
            venta formal, expansión comercial o un piloto externo más amplio.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Responsable provisional</h2>
          <p className="leading-7 text-slate-700">
            El responsable provisional durante la demo es SentiQ, operado provisionalmente por Balam Eduardo Silva Domínguez.
          </p>
          <p className="leading-7 text-slate-700">
            Para solicitudes de privacidad, corrección o eliminación durante la
            demo, el contacto provisional es{" "}
            <a
              href="mailto:coralab.web@gmail.com"
              className="font-medium text-teal-800 underline-offset-4 hover:underline"
            >
              coralab.web@gmail.com
            </a>
            .
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Alcance de la demo</h2>
          <p className="leading-7 text-slate-700">
            La demo permite probar el flujo de encuesta, captura de comentarios,
            seguimiento de experiencias reportadas y visualización de respuestas
            por parte del restaurante. Durante esta demo controlada pueden
            capturarse datos personales reales, incluido un teléfono, solo bajo
            las condiciones descritas en este aviso.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Qué datos se capturan</h2>
          <p className="leading-7 text-slate-700">
            La encuesta captura calificaciones sobre la experiencia en el
            restaurante, un comentario opcional y, si la persona decide
            compartirlo, un teléfono opcional para seguimiento.
          </p>
          <p className="leading-7 text-slate-700">
            Los comentarios abiertos pueden contener datos personales si la
            persona los escribe dentro del texto.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Qué datos no se capturan</h2>
          <p className="leading-7 text-slate-700">
            La encuesta no pide nombre, correo electrónico, domicilio, datos de
            pago ni documentos oficiales.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Uso del teléfono opcional</h2>
          <p className="leading-7 text-slate-700">
            El teléfono no es obligatorio. Puede capturarse un teléfono real
            durante la demo solo si la persona decide compartirlo y acepta el
            consentimiento explícito mostrado en la encuesta.
          </p>
          <p className="leading-7 text-slate-700">
            Ese teléfono se usa únicamente para dar seguimiento a la experiencia
            reportada.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Consentimiento para contacto</h2>
          <p className="leading-7 text-slate-700">
            Si se deja teléfono, el consentimiento es obligatorio. Si no hay
            consentimiento, el teléfono no debe capturarse ni usarse para
            seguimiento.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Quién puede ver la información</h2>
          <p className="leading-7 text-slate-700">
            El administrador del restaurante puede ver y exportar respuestas y
            teléfonos consentidos dentro de su restaurante.
          </p>
          <p className="leading-7 text-slate-700">
            Los gerentes autorizados pueden ver y exportar respuestas y
            teléfonos consentidos solo de las sucursales asignadas.
          </p>
          <p className="leading-7 text-slate-700">
            El equipo operador de SentiQ solo puede acceder a la información
            cuando sea necesario para soporte técnico, corrección, eliminación u
            operación de la demo.
          </p>
          <p className="leading-7 text-slate-700">
            El platform admin no debe ver teléfonos ni respuestas individuales
            por defecto.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Papel del restaurante</h2>
          <p className="leading-7 text-slate-700">
            El restaurante usa la encuesta para recibir retroalimentación y dar
            seguimiento a experiencias reportadas cuando exista consentimiento
            para contacto.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Papel de SentiQ</h2>
          <p className="leading-7 text-slate-700">
            SentiQ funciona como herramienta técnica para capturar, mostrar y
            operar las respuestas de la encuesta durante la demo controlada.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Conservación de datos</h2>
          <p className="leading-7 text-slate-700">
            Los datos personales se conservarán hasta terminar la demo.
          </p>
          <p className="leading-7 text-slate-700">
            Al finalizar la demo, los datos personales se eliminarán o anonimizarán y se conservarán únicamente métricas agregadas.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">
            Solicitudes de corrección o eliminación durante demo
          </h2>
          <p className="leading-7 text-slate-700">
            Durante la demo, cualquier solicitud para corregir o eliminar datos
            puede enviarse a{" "}
            <a
              href="mailto:coralab.web@gmail.com"
              className="font-medium text-teal-800 underline-offset-4 hover:underline"
            >
              coralab.web@gmail.com
            </a>
            . Estas solicitudes se revisarán durante la operación de la demo.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Revisión legal pendiente</h2>
          <p className="leading-7 text-slate-700">
            Este aviso es provisional. Antes de una venta formal, una expansión
            o un piloto externo más amplio, el aviso y los procesos de
            privacidad deberán pasar por revisión legal y convertirse en un
            aviso definitivo.
          </p>
        </section>
      </article>
    </main>
  );
}
