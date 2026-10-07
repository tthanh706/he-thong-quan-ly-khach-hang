<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * S2-02: Bổ sung thông tin hồ sơ cá nhân và chữ ký email cho người dùng.
 */
return new class extends Migration {
    private const COLUMNS = ['phone', 'job_title', 'email_signature'];

    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            if (!Schema::hasColumn('users', 'phone')) {
                $table->string('phone', 20)->nullable()->after('email');
            }

            if (!Schema::hasColumn('users', 'job_title')) {
                $table->string('job_title', 150)->nullable()->after('phone');
            }

            if (!Schema::hasColumn('users', 'email_signature')) {
                $table->text('email_signature')->nullable()->after('job_title');
            }
        });
    }

    public function down(): void
    {
        $existingColumns = array_values(array_filter(
            self::COLUMNS,
            static fn (string $column): bool => Schema::hasColumn('users', $column),
        ));

        if ($existingColumns !== []) {
            Schema::table('users', function (Blueprint $table) use ($existingColumns): void {
                $table->dropColumn($existingColumns);
            });
        }
    }
};
