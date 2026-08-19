<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('meta', function (Blueprint $table) {
            $table->string('k', 40)->primary();
            $table->longText('v');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('meta');
    }
};
