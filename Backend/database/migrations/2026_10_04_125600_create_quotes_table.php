<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quotes', function (Blueprint $table) {
            $table->id();

            $table->string('name');

            $table->foreignId('owner_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->unsignedBigInteger('business_group_id')
                ->nullable();

            $table->string('status', 50)
                ->default('draft');

            $table->decimal('value', 15, 2)
                ->default(0);

            $table->string('email')
                ->nullable();

            $table->string('phone', 30)
                ->nullable();

            $table->text('notes')
                ->nullable();

            $table->timestamps();

            $table->index(
                'owner_id',
                'idx_quotes_owner_id'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quotes');
    }
};