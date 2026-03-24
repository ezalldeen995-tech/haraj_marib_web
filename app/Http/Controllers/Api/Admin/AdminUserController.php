<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AdminUserController extends Controller
{
    public function index()
    {
        $admins = User::whereHas('permissions')->with('permissions')->get();
        return response()->json(['status' => true, 'data' => $admins]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|unique:users,phone',
            'email' => 'nullable|email|unique:users,email',
            'password' => 'required|string|min:6',
            'permissions' => 'required|array|min:1',
        ]);

        $admin = User::create([
            'name' => $request->name,
            'phone' => $request->phone,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);
        
        // Force the role so the user can pass the legacy `/admin` RoleMiddleware
        $admin->role = 'admin';
        $admin->save();

        if ($request->has('permissions')) {
            $admin->syncPermissions($request->permissions);
        }

        return response()->json([
            'status' => true,
            'message' => 'تم إضافة المشرف بنجاح',
            'data' => $admin->load('permissions')
        ]);
    }

    public function show($id)
    {
        $admin = User::with('permissions')->findOrFail($id);
        return response()->json(['status' => true, 'data' => $admin]);
    }

    public function update(Request $request, $id)
    {
        $admin = User::findOrFail($id);

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'phone' => ['sometimes', 'string', Rule::unique('users')->ignore($id)],
            'email' => ['nullable', 'email', Rule::unique('users')->ignore($admin->id)],
            'password' => 'nullable|string|min:6',
            'permissions' => 'required|array|min:1',
        ]);

        if ($request->has('name')) $admin->name = $request->name;
        if ($request->has('phone')) $admin->phone = $request->phone;
        if ($request->has('email')) $admin->email = $request->email;
        if ($request->filled('password')) $admin->password = Hash::make($request->password);
        
        $admin->save();

        if ($admin->phone !== '777777777' && $request->has('permissions')) {
            $admin->syncPermissions($request->permissions);
        }

        return response()->json([
            'status' => true,
            'message' => 'تم تحديث بيانات المشرف بنجاح',
            'data' => $admin->load('permissions')
        ]);
    }

    public function destroy($id)
    {
        $admin = User::findOrFail($id);

        if ($admin->phone === '777777777') {
            return response()->json(['status' => false, 'message' => 'لا يمكن حذف مدير النظام الأساسي'], 403);
        }

        if ($admin->id === auth()->id()) {
            return response()->json(['status' => false, 'message' => 'لا يمكنك حذف حسابك الشخصي'], 403);
        }

        $admin->delete();

        return response()->json(['status' => true, 'message' => 'تم حذف المشرف بنجاح']);
    }
}
