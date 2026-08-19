<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * 객실 수 관련 컬럼 추가 (2026-08-16)
     *  - rooms       : 요청자가 이 후보에만 따로 지정한 객실 수. NULL이면 요청 기본 객실 수를 따름
     *  - avail_rooms : 확인자가 입력한 실제 예약 가능 객실 수. NULL이면 요청 객실 수 전량 가능
     */
    public function up(): void
    {
        Schema::table('request_options', function (Blueprint $table) {
            $table->integer('rooms')->nullable()->after('roomtype');
            $table->integer('avail_rooms')->nullable()->after('price_per_night');
        });
    }

    public function down(): void
    {
        Schema::table('request_options', function (Blueprint $table) {
            $table->dropColumn(['rooms', 'avail_rooms']);
        });
    }
};
