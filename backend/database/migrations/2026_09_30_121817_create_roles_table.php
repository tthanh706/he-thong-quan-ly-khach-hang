<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
      Schema::create('roles', function (Blueprint $table) {
    $table->id();
    $table->string('name')->unique(); // vd: admin, team_leader
    $table->string('display_name'); // vd: Quản trị hệ thống, Trưởng nhóm
    $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('roles');
    }
};
