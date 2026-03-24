<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class ContactController extends Controller
{
    // public store for users
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string',
            'email' => 'nullable|email',
            'phone' => 'nullable|string',
            'message' => 'required|string|max:2000',
        ]);

        \App\Models\ContactMessage::create($data);

        return $this->successResponse(null, 'contact_received', 201);
    }

    // admin listing
    public function index()
    {
        $msgs = \App\Models\ContactMessage::orderBy('created_at', 'desc')->paginate(20);

        return $this->paginatedResponse($msgs, 'data_retrieved');
    }

    public function destroy($id)
    {
        $msg = \App\Models\ContactMessage::findOrFail($id);
        $msg->delete();

        return $this->successResponse(null, 'contact_message_deleted');
    }
}
