<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreOrderRequest;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    /**
     * Store an order (Aufgabe 6) and also write it to a JSON file (Aufgabe 4).
     * Prices and stock always come from the database, never from the browser.
     */
    public function store(StoreOrderRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $order = DB::transaction(function () use ($data) {
            $customer = Customer::where('customer_no', $data['customer_no'])->firstOrFail();
            $products = Product::whereIn('id', array_column($data['items'], 'product_id'))
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            $netCents = 0;
            $lines = [];
            foreach ($data['items'] as $i => $item) {
                $product = $products[$item['product_id']];

                if ($item['quantity'] > $product->stock) {
                    // Exception rolls the transaction back.
                    throw ValidationException::withMessages([
                        "items.$i.quantity" => "Von „{$product->name}“ sind nur noch {$product->stock} Stück verfügbar.",
                    ]);
                }

                $netCents += $product->priceCents() * $item['quantity'];
                $lines[] = [
                    'product_id' => $product->id,
                    'quantity' => $item['quantity'],
                    'unit_price' => $product->unit_price,
                ];
                $product->decrement('stock', $item['quantity']);
            }

            $taxCents = (int) round($netCents * Order::TAX_RATE / 100);

            $order = $customer->orders()->create([
                'total_net' => $netCents / 100,
                'tax_rate' => Order::TAX_RATE,
                'total_tax' => $taxCents / 100,
                'total_gross' => ($netCents + $taxCents) / 100,
            ]);
            $order->items()->createMany($lines);

            return $order->load('customer', 'items.product');
        });

        // Aufgabe 4: order data incl. customer number as file (storage/app/private/orders).
        Storage::put("orders/order_{$order->id}.json", json_encode([
            'order_id' => $order->id,
            'customer_no' => $order->customer->customer_no,
            'created_at' => $order->created_at->toIso8601String(),
            'items' => $order->items->map(fn ($item) => [
                'product_no' => $item->product->product_no,
                'name' => $item->product->name,
                'quantity' => $item->quantity,
                'unit_price' => $item->unit_price,
            ]),
            'total_net' => $order->total_net,
            'tax_rate' => $order->tax_rate,
            'total_tax' => $order->total_tax,
            'total_gross' => $order->total_gross,
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        return to_route('home')->with('last_order', [
            'id' => $order->id,
            'customer_no' => $order->customer->customer_no,
            'total_gross' => $order->total_gross,
        ]);
    }
}
