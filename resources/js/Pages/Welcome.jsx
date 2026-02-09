import React from 'react';
import Sidebar from '@/Components/Sidebar';

export default function Welcome() {
  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Sidebar */}
      <Sidebar />

      {/* Conteúdo principal */}
      <div className="flex-1 p-6 md:p-10 bg-green-200 flex flex-col justify-center">
          <img
            src="/imagens/logo.png"
            alt="Logo CONECTAEBD"
            className="w-auto h-56 sm:h-64 md:h-72 lg:h-80 xl:h-96 object-contain"
        />
        <h1 className="text-3xl font-bold mb-4">BEM VINDO AO CONECTAEBD WEB</h1>
        <p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-bebas mt-4 text-green-900">
          MAIS DO QUE UMA CADERNETA, UM ASSISTENTE PESSOAL.
        </p>
        <p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-bebas mt-4">
          ESCOLHA AO LADO A OPÇÃO QUE MAIS COMBINA COM VOCÊ, SERÁ NECESSÁRIO ADICIONAR SUAS CREDENCIAIS PARA ACESSO.
        </p>
      </div>
    </div>
  );
}
