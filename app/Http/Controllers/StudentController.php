<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class StudentController extends Controller
{
    /**
     * Buscar alunos por classe
     */
    public function getStudentsByClass($classGroup)
    {
        // Validar que a classe é uma das opções válidas
        $validClasses = ['adulto', 'juvenil', 'infantil', 'pre-adolescente'];
        
        if (!in_array($classGroup, $validClasses)) {
            return response()->json([
                'error' => 'Classe inválida'
            ], 400);
        }

        // Buscar o professor da classe (qualquer usuário professor dessa classe)
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
}
