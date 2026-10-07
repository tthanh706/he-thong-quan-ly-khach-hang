<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'role')) {
                $table->string('role')->default('SALES_REP');
            }
            if (!Schema::hasColumn('users', 'data_scope')) {
                $table->string('data_scope')->default('MINE');
            }
            if (!Schema::hasColumn('users', 'business_group_id') && Schema::hasTable('business_groups')) {
                $table->foreignId('business_group_id')->nullable()->constrained()->nullOnDelete();
            }
        });
    }
    public function down(): void {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'business_group_id')) {
                $table->dropConstrainedForeignId('business_group_id');
            }
            if (Schema::hasColumn('users', 'data_scope')) {
                $table->dropColumn('data_scope');
            }
        });
    }
};
