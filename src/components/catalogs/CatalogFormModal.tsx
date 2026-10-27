import { useEffect, useRef, type ReactNode } from "react";

interface CatalogFormModalProps {
    id: string;
    title: string;
    description: string;
    isSubmitting: boolean;
    onClose: () => void;
    children: ReactNode;
    footer?: ReactNode;
    wide?: boolean;
    closeOnBackdrop?: boolean;
    closeLabel?: string;
}

export const CatalogFormModal = ({
    id,
    title,
    description,
    isSubmitting,
    onClose,
    children,
    footer,
    wide = false,
    closeOnBackdrop = false,
    closeLabel = "Cerrar formulario",
}: CatalogFormModalProps) => {
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        const previousFocus = document.activeElement;
        const previousOverflow = document.body.style.overflow;
        dialog.showModal();
        document.body.style.overflow = "hidden";
        dialog.querySelector<HTMLInputElement>("input")?.focus();

        return () => {
            dialog.close();
            document.body.style.overflow = previousOverflow;
            if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
                previousFocus.focus();
            } else {
                document.querySelector<HTMLElement>(`[aria-controls="${id}"]`)?.focus();
            }
        };
    }, [id]);

    return (
        <dialog
            ref={dialogRef}
            id={id}
            role="dialog"
            aria-labelledby={`${id}-title`}
            aria-describedby={`${id}-description`}
            aria-modal="true"
            aria-busy={isSubmitting}
            onClick={(event) => {
                if (!closeOnBackdrop || isSubmitting || event.target !== event.currentTarget) return;
                const bounds = event.currentTarget.getBoundingClientRect();
                if (event.clientX < bounds.left || event.clientX > bounds.right ||
                    event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
            }}
            onCancel={(event) => {
                event.preventDefault();
                if (!isSubmitting) onClose();
            }}
            onKeyDown={(event) => {
                if (event.key !== "Tab") return;
                const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
                    "button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex='0']"
                )).filter((element) => element.getClientRects().length > 0);
                const first = controls[0];
                const last = controls[controls.length - 1];
                if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault();
                    last?.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault();
                    first?.focus();
                }
            }}
            className={`fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] ${wide ? "max-w-3xl" : "max-w-lg"} overscroll-contain rounded-2xl border border-sky-100 bg-white text-slate-900 shadow-2xl backdrop:bg-slate-950/50 ${footer ? "overflow-hidden p-0 open:flex open:flex-col" : "overflow-y-auto p-6 sm:p-8"}`}
        >
            <div className={footer ? "relative shrink-0 border-b border-slate-100 px-6 py-5 sm:px-8" : undefined}>
            <div className="pr-12">
                <h2 id={`${id}-title`} className="text-xl font-semibold tracking-tight text-slate-900">
                    {title}
                </h2>
                <p id={`${id}-description`} className="mt-2 wrap-break-word text-sm leading-6 text-slate-500">
                    {description}
                </p>
            </div>
            <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                aria-label={closeLabel}
                className="absolute right-5 top-5 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:border-sky-300 hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none sm:right-7 sm:top-7"
            >
                <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="m6 6 12 12M6 18 18 6" />
                </svg>
            </button>
            </div>
            {footer ? (
                <>
                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-6 sm:p-8">{children}</div>
                    <div className="flex shrink-0 justify-end border-t border-slate-100 px-6 py-4 sm:px-8">{footer}</div>
                </>
            ) : children}
        </dialog>
    );
};
