<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales_targets', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->decimal('target_value', 15, 2);

            $table->date('start_date')->nullable();

            $table->date('end_date')->nullable();

            $table->timestamps();

            $table->index(
                'user_id',
                'idx_sales_targets_user_id'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_targets');
    }
};