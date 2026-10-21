<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OpportunityAttachmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'opportunity_id' => $this->opportunity_id,
            'file_name'      => $this->file_name,
            'original_name'  => $this->original_name,
            'mime_type'      => $this->mime_type,
            'file_size'      => $this->file_size,
            'formatted_size' => $this->formatted_size,
            'uploaded_by'    => $this->uploaded_by,
            'uploader'       => $this->whenLoaded('uploader', fn() => [
                'id'   => $this->uploader->id,
                'name' => $this->uploader->name,
            ]),
            'download_url'   => route('attachments.download', $this->id),
            'created_at'     => $this->created_at?->toISOString(),
            'updated_at'     => $this->updated_at?->toISOString(),
        ];
    }
}
