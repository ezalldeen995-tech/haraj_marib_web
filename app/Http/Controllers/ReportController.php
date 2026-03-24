<?php

namespace App\Http\Controllers;

use App\Models\Report;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    /**
     * Submit a report against an ad.
     * POST /reports
     */
    public function store(Request $request)
    {
        $request->validate([
            'ad_id' => 'required|integer|exists:ads,id',
            'reason' => 'required|string|max:1000',
        ]);

        $user = $request->user();

        // Prevent reporting own ad
        $ad = \App\Models\Ad::find($request->ad_id);
        if ($ad && $ad->user_id === $user->id) {
            return $this->errorResponse('لا يمكنك الإبلاغ عن إعلانك الخاص', 403);
        }

        $report = Report::create([
            'ad_id' => $request->ad_id,
            'reporter_id' => $user->id,
            'reason' => $request->reason,
            'status' => 'pending',
        ]);

        return $this->successResponse($report, 'Report submitted', 201);
    }
}
