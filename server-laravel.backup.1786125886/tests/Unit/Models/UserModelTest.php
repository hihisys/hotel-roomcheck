<?php

namespace Tests\Unit\Models;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_user_with_required_fields()
    {
        $user = User::create([
            'name' => '테스트 사용자',
            'email' => 'test@example.com',
            'pass_hash' => \Illuminate\Support\Facades\Hash::make('password'),
            'role' => 'agent',
            'status' => 'pending',
            'lang' => 'ko',
            'created_at' => now()->getTimestamp(),
        ]);

        $this->assertDatabaseHas('users', [
            'email' => 'test@example.com',
            'role' => 'agent',
        ]);
    }

    public function test_user_email_must_be_unique()
    {
        User::create([
            'name' => 'User 1',
            'email' => 'test@example.com',
            'pass_hash' => \Illuminate\Support\Facades\Hash::make('password'),
            'role' => 'agent',
            'status' => 'pending',
            'lang' => 'ko',
            'created_at' => now()->getTimestamp(),
        ]);

        $this->expectException(\Illuminate\Database\QueryException::class);
        User::create([
            'name' => 'User 2',
            'email' => 'test@example.com',
            'pass_hash' => \Illuminate\Support\Facades\Hash::make('password'),
            'role' => 'agent',
            'status' => 'pending',
            'lang' => 'ko',
            'created_at' => now()->getTimestamp(),
        ]);
    }

    public function test_user_language_defaults_to_korean()
    {
        $user = User::create([
            'name' => 'Default Lang User',
            'email' => 'lang@example.com',
            'pass_hash' => \Illuminate\Support\Facades\Hash::make('password'),
            'role' => 'agent',
            'lang' => 'ko',
            'created_at' => now()->getTimestamp(),
        ]);

        $this->assertEquals('ko', $user->lang);
    }

    public function test_user_status_defaults_to_pending()
    {
        $user = User::create([
            'name' => 'Pending User',
            'email' => 'pending@example.com',
            'pass_hash' => \Illuminate\Support\Facades\Hash::make('password'),
            'role' => 'agent',
            'status' => 'pending',
            'created_at' => now()->getTimestamp(),
        ]);

        $this->assertEquals('pending', $user->status);
    }
}
