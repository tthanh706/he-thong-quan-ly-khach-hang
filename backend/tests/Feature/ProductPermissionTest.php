<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductPermissionTest extends TestCase
{
    use RefreshDatabase;

    public function test_sales_rep_cannot_create_product(): void
    {
        $salesRep = User::factory()->create([
            'role' => 'SALES_REP',
        ]);

        $this->actingAs($salesRep, 'sanctum')
            ->postJson('/api/v1/products', [
                'sku' => 'X1',
                'name' => 'Test',
                'type' => 'PRODUCT',
                'unit' => 'pcs',
                'list_price' => 1000,
            ])
            ->assertForbidden();
    }

    public function test_sales_rep_cannot_delete_product(): void
    {
        $salesRep = User::factory()->create([
            'role' => 'SALES_REP',
        ]);
        $product = Product::factory()->create();

        $this->actingAs($salesRep, 'sanctum')
            ->deleteJson("/api/v1/products/{$product->id}")
            ->assertForbidden();
    }

    public function test_sales_director_has_product_manage_permission(): void
    {
        $director = User::factory()->create([
            'role' => 'SALES_DIRECTOR',
        ]);

        $this->actingAs($director, 'sanctum')
            ->postJson('/api/v1/products', [
                'sku' => 'PROD-OK',
                'name' => 'Service Pro',
                'type' => 'SERVICE',
                'unit' => 'license',
                'list_price' => 2000000,
            ])
            ->assertCreated();
    }
}
