export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 text-slate-950 sm:px-6 sm:py-16">
      <article className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <header className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-800">
            Piloto controlado SentiQ
          </p>
          <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
            Aviso de privacidad provisional para piloto controlado
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-600">
            Esta página explica, en lenguaje sencillo, cómo se tratan los datos
            capturados durante un piloto controlado de SentiQ. Es un aviso
            provisional y no sustituye una revisión legal definitiva.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Qué es este aviso</h2>
          <p className="leading-7 text-slate-700">
            Este aviso sirve solo para acompañar un piloto controlado de la
            encuesta SentiQ. No es un aviso de privacidad legal definitivo para
            venta formal, expansión comercial o un uso externo más amplio.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Responsable provisional</h2>
          <p className="leading-7 text-slate-700">
            El responsable provisional durante el piloto es SentiQ, operado
            provisionalmente por Balam Eduardo Silva Domínguez.
          </p>
          <p className="leading-7 text-slate-700">
            Para solicitudes de privacidad, corrección o eliminación durante el
            piloto, el contacto provisional es{" "}
            <a
              href="mailto:coralab.web@gmail.com"
              className="font-medium text-teal-800 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-teal-600/25"
            >
              coralab.web@gmail.com
            </a>
            .
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Alcance del piloto</h2>
          <p className="leading-7 text-slate-700">
            El piloto permite probar el flujo de encuesta, captura de
            comentarios, seguimiento de experiencias reportadas y visualización
            de respuestas por parte del restaurante. Durante este piloto
            controlado pueden capturarse datos personales reales, incluido un
            teléfono, solo bajo las condiciones descritas en este aviso.
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
            durante el piloto solo si la persona decide compartirlo y acepta el
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
            operación del piloto.
          </p>
          <p className="leading-7 text-slate-700">
            El acceso está restringido por roles y no debe utilizarse para fines
            distintos a la operación, soporte o seguimiento autorizados.
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
            operar las respuestas de la encuesta durante el piloto controlado.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Conservación de datos</h2>
          <p className="leading-7 text-slate-700">
            Los datos necesarios para operar el piloto podrán conservarse
            durante su ejecución y hasta cinco meses después de su cierre, con el
            propósito de entregar exportaciones, resolver incidencias y acordar
            la continuidad del servicio.
          </p>
          <p className="leading-7 text-slate-700">
            Al terminar ese plazo, los teléfonos deberán eliminarse y los
            comentarios que puedan identificar a una persona deberán eliminarse o
            anonimizarse. Podrán conservarse métricas agregadas que no incluyan
            datos personales.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">
            Solicitudes de corrección, eliminación o anonimización
          </h2>
          <p className="leading-7 text-slate-700">
            Durante el piloto, cualquier solicitud para corregir, eliminar o
            anonimizar datos puede enviarse a{" "}
            <a
              href="mailto:coralab.web@gmail.com"
              className="font-medium text-teal-800 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-teal-600/25"
            >
              coralab.web@gmail.com
            </a>
            .
          </p>
          <p className="leading-7 text-slate-700">
            Las solicitudes autorizadas de eliminación o anonimización se
            atenderán en un plazo máximo de tres meses. Si una obligación legal
            o contractual exige un plazo menor, se aplicará el plazo menor.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Revisión legal pendiente</h2>
          <p className="leading-7 text-slate-700">
            Este aviso es provisional. Antes de una venta formal, una expansión
            o un uso externo más amplio, el aviso y los procesos de privacidad
            deberán pasar por revisión legal y convertirse en un aviso
            definitivo.
          </p>
        </section>
      </article>
    </main>
  );
}
