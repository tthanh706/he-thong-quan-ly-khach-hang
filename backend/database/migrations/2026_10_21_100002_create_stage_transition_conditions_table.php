<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stage_transition_conditions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pipeline_stage_id')->constrained('pipeline_stages')->cascadeOnDelete();
            $table->string('condition_type');  // e.g. 'has_meeting', 'has_quote', 'min_activities', 'required_field'
            $table->json('parameters');         // e.g. {"min_count": 1, "activity_type": "meeting"}
            $table->string('error_message');    // Human-readable error when condition fails
            $table->boolean('is_active')->default(true);
            $table->integer('priority')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stage_transition_conditions');
    }
};
