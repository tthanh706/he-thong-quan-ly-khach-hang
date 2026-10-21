<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table): void {
            if (!Schema::hasColumn('customers', 'code')) {
                $table->string('code', 50)->nullable()->unique();
            }
            if (!Schema::hasColumn('customers', 'phone')) {
                $table->string('phone')->nullable();
            }
            if (!Schema::hasColumn('customers', 'business_group_id')) {
                $table->unsignedBigInteger('business_group_id')->nullable();
            }
            if (!Schema::hasColumn('customers', 'status')) {
                $table->string('status')->nullable();
            }
            if (!Schema::hasColumn('customers', 'value')) {
                $table->decimal('value', 15, 2)->nullable();
            }
            if (!Schema::hasColumn('customers', 'notes')) {
                $table->text('notes')->nullable();
            }
            if (!Schema::hasColumn('customers', 'tax_code')) {
                $table->string('tax_code', 50)->nullable();
            }
            if (!Schema::hasColumn('customers', 'address')) {
                $table->string('address', 255)->nullable();
            }
            if (!Schema::hasColumn('customers', 'is_active')) {
                $table->boolean('is_active')->default(true);
            }
            if (!Schema::hasColumn('customers', 'source')) {
                $table->string('source', 50)->nullable();
            }
            if (!Schema::hasColumn('customers', 'parent_id')) {
                $table->foreignId('parent_id')->nullable()->constrained('customers')->nullOnDelete();
            }
            if (!Schema::hasColumn('customers', 'deleted_at')) {
                $table->softDeletes();
            }
        });
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table): void {
            if (Schema::hasColumn('customers', 'parent_id')) {
                $table->dropForeign(['parent_id']);
                $table->dropColumn('parent_id');
            }
            $columnsToDrop = array_filter(['code', 'phone', 'business_group_id', 'status', 'value', 'notes', 'tax_code', 'address', 'is_active', 'source', 'deleted_at'], function ($col) {
                return Schema::hasColumn('customers', $col);
            });
            if (!empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }
};
