<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('requests', function (Blueprint $table) {
            $table->bigInteger('id')->primary();
            $table->integer('no');
            $table->longText('payload');
            $table->tinyInteger('deleted')->default(0);
            $table->bigInteger('created_by')->nullable();
            $table->bigInteger('updated_at');
            $table->bigInteger('updated_by')->nullable();
            $table->index(['no']);
            $table->index(['deleted']);
            $table->index(['created_by']);
            $table->index(['updated_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('requests');
    }
};
