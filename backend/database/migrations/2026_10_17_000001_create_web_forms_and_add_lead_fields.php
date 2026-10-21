<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('web_forms')) {
            Schema::create('web_forms', function (Blueprint $table) {
                $table->id();
                $table->string('name', 150);
                $table->string('code', 50)->unique();
                $table->string('embed_token', 64)->unique();
                $table->string('source', 100)->default('Website');
                $table->string('title', 200)->nullable();
                $table->text('description')->nullable();
                $table->string('submit_button_text', 50)->default('Gửi thông tin');
                $table->text('success_message')->nullable();
                $table->boolean('is_active')->default(true);
                $table->unsignedInteger('submission_count')->default(0);
                $table->unsignedInteger('rate_limit_per_minute')->default(5);
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();

                $table->index('embed_token', 'idx_web_forms_embed_token');
                $table->index('is_active', 'idx_web_forms_is_active');
            });
        }

        Schema::table('leads', function (Blueprint $table) {
            if (!Schema::hasColumn('leads', 'company')) {
                $table->string('company', 150)->nullable()->after('phone');
            }
            if (!Schema::hasColumn('leads', 'interest_demand')) {
                $table->text('interest_demand')->nullable()->after('company');
            }
            if (!Schema::hasColumn('leads', 'source')) {
                $table->string('source', 100)->default('web_form')->after('interest_demand');
            }
            if (!Schema::hasColumn('leads', 'web_form_id')) {
                $table->foreignId('web_form_id')->nullable()->after('source')->constrained('web_forms')->nullOnDelete();
            }
            if (!Schema::hasColumn('leads', 'ip_address')) {
                $table->string('ip_address', 45)->nullable()->after('web_form_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            if (Schema::hasColumn('leads', 'web_form_id')) {
                $table->dropConstrainedForeignId('web_form_id');
            }
            if (Schema::hasColumn('leads', 'company')) {
                $table->dropColumn('company');
            }
            if (Schema::hasColumn('leads', 'interest_demand')) {
                $table->dropColumn('interest_demand');
            }
            if (Schema::hasColumn('leads', 'source')) {
                $table->dropColumn('source');
            }
            if (Schema::hasColumn('leads', 'ip_address')) {
                $table->dropColumn('ip_address');
            }
        });

        Schema::dropIfExists('web_forms');
    }
};
