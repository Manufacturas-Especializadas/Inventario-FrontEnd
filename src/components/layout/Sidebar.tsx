import {
    useState,
} from "react";

import {
    matchPath,
    NavLink,
    useLocation,
} from "react-router";

import {
    navigationItems,
    navigationGroups,
    type NavigationGroupId,
} from "../../config/navigation";

import {
    useAuth,
} from "../../hooks/useAuth";

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const groupIconPaths: Record<NavigationGroupId, string> = {
    catalog: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
    purchasing: "M3 3h2l3 12h10l3-8H6M9 20h.01M17 20h.01",
    inventory: "m3 9 9-6 9 6v12H3V9ZM7 21V11h10v10M7 15h10M7 18h10",
    requests: "M4 7h15m-4-4 4 4-4 4M20 17H5m4-4-4 4 4 4",
    people: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM22 21v-2a4 4 0 0 0-3-3.87M17 3.13a4 4 0 0 1 0 7.75",
    administration: "M12 3 4 6v5c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6l-8-3Zm-4 9 3 3 5-5",
};

export const Sidebar = ({
    isOpen,
    onClose,
}: SidebarProps) => {
    const {
        hasAnyRole,
    } = useAuth();

    const { pathname } = useLocation();

    const visibleItems =
        navigationItems.filter(
            (item) =>
                !item.roles ||
                hasAnyRole(item.roles)
        );

    const visibleGroups = navigationGroups
        .map((group) => ({
            ...group,
            items: visibleItems.filter((item) => item.group === group.id),
        }))
        .filter((group) => group.items.length > 0);

    const activeGroupId = visibleItems.find((item) =>
        matchPath({ path: item.path, end: item.path === "/" }, pathname)
    )?.group ?? null;

    const [expandedGroup, setExpandedGroup] = useState<{
        pathname: string;
        id: NavigationGroupId | null;
    }>({ pathname, id: activeGroupId });

    // Restablece el grupo al navegar, también al volver con el historial.
    if (expandedGroup.pathname !== pathname) {
        setExpandedGroup({ pathname, id: activeGroupId });
    }

    const openGroupId = expandedGroup.pathname === pathname
        ? expandedGroup.id
        : activeGroupId;

    return (
        <>
            {isOpen && (
                <button
                    type="button"
                    aria-label="Cerrar menú"
                    onClick={onClose}
                    className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-sky-300 lg:hidden"
                />
            )}

            <aside
                className={`
          fixed inset-y-0 left-0 z-50
          flex w-64 max-w-[calc(100vw-3rem)] flex-col
          border-r border-sky-100
          bg-linear-to-b from-white via-white to-sky-50/80
          shadow-[8px_0_32px_-24px_rgba(12,74,110,0.25)]
          transition-transform duration-200
          motion-reduce:transition-none lg:visible lg:translate-x-0
          ${isOpen
                        ? "visible translate-x-0"
                        : "invisible -translate-x-full"
                    }
        `}
            >
                <div className="flex min-h-20 shrink-0 items-center gap-3 border-b border-sky-100 px-5 py-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-700 text-white shadow-sm">
                        <svg aria-hidden="true" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3ZM4 7.5l8 4.5 8-4.5M12 12v9M8 5.25l8 4.5" />
                        </svg>
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="text-lg font-semibold tracking-[0.16em] text-slate-900">
                            MESA
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">Sistema de inventario</p>
                    </div>
                    <button type="button" onClick={onClose} aria-label="Cerrar menú de navegación" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-sky-50 hover:text-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 motion-reduce:transition-none lg:hidden">
                        <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m6 6 12 12M6 18 18 6" />
                        </svg>
                    </button>
                </div>

                <nav aria-label="Navegación principal" className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
                    <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Espacio de trabajo</p>
                    <div className="space-y-1.5">
                        {visibleItems.filter((item) => !item.group).map(
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
                                            "group relative flex min-h-11 items-center gap-3 rounded-xl border px-3 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 motion-reduce:transition-none",
                                            isActive
                                                ? "border-sky-200 bg-sky-50 font-semibold text-sky-900 shadow-sm before:absolute before:inset-y-3 before:left-0 before:w-0.5 before:rounded-full before:bg-sky-600"
                                                : "border-transparent text-slate-600 hover:border-sky-100 hover:bg-sky-50/70 hover:text-sky-900",
                                        ].join(" ")
                                    }
                                >
                                    <svg aria-hidden="true" className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-8h6v8" />
                                    </svg>
                                    <span className="min-w-0 flex-1 wrap-break-word leading-5">{item.label}</span>
                                </NavLink>
                            )
                        )}
                    </div>

                    <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                        {visibleGroups.map((group) => {
                            const expanded = openGroupId === group.id;
                            const active = activeGroupId === group.id;

                            return (
                                <div key={group.id} className={`rounded-2xl ${expanded ? "bg-slate-50/80" : ""}`}>
                                    <button
                                        type="button"
                                        aria-expanded={expanded}
                                        aria-controls={`sidebar-group-${group.id}`}
                                        onClick={() => setExpandedGroup({
                                            pathname,
                                            id: expanded ? null : group.id,
                                        })}
                                        className={`flex min-h-12 w-full items-center gap-3 rounded-xl border px-3 py-3 text-left text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 motion-reduce:transition-none ${active
                                            ? "border-sky-200 bg-sky-50 text-sky-900"
                                            : "border-transparent text-slate-700 hover:bg-sky-50/70 hover:text-sky-900"
                                            }`}
                                    >
                                        <svg aria-hidden="true" className={`h-5 w-5 shrink-0 ${active ? "text-sky-700" : "text-slate-500"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d={groupIconPaths[group.id]} />
                                        </svg>
                                        <span className="min-w-0 flex-1 leading-5">{group.label}</span>
                                        <svg aria-hidden="true" className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 motion-reduce:transition-none ${expanded ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="m6 9 6 6 6-6" />
                                        </svg>
                                    </button>

                                    <ul id={`sidebar-group-${group.id}`} hidden={!expanded} className="ml-5 mr-2 space-y-1 border-l border-sky-200 py-2 pl-3">
                                        {group.items.map((item) => (
                                            <li key={item.path}>
                                                <NavLink
                                                    to={item.path}
                                                    onClick={onClose}
                                                    className={({ isActive }) => `flex min-h-11 items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 motion-reduce:transition-none ${isActive
                                                        ? "bg-sky-100 font-semibold text-sky-900"
                                                        : "text-slate-600 hover:bg-white hover:text-sky-800"
                                                        }`}
                                                >
                                                    {({ isActive }) => (
                                                        <>
                                                            <span aria-hidden="true" className={`h-1.5 w-1.5 shrink-0 rounded-full ${isActive ? "bg-sky-600" : "bg-slate-300"}`} />
                                                            <span className="min-w-0 wrap-break-word leading-5">{item.label}</span>
                                                        </>
                                                    )}
                                                </NavLink>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        })}
                    </div>
                </nav>

                <div className="shrink-0 border-t border-sky-100 bg-sky-50/60 px-6 py-5">
                    <p className="text-xs font-medium leading-5 text-slate-600">
                        Manufacturas Especializadas S.A
                    </p>
                </div>
            </aside>
        </>
    );
};
