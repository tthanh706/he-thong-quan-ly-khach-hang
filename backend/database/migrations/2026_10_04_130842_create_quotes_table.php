<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('quotes')) {
            Schema::create('quotes', function (Blueprint $table) {
                $table->id();
                $table->string('name')->nullable();
                $table->foreignId('owner_id')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('business_group_id')->nullable();
                $table->string('status', 50)->default('draft');
                $table->decimal('value', 15, 2)->default(0);
                $table->decimal('discount', 10, 2)->default(0);
                $table->string('email')->nullable();
                $table->string('phone')->nullable();
                $table->text('notes')->nullable();
                $table->timestamps();
            });
        } elseif (!Schema::hasColumn('quotes', 'discount')) {
            Schema::table('quotes', function (Blueprint $table) {
                $table->decimal('discount', 10, 2)->default(0)->after('value');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('quotes');
    }
};
