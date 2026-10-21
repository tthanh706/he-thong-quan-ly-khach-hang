<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductPermissionTest extends TestCase
{
    use RefreshDatabase;

    public function test_sales_rep_cannot_create_product(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/products', [
                'sku' => 'X1',
                'name' => 'Test',
                'type' => 'PRODUCT',
                'unit' => 'pcs',
                'list_price' => 1000,
            ])
            ->assertForbidden();
    }
}
