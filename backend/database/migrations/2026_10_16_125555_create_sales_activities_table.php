<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales_activities', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->foreignId('team_leader_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->foreignId('lead_id')
                ->nullable()
                ->constrained('leads')
                ->nullOnDelete();

            $table->string('activity_type', 30);

            $table->string('title', 180);

            $table->text('description')
                ->nullable();

            $table->timestamp('occurred_at');

            $table->timestamps();

            $table->index(
                'user_id',
                'idx_sales_activities_user_id'
            );

            $table->index(
                'team_leader_id',
                'idx_sales_activities_team_leader_id'
            );

            $table->index(
                'activity_type',
                'idx_sales_activities_activity_type'
            );

            $table->index(
                'occurred_at',
                'idx_sales_activities_occurred_at'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_activities');
    }
};