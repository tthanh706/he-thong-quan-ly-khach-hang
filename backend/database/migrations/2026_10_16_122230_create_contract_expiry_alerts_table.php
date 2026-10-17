<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create(
            'contract_expiry_alerts',
            function (Blueprint $table) {
                $table->id();

                $table->foreignId('contract_id')
                    ->constrained('contracts')
                    ->cascadeOnDelete();

                $table->foreignId('recipient_user_id')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();

                $table->string('type', 30);

                $table->text('message');

                $table->timestamp('detected_at');

                $table->timestamp('read_at')
                    ->nullable();

                $table->timestamps();

                $table->unique(
                    [
                        'contract_id',
                        'type',
                    ],
                    'uq_contract_expiry_alert_contract_type'
                );

                $table->index(
                    'recipient_user_id',
                    'idx_contract_expiry_alert_recipient'
                );

                $table->index(
                    'detected_at',
                    'idx_contract_expiry_alert_detected_at'
                );
            }
        );
    }

    public function down(): void
    {
        Schema::dropIfExists(
            'contract_expiry_alerts'
        );
    }
};