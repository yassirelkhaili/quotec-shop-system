<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;

/**
 * Categories in 3 levels, 6 fixed products + 30 generated ones (enough for pagination).
 * Customers are the registered users (DatabaseSeeder creates the test users).
 */
class ShopSeeder extends Seeder
{
    public function run(): void
    {
        $tree = [
            'Elektronik' => [
                'Computer' => ['Laptops', 'Monitore', 'Zubehör'],
                'Audio' => ['Kopfhörer', 'Lautsprecher'],
            ],
            'Haushalt' => [
                'Küche' => ['Kaffeemaschinen', 'Kleingeräte'],
            ],
        ];

        $leaves = [];
        $sort = 0;
        foreach ($tree as $level1 => $children) {
            $top = Category::create(['name' => $level1, 'sort_order' => $sort++]);
            foreach ($children as $level2 => $grandChildren) {
                $mid = Category::create(['name' => $level2, 'parent_id' => $top->id, 'sort_order' => $sort++]);
                foreach ($grandChildren as $level3) {
                    $leaves[$level3] = Category::create(['name' => $level3, 'parent_id' => $mid->id, 'sort_order' => $sort++]);
                }
            }
        }

        $fixed = [
            ['P-1001', 'Laptop 14" 16 GB', 899.00, 10, 'Laptops'],
            ['P-1002', 'Monitor 27" WQHD', 279.90, 15, 'Monitore'],
            ['P-1003', 'Kopfhörer mit ANC', 149.00, 25, 'Kopfhörer'],
            ['P-1004', 'Espressomaschine', 329.00, 5, 'Kaffeemaschinen'],
            ['P-1005', 'USB-C Dockingstation', 119.50, 20, 'Zubehör'],
            ['P-1006', 'Milchaufschäumer', 39.99, 30, 'Kleingeräte'],
        ];
        foreach ($fixed as [$no, $name, $price, $stock, $leaf]) {
            Product::create([
                'product_no' => $no,
                'name' => $name,
                'unit_price' => $price,
                'stock' => $stock,
                'category_id' => $leaves[$leaf]->id,
            ]);
        }

        $leafIds = collect($leaves)->pluck('id');
        Product::factory()
            ->count(30)
            ->state(fn () => ['category_id' => $leafIds->random()])
            ->create();
    }
}
