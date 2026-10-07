<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('custom_fields', function (Blueprint $table) {
            $table->id();

            $table->string('module', 50);

            $table->string('field_key', 100);

            $table->string('field_name', 150);

            $table->string('field_type', 30);

            $table->json('options')->nullable();

            $table->boolean('is_required')->default(false);

            $table->boolean('is_active')->default(true);

            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamps();

            $table->unique(
                ['module', 'field_key'],
                'uq_custom_fields_module_key'
            );

            $table->index(
                ['module', 'is_active'],
                'idx_custom_fields_module_active'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('custom_fields');
    }
};