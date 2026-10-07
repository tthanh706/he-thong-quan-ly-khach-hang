<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
 public function up(): void {
   Schema::table('users', function (Blueprint $table) {
     if (!Schema::hasColumn('users','business_group')) $table->string('business_group')->nullable()->after('email');
     if (!Schema::hasColumn('users','role')) $table->string('role')->default('sales')->after('password');
     if (!Schema::hasColumn('users','status')) $table->enum('status',['pending','active','inactive'])->default('pending')->after('role');
     if (!Schema::hasColumn('users','activated_at')) $table->timestamp('activated_at')->nullable()->after('status');
   });
 }
 public function down(): void {}
};
