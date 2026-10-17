<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leads', function (Blueprint $table) {
            $table->id();

            $table->string('name', 150);
            $table->string('email')->nullable();
            $table->string('phone', 30)->nullable();

            $table->foreignId('assigned_to')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->foreignId('team_leader_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->string('status', 50)
                ->default('waiting_assignment');

            $table->timestamp('assigned_at')
                ->nullable();

            $table->timestamp('accepted_at')
                ->nullable();

            $table->timestamp('contacted_at')
                ->nullable();

            $table->timestamp('sla_deadline')
                ->nullable();

            $table->timestamp('sla_flagged_at')
                ->nullable();

            $table->text('rejection_reason')
                ->nullable();

            $table->timestamps();

            $table->index(
                'assigned_to',
                'idx_leads_assigned_to'
            );

            $table->index(
                'team_leader_id',
                'idx_leads_team_leader_id'
            );

            $table->index(
                'status',
                'idx_leads_status'
            );

            $table->index(
                'sla_deadline',
                'idx_leads_sla_deadline'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leads');
    }
};