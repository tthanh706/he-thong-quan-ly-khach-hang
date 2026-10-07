<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('handover_logs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('source_user_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('target_user_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('performed_by_user_id')->constrained('users')->restrictOnDelete();
            $table->string('entity_type');
            $table->unsignedBigInteger('entity_id');
            $table->timestamp('handed_over_at');
            $table->timestamps();

            $table->index(['entity_type', 'entity_id']);
            $table->index(['source_user_id', 'target_user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('handover_logs');
    }
};
