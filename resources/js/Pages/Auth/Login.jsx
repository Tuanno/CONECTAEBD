import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const [showPassword, setShowPassword] = useState(false);

    const submit = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Log in" />
            <div className="w-full max-w-md mx-auto px-4">
                <div className="bg-white shadow-xl rounded-2xl p-6 border border-gray-100">
                    <div className="flex flex-col items-center text-center mb-6">
                        <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm">
                            <Lock className="w-7 h-7" />
                        </div>
                        <h1 className="mt-4 text-2xl font-bold text-gray-800">Bem-vindo ao CONECTAEBD!</h1>
                        <p className="text-gray-500">Acesse sua conta abaixo</p>
                    </div>

                    {status && (
                        <div className="mb-4 text-sm font-medium text-green-700 bg-green-50 border border-green-100 rounded-lg px-4 py-3">
                            {status}
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <InputLabel htmlFor="email" value="Email" className="text-gray-800 font-semibold" />
                            <div className="mt-2 relative">
                                <Mail className="absolute left-3 top-3 h-5 w-5 text-emerald-500" />
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    autoComplete="username"
                                    className="w-full rounded-lg border border-gray-300 pl-11 pr-3 py-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
                                    placeholder="Digite seu e-mail"
                                />
                            </div>
                            <InputError message={errors.email} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="password" value="Senha" className="text-gray-800 font-semibold" />
                            <div className="mt-2 relative">
                                <Lock className="absolute left-3 top-3 h-5 w-5 text-emerald-500" />
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    autoComplete="current-password"
                                    className="w-full rounded-lg border border-gray-300 pl-11 pr-11 py-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
                                    placeholder="Digite sua senha"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                            <InputError message={errors.password} className="mt-2" />
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            {canResetPassword && (
                                <Link
                                    href={route('password.request')}
                                    className="text-emerald-600 font-medium hover:text-emerald-700"
                                >
                                    Esqueceu sua senha?
                                </Link>
                            )}
                        </div>
                        <div className="flex items-center justify-between pt-2 text-sm">
                            <Link
                                href={route('register')}
                                className="text-emerald-600 font-medium hover:text-emerald-700"
                            >
                                Não possui uma conta? Faça o cadastro.
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 shadow-md transition-colors disabled:opacity-60"
                        >
                            ENTRAR
                            <span className="text-lg leading-none">→</span>
                        </button>
                    </form>
                </div>
            </div>
        </GuestLayout>
    );
}
