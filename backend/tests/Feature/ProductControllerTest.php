<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $director;

    protected function setUp(): void
    {
        parent::setUp();

        $this->director = User::factory()->create([
            'role' => 'SALES_DIRECTOR',
        ]);
    }

    public function test_can_list_products_with_pagination(): void
    {
        Product::factory()->count(15)->create();

        $response = $this->actingAs($this->director, 'sanctum')
            ->getJson('/api/v1/products?per_page=10');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    '*' => [
                        'id',
                        'sku',
                        'name',
                        'type',
                        'unit',
                        'list_price',
                        'is_active',
                    ],
                ],
                'meta' => [
                    'page',
                    'per_page',
                    'total',
                    'last_page',
                ],
            ]);
    }

    public function test_can_create_product_with_valid_form_request(): void
    {
        $payload = [
            'sku' => 'PRD-001',
            'name' => 'CRM Cloud Standard',
            'type' => 'SERVICE',
            'unit' => 'license',
            'list_price' => 500000,
            'currency' => 'VND',
            'is_active' => true,
        ];

        $response = $this->actingAs($this->director, 'sanctum')
            ->postJson('/api/v1/products', $payload);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.sku', 'PRD-001');

        $this->assertDatabaseHas('products', [
            'sku' => 'PRD-001',
            'name' => 'CRM Cloud Standard',
        ]);
    }

    public function test_validation_fails_on_duplicate_sku(): void
    {
        Product::factory()->create(['sku' => 'DUPLICATE-SKU']);

        $response = $this->actingAs($this->director, 'sanctum')
            ->postJson('/api/v1/products', [
                'sku' => 'DUPLICATE-SKU',
                'name' => 'Another Product',
                'type' => 'PRODUCT',
                'unit' => 'cái',
                'list_price' => 100000,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['sku']);
    }

    public function test_can_soft_delete_product(): void
    {
        $product = Product::factory()->create();

        $response = $this->actingAs($this->director, 'sanctum')
            ->deleteJson("/api/v1/products/{$product->id}");

        $response->assertOk()
            ->assertJsonPath('success', true);

        $this->assertSoftDeleted('products', ['id' => $product->id]);
    }
}
