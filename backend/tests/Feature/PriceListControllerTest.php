<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\PriceList;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PriceListControllerTest extends TestCase
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

    public function test_can_list_price_lists(): void
    {
        PriceList::factory()->create(['is_standard' => true, 'code' => 'PL-STD']);
        PriceList::factory()->create(['is_standard' => false, 'code' => 'PL-VIP']);

        $response = $this->actingAs($this->director, 'sanctum')
            ->getJson('/api/v1/price-lists');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(2, 'data');
    }

    public function test_creating_standard_price_list_unsets_previous_standard(): void
    {
        $oldStandard = PriceList::factory()->create(['is_standard' => true, 'code' => 'PL-OLD']);

        $response = $this->actingAs($this->director, 'sanctum')
            ->postJson('/api/v1/price-lists', [
                'code' => 'PL-NEW',
                'name' => 'Bảng giá chuẩn 2026',
                'is_standard' => true,
                'is_active' => true,
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.is_standard', true);

        $this->assertFalse($oldStandard->fresh()->is_standard);
    }

    public function test_can_upsert_and_delete_price_list_item(): void
    {
        $priceList = PriceList::factory()->create();
        $product = Product::factory()->create();

        // Upsert item
        $response = $this->actingAs($this->director, 'sanctum')
            ->postJson("/api/v1/price-lists/{$priceList->id}/items", [
                'product_id' => $product->id,
                'unit_price' => 450000,
                'min_qty' => 5,
            ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.unit_price', '450000.00');

        // Delete item
        $itemId = $response->json('data.id');
        $delResponse = $this->actingAs($this->director, 'sanctum')
            ->deleteJson("/api/v1/price-lists/{$priceList->id}/items/{$itemId}");

        $delResponse->assertOk()
            ->assertJsonPath('success', true);
    }
}
