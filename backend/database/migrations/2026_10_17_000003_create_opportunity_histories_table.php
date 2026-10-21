<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('opportunity_histories')) {
            Schema::create('opportunity_histories', function (Blueprint $table) {
                $table->id();
                $table->foreignId('opportunity_id')->constrained('opportunities')->cascadeOnDelete();
                $table->string('field_name', 60);
                $table->string('field_label', 100);
                $table->text('old_value')->nullable();
                $table->text('new_value')->nullable();
                $table->string('old_label', 200)->nullable();
                $table->string('new_label', 200)->nullable();
                $table->foreignId('changed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->text('reason')->nullable();
                $table->timestamps();

                $table->index('opportunity_id', 'idx_opp_histories_opp_id');
                $table->index('field_name', 'idx_opp_histories_field_name');
                $table->index('changed_by_user_id', 'idx_opp_histories_user_id');
                $table->index('created_at', 'idx_opp_histories_created_at');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('opportunity_histories');
    }
};
