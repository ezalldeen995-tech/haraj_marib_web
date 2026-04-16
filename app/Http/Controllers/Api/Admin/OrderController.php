<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class OrderController extends Controller
{
    /**
     * List all orders for the admin.
     */
    public function index(Request $request)
    {
        $query = Order::with(['ad', 'buyer', 'seller', 'paymentProof']);

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $orders = $query->orderBy('created_at', 'desc')->get();

        return response()->json(['orders' => $orders], 200);
    }

    /**
     * Admin reviews an order's payment proof.
     */
    public function review(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'action' => 'required|in:accept,reject',
            'rejection_image' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'rejection_note' => 'nullable|string|max:1000'
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 400);
        }

        $order = Order::with('paymentProof')->findOrFail($id);

        if (!$order->paymentProof) {
            return response()->json(['error' => 'No payment proof exists for this order.'], 400);
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

        return response()->json([
            'message' => 'Order payment proof has been ' . $request->action . 'ed.',
            'order' => $order->fresh(['paymentProof'])
        ], 200);
    }
}
