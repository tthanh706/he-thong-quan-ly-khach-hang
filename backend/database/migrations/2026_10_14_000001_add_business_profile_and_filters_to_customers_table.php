<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // 1. Thêm các trường hồ sơ doanh nghiệp & lọc vào bảng customers (S3-01 & S3-07)
        Schema::table('customers', function (Blueprint $table): void {
            if (!Schema::hasColumn('customers', 'industry')) {
                $table->string('industry', 255)->nullable()->after('tax_code');
            }
            if (!Schema::hasColumn('customers', 'company_size')) {
                $table->string('company_size', 100)->nullable()->after('industry');
            }
            if (!Schema::hasColumn('customers', 'website')) {
                $table->string('website', 255)->nullable()->after('company_size');
            }
            if (!Schema::hasColumn('customers', 'area')) {
                $table->string('area', 100)->nullable()->after('address');
            }
        });

        // 2. Tạo bảng lưu trữ bộ lọc tìm kiếm hay dùng (S3-07: Lưu lại được bộ lọc hay dùng)
        if (!Schema::hasTable('saved_filters')) {
            Schema::create('saved_filters', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->string('name', 255);
                $table->string('module', 50)->default('customers');
                $table->json('filters');
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table): void {
            $columns = ['industry', 'company_size', 'website', 'area'];
            foreach ($columns as $column) {
                if (Schema::hasColumn('customers', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        Schema::dropIfExists('saved_filters');
    }
};
