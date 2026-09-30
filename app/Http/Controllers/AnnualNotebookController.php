<?php

namespace App\Http\Controllers;

use App\Models\AnnualGroup;
use App\Models\ClassGroup;
use App\Models\GroupUser;
use App\Models\Notebook;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AnnualNotebookController extends Controller
{
    public function options()
    {
        $this->authorizeStaff();

        return response()->json([
            'teachers' => User::where('user_role', 'professor')->orderBy('name')->get(['id', 'name', 'class_group']),
            'students' => User::where('user_role', 'aluno')->orderBy('name')->get(['id', 'name', 'class_group']),
            'classes' => ClassGroup::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function index()
    {
        $this->authorizeStaff();

        return response()->json([
            'notebooks' => Notebook::orderByDesc('year')->orderByDesc('id')->get(['id', 'name', 'year', 'status']),
        ]);
    }

    public function store(Request $request)
    {
        $this->authorizeStaff();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'year' => ['required', 'integer', 'min:2020', 'max:2100', 'unique:notebooks,year'],
            'classes' => ['required', 'array', 'min:1'],
            'classes.*.name' => ['required', 'string', 'max:100', 'distinct'],
            'classes.*.teacher_id' => ['nullable', 'integer', Rule::exists('users', 'id')->where('user_role', 'professor')],
            'classes.*.student_ids' => ['array'],
            'classes.*.student_ids.*' => ['integer', Rule::exists('users', 'id')->where('user_role', 'aluno')],
            'classes.*.locked_student_ids' => ['array'],
            'classes.*.locked_student_ids.*' => ['integer', Rule::exists('users', 'id')->where('user_role', 'aluno')],
        ]);

        $notebook = DB::transaction(function () use ($validated) {
            $notebook = Notebook::create([
                'name' => $validated['name'],
                'year' => $validated['year'],
                'status' => 'aberta',
            ]);

            foreach ($validated['classes'] as $classData) {
                $classGroup = ClassGroup::firstOrCreate(
                    ['name' => $this->classValue($classData['name'])],
                    ['description' => null, 'offering' => null, 'visitors' => 0]
                );

                $group = AnnualGroup::create([
                    'notebook_id' => $notebook->id,
                    'class_group_id' => $classGroup->id,
                    'name' => $classData['name'],
                    'professor_id' => $classData['teacher_id'] ?? null,
                ]);

                $lockedIds = collect($classData['locked_student_ids'] ?? [])->map(fn ($id) => (int) $id);
                foreach (collect($classData['student_ids'] ?? [])->unique() as $studentId) {
                    $isLocked = $lockedIds->contains((int) $studentId);
                    GroupUser::create([
                        'group_id' => $group->id,
                        'user_id' => $studentId,
                        'enrollment_status' => $isLocked ? 'trancada' : 'ativa',
                        'enrolled_at' => now(),
                        'locked_at' => $isLocked ? now() : null,
                    ]);
                }
            }

            return $notebook->load('groups.students', 'groups.professor');
        });

        return response()->json([
            'success' => true,
            'message' => 'Caderneta criada com sucesso.',
            'notebook' => $notebook,
        ], 201);
    }

    public function show($id)
    {
        $this->authorizeStaff();

        return response()->json([
            'notebook' => Notebook::with(['groups.students', 'groups.professor'])->findOrFail($id),
        ]);
    }

    public function overview($id)
    {
        $this->authorizeStaff();
        $notebook = Notebook::with(['groups.students', 'groups.professor', 'groups.lessons.attendances'])->findOrFail($id);
        $groups = $notebook->groups->map(function ($group) {
            $active = $group->students->where('pivot.enrollment_status', 'ativa')->count();
            $locked = $group->students->where('pivot.enrollment_status', 'trancada')->count();
            $attendanceCount = $group->lessons->sum(fn ($lesson) => $lesson->attendances->count());
            $presentCount = $group->lessons->sum(fn ($lesson) => $lesson->attendances->where('status', 'presente')->count());
            return [
                'id' => $group->id,
                'name' => $group->name,
                'professor' => $group->professor?->only(['id', 'name']),
                'active_students' => $active,
                'locked_students' => $locked,
                'lessons' => $group->lessons->count(),
                'attendance_records' => $attendanceCount,
                'present_records' => $presentCount,
            ];
        });

        return response()->json([
            'notebook' => [
                'id' => $notebook->id,
                'name' => $notebook->name,
                'year' => $notebook->year,
                'status' => $notebook->status,
                'groups' => $groups,
                'totals' => [
                    'groups' => $groups->count(),
                    'active_students' => $groups->sum('active_students'),
                    'locked_students' => $groups->sum('locked_students'),
                    'lessons' => $groups->sum('lessons'),
                    'attendance_records' => $groups->sum('attendance_records'),
                    'present_records' => $groups->sum('present_records'),
                ],
            ],
        ]);
    }

    public function update(Request $request, $id)
    {
        $this->authorizeStaff();
        $notebook = Notebook::findOrFail($id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'year' => ['required', 'integer', 'min:2020', 'max:2100', Rule::unique('notebooks', 'year')->ignore($notebook->id)],
            'status' => ['required', 'in:aberta,encerrada'],
            'classes' => ['required', 'array', 'min:1'],
            'classes.*.id' => ['nullable', 'integer', Rule::exists('groups', 'id')],
            'classes.*.name' => ['required', 'string', 'max:100', 'distinct'],
            'classes.*.teacher_id' => ['nullable', 'integer', Rule::exists('users', 'id')->where('user_role', 'professor')],
            'classes.*.student_ids' => ['array'],
            'classes.*.student_ids.*' => ['integer', Rule::exists('users', 'id')->where('user_role', 'aluno')],
            'classes.*.locked_student_ids' => ['array'],
            'classes.*.locked_student_ids.*' => ['integer', Rule::exists('users', 'id')->where('user_role', 'aluno')],
        ]);

        DB::transaction(function () use ($validated, $notebook) {
            $notebook->update([
                'name' => $validated['name'],
                'year' => $validated['year'],
                'status' => $validated['status'],
            ]);

            $keptGroupIds = [];
            foreach ($validated['classes'] as $classData) {
                $classGroup = ClassGroup::firstOrCreate(
                    ['name' => $this->classValue($classData['name'])],
                    ['offering' => null, 'visitors' => 0]
                );
                $group = !empty($classData['id'])
                    ? AnnualGroup::where('notebook_id', $notebook->id)->findOrFail($classData['id'])
                    : new AnnualGroup(['notebook_id' => $notebook->id]);
                $group->fill(['class_group_id' => $classGroup->id, 'name' => $classData['name'], 'professor_id' => $classData['teacher_id'] ?? null]);
                $group->save();
                $keptGroupIds[] = $group->id;

                $lockedIds = collect($classData['locked_student_ids'] ?? [])->map(fn ($id) => (int) $id);
                $studentIds = collect($classData['student_ids'] ?? [])->unique()->map(fn ($id) => (int) $id);
                $currentMemberships = GroupUser::where('group_id', $group->id)->get()->keyBy('user_id');
                foreach ($studentIds as $studentId) {
                    $membership = $currentMemberships->get($studentId) ?? new GroupUser(['group_id' => $group->id, 'user_id' => $studentId, 'enrolled_at' => now()]);
                    $membership->enrollment_status = $lockedIds->contains($studentId) ? 'trancada' : 'ativa';
                    $membership->locked_at = $membership->enrollment_status === 'trancada' ? ($membership->locked_at ?: now()) : null;
                    $membership->reactivated_at = $membership->enrollment_status === 'ativa' && $currentMemberships->has($studentId) ? now() : $membership->reactivated_at;
                    $membership->save();
                }
                GroupUser::where('group_id', $group->id)->whereNotIn('user_id', $studentIds->all())->delete();
            }

            AnnualGroup::where('notebook_id', $notebook->id)->whereNotIn('id', $keptGroupIds)->whereDoesntHave('lessons')->delete();
        });

        return response()->json(['success' => true, 'message' => 'Caderneta atualizada com sucesso.', 'notebook' => $notebook->fresh()->load('groups.students', 'groups.professor')]);
    }

    private function authorizeStaff(): void
    {
        abort_unless(auth()->user() && in_array(auth()->user()->user_role, ['professor', 'secretaria']), 403);
    }

    private function classValue(string $name): string
    {
        return match (mb_strtolower($name)) {
            'pré-adolescente', 'pre-adolescente' => 'pre-adolescente',
            default => mb_strtolower($name),
        };
    }
}
