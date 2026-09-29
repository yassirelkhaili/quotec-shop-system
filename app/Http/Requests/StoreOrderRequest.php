<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreOrderRequest extends FormRequest
{
    /** Only logged-in users can order (route also uses the auth middleware). */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            // Entered customer number must be the one of the logged-in account.
            'customer_no' => ['required', 'string', Rule::in([$this->user()?->customer_no])],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'distinct', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
        ];
    }

    public function messages(): array
    {
        return [
            'customer_no.required' => 'Bitte die Kundennummer eingeben.',
            'customer_no.in' => 'Diese Kundennummer gehört nicht zu Ihrem Konto.',
            'items.required' => 'Der Warenkorb ist leer.',
            'items.*.product_id.exists' => 'Ein Produkt im Warenkorb gibt es nicht mehr.',
        ];
    }

    /** Accept "k-10001 " as well as "K-10001". */
    protected function prepareForValidation(): void
    {
        if (is_string($this->input('customer_no'))) {
            $this->merge(['customer_no' => strtoupper(trim($this->input('customer_no')))]);
        }
    }
}
