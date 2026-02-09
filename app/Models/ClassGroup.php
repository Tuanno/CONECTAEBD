<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClassGroup extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'offering',
        'visitors',
    ];

    protected $casts = [
        'offering' => 'decimal:2',
        'visitors' => 'integer',
    ];

    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }
}
