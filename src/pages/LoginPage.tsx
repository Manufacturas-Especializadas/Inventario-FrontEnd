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
            <main className="flex min-h-screen items-center justify-center bg-slate-100">
                <p className="text-sm text-slate-600">
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
        <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
                <div>
                    <p className="text-sm font-medium text-slate-500">
                        PPE Inventory
                    </p>

                    <h1 className="mt-1 text-2xl font-semibold text-slate-900">
                        Iniciar sesión
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        Ingresa con tu número de nomina y contraseña.
                    </p>
                </div>

                <form
                    onSubmit={
                        handleSubmit
                    }
                    className="mt-8 space-y-5"
                >
                    <div>
                        <label
                            htmlFor="username"
                            className="block text-sm font-medium text-slate-700"
                        >
                            No. Nomina
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
                            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
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
                            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                        />
                    </div>

                    {error && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
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
                        className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isSubmitting
                            ? "Iniciando sesión..."
                            : "Iniciar sesión"}
                    </button>
                </form>
            </div>
        </main>
    );
};