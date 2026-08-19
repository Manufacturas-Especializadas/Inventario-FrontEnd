interface ModulePlaceholderPageProps {
    title: string;
    description: string;
}

export const ModulePlaceholderPage = ({
    title,
    description,
}: ModulePlaceholderPageProps) => {
    return (
        <div className="mx-auto max-w-7xl">
            <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
                <p className="text-sm font-medium text-slate-500">
                    PPE Inventory
                </p>

                <h1 className="mt-2 text-2xl font-bold text-slate-900">
                    {title}
                </h1>

                <p className="mt-3 max-w-2xl text-slate-600">
                    {description}
                </p>

                <div className="mt-8 rounded-lg bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">
                        Este módulo será desarrollado en la siguiente etapa.
                    </p>
                </div>
            </div>
        </div>
    );
};