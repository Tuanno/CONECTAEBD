<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AttendanceController extends Controller
{
    /**
     * Salvar frequência de uma classe
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'class_group' => 'required|string|in:adulto,juvenil,infantil,pre-adolescente',
            'attendance_date' => 'required|date',
            'offering' => 'nullable|numeric|min:0',
            'visitors' => 'nullable|integer|min:0',
            'attendances' => 'required|array',
            'attendances.*.user_id' => 'required|integer|exists:users,id',
            'attendances.*.status' => 'required|in:presente,ausente',
            'attendances.*.bible' => 'boolean',
            'attendances.*.magazine' => 'boolean',
        ]);

        try {
            DB::beginTransaction();

            // Salvar ou atualizar cada frequência (sem oferta e visitantes)
            foreach ($validated['attendances'] as $attendance_data) {
                Attendance::updateOrCreate(
                    [
                        'user_id' => $attendance_data['user_id'],
                        'attendance_date' => $validated['attendance_date'],
                    ],
                    [
                        'class_group' => $validated['class_group'],
                        'status' => $attendance_data['status'],
                        'bible' => $attendance_data['bible'] ?? false,
                        'magazine' => $attendance_data['magazine'] ?? false,
                    ]
                );
            }

            // Salvar oferta e visitantes apenas uma vez por turma/data
            Attendance::where('attendance_date', $validated['attendance_date'])
                ->where('class_group', $validated['class_group'])
                ->update([
                    'offering' => $validated['offering'] ?? null,
                    'visitors' => $validated['visitors'] ?? 0,
                ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Frequência salva com sucesso!',
                'count' => count($validated['attendances'])
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erro ao salvar frequência: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Buscar frequência de uma data e classe
     */
    public function getByDateAndClass($classGroup, $date)
    {
        $attendances = Attendance::byClass($classGroup)
            ->byDate($date)
            ->with('user')
            ->orderBy('user_id')
            ->get();

        return response()->json([
            'attendances' => $attendances,
            'total' => $attendances->count(),
        ]);
    }

    /**
     * Deletar frequência
     */
    public function destroy($id)
    {
        $attendance = Attendance::findOrFail($id);
        $attendance->delete();

        return response()->json([
            'success' => true,
            'message' => 'Frequência removida com sucesso!'
        ]);
    }
}
