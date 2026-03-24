<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Http\Requests\RegisterRequest;
use App\Http\Requests\LoginRequest;
use App\Http\Resources\UserResource;

class AuthController extends Controller
{
    /**
     * @OA\Post(
     *     path="/api/v1/register",
     *     summary="Register user",
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"name","phone","password"},
     *             @OA\Property(property="name", type="string", example="John Doe"),
     *             @OA\Property(property="phone", type="string", example="771234567"),
     *             @OA\Property(property="password", type="string", example="password123")
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="User registered",
     *         @OA\JsonContent(
     *             @OA\Property(property="token", type="string")
     *         )
     *     )
     * )
     * Register a new user.
     */
    public function register(RegisterRequest $request)
    {
        $data = $request->validated();

        // If phone exists but is not verified, delete the old unverified record
        User::where('phone', $data['phone'])
            ->whereNull('phone_verified_at')
            ->forceDelete();

        $user = User::create([
            'name' => $data['name'],
            'phone' => $data['phone'],
            'password' => Hash::make($data['password']),
        ]);

        // Explicitly set default role (defense-in-depth; DB default is 'user')
        $user->role = 'user';
        $user->save();

        // automatically send OTP after registration
        \App\Services\OtpService::generateOtp($user);

        $token = Auth::guard('api')->login($user);

        $responseData = ['token' => $token];
        if (app()->environment('local')) {
            $responseData['otp_code'] = $user->otp_code;
        }

        return $this->successResponse($responseData, 'register_success', 201);
    }

    /**
     * @OA\Post(
     *     path="/api/v1/login",
     *     summary="Login user",
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"phone","password"},
     *             @OA\Property(property="phone", type="string", example="771234567"),
     *             @OA\Property(property="password", type="string", example="password123")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Login successful",
     *         @OA\JsonContent(
     *             @OA\Property(property="token", type="string")
     *         )
     *     )
     * )
     * Login user.
     */
    public function login(LoginRequest $request)
    {
        $credentials = $request->validated();

        if (!$token = Auth::guard('api')->attempt($credentials)) {
            return $this->errorResponse('Invalid credentials', 401);
        }

        $user = Auth::guard('api')->user();
        $user->load('permissions');

        return $this->successResponse([
            'token' => $token,
            'user' => new \App\Http\Resources\UserResource($user)
        ], 'login_success');
    }

    /**
     * Logout (invalidate token).
     */
    public function logout()
    {
        Auth::guard('api')->logout();
        return $this->successResponse(null, 'logged_out');
    }

    /**
     * Get authenticated user.
     */
    public function me()
    {
        $user = Auth::guard('api')->user();
        if ($user) {
            $user->load('permissions');
        }
        return $this->successResponse(new UserResource($user), 'data_retrieved');
    }

    /**
     * Refresh JWT token.
     */
    public function refresh()
    {
        $newToken = Auth::guard('api')->refresh();
        return $this->successResponse(['token' => $newToken], 'token_refreshed');
    }

    /**
     * Request OTP for a given phone number.
     */
    public function requestOtp(Request $request)
    {
        $data = $request->validate([
            'phone' => ['required', 'string', 'exists:users,phone'],
        ]);

        $user = User::where('phone', $data['phone'])->first();
        \App\Services\OtpService::generateOtp($user);

        $responseData = null;
        if (app()->environment('local')) {
            $responseData = ['otp_code' => $user->otp_code];
        }

        return $this->successResponse($responseData, 'otp_sent');
    }

    /**
     * Verify OTP code.
     */
    public function verifyOtp(Request $request)
    {
        $data = $request->validate([
            'phone' => ['required', 'string', 'exists:users,phone'],
            'code' => ['required', 'string'],
        ]);

        $user = User::where('phone', $data['phone'])->first();
        $valid = \App\Services\OtpService::verifyOtp($user, $data['code']);

        if (!$valid) {
            return $this->errorResponse('otp_invalid', 400);
        }

        return $this->successResponse(null, 'phone_verified');
    }

    /**
     * Forgot password - send OTP to phone.
     */
    public function forgotPassword(Request $request)
    {
        $request->validate([
            'phone' => ['required', 'string', 'exists:users,phone'],
        ]);

        $user = User::where('phone', $request->phone)->first();
        \App\Services\OtpService::generateOtp($user);

        $responseData = null;
        if (app()->environment('local')) {
            $responseData = ['otp_code' => $user->otp_code];
        }

        return $this->successResponse($responseData, 'otp_sent');
    }

    /**
     * @OA\Post(
     *     path="/api/v1/reset-password",
     *     summary="Reset password using OTP",
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"phone","otp","new_password","new_password_confirmation"},
     *             @OA\Property(property="phone", type="string", example="771234567"),
     *             @OA\Property(property="otp", type="string", example="123456"),
     *             @OA\Property(property="new_password", type="string", example="newpassword123"),
     *             @OA\Property(property="new_password_confirmation", type="string", example="newpassword123")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Password reset successfully"
     *     )
     * )
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'phone' => ['required', 'string', 'exists:users,phone'],
            'otp' => ['required', 'string'],
            'new_password' => ['required', 'string', 'min:6', 'confirmed'],
        ]);

        $user = User::where('phone', $request->phone)->first();
        $valid = \App\Services\OtpService::verifyOtp($user, $request->otp);

        if (!$valid) {
            return $this->errorResponse('otp_invalid', 400);
        }

        $user->password = Hash::make($request->new_password);
        $user->save();

        return $this->successResponse(null, 'password_reset_success');
    }
}
