<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Bảng lưu lịch sử import Excel (US-06)
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('import_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('file_name');
            $table->string('file_path')->nullable();
            $table->unsignedInteger('total_rows')->default(0);
            $table->unsignedInteger('success_count')->default(0);
            $table->unsignedInteger('error_count')->default(0);
            $table->string('status', 20)->default('PENDING')->comment('PENDING | PROCESSING | COMPLETED | FAILED');
            $table->json('error_details')->nullable()->comment('Chi tiết lỗi từng dòng');
            $table->timestamps();

            $table->index('user_id', 'idx_import_logs_user_id');
            $table->index('status', 'idx_import_logs_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('import_logs');
    }
};
