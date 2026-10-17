<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CompanyHierarchyController extends Controller
{
    /**
     * GET /api/v1/companies
     * Lấy danh sách công ty mẹ và các công ty con trực thuộc (S3-05 / S3-03)
     */
    public function index(Request $request): JsonResponse
    {
        $query = Customer::with(['subsidiaries', 'owner:id,name']);

        // Chỉ lấy các công ty gốc (parent_id is null) để phân cấp mẹ - con
        $query->whereNull('parent_id');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('tax_code', 'like', "%{$search}%")
                    ->orWhereHas('subsidiaries', function ($sq) use ($search) {
                        $sq->where('name', 'like', "%{$search}%")
                            ->orWhere('code', 'like', "%{$search}%");
                    });
            });
        }

        $companies = $query->latest()->get()->map(function ($parent) {
            return [
                'id' => (string) $parent->id,
                'name' => $parent->name,
                'code' => $parent->code ?? ('CORP-' . str_pad($parent->id, 3, '0', STR_PAD_LEFT)),
                'taxCode' => $parent->tax_code ?? '',
                'industry' => $parent->notes ?? 'Doanh nghiệp',
                'address' => $parent->address ?? '',
                'phone' => $parent->phone ?? '',
                'email' => $parent->email ?? '',
                'tier' => $parent->status ?? 'Enterprise',
                'subsidiaries' => $parent->subsidiaries->map(function ($sub) {
                    return [
                        'id' => (string) $sub->id,
                        'name' => $sub->name,
                        'code' => $sub->code ?? ('SUB-' . str_pad($sub->id, 3, '0', STR_PAD_LEFT)),
                        'taxCode' => $sub->tax_code ?? '',
                        'industry' => $sub->notes ?? 'Thành viên',
                        'address' => $sub->address ?? '',
                        'phone' => $sub->phone ?? '',
                        'email' => $sub->email ?? '',
                        'tier' => $sub->status ?? 'SME',
                    ];
                })->values()->all(),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $companies,
            'message' => 'Lấy cấu trúc công ty mẹ/con thành công.',
        ]);
    }

    /**
     * POST /api/v1/companies
     * Tạo công ty mẹ mới
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:50'],
            'taxCode' => ['nullable', 'string', 'max:50'],
            'industry' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'tier' => ['nullable', 'string', 'max:50'],
            'parentId' => ['nullable', 'integer'],
        ]);

        $ownerId = $request->user()?->id ?? 1;

        $customer = Customer::create([
            'name' => $validated['name'],
            'code' => $validated['code'] ?? null,
            'tax_code' => $validated['taxCode'] ?? null,
            'notes' => $validated['industry'] ?? null,
            'address' => $validated['address'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'email' => $validated['email'] ?? null,
            'status' => $validated['tier'] ?? 'Enterprise',
            'parent_id' => $validated['parentId'] ?? null,
            'owner_id' => $ownerId,
            'is_active' => true,
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => (string) $customer->id,
                'name' => $customer->name,
                'code' => $customer->code ?? ('CORP-' . str_pad($customer->id, 3, '0', STR_PAD_LEFT)),
                'taxCode' => $customer->tax_code ?? '',
                'industry' => $customer->notes ?? '',
                'address' => $customer->address ?? '',
                'phone' => $customer->phone ?? '',
                'email' => $customer->email ?? '',
                'tier' => $customer->status ?? 'Enterprise',
                'subsidiaries' => [],
            ],
            'message' => 'Tạo doanh nghiệp thành công.',
        ], 201);
    }

    /**
     * POST /api/v1/companies/{parentId}/subsidiaries
     * Tạo công ty con trực thuộc công ty mẹ
     */
    public function storeSubsidiary(Request $request, int $parentId): JsonResponse
    {
        $parent = Customer::findOrFail($parentId);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:50'],
            'taxCode' => ['nullable', 'string', 'max:50'],
            'industry' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'tier' => ['nullable', 'string', 'max:50'],
        ]);

        $ownerId = $request->user()?->id ?? $parent->owner_id;

        $sub = Customer::create([
            'name' => $validated['name'],
            'code' => $validated['code'] ?? null,
            'tax_code' => $validated['taxCode'] ?? null,
            'notes' => $validated['industry'] ?? null,
            'address' => $validated['address'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'email' => $validated['email'] ?? null,
            'status' => $validated['tier'] ?? 'SME',
            'parent_id' => $parent->id,
            'owner_id' => $ownerId,
            'is_active' => true,
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => (string) $sub->id,
                'name' => $sub->name,
                'code' => $sub->code ?? ('SUB-' . str_pad($sub->id, 3, '0', STR_PAD_LEFT)),
                'taxCode' => $sub->tax_code ?? '',
                'industry' => $sub->notes ?? '',
                'address' => $sub->address ?? '',
                'phone' => $sub->phone ?? '',
                'email' => $sub->email ?? '',
                'tier' => $sub->status ?? 'SME',
            ],
            'message' => 'Tạo công ty con thành công.',
        ], 201);
    }

    /**
     * PUT /api/v1/companies/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $customer = Customer::findOrFail($id);

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:50'],
            'taxCode' => ['nullable', 'string', 'max:50'],
            'industry' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'tier' => ['nullable', 'string', 'max:50'],
        ]);

        $customer->update([
            'name' => $validated['name'] ?? $customer->name,
            'code' => array_key_exists('code', $validated) ? $validated['code'] : $customer->code,
            'tax_code' => array_key_exists('taxCode', $validated) ? $validated['taxCode'] : $customer->tax_code,
            'notes' => array_key_exists('industry', $validated) ? $validated['industry'] : $customer->notes,
            'address' => array_key_exists('address', $validated) ? $validated['address'] : $customer->address,
            'phone' => array_key_exists('phone', $validated) ? $validated['phone'] : $customer->phone,
            'email' => array_key_exists('email', $validated) ? $validated['email'] : $customer->email,
            'status' => array_key_exists('tier', $validated) ? $validated['tier'] : $customer->status,
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => (string) $customer->id,
                'name' => $customer->name,
                'code' => $customer->code ?? '',
                'taxCode' => $customer->tax_code ?? '',
                'industry' => $customer->notes ?? '',
                'address' => $customer->address ?? '',
                'phone' => $customer->phone ?? '',
                'email' => $customer->email ?? '',
                'tier' => $customer->status ?? 'Enterprise',
            ],
            'message' => 'Cập nhật doanh nghiệp thành công.',
        ]);
    }

    /**
     * DELETE /api/v1/companies/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $customer = Customer::findOrFail($id);

        // Nếu là công ty mẹ, xóa cả các công ty con
        Customer::where('parent_id', $customer->id)->delete();
        $customer->delete();

        return response()->json([
            'success' => true,
            'data' => null,
            'message' => 'Xóa doanh nghiệp thành công.',
        ]);
    }
}
