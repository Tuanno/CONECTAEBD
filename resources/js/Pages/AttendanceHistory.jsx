import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { ChevronDown, Search, X } from 'lucide-react';

export default function AttendanceHistory() {
    const { props } = usePage();
    const user = props.auth.user;
    const isStudent = user && user.user_role === 'aluno';
    const isStaff = user && (user.user_role === 'professor' || user.user_role === 'secretaria');
    
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    const [studentName, setStudentName] = useState(isStudent ? user.name : '');
    const [selectedClass, setSelectedClass] = useState(isStudent ? user.class_group : '');
    const [periodType, setPeriodType] = useState('trimestral');
    const [year, setYear] = useState(currentYear);
    const [month, setMonth] = useState('');
    const [loading, setLoading] = useState(false);
    const [historyData, setHistoryData] = useState(null);
    const [error, setError] = useState('');
    const [periodOpen, setPeriodOpen] = useState(false);

    const classes = [
        { name: 'ADULTO', value: 'adulto' },
        { name: 'JUVENIL', value: 'juvenil' },
        { name: 'PRÉ-ADOLESCENTE', value: 'pre-adolescente' },
        { name: 'INFANTIL', value: 'infantil' },
    ];

    const months = [
        { value: '1', label: 'Janeiro' },
        { value: '2', label: 'Fevereiro' },
        { value: '3', label: 'Março' },
        { value: '4', label: 'Abril' },
        { value: '5', label: 'Maio' },
        { value: '6', label: 'Junho' },
        { value: '7', label: 'Julho' },
        { value: '8', label: 'Agosto' },
        { value: '9', label: 'Setembro' },
        { value: '10', label: 'Outubro' },
        { value: '11', label: 'Novembro' },
        { value: '12', label: 'Dezembro' },
    ];

    const handleSearch = async () => {
        const classOnlySearch = !studentName && selectedClass;

        if (!studentName && !selectedClass) {
            setError('Informe o nome do aluno ou selecione uma turma');
            return;
        }

        if (classOnlySearch && !isStaff) {
            setError('Apenas professor ou secretaria podem buscar uma turma inteira');
            return;
        }

        if (periodType === 'mensal' && !month) {
            setError('Por favor, selecione um mês');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const response = await axios.get('/api/attendance-history', {
                params: {
                    student_name: studentName,
                    class_group: selectedClass,
                    period_type: periodType,
                    year: year,
                    month: month || undefined,
                }
            });

            setHistoryData(response.data);
        } catch (err) {
            console.error('Error:', err);
            setError(err.response?.data?.message || 'Erro ao buscar histórico');
            setHistoryData(null);
        } finally {
            setLoading(false);
        }
    };

    // Buscar automaticamente se for um aluno logado
    useEffect(() => {
        if (isStudent && user.name && user.class_group) {
            handleSearch();
        }
    }, []);

    const clearSearch = () => {
        if (!isStudent) {
            setStudentName('');
            setSelectedClass('');
        }
        setPeriodType('trimestral');
        setYear(currentYear);
        setMonth('');
        setHistoryData(null);
        setError('');
    };

    // Função auxiliar para formatar o nome do trimestre
    const getTrimestreName = (startDate) => {
        const month = new Date(startDate).getMonth() + 1;
        if (month <= 3) return 'Jan - Mar';
        if (month <= 6) return 'Abr - Jun';
        if (month <= 9) return 'Jul - Set';
        return 'Out - Dez';
    };

    // Função para agrupar dados mensais em trimestres
    const groupMonthsByTrimester = (monthlyData) => {
        if (!monthlyData || monthlyData.length === 0) return [];

        const monthOrder = {
            'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
            'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
        };

        // Agrupar por trimestre
        const trimesters = {
            'Jan - Mar': [],
            'Abr - Jun': [],
            'Jul - Set': [],
            'Out - Dez': []
        };

        monthlyData.forEach(item => {
            const monthNum = monthOrder[item.month];
            if (monthNum <= 3) trimesters['Jan - Mar'].push(item);
            else if (monthNum <= 6) trimesters['Abr - Jun'].push(item);
            else if (monthNum <= 9) trimesters['Jul - Set'].push(item);
            else trimesters['Out - Dez'].push(item);
        });

        // Converter em array e calcular totais
        return Object.entries(trimesters)
            .filter(([_, items]) => items.length > 0)
            .map(([name, items]) => {
                const totalClasses = items.reduce((sum, item) => sum + item.total_classes, 0);
                const presents = items.reduce((sum, item) => sum + item.presents, 0);
                const absents = items.reduce((sum, item) => sum + item.absents, 0);
                const allObservations = items
                    .map(item => item.observations)
                    .filter(obs => obs)
                    .join('; ');

                return {
                    period: name,
                    months: items,
                    total_classes: totalClasses,
                    presents: presents,
                    absents: absents,
                    observations: allObservations || '-',
                };
            });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800">
                        Histórico de Frequência Escolar
                    </h2>
                    <a
                        href="/dashboard"
                        className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                        ← Voltar para o Dashboard
                    </a>
                </div>
            }
        >
            <Head title="Histórico de Frequência" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Formulário de Busca */}
                    <div className="bg-white shadow-lg rounded-xl p-6 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            {/* Nome do Aluno */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Nome do Aluno
                                </label>
                                <input
                                    type="text"
                                    value={studentName}
                                    onChange={(e) => setStudentName(e.target.value)}
                                    placeholder="Digite o nome..."
                                    disabled={isStudent}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                                />
                            </div>

                            {/* Turma */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Turma
                                </label>
                                <select
                                    value={selectedClass}
                                    onChange={(e) => setSelectedClass(e.target.value)}
                                    disabled={isStudent}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                                >
                                    <option value="">Todas as turmas</option>
                                    {classes.map((cls) => (
                                        <option key={cls.value} value={cls.value}>
                                            {cls.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Ano */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Ano
                                </label>
                                <select
                                    value={year}
                                    onChange={(e) => setYear(parseInt(e.target.value))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    {years.map((y) => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Período */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Período
                                </label>
                                <div className="relative">
                                    <button
                                        onClick={() => setPeriodOpen(!periodOpen)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-left flex justify-between items-center hover:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <span className="capitalize">{periodType}</span>
                                        <ChevronDown className="w-4 h-4" />
                                    </button>
                                    {periodOpen && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                                            <button
                                                onClick={() => {
                                                    setPeriodType('mensal');
                                                    setPeriodOpen(false);
                                                }}
                                                className="w-full px-4 py-2 text-left hover:bg-blue-50 first:rounded-t-lg"
                                            >
                                                Mensal
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setPeriodType('trimestral');
                                                    setPeriodOpen(false);
                                                    setMonth(''); // Limpar mês ao trocar para trimestral
                                                }}
                                                className="w-full px-4 py-2 text-left hover:bg-blue-50"
                                            >
                                                Trimestral
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setPeriodType('anual');
                                                    setPeriodOpen(false);
                                                    setMonth(''); // Limpar mês ao trocar para anual
                                                }}
                                                className="w-full px-4 py-2 text-left hover:bg-blue-50 last:rounded-b-lg"
                                            >
                                                Anual
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Mês (somente para período mensal) */}
                            {periodType === 'mensal' && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Mês
                                    </label>
                                    <select
                                        value={month}
                                        onChange={(e) => setMonth(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">Selecione o mês</option>
                                        {months.map((m) => (
                                            <option key={m.value} value={m.value}>
                                                {m.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Botões */}
                        <div className="flex gap-3">
                            <button
                                onClick={handleSearch}
                                disabled={loading}
                                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Search className="w-4 h-4" />
                                {loading ? 'Buscando...' : 'Buscar'}
                            </button>
                            <button
                                onClick={clearSearch}
                                className="flex items-center gap-2 px-6 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                <X className="w-4 h-4" />
                                Limpar
                            </button>
                        </div>

                        {/* Mensagem de Erro */}
                        {error && (
                            <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                                {error}
                            </div>
                        )}
                    </div>

                    {/* Resultados */}
                    {historyData && (
                        <div className="space-y-6">
                            {/* Quando for pesquisa por turma completa */}
                            {historyData.mode === 'class' && historyData.students && (
                                <div className="bg-white shadow-lg rounded-xl p-6">
                                    <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                                        <h3 className="text-lg font-bold text-gray-800">Turma: <span className="uppercase">{historyData.class_group}</span></h3>
                                        <p className="text-sm text-gray-600">Ano: {historyData.period.year} • Período: {historyData.period.type === 'mensal' ? 'Mensal' : historyData.period.type === 'trimestral' ? 'Trimestral' : 'Anual'}</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {historyData.students.map((studentHistory) => (
                                            <div key={studentHistory.student.id} className="border border-gray-200 rounded-lg p-4">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div>
                                                        <p className="text-sm text-gray-500 uppercase">Aluno</p>
                                                        <h4 className="text-xl font-bold text-gray-800">{studentHistory.student.name}</h4>
                                                        <p className="text-xs text-gray-500 uppercase">Turma: {studentHistory.student.class_group}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm text-gray-500">Presença</p>
                                                        <p className="text-2xl font-extrabold text-green-600">{studentHistory.summary.attendance_percentage}%</p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-3 gap-3 text-center">
                                                    <div className="bg-green-50 border border-green-100 rounded-md p-3">
                                                        <p className="text-xs text-gray-600">Presenças</p>
                                                        <p className="text-lg font-bold text-green-700">{studentHistory.summary.presents}</p>
                                                    </div>
                                                    <div className="bg-red-50 border border-red-100 rounded-md p-3">
                                                        <p className="text-xs text-gray-600">Faltas</p>
                                                        <p className="text-lg font-bold text-red-700">{studentHistory.summary.absents}</p>
                                                    </div>
                                                    <div className="bg-blue-50 border border-blue-100 rounded-md p-3">
                                                        <p className="text-xs text-gray-600">Aulas</p>
                                                        <p className="text-lg font-bold text-blue-700">{studentHistory.summary.total_classes}</p>
                                                    </div>
                                                </div>

                                                {studentHistory.period.type === 'trimestral' && studentHistory.monthly_data && studentHistory.monthly_data.length > 0 && (
                                                    <div className="mt-3">
                                                        <p className="text-xs font-semibold text-gray-600 mb-1">Resumo trimestral</p>
                                                        <div className="text-xs text-gray-700 bg-gray-50 rounded-md p-2 space-y-1">
                                                            {groupMonthsByTrimester(studentHistory.monthly_data).map((trimester, idx) => (
                                                                <div key={idx} className="flex justify-between">
                                                                    <span>{trimester.period}</span>
                                                                    <span className="font-semibold text-green-700">{trimester.presents}/{trimester.total_classes} presenças</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Resumo de Frequência para busca individual */}
                            {historyData.mode !== 'class' && (
                                <div className="bg-white shadow-lg rounded-xl p-6">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4">
                                        Resumo de Frequência
                                    </h3>
                                    <div className="mb-4">
                                        <p className="text-sm text-gray-600">
                                            Ano: {historyData.period.year} • Período: {historyData.period.type === 'mensal' ? 'Mensal' : historyData.period.type === 'trimestral' ? 'Trimestral' : 'Anual'}
                                            {historyData.student?.class_group && (
                                                <> • Turma: <span className="font-semibold uppercase">{historyData.student.class_group.replace('-', ' ')}</span></>
                                            )}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                                <span className="text-sm font-medium text-gray-600">Presenças</span>
                                            </div>
                                            <p className="text-3xl font-bold text-green-700">
                                                {historyData.summary.presents}
                                            </p>
                                        </div>

                                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                                <span className="text-sm font-medium text-gray-600">Faltas</span>
                                            </div>
                                            <p className="text-3xl font-bold text-red-700">
                                                {historyData.summary.absents}
                                            </p>
                                        </div>

                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm font-medium text-gray-600">Total de Aulas</span>
                                            </div>
                                            <p className="text-3xl font-bold text-blue-700">
                                                {historyData.summary.total_classes}
                                            </p>
                                        </div>

                                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm font-medium text-gray-600">Percentual de Presença</span>
                                            </div>
                                            <p className="text-3xl font-bold text-purple-700">
                                                {historyData.summary.attendance_percentage}%
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Histórico de Frequência (individual) */}
                            {historyData.mode !== 'class' && historyData?.period?.type === 'trimestral' && historyData?.monthly_data && historyData.monthly_data.length > 0 && (
                                <div className="bg-white shadow-lg rounded-xl p-6">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4">
                                        Histórico de Frequência
                                    </h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr className="bg-gray-50 border-b border-gray-200">
                                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Mês</th>
                                                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Aulas Totais</th>
                                                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                                            Presenças
                                                        </div>
                                                    </th>
                                                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                                            Faltas
                                                        </div>
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Observações</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {groupMonthsByTrimester(historyData.monthly_data).map((trimester, idx) => (
                                                    <React.Fragment key={idx}>
                                                        {trimester.months.map((row, rowIdx) => (
                                                            <tr key={`${idx}-${rowIdx}`} className="border-b border-gray-100 hover:bg-gray-50">
                                                                <td className="px-4 py-3 text-sm text-gray-700">{row.month}</td>
                                                                <td className="px-4 py-3 text-sm text-center font-medium">{row.total_classes}</td>
                                                                <td className="px-4 py-3 text-sm text-center text-green-600 font-semibold">{row.presents}</td>
                                                                <td className="px-4 py-3 text-sm text-center text-red-600 font-semibold">{row.absents}</td>
                                                                <td className="px-4 py-3 text-sm text-gray-600">{row.observations || '-'}</td>
                                                            </tr>
                                                        ))}
                                                        <tr className="bg-gray-100 border-b-2 border-gray-300 font-bold">
                                                            <td className="px-4 py-3 text-sm">Total {trimester.period}</td>
                                                            <td className="px-4 py-3 text-sm text-center">{trimester.total_classes}</td>
                                                            <td className="px-4 py-3 text-sm text-center text-green-700">{trimester.presents}</td>
                                                            <td className="px-4 py-3 text-sm text-center text-red-700">{trimester.absents}</td>
                                                            <td className="px-4 py-3 text-sm">{trimester.observations}</td>
                                                        </tr>
                                                    </React.Fragment>
                                                ))}
                                                <tr className="bg-blue-50 border-t-2 border-blue-300 font-bold">
                                                    <td className="px-4 py-3 text-sm">Total Geral</td>
                                                    <td className="px-4 py-3 text-sm text-center">{historyData.summary.total_classes}</td>
                                                    <td className="px-4 py-3 text-sm text-center text-green-700">{historyData.summary.presents}</td>
                                                    <td className="px-4 py-3 text-sm text-center text-red-700">{historyData.summary.absents}</td>
                                                    <td className="px-4 py-3 text-sm"></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <p className="text-sm text-blue-800">
                                            <span className="font-semibold">Legenda:</span> <span className="inline-flex items-center gap-1 ml-2"><div className="w-2 h-2 bg-green-500 rounded-full"></div> Presença</span> | <span className="inline-flex items-center gap-1 ml-2"><div className="w-2 h-2 bg-red-500 rounded-full"></div> Falta</span>
                                        </p>
                                    </div>

                                    <div className="mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-400">
                                        <p className="text-sm text-gray-700">
                                            <span className="font-semibold text-yellow-800">Atenção:</span> É importante manter a frequência regular para um bom desempenho escolar.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Mensagem quando não há histórico detalhado */}
                            {historyData.mode !== 'class' && historyData?.period?.type === 'trimestral' && (!historyData?.monthly_data || historyData.monthly_data.length === 0) && (
                                <div className="bg-white shadow-lg rounded-xl p-6">
                                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                                        <p className="text-gray-600">Nenhum registro de frequência encontrado para o período selecionado.</p>
                                    </div>
                                </div>
                            )}

                            {/* Para período anual ou mensal sem dados mensais */}
                            {historyData.mode !== 'class' && historyData?.period?.type !== 'trimestral' && (
                                <div className="bg-white shadow-lg rounded-xl p-6">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4">
                                        Histórico de Frequência
                                    </h3>
                                    {historyData?.attendances && historyData.attendances.length > 0 ? (
                                        <div className="overflow-x-auto">
                                            <table className="w-full border-collapse">
                                                <thead>
                                                    <tr className="bg-gray-50 border-b border-gray-200">
                                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Data</th>
                                                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Status</th>
                                                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Bíblia</th>
                                                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Revista</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {historyData.attendances.map((attendance) => (
                                                        <tr key={attendance.id} className="border-b border-gray-100 hover:bg-gray-50">
                                                            <td className="px-4 py-3 text-sm text-gray-700">
                                                                {new Date(attendance.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-center">
                                                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-medium ${
                                                                    attendance.status === 'presente' 
                                                                        ? 'bg-green-100 text-green-700' 
                                                                        : 'bg-red-100 text-red-700'
                                                                }`}>
                                                                    <div className={`w-2 h-2 rounded-full ${
                                                                        attendance.status === 'presente' ? 'bg-green-500' : 'bg-red-500'
                                                                    }`}></div>
                                                                    {attendance.status === 'presente' ? 'Presente' : 'Ausente'}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-center">
                                                                {attendance.bible ? '✓' : '-'}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-center">
                                                                {attendance.magazine ? '✓' : '-'}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                                            <p className="text-gray-600">Nenhum registro de frequência encontrado para o período selecionado.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
