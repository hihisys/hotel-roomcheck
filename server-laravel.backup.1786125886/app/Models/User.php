<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    public $timestamps = false;

    protected $fillable = [
        'name',
        'email',
        'pass_hash',
        'role',
        'status',
        'lang',
        'telegram_chat_id',
        'tg_link_code',
        'notif_read_at',
        'agency_idx',
        'agency_parent_idx',
        'agency_kind',
        'agency_login_id',
        'phone',
        'nickname',
        'bank_account',
        'orig_role',
        'off_days',
        'region',
        'created_at',
    ];

    protected $hidden = [
        'pass_hash',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
}
