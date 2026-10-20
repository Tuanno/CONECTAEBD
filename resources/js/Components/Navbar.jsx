import React from 'react';
import { Link, usePage } from '@inertiajs/react';

export default function Navbar() {
  const page = usePage();
  const { url, props } = page || {};

  // tentativa segura de obter o usuário autenticado (padrão do Inertia/Laravel)
  const user = props && props.auth ? props.auth.user : null;

  const isLoginPage = url === '/login';

  return (
    <nav className="bg-green-500 flex justify-between items-center px-6 py-3 text-black font-semibold">
      <Link href="/" className="flex items-center gap-2">
        <img src="/imagens/logo.png" alt="Logotipo CONECTAEBD" className="h-14 w-auto" />
        <span className="text-lg font-bold">CONECTAEBD</span>
      </Link>

      <div className="flex items-center gap-4">
        {user ? (
          // Usuário autenticado: mostrar nome e opção de logout
          <>
            <span className="sm:hidden text-sm">{user.name.split(' ')[0]}</span>
            <span className="hidden sm:inline">Olá, {user.name}</span>
            <Link
              href={route('logout')}
              method="post"
              as="button"
              className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition"
            >
              Sair
            </Link>
          </>
        ) : (
          // Na tela de login, não exibir um atalho para cadastro.
          !isLoginPage && (
            <Link
              href={route('login')}
              className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition"
            >
              LOGIN
            </Link>
          )
        )}
      </div>
    </nav>
  );
}
