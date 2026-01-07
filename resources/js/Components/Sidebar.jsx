import React from 'react';
import { Link } from '@inertiajs/react';

export default function Sidebar() {
  return (
    <div className="h-screen w-48 bg-green-600 p-4 flex flex-col gap-4">
      <img
  src="/imagens/logo.png"
  alt="Logo CONECTAEBD"
  className="w-auto h-30 mb-6" // Ajuste as classes de tamanho (ex: h-10 para 40px de altura)
/>

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
