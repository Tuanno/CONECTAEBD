import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function UserForm({ 
    data = {}, 
    setData = () => {}, 
    errors = {}, 
    isLoading = false, 
    isEditing = false,
    showButtons = false,
    onSubmit = () => {}
}) {
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
    const classes = [
        { name: 'Adulto', value: 'adulto' },
        { name: 'Juvenil', value: 'juvenil' },
        { name: 'Infantil', value: 'infantil' },
        { name: 'Pré-Adolescente', value: 'pre-adolescente' },
    ];

    const roles = [
        { name: 'Professor', value: 'professor' },
        { name: 'Secretária', value: 'secretaria' },
        { name: 'Aluno', value: 'aluno' },
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setData(name, value);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(e);
    };

    return (
        <>
            {/* Nome */}
            <div>
                <InputLabel htmlFor="name" value="Nome *" />
                <TextInput
                    id="name"
                    name="name"
                    value={data.name || ''}
                    className="mt-1 block w-full"
                    autoComplete="name"
                    onChange={handleChange}
                    required
                />
                {errors.name && <InputError message={errors.name} className="mt-2" />}
            </div>

            {/* Email */}
            <div className="mt-4">
                <InputLabel htmlFor="email" value="Email *" />
                <TextInput
                    id="email"
                    type="email"
                    name="email"
                    value={data.email || ''}
                    className="mt-1 block w-full"
                    autoComplete="username"
                    onChange={handleChange}
                    required
                />
                {errors.email && <InputError message={errors.email} className="mt-2" />}
            </div>

            {/* Data de Nascimento */}
            <div className="mt-4">
                <InputLabel htmlFor="birth_date" value="Data de Nascimento" />
                <input
                    id="birth_date"
                    name="birth_date"
                    type="date"
                    value={data.birth_date || ''}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    onChange={handleChange}
                />
                {errors.birth_date && <InputError message={errors.birth_date} className="mt-2" />}
            </div>

            {/* Tipo de usuário */}
            <div className="mt-4">
                <InputLabel htmlFor="user_role" value="Tipo de usuário *" />
                <select
                    id="user_role"
                    name="user_role"
                    value={data.user_role || ''}
                    className="mt-1 block w-full rounded-md border-gray-300 bg-white shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    onChange={handleChange}
                    required
                >
                    <option value="">Selecione...</option>
                    {roles.map(role => (
                        <option key={role.value} value={role.value}>
                            {role.name}
                        </option>
                    ))}
                </select>
                {errors.user_role && <InputError message={errors.user_role} className="mt-2" />}
            </div>

            {/* Classe */}
            <div className="mt-4">
                <InputLabel htmlFor="class_group" value="Classe" />
                <select
                    id="class_group"
                    name="class_group"
                    value={data.class_group || ''}
                    className="mt-1 block w-full rounded-md border-gray-300 bg-white shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    onChange={handleChange}
                >
                    <option value="">Selecione...</option>
                    {classes.map(cls => (
                        <option key={cls.value} value={cls.value}>
                            {cls.name}
                        </option>
                    ))}
                </select>
                {errors.class_group && <InputError message={errors.class_group} className="mt-2" />}
            </div>

            {/* Senhas */}
            {!isEditing && (
                <>
                    <div className="mt-4">
                        <InputLabel htmlFor="password" value="Senha *" />
                        <div className="mt-1 relative">
                            <TextInput
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={data.password || ''}
                                className="block w-full pr-10"
                                autoComplete="new-password"
                                onChange={handleChange}
                                required
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
                        {errors.password && <InputError message={errors.password} className="mt-2" />}
                    </div>

                    <div className="mt-4">
                        <InputLabel
                            htmlFor="password_confirmation"
                            value="Confirmar Senha *"
                        />
                        <div className="mt-1 relative">
                            <TextInput
                                id="password_confirmation"
                                type={showPasswordConfirmation ? 'text' : 'password'}
                                name="password_confirmation"
                                value={data.password_confirmation || ''}
                                className="block w-full pr-10"
                                autoComplete="new-password"
                                onChange={handleChange}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPasswordConfirmation((prev) => !prev)}
                                className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                                aria-label={showPasswordConfirmation ? 'Ocultar senha' : 'Mostrar senha'}
                            >
                                {showPasswordConfirmation ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                        {errors.password_confirmation && (
                            <InputError message={errors.password_confirmation} className="mt-2" />
                        )}
                    </div>
                </>
            )}

            {/* Botões - apenas para edição */}
            {isEditing && (
                <div className="flex items-center justify-end gap-3 mt-6">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="rounded-md bg-black px-4 py-2 text-white font-medium hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Salvando...' : 'Atualizar'}
                    </button>
                    <button
                        type="button"
                        onClick={() => window.history.back()}
                        className="rounded-md bg-gray-300 px-4 py-2 text-gray-700 font-medium hover:bg-gray-400 transition-colors"
                    >
                        Cancelar
                    </button>
                </div>
            )}
        </>
    );
}
