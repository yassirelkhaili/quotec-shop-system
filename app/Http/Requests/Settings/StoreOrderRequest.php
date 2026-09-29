<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_no' => ['required', 'string', 'exists:customers,customer_no'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'distinct', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
        ];
    }

    public function messages(): array
    {
        return [
            'customer_no.required' => 'Bitte eine Kundennummer eingeben.',
            'customer_no.exists' => 'Diese Kundennummer ist nicht bekannt.',
            'items.required' => 'Der Warenkorb ist leer.',
        ];
    }
}
