<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Email gửi mật khẩu tạm cho tài khoản được tạo từ file nhập hàng loạt (S2-01).
 */
class ImportedUserWelcomeMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public User $user, public string $temporaryPassword) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Tài khoản CRM của bạn đã được tạo');
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.imported-user-welcome',
            with: ['loginUrl' => rtrim((string) config('app.frontend_url'), '/')],
        );
    }
}
