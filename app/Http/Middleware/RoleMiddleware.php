<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $role): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => __('messages.unauthorized')], 403);
        }

        // Super Admin bypass: Main Admin always passes
        if ($user->id === 1 || $user->phone === '777777777') {
            return $next($request);
        }

        // Allow if user has the required role
        if ($user->role === $role) {
            return $next($request);
        }

        // Allow if user has ANY permissions (they are a sub-admin)
        if ($user->permissions()->exists()) {
            return $next($request);
        }

        return response()->json(['message' => __('messages.unauthorized')], 403);
    }
}
