<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, $permission): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['status' => false, 'message' => 'Unauthorized'], 401);
        }

        // Super Admin bypass: Main Admin always passes
        if ($user->id === 1 || $user->phone === '777777777') {
            return $next($request);
        }

        if (!$user->hasPermission($permission)) {
            return response()->json([
                'status' => false, 
                'message' => 'ليس لديك صلاحية للوصول إلى هذه البيانات',
            ], 403);
        }

        return $next($request);
    }
}
