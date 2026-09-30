import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { ArrowLeft, BookOpen, CalendarDays, CheckCircle2, Edit3, GraduationCap, LockKeyhole, Users } from 'lucide-react';

const label = (value = '') => value === 'pre-adolescente' ? 'Pre-adolescente' : value.charAt(0).toUpperCase() + value.slice(1);

function Metric({ icon: Icon, label: title, value, tone = 'emerald' }) {
    const colors = { emerald: 'bg-emerald-50 text-emerald-700', amber: 'bg-amber-50 text-amber-700', slate: 'bg-slate-100 text-slate-700', blue: 'bg-blue-50 text-blue-700' };
    return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-500">{title}</span><span className={`rounded-xl p-2 ${colors[tone]}`}><Icon className="h-5 w-5" /></span></div><p className="mt-4 text-3xl font-bold text-slate-900">{value}</p></div>;
}

export default function AnnualNotebookOverview({ id }) {
    const [notebook, setNotebook] = useState(null);
    const [notebooks, setNotebooks] = useState([]);
    const [selectedId, setSelectedId] = useState(id || '');
    const [error, setError] = useState('');

    useEffect(() => {
        axios.get('/api/annual-notebooks')
            .then(({ data }) => {
                setNotebooks(data.notebooks || []);
                const firstId = id || data.notebooks?.[0]?.id;
                setSelectedId(firstId || '');
                return firstId ? axios.get(`/api/annual-notebooks/${firstId}/overview`) : null;
            })
            .then((response) => response && setNotebook(response.data.notebook))
            .catch(() => setError('Nao foi possivel carregar a visao geral da caderneta.'));
    }, [id]);

    const changeNotebook = (value) => {
        setSelectedId(value);
        setNotebook(null);
        axios.get(`/api/annual-notebooks/${value}/overview`)
            .then(({ data }) => setNotebook(data.notebook))
            .catch(() => setError('Nao foi possivel carregar a caderneta selecionada.'));
    };

    if (error) return <AuthenticatedLayout><Head title="Visao geral" /><div className="p-8 text-center text-rose-700">{error}</div></AuthenticatedLayout>;
    if (!notebook) return <AuthenticatedLayout><Head title="Visao geral" /><div className="p-8 text-center text-slate-500">Carregando visao geral...</div></AuthenticatedLayout>;

    return <AuthenticatedLayout>
        <Head title={`Visao geral - ${notebook.name}`} />
        <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <Link href="/dashboard" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700"><ArrowLeft className="h-4 w-4" />Voltar ao dashboard</Link>
                <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-2 text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">Acompanhamento anual</p><h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">{notebook.name}</h1><p className="mt-2 text-slate-600">Ano {notebook.year} <span className="mx-2">•</span> <span className="font-semibold text-emerald-700">{notebook.status === 'aberta' ? 'Caderneta aberta' : 'Caderneta encerrada'}</span></p></div><div className="flex flex-wrap gap-2"><select value={selectedId} onChange={(event) => changeNotebook(event.target.value)} className="rounded-xl border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700">{notebooks.map((item) => <option key={item.id} value={item.id}>{item.year} - {item.name} ({item.status})</option>)}</select><Link href={`/annual-notebook/${notebook.id}/edit`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700"><Edit3 className="h-4 w-4" />Editar</Link></div></div>
                <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric icon={GraduationCap} label="Turmas" value={notebook.totals.groups} tone="slate" /><Metric icon={Users} label="Matrículas ativas" value={notebook.totals.active_students} /><Metric icon={LockKeyhole} label="Matrículas trancadas" value={notebook.totals.locked_students} tone="amber" /><Metric icon={CalendarDays} label="Aulas registradas" value={notebook.totals.lessons} tone="blue" /></div>
                <div className="mb-4 flex items-center justify-between"><div><h2 className="text-xl font-bold text-slate-900">Turmas da caderneta</h2><p className="mt-1 text-sm text-slate-500">Resumo de responsáveis, matrículas e frequência registrada.</p></div><span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-500 shadow-sm">{notebook.totals.attendance_records} registros</span></div>
                <div className="grid gap-5 md:grid-cols-2">{notebook.groups.map((group) => <article key={group.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Turma</p><h3 className="mt-1 text-xl font-bold text-slate-900">{label(group.name)}</h3><p className="mt-2 text-sm text-slate-600">Professor: <span className="font-semibold">{group.professor?.name || 'Nao definido'}</span></p></div><BookOpen className="h-6 w-6 text-emerald-600" /></div><div className="mt-6 grid grid-cols-2 gap-3"><div className="rounded-xl bg-emerald-50 p-3"><p className="text-xs font-semibold text-emerald-700">Ativas</p><p className="mt-1 text-2xl font-bold text-emerald-800">{group.active_students}</p></div><div className="rounded-xl bg-amber-50 p-3"><p className="text-xs font-semibold text-amber-700">Trancadas</p><p className="mt-1 text-2xl font-bold text-amber-800">{group.locked_students}</p></div></div><div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm text-slate-600"><span>{group.lessons} aulas</span><span className="inline-flex items-center gap-1 font-semibold text-emerald-700"><CheckCircle2 className="h-4 w-4" />{group.present_records} presenças</span></div></article>)}</div>
            </div>
        </div>
    </AuthenticatedLayout>;
}
