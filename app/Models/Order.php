<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    /** German VAT in percent (Aufgabe 2). */
    public const TAX_RATE = 19;

    protected $fillable = ['customer_id', 'total_net', 'tax_rate', 'total_tax', 'total_gross'];

    protected function casts(): array
    {
        return [
            'total_net' => 'decimal:2',
            'tax_rate' => 'decimal:2',
            'total_tax' => 'decimal:2',
            'total_gross' => 'decimal:2',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }
}
