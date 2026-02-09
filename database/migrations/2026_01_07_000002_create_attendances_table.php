<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('class_group_id')->constrained('class_groups')->onDelete('cascade');
            $table->date('attendance_date');

            // Presença
            $table->enum('status', ['presente', 'ausente']);

            // Materiais (quando presente)
            $table->boolean('bible')->default(false);        // Bíblia
            $table->boolean('magazine')->default(false);     // Revista
            $table->timestamps();
            
            // Impedir duplicatas: um aluno só tem um registro por data
            $table->unique(['user_id', 'attendance_date']);
            $table->index(['class_group_id', 'attendance_date']);
            $table->index('attendance_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendances');
    }
};
