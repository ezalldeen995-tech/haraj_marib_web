<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Rules\NoProfanity;
use App\Rules\ValidCarYear;

class StoreAdRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'max:255', new NoProfanity()],
            'description' => ['required', 'min:10', new NoProfanity()],
            'price' => 'required|numeric|min:100',
            'category_id' => 'required|exists:categories,id',
            'address_text' => 'required',
            'lat' => 'sometimes|numeric|between:12,19',
            'lng' => 'sometimes|numeric|between:42,54',
            'year' => ['sometimes', new ValidCarYear()],
            'images' => 'required|array|max:5',
            'images.*' => 'image|mimes:jpeg,png,jpg|max:2048',
        ];
    }
}
