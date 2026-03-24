<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Jobs\SendFcmNotification;
use App\Jobs\SendGlobalNotificationJob;
use App\Http\Resources\AdResource;
use App\Notifications\SystemNotification;

class AdminController extends Controller
{

    public function pendingPayments()
    {
        $payments = \App\Models\Payment::with('user')
            ->where('status', 'pending')
            ->get();

        return $this->successResponse($payments, 'data_retrieved');
    }

    public function approvePayment(Request $request, $id)
    {
        $payment = \App\Models\Payment::findOrFail($id);

        if ($payment->status !== 'pending') {
            return $this->errorResponse('invalid_payment_status', 400);
        }

        $payment->status = 'approved';
        $payment->save();

        $user = $payment->user;
        $months = $payment->months ?? 1;
        $now = now();
        if ($user->subscription_ends_at && $now->lt($user->subscription_ends_at)) {
            $user->subscription_ends_at = $user->subscription_ends_at->addMonths($months);
        }
        else {
            $user->subscription_ends_at = $now->addMonths($months);
        }
        $user->save();

        // 1. Database Notification
        $title = __('messages.subscription_activated_title') ?: 'اشتراك مُفعّل';
        $body = __('messages.subscription_activated_body') ?: 'تم تفعيل اشتراكك بنجاح';
        $user->notify(new SystemNotification($title, $body));

        // 2. Dispatch FCM notification to queue (non-blocking)
        if ($user->device_token) {
            SendFcmNotification::dispatch($user, $title, $body);
        }

        return $this->successResponse(null, 'payment_approved');
    }

    public function rejectPayment(Request $request, $id)
    {
        $request->validate([
            'admin_notes' => 'nullable|string',
        ]);

        $payment = \App\Models\Payment::findOrFail($id);
        $payment->status = 'rejected';
        $payment->admin_notes = $request->admin_notes;
        $payment->save();

        $user = $payment->user;

        // 1. Database Notification
        $title = __('messages.payment_rejected_title') ?: 'تم رفض الدفعة';
        $body = __('messages.payment_rejected_body') ?: 'تم رفض دفعة اشتراكك';
        $user->notify(new SystemNotification($title, $body, ['notes' => $payment->admin_notes]));

        // 2. Dispatch FCM notification to queue (non-blocking)
        if ($user->device_token) {
            SendFcmNotification::dispatch($user, $title, $body, ['notes' => $payment->admin_notes]);
        }

        return $this->successResponse(null, 'payment_rejected');
    }

    public function approveAd(Request $request, $id)
    {
        $ad = \App\Models\Ad::findOrFail($id);
        $ad->status = 'active';
        $ad->save();

        // Notification handled by AdObserver (queued)

        return $this->successResponse(null, 'ad_approved');
    }

    public function rejectAd(Request $request, $id)
    {
        $ad = \App\Models\Ad::findOrFail($id);
        $ad->status = 'rejected';
        $ad->save();

        // Notification handled by AdObserver (queued)

        return $this->successResponse(null, 'ad_rejected');
    }

    public function deleteAd($id)
    {
        $ad = \App\Models\Ad::findOrFail($id);
        $ad->delete();

        return $this->successResponse(null, 'ad_deleted');
    }

    public function trashedAds()
    {
        $ads = \App\Models\Ad::onlyTrashed()
            ->with(['user', 'images'])
            ->orderBy('deleted_at', 'desc')
            ->paginate(20);

        return $this->paginatedResponse($ads, 'data_retrieved');
    }

    public function restoreAd($id)
    {
        $ad = \App\Models\Ad::onlyTrashed()->findOrFail($id);
        $ad->restore();

        return $this->successResponse(new AdResource($ad), 'ad_restored');
    }

    public function forceDeleteAd($id)
    {
        $ad = \App\Models\Ad::onlyTrashed()->findOrFail($id);
        $ad->forceDelete(); // triggers booted() image cleanup

        return $this->successResponse(null, 'ad_force_deleted');
    }

    public function logs(Request $request)
    {
        $logs = \App\Models\ActivityLog::with('user')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return $this->paginatedResponse($logs, 'data_retrieved');
    }

    public function settings(Request $request)
    {
        if ($request->isMethod('post')) {
            $data = $request->validate([
                'key' => 'required|string',
                'value' => 'nullable',
            ]);
            \App\Models\Setting::set($data['key'], $data['value']);
            return $this->successResponse(null, 'setting_updated');
        }

        $list = \App\Models\Setting::all();
        return $this->successResponse($list, 'data_retrieved');
    }

    public function users(Request $request)
    {
        $query = \App\Models\User::query();

        if ($request->has('search')) {
            $searchTerm = '%' . $request->search . '%';
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', $searchTerm)
                    ->orWhere('phone', 'like', $searchTerm)
                    ->orWhere('email', 'like', $searchTerm);
            });
        }

        $users = $query->orderBy('created_at', 'desc')->paginate(20);
        return $this->paginatedResponse($users, 'data_retrieved');
    }

    public function toggleBlockUser($id)
    {
        $user = \App\Models\User::findOrFail($id);

        $user->is_blocked = !$user->is_blocked;
        $user->save();

        $status = $user->is_blocked ? 'user_blocked' : 'user_unblocked';
        return $this->successResponse(['is_blocked' => $user->is_blocked], $status);
    }

    public function allAds(Request $request)
    {
        $query = \App\Models\Ad::query()->with(['user', 'category', 'images']);

        if ($request->has('status') && !empty($request->status)) {
            $query->where('status', $request->status);
        }

        if ($request->has('category_id') && !empty($request->category_id)) {
            $query->where('category_id', $request->category_id);
        }

        $ads = $query->orderBy('created_at', 'desc')->paginate(20);

        return $this->paginatedResponse($ads, 'data_retrieved');
    }

    public function contactMessages()
    {
        $messages = \Illuminate\Support\Facades\DB::table('contact_messages')->get();
        return $this->successResponse($messages, 'data_retrieved');
    }

    public function reports(Request $request)
    {
        // Using DB::table for reports to ensure raw data as well, joining ad and reporter names for frontend
        $reports = \Illuminate\Support\Facades\DB::table('reports')
            ->join('users', 'reports.reporter_id', '=', 'users.id')
            ->join('ads', 'reports.ad_id', '=', 'ads.id')
            ->select('reports.*', 'users.name as reporter_name', 'ads.title as ad_title')
            ->orderBy('reports.created_at', 'desc')
            ->get();

        return $this->successResponse($reports, 'data_retrieved');
    }

    public function dismissReport($id)
    {
        $report = \App\Models\Report::findOrFail($id);
        $report->status = 'reviewed';
        $report->save();

        return $this->successResponse(null, 'report_dismissed');
    }

    public function sendNotifications(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:100',
            'body' => 'required|string|max:255',
        ]);

        SendGlobalNotificationJob::dispatch($request->title, $request->body);

        return $this->successResponse(null, 'global_notification_dispatched');
    }

    public function getAnalytics()
    {
        $sevendaysAgo = now()->subDays(7);
        $usersLast7Days = \App\Models\User::where('created_at', '>=', $sevendaysAgo)
            ->selectRaw('DATE(created_at) as date, count(*) as count')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $adsByCategory = \App\Models\Ad::selectRaw('category_id, count(*) as count')
            ->with('category:id,name_en,name_ar')
            ->groupBy('category_id')
            ->get();

        $data = [
            'registrations_last_7_days' => $usersLast7Days,
            'ads_by_category' => $adsByCategory,
        ];

        return $this->successResponse($data, 'analytics_retrieved');
    }
}
