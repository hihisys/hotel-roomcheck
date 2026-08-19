<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Notification;
use App\Models\Meta;
use Illuminate\Http\Request;

class APIController extends Controller
{
    /**
     * 알림 읽음 표시
     */
    public function notifRead(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'unauthorized'], 401);
        }

        $user->update(['notif_read_at' => now()->getTimestampMs()]);

        return response()->json(['ok' => true]);
    }

    /**
     * 에이전시 목록 조회
     */
    public function getAgencies(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'unauthorized'], 401);
        }

        // 향후 외부 API에서 에이전시 목록 조회
        $agencies = Meta::where('k', 'agencies')->first();
        
        if ($agencies) {
            return response()->json(['agencies' => json_decode($agencies->v, true)]);
        }

        return response()->json(['agencies' => []]);
    }

    /**
     * 호텔 목록 조회
     */
    public function getHotels(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'unauthorized'], 401);
        }

        // 향후 외부 API에서 호텔 목록 조회
        $hotels = Meta::where('k', 'hotels')->first();
        
        if ($hotels) {
            return response()->json(['hotels' => json_decode($hotels->v, true)]);
        }

        return response()->json(['hotels' => []]);
    }

    /**
     * 텔레그램 링크 생성
     */
    public function getTgLink(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'unauthorized'], 401);
        }

        // 링크 코드 생성
        $linkCode = substr(md5($user->id . time()), 0, 10);
        $user->update(['tg_link_code' => $linkCode]);

        return response()->json([
            'ok' => true,
            'link_code' => $linkCode,
            'tg_bot_url' => 'https://t.me/your_bot?start=' . $linkCode,
        ]);
    }

    /**
     * 텔레그램 웹훅 (공개)
     */
    public function tgWebhook(Request $request)
    {
        $data = $request->all();

        // 향후 텔레그램 메시지 처리 구현
        if (isset($data['message']['text'])) {
            $text = $data['message']['text'];
            
            // /start 명령 처리
            if (strpos($text, '/start') === 0) {
                $linkCode = trim(substr($text, 6));
                // 링크 코드로 사용자 찾기
                $user = User::where('tg_link_code', $linkCode)->first();
                if ($user) {
                    $user->update([
                        'telegram_chat_id' => $data['message']['chat']['id'],
                        'tg_link_code' => null,
                    ]);
                }
            }
        }

        return response()->json(['ok' => true]);
    }

    /**
     * 크론 작업 (정기 실행)
     */
    public function cron(Request $request)
    {
        // 인증 토큰 확인 (env에서)
        $cronSecret = env('CRON_SECRET', 'secret');
        if ($request->header('X-Cron-Secret') !== $cronSecret) {
            return response()->json(['error' => 'unauthorized'], 401);
        }

        $tasks = [
            'cleanup_old_data' => $this->cleanupOldData(),
            'send_notifications' => $this->sendNotifications(),
            'sync_agencies' => $this->syncAgencies(),
        ];

        return response()->json(['ok' => true, 'tasks' => $tasks]);
    }

    /**
     * 오래된 데이터 정리
     */
    private function cleanupOldData()
    {
        $thirtyDaysAgo = now()->subDays(30)->getTimestampMs();
        $deleted = \App\Models\Request::where('deleted', 1)
            ->where('updated_at', '<', $thirtyDaysAgo)
            ->delete();

        return ['deleted_records' => $deleted];
    }

    /**
     * 알림 발송
     */
    private function sendNotifications()
    {
        $notifications = Notification::where('created_at', '>', now()->subHours(1)->getTimestampMs())->get();
        
        // 향후 알림 발송 로직 구현 (Telegram, Email 등)
        return ['sent' => $notifications->count()];
    }

    /**
     * 에이전시 데이터 동기화
     */
    private function syncAgencies()
    {
        // 향후 외부 API에서 에이전시 데이터 동기화
        return ['synced' => 0];
    }
}
