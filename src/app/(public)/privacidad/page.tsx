export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 text-slate-950 sm:px-6 sm:py-16">
      <article className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <header className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-800">
            Demo interna SentiQ
          </p>
          <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
            Aviso de privacidad provisional para demo
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-600">
            Esta página explica, en lenguaje simple, cómo se tratan los datos
            capturados en una demo interna de SentiQ. Es un aviso provisional y
            no sustituye una revisión legal.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Qué es este aviso</h2>
          <p className="leading-7 text-slate-700">
            Este aviso sirve solo para acompañar una demo interna de la encuesta
            SentiQ. No es un aviso de privacidad legal definitivo y no debe
            usarse como base para un piloto externo sin revisión legal previa.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Alcance de la demo</h2>
          <p className="leading-7 text-slate-700">
            La demo permite probar el flujo de encuesta, captura de comentarios
            y visualización de respuestas por parte del restaurante. Durante una
            demo, se recomienda evitar usar teléfonos reales.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Qué datos se capturan</h2>
          <p className="leading-7 text-slate-700">
            La encuesta captura calificaciones sobre la experiencia en el
            restaurante, un comentario opcional y, si el cliente decide
            compartirlo, un teléfono opcional para seguimiento.
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
            El teléfono no es obligatorio. Si una persona lo escribe, también
            debe aceptar el consentimiento mostrado en la encuesta. Ese teléfono
            se usa solo para que el restaurante pueda dar seguimiento al
            comentario recibido.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Consentimiento para contacto</h2>
          <p className="leading-7 text-slate-700">
            Si se usa un teléfono, debe existir consentimiento para contacto. Si
            no hay consentimiento, el teléfono no debe capturarse para
            seguimiento.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Quién puede ver la información</h2>
          <p className="leading-7 text-slate-700">
            Durante la demo, la información puede ser vista por personas
            autorizadas del restaurante y por el equipo de SentiQ que apoye la
            configuración, operación o revisión técnica de la demo.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Papel del restaurante</h2>
          <p className="leading-7 text-slate-700">
            El restaurante define el uso de la encuesta durante la demo y debe
            asegurarse de no usar datos personales reales sin contar con el
            consentimiento y la revisión legal necesarios.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Papel de SentiQ</h2>
          <p className="leading-7 text-slate-700">
            SentiQ funciona como herramienta técnica para capturar y mostrar las
            respuestas de la encuesta durante la demo. Este aviso no establece
            todavía un responsable legal definitivo.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">
            Solicitudes de corrección o eliminación durante demo
          </h2>
          <p className="leading-7 text-slate-700">
            Durante la demo, cualquier solicitud para corregir o eliminar datos
            debe revisarse con el restaurante y con el equipo de SentiQ que esté
            coordinando la prueba. El mecanismo formal para ejercer derechos
            ARCO queda pendiente de definición legal.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">
            Revisión legal pendiente antes de piloto externo
          </h2>
          <p className="leading-7 text-slate-700">
            Antes de usar SentiQ en un piloto externo con teléfono real, este
            aviso debe completarse con el responsable, un contacto formal y el
            mecanismo ARCO correspondiente. También debe pasar por revisión
            legal antes de presentarse como aviso definitivo.
          </p>
        </section>
      </article>
    </main>
  );
}
