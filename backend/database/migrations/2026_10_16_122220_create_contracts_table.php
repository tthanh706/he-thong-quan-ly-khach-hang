<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('contracts')) {
            Schema::create('contracts', function (Blueprint $table) {
                $table->id();
                $table->string('contract_code', 50)->unique();
                $table->string('customer_name', 180);
                $table->foreignId('owner_user_id')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();
                $table->foreignId('accountant_user_id')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();
                $table->string('status', 30)->default('active');
                $table->decimal('contract_value', 18, 2)->default(0);
                $table->date('start_date');
                $table->date('end_date');
                $table->text('description')->nullable();
                $table->timestamps();

                $table->index('owner_user_id', 'idx_contracts_owner_user_id');
                $table->index('accountant_user_id', 'idx_contracts_accountant_user_id');
                $table->index('status', 'idx_contracts_status');
                $table->index('end_date', 'idx_contracts_end_date');
            });
        } else {
            Schema::table('contracts', function (Blueprint $table) {
                if (!Schema::hasColumn('contracts', 'customer_name')) {
                    $table->string('customer_name', 180)->nullable()->after('contract_code');
                }
                if (!Schema::hasColumn('contracts', 'owner_user_id')) {
                    $table->foreignId('owner_user_id')
                        ->nullable()
                        ->after('customer_name')
                        ->constrained('users')
                        ->nullOnDelete();
                }
                if (!Schema::hasColumn('contracts', 'accountant_user_id')) {
                    $table->foreignId('accountant_user_id')
                        ->nullable()
                        ->after('owner_user_id')
                        ->constrained('users')
                        ->nullOnDelete();
                }
                if (!Schema::hasColumn('contracts', 'start_date')) {
                    $table->date('start_date')->nullable()->after('contract_value');
                }
                if (!Schema::hasColumn('contracts', 'end_date')) {
                    $table->date('end_date')->nullable()->after('start_date');
                }
                if (!Schema::hasColumn('contracts', 'description')) {
                    $table->text('description')->nullable()->after('end_date');
                }
            });
        }
    }

    public function down(): void
    {
        // Don't drop entire table if created by base migration
    }
};
