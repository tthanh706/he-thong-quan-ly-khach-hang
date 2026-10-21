<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\CategoryTypeEnum;
use App\Models\CommonCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CommonCategoryControllerTest extends TestCase
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

    public function test_can_filter_categories_by_type(): void
    {
        CommonCategory::factory()->create([
            'category_type' => CategoryTypeEnum::LEAD_SOURCE,
            'code' => 'WEBSITE',
            'name' => 'Website đăng ký',
        ]);
        CommonCategory::factory()->create([
            'category_type' => CategoryTypeEnum::INDUSTRY,
            'code' => 'TECH',
            'name' => 'Công nghệ thông tin',
        ]);

        $response = $this->actingAs($this->director, 'sanctum')
            ->getJson('/api/v1/common-categories?category_type=LEAD_SOURCE');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.code', 'WEBSITE');
    }

    public function test_can_create_common_category(): void
    {
        $response = $this->actingAs($this->director, 'sanctum')
            ->postJson('/api/v1/common-categories', [
                'category_type' => CategoryTypeEnum::BUSINESS_TYPE->value,
                'code' => 'B2B',
                'name' => 'Doanh nghiệp (B2B)',
                'sort_order' => 1,
                'is_active' => true,
            ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.code', 'B2B');

        $this->assertDatabaseHas('common_categories', [
            'code' => 'B2B',
            'category_type' => CategoryTypeEnum::BUSINESS_TYPE->value,
        ]);
    }
}
