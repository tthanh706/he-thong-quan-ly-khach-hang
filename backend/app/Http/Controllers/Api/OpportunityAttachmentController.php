<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UploadAttachmentRequest;
use App\Http\Resources\OpportunityAttachmentResource;
use App\Models\Opportunity;
use App\Models\OpportunityAttachment;
use App\Policies\OpportunityAttachmentPolicy;
use App\Services\OpportunityAttachmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class OpportunityAttachmentController extends Controller
{
    public function __construct(
        private readonly OpportunityAttachmentService $attachmentService,
        private readonly OpportunityAttachmentPolicy $policy
    ) {}

    /**
     * GET /api/opportunities/{opportunity}/attachments
     * List all attachments for an opportunity.
     */
    public function index(Request $request, Opportunity $opportunity): JsonResponse
    {
        if (!$this->policy->viewAttachments($request->user(), $opportunity)) {
            return response()->json([
                'message' => 'Bạn không có quyền xem tệp đính kèm của thương vụ này.',
            ], 403);
        }

        $attachments = $this->attachmentService->getAttachments($opportunity);

        return response()->json([
            'data'  => OpportunityAttachmentResource::collection($attachments),
            'meta'  => [
                'total_files' => $attachments->count(),
                'total_size'  => $attachments->sum('file_size'),
                'total_size_formatted' => $this->formatBytes($attachments->sum('file_size')),
            ],
        ]);
    }

    /**
     * POST /api/opportunities/{opportunity}/attachments
     * Upload multiple files to an opportunity.
     */
    public function store(UploadAttachmentRequest $request, Opportunity $opportunity): JsonResponse
    {
        if (!$this->policy->uploadAttachments($request->user(), $opportunity)) {
            return response()->json([
                'message' => 'Bạn không có quyền tải tệp lên thương vụ này.',
            ], 403);
        }

        $files = $request->file('files');
        $attachments = $this->attachmentService->uploadFiles(
            $opportunity,
            $files,
            $request->user()->id
        );

        return response()->json([
            'message' => "Đã tải lên {$attachments->count()} tệp thành công.",
            'data'    => OpportunityAttachmentResource::collection($attachments->load('uploader')),
        ], 201);
    }

    /**
     * GET /api/attachments/{attachment}/download
     * Download a specific attachment.
     */
    public function download(Request $request, OpportunityAttachment $attachment): BinaryFileResponse|JsonResponse
    {
        $opportunity = $attachment->opportunity;

        if (!$this->policy->viewAttachments($request->user(), $opportunity)) {
            return response()->json([
                'message' => 'Bạn không có quyền tải tệp này.',
            ], 403);
        }

        try {
            $filePath = $this->attachmentService->getDownloadPath($attachment);

            return response()->download(
                $filePath,
                $attachment->original_name,
                ['Content-Type' => $attachment->mime_type]
            );
        } catch (\Illuminate\Contracts\Filesystem\FileNotFoundException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 404);
        }
    }

    /**
     * DELETE /api/attachments/{attachment}
     * Delete a specific attachment.
     */
    public function destroy(Request $request, OpportunityAttachment $attachment): JsonResponse
    {
        $opportunity = $attachment->opportunity;

        if (!$this->policy->deleteAttachments($request->user(), $opportunity)) {
            return response()->json([
                'message' => 'Bạn không có quyền xoá tệp đính kèm này.',
            ], 403);
        }

        $fileName = $attachment->original_name;
        $this->attachmentService->deleteAttachment($attachment);

        return response()->json([
            'message' => "Đã xoá tệp \"{$fileName}\".",
        ]);
    }

    /**
     * Format bytes into human-readable string.
     */
    private function formatBytes(int $bytes): string
    {
        if ($bytes >= 1048576) {
            return round($bytes / 1048576, 2) . ' MB';
        }
        if ($bytes >= 1024) {
            return round($bytes / 1024, 2) . ' KB';
        }
        return $bytes . ' B';
    }
}
