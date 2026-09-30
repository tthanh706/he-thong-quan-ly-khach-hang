<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quotes', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('team_id')->constrained()->cascadeOnDelete();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('opportunity_id')->nullable()->constrained()->nullOnDelete();
            $table->string('code')->unique();
            $table->decimal('amount', 15, 0)->default(0);
            $table->date('valid_until')->nullable();
            $table->string('status')->default('draft');
            $table->timestamps();

            $table->index(['team_id', 'owner_id']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quotes');
    }
};
