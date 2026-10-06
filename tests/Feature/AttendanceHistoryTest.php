<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AttendanceHistoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_professor_can_only_view_students_from_their_class(): void
    {
        $professor = User::factory()->create([
            'user_role' => 'professor',
            'class_group' => 'adulto',
        ]);
        $student = User::factory()->create([
            'name' => 'Aluno de Outra Turma',
            'user_role' => 'aluno',
            'class_group' => 'juvenil',
        ]);

        $response = $this->actingAs($professor)->get('/api/attendance-history', [
            'student_name' => $student->name,
            'class_group' => 'juvenil',
            'period_type' => 'anual',
            'year' => 2026,
        ]);

        $response->assertNotFound();
    }

    public function test_professor_cannot_view_history_for_non_student_accounts(): void
    {
        $professor = User::factory()->create([
            'user_role' => 'professor',
            'class_group' => 'adulto',
        ]);
        $otherProfessor = User::factory()->create([
            'name' => 'Outro Professor',
            'user_role' => 'professor',
            'class_group' => 'adulto',
        ]);

        $response = $this->actingAs($professor)->get('/api/attendance-history', [
            'student_name' => $otherProfessor->name,
            'period_type' => 'anual',
            'year' => 2026,
        ]);

        $response->assertNotFound();
    }
}