export const AdminPage = () => {
    return (
        <main className="min-h-screen bg-slate-100 p-8">
            <div className="mx-auto max-w-6xl">
                <h1 className="text-2xl font-semibold text-slate-900">
                    Administración
                </h1>

                <p className="mt-2 text-slate-600">
                    Solo los administradores pueden acceder a esta página.
                </p>
            </div>
        </main>
    );
};