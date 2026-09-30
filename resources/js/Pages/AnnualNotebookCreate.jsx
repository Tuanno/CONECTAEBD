import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, GraduationCap, Plus, Trash2, UserRound, Users } from 'lucide-react';

const steps = [
    { label: 'Dados gerais', icon: CheckCircle2 },
    { label: 'Turmas', icon: GraduationCap },
    { label: 'Alunos', icon: Users },
    { label: 'Revisao', icon: CheckCircle2 },
];

const displayClass = (value = '') => value === 'pre-adolescente'
    ? 'Pre-adolescente'
    : value.charAt(0).toUpperCase() + value.slice(1);

export default function AnnualNotebookCreate() {
    const [step, setStep] = useState(0);
    const [year, setYear] = useState(String(new Date().getFullYear()));
    const [notebookName, setNotebookName] = useState('Caderneta EBD');
    const [teachers, setTeachers] = useState([]);
    const [students, setStudents] = useState([]);
    const [classOptions, setClassOptions] = useState([]);
    const [classes, setClasses] = useState([]);
    const [activeClassId, setActiveClassId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [createdNotebook, setCreatedNotebook] = useState(null);
    const activeClass = classes.find((item) => item.id === activeClassId);

    useEffect(() => {
        axios.get('/api/annual-notebook/options')
            .then(({ data }) => {
                setTeachers(data.teachers || []);
                setStudents(data.students || []);
                setClassOptions(data.classes || []);
                const first = data.classes?.[0];
                if (first) {
                    const initial = { id: Date.now(), name: first.name, teacherId: '', students: [], lockedStudents: [] };
                    setClasses([initial]);
                    setActiveClassId(initial.id);
                }
            })
            .catch(() => setError('Nao foi possivel carregar os cadastros existentes.'))
            .finally(() => setLoading(false));
    }, []);

    const updateActiveClass = (field, value) => {
        setClasses((current) => current.map((item) => item.id === activeClassId ? { ...item, [field]: value } : item));
    };

    const addClass = () => {
        const option = classOptions.find((item) => !classes.some((current) => current.name === item.name));
        if (!option) return;
        const item = { id: Date.now(), name: option.name, teacherId: '', students: [], lockedStudents: [] };
        setClasses((current) => [...current, item]);
        setActiveClassId(item.id);
    };

    const removeClass = (id) => {
        const remaining = classes.filter((item) => item.id !== id);
        setClasses(remaining);
        if (id === activeClassId) setActiveClassId(remaining[0]?.id || null);
    };

    const toggleStudent = (studentId) => {
        if (!activeClass) return;
        const selected = activeClass.students.includes(studentId);
        updateActiveClass('students', selected
            ? activeClass.students.filter((id) => id !== studentId)
            : [...activeClass.students, studentId]);
        if (selected && activeClass.lockedStudents.includes(studentId)) {
            updateActiveClass('lockedStudents', activeClass.lockedStudents.filter((id) => id !== studentId));
        }
    };

    const toggleEnrollmentStatus = (studentId) => {
        if (!activeClass) return;
        const locked = activeClass.lockedStudents.includes(studentId);
        updateActiveClass('lockedStudents', locked
            ? activeClass.lockedStudents.filter((id) => id !== studentId)
            : [...activeClass.lockedStudents, studentId]);
    };

    const submit = async () => {
        setSaving(true);
        setError('');
        try {
            const { data } = await axios.post('/api/annual-notebooks', {
                name: notebookName,
                year: Number(year),
                classes: classes.map((item) => ({
                    name: item.name,
                    teacher_id: item.teacherId || null,
                    student_ids: item.students,
                    locked_student_ids: item.lockedStudents,
                })),
            });
            setCreatedNotebook(data.notebook);
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Nao foi possivel criar a caderneta.');
        } finally {
            setSaving(false);
        }
    };

    if (createdNotebook) {
        return (
            <AuthenticatedLayout>
                <Head title="Caderneta criada" />
                <div className="min-h-screen bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><Check className="h-8 w-8" /></div>
                        <h1 className="mt-5 text-2xl font-bold text-slate-900">Caderneta criada com sucesso</h1>
                        <p className="mt-2 text-slate-600">A caderneta <strong>{createdNotebook.name}</strong> foi criada para o ano de <strong>{createdNotebook.year}</strong>.</p>
                        <div className="mt-8 flex flex-wrap justify-center gap-3"><Link href="/dashboard" className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700">Ir para o registro de frequência</Link><Link href={`/annual-notebook/${createdNotebook.id}/edit`} className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">Editar caderneta</Link><Link href="/attendance-report" className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">Ver relatório</Link></div>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout>
            <Head title="Nova Caderneta" />
            <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-6xl">
                    <Link href="/dashboard" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700"><ArrowLeft className="h-4 w-4" />Voltar ao dashboard</Link>
                    <div className="mb-8"><p className="mb-2 text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">Organizacao anual</p><h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Nova caderneta</h1><p className="mt-2 max-w-2xl text-slate-600">Professores, alunos e turmas sao carregados dos cadastros do banco.</p></div>

                    <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:grid-cols-4">
                        {steps.map((item, index) => { const Icon = item.icon; return <button key={item.label} type="button" onClick={() => index <= step && setStep(index)} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left ${index === step ? 'bg-emerald-600 text-white' : 'text-slate-500'} ${index > step ? 'cursor-default opacity-60' : ''}`}><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20">{index < step ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}</span><span className="text-sm font-semibold">{item.label}</span></button>; })}
                    </div>

                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
                        {createdNotebook && <div className="py-10 text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><Check className="h-8 w-8" /></div><h2 className="mt-5 text-2xl font-bold text-slate-900">Caderneta criada com sucesso</h2><p className="mx-auto mt-2 max-w-lg text-slate-600">A caderneta <strong>{createdNotebook.name}</strong> foi criada para o ano de <strong>{createdNotebook.year}</strong>, com suas turmas e matrículas.</p><div className="mt-8 flex justify-center gap-3"><Link href="/dashboard" className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700">Ir para o registro de frequência</Link><Link href="/attendance-report" className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">Ver relatório</Link></div></div>}
                        {loading && <p className="py-12 text-center text-slate-500">Carregando cadastros...</p>}
                        {!createdNotebook && !loading && error && <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}

                        {!createdNotebook && !loading && step === 0 && <div className="max-w-2xl"><h2 className="text-xl font-bold text-slate-900">Dados da caderneta</h2><p className="mt-1 text-sm text-slate-500">O ano identifica este ciclo e nao pode ser duplicado.</p><div className="mt-6 grid gap-5 sm:grid-cols-2"><label className="sm:col-span-2"><span className="text-sm font-semibold text-slate-700">Nome</span><input value={notebookName} onChange={(event) => setNotebookName(event.target.value)} className="mt-2 w-full rounded-xl border-slate-300 px-4 py-3" /></label><label><span className="text-sm font-semibold text-slate-700">Ano letivo</span><input type="number" value={year} onChange={(event) => setYear(event.target.value)} className="mt-2 w-full rounded-xl border-slate-300 px-4 py-3" /></label></div></div>}

                        {!loading && step === 1 && <div><div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><h2 className="text-xl font-bold text-slate-900">Turmas e professores</h2><p className="mt-1 text-sm text-slate-500">As opcoes sao os cadastros existentes.</p></div><button type="button" onClick={addClass} disabled={classes.length >= classOptions.length} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"><Plus className="h-4 w-4" />Adicionar turma</button></div><div className="grid gap-6 lg:grid-cols-[220px_1fr]"><div className="space-y-2">{classes.map((item) => <button key={item.id} type="button" onClick={() => setActiveClassId(item.id)} className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-semibold ${item.id === activeClassId ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-slate-200 text-slate-600'}`}><span>{displayClass(item.name)}</span><span className="text-xs text-slate-400">{item.students.length}</span></button>)}</div>{activeClass && <div className="rounded-xl border border-slate-200 bg-slate-50 p-5"><div className="mb-5 flex items-center justify-between"><h3 className="font-bold text-slate-900">Configurar turma</h3><button type="button" onClick={() => removeClass(activeClass.id)} className="inline-flex items-center gap-1 text-sm font-semibold text-rose-600"><Trash2 className="h-4 w-4" />Remover</button></div><div className="grid gap-4 sm:grid-cols-2"><label><span className="text-sm font-semibold text-slate-700">Turma</span><select value={activeClass.name} onChange={(event) => updateActiveClass('name', event.target.value)} className="mt-2 w-full rounded-xl border-slate-300 bg-white px-3 py-3">{classOptions.map((option) => <option key={option.id} value={option.name}>{displayClass(option.name)}</option>)}</select></label><label><span className="text-sm font-semibold text-slate-700">Professor</span><select value={activeClass.teacherId} onChange={(event) => updateActiveClass('teacherId', event.target.value ? Number(event.target.value) : '')} className="mt-2 w-full rounded-xl border-slate-300 bg-white px-3 py-3"><option value="">Selecionar professor</option>{teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}</select></label></div></div>}</div></div>}

                        {!loading && step === 2 && <div><div className="mb-6"><h2 className="text-xl font-bold text-slate-900">Matrículas</h2><p className="mt-1 text-sm text-slate-500">O status fica salvo por aluno e por turma.</p></div><div className="mb-5 flex flex-wrap gap-2">{classes.map((item) => <button key={item.id} type="button" onClick={() => setActiveClassId(item.id)} className={`rounded-full border px-4 py-2 text-sm font-semibold ${item.id === activeClassId ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 text-slate-600'}`}>{displayClass(item.name)}</button>)}</div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{students.map((student) => { const selected = activeClass?.students.includes(student.id); const locked = activeClass?.lockedStudents.includes(student.id); return <div key={student.id} className={`rounded-xl border p-4 ${selected ? locked ? 'border-amber-300 bg-amber-50' : 'border-emerald-500 bg-emerald-50' : 'border-slate-200'}`}><button type="button" onClick={() => !selected && toggleStudent(student.id)} className="flex w-full items-center gap-3 text-left"><span className={`rounded-full p-2 ${selected ? locked ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{selected ? <Check className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}</span><span><span className="block text-sm font-bold text-slate-800">{student.name}</span><span className="text-xs text-slate-500">{displayClass(student.class_group)}</span></span></button>{selected && <button type="button" onClick={() => toggleEnrollmentStatus(student.id)} className={`mt-3 w-full rounded-lg bg-white px-3 py-2 text-xs font-bold ring-1 ${locked ? 'text-amber-700 ring-amber-300' : 'text-emerald-700 ring-emerald-300'}`}>{locked ? 'Reativar matricula' : 'Trancar matricula'}</button>}</div>; })}</div></div>}

                        {!loading && step === 3 && <div><h2 className="text-xl font-bold text-slate-900">Revisao</h2><p className="mt-1 text-sm text-slate-500">Confira antes de gravar a caderneta.</p><div className="my-6 rounded-xl bg-slate-50 p-5"><p className="text-lg font-bold text-slate-900">{notebookName} <span className="font-normal text-slate-500">({year})</span></p></div><div className="grid gap-4 md:grid-cols-2">{classes.map((item) => { const teacher = teachers.find((entry) => entry.id === item.teacherId); const activeCount = item.students.filter((id) => !item.lockedStudents.includes(id)).length; return <div key={item.id} className="rounded-xl border border-slate-200 p-5"><div className="flex items-center justify-between"><h3 className="font-bold text-slate-900">{displayClass(item.name)}</h3><span className="text-xs font-bold text-emerald-700">{activeCount} ativas</span></div><p className="mt-2 text-sm text-slate-600">Professor: {teacher?.name || 'Nao definido'}</p><div className="mt-3 flex gap-2 text-xs font-semibold"><span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">{activeCount} ativas</span><span className="rounded-full bg-amber-50 px-2 py-1 text-amber-700">{item.lockedStudents.length} trancadas</span></div></div>; })}</div></div>}

                        {!loading && <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6"><button type="button" onClick={() => setStep((current) => Math.max(current - 1, 0))} disabled={step === 0} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 disabled:invisible"><ArrowLeft className="h-4 w-4" />Anterior</button>{step < 3 ? <button type="button" onClick={() => setStep((current) => Math.min(current + 1, 3))} disabled={!classes.length} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">Continuar<ArrowRight className="h-4 w-4" /></button> : <button type="button" onClick={submit} disabled={saving || !classes.length} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"><Check className="h-4 w-4" />{saving ? 'Salvando...' : 'Criar caderneta'}</button>}</div>}
                    </section>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
