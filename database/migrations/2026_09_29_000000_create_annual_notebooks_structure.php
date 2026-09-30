<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notebooks', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->unsignedSmallInteger('year');
            $table->string('status')->default('aberta');
            $table->timestamps();
            $table->unique('year');
        });

        Schema::create('groups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('notebook_id')->constrained('notebooks')->cascadeOnDelete();
            $table->foreignId('class_group_id')->nullable()->constrained('class_groups')->nullOnDelete();
            $table->string('name');
            $table->foreignId('professor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->unique(['notebook_id', 'name']);
        });

        Schema::create('group_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_id')->constrained('groups')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('enrollment_status')->default('ativa');
            $table->timestamp('enrolled_at')->nullable();
            $table->timestamp('locked_at')->nullable();
            $table->timestamp('reactivated_at')->nullable();
            $table->timestamps();
            $table->unique(['group_id', 'user_id']);
            $table->index(['user_id', 'enrollment_status']);
        });

        Schema::create('lessons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_id')->constrained('groups')->cascadeOnDelete();
            $table->date('lesson_date');
            $table->decimal('offering', 8, 2)->nullable();
            $table->unsignedInteger('visitors')->default(0);
            $table->timestamps();
            $table->unique(['group_id', 'lesson_date']);
        });

        Schema::table('attendances', function (Blueprint $table) {
            $table->foreignId('lesson_id')->nullable()->after('class_group_id')->constrained('lessons')->nullOnDelete();
            $table->foreignId('group_user_id')->nullable()->after('lesson_id')->constrained('group_user')->nullOnDelete();
            $table->index(['lesson_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropForeign(['group_user_id']);
            $table->dropForeign(['lesson_id']);
            $table->dropColumn(['group_user_id', 'lesson_id']);
        });

        Schema::dropIfExists('lessons');
        Schema::dropIfExists('group_user');
        Schema::dropIfExists('groups');
        Schema::dropIfExists('notebooks');
    }
};
