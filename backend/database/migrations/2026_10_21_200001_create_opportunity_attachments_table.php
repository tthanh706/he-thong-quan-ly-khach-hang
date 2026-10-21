<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('opportunity_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('opportunity_id')->constrained('opportunities')->cascadeOnDelete();
            $table->string('file_name');
            $table->string('original_name');
            $table->string('file_path');
            $table->string('mime_type');
            $table->unsignedBigInteger('file_size'); // in bytes
            $table->string('disk')->default('local');
            $table->foreignId('uploaded_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->index(['opportunity_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('opportunity_attachments');
    }
};
