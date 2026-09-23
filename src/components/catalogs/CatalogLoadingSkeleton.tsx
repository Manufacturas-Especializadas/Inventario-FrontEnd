interface CatalogLoadingSkeletonProps {
    label: string;
}

export const CatalogLoadingSkeleton = ({ label }: CatalogLoadingSkeletonProps) => {
    return (
        <div role="status" aria-label={label} className="space-y-3 p-6 sm:p-8">
            {[1, 2, 3, 4].map((row) => (
                <div key={row} aria-hidden="true" className="animate-pulse rounded-xl border border-slate-100 p-4 motion-reduce:animate-none">
                    <div className="flex items-center justify-between gap-6">
                        <div className="min-w-0 flex-1">
                            <div className="h-4 w-48 max-w-full rounded bg-slate-200" />
                            <div className="mt-3 h-3 w-72 max-w-full rounded bg-slate-100" />
                        </div>
                        <div className="h-7 w-20 shrink-0 rounded-full bg-slate-200" />
                    </div>
                </div>
            ))}
        </div>
    );
};
