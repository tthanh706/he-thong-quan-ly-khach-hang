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
            function (Blueprint $table): void {
                $table->decimal(
                    'cost_price',
                    18,
                    2
                )
                    ->default(0)
                    ->after('value');
            }
        );
    }

    public function down(): void
    {
        Schema::table(
            'opportunities',
            function (Blueprint $table): void {
                $table->dropColumn(
                    'cost_price'
                );
            }
        );
    }
};