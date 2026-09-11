import {
    Link,
} from "react-router";

export const UnauthorizedPage = () => {
    return (
        <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-linear-to-br from-slate-50 via-white to-sky-100 px-4 py-10 sm:px-6">
            <div aria-hidden="true" className="pointer-events-none absolute -right-32 -top-32 -z-10 h-96 w-96 rounded-full border-48 border-sky-100/70" />
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -left-32 -z-10 h-96 w-96 rounded-full border-48 border-white/80" />

            <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_16px_64px_-24px_rgba(12,74,110,0.25)]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sky-100 bg-linear-to-br from-white to-sky-50 px-6 py-5 sm:px-10">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                        MESA · Inventario
                    </p>
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 font-mono text-xs font-semibold text-slate-600">
                        Error 403
                    </span>
                </div>

                <div className="px-6 py-10 text-center sm:px-10 sm:py-12">
                    <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-sky-200 bg-linear-to-br from-sky-50 to-sky-100 text-sky-700 shadow-sm">
                        <svg aria-hidden="true" className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 3 4 6v5c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6l-8-3Z" />
                            <rect x="9" y="10" width="6" height="5" rx="1" />
                            <path d="M10 10V8a2 2 0 0 1 4 0v2" />
                        </svg>
                    </span>

                    <h1 className="mt-6 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                        Acceso no autorizado
                    </h1>

                    <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-slate-600">
                        Tu usuario no tiene permisos para acceder a esta sección.
                    </p>

                    <div className="mt-8 border-t border-slate-100 pt-6">
                        <Link
                            to="/"
                            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-sky-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 focus-visible:ring-offset-2 motion-reduce:transition-none sm:w-auto"
                        >
                            <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m10 6-6 6 6 6M4 12h16" />
                            </svg>
                            Regresar
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
};
