<?php
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AgentController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\APIController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::middleware('auth:api')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::patch('/me', [AuthController::class, 'updateProfile']);
    Route::get('/agents', [AgentController::class, 'getAgents']);
    Route::get('/state', [AgentController::class, 'getState']);
    Route::post('/sync', [AgentController::class, 'sync']);
    Route::post('/delete', [AgentController::class, 'delete']);
    Route::post('/my-offdays', [AgentController::class, 'setOffdays']);
    Route::get('/agencies', [AgentController::class, 'getAgencies']);
    Route::get('/hotels', [AgentController::class, 'getHotels']);
    Route::post('/notif-read', [APIController::class, 'notifRead']);
    Route::get('/tg-link', [APIController::class, 'getTgLink']);
});
Route::middleware('auth:api', 'role:admin')->group(function () {
    Route::get('/admin/users', [AdminController::class, 'getUsers']);
    Route::post('/admin/create-user', [AdminController::class, 'createUser']);
    Route::post('/admin/setrole', [AdminController::class, 'setRole']);
    Route::post('/admin/decide', [AdminController::class, 'decide']);
    Route::post('/admin/offdays', [AdminController::class, 'setOffdays']);
    Route::post('/admin/tg-link', [AdminController::class, 'setTgLink']);
    Route::post('/admin/tg-reset', [AdminController::class, 'resetTgLink']);
    Route::get('/admin/stats', [AdminController::class, 'getStats']);
});
Route::post('/tg-webhook', [APIController::class, 'tgWebhook']);
Route::middleware('cron.secret')->group(function () {
    Route::get('/cron', [APIController::class, 'cron']);
    Route::post('/cron', [APIController::class, 'cronPost']);
});
