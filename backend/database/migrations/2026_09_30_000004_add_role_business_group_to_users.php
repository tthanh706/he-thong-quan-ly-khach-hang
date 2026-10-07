<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::table('users', function(Blueprint $table) {
            if (!Schema::hasColumn('users', 'role')) {
                $table->string('role')->default('Nhân viên kinh doanh')->after('password');
            }
            if (!Schema::hasColumn('users', 'business_group_id') && Schema::hasTable('business_groups')) {
                $table->foreignId('business_group_id')->nullable()->after('role')->constrained('business_groups')->nullOnDelete();
            }
        });
    }
    public function down(): void {
        Schema::table('users', function(Blueprint $table) {
            if (Schema::hasColumn('users', 'business_group_id')) {
                $table->dropForeign(['business_group_id']);
                $table->dropColumn('business_group_id');
            }
            if (Schema::hasColumn('users', 'role')) {
                $table->dropColumn('role');
            }
        });
    }
};
