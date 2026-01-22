import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { useAlert } from '@/contexts/AlertContext';
import axios from 'axios';
import React from 'react';

export default function Dashboard() {
    const { props } = usePage();
    const user = props.auth.user;
    const { alert: showAlert, confirm: showConfirm } = useAlert();
    
    const [classesOpen, setClassesOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [selectedClass, setSelectedClass] = useState('');
    const [students, setStudents] = useState([]);
    const [professor, setProfessor] = useState(null);
    const [loading, setLoading] = useState(false);
    const [offeringValue, setOfferingValue] = useState('');
    const [visitorsValue, setVisitorsValue] = useState('');
    const [classToReload, setClassToReload] = useState('');
    
    // Estado para rastrear presença e materiais de cada aluno
    const [attendanceData, setAttendanceData] = useState({});
    
    // Verificar se o usuário pode cadastrar alunos (professor ou secretaria)
    const canRegisterStudents = user && (user.user_role === 'professor' || user.user_role === 'secretaria');
    const canAccessReport = canRegisterStudents;

    const classes = [
        { name: 'ADULTO', value: 'adulto' },
        { name: 'JUVENIL', value: 'juvenil' },
        { name: 'PRÉ-ADOLESCENTE', value: 'pre-adolescente' },
        { name: 'INFANTIL', value: 'infantil' },
    ];

    const menuItems = [
        ...(canAccessReport ? [{ label: 'RELATÓRIO', href: '/attendance-report' }] : []),
        { label: 'HISTÓRICO', href: '/attendance-history' },
    ];

    // Buscar alunos quando uma classe é selecionada
    useEffect(() => {
        if (selectedClass) {
            setLoading(true);
            axios.get(`/api/students/${selectedClass}`)
                .then(response => {
                    setStudents(response.data.students || []);
                    setProfessor(response.data.professor || null);
                    setLoading(false);
                })
                .catch(error => {
                    console.error('Erro ao buscar alunos:', error);
                    setStudents([]);
                    setProfessor(null);
                    setLoading(false);
                });
        } else {
            setStudents([]);
            setProfessor(null);
        }
    }, [selectedClass]);

    const handleEditStudent = (studentId) => {
        // Verificar permissão
        if (!canRegisterStudents) {
            showAlert({ message: 'Você não tem permissão para editar usuários!' });
            return;
        }
        // Usar o Link do Inertia para navegação
        window.location.href = route('edit-user', { id: studentId });
    };

    const handleDeleteStudent = async (studentId) => {
        // Verificar permissão
        if (!canRegisterStudents) {
            showAlert({ message: 'Você não tem permissão para deletar usuários!' });
            return;
        }
        const confirmed = await showConfirm({ message: 'Tem certeza que deseja deletar este usuário? Esta ação não pode ser desfeita.' });
        if (confirmed) {
            try {
                const response = await axios.delete(`/api/users/${studentId}`);
                
                if (response.data.success) {
                    showAlert({ headline: 'Feito!', message: `✓ ${response.data.message}`, title: 'SUCESSO', variant: 'info' });
                    // Recarregar a lista
                    const classToReload = selectedClass;
                    setSelectedClass('');
                    setTimeout(() => setSelectedClass(classToReload), 100);
                } else {
                    showAlert({ headline: 'Erro', message: 'Erro: ' + response.data.message, title: 'ERRO', variant: 'error' });
                }
            } catch (error) {
                console.error('Erro ao deletar:', error);
                showAlert({ headline: 'Erro', message: 'Erro ao deletar usuário: ' + (error.response?.data?.message || error.message), title: 'ERRO', variant: 'error' });
            }
        }
    };

    // Atualizar presença e inicializar materiais
    const handleAttendanceChange = (studentId, status) => {
        setAttendanceData(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                status: status,
                // Limpar materiais se for ausente
                materials: status === 'ausente' ? {} : (prev[studentId]?.materials || {})
            }
        }));
    };

    // Atualizar material (Bíblia ou Revista)
    const handleMaterialChange = (studentId, material) => {
        setAttendanceData(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                materials: {
                    ...prev[studentId]?.materials,
                    [material]: !prev[studentId]?.materials?.[material]
                }
            }
        }));
    };

    const handleClassClick = (classValue) => {
        setSelectedClass(classValue);
    };

    const handleSaveAttendance = async () => {
        if (!selectedClass || students.length === 0) {
            showAlert({ message: 'Selecione uma classe e certifique-se de que há alunos.' });
            return;
        }

        // Preparar dados para enviar
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        
        // Incluir professor se houver
        const attendances = [];
        
        if (professor && attendanceData[`professor-${professor.id}`]?.status) {
            attendances.push({
                user_id: professor.id,
                status: attendanceData[`professor-${professor.id}`].status,
                bible: attendanceData[`professor-${professor.id}`]?.materials?.biblia || false,
                magazine: attendanceData[`professor-${professor.id}`]?.materials?.revista || false,
            });
        }
        
        // Incluir alunos
        students.forEach(student => {
            attendances.push({
                user_id: student.id,
                status: attendanceData[student.id]?.status || 'ausente',
                bible: attendanceData[student.id]?.materials?.biblia || false,
                magazine: attendanceData[student.id]?.materials?.revista || false,
            });
        });

        try {
            const response = await axios.post('/api/attendances', {
                class_group: selectedClass,
                attendance_date: today,
                offering: offeringValue ? parseFloat(offeringValue) : null,
                visitors: visitorsValue ? parseInt(visitorsValue) : 0,
                attendances: attendances,
            });

            if (response.data.success) {
                showAlert({ headline: 'Feito!', message: `✓ Frequência salva com sucesso! (${response.data.count} alunos registrados)`, title: 'SUCESSO', variant: 'info' });
                // Limpar formulário
                setAttendanceData({});
                setOfferingValue('');
                setVisitorsValue('');
            }
        } catch (error) {
            console.error('Erro ao salvar:', error);
            showAlert({ headline: 'Erro', message: 'Erro ao salvar frequência: ' + (error.response?.data?.message || error.message), title: 'ERRO', variant: 'error' });
        }
    };

    return (
        <AuthenticatedLayout>

            <div className="flex flex-col md:flex-row min-h-screen bg-gray-100 relative">
                
                {/* SIDEBAR */}
                <aside className={`
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
                    md:translate-x-0 fixed md:static z-40 w-72 h-full md:min-h-screen 
                    bg-[#4ade80] p-4 flex flex-col gap-4 shadow-lg transition-transform duration-300 ease-in-out
                `}>
                    <div className="text-center font-bold text-black text-xl mb-6 uppercase tracking-widest pt-4 md:pt-0">
                        REGISTRO
                    </div>

                    <div className="flex flex-col gap-3">
                        {/* BOTÃO CLASSE */}
                        <div className="flex flex-col">
                            <button 
                                onClick={() => setClassesOpen(!classesOpen)}
                                className="flex items-center w-full bg-white rounded-xl p-4 shadow-sm active:scale-95 transition-transform"
                            >
                                <span className="font-bold text-gray-700 flex-1 text-left uppercase ml-2">Classe</span>
                                <svg className={`w-5 h-5 transition-transform ${classesOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {/* SUBMENU */}
                            {classesOpen && (
                                <div className="bg-white mx-2 mt-[-10px] pt-4 pb-2 rounded-b-xl shadow-inner border-t border-gray-100 flex flex-col overflow-hidden">
                                    {classes.map((item) => (
                                        <button
                                            key={item.name}
                                            onClick={() => handleClassClick(item.value)}
                                            className={`px-8 py-2 text-sm font-semibold text-left transition-colors uppercase ${
                                                selectedClass === item.value 
                                                    ? 'bg-green-100 text-[#4ade80]' 
                                                    : 'text-gray-600 hover:bg-green-50 hover:text-[#4ade80]'
                                            }`}
                                        >
                                            {item.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* OUTROS BOTÕES SEM CÍRCULO */}
                        {menuItems.map((item) => (
                            <Link
                                key={item.label}
                                href={item.href}
                                className="flex items-center w-full bg-white rounded-xl p-4 shadow-sm hover:bg-gray-50 active:scale-95 transition-all"
                            >
                                <span className="font-bold text-gray-700 uppercase ml-2">{item.label}</span>
                            </Link>
                        ))}
                    </div>
                </aside>

                {/* Overlay Mobile */}
                {sidebarOpen && (
                    <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setSidebarOpen(false)}></div>
                )}

                {/* CONTEÚDO PRINCIPAL - LISTA DE FREQUÊNCIA */}
                <main className="flex-1 p-6 md:p-8">
                    <div className="mb-6">
                        <button 
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="md:hidden bg-[#4ade80] text-white p-2 rounded-lg shadow-md mb-4"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">
                            REGISTRO DE FREQUÊNCIA
                        </h1>
                        
                        {selectedClass ? (
                            <div className="flex items-center justify-between gap-8">
                                <div className="flex items-center gap-8">
                                    <p className="text-gray-600">
                                        Classe: <span className="font-semibold text-[#4ade80] uppercase">
                                            {classes.find(c => c.value === selectedClass)?.name}
                                        </span>
                                    </p>
                                    {professor && (
                                        <p className="text-gray-600">
                                            Professor: <span className="font-semibold text-gray-800">
                                                {professor.name}
                                            </span>
                                        </p>
                                    )}
                                </div>
                                
                                {canRegisterStudents && (
                                    <Link
                                        href="/register"
                                        className="bg-[#4ade80] text-white px-6 py-2 rounded-lg 
                                        font-semibold hover:bg-green-500 transition-colors flex items-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        Cadastrar Aluno
                                    </Link>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-between">
                                <p className="text-gray-500 italic">
                                    Selecione uma classe no menu lateral para ver os alunos
                                </p>
                                
                                {canRegisterStudents && (
                                    <Link
                                        href="/register"
                                        className="bg-[#4ade80] text-white px-6 py-2 rounded-lg 
                                        font-semibold hover:bg-green-500 transition-colors flex items-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        Cadastrar Aluno
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>

                    {/* LISTA DE ALUNOS */}
                    {selectedClass && (
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            {loading ? (
                                <div className="flex justify-center items-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4ade80]"></div>
                                </div>
                            ) : students.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b-2 border-gray-200">
                                                <th className="text-left py-3 px-4 font-bold text-gray-700 uppercase text-sm">
                                                    Nome
                                                </th>
                                                <th className="text-center py-3 px-4 font-bold text-gray-700 uppercase text-sm">
                                                    Tipo
                                                </th>
                                                <th className="text-center py-3 px-4 font-bold text-gray-700 uppercase text-sm">
                                                    Presente
                                                </th>
                                                <th className="text-center py-3 px-4 font-bold text-gray-700 uppercase text-sm">
                                                    Ausente
                                                </th>
                                                <th className="text-center py-3 px-4 font-bold text-gray-700 uppercase text-sm">
                                                    Ações
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {/* LINHA DO PROFESSOR */}
                                            {professor && (
                                                <React.Fragment key={`professor-${professor.id}`}>
                                                    <tr className="border-b border-gray-100 bg-yellow-50 hover:bg-yellow-100 transition-colors">
                                                        <td className="py-3 px-4 font-semibold text-gray-800">
                                                            {professor.name}
                                                        </td>
                                                        <td className="py-3 px-4 text-center">
                                                            <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-yellow-200 text-yellow-800 uppercase">
                                                                Professor
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4 text-center">
                                                            <input 
                                                                type="radio" 
                                                                name={`attendance-professor`}
                                                                value="presente"
                                                                onChange={() => handleAttendanceChange(`professor-${professor.id}`, 'presente')}
                                                                className="w-5 h-5 text-green-500 focus:ring-green-500 cursor-pointer"
                                                            />
                                                        </td>
                                                        <td className="py-3 px-4 text-center">
                                                            <input 
                                                                type="radio" 
                                                                name={`attendance-professor`}
                                                                value="ausente"
                                                                onChange={() => handleAttendanceChange(`professor-${professor.id}`, 'ausente')}
                                                                className="w-5 h-5 text-red-500 focus:ring-red-500 cursor-pointer"
                                                            />
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            {canRegisterStudents && (
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <button 
                                                                        onClick={() => handleEditStudent(professor.id)}
                                                                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                                                                        title="Editar usuário"
                                                                    >
                                                                        <img 
                                                                            src="https://img.icons8.com/ios-filled/50/edit--v1.png" 
                                                                            alt="Editar"
                                                                            className="w-6 h-6"
                                                                        />
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => handleDeleteStudent(professor.id)}
                                                                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                                                                        title="Deletar usuário"
                                                                    >
                                                                        <img 
                                                                            src="https://img.icons8.com/ios-filled/50/trash--v1.png" 
                                                                            alt="Deletar"
                                                                            className="w-6 h-6"
                                                                        />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>

                                                    {/* LINHA EXPANDIDA - MATERIAIS DO PROFESSOR (aparece apenas se PRESENTE) */}
                                                    {attendanceData[`professor-${professor.id}`]?.status === 'presente' && (
                                                        <tr className="bg-yellow-50 border-b border-gray-100">
                                                            <td colSpan="5" className="py-4 px-4">
                                                                <div className="flex items-center gap-6 ml-4">
                                                                    <span className="font-semibold text-gray-700">Materiais:</span>
                                                                    
                                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                                        <input 
                                                                            type="checkbox"
                                                                            checked={attendanceData[`professor-${professor.id}`]?.materials?.biblia || false}
                                                                            onChange={() => handleMaterialChange(`professor-${professor.id}`, 'biblia')}
                                                                            className="w-4 h-4 text-[#4ade80] rounded focus:ring-[#4ade80]"
                                                                        />
                                                                        <span className="text-gray-700 font-medium">Bíblia</span>
                                                                    </label>

                                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                                        <input 
                                                                            type="checkbox"
                                                                            checked={attendanceData[`professor-${professor.id}`]?.materials?.revista || false}
                                                                            onChange={() => handleMaterialChange(`professor-${professor.id}`, 'revista')}
                                                                            className="w-4 h-4 text-[#4ade80] rounded focus:ring-[#4ade80]"
                                                                        />
                                                                        <span className="text-gray-700 font-medium">Revista</span>
                                                                    </label>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            )}

                                            {/* LINHA SEPARADORA */}
                                            {professor && students.length > 0 && (
                                                <tr className="h-1 bg-gray-200"></tr>
                                            )}

                                            {students.map((student, index) => (
                                                <React.Fragment key={student.id}>
                                                    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                                        <td className="py-3 px-4 font-semibold text-gray-800">
                                                            {student.name}
                                                        </td>
                                                        <td className="py-3 px-4 text-center">
                                                            <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 uppercase">
                                                                {student.user_role || 'aluno'}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4 text-center">
                                                            <input 
                                                                type="radio" 
                                                                name={`attendance-${student.id}`}
                                                                value="presente"
                                                                onChange={() => handleAttendanceChange(student.id, 'presente')}
                                                                className="w-5 h-5 text-green-500 focus:ring-green-500 cursor-pointer"
                                                            />
                                                        </td>
                                                        <td className="py-3 px-4 text-center">
                                                            <input 
                                                                type="radio" 
                                                                name={`attendance-${student.id}`}
                                                                value="ausente"
                                                                onChange={() => handleAttendanceChange(student.id, 'ausente')}
                                                                className="w-5 h-5 text-red-500 focus:ring-red-500 cursor-pointer"
                                                            />
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            {canRegisterStudents && (
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <button 
                                                                        onClick={() => handleEditStudent(student.id)}
                                                                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                                                                        title="Editar usuário"
                                                                    >
                                                                        <img 
                                                                            src="https://img.icons8.com/ios-filled/50/edit--v1.png" 
                                                                            alt="Editar"
                                                                            className="w-6 h-6"
                                                                        />
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => handleDeleteStudent(student.id)}
                                                                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                                                                        title="Deletar usuário"
                                                                    >
                                                                        <img 
                                                                            src="https://img.icons8.com/ios-filled/50/trash--v1.png" 
                                                                            alt="Deletar"
                                                                            className="w-6 h-6"
                                                                        />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>

                                                    {/* LINHA EXPANDIDA - MATERIAIS (aparece apenas se PRESENTE) */}
                                                    {attendanceData[student.id]?.status === 'presente' && (
                                                        <tr className="bg-green-50 border-b border-gray-100">
                                                            <td colSpan="5" className="py-4 px-4">
                                                                <div className="flex items-center gap-6 ml-4">
                                                                    <span className="font-semibold text-gray-700">Materiais:</span>
                                                                    
                                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                                        <input 
                                                                            type="checkbox"
                                                                            checked={attendanceData[student.id]?.materials?.biblia || false}
                                                                            onChange={() => handleMaterialChange(student.id, 'biblia')}
                                                                            className="w-4 h-4 text-[#4ade80] rounded focus:ring-[#4ade80]"
                                                                        />
                                                                        <span className="text-gray-700 font-medium">Bíblia</span>
                                                                    </label>

                                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                                        <input 
                                                                            type="checkbox"
                                                                            checked={attendanceData[student.id]?.materials?.revista || false}
                                                                            onChange={() => handleMaterialChange(student.id, 'revista')}
                                                                            className="w-4 h-4 text-[#4ade80] rounded focus:ring-[#4ade80]"
                                                                        />
                                                                        <span className="text-gray-700 font-medium">Revista</span>
                                                                    </label>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </tbody>
                                    </table>
                                    
                                    <div className="mt-6 flex justify-between items-center">
                                        <p className="text-sm text-gray-600">
                                            Total de registros: <span className="font-bold">{students.length + (professor ? 1 : 0)}</span>
                                        </p>
                                        {canRegisterStudents && (
                                            <button 
                                                onClick={handleSaveAttendance}
                                                className="bg-[#4ade80] text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-500 transition-colors"
                                            >
                                                Salvar Frequência
                                            </button>
                                        )}
                                    </div>

                                    {/* CAMPOS OFERTA E VISITANTES */}
                                    <div className="mt-8 pt-6 border-t border-gray-200">
                                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-8">
                                            {/* Oferta */}
                                            <div className="flex items-center gap-4">
                                                <label className="font-semibold text-gray-700 uppercase text-sm whitespace-nowrap">
                                                    Oferta:
                                                </label>
                                                <input 
                                                    type="number" 
                                                    step="0.01"
                                                    min="0"
                                                    placeholder="0,00"
                                                    value={offeringValue}
                                                    onChange={(e) => setOfferingValue(e.target.value)}
                                                    className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4ade80] focus:border-transparent"
                                                />
                                                <span className="text-gray-600 text-sm">Valor em reais</span>
                                            </div>

                                            {/* Visitantes */}
                                            <div className="flex items-center gap-4">
                                                <label className="font-semibold text-gray-700 uppercase text-sm whitespace-nowrap">
                                                    Visitantes:
                                                </label>
                                                <input 
                                                    type="number" 
                                                    min="0"
                                                    placeholder="0"
                                                    value={visitorsValue}
                                                    onChange={(e) => setVisitorsValue(e.target.value)}
                                                    className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4ade80] focus:border-transparent"
                                                />
                                                <span className="text-gray-600 text-sm">Quantidade</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    <p className="text-gray-500 text-lg">
                                        Nenhum aluno encontrado nesta classe
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </AuthenticatedLayout>
    );
}