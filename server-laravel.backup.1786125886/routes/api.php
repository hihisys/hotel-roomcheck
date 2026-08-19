<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AgentController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\APIController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::prefix('api')->group(function () {
    
    /* ========== 인증 (공개) ========== */
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/agency-login', [AuthController::class, 'agencyLogin']);
    Route::post('/logout', [AuthController::class, 'logout']);
    
    /* ========== 인증 필요 ========== */
    Route::middleware('auth:api')->group(function () {
        
        /* 사용자 정보 */
        Route::get('/me', [AuthController::class, 'me']);
        Route::patch('/me', [AuthController::class, 'updateProfile']);
        
        /* 에이전트 */
        Route::get('/agents',

Route::get('/agents', [AgentController::class, 'getAgents']);
        Route::get('/state', [AgentController::class, 'getState']);
        Route::post('/sync', [AgentController::class, 'sync']);
        Route::post('/delete', [AgentController::class, 'delete']);

        /* 알림 */
        Route::post('/notif-read', [APIController::class, 'notifRead']);

        /* 휴무일 */
        Route::post('/my-offdays', [AgentController::class, 'setOffdays']);

        /* 조회 */
        Route::get('/agencies', [APIController::class, 'getAgencies']);
        Route::get('/hotels', [APIController::class, 'getHotels']);

        /* 텔레그램 */
        Route::get('/tg-link', [APIController::class, 'getTgLink']);

        /* ========== 관리자 ========== */
        Route::middleware('role:admin')->group(function () {
            Route::get('/admin/users', [AdminController::class, 'getUsers']);
            Route::post('/admin/create-user', [AdminController::class, 'createUser']);
            Route::post('/admin/setrole', [AdminController::class, 'setRole']);
            Route::post('/admin/decide', [AdminController::class, 'decide']);
            Route::post('/admin/offdays', [AdminController::class, 'setOffdays']);
            Route::post('/admin/tg-link', [AdminController::class, 'setTgLink']);
            Route::post('/admin/tg-reset', [AdminController::class, 'resetTg']);
            Route::get('/admin/stats', [AdminController::class, 'getStats']);
        });
    });

    /* 텔레그램 웹훅 (공개) */
    Route::post('/tg-webhook', [APIController::class, 'tgWebhook']);

    /* 크론 작업 */
    Route::match(['get', 'post'], '/cron', [APIController::class, 'cron']);
});
