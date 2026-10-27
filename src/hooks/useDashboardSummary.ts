import { useEffect, useState } from "react";
import { dashboardService } from "../api/services/DashboardService";
import type { DashboardSummary } from "../types/types";

export const useDashboardSummary = () => {
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        void dashboardService.getSummary(controller.signal)
            .then((data) => {
                if (!controller.signal.aborted) setSummary(data);
            })
            .catch(() => {
                if (!controller.signal.aborted) {
                    setError("No fue posible consultar las actividades pendientes.");
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });
        return () => controller.abort();
    }, []);

    return { summary, loading, error };
};
