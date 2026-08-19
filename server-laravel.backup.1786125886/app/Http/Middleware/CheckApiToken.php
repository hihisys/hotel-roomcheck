<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;

class CheckApiToken extends Middleware
{
    public function handle(Request $request, Closure $next): Response
    {
        // Bearer 토큰 확인
        $token = $request->bearerToken();
        if (!$token) {
            return response()->json(['error' => 'unauthorized'], 401);
        }

        // 향후 토큰 검증 로직 추가 예정
        return $next($request);
    }
}
