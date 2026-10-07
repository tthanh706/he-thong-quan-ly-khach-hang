<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        foreach (['customers','opportunities','activities','quotes'] as $name) {
            Schema::create($name, function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete();
                $table->foreignId('business_group_id')->constrained()->cascadeOnDelete();
                $table->string('status')->nullable();
                $table->decimal('value',15,2)->nullable();
                $table->text('description')->nullable();
                $table->timestamps();
                $table->index(['owner_id','business_group_id']);
            });
        }
    }
    public function down(): void { foreach (['quotes','activities','opportunities','customers'] as $name) Schema::dropIfExists($name); }
};
