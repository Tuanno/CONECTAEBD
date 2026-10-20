<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_screen_can_be_rendered(): void
    {
        $response = $this->get('/register');

        $response->assertStatus(200);
    }

    public function test_new_users_can_register(): void
    {
        $response = $this->post('/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'birth_date' => '1990-01-01',
            'user_role' => 'aluno',
            'class_group' => 'adulto',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));
    }

    public function test_only_admin_can_register_a_secretary(): void
    {
        $admin = User::factory()->create(['user_role' => 'admin']);

        $response = $this->actingAs($admin)->post('/register', [
            'name' => 'Secretária',
            'email' => 'secretaria@example.com',
            'birth_date' => '1990-01-01',
            'user_role' => 'secretaria',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $response->assertRedirect(route('dashboard', absolute: false));
        $this->assertDatabaseHas('users', [
            'email' => 'secretaria@example.com',
            'user_role' => 'secretaria',
        ]);
    }

    public function test_non_admin_cannot_register_a_secretary(): void
    {
        $user = User::factory()->create(['user_role' => 'secretaria']);

        $response = $this->actingAs($user)->post('/register', [
            'name' => 'Outra Secretária',
            'email' => 'outra@example.com',
            'birth_date' => '1990-01-01',
            'user_role' => 'secretaria',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $response->assertSessionHasErrors('user_role');
        $this->assertDatabaseMissing('users', ['email' => 'outra@example.com']);
    }

    public function test_secretary_can_register_a_professor(): void
    {
        $secretary = User::factory()->create(['user_role' => 'secretaria']);

        $response = $this->actingAs($secretary)->post('/register', [
            'name' => 'Professor',
            'email' => 'professor@example.com',
            'birth_date' => '1990-01-01',
            'user_role' => 'professor',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $response->assertRedirect(route('dashboard', absolute: false));
        $this->assertDatabaseHas('users', [
            'email' => 'professor@example.com',
            'user_role' => 'professor',
            'class_group' => null,
        ]);
    }

    public function test_secretary_can_register_a_student(): void
    {
        $secretary = User::factory()->create(['user_role' => 'secretaria']);

        $response = $this->actingAs($secretary)->post('/register', [
            'name' => 'Aluno',
            'email' => 'aluno@example.com',
            'birth_date' => '1990-01-01',
            'user_role' => 'aluno',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $response->assertRedirect(route('dashboard', absolute: false));
        $this->assertDatabaseHas('users', [
            'email' => 'aluno@example.com',
            'user_role' => 'aluno',
        ]);
    }
}
