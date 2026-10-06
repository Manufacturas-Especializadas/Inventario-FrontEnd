export interface RecentModule {
    path: string;
    label: string;
}

const MAX_RECENT_MODULES = 4;

const storageKey = (userId: number) => `ppeInventory:recentModules:${userId}`;

const normalizeModule = (value: unknown): RecentModule | null => {
    if (
        typeof value !== "object" || value === null ||
        !("path" in value) || typeof value.path !== "string" ||
        !("label" in value) || typeof value.label !== "string" ||
        !value.label.trim()
    ) return null;

    const path = value.path.split(/[?#]/)[0];
    if (!path.startsWith("/") || path.startsWith("//") || path === "/") return null;

    return { path, label: value.label };
};

export const getRecentModules = (userId: number): RecentModule[] => {
    try {
        const stored: unknown = JSON.parse(localStorage.getItem(storageKey(userId)) ?? "[]");
        if (!Array.isArray(stored)) return [];

        const modules: RecentModule[] = [];
        for (const value of stored) {
            const recent = normalizeModule(value);
            if (recent && !modules.some((item) => item.path === recent.path)) {
                modules.push(recent);
            }
            if (modules.length === MAX_RECENT_MODULES) break;
        }
        return modules;
    } catch {
        return [];
    }
};

export const addRecentModule = (userId: number, module: RecentModule): void => {
    const recent = normalizeModule(module);
    if (!recent) return;

    try {
        const modules = [
            recent,
            ...getRecentModules(userId).filter((item) => item.path !== recent.path),
        ].slice(0, MAX_RECENT_MODULES);
        const key = storageKey(userId);
        const serialized = JSON.stringify(modules);
        if (localStorage.getItem(key) !== serialized) {
            localStorage.setItem(key, serialized);
        }
    } catch {
        // Recent modules are optional; unavailable storage must not interrupt navigation.
    }
};
