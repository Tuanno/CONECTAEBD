<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();

        foreach (['adulto', 'juvenil', 'pre-adolescente', 'infantil'] as $name) {
            DB::table('class_groups')->insertOrIgnore([
                'name' => $name,
                'offering' => null,
                'visitors' => 0,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        DB::table('class_groups')
            ->whereIn('name', ['adulto', 'juvenil', 'pre-adolescente', 'infantil'])
            ->whereNotIn('id', function ($query) {
                $query->select('class_group_id')->from('attendances')->whereNotNull('class_group_id');
            })
            ->delete();
    }
};
