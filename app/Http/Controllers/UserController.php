<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    /**
     * Buscar as secretárias disponíveis para o administrador.
     */
    public function secretaries()
    {
        abort_unless(auth()->user()?->user_role === 'admin', 403);

        return response()->json([
            'secretaries' => User::where('user_role', 'secretaria')
                ->select('id', 'name', 'email', 'birth_date', 'user_role', 'class_group')
                ->orderBy('name')
                ->get(),
        ]);
    }

    /**
     * Deletar um usuário
     */
    public function destroy($id)
    {
        // Verificar se o usuário tem permissão
        $currentUser = auth()->user();
        if (!in_array($currentUser->user_role, ['professor', 'secretaria'])) {
            return response()->json([
                'success' => false,
                'message' => 'Você não tem permissão para deletar usuários!'
            ], 403);
        }

        try {
            $user = User::findOrFail($id);
            
            // Não permitir deletar o usuário autenticado
            if (auth()->id() == $id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Você não pode deletar sua própria conta!'
                ], 403);
            }
            
            $userName = $user->name;
            $user->delete();
            
            return response()->json([
                'success' => true,
                'message' => "Usuário {$userName} deletado com sucesso!"
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao deletar usuário: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Buscar dados de um usuário para edição
     */
    public function edit($id)
    {
        // Verificar se o usuário tem permissão
        $currentUser = auth()->user();
        $user = User::find($id);
        $canEdit = in_array($currentUser->user_role, ['professor', 'secretaria'])
            || ($currentUser->user_role === 'admin' && $user?->user_role === 'secretaria');
        if (!$canEdit) {
            return response()->json([
                'success' => false,
                'message' => 'Você não tem permissão para editar usuários!'
            ], 403);
        }

        try {
            $user = $user ?: User::findOrFail($id);
            
            return response()->json([
                'success' => true,
                'user' => $user
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Usuário não encontrado'
            ], 404);
        }
    }

    /**
     * Atualizar um usuário
     */
    public function update(Request $request, $id)
    {
        // Verificar se o usuário tem permissão
        $currentUser = auth()->user();
        $user = User::find($id);
        $canEdit = in_array($currentUser->user_role, ['professor', 'secretaria'])
            || ($currentUser->user_role === 'admin' && $user?->user_role === 'secretaria');
        if (!$canEdit) {
            return response()->json([
                'success' => false,
                'message' => 'Você não tem permissão para atualizar usuários!'
            ], 403);
        }

        try {
            $user = $user ?: User::findOrFail($id);
            
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email,' . $id,
                'birth_date' => 'nullable|date',
                'class_group' => 'nullable|string|max:100',
                // O administrador é criado fora do cadastro comum e não pode ser
                // atribuído por professores ou secretárias.
                'user_role' => 'required|string|in:aluno,professor,secretaria',
                'password' => 'nullable|string|min:8|confirmed',
            ]);

            if ($currentUser->user_role === 'admin' && $user->user_role !== 'secretaria') {
                return response()->json([
                    'success' => false,
                    'message' => 'O administrador só pode editar secretárias.'
                ], 403);
            }

            if ($currentUser->user_role === 'admin' && $validated['user_role'] !== 'secretaria') {
                return response()->json([
                    'success' => false,
                    'message' => 'O administrador não pode alterar o tipo da secretária.'
                ], 403);
            }

            if ($request->filled('password') && !in_array($currentUser->user_role, ['secretaria', 'admin'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Você não tem permissão para alterar senhas de usuários.'
                ], 403);
            }

            if (!empty($validated['password'])) {
                $validated['password'] = Hash::make($validated['password']);
            } else {
                unset($validated['password']);
            }
            unset($validated['password_confirmation']);

            $user->update($validated);
            
            return response()->json([
                'success' => true,
                'message' => 'Usuário atualizado com sucesso!',
                'user' => $user
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao atualizar usuário: ' . $e->getMessage()
            ], 500);
        }
    }
}
