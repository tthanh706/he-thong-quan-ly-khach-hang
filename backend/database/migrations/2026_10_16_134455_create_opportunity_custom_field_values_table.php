<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create(
            'opportunity_custom_field_values',
            function (Blueprint $table): void {
                $table->id();

                $table->foreignId(
                    'opportunity_id'
                )
                    ->constrained('opportunities')
                    ->cascadeOnDelete();

                $table->foreignId(
                    'custom_field_id'
                )
                    ->constrained(
                        'opportunity_custom_fields'
                    )
                    ->cascadeOnDelete();

                $table->text(
                    'field_value'
                )->nullable();

                $table->timestamps();

                $table->unique(
                    [
                        'opportunity_id',
                        'custom_field_id',
                    ],
                    'uq_opportunity_custom_field_value'
                );

                $table->index(
                    'opportunity_id',
                    'idx_opportunity_custom_values_opportunity'
                );
            }
        );
    }

    public function down(): void
    {
        Schema::dropIfExists(
            'opportunity_custom_field_values'
        );
    }
};