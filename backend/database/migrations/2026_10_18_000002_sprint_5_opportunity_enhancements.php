<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Cập nhật bảng opportunities
        Schema::table('opportunities', function (Blueprint $table) {
            if (!Schema::hasColumn('opportunities', 'campaign_id')) {
                $table->foreignId('campaign_id')->nullable()->after('source')->constrained('campaigns')->nullOnDelete();
            }
            if (!Schema::hasColumn('opportunities', 'actual_won_value')) {
                $table->decimal('actual_won_value', 15, 2)->nullable()->after('value');
            }
            if (!Schema::hasColumn('opportunities', 'contract_signed_at')) {
                $table->date('contract_signed_at')->nullable()->after('actual_won_value');
            }
            if (!Schema::hasColumn('opportunities', 'loss_reason')) {
                $table->string('loss_reason', 150)->nullable()->after('contract_signed_at');
            }
            if (!Schema::hasColumn('opportunities', 'competitor_name')) {
                $table->string('competitor_name', 150)->nullable()->after('loss_reason');
            }
            if (!Schema::hasColumn('opportunities', 'is_closed')) {
                $table->boolean('is_closed')->default(false)->after('competitor_name');
            }
            if (!Schema::hasColumn('opportunities', 'closed_outcome')) {
                $table->string('closed_outcome', 20)->nullable()->after('is_closed'); // won, lost
            }
            if (!Schema::hasColumn('opportunities', 'closed_at')) {
                $table->timestamp('closed_at')->nullable()->after('closed_outcome');
            }
            if (!Schema::hasColumn('opportunities', 'reopened_at')) {
                $table->timestamp('reopened_at')->nullable()->after('closed_at');
            }
            if (!Schema::hasColumn('opportunities', 'reopen_reason')) {
                $table->text('reopen_reason')->nullable()->after('reopened_at');
            }
        });

        // 2. Bảng sản phẩm trong cơ hội (S5-03)
        if (!Schema::hasTable('opportunity_products')) {
            Schema::create('opportunity_products', function (Blueprint $table) {
                $table->id();
                $table->foreignId('opportunity_id')->constrained('opportunities')->cascadeOnDelete();
                $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
                $table->unsignedInteger('quantity')->default(1);
                $table->decimal('unit_price', 15, 2)->default(0);
                $table->decimal('discount_percent', 5, 2)->default(0);
                $table->boolean('is_subscription')->default(false);
                $table->string('billing_cycle', 30)->nullable(); // monthly, quarterly, yearly
                $table->decimal('annual_value', 15, 2)->default(0);
                $table->decimal('total_amount', 15, 2)->default(0);
                $table->timestamps();

                $table->index('opportunity_id');
                $table->index('product_id');
            });
        }

        // 3. Bảng điều kiện rời giai đoạn (S5-04 Stage Gates)
        if (!Schema::hasTable('opportunity_stage_gates')) {
            Schema::create('opportunity_stage_gates', function (Blueprint $table) {
                $table->id();
                $table->string('stage_key', 50)->unique();
                $table->string('stage_name', 100);
                $table->unsignedInteger('require_activity_count')->default(0);
                $table->boolean('require_product')->default(false);
                $table->boolean('require_contact')->default(false);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        // 4. Bảng thành viên cùng tham gia cơ hội (S6-03 Opportunity Collaborators)
        if (!Schema::hasTable('opportunity_collaborators')) {
            Schema::create('opportunity_collaborators', function (Blueprint $table) {
                $table->id();
                $table->foreignId('opportunity_id')->constrained('opportunities')->cascadeOnDelete();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->string('role', 30)->default('collaborator'); // collaborator, viewer
                $table->foreignId('added_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();

                $table->unique(['opportunity_id', 'user_id']);
            });
        }

        // 5. Bảng tài liệu đính kèm cơ hội (S6-04 Opportunity Attachments)
        if (!Schema::hasTable('opportunity_attachments')) {
            Schema::create('opportunity_attachments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('opportunity_id')->constrained('opportunities')->cascadeOnDelete();
                $table->string('file_name', 255);
                $table->string('file_path', 500);
                $table->unsignedBigInteger('file_size')->default(0); // in bytes, max 20MB
                $table->string('mime_type', 100)->nullable();
                $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();

                $table->index('opportunity_id');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('opportunity_attachments');
        Schema::dropIfExists('opportunity_collaborators');
        Schema::dropIfExists('opportunity_stage_gates');
        Schema::dropIfExists('opportunity_products');

        Schema::table('opportunities', function (Blueprint $table) {
            $table->dropColumn([
                'actual_won_value', 'contract_signed_at', 'loss_reason',
                'competitor_name', 'is_closed', 'closed_outcome',
                'closed_at', 'reopened_at', 'reopen_reason'
            ]);
        });
    }
};
