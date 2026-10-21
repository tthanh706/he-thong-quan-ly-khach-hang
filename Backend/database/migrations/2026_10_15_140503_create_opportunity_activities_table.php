<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('opportunity_activities', function (Blueprint $table) {
            $table->id();

            $table->foreignId('opportunity_id')
                ->constrained('opportunities')
                ->cascadeOnDelete();

            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->string('type', 50);

            $table->text('note')
                ->nullable();

            $table->timestamp('activity_at');

            $table->timestamps();

            $table->index(
                'opportunity_id',
                'idx_opportunity_activities_opportunity_id'
            );

            $table->index(
                'user_id',
                'idx_opportunity_activities_user_id'
            );

            $table->index(
                'activity_at',
                'idx_opportunity_activities_activity_at'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('opportunity_activities');
    }
};