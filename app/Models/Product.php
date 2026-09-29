<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Product extends Model
{
    use HasFactory;

    protected $fillable = ['product_no', 'name', 'unit_price', 'stock', 'category_id'];

    protected function casts(): array
    {
        return [
            'unit_price' => 'decimal:2',
            'stock' => 'integer', // max. available amount (Aufgabe 3)
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /** Price in cents, so totals are never calculated with floats. */
    public function priceCents(): int
    {
        return (int) round(((float) $this->unit_price) * 100);
    }
}
