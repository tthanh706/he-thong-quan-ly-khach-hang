<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create(
            'contact_customer_histories',
            function (Blueprint $table) {
                $table->id();

                $table->foreignId('contact_id')
                    ->constrained('contacts')
                    ->cascadeOnDelete();

                $table->foreignId('old_customer_id')
                    ->nullable()
                    ->constrained('customers')
                    ->nullOnDelete();

                $table->foreignId('new_customer_id')
                    ->nullable()
                    ->constrained('customers')
                    ->nullOnDelete();

                $table->foreignId('changed_by')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();

                $table->timestamp('changed_at');

                $table->timestamps();

                $table->index(
                    'contact_id',
                    'idx_contact_histories_contact_id'
                );

                $table->index(
                    'old_customer_id',
                    'idx_contact_histories_old_customer'
                );

                $table->index(
                    'new_customer_id',
                    'idx_contact_histories_new_customer'
                );

                $table->index(
                    'changed_by',
                    'idx_contact_histories_changed_by'
                );
            }
        );
    }

    public function down(): void
    {
        Schema::dropIfExists(
            'contact_customer_histories'
        );
    }
};