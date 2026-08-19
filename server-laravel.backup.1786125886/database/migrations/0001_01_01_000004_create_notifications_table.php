<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->string('role', 10);
            $table->bigInteger('exclude_user')->nullable();
            $table->string('type', 30);
            $table->string('req_no', 12)->nullable();
            $table->longText('params')->nullable();
            $table->bigInteger('created_at');
            $table->index(['role']);
            $table->index(['type']);
            $table->index(['created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
