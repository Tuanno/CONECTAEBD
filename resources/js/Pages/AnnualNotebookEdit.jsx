import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { ArrowLeft, Check, Save, Trash2 } from 'lucide-react';

const label = (value = '') => value === 'pre-adolescente' ? 'Pre-adolescente' : value.charAt(0).toUpperCase() + value.slice(1);

export default function AnnualNotebookEdit({ id }) {
    const [notebook, setNotebook] = useState(null);
    const [notebookId, setNotebookId] = useState(Number(id));
    const [notebooks, setNotebooks] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [students, setStudents] = useState([]);
    const [classes, setClasses] = useState([]);
    const [classOptions, setClassOptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const applyNotebook = (current) => {
        setNotebookId(current.id);
        setNotebook({ name: current.name, year: current.year, status: current.status });
        setClasses((current.groups || []).map((group) => ({
            id: group.id,
            name: group.name,
            teacherId: group.professor_id || '',
            students: (group.students || []).map((student) => student.id),
            lockedStudents: (group.students || []).filter((student) => student.pivot?.enrollment_status === 'trancada').map((student) => student.id),
        })));
    };

    useEffect(() => {
        Promise.all([
            axios.get(`/api/annual-notebooks/${id}`),
            axios.get('/api/annual-notebooks'),
            axios.get('/api/annual-notebook/options'),
        ]).then(([notebookResponse, notebooksResponse, optionsResponse]) => {
            applyNotebook(notebookResponse.data.notebook);
            setNotebooks(notebooksResponse.data.notebooks || []);
            setTeachers(optionsResponse.data.teachers || []);
            setStudents(optionsResponse.data.students || []);
            setClassOptions(optionsResponse.data.classes || []);
        }).catch(() => setError('Nao foi possivel carregar a caderneta.')).finally(() => setLoading(false));
    }, [id]);

    const changeYear = async (value) => {
        if (!value || Number(value) === notebookId) return;
        setLoading(true);
        setError('');
        setMessage('');
        try {
            const response = await axios.get(`/api/annual-notebooks/${value}`);
            applyNotebook(response.data.notebook);
        } catch {
            setError('Nao foi possivel carregar a caderneta do ano selecionado.');
        } finally {
            setLoading(false);
        }
    };

    const updateClass = (classId, field, value) => {
        setClasses((current) => current.map((item) => item.id === classId ? { ...item, [field]: value } : item));
    };

    const toggleStudent = (classId, studentId) => {
        const current = classes.find((item) => item.id === classId);
        if (!current) return;
        const selected = current.students.includes(studentId);
        updateClass(classId, 'students', selected ? current.students.filter((item) => item !== studentId) : [...current.students, studentId]);
        if (selected) updateClass(classId, 'lockedStudents', current.lockedStudents.filter((item) => item !== studentId));
    };

    const toggleStatus = (classId, studentId) => {
        const current = classes.find((item) => item.id === classId);
        const locked = current.lockedStudents.includes(studentId);
        updateClass(classId, 'lockedStudents', locked ? current.lockedStudents.filter((item) => item !== studentId) : [...current.lockedStudents, studentId]);
    };

    const addClass = () => {
        const option = classOptions.find((item) => !classes.some((current) => current.name === item.name));
        if (option) setClasses((current) => [...current, { id: `new-${Date.now()}`, name: option.name, teacherId: '', students: [], lockedStudents: [] }]);
    };

    const removeClass = (classId) => setClasses((current) => current.filter((item) => item.id !== classId));

    const save = async () => {
        setSaving(true);
        setError('');
        setMessage('');
        try {
            const response = await axios.put(`/api/annual-notebooks/${notebookId}`, {
                ...notebook,
                year: Number(notebook.year),
                classes: classes.map((item) => ({ id: typeof item.id === 'number' ? item.id : null, name: item.name, teacher_id: item.teacherId || null, student_ids: item.students, locked_student_ids: item.lockedStudents })),
            });
            setMessage(response.data.message);
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Nao foi possivel salvar as alteracoes.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <AuthenticatedLayout><Head title="Editar caderneta" /><p className="p-8 text-center text-slate-500">Carregando caderneta...</p></AuthenticatedLayout>;

    return (
        <AuthenticatedLayout>
            <Head title="Editar caderneta" />
            <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-6xl">
                    <Link href="/dashboard" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700"><ArrowLeft className="h-4 w-4" />Voltar ao dashboard</Link>
                    <div className="mb-8"><p className="mb-2 text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">Configuracao anual</p><h1 className="text-3xl font-bold text-slate-900">Editar caderneta</h1><p className="mt-2 text-slate-600">Altere a estrutura sem apagar as frequencias ja registradas.</p></div>
                    {error && <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}
                    {message && <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{message}</div>}
                    <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="grid gap-4 md:grid-cols-3"><label className="md:col-span-2"><span className="text-sm font-semibold text-slate-700">Nome da caderneta</span><input value={notebook?.name || ''} onChange={(event) => setNotebook({ ...notebook, name: event.target.value })} className="mt-2 w-full rounded-xl border-slate-300 px-4 py-3" /></label><label><span className="text-sm font-semibold text-slate-700">Ano</span><select value={notebookId} onChange={(event) => changeYear(event.target.value)} className="mt-2 w-full rounded-xl border-slate-300 bg-white px-4 py-3">{notebooks.map((item) => <option key={item.id} value={item.id}>{item.year}</option>)}</select></label><label><span className="text-sm font-semibold text-slate-700">Status</span><select value={notebook?.status || 'aberta'} onChange={(event) => setNotebook({ ...notebook, status: event.target.value })} className="mt-2 w-full rounded-xl border-slate-300 px-4 py-3"><option value="aberta">Aberta</option><option value="encerrada">Encerrada</option></select></label></div></section>
                    <section className="space-y-5">{classes.map((item) => <div key={item.id || item.name} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><h2 className="text-lg font-bold text-slate-900">Turma</h2>{item.id && <button type="button" onClick={() => removeClass(item.id)} className="inline-flex items-center gap-1 text-sm font-semibold text-rose-600"><Trash2 className="h-4 w-4" />Remover turma</button>}</div><div className="grid gap-4 md:grid-cols-2"><label><span className="text-sm font-semibold text-slate-700">Turma</span><select value={item.name} onChange={(event) => updateClass(item.id, 'name', event.target.value)} className="mt-2 w-full rounded-xl border-slate-300 px-3 py-3">{classOptions.map((option) => <option key={option.id} value={option.name}>{label(option.name)}</option>)}</select></label><label><span className="text-sm font-semibold text-slate-700">Professor</span><select value={item.teacherId} onChange={(event) => updateClass(item.id, 'teacherId', event.target.value ? Number(event.target.value) : '')} className="mt-2 w-full rounded-xl border-slate-300 px-3 py-3"><option value="">Selecionar professor</option>{teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}</select></label></div><div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{students.map((student) => { const selected = item.students.includes(student.id); const locked = item.lockedStudents.includes(student.id); return <div key={student.id} className={`rounded-xl border p-3 ${selected ? locked ? 'border-amber-300 bg-amber-50' : 'border-emerald-300 bg-emerald-50' : 'border-slate-200'}`}><button type="button" onClick={() => toggleStudent(item.id, student.id)} className="flex w-full items-center gap-2 text-left"><span className="rounded-full bg-slate-100 p-1.5">{selected ? <Check className="h-4 w-4 text-emerald-600" /> : <span className="block h-4 w-4" />}</span><span className="text-sm font-semibold text-slate-800">{student.name}</span></button>{selected && <button type="button" onClick={() => toggleStatus(item.id, student.id)} className="mt-2 w-full rounded-lg bg-white px-2 py-1.5 text-xs font-bold text-slate-700 ring-1 ring-slate-200">{locked ? 'Reativar matricula' : 'Trancar matricula'}</button>}</div>; })}</div></div>)}</section>
                    <div className="mt-6 flex flex-wrap justify-between gap-3"><button type="button" onClick={addClass} className="rounded-xl border border-emerald-600 px-5 py-3 text-sm font-bold text-emerald-700">+ Adicionar turma</button><button type="button" onClick={save} disabled={saving || !classes.length} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"><Save className="h-4 w-4" />{saving ? 'Salvando...' : 'Salvar alterações'}</button></div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
