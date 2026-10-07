<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Enums\ProductTypeEnum;
use App\Models\Product;
use App\Services\ProductService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductServiceTest extends TestCase
{
    use RefreshDatabase;

    private ProductService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new ProductService();
    }

    public function test_create_uppercases_sku(): void
    {
        $product = $this->service->create([
            'sku' => 'crm-pro',
            'name' => 'CRM Pro Service',
            'type' => ProductTypeEnum::SERVICE->value,
            'unit' => 'month',
            'list_price' => 1200000,
        ]);

        $this->assertSame('CRM-PRO', $product->sku);
        $this->assertSame('VND', $product->currency);
    }

    public function test_paginate_filters_by_search_keyword(): void
    {
        $this->service->create([
            'sku' => 'ERP-01',
            'name' => 'Enterprise Resource Planning',
            'type' => ProductTypeEnum::SERVICE->value,
            'unit' => 'instance',
            'list_price' => 20000000,
        ]);

        $this->service->create([
            'sku' => 'POS-01',
            'name' => 'Point of Sale Machine',
            'type' => ProductTypeEnum::PRODUCT->value,
            'unit' => 'set',
            'list_price' => 5000000,
        ]);

        $results = $this->service->paginate(['q' => 'POS']);

        $this->assertSame(1, $results->total());
        $this->assertSame('POS-01', $results->items()[0]->sku);
    }
}
