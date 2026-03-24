<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Ad;

class UpdateAdRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $ad = Ad::findOrFail($this->route('id'));
        return auth()->check() && auth()->user()->id === $ad->user_id;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => 'sometimes|required|max:255',
            'description' => 'sometimes|required|min:10',
            'price' => 'sometimes|required|numeric|min:0',
            'category_id' => 'sometimes|required|exists:categories,id',
            'address_text' => 'sometimes|required',
            'images' => 'sometimes|required|array|max:5',
            'images.*' => 'sometimes|image|mimes:jpeg,png,jpg|max:2048',
        ];
    }
}
