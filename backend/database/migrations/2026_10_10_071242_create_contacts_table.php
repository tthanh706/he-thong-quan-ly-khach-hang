<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contacts', function (Blueprint $table) {
            $table->id();

            $table->foreignId('customer_id')
                ->constrained('customers')
                ->cascadeOnDelete();

            $table->string('full_name', 150);

            $table->string('job_title', 150)
                ->nullable();

            $table->string('email')
                ->nullable();

            $table->string('phone', 30)
                ->nullable();

            $table->string('decision_role', 50)
                ->nullable();

            $table->boolean('is_primary')
                ->default(false);

            $table->timestamps();

            $table->index(
                'customer_id',
                'idx_contacts_customer_id'
            );

            $table->index(
                'decision_role',
                'idx_contacts_decision_role'
            );

            $table->index(
                ['customer_id', 'is_primary'],
                'idx_contacts_customer_primary'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contacts');
    }
};