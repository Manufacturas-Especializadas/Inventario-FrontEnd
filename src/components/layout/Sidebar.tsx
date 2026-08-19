import {
    NavLink,
} from "react-router";

import {
    navigationItems,
} from "../../config/navigation";

import {
    useAuth,
} from "../../hooks/useAuth";

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export const Sidebar = ({
    isOpen,
    onClose,
}: SidebarProps) => {
    const {
        hasAnyRole,
    } = useAuth();

    const visibleItems =
        navigationItems.filter(
            (item) =>
                !item.roles ||
                hasAnyRole(item.roles)
        );

    return (
        <>
            {isOpen && (
                <button
                    type="button"
                    aria-label="Cerrar menú"
                    onClick={onClose}
                    className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
                />
            )}

            <aside
                className={`
          fixed inset-y-0 left-0 z-50
          flex w-64 flex-col
          border-r border-slate-200
          bg-white
          transition-transform duration-200
          lg:translate-x-0
          ${isOpen
                        ? "translate-x-0"
                        : "-translate-x-full"
                    }
        `}
            >
                <div className="flex h-16 items-center border-b border-slate-200 px-6">
                    <div>
                        <p className="text-lg font-bold text-slate-900">
                            PPE Inventory
                        </p>

                        <p className="text-xs text-slate-500">
                            Control de EPP
                        </p>
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto p-4">
                    <div className="space-y-1">
                        {visibleItems.map(
                            (item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    end={
                                        item.path === "/"
                                    }
                                    onClick={onClose}
                                    className={({
                                        isActive,
                                    }) =>
                                        [
                                            "block rounded-lg px-4 py-2.5 text-sm font-medium transition",
                                            isActive
                                                ? "bg-slate-900 text-white"
                                                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                                        ].join(" ")
                                    }
                                >
                                    {item.label}
                                </NavLink>
                            )
                        )}
                    </div>
                </nav>

                <div className="border-t border-slate-200 p-4">
                    <p className="text-xs text-slate-400">
                        Manufacturas Especializadas
                    </p>
                </div>
            </aside>
        </>
    );
};