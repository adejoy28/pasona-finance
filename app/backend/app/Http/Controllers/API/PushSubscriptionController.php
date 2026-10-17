<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\PushSubscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PushSubscriptionController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'endpoint' => 'required|string|max:500',
            'keys'     => 'required|array:p256dh,auth',
            'keys.p256dh' => 'required|string',
            'keys.auth'   => 'required|string',
        ]);

        $user = $request->user();

        $subscription = $user->pushSubscriptions()->updateOrCreate(
            ['endpoint' => $data['endpoint']],
            [
                'p256dh' => $data['keys']['p256dh'],
                'auth'   => $data['keys']['auth'],
            ],
        );

        return response()->json($subscription, 201);
    }

    public function destroy(Request $request): JsonResponse
    {
        $data = $request->validate([
            'endpoint' => 'required|string',
        ]);

        $request->user()
            ->pushSubscriptions()
            ->where('endpoint', $data['endpoint'])
            ->delete();

        return response()->json(['message' => 'Unsubscribed']);
    }

    public function vapidKey(): JsonResponse
    {
        $publicKey = env('VAPID_PUBLIC_KEY');
        if (!$publicKey) {
            return response()->json(['status' => 'not_configured', 'publicKey' => null]);
        }
        return response()->json(['status' => 'configured', 'publicKey' => $publicKey]);
    }

    public function sendTest(Request $request): JsonResponse
    {
        $data = $request->validate([
            'subscription' => 'required|array',
            'subscription.endpoint' => 'required|string',
            'subscription.keys' => 'required|array',
            'subscription.keys.p256dh' => 'required|string',
            'subscription.keys.auth' => 'required|string',
            'title' => 'required|string',
            'body' => 'nullable|string',
            'url' => 'nullable|string',
        ]);

        if (!env('VAPID_PUBLIC_KEY') || !env('VAPID_PRIVATE_KEY') || !env('VAPID_SUBJECT')) {
            return response()->json(['message' => 'VAPID keys not configured'], 500);
        }

        $auth = [
            'VAPID' => [
                'subject' => env('VAPID_SUBJECT'),
                'publicKey' => env('VAPID_PUBLIC_KEY'),
                'privateKey' => env('VAPID_PRIVATE_KEY'),
            ],
        ];

        $webPush = new \Minishlink\WebPush\WebPush($auth);
        $subscription = \Minishlink\WebPush\Subscription::create($data['subscription']);
        
        $payload = json_encode([
            'title' => $data['title'],
            'body' => $data['body'] ?? '',
            'url' => $data['url'] ?? '/',
        ]);

        $report = $webPush->sendOneNotification($subscription, $payload);
        
        if ($report->isSuccess()) {
            return response()->json(['message' => 'Push notification sent']);
        }
        
        return response()->json(['message' => 'Failed to send: ' . $report->getReason()], 500);
    }
}
