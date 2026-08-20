<?php

namespace App\Http\Controllers\API;

use App\Models\AppNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

/**
 * In-app notifications CRUD for the authenticated user.
 *
 * Endpoints:
 *   GET    /notifications          — paginated list (newest first)
 *   GET    /notifications/unread-count — { count: N }
 *   PATCH  /notifications/{id}/read   — mark one as read
 *   POST   /notifications/read-all    — mark all unread as read
 */
class NotificationController extends Controller
{
    /**
     * Paginated list of the authenticated user's notifications.
     */
    public function index(Request $request): JsonResponse
    {
        $notifications = AppNotification::where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json($notifications);
    }

    /**
     * Count of unread notifications for the badge dot.
     */
    public function unreadCount(Request $request): JsonResponse
    {
        $count = AppNotification::where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->count();

        return response()->json(['count' => $count]);
    }

    /**
     * Mark a single notification as read.
     */
    public function markRead(Request $request, int $id): JsonResponse
    {
        $notification = AppNotification::where('user_id', $request->user()->id)
            ->where('id', $id)
            ->firstOrFail();

        if (!$notification->read_at) {
            $notification->update(['read_at' => now()]);
        }

        return response()->json($notification);
    }

    /**
     * Mark all of the user's unread notifications as read.
     */
    public function markAllRead(Request $request): JsonResponse
    {
        $updated = AppNotification::where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['updated' => $updated]);
    }
}
