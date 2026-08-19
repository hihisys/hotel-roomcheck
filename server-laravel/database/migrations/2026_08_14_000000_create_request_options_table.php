<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('request_options', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('request_id');
            $table->integer('priority')->default(1);
            $table->integer('hotel_idx');
            $table->integer('roomtype');
            $table->string('status')->default('pending');
            $table->decimal('price_per_night', 10, 2)->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('confirmed_at')->nullable();
            $table->unsignedBigInteger('confirmed_by')->nullable();
            $table->timestamps();
            $table->unique(['request_id', 'priority']);
            $table->index(['request_id', 'status']);
            $table->foreign('request_id')->references('id')->on('requests')->onDelete('cascade');
            $table->foreign('confirmed_by')->references('id')->on('users')->onDelete('set null');
        });
    }
    public function down(): void {
        Schema::dropIfExists('request_options');
    }
};
