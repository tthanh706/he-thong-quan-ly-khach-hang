<?php

namespace Tests\Unit\Services;

use App\Models\Opportunity;
use App\Models\OpportunityAttachment;
use App\Models\User;
use App\Services\OpportunityAttachmentService;
use Illuminate\Contracts\Filesystem\FileNotFoundException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class OpportunityAttachmentServiceTest extends TestCase
{
    use RefreshDatabase;

    private OpportunityAttachmentService $service;
    private User $user;
    private Opportunity $opportunity;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');

        $this->service     = new OpportunityAttachmentService();
        $this->user        = User::factory()->create();
        $this->opportunity = Opportunity::factory()->create([
            'owner_id' => $this->user->id,
        ]);
    }

    public function test_upload_files_creates_attachment_records_and_stores_files(): void
    {
        $files = [
            UploadedFile::fake()->create('contract.pdf', 500, 'application/pdf'),
            UploadedFile::fake()->create('requirements.docx', 300, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
        ];

        $attachments = $this->service->uploadFiles($this->opportunity, $files, $this->user->id);

        $this->assertCount(2, $attachments);

        foreach ($attachments as $attachment) {
            $this->assertInstanceOf(OpportunityAttachment::class, $attachment);
            $this->assertEquals($this->opportunity->id, $attachment->opportunity_id);
            $this->assertEquals($this->user->id, $attachment->uploaded_by);
            Storage::disk('local')->assertExists($attachment->file_path);
        }
    }

    public function test_get_attachments_returns_ordered_collection_with_uploader(): void
    {
        $file1 = UploadedFile::fake()->create('file1.pdf', 100, 'application/pdf');
        $file2 = UploadedFile::fake()->create('file2.pdf', 200, 'application/pdf');

        $this->service->uploadFiles($this->opportunity, [$file1, $file2], $this->user->id);

        $attachments = $this->service->getAttachments($this->opportunity);

        $this->assertCount(2, $attachments);
        $this->assertTrue($attachments->first()->relationLoaded('uploader'));
        $this->assertEquals($this->user->id, $attachments->first()->uploader->id);
    }

    public function test_delete_attachment_removes_file_and_record(): void
    {
        $file = UploadedFile::fake()->create('delete_me.pdf', 100, 'application/pdf');
        $attachments = $this->service->uploadFiles($this->opportunity, [$file], $this->user->id);
        $attachment = $attachments->first();

        Storage::disk('local')->assertExists($attachment->file_path);

        $result = $this->service->deleteAttachment($attachment);

        $this->assertTrue($result);
        Storage::disk('local')->assertMissing($attachment->file_path);
        $this->assertDatabaseMissing('opportunity_attachments', ['id' => $attachment->id]);
    }

    public function test_get_download_path_returns_full_path_when_file_exists(): void
    {
        $file = UploadedFile::fake()->create('downloadable.pdf', 100, 'application/pdf');
        $attachments = $this->service->uploadFiles($this->opportunity, [$file], $this->user->id);
        $attachment = $attachments->first();

        $path = $this->service->getDownloadPath($attachment);

        $this->assertNotEmpty($path);
        $this->assertStringContainsString('downloadable', $attachment->original_name);
    }

    public function test_get_download_path_throws_exception_when_file_missing_on_disk(): void
    {
        $attachment = OpportunityAttachment::factory()->create([
            'opportunity_id' => $this->opportunity->id,
            'uploaded_by'    => $this->user->id,
            'file_path'      => 'nonexistent/path/file.pdf',
            'disk'           => 'local',
        ]);

        $this->expectException(FileNotFoundException::class);
        $this->service->getDownloadPath($attachment);
    }
}
