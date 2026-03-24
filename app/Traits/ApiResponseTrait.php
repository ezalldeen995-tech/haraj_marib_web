<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;

trait ApiResponseTrait
{
    /**
     * Return a standardized success response.
     */
    protected function successResponse($data = null, string $messageKey = 'success', int $statusCode = 200): JsonResponse
    {
        $response = [
            'success' => true,
            'message' => __("messages.$messageKey"),
        ];

        if (!is_null($data)) {
            $response['data'] = $data;
        }

        return response()->json($response, $statusCode);
    }

    /**
     * Return a standardized error response.
     */
    protected function errorResponse(string $messageKey = 'error', int $statusCode = 400, $errors = null): JsonResponse
    {
        $response = [
            'success' => false,
            'message' => __("messages.$messageKey"),
        ];

        if (!is_null($errors)) {
            $response['errors'] = $errors;
        }

        return response()->json($response, $statusCode);
    }

    /**
     * Return a standardized paginated response.
     */
    protected function paginatedResponse($paginator, string $messageKey = 'success'): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => __("messages.$messageKey"),
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }
}
