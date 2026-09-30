<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->index('user_id', 'attendances_user_id_index');
            $table->dropUnique('attendances_user_id_attendance_date_unique');
            $table->unique(['lesson_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->index('lesson_id', 'attendances_lesson_id_index');
            $table->dropUnique('attendances_lesson_id_user_id_unique');
            $table->unique(['user_id', 'attendance_date']);
        });
    }
};
