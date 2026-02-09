<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Attendance extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'class_group_id',
        'attendance_date',
        'status',
        'bible',
        'magazine',
    ];

    protected $casts = [
        'attendance_date' => 'date',
        'bible' => 'boolean',
        'magazine' => 'boolean',
        'class_group_id' => 'integer',
    ];

    /**
     * Relacionamento com usuário
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function classGroup()
    {
        return $this->belongsTo(ClassGroup::class);
    }

    /**
     * Escopo para buscar frequência de uma data
     */
    public function scopeByDate($query, $date)
    {
        return $query->whereDate('attendance_date', $date);
    }

    /**
     * Escopo para buscar frequência de uma classe
     */
    public function scopeByClass($query, $classGroup)
    {
        if (is_numeric($classGroup)) {
            return $query->where('class_group_id', $classGroup);
        }
        return $query->whereHas('classGroup', function ($q) use ($classGroup) {
            $q->where('name', $classGroup);
        });
    }
}
