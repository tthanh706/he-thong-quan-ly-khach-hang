<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('opportunity_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('opportunity_id')->constrained('opportunities')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('role', 30)->default('member'); // member | collaborator (mở rộng sau)
            $table->foreignId('added_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('added_at')->useCurrent();
            $table->timestamps();

            $table->unique(['opportunity_id', 'user_id'], 'uq_opportunity_members_opportunity_user');
            $table->index('user_id', 'idx_opportunity_members_user_id');
            $table->index('opportunity_id', 'idx_opportunity_members_opportunity_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('opportunity_members');
    }
};