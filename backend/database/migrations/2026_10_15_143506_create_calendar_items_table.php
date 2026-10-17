<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('calendar_items', function (Blueprint $table) {
            $table->id();

            $table->string('title', 180);

            $table->string('item_type', 30);

            $table->foreignId('assigned_user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->foreignId('team_leader_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('start_at')
                ->nullable();

            $table->timestamp('end_at')
                ->nullable();

            $table->timestamp('due_at')
                ->nullable();

            $table->string('status', 30)
                ->default('scheduled');

            $table->string('location', 255)
                ->nullable();

            $table->text('description')
                ->nullable();

            $table->timestamps();

            $table->index(
                'assigned_user_id',
                'idx_calendar_items_assigned_user_id'
            );

            $table->index(
                'team_leader_id',
                'idx_calendar_items_team_leader_id'
            );

            $table->index(
                'item_type',
                'idx_calendar_items_item_type'
            );

            $table->index(
                'status',
                'idx_calendar_items_status'
            );

            $table->index(
                'start_at',
                'idx_calendar_items_start_at'
            );

            $table->index(
                'due_at',
                'idx_calendar_items_due_at'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('calendar_items');
    }
};