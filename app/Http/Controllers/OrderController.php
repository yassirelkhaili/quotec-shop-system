<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreOrderRequest;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    public function store(StoreOrderRequest $request): RedirectResponse
    {
        $order = DB::transaction(fn () => $this->placeOrder($request->user(), $request->validated('items')));

        $this->saveOrderAsFile($order);

        return $this->redirectWithConfirmation($order);
    }

    private function placeOrder(User $customer, array $items): Order
    {
        $products = $this->lockOrderedProducts($items);

        $this->ensureStockIsAvailable($items, $products);

        $order = $this->createOrder($customer, $this->netCents($items, $products));
        $order->items()->createMany($this->orderLines($items, $products));

        $this->reduceStock($items, $products);

        return $order->load('items.product');
    }

    private function lockOrderedProducts(array $items): Collection
    {
        return Product::whereIn('id', array_column($items, 'product_id'))
            ->lockForUpdate()
            ->get()
            ->keyBy('id');
    }

    private function ensureStockIsAvailable(array $items, Collection $products): void
    {
        foreach ($items as $index => $item) {
            $product = $products[$item['product_id']];

            if ($item['quantity'] > $product->stock) {
                throw ValidationException::withMessages([
                    "items.$index.quantity" => "Von „{$product->name}“ sind nur noch {$product->stock} Stück verfügbar.",
                ]);
            }
        }
    }

    private function netCents(array $items, Collection $products): int
    {
        return collect($items)->sum(
            fn (array $item) => $products[$item['product_id']]->priceCents() * $item['quantity']
        );
    }

    private function taxCents(int $netCents): int
    {
        return (int) round($netCents * Order::TAX_RATE / 100);
    }

    private function createOrder(User $customer, int $netCents): Order
    {
        $taxCents = $this->taxCents($netCents);

        return Order::create([
            'user_id' => $customer->id,
            'customer_no' => $customer->customer_no,
            'total_net' => $netCents / 100,
            'tax_rate' => Order::TAX_RATE,
            'total_tax' => $taxCents / 100,
            'total_gross' => ($netCents + $taxCents) / 100,
        ]);
    }

    private function orderLines(array $items, Collection $products): array
    {
        return array_map(fn (array $item) => [
            'product_id' => $item['product_id'],
            'quantity' => $item['quantity'],
            'unit_price' => $products[$item['product_id']]->unit_price,
        ], $items);
    }

    private function reduceStock(array $items, Collection $products): void
    {
        foreach ($items as $item) {
            $products[$item['product_id']]->decrement('stock', $item['quantity']);
        }
    }

    private function saveOrderAsFile(Order $order): void
    {
        Storage::put(
            "orders/order_{$order->id}.json",
            json_encode($this->orderAsArray($order), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
        );
    }

    private function orderAsArray(Order $order): array
    {
        return [
            'order_id' => $order->id,
            'customer_no' => $order->customer_no,
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
        ];
    }

    private function redirectWithConfirmation(Order $order): RedirectResponse
    {
        return to_route('home')->with('last_order', [
            'id' => $order->id,
            'customer_no' => $order->customer_no,
            'total_gross' => $order->total_gross,
        ]);
    }
}
