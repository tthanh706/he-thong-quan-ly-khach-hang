<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('opportunities', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('team_id')->constrained()->cascadeOnDelete();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->string('code')->unique();
            $table->string('title');
            $table->decimal('amount', 15, 0)->default(0);
            $table->string('stage')->default('prospecting');
            $table->date('close_date')->nullable();
            $table->timestamps();

            $table->index(['team_id', 'owner_id']);
            $table->index('stage');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('opportunities');
    }
};
