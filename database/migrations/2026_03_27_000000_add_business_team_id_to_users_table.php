<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration 
{
    public function up() 
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'business_team_id')) {
                $table->unsignedBigInteger('business_team_id')->nullable();
            }
        });
    }

    public function down() 
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('business_team_id');
        });
    }
};