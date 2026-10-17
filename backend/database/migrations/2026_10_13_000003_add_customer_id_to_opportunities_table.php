<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('opportunities', function (Blueprint $table): void {
            if (!Schema::hasColumn('opportunities', 'customer_id')) {
                $table->foreignId('customer_id')->nullable()->constrained('customers')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('opportunities', function (Blueprint $table): void {
            if (Schema::hasColumn('opportunities', 'customer_id')) {
                $table->dropForeign(['customer_id']);
                $table->dropColumn('customer_id');
            }
        });
    }
};
