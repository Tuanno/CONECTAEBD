import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function AdminSecretaries() {
    const { props } = usePage();
    const [secretaries, setSecretaries] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('/api/secretaries')
            .then(({ data }) => setSecretaries(data.secretaries || []))
            .catch((error) => console.error('Erro ao buscar secretárias:', error))
            .finally(() => setLoading(false));
    }, []);

    return (
        <AuthenticatedLayout>
            <Head title="Secretárias" />

            <div className="mx-auto max-w-4xl">
                <div className="mb-6 flex items-center justify-between gap-4">
                    <div>
                        <h1 className="mt-3 text-3xl font-bold text-gray-800">Secretárias</h1>
                        <p className="mt-1 text-gray-600">Cadastre novas secretárias ou edite os dados existentes.</p>
                    </div>
                    <Link
                        href="/register"
                        className="rounded-lg bg-[#4ade80] px-4 py-2 text-sm font-semibold text-white hover:bg-green-500"
                    >
                        Cadastrar nova
                    </Link>
                </div>

                <div className="overflow-hidden rounded-xl bg-white shadow-lg">
                    {loading ? (
                        <p className="p-6 text-center text-gray-500">Carregando secretárias...</p>
                    ) : secretaries.length === 0 ? (
                        <div className="p-8 text-center">
                            <p className="text-gray-500">Nenhuma secretária cadastrada.</p>
                            <Link
                                href="/register"
                                className="mt-4 inline-block font-semibold text-indigo-600 hover:text-indigo-700"
                            >
                                Cadastrar a primeira secretária
                            </Link>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {secretaries.map((secretary) => (
                                <div key={secretary.id} className="flex items-center justify-between gap-4 p-5">
                                    <div>
                                        <p className="font-semibold text-gray-800">{secretary.name}</p>
                                        <p className="text-sm text-gray-500">{secretary.email}</p>
                                    </div>
                                    <Link
                                        href={route('edit-user', { id: secretary.id })}
                                        className="rounded-lg px-4 py-2 text-sm font-semibold black hover:bg-green-400"
                                    >
                                        Editar
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
