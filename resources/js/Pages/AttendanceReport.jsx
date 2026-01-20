import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, Link } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import React from 'react';
import html2pdf from 'html2pdf.js';
import { Users, Book } from 'lucide-react';

export default function AttendanceReport() {
    const { props } = usePage();
    const user = props.auth.user;
    const reportRef = useRef(null);

    const [periodType, setPeriodType] = useState('trimestral');
    const [year, setYear] = useState(new Date().getFullYear());
    const [classGroup, setClassGroup] = useState('todas');
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const classes = [
        { name: 'TODAS', value: 'todas' },
        { name: 'ADULTO', value: 'adulto' },
        { name: 'JUVENIL', value: 'juvenil' },
        { name: 'PRÉ-ADOLESCENTE', value: 'pre-adolescente' },
        { name: 'INFANTIL', value: 'infantil' },
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
    const reportTitle = periodType === 'trimestral'
        ? 'Relatório de Frequência Trimestral'
        : 'Relatório de Frequência Anual';

    const generateReport = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.get('/api/attendance-report', {
                params: {
                    period_type: periodType,
                    year: year,
                    class_group: classGroup,
                },
            });

            if (response.data.success) {
                setReportData(response.data);
            } else {
                setError('Erro ao gerar relatório');
            }
        } catch (err) {
            setError('Erro ao buscar dados do relatório: ' + err.message);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    const exportToPDF = () => {
        if (!reportData || !reportRef.current) return;

        const element = reportRef.current;
        const opt = {
            margin: 10,
            filename: `relatorio-frequencia-${periodType}-${year}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { orientation: 'landscape', unit: 'mm', format: 'a4' },
        };

        html2pdf().set(opt).from(element).save();
    };

    const printReport = () => {
        window.print();
    };

    return (
        <AuthenticatedLayout>
            <Head title="Relatório de Frequência" />

            <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {/* Cabeçalho */}
                    <div className="mb-8">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h1 className="text-4xl font-bold text-gray-900 mb-2">Relatório de Frequência</h1>
                                <p className="text-gray-600">Visualize e gere relatórios de frequência, ofertas e visitantes</p>
                            </div>
                            <Link
                                href="/dashboard"
                                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors print:hidden"
                            >
                                ← Voltar para o Dashboard
                            </Link>
                        </div>
                    </div>

                    {/* Filtros */}
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Período
                                </label>
                                <select
                                    value={periodType}
                                    onChange={(e) => setPeriodType(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="trimestral">Trimestral</option>
                                    <option value="anual">Anual</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Ano
                                </label>
                                <select
                                    value={year}
                                    onChange={(e) => setYear(parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                >
                                    {years.map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Classe
                                </label>
                                <select
                                    value={classGroup}
                                    onChange={(e) => setClassGroup(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                >
                                    {classes.map(cls => (
                                        <option key={cls.value} value={cls.value}>{cls.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-end">
                                <button
                                    onClick={generateReport}
                                    disabled={loading}
                                    className="w-full px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                                >
                                    {loading ? 'Gerando...' : 'Gerar Relatório'}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                                {error}
                            </div>
                        )}
                    </div>

                    {/* Relatório */}
                    {reportData && (
                        <>
                            <div ref={reportRef}>
                                <div className="mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900">{reportTitle}</h2>
                                    <p className="text-gray-600">Ano: {year} • Classe: {classGroup === 'todas' ? 'Todas' : classGroup.toUpperCase()}</p>
                                </div>
                            {/* Cards de Estatísticas */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6 print:grid-cols-6">
                                <div className="bg-white rounded-lg shadow-md p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-gray-500 text-sm font-medium">Presentes</p>
                                            <p className="text-2xl font-bold text-green-600 mt-2">
                                                {reportData.totals.presents}
                                            </p>
                                        </div>
                                        <Users className="h-8 w-8 text-green-600" />
                                    </div>
                                </div>

                                <div className="bg-white rounded-lg shadow-md p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-gray-500 text-sm font-medium">Ausentes</p>
                                            <p className="text-2xl font-bold text-red-600 mt-2">
                                                {reportData.totals.absents}
                                            </p>
                                        </div>
                                        <Users className="h-8 w-8 text-red-600" />
                                    </div>
                                </div>

                                <div className="bg-white rounded-lg shadow-md p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-gray-500 text-sm font-medium">Com Bíblia</p>
                                            <p className="text-2xl font-bold text-blue-600 mt-2">
                                                {reportData.totals.with_bible}
                                            </p>
                                        </div>
                                        <Book className="h-8 w-8 text-gray-900" />
                                    </div>
                                </div>

                                <div className="bg-white rounded-lg shadow-md p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-gray-500 text-sm font-medium">Com Revista</p>
                                            <p className="text-2xl font-bold text-gray-600 mt-2">
                                                {reportData.totals.with_magazine}
                                            </p>
                                        </div>
                                        <div className="text-3xl">📰</div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-lg shadow-md p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-gray-500 text-sm font-medium">Ofertas</p>
                                            <p className="text-2xl font-bold text-yellow-500 mt-2">
                                                {formatCurrency(reportData.totals.total_offering)}
                                            </p>
                                        </div>
                                        <div className="text-3xl">💰</div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-lg shadow-md p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-gray-500 text-sm font-medium">Visitantes</p>
                                            <p className="text-2xl font-bold text-orange-600 mt-2">
                                                {reportData.totals.total_visitors}
                                            </p>
                                        </div>
                                        <Users className="h-8 w-8 text-yellow-500" />
                                    </div>
                                </div>
                            </div>

                            {/* Tabela Principal */}
                            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-100 border-b-2 border-gray-300">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                                                    Período
                                                </th>
                                                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                                                    Presentes
                                                </th>
                                                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                                                    Ausentes
                                                </th>
                                                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                                                    Com Bíblia
                                                </th>
                                                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                                                    Com Revista
                                                </th>
                                                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                                                    Ofertas
                                                </th>
                                                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                                                    Visitantes
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reportData.data.map((period, idx) => (
                                                <tr
                                                    key={idx}
                                                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                                                >
                                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                        {period.period_name}
                                                    </td>
                                                    <td className="px-6 py-4 text-center text-sm text-green-600 font-semibold">
                                                        {period.presents}
                                                    </td>
                                                    <td className="px-6 py-4 text-center text-sm text-red-600 font-semibold">
                                                        {period.absents}
                                                    </td>
                                                    <td className="px-6 py-4 text-center text-sm text-blue-600 font-semibold">
                                                        {period.with_bible}
                                                    </td>
                                                    <td className="px-6 py-4 text-center text-sm text-gray-600 font-semibold">
                                                        {period.with_magazine}
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-sm text-yellow-500 font-semibold">
                                                        {formatCurrency(period.total_offering)}
                                                    </td>
                                                    <td className="px-6 py-4 text-center text-sm text-orange-600 font-semibold">
                                                        {period.total_visitors}
                                                    </td>
                                                </tr>
                                            ))}
                                            <tr className="bg-gray-100 border-t-2 border-gray-300 font-bold">
                                                <td className="px-6 py-4 text-sm text-gray-900">
                                                    Total Geral
                                                </td>
                                                <td className="px-6 py-4 text-center text-sm text-green-600">
                                                    {reportData.totals.presents}
                                                </td>
                                                <td className="px-6 py-4 text-center text-sm text-red-600">
                                                    {reportData.totals.absents}
                                                </td>
                                                <td className="px-6 py-4 text-center text-sm text-blue-600">
                                                    {reportData.totals.with_bible}
                                                </td>
                                                <td className="px-6 py-4 text-center text-sm text-gray-600">
                                                    {reportData.totals.with_magazine}
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm text-yellow-500">
                                                    {formatCurrency(reportData.totals.total_offering)}
                                                </td>
                                                <td className="px-6 py-4 text-center text-sm text-orange-600">
                                                    {reportData.totals.total_visitors}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            </div>

                            {/* Tabela de Detalhes (fora do PDF) */}
                            <div className="bg-white rounded-lg shadow-md overflow-hidden mt-6 print:hidden">
                                <div className="bg-gray-100 px-6 py-4 border-b border-gray-300">
                                    <h2 className="text-lg font-semibold text-gray-900">Detalhes por Data</h2>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-100 border-b border-gray-300">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                                                    Período
                                                </th>
                                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                                                    Data
                                                </th>
                                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                                                    Classe
                                                </th>
                                                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                                                    Presentes
                                                </th>
                                                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                                                    Ausentes
                                                </th>
                                                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                                                    Bíblia
                                                </th>
                                                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                                                    Revista
                                                </th>
                                                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                                                    Ofertas
                                                </th>
                                                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                                                    Visitantes
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reportData.data.map((period, periodIdx) =>
                                                period.details.map((detail, detailIdx) => (
                                                    <tr
                                                        key={`${periodIdx}-${detailIdx}`}
                                                        className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                                                    >
                                                        <td className="px-6 py-4 text-sm text-gray-600">
                                                            {periodIdx === 0 || period.period_name ? period.period_name : ''}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                            {detail.date}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-600 uppercase">
                                                            {detail.class_group}
                                                        </td>
                                                        <td className="px-6 py-4 text-center text-sm text-green-600">
                                                            {detail.presents}
                                                        </td>
                                                        <td className="px-6 py-4 text-center text-sm text-red-600">
                                                            {detail.absents}
                                                        </td>
                                                        <td className="px-6 py-4 text-center text-sm text-blue-600">
                                                            {detail.with_bible}
                                                        </td>
                                                        <td className="px-6 py-4 text-center text-sm text-gray-600">
                                                            {detail.with_magazine}
                                                        </td>
                                                        <td className="px-6 py-4 text-right text-sm text-yellow-500">
                                                            {formatCurrency(detail.offering)}
                                                        </td>
                                                        <td className="px-6 py-4 text-center text-sm text-orange-600">
                                                            {detail.visitors}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Botões de Ação (fora do PDF) */}
                            <div className="mt-6 flex gap-4 print:hidden">
                                <button
                                    onClick={exportToPDF}
                                    className="px-6 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
                                >
                                    📄 Exportar para PDF
                                </button>
                                <button
                                    onClick={printReport}
                                    className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                                >
                                    🖨️ Imprimir Relatório
                                </button>
                            </div>
                        </>
                    )}

                    {/* Estado vazio */}
                    {!reportData && !loading && (
                        <div className="bg-white rounded-lg shadow-md p-12 text-center">
                            <div className="text-4xl mb-4">📊</div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                Nenhum relatório gerado
                            </h3>
                            <p className="text-gray-600">
                                Selecione os filtros acima e clique em "Gerar Relatório" para visualizar os dados
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Estilos para impressão */}
            <style>{`
                @media print {
                    body {
                        background-color: white;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                    .print\\:grid-cols-6 {
                        display: grid;
                        grid-template-columns: repeat(6, minmax(0, 1fr));
                    }
                    table {
                        page-break-inside: avoid;
                    }
                    tr {
                        page-break-inside: avoid;
                    }
                }
            `}</style>
        </AuthenticatedLayout>
    );
}
