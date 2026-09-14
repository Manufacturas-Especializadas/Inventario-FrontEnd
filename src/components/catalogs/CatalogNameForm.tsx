import type { ChangeEventHandler, FormEventHandler } from "react";

interface CatalogNameFormProps {
    inputId: string;
    name: string;
    placeholder: string;
    onNameChange: ChangeEventHandler<HTMLInputElement>;
    onSubmit: FormEventHandler<HTMLFormElement>;
    isSubmitting: boolean;
    duplicateMessage: string | null;
    errorMessage: string | null;
    showCancel: boolean;
    onCancel: () => void;
    submitDisabled: boolean;
    submitLabel: string;
}

export const CatalogNameForm = ({
    inputId,
    name,
    placeholder,
    onNameChange,
    onSubmit,
    isSubmitting,
    duplicateMessage,
    errorMessage,
    showCancel,
    onCancel,
    submitDisabled,
    submitLabel,
}: CatalogNameFormProps) => {
    return (
        <form onSubmit={onSubmit} className="mt-6">
            <div>
                <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
                    Nombre
                </label>

                <input
                    id={inputId}
                    value={name}
                    onChange={onNameChange}
                    disabled={isSubmitting}
                    placeholder={placeholder}
                    autoComplete="off"
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50/70 px-4 py-3 text-base text-slate-900 outline-none transition-colors placeholder:text-slate-500 hover:border-sky-400 focus:border-sky-600 focus:bg-white focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
                />

                {duplicateMessage && (
                    <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2.5 text-sm text-amber-800">
                        {duplicateMessage}
                    </p>
                )}
            </div>

            {errorMessage && (
                <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700">
                    {errorMessage}
                </div>
            )}

            <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
                {showCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors enabled:hover:border-sky-300 enabled:hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none sm:w-auto"
                    >
                        Cancelar
                    </button>
                )}

                <button
                    type="submit"
                    disabled={submitDisabled}
                    className="w-full rounded-xl bg-sky-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition duration-200 enabled:hover:-translate-y-0.5 enabled:hover:bg-sky-800 enabled:hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 focus-visible:ring-offset-2 enabled:active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transform-none motion-reduce:transition-none sm:w-auto"
                >
                    {submitLabel}
                </button>
            </div>
        </form>
    );
};
