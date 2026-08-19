import {
    useNavigate,
} from "react-router";

import {
    useAuth,
} from "../../hooks/useAuth";

interface HeaderProps {
    onOpenSidebar: () => void;
}

export const Header = ({
    onOpenSidebar,
}: HeaderProps) => {
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
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
            <div className="flex items-center gap-4">
                <button
                    type="button"
                    onClick={
                        onOpenSidebar
                    }
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 lg:hidden"
                >
                    Menú
                </button>

                <div>
                    <p className="text-sm font-medium text-slate-900">
                        Sistema de Inventario EPP
                    </p>

                    <p className="hidden text-xs text-slate-500 sm:block">
                        Gestión y trazabilidad de equipo de protección personal
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="hidden text-right sm:block">
                    <p className="text-sm font-medium text-slate-900">
                        {user?.name}
                    </p>

                    <p className="text-xs text-slate-500">
                        {user?.roles.join(
                            ", "
                        )}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={
                        handleLogout
                    }
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                    Cerrar sesión
                </button>
            </div>
        </header>
    );
};