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

            // Người thực hiện thao tác
            $table->foreignId('actor_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            // Nhân viên bị khóa
            $table->foreignId('target_user_id')
                ->constrained('users')
                ->restrictOnDelete();

            // Nhân viên nhận bàn giao
            $table->foreignId('transfer_to_user_id')
                ->constrained('users')
                ->restrictOnDelete();

            $table->string('action');
            $table->text('details')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};