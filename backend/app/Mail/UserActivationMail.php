<?php
namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class UserActivationMail extends Mailable
{
    use Queueable, SerializesModels;
    public function __construct(public User $user, public string $tempPassword, public string $activationUrl) {}
    public function build()
    {
        return $this->subject('Kích hoạt tài khoản CRM')->view('emails.user-activation');
    }
}
