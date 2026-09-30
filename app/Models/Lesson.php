<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Lesson extends Model
{
    protected $fillable = ['group_id', 'lesson_date', 'offering', 'visitors'];
    protected $casts = ['lesson_date' => 'date', 'offering' => 'decimal:2', 'visitors' => 'integer'];

    public function group() { return $this->belongsTo(AnnualGroup::class, 'group_id'); }
    public function attendances() { return $this->hasMany(Attendance::class); }
}
