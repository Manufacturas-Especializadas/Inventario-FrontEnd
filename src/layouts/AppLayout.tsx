import {
    Suspense,
    useEffect,
    useState,
} from "react";

import {
    Outlet,
    useLocation,
} from "react-router";

import {
    Header,
} from "../components/layout/Header";

import {
    Sidebar,
} from "../components/layout/Sidebar";

import { useAuth } from "../hooks/useAuth";
import { navigationItems } from "../config/navigation";
import { addRecentModule } from "../utils/recentModules";

export const AppLayout = () => {
    const { pathname } = useLocation();
    const { user, hasAnyRole } = useAuth();
    const userId = user?.userId;

    const [
        isSidebarOpen,
        setIsSidebarOpen,
    ] = useState(false);

    useEffect(() => {
        if (userId === undefined || pathname === "/") return;
        const item = navigationItems.find((item) => item.path === pathname);
        if (!item || (item.roles && !hasAnyRole(item.roles))) return;
        addRecentModule(userId, { path: item.path, label: item.label });
    }, [pathname, userId, hasAnyRole]);

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
