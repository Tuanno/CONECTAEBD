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
        Schema::table('users', function (Blueprint $table) {
            // Adicionar índice em class_group para queries mais rápidas
            $table->index('class_group');
            
            // Adicionar índice em user_role também
            $table->index('user_role');
            
            // Índice composto para buscas por class_group e user_role
            $table->index(['class_group', 'user_role']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['class_group']);
            $table->dropIndex(['user_role']);
            $table->dropIndex(['class_group', 'user_role']);
        });
    }
};
