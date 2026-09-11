import {
    Suspense,
    useState,
} from "react";

import {
    Outlet,
} from "react-router";

import {
    Header,
} from "../components/layout/Header";

import {
    Sidebar,
} from "../components/layout/Sidebar";

export const AppLayout = () => {
    const [
        isSidebarOpen,
        setIsSidebarOpen,
    ] = useState(false);

    return (
        <div className="min-h-screen bg-slate-100">
            <Sidebar
                isOpen={
                    isSidebarOpen
                }
                onClose={() =>
                    setIsSidebarOpen(
                        false
                    )
                }
            />

            <div className="lg:pl-64">
                <Header
                    onOpenSidebar={() =>
                        setIsSidebarOpen(
                            true
                        )
                    }
                />

                <main className="p-4 sm:p-6 lg:p-8">
                    <Suspense
                        fallback={
                            <div role="status" className="p-6 text-sm text-slate-500">
                                Cargando módulo...
                            </div>
                        }
                    >
                        <Outlet />
                    </Suspense>
                </main>
            </div>
        </div>
    );
};
