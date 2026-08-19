import {
    Link,
} from "react-router";

export const UnauthorizedPage = () => {
    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
            <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-sm">
                <p className="text-sm font-medium text-red-600">
                    403
                </p>

                <h1 className="mt-2 text-2xl font-semibold text-slate-900">
                    Acceso no autorizado
                </h1>

                <p className="mt-3 text-sm text-slate-600">
                    Tu usuario no tiene permisos para acceder a esta sección.
                </p>

                <Link
                    to="/"
                    className="mt-6 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                >
                    Regresar
                </Link>
            </div>
        </main>
    );
};