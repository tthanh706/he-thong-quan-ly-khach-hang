<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Pivot table for sharing opportunities with additional users.
     * Used for access control on attachments.
     */
    public function up(): void
    {
        Schema::create('opportunity_shared_users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('opportunity_id')->constrained('opportunities')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->enum('permission', ['view', 'edit', 'manage'])->default('view');
            $table->timestamps();

            $table->unique(['opportunity_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('opportunity_shared_users');
    }
};
