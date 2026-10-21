<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('opportunity_ownership_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('opportunity_id')->constrained('opportunities')->cascadeOnDelete();
            $table->foreignId('from_owner_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('to_owner_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('changed_by')->constrained('users')->cascadeOnDelete();
            $table->text('note')->nullable();
            $table->timestamp('changed_at')->useCurrent();
            $table->timestamps();

            $table->index('opportunity_id', 'idx_opportunity_ownership_logs_opportunity_id');
            $table->index('changed_at', 'idx_opportunity_ownership_logs_changed_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('opportunity_ownership_logs');
    }
};