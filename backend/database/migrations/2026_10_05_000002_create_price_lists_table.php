<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('price_lists', function (Blueprint $table): void {
            $table->id();
            $table->string('code', 64);
            $table->string('name');
            $table->string('currency', 8)->default('VND');
            $table->boolean('is_standard')->default(false);
            $table->boolean('is_active')->default(true);
            $table->date('effective_from')->nullable();
            $table->date('effective_to')->nullable();
            $table->text('note')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique('code', 'uq_price_lists_code');
            $table->index('is_standard', 'idx_price_lists_is_standard');
        });

        Schema::create('price_list_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('price_list_id')->constrained('price_lists')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->restrictOnDelete();
            $table->decimal('unit_price', 18, 2);
            $table->decimal('min_qty', 18, 2)->default(1);
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['price_list_id', 'product_id'], 'uq_price_list_items_pair');
            $table->index('price_list_id', 'idx_price_list_items_price_list_id');
            $table->index('product_id', 'idx_price_list_items_product_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('price_list_items');
        Schema::dropIfExists('price_lists');
    }
};
