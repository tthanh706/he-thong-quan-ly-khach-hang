<?php

namespace App\Services;

use App\Models\Contact;
use App\Models\ContactCustomerHistory;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class ContactService
{
    public function getContacts(array $filters): LengthAwarePaginator
    {
        $query = Contact::query()
            ->with('customer');

        if (!empty($filters['customer_id'])) {
            $query->where(
                'customer_id',
                $filters['customer_id']
            );
        }

        if (!empty($filters['decision_role'])) {
            $query->where(
                'decision_role',
                $filters['decision_role']
            );
        }

        if (array_key_exists('is_primary', $filters)) {
            $query->where(
                'is_primary',
                (bool) $filters['is_primary']
            );
        }

        if (!empty($filters['search'])) {
            $search = trim($filters['search']);

            $query->where(function ($builder) use ($search) {
                $builder
                    ->where(
                        'full_name',
                        'like',
                        '%' . $search . '%'
                    )
                    ->orWhere(
                        'job_title',
                        'like',
                        '%' . $search . '%'
                    )
                    ->orWhere(
                        'email',
                        'like',
                        '%' . $search . '%'
                    )
                    ->orWhere(
                        'phone',
                        'like',
                        '%' . $search . '%'
                    );
            });
        }

        return $query
            ->latest('id')
            ->paginate(
                $filters['per_page'] ?? 15
            );
    }

    public function getContactsByCustomer(
        int $customerId
    ): Collection {
        return Contact::query()
            ->where('customer_id', $customerId)
            ->with('customer')
            ->orderByDesc('is_primary')
            ->orderBy('full_name')
            ->get();
    }

    public function createContact(
        array $data
    ): Contact {
        return DB::transaction(
            function () use ($data) {
                if (!empty($data['is_primary'])) {
                    $this->clearPrimaryContact(
                        (int) $data['customer_id']
                    );
                }

                return Contact::create($data)
                    ->load('customer');
            }
        );
    }

    public function updateContact(
        Contact $contact,
        array $data
    ): Contact {
        return DB::transaction(
            function () use ($contact, $data) {
                if (
                    array_key_exists(
                        'is_primary',
                        $data
                    )
                    && $data['is_primary'] === true
                ) {
                    $this->clearPrimaryContact(
                        $contact->customer_id,
                        $contact->id
                    );
                }

                $contact->update($data);

                return $contact
                    ->fresh()
                    ->load('customer');
            }
        );
    }

    public function deleteContact(
        Contact $contact
    ): void {
        DB::transaction(
            function () use ($contact) {
                $contact->delete();
            }
        );
    }

    public function transferContact(
        Contact $contact,
        int $newCustomerId,
        ?User $changedBy
    ): Contact {
        if (
            $contact->customer_id === $newCustomerId
        ) {
            throw new \InvalidArgumentException(
                'Người liên hệ đã thuộc khách hàng này.'
            );
        }

        return DB::transaction(
            function () use (
                $contact,
                $newCustomerId,
                $changedBy
            ) {
                $oldCustomerId =
                    $contact->customer_id;

                ContactCustomerHistory::create([
                    'contact_id' =>
                        $contact->id,
                    'old_customer_id' =>
                        $oldCustomerId,
                    'new_customer_id' =>
                        $newCustomerId,
                    'changed_by' =>
                        $changedBy?->id,
                    'changed_at' =>
                        now(),
                ]);

                $contact->update([
                    'customer_id' =>
                        $newCustomerId,
                    'is_primary' =>
                        false,
                ]);

                return $contact
                    ->fresh()
                    ->load('customer');
            }
        );
    }

    public function getHistory(
        Contact $contact
    ): Collection {
        return ContactCustomerHistory::query()
            ->where(
                'contact_id',
                $contact->id
            )
            ->with([
                'oldCustomer',
                'newCustomer',
                'changedByUser',
            ])
            ->latest('changed_at')
            ->get();
    }

    private function clearPrimaryContact(
        int $customerId,
        ?int $exceptContactId = null
    ): void {
        $query = Contact::query()
            ->where(
                'customer_id',
                $customerId
            )
            ->where(
                'is_primary',
                true
            );

        if ($exceptContactId !== null) {
            $query->where(
                'id',
                '!=',
                $exceptContactId
            );
        }

        $query->update([
            'is_primary' => false,
        ]);
    }
}