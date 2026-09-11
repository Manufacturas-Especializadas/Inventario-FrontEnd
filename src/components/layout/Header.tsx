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
        <header className="sticky top-0 z-30 flex min-h-20 items-center justify-between gap-3 border-b border-sky-100 bg-white/95 px-4 py-3 shadow-[0_4px_24px_-16px_rgba(12,74,110,0.2)] backdrop-blur-sm sm:gap-5 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                <button
                    type="button"
                    onClick={
                        onOpenSidebar
                    }
                    aria-label="Abrir menú de navegación"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 text-sky-800 transition-colors hover:bg-sky-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 motion-reduce:transition-none lg:hidden"
                >
                    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>

                <div className="min-w-0">
                    <p className="text-sm font-semibold leading-5 tracking-tight text-slate-900">
                        Sistema de Inventario
                    </p>


                </div>
            </div>

            <div className="flex shrink-0 items-center gap-3 sm:gap-4">
                <div className="hidden min-w-0 items-center gap-3 border-r border-slate-200 pr-4 sm:flex">
                    <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-100 bg-sky-50 text-sky-700 md:flex">
                        <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="8" r="4" />
                            <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
                        </svg>
                    </span>
                    <div className="max-w-36 text-right md:max-w-48 xl:max-w-64">
                        <p className="truncate text-sm font-semibold text-slate-900" title={user?.name}>
                            {user?.name}
                        </p>

                        <p className="mt-1 wrap-break-word text-xs leading-5 text-sky-800">
                            {user?.roles.join(
                                ", "
                            )}
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={
                        handleLogout
                    }
                    aria-label="Cerrar sesión"
                    className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 motion-reduce:transition-none"
                >
                    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4m6-12 4 4-4 4m-8-4h12" />
                    </svg>
                    <span className="hidden sm:inline">Cerrar sesión</span>
                </button>
            </div>
        </header>
    );
};
