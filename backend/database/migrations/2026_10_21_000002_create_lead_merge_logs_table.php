<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lead_merge_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('primary_lead_id')->constrained('leads')->cascadeOnDelete();
            $table->foreignId('merged_lead_id')->constrained('leads')->cascadeOnDelete();
            $table->foreignId('performed_by')->constrained('users')->cascadeOnDelete();
            $table->json('primary_lead_snapshot');
            $table->json('merged_lead_snapshot');
            $table->json('merged_activities_summary');
            $table->string('merge_reason')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_merge_logs');
    }
};
