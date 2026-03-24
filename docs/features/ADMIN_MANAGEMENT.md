# Feature: Admin Management & Permissions

> **Granular, permission-based access control for admin users.**
> This document is a complete guide to implementing the Admin Management & Permissions feature. It covers the database schema, Laravel backend (controllers, middleware, routes), and the HTML/JS frontend (pages, sidebar RBAC, permission syncing).

---

## Table of Contents

1. [Overview](#1-overview)
2. [Database Structure](#2-database-structure)
3. [Backend Implementation (Laravel)](#3-backend-implementation-laravel)
4. [Frontend Implementation (HTML/JS)](#4-frontend-implementation-htmljs)
5. [Testing Steps](#5-testing-steps)

---

## 1. Overview

The Admin Management & Permissions feature provides **granular, role-based access control** for the admin panel. Instead of a single "admin" flag, each admin user is assigned one or more **specific permissions** (e.g., `manage_users`, `manage_ads`, `manage_payments`). A special `full_access` permission acts as a super-permission, granting access to everything.

**Key Concepts:**

| Concept | Description |
|---|---|
| **Permission** | A named capability (e.g., `manage_users`, `manage_ads`). |
| **Super Admin** | The primary system admin (user ID `1` / phone `777777777`) — always bypasses all permission checks. |
| **`full_access`** | A special permission that grants the holder all capabilities, similar to Super Admin. |
| **Pivot Table** | A many-to-many `permission_user` table links users to their permissions. |
| **Middleware** | `RoleMiddleware` gates admin routes; `CheckPermission` gates individual feature routes. |

---

## 2. Database Structure

### 2.1 Migrations

Two migration files are required:

#### Migration 1: `create_permissions_table`

```php
// database/migrations/xxxx_xx_xx_create_permissions_table.php

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('permissions', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();       // e.g. 'manage_users'
            $table->string('display_name')->nullable(); // e.g. 'إدارة المستخدمين'
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('permissions');
    }
};
```

#### Migration 2: `create_permission_user_table`

```php
// database/migrations/xxxx_xx_xx_create_permission_user_table.php

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('permission_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('permission_id')->constrained()->cascadeOnDelete();
            $table->unique(['user_id', 'permission_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('permission_user');
    }
};
```

### 2.2 Seed Data (Example)

```sql
INSERT INTO permissions (name, display_name) VALUES
('full_access',      'صلاحيات كاملة'),
('manage_users',     'إدارة المستخدمين'),
('manage_ads',       'إدارة الإعلانات'),
('manage_payments',  'إدارة المدفوعات'),
('manage_reports',   'إدارة البلاغات'),
('manage_settings',  'إدارة الإعدادات');
```

### 2.3 Models & Relationships

#### `Permission` Model

```php
// app/Models/Permission.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Permission extends Model
{
    protected $fillable = ['name', 'display_name'];

    public function users()
    {
        return $this->belongsToMany(User::class);
    }
}
```

#### `User` Model — Permission Relationships & Helpers

Add the following to your existing `User` model:

```php
// app/Models/User.php

// --- Relationship ---
public function permissions()
{
    return $this->belongsToMany(Permission::class);
}

// --- Permission Check ---
public function hasPermission($permissionName): bool
{
    // Automatically grant everything to holders of 'full_access'
    if ($this->permissions()->where('name', 'full_access')->exists()) {
        return true;
    }

    return $this->permissions()->where('name', $permissionName)->exists();
}

// --- Sync Permissions ---
public function syncPermissions(array $permissionIds)
{
    return $this->permissions()->sync($permissionIds);
}
```

**Relationship Diagram:**

```
┌──────────┐       ┌─────────────────┐       ┌──────────────┐
│  users   │──M:N──│ permission_user  │──M:N──│ permissions  │
│          │       │ (user_id, perm_id)│      │(name, display)│
└──────────┘       └─────────────────┘       └──────────────┘
```

---

## 3. Backend Implementation (Laravel)

### 3.1 Controllers

#### `AdminUserController` — Full CRUD + Sync Permissions

```php
// app/Http/Controllers/Api/Admin/AdminUserController.php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AdminUserController extends Controller
{
    // ── LIST all admins ──
    public function index()
    {
        $admins = User::whereHas('permissions')->with('permissions')->get();
        return response()->json(['status' => true, 'data' => $admins]);
    }

    // ── CREATE a new admin ──
    public function store(Request $request)
    {
        $request->validate([
            'name'        => 'required|string|max:255',
            'phone'       => 'required|string|unique:users,phone',
            'email'       => 'nullable|email|unique:users,email',
            'password'    => 'required|string|min:6',
            'permissions' => 'required|array|min:1',
        ]);

        $admin = User::create([
            'name'     => $request->name,
            'phone'    => $request->phone,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
        ]);

        // Set role so user passes legacy RoleMiddleware
        $admin->role = 'admin';
        $admin->save();

        if ($request->has('permissions')) {
            $admin->syncPermissions($request->permissions);
        }

        return response()->json([
            'status'  => true,
            'message' => 'تم إضافة المشرف بنجاح',
            'data'    => $admin->load('permissions')
        ]);
    }

    // ── SHOW single admin ──
    public function show($id)
    {
        $admin = User::with('permissions')->findOrFail($id);
        return response()->json(['status' => true, 'data' => $admin]);
    }

    // ── UPDATE admin ──
    public function update(Request $request, $id)
    {
        $admin = User::findOrFail($id);

        $request->validate([
            'name'        => 'sometimes|string|max:255',
            'phone'       => ['sometimes', 'string', Rule::unique('users')->ignore($id)],
            'email'       => ['nullable', 'email', Rule::unique('users')->ignore($admin->id)],
            'password'    => 'nullable|string|min:6',
            'permissions' => 'required|array|min:1',
        ]);

        if ($request->has('name'))  $admin->name  = $request->name;
        if ($request->has('phone')) $admin->phone = $request->phone;
        if ($request->has('email')) $admin->email = $request->email;
        if ($request->filled('password')) $admin->password = Hash::make($request->password);

        $admin->save();

        // Prevent changing Super Admin permissions
        if ($admin->phone !== '777777777' && $request->has('permissions')) {
            $admin->syncPermissions($request->permissions);
        }

        return response()->json([
            'status'  => true,
            'message' => 'تم تحديث بيانات المشرف بنجاح',
            'data'    => $admin->load('permissions')
        ]);
    }

    // ── DELETE admin ──
    public function destroy($id)
    {
        $admin = User::findOrFail($id);

        // Prevent deleting Super Admin
        if ($admin->phone === '777777777') {
            return response()->json([
                'status' => false, 'message' => 'لا يمكن حذف مدير النظام الأساسي'
            ], 403);
        }

        // Prevent self-deletion
        if ($admin->id === auth()->id()) {
            return response()->json([
                'status' => false, 'message' => 'لا يمكنك حذف حسابك الشخصي'
            ], 403);
        }

        $admin->delete();

        return response()->json(['status' => true, 'message' => 'تم حذف المشرف بنجاح']);
    }
}
```

#### `RoleController` — List Permissions & Sync to User

```php
// app/Http/Controllers/Api/Admin/RoleController.php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Permission;
use App\Models\User;

class RoleController extends Controller
{
    // Return all available permissions
    public function index()
    {
        return response()->json([
            'status' => true,
            'data'   => Permission::all()
        ]);
    }

    // Sync permissions for a specific user
    public function sync(Request $request, $id)
    {
        $request->validate([
            'permissions'   => 'array',
            'permissions.*' => 'exists:permissions,id'
        ]);

        $user = User::findOrFail($id);

        // Prevent modifying Super Admin
        if ($user->phone === '777777777') {
            return response()->json([
                'status'  => false,
                'message' => 'لا يمكن تعديل صلاحيات مدير النظام الأساسي'
            ], 403);
        }

        $user->syncPermissions($request->permissions ?? []);

        return response()->json([
            'status'  => true,
            'message' => 'تم تحديث الصلاحيات بنجاح',
            'data'    => $user->load('permissions')
        ]);
    }
}
```

---

### 3.2 Middleware

Two middleware work together to protect admin routes:

#### `RoleMiddleware` — Gate: Is the user an admin at all?

```php
// app/Http/Middleware/RoleMiddleware.php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string $role)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => __('messages.unauthorized')], 403);
        }

        // Super Admin bypass
        if ($user->id === 1 || $user->phone === '777777777') {
            return $next($request);
        }

        // Allow if user has the required role
        if ($user->role === $role) {
            return $next($request);
        }

        // Allow if user has ANY permissions (they are a sub-admin)
        if ($user->permissions()->exists()) {
            return $next($request);
        }

        return response()->json(['message' => __('messages.unauthorized')], 403);
    }
}
```

#### `CheckPermission` — Gate: Does the user have a specific permission?

```php
// app/Http/Middleware/CheckPermission.php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckPermission
{
    public function handle(Request $request, Closure $next, $permission)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['status' => false, 'message' => 'Unauthorized'], 401);
        }

        // Super Admin bypass: Main Admin always passes
        if ($user->id === 1 || $user->phone === '777777777') {
            return $next($request);
        }

        if (!$user->hasPermission($permission)) {
            return response()->json([
                'status'  => false,
                'message' => 'ليس لديك صلاحية للوصول إلى هذه البيانات',
            ], 403);
        }

        return $next($request);
    }
}
```

> **Important:** Register both middleware in `bootstrap/app.php` (Laravel 11+):
>
> ```php
> ->withMiddleware(function (Middleware $middleware) {
>     $middleware->alias([
>         'role'       => \App\Http\Middleware\RoleMiddleware::class,
>         'permission' => \App\Http\Middleware\CheckPermission::class,
>     ]);
> })
> ```

---

### 3.3 Routes

```php
// routes/api.php (inside auth:api group)

Route::middleware([RoleMiddleware::class . ':admin'])->prefix('admin')->group(function () {

    // ── Permissions / Roles ──
    Route::get('roles', [RoleController::class, 'index'])
        ->middleware('permission:manage_users');
    Route::post('roles/{id}/sync', [RoleController::class, 'sync'])
        ->middleware('permission:manage_users');

    // ── Admin Users CRUD ──
    Route::get('admins',      [AdminUserController::class, 'index'])
        ->middleware('permission:manage_users');
    Route::post('admins',     [AdminUserController::class, 'store'])
        ->middleware('permission:manage_users');
    Route::get('admins/{id}', [AdminUserController::class, 'show'])
        ->middleware('permission:manage_users');
    Route::put('admins/{id}', [AdminUserController::class, 'update'])
        ->middleware('permission:manage_users');
    Route::delete('admins/{id}', [AdminUserController::class, 'destroy'])
        ->middleware('permission:manage_users');

    // ── Other admin routes (users, ads, payments, etc.) ──
    Route::get('users', [AdminController::class, 'users']);
    Route::get('ads',   [AdminController::class, 'allAds']);
    // ... more routes ...
});
```

**Middleware Flow Diagram:**

```
Request ──► [auth:api] ──► [RoleMiddleware:admin] ──► [CheckPermission:manage_users] ──► Controller
                │                   │                           │
                │                   │                           ├── Super Admin? → PASS
                │                   │                           ├── hasPermission() → PASS
                │                   │                           └── No permission → 403
                │                   │
                │                   ├── Super Admin? → PASS
                │                   ├── role === 'admin'? → PASS
                │                   ├── Has any permissions? → PASS
                │                   └── None of above → 403
                │
                └── No valid token → 401
```

---

### 3.4 API Response — Login

The login endpoint should return the user's permissions array so the frontend can store them:

```json
{
    "success": true,
    "data": {
        "token": "eyJ0eXAiOiJKV1Qi...",
        "user": {
            "id": 5,
            "name": "أحمد",
            "phone": "771234567",
            "email": "ahmed@example.com",
            "role": "admin",
            "permissions": [
                { "id": 1, "name": "manage_users", "display_name": "إدارة المستخدمين" },
                { "id": 3, "name": "manage_ads",   "display_name": "إدارة الإعلانات" }
            ]
        }
    }
}
```

> **Tip:** Ensure the `/me` profile endpoint also returns `permissions` via `User::with('permissions')`.

---

## 4. Frontend Implementation (HTML/JS)

### 4.1 UI Pages

#### `admin_users.html` — Admin List Page

The page consists of:

| Section | Description |
|---|---|
| **Admins Table** | Lists all admins with columns: #, Name, Phone, Email, Permissions (badges), Actions (Edit / Delete). |
| **Create/Edit Modal** | Form fields: Name, Phone, Email, Password. Below the form: **permissions checkboxes** dynamically loaded from the API. |
| **Confirmation Modal** | Generic "Are you sure?" modal for delete actions. |

**Key HTML elements:**

```html
<!-- Admins Table -->
<table id="adminsTable">
    <thead>
        <tr>
            <th>م</th>
            <th>اسم المشرف</th>
            <th>رقم الهاتف</th>
            <th>البريد الإلكتروني</th>
            <th>الصلاحيات</th>
            <th>الإجراءات</th>
        </tr>
    </thead>
    <tbody><!-- Populated by JS --></tbody>
</table>

<!-- Modal: Permission Checkboxes Container -->
<div id="permissionsContainer">
    <!-- Dynamically injected checkboxes -->
</div>
```

#### Sidebar — Conditional "Admins" Link

The "المشرفين" (Admins) link is hidden by default (`display: none`) and shown only for authorized users:

```html
<li class="nav-item w-100" id="nav-admins" style="display: none;">
    <a href="admin_users.html" class="nav-link">
        <i class="bi bi-shield-lock"></i>المشرفين
    </a>
</li>
```

---

### 4.2 Logic — `app.js` (Shared Admin Logic)

#### Storing Permissions in localStorage

On login or profile fetch, the entire user object (including permissions) is stored:

```javascript
// On login success:
localStorage.setItem('admin_token', result.data.token);
localStorage.setItem('admin_user', JSON.stringify(result.data.user));

// On every page load, fresh profile is fetched:
const response = await apiRequest('GET', '/me');
if (response && response.data) {
    adminUser = response.data;
    localStorage.setItem('admin_user', JSON.stringify(adminUser));
}
```

#### Show/Hide Sidebar Links Based on Permissions

```javascript
async function setupLayout() {
    // Fetch fresh profile from API
    const response = await apiRequest('GET', '/me');
    const adminUser = response.data;

    const isSuperAdmin = (adminUser.phone === '777777777' || adminUser.id === 1);
    const navAdmins = document.getElementById('nav-admins');

    if (isSuperAdmin) {
        // Main Admin bypass: show ALL sidebar links
        if (navAdmins) navAdmins.style.display = 'block';
    } else if (navAdmins) {
        const perms = adminUser.permissions || [];
        if (perms.includes('full_access') ||
            perms.includes('manage_users') ||
            perms.includes('manage_admins')) {
            navAdmins.style.display = 'block';
        } else {
            navAdmins.style.display = 'none';

            // Redirect if they are on the admins page without permission
            if (window.location.pathname.endsWith('admin_users.html')) {
                window.location.href = 'dashboard.html';
            }
        }
    }
}
```

---

### 4.3 Logic — `admin_users.js` (Admin Users Page)

#### Loading Permissions as Checkboxes

```javascript
async function loadPermissions() {
    const response = await apiRequest('GET', '/admin/roles');
    if (response && response.status) {
        allRoles = response.data;  // Store globally
        renderPermissionsCheckboxes();
    }
}

function renderPermissionsCheckboxes() {
    const container = document.getElementById('permissionsContainer');
    container.innerHTML = '';

    allRoles.forEach(role => {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4';

        let displayColor = role.name === 'full_access' ? 'danger' : 'primary';

        col.innerHTML = `
            <div class="form-check form-switch p-3 border rounded shadow-sm">
                <input class="form-check-input perm-checkbox" type="checkbox"
                       id="perm_${role.id}" value="${role.id}">
                <label class="form-check-label fw-bold text-${displayColor}"
                       for="perm_${role.id}">
                    ${role.display_name || role.name}
                </label>
            </div>
        `;
        container.appendChild(col);
    });
}
```

#### Populating Checkboxes on Edit

```javascript
function openEditModal(id) {
    const admin = allAdmins.find(a => a.id === id);

    // Fill form fields ...

    // Uncheck all first
    document.querySelectorAll('.perm-checkbox').forEach(cb => cb.checked = false);

    // Check the admin's current permissions
    if (admin.permissions) {
        admin.permissions.forEach(p => {
            const cb = document.getElementById(`perm_${p.id}`);
            if (cb) cb.checked = true;
        });
    }
}
```

#### Saving Admin with Permissions Sync

```javascript
async function saveAdmin() {
    const id = document.getElementById('adminId').value;
    const isEdit = !!id;

    const payload = {
        name:        document.getElementById('adminName').value,
        phone:       document.getElementById('adminPhone').value,
        email:       document.getElementById('adminEmail').value,
        password:    document.getElementById('adminPassword').value,
        permissions: []
    };

    // Collect checked permission IDs
    document.querySelectorAll('.perm-checkbox:checked').forEach(cb => {
        payload.permissions.push(parseInt(cb.value));
    });

    // Require at least one permission
    if (payload.permissions.length === 0) {
        showError('يرجى اختيار صلاحية واحدة على الأقل قبل الحفظ.');
        return;
    }

    const endpoint = isEdit ? `/admin/admins/${id}` : '/admin/admins';
    const method   = isEdit ? 'PUT' : 'POST';

    const response = await apiRequest(method, endpoint, payload);
    if (response && response.status) {
        showToast(response.message, 'success');
        closeModal();
        loadAdmins();  // Refresh table
    }
}
```

---

## 5. Testing Steps

### 5.1 Create a New Admin

1. Log in as the **Super Admin** (phone: `777777777`).
2. Navigate to **المشرفين** (Admins) page.
3. Click **"إضافة مشرف"** (Add Admin).
4. Fill in: Name, Phone, Password.
5. Select one or more permissions (e.g., `manage_users`, `manage_ads`).
6. Click **"حفظ المشرف"** (Save Admin).
7. **Verify:** The new admin appears in the table with the correct permission badges.

### 5.2 Assign / Change Permissions

1. In the admins table, click **"تعديل"** (Edit) on a sub-admin.
2. Check or uncheck permission checkboxes.
3. Click **"حفظ المشرف"** (Save).
4. **Verify:** The table badges update to reflect the new permissions.
5. **Verify:** The API response includes the updated `permissions` array.

### 5.3 Verify Restricted Access

1. Log out from Super Admin.
2. Log in as the newly created sub-admin.
3. **Verify Sidebar:** Only the links matching their permissions are visible.
   - If they **do not** have `manage_users` → the "المشرفين" link should be hidden.
4. **Verify API Access:** Attempt to access a route they do NOT have permission for.
   - **Expected:** `403 Forbidden` response with message: `ليس لديك صلاحية للوصول إلى هذه البيانات`.
5. **Verify Super Admin Bypass:** Log back in as Super Admin and confirm all routes and sidebar links are accessible regardless of assigned permissions.

### 5.4 Edge Cases to Verify

| Test Case | Expected Result |
|---|---|
| Delete Super Admin | ❌ Rejected — `"لا يمكن حذف مدير النظام الأساسي"` |
| Delete Self | ❌ Rejected — `"لا يمكنك حذف حسابك الشخصي"` |
| Modify Super Admin permissions | ❌ Rejected — permissions sync is skipped for phone `777777777` |
| Admin with `full_access` permission | ✅ Passes `hasPermission()` check for **any** permission |
| Admin with no permissions | ❌ Cannot access any permission-gated route |
| Navigate to `admin_users.html` without `manage_users` | ❌ Redirected to `dashboard.html` |

---

> **📋 Summary:** This feature uses a `permissions` table + `permission_user` pivot to create a flexible, granular access control system. The `CheckPermission` middleware enforces per-route access, the `RoleMiddleware` gates entry to the admin section entirely, and the frontend dynamically adapts the UI based on the logged-in user's permissions stored in `localStorage`.
