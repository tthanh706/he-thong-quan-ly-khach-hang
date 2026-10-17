<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContactController extends Controller
{
    /**
     * GET /api/v1/contacts
     */
    public function index(Request $request): JsonResponse
    {
        $query = Contact::with('customer:id,code,name');

        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->input('customer_id'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('title', 'like', "%{$search}%")
                    ->orWhereHas('customer', fn ($c) => $c->where('name', 'like', "%{$search}%"));
            });
        }

        $contacts = $query->latest()->get()->map(function ($contact) {
            return [
                'id' => (string) $contact->id,
                'name' => $contact->name,
                'title' => $contact->title ?? '',
                'email' => $contact->email ?? '',
                'phone' => $contact->phone ?? '',
                'companyId' => (string) ($contact->customer_id ?? ''),
                'companyName' => $contact->customer?->name ?? 'Chưa gán',
                'department' => $contact->department ?? '',
                'isPrimary' => (bool) $contact->is_primary,
                'roleInDecision' => $contact->role_in_decision ?? '',
                'notes' => $contact->notes ?? '',
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $contacts,
            'message' => 'Lấy danh sách người liên hệ thành công.',
        ]);
    }

    /**
     * POST /api/v1/contacts
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'title' => ['nullable', 'string', 'max:255'],
            'department' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'companyId' => ['nullable'],
            'customer_id' => ['nullable', 'integer'],
            'isPrimary' => ['nullable', 'boolean'],
            'roleInDecision' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
        ]);

        $customerId = $validated['customer_id'] ?? (is_numeric($validated['companyId'] ?? null) ? $validated['companyId'] : null);

        $contact = Contact::create([
            'name' => $validated['name'],
            'title' => $validated['title'] ?? null,
            'department' => $validated['department'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'email' => $validated['email'] ?? null,
            'customer_id' => $customerId,
            'is_primary' => $validated['isPrimary'] ?? false,
            'role_in_decision' => $validated['roleInDecision'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'created_by' => $request->user()?->id,
        ]);

        $contact->load('customer');

        return response()->json([
            'success' => true,
            'data' => [
                'id' => (string) $contact->id,
                'name' => $contact->name,
                'title' => $contact->title ?? '',
                'email' => $contact->email ?? '',
                'phone' => $contact->phone ?? '',
                'companyId' => (string) ($contact->customer_id ?? ''),
                'companyName' => $contact->customer?->name ?? 'Chưa gán',
                'department' => $contact->department ?? '',
                'isPrimary' => (bool) $contact->is_primary,
                'roleInDecision' => $contact->role_in_decision ?? '',
                'notes' => $contact->notes ?? '',
            ],
            'message' => 'Thêm người liên hệ thành công.',
        ], 201);
    }

    /**
     * PATCH /api/v1/contacts/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $contact = Contact::findOrFail($id);

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'title' => ['nullable', 'string', 'max:255'],
            'department' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'companyId' => ['nullable'],
            'customer_id' => ['nullable', 'integer'],
            'isPrimary' => ['nullable', 'boolean'],
            'roleInDecision' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
        ]);

        $customerId = $validated['customer_id'] ?? (isset($validated['companyId']) && is_numeric($validated['companyId']) ? $validated['companyId'] : $contact->customer_id);

        $contact->update([
            'name' => $validated['name'] ?? $contact->name,
            'title' => array_key_exists('title', $validated) ? $validated['title'] : $contact->title,
            'department' => array_key_exists('department', $validated) ? $validated['department'] : $contact->department,
            'phone' => array_key_exists('phone', $validated) ? $validated['phone'] : $contact->phone,
            'email' => array_key_exists('email', $validated) ? $validated['email'] : $contact->email,
            'customer_id' => $customerId,
            'is_primary' => array_key_exists('isPrimary', $validated) ? $validated['isPrimary'] : $contact->is_primary,
            'role_in_decision' => array_key_exists('roleInDecision', $validated) ? $validated['roleInDecision'] : $contact->role_in_decision,
            'notes' => array_key_exists('notes', $validated) ? $validated['notes'] : $contact->notes,
        ]);

        $contact->load('customer');

        return response()->json([
            'success' => true,
            'data' => [
                'id' => (string) $contact->id,
                'name' => $contact->name,
                'title' => $contact->title ?? '',
                'email' => $contact->email ?? '',
                'phone' => $contact->phone ?? '',
                'companyId' => (string) ($contact->customer_id ?? ''),
                'companyName' => $contact->customer?->name ?? 'Chưa gán',
                'department' => $contact->department ?? '',
                'isPrimary' => (bool) $contact->is_primary,
                'roleInDecision' => $contact->role_in_decision ?? '',
                'notes' => $contact->notes ?? '',
            ],
            'message' => 'Cập nhật người liên hệ thành công.',
        ]);
    }

    /**
     * DELETE /api/v1/contacts/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $contact = Contact::findOrFail($id);
        $contact->delete();

        return response()->json([
            'success' => true,
            'data' => null,
            'message' => 'Xóa người liên hệ thành công.',
        ]);
    }

    /**
     * POST /api/v1/contacts/{id}/transfer
     * Chuyển người liên hệ sang khách hàng khác và lưu lịch sử (S3-02)
     */
    public function transfer(Request $request, int $id): JsonResponse
    {
        $contact = Contact::findOrFail($id);
        $validated = $request->validate([
            'new_customer_id' => ['required', 'integer', 'exists:customers,id'],
        ]);

        $newCustomerId = (int) $validated['new_customer_id'];
        $oldCustomerId = $contact->customer_id;

        if ($oldCustomerId === $newCustomerId) {
            return response()->json([
                'success' => false,
                'message' => 'Người liên hệ đã thuộc khách hàng này.',
            ], 422);
        }

        \App\Models\ContactCustomerHistory::create([
            'contact_id' => $contact->id,
            'old_customer_id' => $oldCustomerId,
            'new_customer_id' => $newCustomerId,
            'changed_by' => $request->user()?->id ?? 1,
            'changed_at' => now(),
        ]);

        $contact->update([
            'customer_id' => $newCustomerId,
        ]);
        $contact->load('customer');

        return response()->json([
            'success' => true,
            'data' => [
                'id' => (string) $contact->id,
                'name' => $contact->name,
                'companyId' => (string) $contact->customer_id,
                'companyName' => $contact->customer?->name ?? 'Chưa gán',
            ],
            'message' => 'Chuyển người liên hệ sang công ty mới thành công.',
        ]);
    }

    /**
     * GET /api/v1/contacts/{id}/history
     */
    public function history(int $id): JsonResponse
    {
        $contact = Contact::findOrFail($id);
        $histories = \App\Models\ContactCustomerHistory::with(['oldCustomer:id,name', 'newCustomer:id,name'])
            ->where('contact_id', $contact->id)
            ->latest('changed_at')
            ->get()
            ->map(function ($h) {
                return [
                    'id' => $h->id,
                    'oldCustomerId' => $h->old_customer_id,
                    'oldCustomerName' => $h->oldCustomer?->name ?? 'Chưa gán',
                    'newCustomerId' => $h->new_customer_id,
                    'newCustomerName' => $h->newCustomer?->name ?? 'Chưa gán',
                    'changedAt' => $h->changed_at ? $h->changed_at->format('Y-m-d H:i:s') : null,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $histories,
            'message' => 'Lấy lịch sử chuyển công ty thành công.',
        ]);
    }
}
