<?php

return [
    [
        'key' => 'dashboard',
        'label' => 'Tổng quan',
        'icon' => '⌂',
        'href' => '/dashboard',
        'roles' => ['admin', 'sales', 'manager'],
    ],
    [
        'key' => 'customers',
        'label' => 'Khách hàng',
        'icon' => '◉',
        'href' => '/customers',
        'roles' => ['admin', 'sales', 'manager'],
    ],
    [
        'key' => 'opportunities',
        'label' => 'Cơ hội bán hàng',
        'icon' => '↗',
        'href' => '/opportunities',
        'roles' => ['admin', 'sales', 'manager'],
    ],
    [
        'key' => 'reports',
        'label' => 'Báo cáo',
        'icon' => '▥',
        'href' => '/reports',
        'roles' => ['admin', 'manager'],
    ],
    [
        'key' => 'users',
        'label' => 'Quản lý người dùng',
        'icon' => '♙',
        'href' => '/admin/users',
        'roles' => ['admin'],
    ],
];
