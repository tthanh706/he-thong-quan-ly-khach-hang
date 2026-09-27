<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ResetPasswordNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public string $token;

    /**
     * Create a new notification instance.
     */
    public function __construct(string $token)
    {
        $this->token = $token;
    }

    /**
     * Get the notification's delivery channels.
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $resetUrl = route('password.reset', [
            'token' => $this->token,
            'email' => $notifiable->getEmailForPasswordReset(),
        ]);

        return (new MailMessage)
            ->subject('[Khôi Phục Tài Khoản] Yêu cầu đặt lại mật khẩu của bạn')
            ->greeting('Xin chào ' . ($notifiable->name ?? 'bạn') . ',')
            ->line('Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản hệ thống của bạn.')
            ->action('Đặt Lại Mật Khẩu Ngay', $resetUrl)
            ->line('⚠️ **Lưu ý bảo mật:** Liên kết này chỉ có hiệu lực trong **30 phút** kể từ thời điểm gửi và chỉ được sử dụng **1 lần duy nhất**.')
            ->line('Nếu bạn không gửi yêu cầu này, hãy bỏ qua email này. Mật khẩu của bạn vẫn an toàn.')
            ->salutation('Trân trọng, Đội ngũ Kỹ Thuật');
    }
}
