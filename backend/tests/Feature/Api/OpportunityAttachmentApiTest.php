<?php

namespace Tests\Feature\Api;

use App\Models\Opportunity;
use App\Models\OpportunityAttachment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class OpportunityAttachmentApiTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;
    private User $sharedUser;
    private User $manager;
    private User $outsider;
    private Opportunity $opportunity;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');

        $this->owner      = User::factory()->create(['role' => 'sales_rep']);
        $this->sharedUser = User::factory()->create(['role' => 'sales_rep']);
        $this->manager    = User::factory()->create(['role' => 'manager']);
        $this->outsider   = User::factory()->create(['role' => 'sales_rep']);

        $this->opportunity = Opportunity::factory()->create([
            'owner_id' => $this->owner->id,
        ]);

        // Share with sharedUser
        $this->opportunity->sharedUsers()->attach($this->sharedUser->id, [
            'permission' => 'view',
        ]);
    }

    // ─── Upload Tests ───────────────────────────────────────────────

    public function test_owner_can_upload_files(): void
    {
        $files = [
            UploadedFile::fake()->create('proposal.pdf', 1024, 'application/pdf'),
            UploadedFile::fake()->create('budget.xlsx', 2048, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
        ];

        $response = $this->actingAs($this->owner)
            ->postJson("/api/opportunities/{$this->opportunity->id}/attachments", [
                'files' => $files,
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('message', 'Đã tải lên 2 tệp thành công.')
            ->assertJsonCount(2, 'data');

        $this->assertDatabaseCount('opportunity_attachments', 2);
    }

    public function test_shared_user_can_upload_files(): void
    {
        $files = [
            UploadedFile::fake()->create('notes.txt', 100, 'text/plain'),
        ];

        $response = $this->actingAs($this->sharedUser)
            ->postJson("/api/opportunities/{$this->opportunity->id}/attachments", [
                'files' => $files,
            ]);

        $response->assertStatus(201);
    }

    public function test_manager_can_upload_files(): void
    {
        $files = [
            UploadedFile::fake()->create('report.pdf', 500, 'application/pdf'),
        ];

        $response = $this->actingAs($this->manager)
            ->postJson("/api/opportunities/{$this->opportunity->id}/attachments", [
                'files' => $files,
            ]);

        $response->assertStatus(201);
    }

    public function test_outsider_cannot_upload_files(): void
    {
        $files = [
            UploadedFile::fake()->create('hack.pdf', 100, 'application/pdf'),
        ];

        $response = $this->actingAs($this->outsider)
            ->postJson("/api/opportunities/{$this->opportunity->id}/attachments", [
                'files' => $files,
            ]);

        $response->assertStatus(403);
    }

    public function test_rejects_file_exceeding_20mb(): void
    {
        $file = UploadedFile::fake()->create('huge.pdf', 21000, 'application/pdf'); // ~21MB

        $response = $this->actingAs($this->owner)
            ->postJson("/api/opportunities/{$this->opportunity->id}/attachments", [
                'files' => [$file],
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['files.0']);
    }

    public function test_rejects_empty_files_array(): void
    {
        $response = $this->actingAs($this->owner)
            ->postJson("/api/opportunities/{$this->opportunity->id}/attachments", [
                'files' => [],
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['files']);
    }

    // ─── List Tests ─────────────────────────────────────────────────

    public function test_owner_can_list_attachments(): void
    {
        OpportunityAttachment::factory()->count(3)->create([
            'opportunity_id' => $this->opportunity->id,
            'uploaded_by'    => $this->owner->id,
        ]);

        $response = $this->actingAs($this->owner)
            ->getJson("/api/opportunities/{$this->opportunity->id}/attachments");

        $response->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonStructure([
                'data' => [[
                    'id', 'original_name', 'mime_type', 'file_size',
                    'formatted_size', 'uploaded_by', 'uploader',
                    'download_url', 'created_at',
                ]],
                'meta' => ['total_files', 'total_size', 'total_size_formatted'],
            ]);
    }

    public function test_outsider_cannot_list_attachments(): void
    {
        $response = $this->actingAs($this->outsider)
            ->getJson("/api/opportunities/{$this->opportunity->id}/attachments");

        $response->assertStatus(403);
    }

    // ─── Download Tests ─────────────────────────────────────────────

    public function test_owner_can_download_attachment(): void
    {
        Storage::fake('local');
        $file = UploadedFile::fake()->create('test.pdf', 100, 'application/pdf');
        $path = $file->storeAs('opportunities/1/attachments', 'test.pdf', 'local');

        $attachment = OpportunityAttachment::factory()->create([
            'opportunity_id' => $this->opportunity->id,
            'file_path'      => $path,
            'original_name'  => 'test.pdf',
            'disk'           => 'local',
            'uploaded_by'    => $this->owner->id,
        ]);

        $response = $this->actingAs($this->owner)
            ->get("/api/attachments/{$attachment->id}/download");

        $response->assertOk();
    }

    public function test_outsider_cannot_download_attachment(): void
    {
        $attachment = OpportunityAttachment::factory()->create([
            'opportunity_id' => $this->opportunity->id,
            'uploaded_by'    => $this->owner->id,
        ]);

        $response = $this->actingAs($this->outsider)
            ->get("/api/attachments/{$attachment->id}/download");

        $response->assertStatus(403);
    }

    // ─── Delete Tests ───────────────────────────────────────────────

    public function test_owner_can_delete_attachment(): void
    {
        Storage::fake('local');
        $attachment = OpportunityAttachment::factory()->create([
            'opportunity_id' => $this->opportunity->id,
            'uploaded_by'    => $this->owner->id,
            'disk'           => 'local',
        ]);

        $response = $this->actingAs($this->owner)
            ->deleteJson("/api/attachments/{$attachment->id}");

        $response->assertOk();
        $this->assertDatabaseMissing('opportunity_attachments', ['id' => $attachment->id]);
    }

    public function test_shared_user_cannot_delete_attachment(): void
    {
        $attachment = OpportunityAttachment::factory()->create([
            'opportunity_id' => $this->opportunity->id,
            'uploaded_by'    => $this->owner->id,
        ]);

        $response = $this->actingAs($this->sharedUser)
            ->deleteJson("/api/attachments/{$attachment->id}");

        $response->assertStatus(403);
    }

    public function test_manager_can_delete_attachment(): void
    {
        Storage::fake('local');
        $attachment = OpportunityAttachment::factory()->create([
            'opportunity_id' => $this->opportunity->id,
            'uploaded_by'    => $this->owner->id,
            'disk'           => 'local',
        ]);

        $response = $this->actingAs($this->manager)
            ->deleteJson("/api/attachments/{$attachment->id}");

        $response->assertOk();
    }

    // ─── Metadata Tests ─────────────────────────────────────────────

    public function test_attachment_metadata_includes_all_required_fields(): void
    {
        OpportunityAttachment::factory()->create([
            'opportunity_id' => $this->opportunity->id,
            'original_name'  => 'proposal_v2.pdf',
            'file_size'      => 2560000,
            'mime_type'      => 'application/pdf',
            'uploaded_by'    => $this->owner->id,
        ]);

        $response = $this->actingAs($this->owner)
            ->getJson("/api/opportunities/{$this->opportunity->id}/attachments");

        $response->assertOk();

        $attachment = $response->json('data.0');
        $this->assertEquals('proposal_v2.pdf', $attachment['original_name']);
        $this->assertEquals(2560000, $attachment['file_size']);
        $this->assertNotNull($attachment['formatted_size']);
        $this->assertNotNull($attachment['uploader']);
        $this->assertNotNull($attachment['created_at']);
        $this->assertNotNull($attachment['download_url']);
    }
}
