<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name', 80);
            $table->string('email', 190)->unique();
            $table->string('pass_hash', 255);
            $table->string('role', 10);
            $table->string('status', 10)->default('pending');
            $table->string('lang', 5)->default('ko');
            $table->string('telegram_chat_id', 40)->nullable();
            $table->string('tg_link_code', 40)->nullable();
            $table->bigInteger('notif_read_at')->default(0);
            $table->bigInteger('agency_idx')->nullable();
            $table->bigInteger('agency_parent_idx')->nullable();
            $table->string('agency_kind', 20)->nullable();
            $table->string('agency_login_id', 120)->nullable();
            $table->string('phone', 40)->nullable();
            $table->string('nickname', 80)->nullable();
            $table->text('bank_account')->nullable();
            $table->string('orig_role', 10)->nullable();
            $table->longText('off_days')->nullable();
            $table->string('region', 20)->nullable();
            $table->bigInteger('created_at');
            $table->index(['email']);
            $table->index(['role']);
            $table->index(['status']);
            $table->index(['agency_idx']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
