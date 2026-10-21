<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table(
            'opportunities',
            function (Blueprint $table) {
                $table->foreignId(
                    'source_contract_id'
                )
                    ->nullable()
                    ->after('id')
                    ->constrained('contracts')
                    ->nullOnDelete();

                $table->string(
                    'opportunity_type',
                    30
                )
                    ->default('new_business')
                    ->after('source_contract_id');

                $table->unique(
                    'source_contract_id',
                    'uq_opportunities_source_contract_id'
                );

                $table->index(
                    'opportunity_type',
                    'idx_opportunities_opportunity_type'
                );
            }
        );
    }

    public function down(): void
    {
        Schema::table(
            'opportunities',
            function (Blueprint $table) {
                $table->dropUnique(
                    'uq_opportunities_source_contract_id'
                );

                $table->dropIndex(
                    'idx_opportunities_opportunity_type'
                );

                $table->dropConstrainedForeignId(
                    'source_contract_id'
                );

                $table->dropColumn(
                    'opportunity_type'
                );
            }
        );
    }
};