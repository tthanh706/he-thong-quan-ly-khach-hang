<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\PriceList;
use App\Models\User;

class PriceListPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('price_list.view');
    }

    public function view(User $user, PriceList $priceList): bool
    {
        return $user->can('price_list.view');
    }

    public function create(User $user): bool
    {
        return $user->can('price_list.manage');
    }

    public function update(User $user, PriceList $priceList): bool
    {
        return $user->can('price_list.manage');
    }

    public function delete(User $user, PriceList $priceList): bool
    {
        return $user->can('price_list.manage');
    }
}
