<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('customer_id')->constrained()->onDelete('cascade');
            $table->foreignId('contact_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('opportunity_id')->nullable()->constrained()->onDelete('set null');
            
            // Loại hoạt động: call, meeting, email, note
            $table->string('type'); 
            $table->string('title');
            $table->dateTime('performed_at'); // Hỗ trợ cả quá khứ & tương lai
            $table->integer('duration_minutes')->default(0); // Thời lượng (phút)
            $table->text('description')->nullable(); // Nội dung trao đổi
            $table->text('result')->nullable(); // Kết quả trao đổi
            $table->string('status')->default('completed'); // completed, scheduled
            
            $table->timestamps();

            $table->index(['customer_id', 'performed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activities');
    }
};