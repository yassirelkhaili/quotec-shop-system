<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class ShopController extends Controller
{
    private const PRODUCTS_PER_PAGE = 8;

    public function index(Request $request): Response
    {
        $categories = $this->categoriesInDisplayOrder();
        $selectedCategory = $this->selectedCategory($request);

        return Inertia::render('home', [
            'categories' => $categories,
            'products' => $this->productsOf($categories, $selectedCategory),
            'selectedCategory' => $selectedCategory,
            'taxRate' => Order::TAX_RATE,
            'lastOrder' => $request->session()->get('last_order'),
        ]);
    }

    private function categoriesInDisplayOrder(): Collection
    {
        return Category::query()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'parent_id', 'name']);
    }

    private function selectedCategory(Request $request): ?int
    {
        return $request->integer('category') ?: null;
    }

    private function productsOf(Collection $categories, ?int $selectedCategory): LengthAwarePaginator
    {
        return Product::query()
            ->whereIn('category_id', $this->visibleCategoryIds($categories, $selectedCategory))
            ->orderByRaw($this->orderByCategoryTree($categories))
            ->orderBy('name')
            ->paginate(self::PRODUCTS_PER_PAGE)
            ->withQueryString()
            ->through(fn (Product $product) => $this->presentProduct($product));
    }

    private function visibleCategoryIds(Collection $categories, ?int $selectedCategory): array
    {
        if ($selectedCategory === null) {
            return $this->categoryIdsInTreeOrder($categories);
        }

        return [$selectedCategory, ...$this->categoryIdsInTreeOrder($categories, $selectedCategory)];
    }

    private function categoryIdsInTreeOrder(Collection $categories, ?int $parentId = null): array
    {
        $ids = [];

        foreach ($categories->where('parent_id', $parentId) as $category) {
            $ids[] = $category->id;
            array_push($ids, ...$this->categoryIdsInTreeOrder($categories, $category->id));
        }

        return $ids;
    }

    private function orderByCategoryTree(Collection $categories): string
    {
        $idsInTreeOrder = $this->categoryIdsInTreeOrder($categories);

        if ($idsInTreeOrder === []) {
            return 'category_id';
        }

        return 'FIELD(category_id, '.implode(',', array_map('intval', $idsInTreeOrder)).')';
    }

    private function presentProduct(Product $product): array
    {
        return [
            'id' => $product->id,
            'product_no' => $product->product_no,
            'name' => $product->name,
            'price_cents' => $product->priceCents(),
            'stock' => $product->stock,
            'category_id' => $product->category_id,
        ];
    }
}
