<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Tạo bảng campaigns nếu chưa có (S4-03)
        if (!Schema::hasTable('campaigns')) {
            Schema::create('campaigns', function (Blueprint $table) {
                $table->id();
                $table->string('name', 150);
                $table->text('description')->nullable();
                $table->string('channel', 100)->nullable(); // Kênh: Google, Facebook, Email, Hội thảo, Website...
                $table->string('status', 30)->default('draft'); // draft, active, paused, completed
                $table->dateTime('starts_at')->nullable();
                $table->dateTime('ends_at')->nullable();
                $table->decimal('budget', 15, 2)->default(0);
                $table->unsignedInteger('target_leads')->default(0);
                $table->decimal('target_revenue', 15, 2)->default(0);
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('customer_id')->nullable()->constrained('customers')->nullOnDelete();
                $table->softDeletes();
                $table->timestamps();

                $table->index('status');
                $table->index('created_by');
            });
        } else {
            Schema::table('campaigns', function (Blueprint $table) {
                if (!Schema::hasColumn('campaigns', 'channel')) {
                    $table->string('channel', 100)->nullable()->after('description');
                }
                if (!Schema::hasColumn('campaigns', 'target_leads')) {
                    $table->unsignedInteger('target_leads')->default(0)->after('budget');
                }
                if (!Schema::hasColumn('campaigns', 'target_revenue')) {
                    $table->decimal('target_revenue', 15, 2)->default(0)->after('target_leads');
                }
            });
        }

        // 2. Cập nhật bảng leads (S4-02, S4-03, S4-04, S4-05, S4-08)
        Schema::table('leads', function (Blueprint $table) {
            if (!Schema::hasColumn('leads', 'campaign_id')) {
                $table->foreignId('campaign_id')->nullable()->after('web_form_id')->constrained('campaigns')->nullOnDelete();
            }
            if (!Schema::hasColumn('leads', 'score')) {
                $table->integer('score')->default(0)->after('status');
            }
            if (!Schema::hasColumn('leads', 'rating')) {
                $table->string('rating', 20)->default('cold')->after('score'); // hot, warm, cold
            }
            if (!Schema::hasColumn('leads', 'industry')) {
                $table->string('industry', 100)->nullable()->after('company');
            }
            if (!Schema::hasColumn('leads', 'company_size')) {
                $table->string('company_size', 50)->nullable()->after('industry');
            }
            if (!Schema::hasColumn('leads', 'converted_at')) {
                $table->timestamp('converted_at')->nullable()->after('sla_flagged_at');
            }
            if (!Schema::hasColumn('leads', 'converted_customer_id')) {
                $table->foreignId('converted_customer_id')->nullable()->after('converted_at')->constrained('customers')->nullOnDelete();
            }
            if (!Schema::hasColumn('leads', 'converted_contact_id')) {
                $table->foreignId('converted_contact_id')->nullable()->after('converted_customer_id')->constrained('contacts')->nullOnDelete();
            }
            if (!Schema::hasColumn('leads', 'converted_opportunity_id')) {
                $table->foreignId('converted_opportunity_id')->nullable()->after('converted_contact_id')->constrained('opportunities')->nullOnDelete();
            }
            if (!Schema::hasColumn('leads', 'is_merged')) {
                $table->boolean('is_merged')->default(false)->after('converted_opportunity_id');
            }
            if (!Schema::hasColumn('leads', 'merged_into_lead_id')) {
                $table->foreignId('merged_into_lead_id')->nullable()->after('is_merged')->constrained('leads')->nullOnDelete();
            }
        });

        // 3. Bảng tiêu chí chấm điểm Lead (S4-05)
        if (!Schema::hasTable('lead_scoring_rules')) {
            Schema::create('lead_scoring_rules', function (Blueprint $table) {
                $table->id();
                $table->string('name', 150);
                $table->string('criteria_type', 50); // industry, company_size, source, interest_demand
                $table->string('criteria_value', 150);
                $table->integer('points')->default(10);
                $table->boolean('is_active')->default(true);
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
            });
        }

        // 4. Bảng quy tắc phân bổ Lead tự động (S4-06)
        if (!Schema::hasTable('lead_assignment_rules')) {
            Schema::create('lead_assignment_rules', function (Blueprint $table) {
                $table->id();
                $table->string('name', 150);
                $table->unsignedInteger('priority')->default(1);
                $table->string('condition_type', 50); // region, industry, round_robin
                $table->string('condition_value', 150)->nullable();
                $table->foreignId('assign_to_user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('assign_to_group_id')->nullable()->constrained('business_groups')->nullOnDelete();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_assignment_rules');
        Schema::dropIfExists('lead_scoring_rules');

        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn([
                'score', 'rating', 'industry', 'company_size',
                'converted_at', 'is_merged'
            ]);
        });

        Schema::dropIfExists('campaigns');
    }
};
