import React from 'react';
import { Head } from '@inertiajs/react';
import Navbar from '@/Components/Navbar';

export default function AuthenticatedLayout({ header, children }) {
    return (
        <div className="min-h-screen flex flex-col bg-gray-100">
            {/* 🔹 Usa a Navbar personalizada */}
            <Navbar />

            {/* 🔹 Cabeçalho opcional (exibido em páginas como Dashboard) */}
            {header && (
                <header className="bg-white shadow">
                    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                        {header}
                    </div>
                </header>
            )}

            {/* 🔹 Conteúdo principal */}
            <main className="flex-grow container mx-auto px-4 py-8">
                {children}
            </main>

            {/* 🔹 Rodapé simples */}
            <footer className="bg-green-500 text-center py-3 text-sm text-black font-medium">
                © {new Date().getFullYear()} CONECTAEBD — Todos os direitos reservados.
            </footer>
        </div>
    );
}
