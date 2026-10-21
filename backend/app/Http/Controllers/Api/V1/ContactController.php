<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\FilterContactRequest;
use App\Http\Requests\StoreContactRequest;
use App\Http\Requests\TransferContactRequest;
use App\Http\Requests\UpdateContactRequest;
use App\Http\Resources\ContactHistoryResource;
use App\Http\Resources\ContactResource;
use App\Models\Contact;
use App\Services\ContactService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContactController extends Controller
{
    public function __construct(
        private readonly ContactService $contactService
    ) {
    }

    public function index(
        FilterContactRequest $request
    ): JsonResponse {
        $contacts = $this->contactService
            ->getContacts($request->validated());

        return response()->json([
            'success' => true,
            'data' => ContactResource::collection(
                $contacts->items()
            ),
            'meta' => [
                'current_page' => $contacts->currentPage(),
                'last_page' => $contacts->lastPage(),
                'per_page' => $contacts->perPage(),
                'total' => $contacts->total(),
            ],
            'message' => 'Lấy danh sách người liên hệ thành công.',
        ]);
    }

    public function store(
        StoreContactRequest $request
    ): JsonResponse {
        $contact = $this->contactService
            ->createContact($request->validated());

        return response()->json([
            'success' => true,
            'data' => new ContactResource($contact),
            'message' => 'Thêm người liên hệ thành công.',
        ], 201);
    }

    public function show(
        Contact $contact
    ): JsonResponse {
        $contact->load('customer');

        return response()->json([
            'success' => true,
            'data' => new ContactResource($contact),
            'message' => 'Lấy thông tin người liên hệ thành công.',
        ]);
    }

    public function update(
        UpdateContactRequest $request,
        Contact $contact
    ): JsonResponse {
        $contact = $this->contactService
            ->updateContact(
                $contact,
                $request->validated()
            );

        return response()->json([
            'success' => true,
            'data' => new ContactResource($contact),
            'message' => 'Cập nhật người liên hệ thành công.',
        ]);
    }

    public function destroy(
        Contact $contact
    ): JsonResponse {
        $this->contactService
            ->deleteContact($contact);

        return response()->json([
            'success' => true,
            'data' => null,
            'message' => 'Xóa người liên hệ thành công.',
        ]);
    }

    public function transfer(
        TransferContactRequest $request,
        Contact $contact
    ): JsonResponse {
        try {
            $currentUser = $request->attributes
                ->get('current_user');

            $contact = $this->contactService
                ->transferContact(
                    $contact,
                    (int) $request->validated(
                        'new_customer_id'
                    ),
                    $currentUser
                );

            return response()->json([
                'success' => true,
                'data' => new ContactResource($contact),
                'message' =>
                    'Chuyển người liên hệ sang khách hàng mới thành công.',
            ]);
        } catch (\InvalidArgumentException $exception) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => $exception->getMessage(),
            ], 422);
        }
    }

    public function history(
        Contact $contact
    ): JsonResponse {
        $histories = $this->contactService
            ->getHistory($contact);

        return response()->json([
            'success' => true,
            'data' => ContactHistoryResource::collection(
                $histories
            ),
            'message' =>
                'Lấy lịch sử chuyển khách hàng thành công.',
        ]);
    }
}