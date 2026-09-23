import {
    useState,
    type FormEvent,
} from "react";

import {
    Navigate,
    useLocation,
    useNavigate,
} from "react-router";

import {
    useAuth,
} from "../hooks/useAuth";

import {
    getApiErrorMessage,
} from "../utils/utils";

export const LoginPage = () => {
    const [username, setUsername] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [error, setError] =
        useState<string | null>(
            null
        );

    const [isSubmitting, setIsSubmitting] =
        useState(false);

    const {
        login,
        isAuthenticated,
        isLoading,
    } = useAuth();

    const navigate =
        useNavigate();

    const location =
        useLocation();

    if (isLoading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-sky-50">
                <p role="status" className="rounded-full border border-sky-200 bg-white px-6 py-3 text-sm font-medium text-sky-800 shadow-sm">
                    Cargando...
                </p>
            </main>
        );
    }

    if (isAuthenticated) {
        return (
            <Navigate
                to="/"
                replace
            />
        );
    }

    const handleSubmit =
        async (
            event: FormEvent<HTMLFormElement>
        ) => {
            event.preventDefault();

            setError(null);

            if (
                !username.trim() ||
                !password
            ) {
                setError(
                    "Ingresa usuario y contraseña."
                );

                return;
            }

            setIsSubmitting(true);

            try {
                await login({
                    username:
                        username.trim(),

                    password,
                });

                const state =
                    location.state as
                    | {
                        from?: {
                            pathname?: string;
                        };
                    }
                    | null;

                const destination =
                    state?.from?.pathname ??
                    "/";

                navigate(
                    destination,
                    {
                        replace: true,
                    }
                );
            } catch (error) {
                setError(
                    getApiErrorMessage(
                        error,
                        "Usuario o contraseña incorrectos."
                    )
                );
            } finally {
                setIsSubmitting(false);
            }
        };

    return (
        <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top_left,#dff4ff,#f4f8fc_60%,#eaf2f8)] px-4 py-6 sm:px-8 sm:py-10">
            <div className="grid w-full max-w-6xl overflow-hidden rounded-3xl border border-white bg-white shadow-[0_24px_80px_-30px_rgba(12,74,110,0.3)] lg:min-h-170 lg:grid-cols-[1.05fr_1fr]">
                <aside className="relative isolate flex flex-col justify-between overflow-hidden bg-sky-950 px-7 py-8 text-white sm:px-10 lg:p-12">
                    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,#087eae,transparent_65%)]" />
                    <div aria-hidden="true" className="pointer-events-none absolute -right-32 bottom-0 -z-10 h-96 w-96 rounded-full border border-sky-300/15 shadow-[0_0_0_48px_rgba(125,211,252,0.04),0_0_0_96px_rgba(125,211,252,0.03)]" />
                    <div className="flex items-center gap-4">
                        <span className="text-3xl font-black tracking-[0.12em]">MESA<span className="text-sky-300">.</span></span>
                        <span className="h-9 w-px bg-sky-200/30" aria-hidden="true" />
                        <p className="max-w-40 text-xs leading-relaxed text-sky-100">Manufacturas Especializadas S.A.</p>
                    </div>

                    <div className="my-10 lg:my-16">
                        <p className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-sky-200">Gestión de inventarios</p>
                        <h2 className="max-w-sm text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">Cada recurso.<br /><span className="text-sky-300">Todo en su lugar.</span></h2>
                        <p className="mt-6 hidden max-w-xs text-sm leading-7 text-sky-100/90 sm:block">Organización y control de los recursos que hacen posible cada operación.</p>
                    </div>

                    <div className="flex items-center gap-2 text-xs tracking-wide text-sky-200">
                        <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>
                        Monterrey, Nuevo León
                    </div>
                </aside>

                <section className="flex flex-col justify-center px-7 py-10 sm:px-12 sm:py-14 lg:px-14">
                    <div className="mx-auto w-full max-w-sm">
                        <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-100 bg-sky-50 text-sky-700">
                            <svg aria-hidden="true" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" /><path d="m8.5 12 2.5 2.5 4.5-5" /></svg>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                                Portal de colaboradores
                            </p>

                            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                                Iniciar sesión
                            </h1>

                            <p className="mt-3 text-sm leading-6 text-slate-600">
                                Ingresa con tu número de nómina y contraseña.
                            </p>
                        </div>

                        <form
                            onSubmit={
                                handleSubmit
                            }
                            className="mt-9 space-y-6"
                        >
                            <div>
                                <label
                                    htmlFor="username"
                                    className="block text-sm font-medium text-slate-700"
                                >
                                    No. Nómina
                                </label>

                                <input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(event) =>
                                        setUsername(
                                            event.target.value
                                        )
                                    }
                                    autoComplete="username"
                                    disabled={
                                        isSubmitting
                                    }
                                    className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50/70 px-4 py-3.5 text-base text-slate-900 outline-none transition duration-200 hover:border-sky-400 focus:border-sky-600 focus:bg-white focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60 motion-reduce:transition-none"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="password"
                                    className="block text-sm font-medium text-slate-700"
                                >
                                    Contraseña
                                </label>

                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(event) =>
                                        setPassword(
                                            event.target.value
                                        )
                                    }
                                    autoComplete="current-password"
                                    disabled={
                                        isSubmitting
                                    }
                                    className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50/70 px-4 py-3.5 text-base text-slate-900 outline-none transition duration-200 hover:border-sky-400 focus:border-sky-600 focus:bg-white focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60 motion-reduce:transition-none"
                                />
                            </div>

                            {error && (
                                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                                    <p className="text-sm text-red-700">
                                        {error}
                                    </p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={
                                    isSubmitting
                                }
                                className="w-full rounded-xl bg-sky-700 px-4 py-3.5 text-sm font-semibold text-white shadow-[0_6px_16px_-6px_rgba(3,105,161,0.5)] transition duration-200 enabled:hover:-translate-y-0.5 enabled:hover:bg-sky-800 enabled:hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 focus-visible:ring-offset-2 enabled:active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transform-none motion-reduce:transition-none"
                            >
                                {isSubmitting
                                    ? "Iniciando sesión..."
                                    : "Iniciar sesión"}
                            </button>
                        </form>
                        <p className="mt-9 border-t border-slate-100 pt-6 text-center text-xs leading-5 text-slate-500">MESA · Gestión de inventarios</p>
                    </div>
                </section>
            </div>
        </main>
    );
};
