<?php

namespace App\Http\Controllers;

use App\Models\AnnualGroup;
use App\Models\GroupUser;
use App\Models\User;
use Illuminate\Http\Request;

class StudentController extends Controller
{
    /**
     * Buscar alunos por classe
     */
    public function getStudentsByClass(Request $request, $classGroup)
    {
        $this->authorizeClass($classGroup);

        // Validar que a classe é uma das opções válidas
        $validClasses = ['adulto', 'juvenil', 'infantil', 'pre-adolescente'];
        
        if (!in_array($classGroup, $validClasses)) {
            return response()->json([
                'error' => 'Classe inválida'
            ], 400);
        }

        $notebookId = $request->integer('notebook_id');
        $annualGroup = AnnualGroup::when($notebookId, fn ($query) => $query->where('notebook_id', $notebookId), function ($query) {
                $query->whereHas('notebook', fn ($notebookQuery) => $notebookQuery->where('status', 'aberta'));
            })
            ->whereHas('classGroup', fn ($query) => $query->where('name', $classGroup))
            ->with(['professor:id,name', 'students'])
            ->latest('id')
            ->first();

        if ($annualGroup) {
            $students = $annualGroup->students->map(function ($student) {
                $student->enrollment_status = $student->pivot->enrollment_status;
                $student->group_user_id = $student->pivot->id;
                return $student;
            });

            return response()->json([
                'students' => $students,
                'professor' => $annualGroup->professor,
                'class' => $classGroup,
                'group_id' => $annualGroup->id,
                'total' => $students->count(),
            ]);
        }

        // Compatibilidade: buscar o professor da classe antiga.
        $professor = User::where('class_group', $classGroup)
            ->where('user_role', 'professor')
            ->select('id', 'name')
            ->first();

        // Buscar apenas alunos da classe (excluindo professores e secretárias)
        $students = User::where('class_group', $classGroup)
            ->where('user_role', '!=', 'professor')
            ->where('user_role', '!=', 'secretaria')
            ->select('id', 'name', 'email', 'user_role', 'class_group', 'birth_date', 'professor_id')
            ->orderBy('name', 'asc')
            ->get();

        return response()->json([
            'students' => $students,
            'professor' => $professor,
            'class' => $classGroup,
            'total' => $students->count()
        ]);
    }

    public function updateEnrollment(Request $request, $groupUser)
    {
        abort_unless($request->user() && in_array($request->user()->user_role, ['professor', 'secretaria']), 403);

        $validated = $request->validate([
            'status' => 'required|in:ativa,trancada',
        ]);

        $membership = GroupUser::findOrFail($groupUser);
        $membership->update([
            'enrollment_status' => $validated['status'],
            'locked_at' => $validated['status'] === 'trancada' ? now() : null,
            'reactivated_at' => $validated['status'] === 'ativa' ? now() : $membership->reactivated_at,
        ]);

        return response()->json(['success' => true, 'membership' => $membership->fresh()]);
    }

    /**
     * Buscar todos os alunos agrupados por classe
     */
    public function getAllStudents()
    {
        $students = User::whereNotNull('class_group')
            ->select('id', 'name', 'email', 'user_role', 'class_group', 'birth_date')
            ->orderBy('class_group', 'asc')
            ->orderBy('name', 'asc')
            ->get()
            ->groupBy('class_group');

        return response()->json([
            'students' => $students
        ]);
    }

    private function authorizeClass(string $classGroup): void
    {
        $user = auth()->user();
        if ($user?->user_role === 'professor' && $user->class_group !== $classGroup) {
            abort(403, 'Professor nao autorizado para esta classe.');
        }
    }
}
