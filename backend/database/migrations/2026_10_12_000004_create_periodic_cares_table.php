<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('periodic_cares', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
            $table->string('care_type')->comment('Loại hình chăm sóc');
            $table->date('scheduled_date');
            $table->foreignId('assignee_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status', 20)->default('PENDING')->comment('PENDING | DONE | CANCELLED');
            $table->text('notes')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index('customer_id', 'idx_periodic_cares_customer_id');
            $table->index('assignee_id', 'idx_periodic_cares_assignee_id');
            $table->index('status', 'idx_periodic_cares_status');
            $table->index('scheduled_date', 'idx_periodic_cares_scheduled_date');
            $table->index(['status', 'scheduled_date'], 'idx_periodic_cares_status_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('periodic_cares');
    }
};
