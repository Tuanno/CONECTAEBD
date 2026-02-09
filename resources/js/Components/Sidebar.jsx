import React, { useState } from 'react';
import { Link } from '@inertiajs/react';

// Modos disponíveis: 'stack' (empilhada em mobile), 'drawer' (overlay drawer mobile), 'hidden' (oculta em mobile)
const SIDEBAR_MODE = 'stack'; // altere para 'drawer' ou 'hidden' para testar

export default function Sidebar() {
  const [open, setOpen] = useState(false);

  const content = (
    <div className="h-auto md:h-screen w-full md:w-48 bg-green-600 p-4 flex flex-col gap-4">
      <img
        src="/imagens/logo.png"
        alt="Logo CONECTAEBD"
        className="w-auto h-28 md:h-40 mb-4 mx-auto md:mx-0"
      />

      <button className="flex items-center gap-2 p-2 bg-white text-green-600 rounded hover:bg-green-100 w-full justify-center md:justify-start">
        <Link href={route('login')} className="flex items-center gap-2 w-full">
          <span role="img" aria-label="Professor">👨‍🏫</span>
          <span className="ml-2">PROFESSOR</span>
        </Link>
      </button>

      <button className="flex items-center gap-2 p-2 bg-white text-green-600 rounded hover:bg-green-100 w-full justify-center md:justify-start">
        <Link href={route('login')} className="flex items-center gap-2 w-full">
          <span role="img" aria-label="Secretaria">👩‍💼</span>
          <span className="ml-2">SECRETARIA</span>
        </Link>
      </button>

      <button className="flex items-center gap-2 p-2 bg-white text-green-600 rounded hover:bg-green-100 w-full justify-center md:justify-start">
        <Link href={route('login')} className="flex items-center gap-2 w-full">
          <span role="img" aria-label="Aluno">👨‍🎓</span>
          <span className="ml-2">ALUNO</span>
        </Link>
      </button>
    </div>
  );

  // 'stack' => render normal (full width on mobile, stacked)
  if (SIDEBAR_MODE === 'stack') {
    return content;
  }

  // 'hidden' => ocultar em mobile (apenas md+)
  if (SIDEBAR_MODE === 'hidden') {
    return (
      <div className="hidden md:block">
        {content}
      </div>
    );
  }

  // 'drawer' => mostrar botão móvel para abrir drawer; em md+ exibe normalmente
  return (
    <>
      {/* Drawer button (mobile) */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 md:hidden bg-green-500 text-white p-3 rounded-full shadow-lg"
        aria-label="Abrir menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Drawer overlay */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setOpen(false)}></div>
          <div className="relative w-80 max-w-full bg-green-600 p-4">{content}</div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:block">{content}</div>
    </>
  );
}
