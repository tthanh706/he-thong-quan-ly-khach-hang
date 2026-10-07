<?php

declare(strict_types=1);

namespace App\Providers;

use App\Models\CommonCategory;
use App\Models\CustomField;
use App\Models\PriceList;
use App\Models\Product;
use App\Policies\CommonCategoryPolicy;
use App\Policies\CustomFieldPolicy;
use App\Policies\PriceListPolicy;
use App\Policies\ProductPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::policy(Product::class, ProductPolicy::class);
        Gate::policy(PriceList::class, PriceListPolicy::class);
        Gate::policy(CommonCategory::class, CommonCategoryPolicy::class);
        Gate::policy(CustomField::class, CustomFieldPolicy::class);
    }
}
