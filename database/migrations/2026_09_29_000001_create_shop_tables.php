<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Tables from the ERD (Aufgaben 5–7). Customers are the starter kit's users (see next migration).
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parent_id')->nullable()->constrained('categories')->restrictOnDelete();
            $table->string('name', 100);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('product_no', 20)->unique();
            $table->string('name', 150);
            $table->decimal('unit_price', 10, 2);
            $table->unsignedInteger('stock')->default(0); // max. available amount
            $table->foreignId('category_id')->constrained()->restrictOnDelete();
            $table->timestamps();
        });

        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            // Order stays when the user deletes the account (settings page), so nullable.
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('customer_no', 20);   // copied at order time (Aufgabe 4: order contains customer number)
            $table->decimal('total_net', 10, 2)->default(0);
            $table->decimal('tax_rate', 5, 2)->default(19.00);
            $table->decimal('total_tax', 10, 2)->default(0);
            $table->decimal('total_gross', 10, 2)->default(0);
            $table->timestamps();                  // created_at = order date
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->restrictOnDelete();
            $table->unsignedInteger('quantity');
            $table->decimal('unit_price', 10, 2); // price at order time
            $table->unique(['order_id', 'product_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('products');
        Schema::dropIfExists('categories');
    }
};
