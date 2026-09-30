<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GroupUser extends Model
{
    protected $table = 'group_user';
    protected $fillable = ['group_id', 'user_id', 'enrollment_status', 'enrolled_at', 'locked_at', 'reactivated_at'];
    protected $casts = ['enrolled_at' => 'datetime', 'locked_at' => 'datetime', 'reactivated_at' => 'datetime'];

    public function group() { return $this->belongsTo(AnnualGroup::class, 'group_id'); }
    public function user() { return $this->belongsTo(User::class); }
}
