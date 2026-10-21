<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('opportunities', function (Blueprint $table) {
            $table->id();

            $table->string('name', 180);

            $table->foreignId('owner_user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->foreignId('team_leader_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->string('stage', 80);

            $table->string('status', 50)
                ->default('open');

            $table->decimal('value', 18, 2)
                ->default(0);

            $table->date('expected_close_date')
                ->nullable();

            $table->timestamp('last_activity_at')
                ->nullable();

            $table->timestamp('stagnation_flagged_at')
                ->nullable();

            $table->timestamp('overdue_close_flagged_at')
                ->nullable();

            $table->timestamps();

            $table->index(
                'owner_user_id',
                'idx_opportunities_owner_user_id'
            );

            $table->index(
                'team_leader_id',
                'idx_opportunities_team_leader_id'
            );

            $table->index(
                'stage',
                'idx_opportunities_stage'
            );

            $table->index(
                'status',
                'idx_opportunities_status'
            );

            $table->index(
                'expected_close_date',
                'idx_opportunities_expected_close_date'
            );

            $table->index(
                'last_activity_at',
                'idx_opportunities_last_activity_at'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('opportunities');
    }
};