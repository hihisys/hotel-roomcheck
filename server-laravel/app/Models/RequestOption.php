<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RequestOption extends Model
{
    protected $table = 'request_options';

    protected $fillable = [
        'request_id',
        'priority',
        'hotel_idx',
        'roomtype',
        'rooms',          // 요청자가 이 후보에만 지정한 객실 수 (NULL = 요청 기본값 상속)
        'status',
        'price_per_night',
        'avail_rooms',    // 확인자가 입력한 실제 가능 객실 수 (NULL = 요청 객실 수 전량)
        'notes',
        'confirmed_by',
        'confirmed_at'
    ];

    protected $casts = [
        'confirmed_at' => 'datetime',
        'price_per_night' => 'decimal:2',
        'rooms' => 'integer',
        'avail_rooms' => 'integer',
    ];

    /**
     * 요청 정보 관계
     */
    public function request()
    {
        return $this->belongsTo(Request::class);
    }

    /**
     * 확인자 정보 관계
     */
    public function confirmedByUser()
    {
        return $this->belongsTo(User::class, 'confirmed_by');
    }

    /**
     * 이 후보에 실제 적용되는 객실 수.
     * rooms 가 없으면 요청 payload 의 기본 객실 수(rooms)를 따른다.
     */
    public function effectiveRooms(?int $baseRooms = null): int
    {
        if ($this->rooms !== null && $this->rooms > 0) {
            return $this->rooms;
        }
        return max(1, (int) ($baseRooms ?? 1));
    }

    /**
     * 확인자 기준 예약 가능 객실 수.
     */
    public function effectiveAvailRooms(?int $baseRooms = null): int
    {
        if ($this->avail_rooms !== null && $this->avail_rooms > 0) {
            return $this->avail_rooms;
        }
        return $this->effectiveRooms($baseRooms);
    }

    /**
     * 배열 형식으로 포맷
     */
    public function toArray()
    {
        return [
            'id' => $this->id,
            'priority' => $this->priority,
            'hotel_idx' => $this->hotel_idx,
            'roomtype' => $this->roomtype,
            'rooms' => $this->rooms,
            'status' => $this->status,
            'price_per_night' => $this->price_per_night,
            'avail_rooms' => $this->avail_rooms,
            'notes' => $this->notes,
            'confirmed_by' => $this->confirmed_by,
            'confirmed_at' => $this->confirmed_at ? $this->confirmed_at->timestamp : null
        ];
    }
}
