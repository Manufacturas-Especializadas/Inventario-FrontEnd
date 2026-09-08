import {
    useState,
    type FormEvent,
} from "react";

import {
    useEmployeeLookup,
} from "../hooks/useEmployeeLookup";

import {
    useOrganizationalUnits,
} from "../hooks/useOrganizationalUnits";

import {
    useWarehouses,
} from "../hooks/useWarehouses";

import {
    useRequestReasons,
} from "../hooks/useRequestReasons";

import {
    usePPEProducts,
} from "../hooks/usePPEProducts";

import {
    usePPERequests,
} from "../hooks/usePPERequests";


interface PPERequestFormItem {
    key: string;

    ppeProductId: string;

    quantity: string;
}


const createEmptyItem =
    (): PPERequestFormItem => ({
        key: crypto.randomUUID(),

        ppeProductId: "",

        quantity: "1",
    });

const formatDateTime = (
    value: string
) => {
    return new Intl.DateTimeFormat(
        "es-MX",
        {
            dateStyle: "medium",
            timeStyle: "short",
        }
    ).format(
        new Date(value)
    );
};


const getOrganizationalUnitTypeLabel = (
    type: number
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
            return "Unidad";
    }
};


export const PPERequestsPage = () => {
    const {
        employee,
        loading: loadingEmployee,
        error: employeeError,
        getByEmployeeNumber,
        clearEmployee,
    } = useEmployeeLookup();

    const {
        organizationalUnits,
        loading: loadingOrganizationalUnits,
        error: organizationalUnitsError,
    } = useOrganizationalUnits();

    const {
        warehouses,
        loading: loadingWarehouses,
        error: warehousesError,
    } = useWarehouses();

    const {
        requestReasons,
        loading: loadingRequestReasons,
        error: requestReasonsError,
    } = useRequestReasons();

    const {
        products,
        loading: loadingProducts,
        error: productsError,
    } = usePPEProducts();

    const {
        pendingRequests,
        createResult,

        loading: loadingRequest,
        loadingPending,
        cancellingFolio,

        error: requestError,
        pendingError,
        cancelError,

        getPending,
        createRequest,
        cancelRequest,
    } = usePPERequests();

    const [
        cancelFolio,
        setCancelFolio,
    ] = useState<string | null>(
        null
    );

    const [
        cancellationReason,
        setCancellationReason,
    ] = useState("");

    const [
        cancellationSuccessMessage,
        setCancellationSuccessMessage,
    ] = useState<string | null>(
        null
    );

    const [
        employeeNumber,
        setEmployeeNumber,
    ] = useState("");

    const [
        requestedForOrganizationalUnitId,
        setRequestedForOrganizationalUnitId,
    ] = useState("");

    const [
        warehouseId,
        setWarehouseId,
    ] = useState("");

    const [
        requestReasonId,
        setRequestReasonId,
    ] = useState("");

    const [
        notes,
        setNotes,
    ] = useState("");

    const [
        items,
        setItems,
    ] = useState<PPERequestFormItem[]>([
        createEmptyItem(),
    ]);

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


    const loadingCatalogs =
        loadingOrganizationalUnits ||
        loadingWarehouses ||
        loadingRequestReasons ||
        loadingProducts;


    const catalogError =
        organizationalUnitsError ||
        warehousesError ||
        requestReasonsError ||
        productsError;


    const handleEmployeeNumberChange = (
        value: string
    ) => {
        setEmployeeNumber(value);

        clearEmployee();

        setFormError(null);
        setSuccessMessage(null);
    };


    const handleEmployeeLookup =
        async () => {
            setFormError(null);
            setSuccessMessage(null);

            await getByEmployeeNumber(
                employeeNumber
            );
        };


    const addItem = () => {
        setItems(
            (current) => [
                ...current,
                createEmptyItem(),
            ]
        );
    };


    const removeItem = (
        key: string
    ) => {
        setItems(
            (current) => {
                if (current.length === 1) {
                    return current;
                }

                return current.filter(
                    (item) =>
                        item.key !== key
                );
            }
        );
    };


    const updateItem = (
        key: string,
        field:
            | "ppeProductId"
            | "quantity",
        value: string
    ) => {
        setItems(
            (current) =>
                current.map(
                    (item) =>
                        item.key === key
                            ? {
                                ...item,
                                [field]: value,
                            }
                            : item
                )
        );
    };


    const resetForm = () => {
        setEmployeeNumber("");

        clearEmployee();

        setRequestedForOrganizationalUnitId(
            ""
        );

        setWarehouseId("");

        setRequestReasonId("");

        setNotes("");

        setItems([
            createEmptyItem(),
        ]);
    };


    const handleSubmit =
        async (
            event:
                FormEvent<HTMLFormElement>
        ) => {
            event.preventDefault();

            setFormError(null);
            setSuccessMessage(null);


            if (!employee) {
                setFormError(
                    "Busca y confirma al empleado antes de crear la solicitud."
                );

                return;
            }


            const parsedOrganizationalUnitId =
                Number(
                    requestedForOrganizationalUnitId
                );

            if (
                !Number.isInteger(
                    parsedOrganizationalUnitId
                ) ||
                parsedOrganizationalUnitId <= 0
            ) {
                setFormError(
                    "Selecciona la unidad organizacional que recibirá el EPP."
                );

                return;
            }


            const parsedWarehouseId =
                Number(
                    warehouseId
                );

            if (
                !Number.isInteger(
                    parsedWarehouseId
                ) ||
                parsedWarehouseId <= 0
            ) {
                setFormError(
                    "Selecciona un almacén."
                );

                return;
            }


            const parsedRequestReasonId =
                Number(
                    requestReasonId
                );

            if (
                !Number.isInteger(
                    parsedRequestReasonId
                ) ||
                parsedRequestReasonId <= 0
            ) {
                setFormError(
                    "Selecciona un motivo de solicitud."
                );

                return;
            }


            const selectedProductIds =
                items.map(
                    (item) =>
                        Number(
                            item.ppeProductId
                        )
                );


            if (
                selectedProductIds.some(
                    (id) =>
                        !Number.isInteger(id) ||
                        id <= 0
                )
            ) {
                setFormError(
                    "Todos los renglones deben tener un producto EPP."
                );

                return;
            }


            const uniqueProductIds =
                new Set(
                    selectedProductIds
                );


            if (
                uniqueProductIds.size !==
                selectedProductIds.length
            ) {
                setFormError(
                    "No puedes agregar el mismo producto EPP más de una vez."
                );

                return;
            }


            const parsedItems =
                items.map(
                    (item) => ({
                        ppeProductId:
                            Number(
                                item.ppeProductId
                            ),

                        quantity:
                            Number(
                                item.quantity
                            ),
                    })
                );


            if (
                parsedItems.some(
                    (item) =>
                        !Number.isInteger(
                            item.quantity
                        ) ||
                        item.quantity <= 0
                )
            ) {
                setFormError(
                    "Las cantidades deben ser números enteros mayores a cero."
                );

                return;
            }


            const result =
                await createRequest({
                    employeeNumber:
                        employee.employeeNumber,

                    requestedForOrganizationalUnitId:
                        parsedOrganizationalUnitId,

                    warehouseId:
                        parsedWarehouseId,

                    requestReasonId:
                        parsedRequestReasonId,

                    notes:
                        notes.trim() ||
                        null,

                    items:
                        parsedItems,
                });


            if (!result) {
                return;
            }


            setSuccessMessage(
                `Solicitud creada correctamente. Folio: ${result.request.folio}`
            );

            resetForm();
            await getPending();
        };

    const openCancellation = (
        folio: string
    ) => {
        setCancelFolio(
            folio
        );

        setCancellationReason("");

        setCancellationSuccessMessage(
            null
        );
    };


    const closeCancellation = () => {
        setCancelFolio(
            null
        );

        setCancellationReason("");
    };


    const handleCancelRequest =
        async (
            folio: string
        ) => {
            const normalizedReason =
                cancellationReason.trim();

            if (!normalizedReason) {
                return;
            }

            const result =
                await cancelRequest(
                    folio,
                    normalizedReason
                );

            if (!result) {
                return;
            }

            setCancellationSuccessMessage(
                `Solicitud ${result.folio} cancelada correctamente.`
            );

            setCancelFolio(
                null
            );

            setCancellationReason("");
        };


    return (
        <div className="mx-auto max-w-7xl">
            <div>
                <p className="text-sm font-medium text-slate-500">
                    Producción
                </p>

                <h1 className="mt-1 text-2xl font-bold text-slate-900">
                    Solicitudes EPP
                </h1>

                <p className="mt-2 text-sm text-slate-600">
                    Registra solicitudes de equipo de
                    protección personal para las
                    unidades organizacionales.
                </p>
            </div>


            {catalogError && (
                <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {catalogError}
                </div>
            )}


            {successMessage && (
                <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    {successMessage}
                </div>
            )}

            {cancellationSuccessMessage && (
                <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    {cancellationSuccessMessage}
                </div>
            )}


            {(formError || requestError) && (
                <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {formError || requestError}
                </div>
            )}


            {createResult &&
                createResult.warnings.length >
                0 && (
                    <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
                        <p className="text-sm font-semibold text-amber-800">
                            Advertencias de la solicitud
                        </p>

                        <div className="mt-2 space-y-2">
                            {createResult.warnings.map(
                                (
                                    warning,
                                    index
                                ) => (
                                    <p
                                        key={`${warning.code}-${warning.ppeProductId}-${index}`}
                                        className="text-sm text-amber-700"
                                    >
                                        {
                                            warning.message
                                        }
                                    </p>
                                )
                            )}
                        </div>
                    </div>
                )}


            <form
                onSubmit={handleSubmit}
                className="mt-8 space-y-6"
            >
                {/* Solicitante */}

                <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div>
                        <p className="text-sm font-medium text-slate-500">
                            Paso 1
                        </p>

                        <h2 className="mt-1 text-lg font-semibold text-slate-900">
                            Solicitante
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Busca al empleado que está
                            realizando físicamente la
                            solicitud.
                        </p>
                    </div>


                    <div className="mt-6 max-w-2xl">
                        <label className="block text-sm font-medium text-slate-700">
                            Número de empleado
                        </label>

                        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                            <input
                                type="text"
                                value={
                                    employeeNumber
                                }
                                onChange={(
                                    event
                                ) =>
                                    handleEmployeeNumberChange(
                                        event.target
                                            .value
                                    )
                                }
                                disabled={
                                    loadingEmployee ||
                                    loadingRequest
                                }
                                placeholder="Ej. 1234"
                                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                            />

                            <button
                                type="button"
                                onClick={() =>
                                    void handleEmployeeLookup()
                                }
                                disabled={
                                    loadingEmployee ||
                                    !employeeNumber.trim()
                                }
                                className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {loadingEmployee
                                    ? "Buscando..."
                                    : "Buscar"}
                            </button>
                        </div>


                        {employeeError && (
                            <p className="mt-2 text-sm text-red-600">
                                {
                                    employeeError
                                }
                            </p>
                        )}


                        {employee && (
                            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                                <p className="text-sm font-semibold text-emerald-800">
                                    Empleado encontrado
                                </p>

                                <p className="mt-1 text-sm text-emerald-700">
                                    {
                                        employee.employeeNumber
                                    }
                                    {" — "}
                                    {
                                        employee.name
                                    }
                                </p>
                            </div>
                        )}
                    </div>
                </section>


                {/* Información de solicitud */}

                <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div>
                        <p className="text-sm font-medium text-slate-500">
                            Paso 2
                        </p>

                        <h2 className="mt-1 text-lg font-semibold text-slate-900">
                            Información de la solicitud
                        </h2>
                    </div>


                    <div className="mt-6 grid gap-5 md:grid-cols-3">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">
                                Unidad organizacional
                            </label>

                            <select
                                value={
                                    requestedForOrganizationalUnitId
                                }
                                onChange={(
                                    event
                                ) =>
                                    setRequestedForOrganizationalUnitId(
                                        event
                                            .target
                                            .value
                                    )
                                }
                                disabled={
                                    loadingOrganizationalUnits ||
                                    loadingRequest
                                }
                                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                            >
                                <option value="">
                                    Selecciona una unidad
                                </option>

                                {organizationalUnits
                                    .filter(
                                        (unit) =>
                                            unit.isActive
                                    )
                                    .map(
                                        (unit) => (
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
                                                {getOrganizationalUnitTypeLabel(
                                                    unit.type
                                                )}
                                                {unit.parentName
                                                    ? ` / ${unit.parentName}`
                                                    : ""}
                                            </option>
                                        )
                                    )}
                            </select>

                            <p className="mt-2 text-xs text-slate-500">
                                Esta unidad es la que
                                consumirá el cupo del EPP.
                            </p>
                        </div>


                        <div>
                            <label className="block text-sm font-medium text-slate-700">
                                Almacén
                            </label>

                            <select
                                value={
                                    warehouseId
                                }
                                onChange={(
                                    event
                                ) =>
                                    setWarehouseId(
                                        event.target
                                            .value
                                    )
                                }
                                disabled={
                                    loadingWarehouses ||
                                    loadingRequest
                                }
                                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                            >
                                <option value="">
                                    Selecciona un almacén
                                </option>

                                {warehouses
                                    .filter(
                                        (warehouse) =>
                                            warehouse.isActive
                                    )
                                    .map(
                                        (
                                            warehouse
                                        ) => (
                                            <option
                                                key={
                                                    warehouse.id
                                                }
                                                value={
                                                    warehouse.id
                                                }
                                            >
                                                {
                                                    warehouse.code
                                                }
                                                {" — "}
                                                {
                                                    warehouse.name
                                                }
                                            </option>
                                        )
                                    )}
                            </select>
                        </div>


                        <div>
                            <label className="block text-sm font-medium text-slate-700">
                                Motivo
                            </label>

                            <select
                                value={
                                    requestReasonId
                                }
                                onChange={(
                                    event
                                ) =>
                                    setRequestReasonId(
                                        event.target
                                            .value
                                    )
                                }
                                disabled={
                                    loadingRequestReasons ||
                                    loadingRequest
                                }
                                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                            >
                                <option value="">
                                    Selecciona un motivo
                                </option>

                                {requestReasons.map(
                                    (reason) => (
                                        <option
                                            key={
                                                reason.id
                                            }
                                            value={
                                                reason.id
                                            }
                                        >
                                            {
                                                reason.name
                                            }
                                        </option>
                                    )
                                )}
                            </select>
                        </div>
                    </div>
                </section>


                {/* Productos */}

                <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">
                                Paso 3
                            </p>

                            <h2 className="mt-1 text-lg font-semibold text-slate-900">
                                Equipo solicitado
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Agrega uno o varios
                                productos EPP y la cantidad
                                requerida.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={addItem}
                            disabled={
                                loadingProducts ||
                                loadingRequest
                            }
                            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Agregar producto
                        </button>
                    </div>


                    <div className="mt-6 space-y-4">
                        {items.map(
                            (
                                item,
                                index
                            ) => (
                                <div
                                    key={
                                        item.key
                                    }
                                    className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                                >
                                    <div className="grid gap-4 md:grid-cols-[1fr_180px_auto] md:items-end">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700">
                                                Producto EPP
                                            </label>

                                            <select
                                                value={
                                                    item.ppeProductId
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    updateItem(
                                                        item.key,
                                                        "ppeProductId",
                                                        event
                                                            .target
                                                            .value
                                                    )
                                                }
                                                disabled={
                                                    loadingProducts ||
                                                    loadingRequest
                                                }
                                                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
                                            >
                                                <option value="">
                                                    Selecciona un producto
                                                </option>

                                                {products
                                                    .filter(
                                                        (
                                                            product
                                                        ) =>
                                                            product.isActive
                                                    )
                                                    .map(
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
                                            <label className="block text-sm font-medium text-slate-700">
                                                Cantidad
                                            </label>

                                            <input
                                                type="number"
                                                min="1"
                                                step="1"
                                                value={
                                                    item.quantity
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    updateItem(
                                                        item.key,
                                                        "quantity",
                                                        event
                                                            .target
                                                            .value
                                                    )
                                                }
                                                disabled={
                                                    loadingRequest
                                                }
                                                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
                                            />
                                        </div>


                                        <button
                                            type="button"
                                            onClick={() =>
                                                removeItem(
                                                    item.key
                                                )
                                            }
                                            disabled={
                                                items.length ===
                                                1 ||
                                                loadingRequest
                                            }
                                            className="rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            Quitar
                                        </button>
                                    </div>

                                    <p className="mt-3 text-xs text-slate-400">
                                        Producto{" "}
                                        {index + 1}
                                    </p>
                                </div>
                            )
                        )}
                    </div>
                </section>


                {/* Observaciones */}

                <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div>
                        <p className="text-sm font-medium text-slate-500">
                            Paso 4
                        </p>

                        <h2 className="mt-1 text-lg font-semibold text-slate-900">
                            Observaciones
                        </h2>
                    </div>


                    <div className="mt-6">
                        <label className="block text-sm font-medium text-slate-700">
                            Notas
                        </label>

                        <textarea
                            value={notes}
                            onChange={(event) =>
                                setNotes(
                                    event.target
                                        .value
                                )
                            }
                            disabled={
                                loadingRequest
                            }
                            rows={4}
                            placeholder="Agrega información adicional sobre la solicitud..."
                            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                        />

                        <p className="mt-2 text-xs text-slate-500">
                            Algunos motivos excepcionales
                            pueden requerir una
                            explicación.
                        </p>
                    </div>
                </section>


                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={
                            loadingRequest ||
                            loadingCatalogs
                        }
                        className="rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loadingRequest
                            ? "Creando solicitud..."
                            : "Crear solicitud"}
                    </button>
                </div>
            </form>
            <section className="mt-10 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">
                            Seguimiento
                        </p>

                        <h2 className="mt-1 text-lg font-semibold text-slate-900">
                            Solicitudes pendientes
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Solicitudes creadas que todavía
                            no han sido entregadas ni
                            canceladas.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            void getPending()
                        }
                        disabled={
                            loadingPending
                        }
                        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loadingPending
                            ? "Actualizando..."
                            : "Actualizar"}
                    </button>
                </div>


                {pendingError && (
                    <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {pendingError}
                    </div>
                )}


                {loadingPending &&
                    pendingRequests.length === 0 && (
                        <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 px-4 py-8 text-center">
                            <p className="text-sm text-slate-500">
                                Cargando solicitudes
                                pendientes...
                            </p>
                        </div>
                    )}


                {!loadingPending &&
                    !pendingError &&
                    pendingRequests.length === 0 && (
                        <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 px-4 py-8 text-center">
                            <p className="text-sm font-medium text-slate-700">
                                No hay solicitudes
                                pendientes.
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                                Las nuevas solicitudes
                                aparecerán aquí.
                            </p>
                        </div>
                    )}


                {pendingRequests.length > 0 && (
                    <div className="mt-6 space-y-4">
                        {pendingRequests.map(
                            (request) => (
                                <article
                                    key={
                                        request.id
                                    }
                                    className="rounded-xl border border-slate-200 p-5"
                                >
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-3">
                                                <h3 className="text-base font-semibold text-slate-900">
                                                    {
                                                        request.folio
                                                    }
                                                </h3>

                                                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                                                    Pendiente
                                                </span>
                                            </div>

                                            <p className="mt-2 text-sm text-slate-500">
                                                Creada{" "}
                                                {formatDateTime(
                                                    request.createdAt
                                                )}
                                            </p>
                                        </div>


                                        <button
                                            type="button"
                                            onClick={() =>
                                                openCancellation(
                                                    request.folio
                                                )
                                            }
                                            disabled={
                                                cancellingFolio ===
                                                request.folio
                                            }
                                            className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            Cancelar solicitud
                                        </button>
                                    </div>


                                    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                        <div>
                                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                                Solicitante
                                            </p>

                                            <p className="mt-1 text-sm font-medium text-slate-800">
                                                {
                                                    request.employeeName
                                                }
                                            </p>

                                            <p className="text-xs text-slate-500">
                                                Nómina{" "}
                                                {
                                                    request.employeeNumber
                                                }
                                            </p>
                                        </div>


                                        <div>
                                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                                Unidad destino
                                            </p>

                                            <p className="mt-1 text-sm font-medium text-slate-800">
                                                {request.requestedForOrganizationalUnitName ??
                                                    "Sin unidad"}
                                            </p>
                                        </div>


                                        <div>
                                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                                Almacén
                                            </p>

                                            <p className="mt-1 text-sm font-medium text-slate-800">
                                                {
                                                    request.warehouseName
                                                }
                                            </p>
                                        </div>


                                        <div>
                                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                                Motivo
                                            </p>

                                            <p className="mt-1 text-sm font-medium text-slate-800">
                                                {
                                                    request.requestReason
                                                }
                                            </p>
                                        </div>
                                    </div>


                                    <div className="mt-5 border-t border-slate-100 pt-5">
                                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                            Equipo solicitado
                                        </p>

                                        <div className="mt-3 space-y-2">
                                            {request.items.map(
                                                (
                                                    item
                                                ) => (
                                                    <div
                                                        key={
                                                            item.ppeProductId
                                                        }
                                                        className="flex flex-col gap-1 rounded-lg bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                                                    >
                                                        <div>
                                                            <p className="text-sm font-medium text-slate-800">
                                                                {
                                                                    item.productName
                                                                }
                                                            </p>

                                                            <p className="text-xs text-slate-500">
                                                                {
                                                                    item.sku
                                                                }
                                                            </p>
                                                        </div>

                                                        <p className="text-sm font-semibold text-slate-700">
                                                            Cantidad:{" "}
                                                            {
                                                                item.quantity
                                                            }
                                                        </p>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>


                                    {request.notes && (
                                        <div className="mt-5 border-t border-slate-100 pt-5">
                                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                                Observaciones
                                            </p>

                                            <p className="mt-2 text-sm text-slate-600">
                                                {
                                                    request.notes
                                                }
                                            </p>
                                        </div>
                                    )}

                                    {cancelFolio ===
                                        request.folio && (
                                            <div className="mt-5 border-t border-red-100 pt-5">
                                                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                                                    <h4 className="text-sm font-semibold text-red-800">
                                                        Cancelar solicitud
                                                    </h4>

                                                    <p className="mt-1 text-sm text-red-700">
                                                        La solicitud dejará de estar
                                                        pendiente y el inventario
                                                        reservado será liberado.
                                                    </p>


                                                    <div className="mt-4">
                                                        <label className="block text-sm font-medium text-red-800">
                                                            Motivo de cancelación
                                                        </label>

                                                        <textarea
                                                            value={
                                                                cancellationReason
                                                            }
                                                            onChange={(
                                                                event
                                                            ) =>
                                                                setCancellationReason(
                                                                    event.target
                                                                        .value
                                                                )
                                                            }
                                                            maxLength={500}
                                                            rows={3}
                                                            disabled={
                                                                cancellingFolio ===
                                                                request.folio
                                                            }
                                                            placeholder="Explica por qué se cancela esta solicitud..."
                                                            className="mt-2 w-full rounded-lg border border-red-200 bg-white px-3 py-2.5 text-sm text-slate-800"
                                                        />

                                                        <div className="mt-1 flex justify-between">
                                                            <p className="text-xs text-red-600">
                                                                El motivo es
                                                                obligatorio.
                                                            </p>

                                                            <p className="text-xs text-slate-400">
                                                                {
                                                                    cancellationReason.length
                                                                }
                                                                /500
                                                            </p>
                                                        </div>
                                                    </div>


                                                    {cancelError && (
                                                        <div className="mt-4 rounded-lg border border-red-300 bg-white px-3 py-2 text-sm text-red-700">
                                                            {
                                                                cancelError
                                                            }
                                                        </div>
                                                    )}


                                                    <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                                        <button
                                                            type="button"
                                                            onClick={
                                                                closeCancellation
                                                            }
                                                            disabled={
                                                                cancellingFolio ===
                                                                request.folio
                                                            }
                                                            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            Volver
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                void handleCancelRequest(
                                                                    request.folio
                                                                )
                                                            }
                                                            disabled={
                                                                !cancellationReason.trim() ||
                                                                cancellingFolio ===
                                                                request.folio
                                                            }
                                                            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            {cancellingFolio ===
                                                                request.folio
                                                                ? "Cancelando..."
                                                                : "Confirmar cancelación"}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                </article>
                            )
                        )}
                    </div>
                )}
            </section>
        </div>
    );
};