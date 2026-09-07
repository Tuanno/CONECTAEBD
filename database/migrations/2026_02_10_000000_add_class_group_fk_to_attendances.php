<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A FK de attendances.class_group_id nao pode nascer junto com a tabela:
     * create_attendances_table roda em 2026_01_07 e class_groups so e criada
     * em 2026_01_08. Num banco vazio a FK precoce quebrava o migrate.
     */
    public function up(): void
    {
        $jaExiste = collect(Schema::getForeignKeys('attendances'))
            ->contains(fn ($fk) => in_array('class_group_id', $fk['columns'], true));

        if ($jaExiste) {
            return;
        }

        Schema::table('attendances', function (Blueprint $table) {
            $table->foreign('class_group_id')
                ->references('id')
                ->on('class_groups')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropForeign(['class_group_id']);
        });
    }
};
