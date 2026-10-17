<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create(
            'lead_assignment_histories',
            function (Blueprint $table) {
                $table->id();

                $table->foreignId('lead_id')
                    ->constrained('leads')
                    ->cascadeOnDelete();

                $table->foreignId('user_id')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();

                $table->string('action', 50);

                $table->string('old_status', 50)
                    ->nullable();

                $table->string('new_status', 50)
                    ->nullable();

                $table->text('reason')
                    ->nullable();

                $table->timestamps();

                $table->index(
                    'lead_id',
                    'idx_lead_histories_lead_id'
                );

                $table->index(
                    'user_id',
                    'idx_lead_histories_user_id'
                );

                $table->index(
                    'action',
                    'idx_lead_histories_action'
                );
            }
        );
    }

    public function down(): void
    {
        Schema::dropIfExists(
            'lead_assignment_histories'
        );
    }
};