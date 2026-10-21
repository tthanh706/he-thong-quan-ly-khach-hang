<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table): void {
            $table->id();
            $table->string('sku', 64);
            $table->string('name');
            $table->string('type', 32);
            $table->string('unit', 32)->default('unit');
            $table->text('description')->nullable();
            $table->decimal('list_price', 18, 2)->default(0);
            $table->string('currency', 8)->default('VND');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->unique('sku', 'uq_products_sku');
            $table->index('type', 'idx_products_type');
            $table->index('is_active', 'idx_products_is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
