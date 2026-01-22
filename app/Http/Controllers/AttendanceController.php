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
                'message' => 'Erro ao salvar frequência: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Buscar histórico de frequência de aluno ou turma
     */
    public function getStudentHistory(Request $request)
    {
        try {
            $validated = $request->validate([
                'student_name' => 'nullable|string',
                'class_group' => 'nullable|in:adulto,juvenil,infantil,pre-adolescente',
                'period_type' => 'required|in:mensal,trimestral,anual',
                'year' => 'required|integer|min:2020|max:2100',
                'month' => 'nullable|integer|min:1|max:12',
            ]);

            $periodType = $validated['period_type'];
            $year = $validated['year'];
            $month = $validated['month'] ?? null;
            $classGroup = $validated['class_group'] ?? null;
            $studentName = $validated['student_name'] ?? null;

            $user = $request->user();
            $isStaff = $user && in_array($user->user_role, ['professor', 'secretaria']);

            if (!empty($studentName)) {
                $studentQuery = \App\Models\User::where('name', 'like', '%' . $studentName . '%');
                if (!empty($classGroup)) {
                    $studentQuery->where('class_group', $classGroup);
                }
                $student = $studentQuery->first();
                if (!$student) {
                    return response()->json(['success' => false, 'message' => 'Aluno não encontrado'], 404);
                }
                $history = $this->buildStudentHistory($student, $periodType, $year, $month);
                return response()->json(array_merge(['success' => true, 'mode' => 'student'], $history));
            }

            if (empty($studentName) && !empty($classGroup)) {
                if (!$isStaff) {
                    return response()->json(['success' => false, 'message' => 'Acesso negado para listar uma turma inteira'], 403);
                }
                $students = \App\Models\User::where('class_group', $classGroup)
                    ->where('user_role', 'aluno')
                    ->orderBy('name')
                    ->get();
                if ($students->isEmpty()) {
                    return response()->json(['success' => false, 'message' => 'Nenhum aluno encontrado para esta turma'], 404);
                }
                $histories = $students->map(function ($student) use ($periodType, $year, $month) {
                    return $this->buildStudentHistory($student, $periodType, $year, $month);
                })->values();
                return response()->json([
                    'success' => true,
                    'mode' => 'class',
                    'class_group' => $classGroup,
                    'period' => [
                        'type' => $periodType,
                        'year' => $year,
                        'month' => $month,
                    ],
                    'students' => $histories,
                ]);
            }

            return response()->json(['success' => false, 'message' => 'Por favor, informe o nome do aluno ou selecione uma turma'], 400);
        } catch (\Exception $e) {
            \Log::error('Erro ao buscar histórico: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Erro interno ao buscar histórico'], 500);
        }
    }

    /**
     * Gerar relatório de frequência
     */
    public function generateReport(Request $request)
    {
        \Log::info('generateReport chamado', $request->all());
        
        try {
            $validated = $request->validate([
                'period_type' => 'required|in:mensal,trimestral,anual',
                'year' => 'required|integer|min:2020|max:2100',
                'class_group' => 'nullable|in:adulto,juvenil,infantil,pre-adolescente',
            ]);

            $periodType = $validated['period_type'];
            $year = $validated['year'];
            $classGroup = $validated['class_group'] ?? null;
            
            \Log::info('Parametros validados', ['period' => $periodType, 'year' => $year, 'class' => $classGroup]);

            // Definir período
            $startDate = "$year-01-01";
            $endDate = "$year-12-31";

            // Query base
            $query = Attendance::whereBetween('attendance_date', [$startDate, $endDate]);

            if ($classGroup) {
                $query->where('class_group', $classGroup);
            }

            $attendances = $query->get();

            // Agrupar por data e classe para não duplicar oferta/visitantes
            $groupedAll = $attendances->groupBy(function ($att) {
                return $att->attendance_date->format('Y-m-d') . '|' . $att->class_group;
            });

            $totals = [
                'presents' => $attendances->where('status', 'presente')->count(),
                'absents' => $attendances->where('status', 'ausente')->count(),
                'with_bible' => $attendances->where('bible', true)->count(),
                'with_magazine' => $attendances->where('magazine', true)->count(),
                'total_offering' => $groupedAll->sum(function ($group) {
                    return (float) ($group->first()->offering ?? 0);
                }),
                'total_visitors' => $groupedAll->sum(function ($group) {
                    return (int) ($group->first()->visitors ?? 0);
                }),
            ];

            $periods = [];
            if ($periodType === 'trimestral') {
                $periods = [
                    ['name' => '1º Trimestre', 'start' => "$year-01-01", 'end' => "$year-03-31"],
                    ['name' => '2º Trimestre', 'start' => "$year-04-01", 'end' => "$year-06-30"],
                    ['name' => '3º Trimestre', 'start' => "$year-07-01", 'end' => "$year-09-30"],
                    ['name' => '4º Trimestre', 'start' => "$year-10-01", 'end' => "$year-12-31"],
                ];
            } elseif ($periodType === 'mensal') {
                for ($month = 1; $month <= 12; $month++) {
                    $monthStart = sprintf("%d-%02d-01", $year, $month);
                    $monthEnd = date("Y-m-t", strtotime($monthStart));
                    $monthName = date('F', strtotime($monthStart));
                    $periods[] = ['name' => $monthName, 'start' => $monthStart, 'end' => $monthEnd];
                }
            } else {
                $periods[] = ['name' => "Ano $year", 'start' => $startDate, 'end' => $endDate];
            }

            $periodData = [];

            foreach ($periods as $period) {
                $periodAttendances = $attendances->filter(function ($att) use ($period) {
                    $date = $att->attendance_date->format('Y-m-d');
                    return $date >= $period['start'] && $date <= $period['end'];
                });

                $periodGrouped = $periodAttendances->groupBy(function ($att) {
                    return $att->attendance_date->format('Y-m-d') . '|' . $att->class_group;
                });

                $periodData[] = [
                    'period_name' => $period['name'],
                    'presents' => $periodAttendances->where('status', 'presente')->count(),
                    'absents' => $periodAttendances->where('status', 'ausente')->count(),
                    'with_bible' => $periodAttendances->where('bible', true)->count(),
                    'with_magazine' => $periodAttendances->where('magazine', true)->count(),
                    'total_offering' => $periodGrouped->sum(function ($group) {
                        return (float) ($group->first()->offering ?? 0);
                    }),
                    'total_visitors' => $periodGrouped->sum(function ($group) {
                        return (int) ($group->first()->visitors ?? 0);
                    }),
                    'details' => $periodGrouped->map(function ($group) {
                        $first = $group->first();
                        return [
                            'date' => $first->attendance_date->format('Y-m-d'),
                            'class_group' => $first->class_group,
                            'presents' => $group->where('status', 'presente')->count(),
                            'absents' => $group->where('status', 'ausente')->count(),
                            'with_bible' => $group->where('bible', true)->count(),
                            'with_magazine' => $group->where('magazine', true)->count(),
                            'offering' => (float) ($first->offering ?? 0),
                            'visitors' => (int) ($first->visitors ?? 0),
                        ];
                    })->values(),
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $periodData,
                'totals' => $totals,
                'summary' => [
                    'period_type' => $periodType,
                    'year' => $year,
                    'class_group' => $classGroup,
                ],
            ]);
        } catch (\Exception $e) {
            \Log::error('Erro ao gerar relatório: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erro ao gerar relatório: ' . $e->getMessage(),
            ], 500);
        }
    }

    private function buildStudentHistory($student, string $periodType, int $year, ?int $month)
    {
        $startDate = "$year-01-01";
        $endDate = "$year-12-31";

        if ($periodType === 'mensal' && $month) {
            $startDate = sprintf("%d-%02d-01", $year, $month);
            $endDate = date("Y-m-t", strtotime($startDate));
        } else if ($periodType === 'trimestral') {
            $currentMonth = $month ?? date('n');
            if ($currentMonth <= 3) {
                $startDate = "$year-01-01";
                $endDate = "$year-03-31";
            } else if ($currentMonth <= 6) {
                $startDate = "$year-04-01";
                $endDate = "$year-06-30";
            } else if ($currentMonth <= 9) {
                $startDate = "$year-07-01";
                $endDate = "$year-09-30";
            } else {
                $startDate = "$year-10-01";
                $endDate = "$year-12-31";
            }
        }

        $attendances = Attendance::where('user_id', $student->id)
            ->whereBetween('attendance_date', [$startDate, $endDate])
            ->orderBy('attendance_date', 'desc')
            ->get();

        $yearAttendances = Attendance::where('user_id', $student->id)
            ->whereBetween('attendance_date', ["$year-01-01", "$year-12-31"])
            ->get();

        $monthlyData = [];
        if ($periodType === 'trimestral') {
            $grouped = $attendances->groupBy(function ($item) {
                return $item->attendance_date->format('Y-m');
            });
            foreach ($grouped as $yearMonth => $items) {
                $monthName = date('M', strtotime($yearMonth . '-01'));
                $totalClasses = $items->count();
                $presents = $items->where('status', 'presente')->count();
                $absents = $items->where('status', 'ausente')->count();
                $monthlyData[] = [
                    'month' => $monthName,
                    'total_classes' => $totalClasses,
                    'presents' => $presents,
                    'absents' => $absents,
                    'observations' => '',
                ];
            }
        }

        $totalClasses = $yearAttendances->count();
        $presents = $yearAttendances->where('status', 'presente')->count();
        $absents = $yearAttendances->where('status', 'ausente')->count();
        $attendancePercentage = $totalClasses > 0 ? round(($presents / $totalClasses) * 100) : 0;

        return [
            'student' => [
                'id' => $student->id,
                'name' => $student->name,
                'class_group' => $student->class_group,
            ],
            'period' => [
                'type' => $periodType,
                'year' => $year,
                'month' => $month,
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
            'summary' => [
                'total_classes' => $totalClasses,
                'presents' => $presents,
                'absents' => $absents,
                'attendance_percentage' => $attendancePercentage,
            ],
            'monthly_data' => $monthlyData,
            'attendances' => $attendances->map(function ($attendance) {
                return [
                    'id' => $attendance->id,
                    'date' => $attendance->attendance_date->format('Y-m-d'),
                    'status' => $attendance->status,
                    'bible' => $attendance->bible,
                    'magazine' => $attendance->magazine,
                ];
            }),
        ];
    }
}
