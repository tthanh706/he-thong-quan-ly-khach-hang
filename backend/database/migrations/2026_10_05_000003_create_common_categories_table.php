<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('common_categories', function (Blueprint $table): void {
            $table->id();
            $table->string('category_type', 32);
            $table->string('code', 64);
            $table->string('name');
            $table->text('description')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['category_type', 'code'], 'uq_common_categories_type_code');
            $table->index('category_type', 'idx_common_categories_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('common_categories');
    }
};
