import {
    useNavigate,
} from "react-router";

import {
    useAuth,
} from "../hooks/useAuth";

export const HomePage = () => {
    const {
        user,
        logout,
    } = useAuth();

    const navigate =
        useNavigate();

    const handleLogout = () => {
        logout();

        navigate(
            "/login",
            {
                replace: true,
            }
        );
    };

    return (
        <main className="min-h-screen bg-slate-100 p-8">
            <div className="mx-auto max-w-6xl">
                <div className="flex items-start justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">
                            PPE Inventory
                        </h1>

                        <p className="mt-2 text-slate-600">
                            Sistema de control de equipo de protección personal.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={
                            handleLogout
                        }
                        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                        Cerrar sesión
                    </button>
                </div>

                <div className="mt-8 rounded-xl bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900">
                        Sesión actual
                    </h2>

                    <dl className="mt-5 space-y-3 text-sm">
                        <div>
                            <dt className="font-medium text-slate-500">
                                Nombre
                            </dt>

                            <dd className="text-slate-900">
                                {user?.name}
                            </dd>
                        </div>

                        <div>
                            <dt className="font-medium text-slate-500">
                                Usuario
                            </dt>

                            <dd className="text-slate-900">
                                {user?.username}
                            </dd>
                        </div>

                        <div>
                            <dt className="font-medium text-slate-500">
                                Número de empleado
                            </dt>

                            <dd className="text-slate-900">
                                {
                                    user?.employeeNumber
                                }
                            </dd>
                        </div>

                        <div>
                            <dt className="font-medium text-slate-500">
                                Roles
                            </dt>

                            <dd className="text-slate-900">
                                {user?.roles.join(
                                    ", "
                                )}
                            </dd>
                        </div>
                    </dl>
                </div>
            </div>
        </main>
    );
};