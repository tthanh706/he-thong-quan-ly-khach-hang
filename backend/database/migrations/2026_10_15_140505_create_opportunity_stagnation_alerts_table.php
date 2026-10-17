<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('opportunity_stagnation_alerts', function (Blueprint $table) {
            $table->id();

            $table->foreignId('opportunity_id')
                ->constrained('opportunities')
                ->cascadeOnDelete();

            $table->foreignId('recipient_user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->string('type', 50);

            $table->text('message');

            $table->timestamp('detected_at');

            $table->timestamp('read_at')
                ->nullable();

            $table->timestamps();

            $table->unique(
                [
                    'opportunity_id',
                    'type',
                ],
                'uq_opportunity_stagnation_alerts_opportunity_type'
            );

            $table->index(
                'recipient_user_id',
                'idx_opportunity_stagnation_alerts_recipient_user_id'
            );

            $table->index(
                'detected_at',
                'idx_opportunity_stagnation_alerts_detected_at'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('opportunity_stagnation_alerts');
    }
};