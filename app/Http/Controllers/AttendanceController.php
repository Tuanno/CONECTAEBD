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

    /**
     * Gerar relatório de frequência com filtros
     */
    public function generateReport(Request $request)
    {
        $validated = $request->validate([
            'period_type' => 'required|in:trimestral,anual',
            'year' => 'required|integer|min:2020|max:2100',
            'class_group' => 'required|in:todas,adulto,juvenil,infantil,pre-adolescente',
        ]);

        $periodType = $validated['period_type'];
        $year = $validated['year'];
        $classGroup = $validated['class_group'];

        // Definir períodos conforme o tipo
        $periods = [];
        if ($periodType === 'trimestral') {
            $periods = [
                ['name' => 'Jan - Mar', 'start' => "$year-01-01", 'end' => "$year-03-31"],
                ['name' => 'Abr - Jun', 'start' => "$year-04-01", 'end' => "$year-06-30"],
                ['name' => 'Jul - Set', 'start' => "$year-07-01", 'end' => "$year-09-30"],
                ['name' => 'Out - Dez', 'start' => "$year-10-01", 'end' => "$year-12-31"],
            ];
        } else {
            $periods = [
                ['name' => "Ano $year", 'start' => "$year-01-01", 'end' => "$year-12-31"],
            ];
        }

        // Construir resposta com dados de cada período
        $reportData = [];
        $totals = [
            'presents' => 0,
            'absents' => 0,
            'with_bible' => 0,
            'with_magazine' => 0,
            'total_offering' => 0,
            'total_visitors' => 0,
            'dates_count' => 0,
        ];

        foreach ($periods as $period) {
            $query = Attendance::whereBetween('attendance_date', [$period['start'], $period['end']]);

            if ($classGroup !== 'todas') {
                $query->where('class_group', $classGroup);
            }

            $attendances = $query->get();

            // Calcular estatísticas do período
            $periodStats = [
                'period_name' => $period['name'],
                'presents' => $attendances->where('status', 'presente')->count(),
                'absents' => $attendances->where('status', 'ausente')->count(),
                'with_bible' => $attendances->where('bible', true)->count(),
                'with_magazine' => $attendances->where('magazine', true)->count(),
                'total_offering' => (float) $attendances->sum('offering'),
                'total_visitors' => $attendances->sum('visitors'),
                'unique_dates' => $attendances->pluck('attendance_date')->unique()->count(),
                'details' => $attendances
                    // separa por data e classe para não colapsar classes diferentes no mesmo dia
                    ->groupBy(function ($item) {
                        return $item->attendance_date->format('Y-m-d') . '|' . $item->class_group;
                    })
                    ->map(function ($group) {
                        $first = $group->first();
                        return [
                            'date' => $first->attendance_date->format('d/m/Y'),
                            'class_group' => $first->class_group,
                            'presents' => $group->where('status', 'presente')->count(),
                            'absents' => $group->where('status', 'ausente')->count(),
                            'with_bible' => $group->where('bible', true)->count(),
                            'with_magazine' => $group->where('magazine', true)->count(),
                            'offering' => (float) $group->sum('offering'),
                            'visitors' => $group->sum('visitors'),
                        ];
                    })
                    ->values(),
            ];

            $reportData[] = $periodStats;

            // Somar aos totais
            $totals['presents'] += $periodStats['presents'];
            $totals['absents'] += $periodStats['absents'];
            $totals['with_bible'] += $periodStats['with_bible'];
            $totals['with_magazine'] += $periodStats['with_magazine'];
            $totals['total_offering'] += $periodStats['total_offering'];
            $totals['total_visitors'] += $periodStats['total_visitors'];
        }

        return response()->json([
            'success' => true,
            'period_type' => $periodType,
            'year' => $year,
            'class_group' => $classGroup,
            'data' => $reportData,
            'totals' => $totals,
            'available_classes' => ['adulto', 'juvenil', 'infantil', 'pre-adolescente'],
        ]);
    }
}
