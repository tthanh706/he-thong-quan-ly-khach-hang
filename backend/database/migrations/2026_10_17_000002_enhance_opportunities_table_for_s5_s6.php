<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('opportunities', function (Blueprint $table) {
            if (!Schema::hasColumn('opportunities', 'contact_id')) {
                $table->foreignId('contact_id')->nullable()->after('customer_id')->constrained('contacts')->nullOnDelete();
            }
            if (!Schema::hasColumn('opportunities', 'source')) {
                $table->string('source', 100)->nullable()->after('contact_id');
            }
            if (!Schema::hasColumn('opportunities', 'win_probability')) {
                $table->unsignedTinyInteger('win_probability')->default(10)->after('value');
            }
            if (!Schema::hasColumn('opportunities', 'win_probability_customized')) {
                $table->boolean('win_probability_customized')->default(false)->after('win_probability');
            }
            if (!Schema::hasColumn('opportunities', 'probability_note')) {
                $table->text('probability_note')->nullable()->after('win_probability_customized');
            }
        });
    }

    public function down(): void
    {
        Schema::table('opportunities', function (Blueprint $table) {
            if (Schema::hasColumn('opportunities', 'contact_id')) {
                $table->dropConstrainedForeignId('contact_id');
            }
            if (Schema::hasColumn('opportunities', 'source')) {
                $table->dropColumn('source');
            }
            if (Schema::hasColumn('opportunities', 'win_probability')) {
                $table->dropColumn('win_probability');
            }
            if (Schema::hasColumn('opportunities', 'win_probability_customized')) {
                $table->dropColumn('win_probability_customized');
            }
            if (Schema::hasColumn('opportunities', 'probability_note')) {
                $table->dropColumn('probability_note');
            }
        });
    }
};
