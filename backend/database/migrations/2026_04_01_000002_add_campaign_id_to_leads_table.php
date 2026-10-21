<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->foreignId('campaign_id')
                ->nullable()
                ->after('source')
                ->constrained('campaigns')
                ->nullOnDelete();

            $table->index('campaign_id', 'idx_leads_campaign_id');
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropForeign(['campaign_id']);
            $table->dropIndex('idx_leads_campaign_id');
            $table->dropColumn('campaign_id');
        });
    }
};