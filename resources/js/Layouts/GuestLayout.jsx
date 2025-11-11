import React from 'react';
import Navbar from '@/Components/Navbar';

export default function GuestLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Navbar fixa no topo */}
      <Navbar />

      {/* Conteúdo da página (login/register) */}
      <main className="flex-grow flex justify-center items-start mt-10">
        <div className="w-full max-w-md bg-white shadow-md rounded-lg p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
