<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class AuthController extends Controller
{
    /**
     * 회원가입
     */
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:80',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:6',
            'role' => 'required|in:agent,sreq,schk',
            'lang' => 'string|in:ko,en,th',
        ]);

        $lang = $validated['lang'] ?? 'ko';
        $allowed = [
            'agent' => ['ko'],
            'sreq' => ['en', 'ko'],
            'schk' => ['th', 'en']
        ];
        
        if (!in_array($lang, $allowed[$validated['role']] ?? [])) {
            $lang = $allowed[$validated['role']][0];
        }

        $user = User::create([
            'name' => $validated['name'],
            'email' => strtolower($validated['email']),
            'pass_hash' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'lang' => $lang,
            'status' => 'pending',
            'created_at' =>
cat > app/Http/Controllers/AuthController.php << 'EOF'
<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class AuthController extends Controller
{
    /**
     * 회원가입
     */
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:80',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:6',
            'role' => 'required|in:agent,sreq,schk',
            'lang' => 'string|in:ko,en,th',
        ]);

        $lang = $validated['lang'] ?? 'ko';
        $allowed = [
            'agent' => ['ko'],
            'sreq' => ['en', 'ko'],
            'schk' => ['th', 'en']
        ];
        
        if (!in_array($lang, $allowed[$validated['role']] ?? [])) {
            $lang = $allowed[$validated['role']][0];
        }

        $user = User::create([
            'name' => $validated['name'],
            'email' => strtolower($validated['email']),
            'pass_hash' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'lang' => $lang,
            'status' => 'pending',
            'created_at' => now()->getTimestampMs(),
        ]);

        return response()->json(['ok' => true, 'pending' => true], 201);
    }

    /**
     * 로그인
     */
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', strtolower($validated['email']))->first();

        if (!$user || !Hash::check($validated['password'], $user->pass_hash)) {
            return response()->json(['error' => 'invalid_credentials'], 401);
        }

        if ($user->status === 'rejected') {
            return response()->json(['error' => 'rejected'], 403);
        }

        // 토큰 생성 (향후 구현)
        $token = $this->generateToken($user);

        return response()->json([
            'ok' => true,
            'token' => $token,
            'user' => $this->publicUser($user),
        ]);
    }

    /**
     * 에이전시 로그인
     */
    public function agencyLogin(Request $request)
    {
        $validated = $request->validate([
            'agency_login_id' => 'required|string',
            'password' => 'required|string',
        ]);

        // 향후 에이전시 API 연동 구현
        return response()->json(['error' => 'not_implemented'], 501);
    }

    /**
     * 로그아웃
     */
    public function logout(Request $request)
    {
        // 토큰 무효화 (향후 구현)
        return response()->json(['ok' => true]);
    }

    /**
     * 현재 사용자 정보
     */
    public function me(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'unauthorized'], 401);
        }

        return response()->json(['user' => $this->publicUser($user)]);
    }

    /**
     * 사용자 정보 수정
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'unauthorized'], 401);
        }

        $validated = $request->validate([
            'nickname' => 'string|max:80',
            'phone' => 'string|max:40',
            'bank_account' => 'string|max:255',
        ]);

        $user->update($validated);

        return response()->json(['ok' => true, 'user' => $this->publicUser($user)]);
    }

    /**
     * 공개 사용자 정보 (보안 필드 제거)
     */
    private function publicUser(User $user)
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'status' => $user->status,
            'lang' => $user->lang,
            'nickname' => $user->nickname,
            'phone' => $user->phone,
        ];
    }

    /**
     * 토큰 생성 (향후 구현)
     */
    private function generateToken(User $user)
    {
        // Laravel Sanctum 또는 JWT 사용 예정
        return 'token_' . $user->id . '_' . now()->timestamp;
    }
}
