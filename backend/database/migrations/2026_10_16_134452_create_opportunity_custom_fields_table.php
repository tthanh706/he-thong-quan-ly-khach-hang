<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create(
            'opportunity_custom_fields',
            function (Blueprint $table): void {
                $table->id();

                $table->string(
                    'name',
                    120
                );

                $table->string(
                    'field_key',
                    100
                )->unique();

                $table->string(
                    'field_type',
                    30
                )->default('text');

                $table->boolean(
                    'is_active'
                )->default(true);

                $table->timestamps();

                $table->index(
                    'is_active',
                    'idx_opportunity_custom_fields_active'
                );
            }
        );
    }

    public function down(): void
    {
        Schema::dropIfExists(
            'opportunity_custom_fields'
        );
    }
};