import {
    useEffect,
    useState,
    type FormEvent,
} from "react";

import {
    useOrganizationalUnits,
} from "../hooks/useOrganizationalUnits";

import {
    useOrganizationalUnitPPELimits,
} from "../hooks/useOrganizationalUnitPPELimits";

import {
    usePPEProducts,
} from "../hooks/usePPEProducts";

import type {
    OrganizationalUnit,
    OrganizationalUnitType,
} from "../types/types";


const getUnitTypeLabel = (
    type: OrganizationalUnitType
) => {
    switch (type) {
        case 1:
            return "Departamento";

        case 2:
            return "Área";

        case 3:
            return "Línea";

        case 4:
            return "Subárea";

        case 5:
            return "Equipo";

        default:
            return "Desconocido";
    }
};


export const OrganizationalUnitsPage =
    () => {
        const {
            organizationalUnits,

            loading: loadingUnits,
            creating,

            error: unitsError,

            createOrganizationalUnit,
        } = useOrganizationalUnits();


        const {
            limits,

            loading: loadingLimits,
            saving,

            error: limitsError,

            setLimit,
            refresh: refreshLimits,
        } =
            useOrganizationalUnitPPELimits();


        const {
            products,
            loading: loadingProducts,
            error: productsError,
        } = usePPEProducts();


        // Crear unidad

        const [
            name,
            setName,
        ] = useState("");

        const [
            description,
            setDescription,
        ] = useState("");

        const [
            unitType,
            setUnitType,
        ] =
            useState<OrganizationalUnitType>(
                1
            );

        const [
            parentId,
            setParentId,
        ] = useState("");


        // Límite EPP

        const [
            limitUnitId,
            setLimitUnitId,
        ] = useState("");

        const [
            limitProductId,
            setLimitProductId,
        ] = useState("");

        const [
            maxQuantityPerCycle,
            setMaxQuantityPerCycle,
        ] = useState("");

        const [
            limitIsActive,
            setLimitIsActive,
        ] = useState(true);


        const [
            formError,
            setFormError,
        ] = useState<string | null>(
            null
        );

        const [
            successMessage,
            setSuccessMessage,
        ] = useState<string | null>(
            null
        );


        const activeUnits =
            organizationalUnits.filter(
                (unit) =>
                    unit.isActive
            );


        const activeProducts =
            products.filter(
                (product) =>
                    product.isActive
            );


        const selectedExistingLimit =
            limits.find(
                (limit) =>
                    limit.organizationalUnitId ===
                    Number(
                        limitUnitId
                    ) &&
                    limit.ppeProductId ===
                    Number(
                        limitProductId
                    )
            );


        /*
         * Cuando seleccionamos una combinación
         * Unidad + Producto existente,
         * cargamos su configuración actual.
         */
        useEffect(() => {
            if (
                !limitUnitId ||
                !limitProductId
            ) {
                setMaxQuantityPerCycle(
                    ""
                );

                setLimitIsActive(
                    true
                );

                return;
            }

            if (
                selectedExistingLimit
            ) {
                setMaxQuantityPerCycle(
                    String(
                        selectedExistingLimit
                            .maxQuantityPerCycle
                    )
                );

                setLimitIsActive(
                    selectedExistingLimit
                        .isActive
                );

                return;
            }

            setMaxQuantityPerCycle(
                ""
            );

            setLimitIsActive(
                true
            );
        }, [
            limitUnitId,
            limitProductId,
            selectedExistingLimit,
        ]);


        const handleCreateUnit =
            async (
                event:
                    FormEvent<HTMLFormElement>
            ) => {
                event.preventDefault();

                setFormError(null);
                setSuccessMessage(null);

                const normalizedName =
                    name.trim();

                if (
                    !normalizedName
                ) {
                    setFormError(
                        "El nombre de la unidad es obligatorio."
                    );

                    return;
                }

                if (
                    normalizedName.length >
                    150
                ) {
                    setFormError(
                        "El nombre no puede superar los 150 caracteres."
                    );

                    return;
                }

                const normalizedDescription =
                    description.trim();

                if (
                    normalizedDescription.length >
                    500
                ) {
                    setFormError(
                        "La descripción no puede superar los 500 caracteres."
                    );

                    return;
                }

                const result =
                    await createOrganizationalUnit(
                        {
                            name:
                                normalizedName,

                            description:
                                normalizedDescription ||
                                null,

                            type:
                                unitType,

                            parentId:
                                parentId
                                    ? Number(
                                        parentId
                                    )
                                    : null,
                        }
                    );

                if (!result) {
                    return;
                }

                setSuccessMessage(
                    `Unidad "${result.name}" creada correctamente.`
                );

                setName("");
                setDescription("");
                setUnitType(1);
                setParentId("");
            };


        const handleSaveLimit =
            async (
                event:
                    FormEvent<HTMLFormElement>
            ) => {
                event.preventDefault();

                setFormError(null);
                setSuccessMessage(null);

                const parsedUnitId =
                    Number(
                        limitUnitId
                    );

                const parsedProductId =
                    Number(
                        limitProductId
                    );

                const parsedMax =
                    Number(
                        maxQuantityPerCycle
                    );

                if (
                    !Number.isInteger(
                        parsedUnitId
                    ) ||
                    parsedUnitId <= 0
                ) {
                    setFormError(
                        "Selecciona una unidad organizacional."
                    );

                    return;
                }

                if (
                    !Number.isInteger(
                        parsedProductId
                    ) ||
                    parsedProductId <= 0
                ) {
                    setFormError(
                        "Selecciona un producto."
                    );

                    return;
                }

                if (
                    !Number.isInteger(
                        parsedMax
                    ) ||
                    parsedMax <= 0
                ) {
                    setFormError(
                        "El máximo por ciclo debe ser un número entero mayor a cero."
                    );

                    return;
                }

                const result =
                    await setLimit({
                        organizationalUnitId:
                            parsedUnitId,

                        ppeProductId:
                            parsedProductId,

                        maxQuantityPerCycle:
                            parsedMax,

                        /*
                         * Un registro nuevo siempre
                         * debe crearse activo.
                         */
                        isActive:
                            selectedExistingLimit
                                ? limitIsActive
                                : true,
                    });

                if (!result) {
                    return;
                }

                setSuccessMessage(
                    selectedExistingLimit
                        ? "Límite de producto actualizado correctamente."
                        : "Límite de producto creado correctamente."
                );
            };


        const handleEditLimit = (
            organizationalUnitId:
                number,
            ppeProductId: number
        ) => {
            setLimitUnitId(
                String(
                    organizationalUnitId
                )
            );

            setLimitProductId(
                String(
                    ppeProductId
                )
            );

            setFormError(null);
            setSuccessMessage(null);
        };


        /*
         * Convertimos la lista plana en filas
         * ordenadas jerárquicamente.
         */
        const buildHierarchy =
            () => {
                const rows: {
                    unit:
                    OrganizationalUnit;
                    depth: number;
                }[] = [];

                const visited =
                    new Set<number>();

                const appendChildren = (
                    parent:
                        number | null,
                    depth: number
                ) => {
                    const children =
                        organizationalUnits
                            .filter(
                                (unit) =>
                                    unit.parentId ===
                                    parent
                            )
                            .sort(
                                (a, b) =>
                                    a.name.localeCompare(
                                        b.name,
                                        "es"
                                    )
                            );

                    for (
                        const unit of
                        children
                    ) {
                        if (
                            visited.has(
                                unit.id
                            )
                        ) {
                            continue;
                        }

                        visited.add(
                            unit.id
                        );

                        rows.push({
                            unit,
                            depth,
                        });

                        appendChildren(
                            unit.id,
                            depth + 1
                        );
                    }
                };

                appendChildren(
                    null,
                    0
                );

                /*
                 * Protección por si existiera
                 * algún dato histórico cuyo
                 * padre ya no aparezca.
                 */
                for (
                    const unit of
                    organizationalUnits
                ) {
                    if (
                        !visited.has(
                            unit.id
                        )
                    ) {
                        rows.push({
                            unit,
                            depth: 0,
                        });
                    }
                }

                return rows;
            };


        const hierarchyRows =
            buildHierarchy();


        const sortedLimits =
            [...limits].sort(
                (a, b) => {
                    const unitCompare =
                        a.organizationalUnitName.localeCompare(
                            b.organizationalUnitName,
                            "es"
                        );

                    if (
                        unitCompare !==
                        0
                    ) {
                        return unitCompare;
                    }

                    return a.productName.localeCompare(
                        b.productName,
                        "es"
                    );
                }
            );


        const combinedError =
            formError ||
            unitsError ||
            limitsError ||
            productsError;


        return (
            <div className="mx-auto max-w-7xl space-y-6">
                <div className="relative isolate overflow-hidden rounded-3xl border border-sky-200 bg-linear-to-br from-white via-sky-50 to-sky-100 p-6 sm:p-8">
                    <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 -z-10 h-72 w-72 rounded-full border-32 border-white/50" />
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                        MESA · Administración
                    </p>

                    <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                        Organización y
                        límites
                    </h1>

                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                        Configura la
                        estructura
                        organizacional y
                        los límites
                        específicos
                        aplicables a cada
                        unidad.
                    </p>
                </div>


                {combinedError && (
                    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                        {
                            combinedError
                        }
                    </div>
                )}


                {successMessage && (
                    <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium leading-6 text-emerald-800">
                        {
                            successMessage
                        }
                    </div>
                )}


                {/* Crear unidad */}

                <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)] sm:p-8">
                    <div className="border-b border-slate-100 pb-6">
                        <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                            <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="9" y="3" width="6" height="5" rx="1" />
                                <rect x="2" y="16" width="6" height="5" rx="1" />
                                <rect x="16" y="16" width="6" height="5" rx="1" />
                                <path d="M12 8v4M5 16v-4h14v4" />
                            </svg>
                        </span>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                            Estructura
                            organizacional
                        </p>

                        <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-900">
                            Crear unidad
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            Puedes crear una
                            unidad raíz o
                            colocarla debajo
                            de cualquier
                            unidad activa.
                        </p>
                    </div>


                    <form
                        onSubmit={
                            handleCreateUnit
                        }
                        className="mt-6"
                    >
                        <div className="grid gap-6 md:grid-cols-2 [&>div]:min-w-0">
                            <div>
                                <label htmlFor="org-unit-name" className="block text-sm font-medium text-slate-700">
                                    Nombre
                                </label>

                                <input
                                    id="org-unit-name"
                                    type="text"
                                    value={
                                        name
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setName(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    maxLength={
                                        150
                                    }
                                    disabled={
                                        creating
                                    }
                                    className="mt-2 min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 enabled:hover:border-sky-300 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 motion-reduce:transition-none"
                                />
                            </div>


                            <div>
                                <label htmlFor="org-unit-type" className="block text-sm font-medium text-slate-700">
                                    Tipo
                                </label>

                                <select
                                    id="org-unit-type"
                                    value={
                                        unitType
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setUnitType(
                                            Number(
                                                event
                                                    .target
                                                    .value
                                            ) as OrganizationalUnitType
                                        )
                                    }
                                    disabled={
                                        creating
                                    }
                                    className="mt-2 min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 enabled:hover:border-sky-300 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 motion-reduce:transition-none"
                                >
                                    <option value={1}>
                                        Departamento
                                    </option>

                                    <option value={2}>
                                        Área
                                    </option>

                                    <option value={3}>
                                        Línea
                                    </option>

                                    <option value={4}>
                                        Subárea
                                    </option>

                                    <option value={5}>
                                        Equipo
                                    </option>
                                </select>
                            </div>


                            <div>
                                <label htmlFor="org-unit-parent" className="block text-sm font-medium text-slate-700">
                                    Unidad padre
                                </label>

                                <select
                                    id="org-unit-parent"
                                    value={
                                        parentId
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setParentId(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    disabled={
                                        creating ||
                                        loadingUnits
                                    }
                                    className="mt-2 min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 enabled:hover:border-sky-300 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 motion-reduce:transition-none"
                                >
                                    <option value="">
                                        Sin padre
                                        — unidad raíz
                                    </option>

                                    {activeUnits.map(
                                        (
                                            unit
                                        ) => (
                                            <option
                                                key={
                                                    unit.id
                                                }
                                                value={
                                                    unit.id
                                                }
                                            >
                                                {
                                                    unit.name
                                                }
                                                {" — "}
                                                {getUnitTypeLabel(
                                                    unit.type
                                                )}
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>


                            <div>
                                <label htmlFor="org-unit-description" className="block text-sm font-medium text-slate-700">
                                    Descripción
                                </label>

                                <textarea
                                    id="org-unit-description"
                                    value={
                                        description
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setDescription(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    maxLength={
                                        500
                                    }
                                    rows={3}
                                    disabled={
                                        creating
                                    }
                                    className="mt-2 min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 enabled:hover:border-sky-300 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 motion-reduce:transition-none"
                                />

                                <p className="mt-2 text-right text-xs tabular-nums text-slate-500">
                                    {
                                        description.length
                                    }
                                    /500
                                </p>
                            </div>
                        </div>


                        <div className="mt-6 flex justify-end border-t border-slate-100 pt-6">
                            <button
                                type="submit"
                                disabled={
                                    creating ||
                                    !name.trim()
                                }
                                className="min-h-11 w-full rounded-xl bg-sky-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition duration-200 enabled:hover:-translate-y-0.5 enabled:hover:bg-sky-800 enabled:hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 focus-visible:ring-offset-2 enabled:active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transform-none motion-reduce:transition-none sm:w-auto"
                            >
                                {creating
                                    ? "Creando..."
                                    : "Crear unidad"}
                            </button>
                        </div>
                    </form>
                </section>


                {/* Jerarquía */}

                <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)] sm:p-8">
                    <div className="border-b border-slate-100 pb-6">
                        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                            Jerarquía actual
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            La sangría
                            representa la
                            relación
                            padre-hijo.
                        </p>
                    </div>


                    {loadingUnits && (
                        <p role="status" className="mt-6 rounded-xl border border-sky-100 bg-sky-50 px-6 py-8 text-center text-sm text-sky-800">
                            Cargando unidades...
                        </p>
                    )}


                    {!loadingUnits &&
                        hierarchyRows.length ===
                        0 && (
                            <div className="mt-6 rounded-2xl border border-dashed border-sky-200 bg-sky-50/50 px-6 py-12 text-center text-sm leading-6 text-slate-600">
                                Todavía no hay
                                unidades
                                organizacionales.
                            </div>
                        )}


                    {!loadingUnits &&
                        hierarchyRows.length >
                        0 && (
                            <div tabIndex={0} role="region" aria-label="Jerarquía de unidades organizacionales" className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/40 p-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100">
                                {hierarchyRows.map(
                                    ({
                                        unit,
                                        depth,
                                    }) => (
                                        <div
                                            key={
                                                unit.id
                                            }
                                            className="flex min-w-120 items-center gap-4 border-b border-slate-100 py-4 transition-colors last:border-b-0 hover:bg-sky-50/70 motion-reduce:transition-none [&>div]:min-w-0 [&>div]:border-l-2 [&>div]:border-sky-200 [&>div]:pl-4"
                                            style={{
                                                paddingLeft:
                                                    `${depth * 24}px`,
                                            }}
                                        >
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="wrap-break-word text-sm font-semibold text-slate-800">
                                                        {
                                                            unit.name
                                                        }
                                                    </p>

                                                    <span className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-800 ring-1 ring-inset ring-sky-200">
                                                        {getUnitTypeLabel(
                                                            unit.type
                                                        )}
                                                    </span>

                                                    <span
                                                        className={
                                                            unit.isActive
                                                                ? "inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 ring-1 ring-inset ring-emerald-200"
                                                                : "inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-200"
                                                        }
                                                    >
                                                        {unit.isActive
                                                            ? "Activa"
                                                            : "Inactiva"}
                                                    </span>
                                                </div>

                                                {unit.description && (
                                                    <p className="mt-2 max-w-2xl wrap-break-word text-xs leading-5 text-slate-500">
                                                        {
                                                            unit.description
                                                        }
                                                    </p>
                                                )}

                                                {unit.parentName && (
                                                    <p className="mt-2 wrap-break-word text-xs leading-5 text-slate-500">
                                                        Padre:{" "}
                                                        {
                                                            unit.parentName
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        )}
                </section>


                {/* Límites */}

                <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)] sm:p-8">
                    <div className="border-b border-slate-100 pb-6">
                        <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                            <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 7h16M4 17h16" />
                                <rect x="7" y="4" width="4" height="6" rx="1" fill="white" />
                                <rect x="14" y="14" width="4" height="6" rx="1" fill="white" />
                            </svg>
                        </span>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                            Reglas de consumo
                        </p>

                        <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-900">
                            Límite por
                            unidad
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            Define un máximo
                            específico por
                            ciclo para una
                            combinación de
                            unidad y producto.
                        </p>
                    </div>


                    <form
                        onSubmit={
                            handleSaveLimit
                        }
                        className="mt-6"
                    >
                        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,0.7fr)] [&>div]:min-w-0">
                            <div>
                                <label htmlFor="org-limit-unit" className="block text-sm font-medium text-slate-700">
                                    Unidad
                                </label>

                                <select
                                    id="org-limit-unit"
                                    value={
                                        limitUnitId
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setLimitUnitId(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    disabled={
                                        saving
                                    }
                                    className="mt-2 min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 enabled:hover:border-sky-300 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 motion-reduce:transition-none"
                                >
                                    <option value="">
                                        Selecciona
                                        una unidad
                                    </option>

                                    {activeUnits.map(
                                        (
                                            unit
                                        ) => (
                                            <option
                                                key={
                                                    unit.id
                                                }
                                                value={
                                                    unit.id
                                                }
                                            >
                                                {
                                                    unit.name
                                                }
                                                {" — "}
                                                {getUnitTypeLabel(
                                                    unit.type
                                                )}
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>


                            <div>
                                <label htmlFor="org-limit-product" className="block text-sm font-medium text-slate-700">
                                    Producto
                                </label>

                                <select
                                    id="org-limit-product"
                                    value={
                                        limitProductId
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setLimitProductId(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    disabled={
                                        saving ||
                                        loadingProducts
                                    }
                                    className="mt-2 min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 enabled:hover:border-sky-300 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 motion-reduce:transition-none"
                                >
                                    <option value="">
                                        Selecciona
                                        un producto
                                    </option>

                                    {activeProducts.map(
                                        (
                                            product
                                        ) => (
                                            <option
                                                key={
                                                    product.id
                                                }
                                                value={
                                                    product.id
                                                }
                                            >
                                                {
                                                    product.sku
                                                }
                                                {" — "}
                                                {
                                                    product.name
                                                }
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>


                            <div>
                                <label htmlFor="org-limit-max" className="block text-sm font-medium text-slate-700">
                                    Máximo por
                                    ciclo
                                </label>

                                <input
                                    id="org-limit-max"
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={
                                        maxQuantityPerCycle
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setMaxQuantityPerCycle(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    disabled={
                                        saving
                                    }
                                    className="mt-2 min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 enabled:hover:border-sky-300 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 motion-reduce:transition-none"
                                />
                            </div>
                        </div>


                        {selectedExistingLimit && (
                            <label className="mt-5 flex min-h-11 items-center gap-3 rounded-xl border border-sky-100 bg-sky-50/50 px-4 py-4">
                                <input
                                    type="checkbox"
                                    checked={
                                        limitIsActive
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setLimitIsActive(
                                            event
                                                .target
                                                .checked
                                        )
                                    }
                                    disabled={
                                        saving
                                    }
                                    className="h-5 w-5 shrink-0 rounded border-slate-300 accent-sky-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                                />

                                <span className="text-sm font-medium text-slate-700">
                                    Límite
                                    activo
                                </span>
                            </label>
                        )}


                        {limitUnitId &&
                            limitProductId && (
                                <div className="mt-5 rounded-xl border border-sky-200 bg-sky-50 p-4">
                                    {selectedExistingLimit ? (
                                        <p className="text-sm leading-6 text-slate-600">
                                            Esta
                                            combinación
                                            ya tiene
                                            una regla.
                                            Guardar
                                            actualizará
                                            el registro
                                            existente.
                                        </p>
                                    ) : (
                                        <p className="text-sm leading-6 text-slate-600">
                                            Esta
                                            combinación
                                            todavía no
                                            tiene un
                                            límite
                                            específico.
                                        </p>
                                    )}
                                </div>
                            )}


                        <div className="mt-6 flex justify-end border-t border-slate-100 pt-6">
                            <button
                                type="submit"
                                disabled={
                                    saving ||
                                    !limitUnitId ||
                                    !limitProductId ||
                                    !maxQuantityPerCycle
                                }
                                className="min-h-11 w-full rounded-xl bg-sky-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition duration-200 enabled:hover:-translate-y-0.5 enabled:hover:bg-sky-800 enabled:hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 focus-visible:ring-offset-2 enabled:active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transform-none motion-reduce:transition-none sm:w-auto"
                            >
                                {saving
                                    ? "Guardando..."
                                    : selectedExistingLimit
                                        ? "Actualizar límite"
                                        : "Crear límite"}
                            </button>
                        </div>
                    </form>
                </section>


                {/* Reglas existentes */}

                <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)] sm:p-8">
                    <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                                Reglas
                                configuradas
                            </h2>

                            <p className="mt-2 text-sm leading-6 text-slate-500">
                                Límites
                                específicos
                                actualmente
                                registrados.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                void refreshLimits()
                            }
                            disabled={
                                loadingLimits
                            }
                            className="min-h-11 w-full shrink-0 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors enabled:hover:border-sky-300 enabled:hover:bg-sky-50 enabled:hover:text-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none sm:w-auto"
                        >
                            {loadingLimits
                                ? "Actualizando..."
                                : "Actualizar"}
                        </button>
                    </div>


                    {!loadingLimits &&
                        sortedLimits.length ===
                        0 && (
                            <div className="mt-6 rounded-2xl border border-dashed border-sky-200 bg-sky-50/50 px-6 py-12 text-center text-sm leading-6 text-slate-600">
                                No hay límites
                                específicos
                                configurados.
                            </div>
                        )}


                    {sortedLimits.length >
                        0 && (
                            <div tabIndex={0} role="region" aria-label="Límites EPP configurados" className="mt-6 overflow-x-auto rounded-xl border border-slate-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100">
                                <table className="w-full min-w-190 text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-sky-100 bg-sky-50/80 text-left text-xs font-semibold uppercase tracking-wider text-sky-800">
                                            <th scope="col" className="px-5 py-3">
                                                Unidad
                                            </th>

                                            <th scope="col" className="px-5 py-3">
                                                Producto
                                            </th>

                                            <th scope="col" className="px-5 py-3 text-right">
                                                Máximo
                                            </th>

                                            <th scope="col" className="px-5 py-3 text-center">
                                                Estado
                                            </th>

                                            <th scope="col" className="px-5 py-3 text-right">
                                                Acción
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-100">
                                        {sortedLimits.map(
                                            (
                                                limit
                                            ) => (
                                                <tr
                                                    className="transition-colors duration-150 hover:bg-sky-50/50 motion-reduce:transition-none"
                                                    key={
                                                        limit.id
                                                    }
                                                >
                                                    <td className="px-5 py-4 text-sm font-medium text-slate-800">
                                                        {
                                                            limit.organizationalUnitName
                                                        }
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <p className="text-sm font-medium text-slate-800">
                                                            {
                                                                limit.productName
                                                            }
                                                        </p>

                                                        <p className="text-xs text-slate-500">
                                                            {
                                                                limit.sku
                                                            }
                                                        </p>
                                                    </td>

                                                    <td className="px-5 py-4 text-right text-sm font-semibold tabular-nums text-slate-800">
                                                        {
                                                            limit.maxQuantityPerCycle
                                                        }
                                                    </td>

                                                    <td className="px-5 py-4 text-center">
                                                        <span
                                                            className={
                                                                limit.isActive
                                                                    ? "inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 ring-1 ring-inset ring-emerald-200"
                                                                    : "inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200"
                                                            }
                                                        >
                                                            {limit.isActive
                                                                ? "Activo"
                                                                : "Inactivo"}
                                                        </span>
                                                    </td>

                                                    <td className="px-5 py-4 text-right">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleEditLimit(
                                                                    limit.organizationalUnitId,
                                                                    limit.ppeProductId
                                                                )
                                                            }
                                                            className="min-h-11 rounded-xl border border-sky-200 bg-white px-4 py-2.5 text-sm font-semibold text-sky-800 transition-colors hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 motion-reduce:transition-none"
                                                        >
                                                            Editar
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                </section>
            </div>
        );
    };
