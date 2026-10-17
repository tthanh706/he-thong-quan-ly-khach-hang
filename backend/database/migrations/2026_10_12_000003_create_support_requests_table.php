<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('support_requests', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20)->unique()->comment('Mã yêu cầu: REQ-xxx');
            $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
            $table->string('subject');
            $table->text('description')->nullable();
            $table->string('priority', 20)->default('MEDIUM')->comment('LOW | MEDIUM | HIGH');
            $table->string('status', 20)->default('OPEN')->comment('OPEN | IN_PROGRESS | CLOSED');
            $table->foreignId('assignee_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->timestamp('resolved_at')->nullable();
            $table->text('resolution_note')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('customer_id', 'idx_support_requests_customer_id');
            $table->index('assignee_id', 'idx_support_requests_assignee_id');
            $table->index('status', 'idx_support_requests_status');
            $table->index('priority', 'idx_support_requests_priority');
            $table->index(['status', 'created_at'], 'idx_support_requests_status_created');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('support_requests');
    }
};
