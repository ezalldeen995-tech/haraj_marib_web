<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Permission;
use App\Models\User;

class RoleController extends Controller
{
    public function index()
    {
        return response()->json([
            'status' => true,
            'data' => Permission::all()
        ]);
    }

    public function sync(Request $request, $id)
    {
        $request->validate([
            'permissions' => 'array',
            'permissions.*' => 'exists:permissions,id'
        ]);

        $user = User::findOrFail($id);

        if ($user->phone === '777777777') {
            return response()->json([
                'status' => false,
                'message' => 'لا يمكن تعديل صلاحيات مدير النظام الأساسي'
            ], 403);
        }

        $user->syncPermissions($request->permissions ?? []);

        return response()->json([
            'status' => true,
            'message' => 'تم تحديث الصلاحيات بنجاح',
            'data' => $user->load('permissions')
        ]);
    }
}
