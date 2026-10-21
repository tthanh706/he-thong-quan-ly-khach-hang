<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Cập nhật bảng sales_activities (S6-05, S6-08, S6-10)
        Schema::table('sales_activities', function (Blueprint $table) {
            if (!Schema::hasColumn('sales_activities', 'customer_id')) {
                $table->foreignId('customer_id')->nullable()->after('lead_id')->constrained('customers')->nullOnDelete();
            }
            if (!Schema::hasColumn('sales_activities', 'contact_id')) {
                $table->foreignId('contact_id')->nullable()->after('customer_id')->constrained('contacts')->nullOnDelete();
            }
            if (!Schema::hasColumn('sales_activities', 'opportunity_id')) {
                $table->foreignId('opportunity_id')->nullable()->after('contact_id')->constrained('opportunities')->nullOnDelete();
            }
            if (!Schema::hasColumn('sales_activities', 'duration_minutes')) {
                $table->unsignedInteger('duration_minutes')->nullable()->after('occurred_at');
            }
            if (!Schema::hasColumn('sales_activities', 'result')) {
                $table->text('result')->nullable()->after('description');
            }
            if (!Schema::hasColumn('sales_activities', 'call_result')) {
                $table->string('call_result', 50)->nullable()->after('result'); // connected, busy, wrong_number, no_answer
            }
            if (!Schema::hasColumn('sales_activities', 'callback_at')) {
                $table->timestamp('callback_at')->nullable()->after('call_result');
            }
        });

        // 2. Cập nhật bảng calendar_items (S6-06, S6-09)
        Schema::table('calendar_items', function (Blueprint $table) {
            if (!Schema::hasColumn('calendar_items', 'customer_id')) {
                $table->foreignId('customer_id')->nullable()->after('team_leader_id')->constrained('customers')->nullOnDelete();
            }
            if (!Schema::hasColumn('calendar_items', 'opportunity_id')) {
                $table->foreignId('opportunity_id')->nullable()->after('customer_id')->constrained('opportunities')->nullOnDelete();
            }
            if (!Schema::hasColumn('calendar_items', 'priority')) {
                $table->string('priority', 20)->default('medium')->after('item_type'); // low, medium, high
            }
            if (!Schema::hasColumn('calendar_items', 'completed_at')) {
                $table->timestamp('completed_at')->nullable()->after('status');
            }
            if (!Schema::hasColumn('calendar_items', 'postpone_reason')) {
                $table->text('postpone_reason')->nullable()->after('completed_at');
            }
            if (!Schema::hasColumn('calendar_items', 'reminder_minutes')) {
                $table->unsignedInteger('reminder_minutes')->default(15)->after('postpone_reason');
            }
        });
    }

    public function down(): void
    {
        Schema::table('calendar_items', function (Blueprint $table) {
            $table->dropColumn([
                'priority', 'completed_at', 'postpone_reason', 'reminder_minutes'
            ]);
        });

        Schema::table('sales_activities', function (Blueprint $table) {
            $table->dropColumn([
                'duration_minutes', 'result', 'call_result', 'callback_at'
            ]);
        });
    }
};
