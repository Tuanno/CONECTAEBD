import UserForm from '@/Components/UserForm';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function EditUser({ id }) {
    const userId = id;
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [userData, setUserData] = useState(null);

    // Buscar dados do usuário
    useEffect(() => {
        axios.get(`/api/users/${userId}`)
            .then(response => {
                setUserData(response.data.user);
                setLoading(false);
            })
            .catch(error => {
                console.error('Erro ao buscar usuário:', error);
                alert('Erro ao carregar dados do usuário');
                setLoading(false);
            });
    }, [userId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const response = await axios.put(`/api/users/${userId}`, userData);
            
            if (response.data.success) {
                alert('✓ Usuário atualizado com sucesso!');
                window.history.back();
            } else {
                alert('Erro: ' + response.data.message);
            }
        } catch (error) {
            console.error('Erro ao salvar:', error);
            alert('Erro ao salvar usuário: ' + (error.response?.data?.message || error.message));
        } finally {
            setSaving(false);
        }
    };

    const handleUserDataChange = (field, value) => {
        setUserData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Editar Usuário" />

            <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
                    <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-700 mb-4 inline-block font-medium">
                        ← Voltar
                    </Link>

                    <h1 className="text-2xl font-bold text-gray-800 mb-6">Editar Usuário</h1>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : userData ? (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <UserForm 
                                data={userData}
                                setData={handleUserDataChange}
                                errors={{}}
                                isLoading={saving}
                                isEditing={true}
                            />
                        </form>
                    ) : (
                        <p className="text-center text-gray-600">Erro ao carregar usuário</p>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
