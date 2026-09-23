import type { ReactNode } from "react";

interface CatalogDisclosureProps {
    id: string;
    title: string;
    description: string;
    isOpen: boolean;
    onToggle: () => void;
    children: ReactNode;
}

export const CatalogDisclosure = ({
    id,
    title,
    description,
    isOpen,
    onToggle,
    children,
}: CatalogDisclosureProps) => {
    return (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)]">
            <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 sm:px-8">
                <div className="min-w-0">
                    <h2 id={`${id}-heading`} className="font-semibold text-slate-900">
                        {title}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">{description}</p>
                </div>
                <button
                    type="button"
                    onClick={onToggle}
                    aria-expanded={isOpen}
                    aria-controls={id}
                    className="inline-flex min-h-11 items-center justify-center gap-3 rounded-xl border border-sky-200 bg-white px-4 py-2.5 text-sm font-semibold text-sky-700 transition-colors hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 motion-reduce:transition-none"
                >
                    {isOpen ? "Ocultar listado" : "Ver listado"}
                    <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className={`h-5 w-5 shrink-0 transition-transform duration-300 motion-reduce:transition-none ${isOpen ? "rotate-180" : ""}`}
                    >
                        <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            </div>
            <div id={id} hidden={!isOpen} aria-labelledby={`${id}-heading`} className="border-t border-slate-200">
                {isOpen && children}
            </div>
        </section>
    );
};
