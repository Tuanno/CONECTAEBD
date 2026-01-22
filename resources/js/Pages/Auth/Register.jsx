import UserForm from '@/Components/UserForm';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { UserPlus } from 'lucide-react';

export default function Register() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        birth_date: '',
        user_role: '',
        class_group: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('register'));
    };

    return (
        <GuestLayout>
            <Head title="Register" />
            <div className="w-full max-w-2xl mx-auto px-4">
                <div className="bg-white shadow-xl rounded-2xl p-6 border border-gray-100">
                    <div className="flex items-start gap-4 mb-8">
                        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm flex-shrink-0 mt-1">
                            <UserPlus className="w-6 h-6" />
                        </div>
                        <div className="text-left">
                            <h1 className="text-2xl font-bold text-gray-800">Crie sua conta</h1>
                            <p className="text-gray-600 text-sm">Preencha os dados para acessar o CONECTAEBD</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <UserForm 
                            data={data}
                            setData={setData}
                            errors={errors}
                            isLoading={processing}
                            isEditing={false}
                        />

                        <div className="flex items-center justify-between pt-2 text-sm">
                            <Link
                                href={route('login')}
                                className="text-emerald-600 font-medium hover:text-emerald-700"
                            >
                               Já possui uma conta? Faça login.
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 shadow-md transition-colors disabled:opacity-60"
                        >
                            Registrar
                        </button>
                    </form>
                </div>
            </div>
        </GuestLayout>
    );
}
