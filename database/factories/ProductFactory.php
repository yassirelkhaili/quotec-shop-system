<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    public function definition(): array
    {
        $types = ['Tastatur', 'Maus', 'Webcam', 'Headset', 'Lautsprecher', 'Monitor', 'Notebook-Tasche',
            'USB-Stick', 'SSD', 'Ladegerät', 'Wasserkocher', 'Toaster', 'Mixer', 'Kaffeemühle'];
        $models = ['Basic', 'Pro', 'Plus', 'Mini', 'Max', 'Air', 'Compact', 'Studio'];

        return [
            'product_no' => fake()->unique()->numerify('P-2###'),
            'name' => fake()->randomElement($types).' '.fake()->randomElement($models).' '.fake()->numberBetween(10, 99),
            'unit_price' => fake()->randomFloat(2, 9, 499),
            'stock' => fake()->numberBetween(0, 40),
            'category_id' => Category::factory(),
        ];
    }

    public function outOfStock(): static
    {
        return $this->state(fn () => ['stock' => 0]);
    }
}
