<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activities', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('team_id')->constrained()->cascadeOnDelete();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('assignee_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('title');
            $table->string('type')->default('call');
            $table->timestamp('due_at');
            $table->string('status')->default('todo');
            $table->timestamps();

            $table->index(['team_id', 'owner_id']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activities');
    }
};
