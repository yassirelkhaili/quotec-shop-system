<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class ShopController extends Controller
{
    private const PER_PAGE = 8;

    /** Home page: category tree, paginated products ordered by category, cart (Aufgaben 1–7). */
    public function index(Request $request): Response
    {
        $categories = Category::query()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'parent_id', 'name']);

        // Category ids in tree order (depth-first), used for filtering and sorting.
        $treeOrder = $this->treeOrder($categories);
        $selected = $request->integer('category') ?: null;
        $visibleIds = $selected ? [$selected, ...$this->treeOrder($categories, $selected)] : $treeOrder;

        $products = Product::query()
            ->whereIn('category_id', $visibleIds)
            ->when($treeOrder !== [], fn ($query) => $query->orderByRaw(
                'FIELD(category_id, '.implode(',', array_map('intval', $treeOrder)).')'
            ))
            ->orderBy('name')
            ->paginate(self::PER_PAGE)
            ->withQueryString()
            ->through(fn (Product $product) => [
                'id' => $product->id,
                'product_no' => $product->product_no,
                'name' => $product->name,
                'price_cents' => $product->priceCents(),
                'stock' => $product->stock,
                'category_id' => $product->category_id,
            ]);

        return Inertia::render('home', [
            'categories' => $categories,
            'products' => $products,
            'selectedCategory' => $selected,
            'taxRate' => Order::TAX_RATE,
            'lastOrder' => $request->session()->get('last_order'),
        ]);
    }

    /** Depth-first list of all category ids below $parentId. */
    private function treeOrder(Collection $categories, ?int $parentId = null): array
    {
        $ids = [];
        foreach ($categories->filter(fn (Category $c) => $c->parent_id === $parentId) as $category) {
            $ids[] = $category->id;
            array_push($ids, ...$this->treeOrder($categories, $category->id));
        }

        return $ids;
    }
}
