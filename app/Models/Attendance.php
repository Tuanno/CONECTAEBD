<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Attendance extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'class_group',
        'attendance_date',
        'status',
        'bible',
        'magazine',
        'offering',
        'visitors',
    ];

    protected $casts = [
        'attendance_date' => 'date',
        'bible' => 'boolean',
        'magazine' => 'boolean',
        'offering' => 'decimal:2',
        'visitors' => 'integer',
    ];

    /**
     * Relacionamento com usuário
     */
    public function user()
    {
        return $this->belongsTo(User::class);
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
        return $query->where('class_group', $classGroup);
    }
}
