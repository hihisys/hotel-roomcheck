<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Request as RequestModel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AgentController extends Controller
{
    /**
     * 에이전트 목록 조회
     */
    public function getAgents(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'unauthorized'], 401);
        }

        $agents = User::where('role', 'agent')
            ->where('status', 'approved')
            ->select('id', 'name', 'email', 'phone', 'nickname', 'region', 'created_at')
            ->get();

        return response()->json(['agents' => $agents]);
    }

    /**
     * 상태 조회
     */
    public function getState(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'unauthorized'], 401);
        }

        $stats = [
            'total_agents' => User::where('role', 'agent')->count(),
            'approved_agents' => User::where('role', 'agent')->where('status', 'approved')->count(),
            'pending_agents' => User::where('role', 'agent')->where('status', 'pending')->count(),
            'total_requests' => RequestModel::where('deleted', 0)->count(),
        ];

        return response()->json($stats);
    }

    /**
     * 동기화 (외부 API 데이터 동기화)
     */
    public function sync(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'unauthorized'], 401);
        }

        $validated = $request->validate([
            'agency_idx' => 'required|integer',
            'data' => 'required|array',
        ]);

        // 향후 에이전시 API 동기화 구현
        return response()->json(['ok' => true, 'synced' => 0]);
    }

    /**
     * 항목 삭제
     */
    public function delete(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'unauthorized'], 401);
        }

        $validated = $request->validate([
            'type' => 'required|in:request,user',
            'id' => 'required|integer',
        ]);

        if ($validated['type'] === 'request') {
            $req = RequestModel::find($validated['id']);
            if ($req && ($req->created_by === $user->id || $user->role === 'admin')) {
                $req->update(['deleted' => 1]);
                return response()->json(
cat > app/Http/Controllers/AgentController.php << 'EOF'
<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Request as RequestModel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AgentController extends Controller
{
    /**
     * 에이전트 목록 조회
     */
    public function getAgents(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'unauthorized'], 401);
        }

        $agents = User::where('role', 'agent')
            ->where('status', 'approved')
            ->select('id', 'name', 'email', 'phone', 'nickname', 'region', 'created_at')
            ->get();

        return response()->json(['agents' => $agents]);
    }

    /**
     * 상태 조회
     */
    public function getState(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'unauthorized'], 401);
        }

        $stats = [
            'total_agents' => User::where('role', 'agent')->count(),
            'approved_agents' => User::where('role', 'agent')->where('status', 'approved')->count(),
            'pending_agents' => User::where('role', 'agent')->where('status', 'pending')->count(),
            'total_requests' => RequestModel::where('deleted', 0)->count(),
        ];

        return response()->json($stats);
    }

    /**
     * 동기화 (외부 API 데이터 동기화)
     */
    public function sync(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'unauthorized'], 401);
        }

        $validated = $request->validate([
            'agency_idx' => 'required|integer',
            'data' => 'required|array',
        ]);

        // 향후 에이전시 API 동기화 구현
        return response()->json(['ok' => true, 'synced' => 0]);
    }

    /**
     * 항목 삭제
     */
    public function delete(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'unauthorized'], 401);
        }

        $validated = $request->validate([
            'type' => 'required|in:request,user',
            'id' => 'required|integer',
        ]);

        if ($validated['type'] === 'request') {
            $req = RequestModel::find($validated['id']);
            if ($req && ($req->created_by === $user->id || $user->role === 'admin')) {
                $req->update(['deleted' => 1]);
                return response()->json(['ok' => true]);
            }
        }

        return response()->json(['error' => 'not_found'], 404);
    }

    /**
     * 휴무일 설정
     */
    public function setOffdays(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'unauthorized'], 401);
        }

        $validated = $request->validate([
            'dates' => 'array|nullable',
            'weekdays' => 'array|nullable',
        ]);

        $offDays = [
            'dates' => $validated['dates'] ?? [],
            'weekdays' => $validated['weekdays'] ?? [],
        ];

        $user->update(['off_days' => json_encode($offDays)]);

        return response()->json(['ok' => true, 'off_days' => $offDays]);
    }
}
