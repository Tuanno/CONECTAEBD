<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
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
                    'description' => null,
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

        // 3) definir class_group_id como not nullable e criar FK
        Schema::table('attendances', function (Blueprint $table) {
            if (Schema::hasColumn('attendances', 'class_group_id')) {
                $table->unsignedBigInteger('class_group_id')->nullable(false)->change();
                $table->foreign('class_group_id')->references('id')->on('class_groups')->onDelete('cascade');
            }
        });

        // 4) remover colunas antigas se existirem
        Schema::table('attendances', function (Blueprint $table) {
            if (Schema::hasColumn('attendances', 'class_group')) {
                $table->dropColumn('class_group');
            }
            if (Schema::hasColumn('attendances', 'offering')) {
                $table->dropColumn('offering');
            }
            if (Schema::hasColumn('attendances', 'visitors')) {
                $table->dropColumn('visitors');
            }
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

        Schema::table('attendances', function (Blueprint $table) {
            if (Schema::hasColumn('attendances', 'class_group_id')) {
                $table->dropForeign(['class_group_id']);
                $table->dropColumn('class_group_id');
            }
        });
    }
};
