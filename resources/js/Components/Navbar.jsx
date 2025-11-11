import React from 'react';
import { Link, usePage } from '@inertiajs/react';

export default function Navbar() {
  const page = usePage();
  const { url, props } = page || {};

  // tentativa segura de obter o usuário autenticado (padrão do Inertia/Laravel)
  const user = props && props.auth ? props.auth.user : null;

  const isLoginPage = url === '/login';
  const isRegisterPage = url === '/register';

  // Define dinamicamente o destino e o texto do botão quando não autenticado
  const buttonText = isLoginPage ? 'CADASTRO' : 'LOGIN';
  const buttonLink = isLoginPage ? route('register') : route('login');

  return (
    <nav className="bg-green-500 flex justify-between items-center px-6 py-3 text-black font-semibold">
      <Link href="/">CONECTAEBD</Link>

      <div className="flex items-center gap-4">
        {user ? (
          // Usuário autenticado: mostrar nome e opção de logout
          <>
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
          // Não autenticado: mostrar botão login/cadastro (comportamento anterior)
          <Link
            href={buttonLink}
            className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition"
          >
            {buttonText}
          </Link>
        )}
      </div>
    </nav>
  );
}
