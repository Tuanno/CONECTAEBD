<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * Deletar um usuário
     */
    public function destroy($id)
    {
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
        try {
            $user = User::findOrFail($id);
            
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
        try {
            $user = User::findOrFail($id);
            
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email,' . $id,
                'birth_date' => 'nullable|date',
                'class_group' => 'nullable|string|in:adulto,juvenil,infantil,pre-adolescente',
                'user_role' => 'required|string|in:aluno,professor,secretaria,admin',
            ]);
            
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
