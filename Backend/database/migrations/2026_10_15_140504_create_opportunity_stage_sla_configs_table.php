<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('opportunity_stage_sla_configs', function (Blueprint $table) {
            $table->id();

            $table->string('stage', 80)
                ->unique();

            $table->unsignedInteger('inactivity_days');

            $table->boolean('is_active')
                ->default(true);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('opportunity_stage_sla_configs');
    }
};