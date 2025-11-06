import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        birth_date: '',
        user_role: '',
        class_group: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Register" />

            <form onSubmit={submit}>
                <div>
                    <InputLabel htmlFor="name" value="Name" />

                    <TextInput
                        id="name"
                        name="name"
                        value={data.name}
                        className="mt-1 block w-full"
                        autoComplete="name"
                        isFocused={true}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                    />

                    <InputError message={errors.name} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="email" value="Email" />

                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1 block w-full"
                        autoComplete="username"
                        onChange={(e) => setData('email', e.target.value)}
                        required
                    />

                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="birth_date" value="Data de Nascimento" />

                    <input
                        id="birth_date"
                        name="birth_date"
                        type="date"
                        value={data.birth_date}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                        onChange={(e) => setData('birth_date', e.target.value)}
                        required
                    />

                    <InputError message={errors.birth_date} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="user_role" value="Tipo de usuário" />

                    <select
                        id="user_role"
                        name="user_role"
                        value={data.user_role}
                        className="mt-1 block w-full rounded-md border-gray-300 bg-white shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                        onChange={(e) => setData('user_role', e.target.value)}
                        required
                    >
                        <option value="">Selecione...</option>
                        <option value="professor">Professor</option>
                        <option value="secretaria">Secretária</option>
                        <option value="aluno">Aluno</option>
                    </select>

                    <InputError message={errors.user_role} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="class_group" value="Classe" />

                    <select
                        id="class_group"
                        name="class_group"
                        value={data.class_group}
                        className="mt-1 block w-full rounded-md border-gray-300 bg-white shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                        onChange={(e) => setData('class_group', e.target.value)}
                        required
                    >
                        <option value="">Selecione...</option>
                        <option value="adulto">Adulto</option>
                        <option value="juvenil">Juvenil</option>
                        <option value="infantil">Infantil</option>
                        <option value="pre-adolescente">Pré-Adolescente</option>
                    </select>

                    <InputError message={errors.class_group} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="password" value="Password" />

                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                        onChange={(e) => setData('password', e.target.value)}
                        required
                    />

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel
                        htmlFor="password_confirmation"
                        value="Confirm Password"
                    />

                    <TextInput
                        id="password_confirmation"
                        type="password"
                        name="password_confirmation"
                        value={data.password_confirmation}
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                        onChange={(e) =>
                            setData('password_confirmation', e.target.value)
                        }
                        required
                    />

                    <InputError
                        message={errors.password_confirmation}
                        className="mt-2"
                    />
                </div>

                <div className="mt-4 flex items-center justify-end">
                    <Link
                        href={route('login')}
                        className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        Already registered?
                    </Link>

                    <PrimaryButton className="ms-4" disabled={processing}>
                        Register
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
