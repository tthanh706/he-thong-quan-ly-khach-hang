<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create(
            'lead_sla_alerts',
            function (Blueprint $table) {
                $table->id();

                $table->foreignId('lead_id')
                    ->constrained('leads')
                    ->cascadeOnDelete();

                $table->foreignId('recipient_user_id')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();

                $table->timestamp('overdue_at');

                $table->timestamp('read_at')
                    ->nullable();

                $table->timestamps();

                $table->unique(
                    'lead_id',
                    'uq_lead_sla_alerts_lead_id'
                );

                $table->index(
                    'recipient_user_id',
                    'idx_lead_sla_alerts_recipient'
                );
            }
        );
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_sla_alerts');
    }
};