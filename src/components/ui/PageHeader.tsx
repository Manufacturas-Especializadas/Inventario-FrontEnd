interface PageHeaderProps {
    eyebrow: string;
    title: string;
    description: string;
    descriptionWidth?: "default" | "wide";
}

export const PageHeader = ({
    eyebrow,
    title,
    description,
    descriptionWidth = "default",
}: PageHeaderProps) => {
    const descriptionWidthClass = descriptionWidth === "wide"
        ? "max-w-2xl"
        : "max-w-lg";

    return (
        <div className="relative isolate overflow-hidden rounded-3xl border border-sky-200 bg-linear-to-br from-white via-sky-50 to-sky-100 p-6 sm:p-8">
            <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 -z-10 h-72 w-72 rounded-full border-32 border-white/50" />
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                {eyebrow}
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                {title}
            </h1>

            <p className={`mt-3 ${descriptionWidthClass} text-sm leading-6 text-slate-600`}>
                {description}
            </p>
        </div>
    );
};
