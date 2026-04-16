<?php

namespace App\Http\Controllers;

use App\Models\Ad;
use App\Models\Order;
use App\Models\PaymentProof;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class OrderController extends Controller
{
    /**
     * Create a new order.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'ad_id' => 'required|exists:ads,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => $validator->errors()->first()], 400);
        }

        $ad = Ad::findOrFail($request->ad_id);
        $buyer_id = auth()->id();

        if ($ad->user_id === $buyer_id) {
            return response()->json(['success' => false, 'message' => 'لا يمكنك شراء إعلانك الخاص.'], 400);
        }

        // Prevent multiple pending orders from the same buyer for the same ad
        $existingOrder = Order::where('ad_id', $ad->id)
            ->where('buyer_id', $buyer_id)
            ->whereIn('status', ['pending', 'under_review'])
            ->first();

        if ($existingOrder) {
            return response()->json([
                'success' => false, 
                'message' => 'لديك طلب حالي قيد التنفيذ لهذا الإعلان.', 
                'data' => ['order_id' => $existingOrder->id]
            ], 400);
        }

        $order = Order::create([
            'ad_id' => $ad->id,
            'buyer_id' => $buyer_id,
            'seller_id' => $ad->user_id,
            'amount' => $ad->price,
            'status' => 'pending',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Order created successfully. Please upload payment proof.',
            'data' => ['order' => $order]
        ], 201);
    }

    /**
     * List user's orders (buyer and seller).
     */
    public function myOrders(Request $request)
    {
        $user = auth()->user();
        
        $purchases = Order::with(['ad', 'seller', 'paymentProof'])
            ->where('buyer_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();
            
        $sales = Order::with(['ad', 'buyer', 'paymentProof'])
            ->where('seller_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'purchases' => $purchases,
                'sales' => $sales
            ]
        ], 200);
    }

    /**
     * Show order details.
     */
    public function show($id)
    {
        $order = Order::with(['ad', 'buyer', 'seller', 'paymentProof'])->findOrFail($id);
        $user_id = auth()->id();

        if ($order->buyer_id !== $user_id && $order->seller_id !== $user_id && !auth()->user()->hasPermission('manage_users')) {
            return response()->json(['success' => false, 'message' => 'غير مصرح لك للوصول لهذا الطلب.'], 403);
        }

        return response()->json([
            'success' => true, 
            'data' => [
                'order' => $order,
                'is_buyer' => $order->buyer_id === $user_id,
                'is_seller' => $order->seller_id === $user_id
            ]
        ], 200);
    }

    /**
     * Buyer uploads payment proof.
     */
    public function uploadProof(Request $request, $id)
    {
        $order = Order::findOrFail($id);
        
        if ($order->buyer_id !== auth()->id()) {
            return response()->json(['success' => false, 'message' => 'المشتري فقط يمكنه رفع الإيصال.'], 403);
        }

        if (in_array($order->status, ['paid', 'completed'])) {
            return response()->json(['success' => false, 'message' => 'هذا الطلب مدفوع بالفعل.'], 400);
        }

        $validator = Validator::make($request->all(), [
            'proof_image' => 'required|image|mimes:jpeg,png,jpg|max:2048',
            'note' => 'nullable|string|max:1000'
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 400);
        }

        // Store new image
        $path = $request->file('proof_image')->store('payment_proofs', 'public');

        // Delete old proof if it existed and is being replaced
        if ($order->paymentProof && $order->paymentProof->image_path) {
            Storage::disk('public')->delete($order->paymentProof->image_path);
            $order->paymentProof->delete();
        }

        PaymentProof::create([
            'order_id' => $order->id,
            'image_path' => $path,
            'note' => $request->note,
            'status' => 'under_review'
        ]);

        $order->update(['status' => 'under_review']);

        return response()->json(['success' => true, 'message' => 'Payment proof uploaded successfully.'], 200);
    }

    /**
     * Seller reviews the payment proof.
     */
    public function reviewProof(Request $request, $id)
    {
        $order = Order::with('paymentProof')->findOrFail($id);
        
        if ($order->seller_id !== auth()->id()) {
            return response()->json(['success' => false, 'message' => 'البائع فقط يمكنه مراجعة الإيصال.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'action' => 'required|in:accept,reject',
            'rejection_image' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'rejection_note' => 'nullable|string|max:1000'
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 400);
        }

        if (!$order->paymentProof || $order->paymentProof->status !== 'under_review') {
            return response()->json(['success' => false, 'message' => 'لا يوجد إيصال بانتظار المراجعة.'], 400);
        }

        if ($request->action === 'accept') {
            $order->update(['status' => 'paid']);
            $order->paymentProof->update(['status' => 'accepted']);
        } else {
            $rejectionImagePath = null;
            if ($request->hasFile('rejection_image')) {
                $rejectionImagePath = $request->file('rejection_image')->store('rejection_proofs', 'public');
            }

            $order->update(['status' => 'rejected']);
            $order->paymentProof->update([
                'status' => 'rejected',
                'rejection_image_path' => $rejectionImagePath,
                'rejection_note' => $request->rejection_note
            ]);
        }

        return response()->json(['success' => true, 'message' => 'Order status updated successfully.', 'data' => ['order' => $order->fresh(['paymentProof'])]], 200);
    }
}
