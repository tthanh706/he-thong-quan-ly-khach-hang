<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();

            // Người thực hiện thay đổi
            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            // Hành động: created, updated, deleted
            $table->string('action', 50);

            // Loại đối tượng bị thay đổi
            // Ví dụ: User, Quotation, SalesTarget, Customer
            $table->string('entity_type', 100);

            // ID của đối tượng bị thay đổi
            $table->unsignedBigInteger('entity_id')->nullable();

            // Trường dữ liệu nhạy cảm bị thay đổi
            // Ví dụ: discount, target_value, owner_id, role
            $table->string('field_name', 100);

            // Giá trị trước khi thay đổi
            $table->text('old_value')->nullable();

            // Giá trị sau khi thay đổi
            $table->text('new_value')->nullable();

            $table->timestamps();

            // Index phục vụ filter
            $table->index(
                'user_id',
                'idx_audit_logs_user_id'
            );

            $table->index(
                'entity_type',
                'idx_audit_logs_entity_type'
            );

            $table->index(
                'created_at',
                'idx_audit_logs_created_at'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};