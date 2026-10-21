<?php

namespace App\Services;

use App\Models\Opportunity;
use App\Models\OpportunityAttachment;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class OpportunityAttachmentService
{
    /**
     * Upload multiple files to an opportunity.
     *
     * @param Opportunity $opportunity
     * @param array<UploadedFile> $files
     * @param int $uploadedBy User ID
     * @return Collection<int, OpportunityAttachment>
     */
    public function uploadFiles(Opportunity $opportunity, array $files, int $uploadedBy): Collection
    {
        $attachments = collect();

        foreach ($files as $file) {
            $attachment = $this->uploadSingleFile($opportunity, $file, $uploadedBy);
            $attachments->push($attachment);
        }

        return $attachments;
    }

    /**
     * Upload a single file and create attachment record.
     */
    private function uploadSingleFile(
        Opportunity $opportunity,
        UploadedFile $file,
        int $uploadedBy
    ): OpportunityAttachment {
        $originalName = $file->getClientOriginalName();
        $extension    = $file->getClientOriginalExtension();
        $fileName     = Str::uuid() . '.' . $extension;
        $directory    = "opportunities/{$opportunity->id}/attachments";

        // Store file
        $path = $file->storeAs($directory, $fileName, 'local');

        return OpportunityAttachment::create([
            'opportunity_id' => $opportunity->id,
            'file_name'      => $fileName,
            'original_name'  => $originalName,
            'file_path'      => $path,
            'mime_type'      => $file->getMimeType() ?? 'application/octet-stream',
            'file_size'      => $file->getSize(),
            'disk'           => 'local',
            'uploaded_by'    => $uploadedBy,
        ]);
    }

    /**
     * Get all attachments for an opportunity.
     */
    public function getAttachments(Opportunity $opportunity): Collection
    {
        return $opportunity->attachments()
            ->with('uploader')
            ->orderByDesc('created_at')
            ->get();
    }

    /**
     * Delete an attachment (file + record).
     */
    public function deleteAttachment(OpportunityAttachment $attachment): bool
    {
        // Delete file from disk
        Storage::disk($attachment->disk)->delete($attachment->file_path);

        return $attachment->delete();
    }

    /**
     * Get download path for an attachment.
     *
     * @throws \Illuminate\Contracts\Filesystem\FileNotFoundException
     */
    public function getDownloadPath(OpportunityAttachment $attachment): string
    {
        $disk = Storage::disk($attachment->disk);

        if (!$disk->exists($attachment->file_path)) {
            throw new \Illuminate\Contracts\Filesystem\FileNotFoundException(
                "Tệp không tồn tại: {$attachment->original_name}"
            );
        }

        return $disk->path($attachment->file_path);
    }
}
