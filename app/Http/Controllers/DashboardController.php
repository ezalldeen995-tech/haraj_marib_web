<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function stats()
    {
        $now = now();
        $startOfMonth = $now->copy()->startOfMonth();

        $usersCount = \App\Models\User::where('created_at', '>=', $startOfMonth)->count();

        $adsActive = \App\Models\Ad::where('status', 'active')->count();
        $adsPending = \App\Models\Ad::where('status', 'pending')->count();

        $revenue = \App\Models\Payment::where('status', 'approved')->sum('amount');

        return $this->successResponse([
            'users_this_month' => $usersCount,
            'ads' => [
                'active' => $adsActive,
                'pending' => $adsPending,
            ],
            'payments' => [
                'revenue' => (float) $revenue,
            ],
        ], 'data_retrieved');
    }
}
