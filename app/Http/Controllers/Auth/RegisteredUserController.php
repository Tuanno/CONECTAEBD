<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        if (Auth::check() && !in_array(Auth::user()->user_role, ['admin', 'professor', 'secretaria'])) {
                return redirect()->route('dashboard')
                    ->with('error', 'Você não tem permissão para cadastrar usuários.');
        }
        
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $currentUser = Auth::user();

        if ($currentUser && !in_array($currentUser->user_role, ['admin', 'professor', 'secretaria'])) {
                return redirect()->route('dashboard')
                    ->with('error', 'Você não tem permissão para cadastrar usuários.');
        }

        $isAdmin = $currentUser?->user_role === 'admin';
        $isProfessor = $currentUser?->user_role === 'professor';
        $isSecretary = $currentUser?->user_role === 'secretaria';

        if ($isProfessor && !$currentUser->class_group) {
            throw ValidationException::withMessages([
                'class_group' => 'Seu usuário não possui uma turma associada.',
            ]);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'birth_date' => ['required', 'date'],
            'user_role' => [
                'required',
                $isAdmin ? 'in:secretaria' : 'in:aluno',
            ],
            'class_group' => [
                'nullable',
                Rule::requiredIf(fn () => $request->input('user_role') === 'aluno'),
                'in:adulto,juvenil,infantil,pre-adolescente',
            ],
        ]);

        if ($isProfessor || $isSecretary || !$currentUser) {
            $validated['user_role'] = 'aluno';
        }

        if ($isProfessor) {
            $validated['class_group'] = $currentUser->class_group;
        }

        $newUser = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'birth_date' => $validated['birth_date'],
            'user_role' => $validated['user_role'],
            'class_group' => $validated['class_group'],
        ]);

        event(new Registered($newUser));

        if ($currentUser) {
            return redirect()->route('dashboard')
                ->with('success', $isAdmin
                    ? 'Secretária cadastrada com sucesso!'
                    : 'Aluno cadastrado com sucesso!');
        }

        // Se for auto-registro (não autenticado), fazer login automático
        Auth::login($newUser);

        return redirect(route('dashboard', absolute: false));
    }
}
