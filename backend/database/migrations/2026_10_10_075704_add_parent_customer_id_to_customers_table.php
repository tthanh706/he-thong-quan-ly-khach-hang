<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->foreignId('parent_customer_id')
                ->nullable()
                ->constrained('customers')
                ->nullOnDelete();

            $table->index(
                'parent_customer_id',
                'idx_customers_parent_customer_id'
            );
        });
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropForeign([
                'parent_customer_id',
            ]);

            $table->dropIndex(
                'idx_customers_parent_customer_id'
            );

            $table->dropColumn(
                'parent_customer_id'
            );
        });
    }
};