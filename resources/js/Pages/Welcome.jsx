import React from 'react';
import Sidebar from '@/Components/Sidebar';

export default function Welcome() {
  return (
    <div className="flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Conteúdo principal */}
      <div className="flex-1 p-10 bg-green-200">
        <h1 className="text-2xl font-bold mb-2">BEM VINDO AO CONECTAEBD WEB</h1>
        <p className="text-sm text-green-900">
          MAIS DO QUE UMA CADERNETA, UM ASSISTENTE PESSOAL.
        </p>
        <p className="text-xs italic mt-4">
          ESCOLHA AO LADO A OPÇÃO QUE MAIS COMBINA COM VOCÊ, SERÁ NECESSÁRIO ADICIONAR SUAS CREDENCIAIS PARA ACESSO.
        </p>
      </div>
    </div>
  );
}
