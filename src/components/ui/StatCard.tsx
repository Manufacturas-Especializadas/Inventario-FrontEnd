interface StatCardProps {
    label: string;
    value: string | number;
}

export const StatCard = ({ label, value }: StatCardProps) => {
    return (
        <div className="rounded-2xl border border-slate-200 bg-linear-to-br from-white to-slate-50/70 px-6 py-5 shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)]">
            <dt className="text-sm text-slate-600">
                {label}
            </dt>

            <dd className="mt-2 text-2xl font-semibold text-slate-900">
                {value}
            </dd>
        </div>
    );
};
