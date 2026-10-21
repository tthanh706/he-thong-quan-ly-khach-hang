<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contracts', function (Blueprint $table) {
            $table->id();

            $table->foreignId('customer_id')
                ->constrained('customers')
                ->cascadeOnDelete();

            $table->string('contract_code', 100)
                ->unique();

            $table->string('contract_name', 200);

            $table->decimal(
                'contract_value',
                15,
                2
            )->default(0);

            $table->string('status', 50)
                ->default('active');

            $table->date('signed_date')
                ->nullable();

            $table->timestamps();

            $table->index(
                'customer_id',
                'idx_contracts_customer_id'
            );

            $table->index(
                'status',
                'idx_contracts_status'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contracts');
    }
};