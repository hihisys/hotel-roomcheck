<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Request as RequestModel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminController extends Controller
{
    /**
     * 사용자 목록 (관리자만)
     */
    public function getUsers(Request $request)
    {
        $user = $request->user();
        if (!$user || $user->role !== 'admin') {
            return response()->json(['error' => 'forbidden'], 403);
        }

        $users = User::select('id', 'name', 'email', 'role', 'status', 'created_at')->get();
        return response()->json(['users' => $users]);
    }

    /**
     * 사용자 생성 (관리자만)
     */
    public function createUser(Request $request)
    {
        $user = $request->user();
        if (!$user || $user->role !== 'admin') {
            return response()->json(['error' => 'forbidden'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:80',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:6',
            'role' => 'required|in:agent,sreq,schk,admin',
        ]);

        $newUser = User::create([
            'name' => $validated['name'],
            'email' => strtolower($validated['email']),
            'pass_hash' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'status' => 'approved',
            'lang' => 'ko',
            'created_at' => now()->getTimestampMs(),
        ]);

        return response()->json(['ok' => true, 'user' => $newUser], 201);
    }

    /**
     * 역할 설정 (관리자만)
     */
    public function setRole(Request $request)
    {
        $admin = $request->user();
        if (!$admin || $admin->role !== 'admin') {
            return response()->json(['error' => 'forbidden'], 403);
        }

        $validated = $request->validate([
            'user_id' => 'required|integer|exists:users,id',
            'role' => 'required|in:agent,sreq,schk,admin',
        ]);

        $targetUser = User::find($validated['user_id']);
        if (!$targetUser) {
            return response()->json(['error' => 'user_not_found'], 404);
        }

        if ($targetUser->orig_role === null) {
            $targetUser->update(['orig_role' => $targetUser->role]);
        }

        $targetUser->update(['role' => $validated['role']]);

        return response()->json(['ok' => true]);
    }

    /**
     * 승인/거절 (관리자만)
     */
    public function decide(Request $request)
    {
        $admin = $request->user();
        if (!$admin || $admin->role !== 'admin') {
            return response()->json(['error' => 'forbidden'], 403);
        }

        $validated = $request->validate([
            'user_id' => 'required|integer|exists:users,id',
            'status' => 'required|in:approved,rejected',
        ]);

        $targetUser = User::find($validated['user_id']);
        if (!$targetUser) {
cat > app/Http/Controllers/AdminController.php << 'EOF'
<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Request as RequestModel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminController extends Controller
{
    /**
     * 사용자 목록 (관리자만)
     */
    public function getUsers(Request $request)
    {
        $user = $request->user();
        if (!$user || $user->role !== 'admin') {
            return response()->json(['error' => 'forbidden'], 403);
        }

        $users = User::select('id', 'name', 'email', 'role', 'status', 'created_at')->get();
        return response()->json(['users' => $users]);
    }

    /**
     * 사용자 생성 (관리자만)
     */
    public function createUser(Request $request)
    {
        $user = $request->user();
        if (!$user || $user->role !== 'admin') {
            return response()->json(['error' => 'forbidden'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:80',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:6',
            'role' => 'required|in:agent,sreq,schk,admin',
        ]);

        $newUser = User::create([
            'name' => $validated['name'],
            'email' => strtolower($validated['email']),
            'pass_hash' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'status' => 'approved',
            'lang' => 'ko',
            'created_at' => now()->getTimestampMs(),
        ]);

        return response()->json(['ok' => true, 'user' => $newUser], 201);
    }

    /**
     * 역할 설정 (관리자만)
     */
    public function setRole(Request $request)
    {
        $admin = $request->user();
        if (!$admin || $admin->role !== 'admin') {
            return response()->json(['error' => 'forbidden'], 403);
        }

        $validated = $request->validate([
            'user_id' => 'required|integer|exists:users,id',
            'role' => 'required|in:agent,sreq,schk,admin',
        ]);

        $targetUser = User::find($validated['user_id']);
        if (!$targetUser) {
            return response()->json(['error' => 'user_not_found'], 404);
        }

        if ($targetUser->orig_role === null) {
            $targetUser->update(['orig_role' => $targetUser->role]);
        }

        $targetUser->update(['role' => $validated['role']]);

        return response()->json(['ok' => true]);
    }

    /**
     * 승인/거절 (관리자만)
     */
    public function decide(Request $request)
    {
        $admin = $request->user();
        if (!$admin || $admin->role !== 'admin') {
            return response()->json(['error' => 'forbidden'], 403);
        }

        $validated = $request->validate([
            'user_id' => 'required|integer|exists:users,id',
            'status' => 'required|in:approved,rejected',
        ]);

        $targetUser = User::find($validated['user_id']);
        if (!$targetUser) {
            return response()->json(['error' => 'user_not_found'], 404);
        }

        $targetUser->update(['status' => $validated['status']]);

        return response()->json(['ok' => true]);
    }

    /**
     * 휴무일 설정 (관리자만)
     */
    public function setOffdays(Request $request)
    {
        $admin = $request->user();
        if (!$admin || $admin->role !== 'admin') {
            return response()->json(['error' => 'forbidden'], 403);
        }

        $validated = $request->validate([
            'user_id' => 'required|integer|exists:users,id',
            'dates' => 'array|nullable',
            'weekdays' => 'array|nullable',
        ]);

        $targetUser = User::find($validated['user_id']);
        if (!$targetUser) {
            return response()->json(['error' => 'user_not_found'], 404);
        }

        $offDays = [
            'dates' => $validated['dates'] ?? [],
            'weekdays' => $validated['weekdays'] ?? [],
        ];

        $targetUser->update(['off_days' => json_encode($offDays)]);

        return response()->json(['ok' => true, 'off_days' => $offDays]);
    }

    /**
     * 텔레그램 링크 (관리자만)
     */
    public function setTgLink(Request $request)
    {
        $admin = $request->user();
        if (!$admin || $admin->role !== 'admin') {
            return response()->json(['error' => 'forbidden'], 403);
        }

        $validated = $request->validate([
            'user_id' => 'required|integer|exists:users,id',
            'telegram_chat_id' => 'required|string',
        ]);

        $targetUser = User::find($validated['user_id']);
        if (!$targetUser) {
            return response()->json(['error' => 'user_not_found'], 404);
        }

        $targetUser->update(['telegram_chat_id' => $validated['telegram_chat_id']]);

        return response()->json(['ok' => true]);
    }

    /**
     * 텔레그램 리셋 (관리자만)
     */
    public function resetTg(Request $request)
    {
        $admin = $request->user();
        if (!$admin || $admin->role !== 'admin') {
            return response()->json(['error' => 'forbidden'], 403);
        }

        $validated = $request->validate([
            'user_id' => 'required|integer|exists:users,id',
        ]);

        $targetUser = User::find($validated['user_id']);
        if (!$targetUser) {
            return response()->json(['error' => 'user_not_found'], 404);
        }

        $targetUser->update([
            'telegram_chat_id' => null,
            'tg_link_code' => null,
        ]);

        return response()->json(['ok' => true]);
    }

    /**
     * 통계 (관리자만)
     */
    public function getStats(Request $request)
    {
        $admin = $request->user();
        if (!$admin || $admin->role !== 'admin') {
            return response()->json(['error' => 'forbidden'], 403);
        }

        $stats = [
            'total_users' => User::count(),
            'agents' => User::where('role', 'agent')->count(),
            'sreq' => User::where('role', 'sreq')->count(),
            'schk' => User::where('role', 'schk')->count(),
            'approved' => User::where('status', 'approved')->count(),
            'pending' => User::where('status', 'pending')->count(),
            'rejected' => User::where('status', 'rejected')->count(),
            'total_requests' => RequestModel::where('deleted', 0)->count(),
        ];

        return response()->json($stats);
    }
}
