<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
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
        // Verificar se o usuário está autenticado e tem permissão para cadastrar
        if (Auth::check()) {
            $user = Auth::user();
            
            // Apenas professores e secretários podem cadastrar novos alunos
            if (!in_array($user->user_role, ['professor', 'secretaria'])) {
                return redirect()->route('dashboard')
                    ->with('error', 'Você não tem permissão para cadastrar novos alunos.');
            }
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
        // Verificar se o usuário está autenticado e tem permissão para cadastrar
        if (Auth::check()) {
            $user = Auth::user();
            
            // Apenas professores e secretários podem cadastrar novos alunos
            if (!in_array($user->user_role, ['professor', 'secretaria'])) {
                return redirect()->route('dashboard')
                    ->with('error', 'Você não tem permissão para cadastrar novos alunos.');
            }
        }
        
        $currentUser = Auth::user();
        $isProfessor = $currentUser?->user_role === 'professor';

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
            'user_role' => ['required', 'in:professor,secretaria,aluno'],
            'class_group' => ['required', 'in:adulto,juvenil,infantil,pre-adolescente'],
        ]);

        if ($isProfessor) {
            $validated['user_role'] = 'aluno';
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

        // Se quem está cadastrando é um professor/secretaria autenticado,
        // redirecionar para o dashboard ao invés de fazer login automático
        if (Auth::check()) {
            return redirect()->route('dashboard')
                ->with('success', 'Aluno cadastrado com sucesso!');
        }

        // Se for auto-registro (não autenticado), fazer login automático
        Auth::login($newUser);

        return redirect(route('dashboard', absolute: false));
    }
}
