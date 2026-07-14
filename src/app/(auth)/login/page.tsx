"use client";

import { ArrowLeft, ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { getPostLoginRedirect, getCurrentSessionProfile } from "@/lib/auth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const genericLoginError =
  "No pudimos iniciar sesión. Revisa tus datos o solicita acceso al administrador.";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FormErrors = {
  email?: string;
  password?: string;
};

function validateLoginForm(email: string, password: string): FormErrors {
  const nextErrors: FormErrors = {};
  const normalizedEmail = email.trim();

  if (!normalizedEmail) {
    nextErrors.email = "Ingresa tu correo electrónico.";
  } else if (!emailPattern.test(normalizedEmail)) {
    nextErrors.email = "Ingresa un correo electrónico válido.";
  }

  if (!password) {
    nextErrors.password = "Ingresa tu contraseña.";
  }

  return nextErrors;
}

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResolvingSession, setIsResolvingSession] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function redirectExistingSession() {
      const sessionState = await getCurrentSessionProfile();

      if (!isMounted) {
        return;
      }

      if (sessionState.status === "authenticated" && sessionState.role) {
        router.replace(getPostLoginRedirect(sessionState.role));
        return;
      }

      if (
        sessionState.isAuthenticated &&
        sessionState.status !== "unauthenticated"
      ) {
        await supabase.auth.signOut();
      }

      if (isMounted) {
        setIsResolvingSession(false);
      }
    }

    redirectExistingSession();

    return () => {
      isMounted = false;
    };
  }, [router, supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateLoginForm(email, password);
    setErrors(nextErrors);
    setFormError(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setFormError(genericLoginError);
      setIsSubmitting(false);
      return;
    }

    const sessionState = await getCurrentSessionProfile();

    if (sessionState.status === "authenticated" && sessionState.role) {
      router.replace(getPostLoginRedirect(sessionState.role));
      return;
    }

    await supabase.auth.signOut();
    setFormError(genericLoginError);
    setIsSubmitting(false);
  }

  const isBusy = isResolvingSession || isSubmitting;

  if (isResolvingSession) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#fbf7ef] px-6 text-[#24102d]">
        <Link
          href="/"
          className="absolute left-6 top-6 text-3xl font-semibold tracking-[-0.05em] sm:left-10 sm:top-8"
        >
          Senti<span className="text-[#ff5947]">Q</span>
        </Link>
        <div className="flex items-center gap-3 text-sm font-medium text-[#6d626c]">
          <Loader2 className="size-5 animate-spin text-[#ff5947]" aria-hidden="true" />
          <span>Validando sesión...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fbf7ef] text-[#24102d]">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1.08fr)_minmax(30rem,0.92fr)]">
        <aside className="relative hidden min-h-screen overflow-hidden border-r border-[#38203e]/10 lg:block">
          <Image
            src="/images/landing/hero-restaurant-editorial.webp"
            alt=""
            fill
            priority
            sizes="55vw"
            className="object-cover object-[70%_center]"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(251,247,239,.98)_0%,rgba(251,247,239,.9)_34%,rgba(251,247,239,.24)_68%,rgba(251,247,239,.72)_100%)]" aria-hidden="true" />
          <div className="relative z-10 flex min-h-screen flex-col justify-between p-10 xl:p-14">
            <Link
              href="/"
              className="w-fit text-4xl font-semibold tracking-[-0.055em] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#ff5947]/25"
            >
              Senti<span className="text-[#ff5947]">Q</span>
            </Link>

            <div className="max-w-xl pb-[38vh] xl:pb-[34vh]">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff5947]">
                Acceso para restaurantes
              </p>
              <h1 className="mt-5 text-balance text-5xl font-semibold leading-[0.98] tracking-[-0.05em] xl:text-6xl">
                Escucha la operación. Da seguimiento.
              </h1>
              <p className="mt-5 max-w-lg text-lg leading-8 text-[#615761]">
                Respuestas, alertas y herramientas del restaurante en un espacio
                de trabajo con acceso controlado.
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-[#38203e]/15 pt-5 text-xs font-bold uppercase tracking-[0.14em] text-[#716671]">
              <span>Feedback operativo</span>
              <span>Piloto controlado</span>
            </div>
          </div>
        </aside>

        <section className="flex min-h-screen items-center justify-center px-5 py-8 sm:px-10 lg:px-12 xl:px-20">
          <div className="w-full max-w-md motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-700">
            <div className="mb-14 flex items-center justify-between lg:hidden">
              <Link href="/" className="text-3xl font-semibold tracking-[-0.05em]">
                Senti<span className="text-[#ff5947]">Q</span>
              </Link>
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#8a7e88]">
                Acceso privado
              </span>
            </div>

            <Link
              href="/"
              className="group inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#716671] transition hover:text-[#24102d] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#ff5947]/25"
            >
              <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
              Volver a SentiQ
            </Link>

            <div className="mt-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff5947]">
                Panel del restaurante
              </p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
                Bienvenido de vuelta.
              </h2>
              <p className="mt-4 text-base leading-7 text-[#716671]">
                Ingresa con el correo y la contraseña asignados a tu perfil.
              </p>
            </div>

            <form className="mt-10 space-y-6" onSubmit={handleSubmit} noValidate>
              <div className="space-y-2.5">
                <label className="text-sm font-semibold" htmlFor="email">
                  Correo electrónico
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  placeholder="nombre@restaurante.com"
                  className="h-14 w-full border border-[#38203e]/15 bg-white/55 px-4 text-base outline-none transition placeholder:text-[#a499a3] focus:border-[#ff5947] focus:bg-white focus:ring-3 focus:ring-[#ff5947]/15"
                  disabled={isBusy}
                />
                {errors.email ? (
                  <p id="email-error" className="text-sm text-destructive">
                    {errors.email}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2.5">
                <label className="text-sm font-medium" htmlFor="password">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={
                      errors.password ? "password-error" : undefined
                    }
                    className="h-14 w-full border border-[#38203e]/15 bg-white/55 px-4 pr-14 text-base outline-none transition focus:border-[#ff5947] focus:bg-white focus:ring-3 focus:ring-[#ff5947]/15"
                    disabled={isBusy}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute inset-y-0 right-0 grid w-14 place-items-center text-[#766b75] transition hover:text-[#24102d] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-[#ff5947]/20"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    aria-pressed={showPassword}
                    disabled={isBusy}
                  >
                    {showPassword ? <EyeOff className="size-5" aria-hidden="true" /> : <Eye className="size-5" aria-hidden="true" />}
                  </button>
                </div>
                {errors.password ? (
                  <p id="password-error" className="text-sm text-destructive">
                    {errors.password}
                  </p>
                ) : null}
              </div>

              {formError ? (
                <div
                  className="border-l-2 border-[#ff5947] bg-[#fff0eb] px-4 py-3 text-sm leading-6 text-[#8f3328]"
                  role="alert"
                >
                  {formError}
                </div>
              ) : null}

              <Button
                className="h-14 w-full rounded-none bg-[#2b1235] text-base text-white shadow-[0_16px_34px_-20px_rgba(43,18,53,.75)] hover:bg-[#3d1949] focus-visible:ring-[#ff5947]/30"
                type="submit"
                disabled={isBusy}
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" aria-hidden="true" />
                ) : (
                  <ArrowRight aria-hidden="true" />
                )}
                {isSubmitting ? "Entrando..." : "Iniciar sesión"}
              </Button>
            </form>

            <div className="mt-10 border-t border-[#38203e]/10 pt-6 text-sm leading-6 text-[#716671]">
              <p>
                ¿Tienes problemas para ingresar? Contacta a la persona de SentiQ
                que te proporcionó el acceso.
              </p>
              <Link
                href="/privacidad"
                className="mt-4 inline-flex min-h-11 items-center font-semibold text-[#38203e] underline decoration-[#ff5947]/50 underline-offset-4 hover:decoration-[#ff5947] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#ff5947]/20"
              >
                Aviso de privacidad
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
