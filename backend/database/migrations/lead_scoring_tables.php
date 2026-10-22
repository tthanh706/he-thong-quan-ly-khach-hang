<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('lead_scoring_configs', function (Blueprint $table) {
            $table->id();
            $table->string('criteria_key'); // industry, company_size, source, interest_level
            $table->string('criteria_value'); 
            $table->integer('score')->default(0);
            $table->timestamps();
        });

        Schema::create('lead_scoring_thresholds', function (Blueprint $table) {
            $table->id();
            $table->string('classification'); // Hot, Warm, Cold
            $table->integer('min_score')->default(0);
            $table->integer('max_score')->default(0);
            $table->timestamps();
        });

        Schema::table('leads', function (Blueprint $table) {
            $table->integer('score')->default(0)->after('status');
            $table->string('classification')->default('Cold')->after('score');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_scoring_configs');
        Schema::dropIfExists('lead_scoring_thresholds');
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn(['score', 'classification']);
        });
    }
};