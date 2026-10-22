<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        // Bảng danh mục lý do thua
        Schema::create('loss_reasons', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Vd: Giá cao, Mất tính năng, Tiến độ kém
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Bảng danh mục đối thủ cạnh tranh
        Schema::create('competitors', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->timestamps();
        });

        // Cập nhật các cột cần thiết cho bảng opportunities
        Schema::table('opportunities', function (Blueprint $table) {
            $table->string('status')->default('open'); // open, won, lost
            $table->decimal('actual_revenue', 15, 2)->nullable();
            $table->date('actual_close_date')->nullable();
            
            $table->foreignId('loss_reason_id')->nullable()->constrained('loss_reasons');
            $table->string('loss_reason_note')->nullable(); // Ghi chú thêm lý do thua
            $table->foreignId('competitor_id')->nullable()->constrained('competitors');
            $table->string('competitor_name_custom')->nullable(); // Nhập tay đối thủ mới nếu không có trong DB

            $table->boolean('is_locked')->default(false);
            $table->text('reopen_reason')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->foreignId('closed_by')->nullable()->constrained('users');
        });
    }

    public function down(): void {
        Schema::table('opportunities', function (Blueprint $table) {
            $table->dropColumn([
                'status', 'actual_revenue', 'actual_close_date', 
                'loss_reason_id', 'loss_reason_note', 'competitor_id', 
                'competitor_name_custom', 'is_locked', 'reopen_reason', 'closed_at', 'closed_by'
            ]);
        });
        Schema::dropIfExists('competitors');
        Schema::dropIfExists('loss_reasons');
    }
};