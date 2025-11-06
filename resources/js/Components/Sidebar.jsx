import React from 'react';
import { Link } from '@inertiajs/react';

export default function Sidebar() {
  return (
    <div className="h-screen w-48 bg-green-600 p-4 flex flex-col gap-4">
      <h1 className="text-white font-bold text-lg mb-6">CONECTAEBD</h1>

      <button className="flex items-center gap-2 p-2 bg-white text-green-600 rounded hover:bg-green-100">
        {/* Link para Professores */}
      <Link
        href={route('register')} // URL para a página de professores
      >
        <span role="img" aria-label="Professor">👨‍🏫</span>
        PROFESSOR
        </Link>
      </button>

      <button className="flex items-center gap-2 p-2 bg-white text-green-600 rounded hover:bg-green-100">
        {/* Link para Secretarias */}
      <Link
        href={route('register')} // URL para a página da secretaria
      >
        <span role="img" aria-label="Secretaria">👩‍💼</span>
        SECRETARIA
        </Link>
      </button>

      <button className="flex items-center gap-2 p-2 bg-white text-green-600 rounded hover:bg-green-100">
        {/* Link para Alunos */}
      <Link
        href={route('register')} // URL para a página de alunos
      >
        <span role="img" aria-label="Aluno">👨‍🎓</span>
        ALUNO
        </Link>
      </button>
    </div>
  );
}
