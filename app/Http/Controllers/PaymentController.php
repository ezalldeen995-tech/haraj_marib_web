<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use Illuminate\Http\Request;
use App\Http\Requests\PaymentRequest;

class PaymentController extends Controller
{
    public function requestSubscription(PaymentRequest $request)
    {
        $data = $request->validated();

        $path = $request->file('receipt_image')->store('payments', 'public');

        Payment::create([
            'user_id' => auth()->id(),
            'receipt_image' => $path,
            'amount' => $data['amount'],
            'status' => 'pending',
            'type' => 'subscription',
            'months' => $data['months'],
        ]);

        return $this->successResponse(null, 'payment_request_submitted', 201);
    }

    public function myPayments()
    {
        $payments = Payment::where('user_id', auth()->id())
            ->latest()
            ->paginate(15);

        return $this->paginatedResponse($payments, 'data_retrieved');
    }
}
