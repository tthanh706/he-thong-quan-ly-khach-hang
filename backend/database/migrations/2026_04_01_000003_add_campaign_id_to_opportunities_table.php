<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('opportunities', function (Blueprint $table) {
            $table->foreignId('campaign_id')
                ->nullable()
                ->after('lead_id')
                ->constrained('campaigns')
                ->nullOnDelete();

            $table->index('campaign_id', 'idx_opportunities_campaign_id');
        });
    }

    public function down(): void
    {
        Schema::table('opportunities', function (Blueprint $table) {
            $table->dropForeign(['campaign_id']);
            $table->dropIndex('idx_opportunities_campaign_id');
            $table->dropColumn('campaign_id');
        });
    }
};