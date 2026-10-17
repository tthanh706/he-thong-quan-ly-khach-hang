<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('opportunities')) {
            Schema::create('opportunities', function (Blueprint $table) {
                $table->id();
                $table->string('name', 180);
                $table->foreignId('owner_user_id')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();
                $table->foreignId('team_leader_id')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();
                $table->string('stage', 80);
                $table->string('status', 50)->default('open');
                $table->decimal('value', 18, 2)->default(0);
                $table->date('expected_close_date')->nullable();
                $table->timestamp('last_activity_at')->nullable();
                $table->timestamp('stagnation_flagged_at')->nullable();
                $table->timestamp('overdue_close_flagged_at')->nullable();
                $table->timestamps();

                $table->index('owner_user_id', 'idx_opportunities_owner_user_id');
                $table->index('team_leader_id', 'idx_opportunities_team_leader_id');
                $table->index('stage', 'idx_opportunities_stage');
                $table->index('status', 'idx_opportunities_status');
                $table->index('expected_close_date', 'idx_opportunities_expected_close_date');
                $table->index('last_activity_at', 'idx_opportunities_last_activity_at');
            });
        } else {
            Schema::table('opportunities', function (Blueprint $table) {
                if (!Schema::hasColumn('opportunities', 'name')) {
                    $table->string('name', 180)->nullable()->after('id');
                }
                if (!Schema::hasColumn('opportunities', 'owner_user_id')) {
                    $table->foreignId('owner_user_id')
                        ->nullable()
                        ->after('name')
                        ->constrained('users')
                        ->nullOnDelete();
                }
                if (!Schema::hasColumn('opportunities', 'team_leader_id')) {
                    $table->foreignId('team_leader_id')
                        ->nullable()
                        ->after('owner_user_id')
                        ->constrained('users')
                        ->nullOnDelete();
                }
                if (!Schema::hasColumn('opportunities', 'stage')) {
                    $table->string('stage', 80)->default('lead')->after('team_leader_id');
                }
                if (!Schema::hasColumn('opportunities', 'value')) {
                    $table->decimal('value', 18, 2)->default(0)->after('stage');
                }
                if (!Schema::hasColumn('opportunities', 'expected_close_date')) {
                    $table->date('expected_close_date')->nullable()->after('value');
                }
                if (!Schema::hasColumn('opportunities', 'last_activity_at')) {
                    $table->timestamp('last_activity_at')->nullable()->after('expected_close_date');
                }
                if (!Schema::hasColumn('opportunities', 'stagnation_flagged_at')) {
                    $table->timestamp('stagnation_flagged_at')->nullable()->after('last_activity_at');
                }
                if (!Schema::hasColumn('opportunities', 'overdue_close_flagged_at')) {
                    $table->timestamp('overdue_close_flagged_at')->nullable()->after('stagnation_flagged_at');
                }
            });
        }
    }

    public function down(): void
    {
        // Don't drop entire table if it was created in base migration
    }
};
