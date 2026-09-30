<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AnnualGroup extends Model
{
    protected $table = 'groups';
    protected $fillable = ['notebook_id', 'class_group_id', 'name', 'professor_id'];

    public function notebook() { return $this->belongsTo(Notebook::class); }
    public function classGroup() { return $this->belongsTo(ClassGroup::class); }
    public function professor() { return $this->belongsTo(User::class, 'professor_id'); }
    public function students() { return $this->belongsToMany(User::class, 'group_user', 'group_id', 'user_id')->withPivot(['id', 'enrollment_status', 'enrolled_at', 'locked_at', 'reactivated_at'])->withTimestamps(); }
    public function lessons() { return $this->hasMany(Lesson::class, 'group_id'); }
}
