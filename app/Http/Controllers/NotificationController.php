<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Get user notifications
     * Supports pagination and filtering by unread status
     */
    public function index(Request $request)
    {
        $user = auth()->user();

        $query = $user->notifications();

        if ($request->has('unread_only') && $request->unread_only) {
            $query->unread();
        }

        $notifications = $query->paginate(20);

        return $this->paginatedResponse($notifications, 'data_retrieved');
    }

    /**
     * Get unread notifications count
     */
    public function unreadCount()
    {
        $count = auth()->user()->unreadNotifications()->count();

        return $this->successResponse(['count' => $count], 'data_retrieved');
    }

    /**
     * Mark a specific notification as read
     */
    public function markAsRead($id)
    {
        $notification = auth()->user()->notifications()->find($id);

        if ($notification) {
            $notification->markAsRead();
            return $this->successResponse(null, 'notification_marked_as_read');
        }

        return $this->errorResponse('notification_not_found', 404);
    }

    /**
     * Mark all notifications as read for the user
     */
    public function markAllAsRead()
    {
        auth()->user()->unreadNotifications->markAsRead();

        return $this->successResponse(null, 'all_notifications_marked_as_read');
    }
}
