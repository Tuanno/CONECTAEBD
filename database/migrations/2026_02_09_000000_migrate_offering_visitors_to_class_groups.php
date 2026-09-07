<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Migracao de dados historicos: move turma/oferta/visitantes de attendances
     * para class_groups.
     *
     * So faz sentido em bancos criados antes de 2026_02_09, que ainda tem as
     * colunas legadas. Num banco novo o create_attendances_table ja nasce no
     * formato final, entao esta migration nao tem nada a fazer.
     */
    public function up(): void
    {
        if (! Schema::hasColumn('attendances', 'class_group')) {
            return;
        }

        // 1) adicionar coluna class_group_id se necessário
        Schema::table('attendances', function (Blueprint $table) {
            if (!Schema::hasColumn('attendances', 'class_group_id')) {
                $table->unsignedBigInteger('class_group_id')->nullable()->after('user_id');
            }
        });

        // 2) migrar nomes de turma existentes para table class_groups e atualizar oferta/visitantes
        $groups = DB::table('attendances')->select('class_group')->distinct()->pluck('class_group');
        foreach ($groups as $groupName) {
            if (empty($groupName)) {
                continue;
            }

            // criar ou obter class_group
            $cg = DB::table('class_groups')->where('name', $groupName)->first();
            if (!$cg) {
                $id = DB::table('class_groups')->insertGetId([
                    'name' => $groupName,
                    'offering' => null,
                    'visitors' => 0,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $cg = DB::table('class_groups')->where('id', $id)->first();
            }

            // obter última oferta/visitantes para esta turma (por data decrescente)
            $latest = DB::table('attendances')
                ->where('class_group', $groupName)
                ->where(function ($q) {
                    $q->whereNotNull('offering')->orWhere('visitors', '>', 0);
                })
                ->orderBy('attendance_date', 'desc')
                ->first();

            if ($latest) {
                DB::table('class_groups')->where('id', $cg->id)->update([
                    'offering' => $latest->offering,
                    'visitors' => $latest->visitors,
                    'updated_at' => now(),
                ]);
            }

            // atualizar attendances para referenciar class_group_id
            DB::table('attendances')
                ->where('class_group', $groupName)
                ->update(['class_group_id' => $cg->id]);
        }

        // 3) definir class_group_id como not nullable (a FK e criada em 2026_02_10)
        Schema::table('attendances', function (Blueprint $table) {
            $table->unsignedBigInteger('class_group_id')->nullable(false)->change();
        });

        // 4) remover colunas antigas
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropColumn(['class_group', 'offering', 'visitors']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Re-criar colunas antigas (sem restaurar dados históricos)
        Schema::table('attendances', function (Blueprint $table) {
            if (!Schema::hasColumn('attendances', 'class_group')) {
                $table->string('class_group')->nullable()->after('user_id');
            }
            if (!Schema::hasColumn('attendances', 'offering')) {
                $table->decimal('offering', 8, 2)->nullable()->after('magazine');
            }
            if (!Schema::hasColumn('attendances', 'visitors')) {
                $table->integer('visitors')->default(0)->after('offering');
            }
        });
    }
};
