<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Models\PriceList;
use App\Models\Product;
use App\Services\PriceListService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PriceListServiceTest extends TestCase
{
    use RefreshDatabase;

    private PriceListService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new PriceListService();
    }

    public function test_standard_price_list_is_strictly_unique(): void
    {
        $first = $this->service->create([
            'code' => 'STD-1',
            'name' => 'Bảng giá chuẩn 1',
            'is_standard' => true,
        ]);

        $second = $this->service->create([
            'code' => 'STD-2',
            'name' => 'Bảng giá chuẩn 2',
            'is_standard' => true,
        ]);

        $this->assertFalse($first->fresh()->is_standard);
        $this->assertTrue($second->fresh()->is_standard);
    }

    public function test_upsert_item_updates_existing_pair(): void
    {
        $priceList = PriceList::factory()->create();
        $product = Product::factory()->create();

        $this->service->upsertItem($priceList, [
            'product_id' => $product->id,
            'unit_price' => 100000,
            'min_qty' => 1,
        ]);

        $itemUpdated = $this->service->upsertItem($priceList, [
            'product_id' => $product->id,
            'unit_price' => 80000,
            'min_qty' => 5,
        ]);

        $this->assertSame('80000.00', (string) $itemUpdated->unit_price);
        $this->assertSame('5.00', (string) $itemUpdated->min_qty);
        $this->assertSame(1, $priceList->items()->count());
    }
}
