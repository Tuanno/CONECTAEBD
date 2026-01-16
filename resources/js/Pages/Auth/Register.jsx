import PrimaryButton from '@/Components/PrimaryButton';
import UserForm from '@/Components/UserForm';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

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
            <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">
                REGISTRO
            </h1>
            <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
                Abra sua Conta
            </h1>

            <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                    <UserForm 
                        data={data}
                        setData={setData}
                        errors={errors}
                        isLoading={processing}
                        isEditing={false}
                    />
                </div>

                <div className="mt-6 flex items-center justify-between">
                    <Link
                        href={route('login')}
                        className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                       Já possui uma conta? Faça login.
                    </Link>
                    <PrimaryButton className="ms-4" disabled={processing}>
                        Registrar
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
