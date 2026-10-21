<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('campaigns', function (Blueprint $table) {
            $table->id();
            $table->string('name', 255);
            $table->text('description')->nullable();
            $table->decimal('budget', 15, 2)->default(0);
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->string('channel', 50); // facebook, google, email, zalo, website, offline, other
            $table->string('status', 30)->default('draft'); // draft, active, paused, completed, cancelled
            $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['owner_id', 'status'], 'idx_campaigns_owner_status');
            $table->index(['start_date', 'end_date'], 'idx_campaigns_dates');
            $table->index('channel', 'idx_campaigns_channel');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('campaigns');
    }
};