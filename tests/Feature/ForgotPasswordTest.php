<?php

namespace Tests\Feature;

use App\Models\PasswordResetToken;
use App\Models\User;
use App\Notifications\ResetPasswordNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class ForgotPasswordTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_returns_generic_success_message_for_both_existing_and_non_existing_emails_anti_enumeration()
    {
        Notification::fake();
        $user = User::factory()->create(['email' => 'registered@company.com']);

        // 1. Test với Email TỒN TẠI
        $response1 = $this->post(route('password.email'), ['email' => 'registered@company.com']);
        $response1->assertStatus(302);
        $response1->assertSessionHas('status', function ($msg) {
            return str_contains($msg, 'Nếu địa chỉ email của bạn tồn tại');
        });
        Notification::assertSentTo($user, ResetPasswordNotification::class);

        // 2. Test với Email KHÔNG TỒN TẠI -> Phản hồi GIỐNG HỆT NHAU!
        $response2 = $this->post(route('password.email'), ['email' => 'unknown@company.com']);
        $response2->assertStatus(302);
        $response2->assertSessionHas('status', function ($msg) {
            return str_contains($msg, 'Nếu địa chỉ email của bạn tồn tại');
        });
    }

    /** @test */
    public function it_rejects_tokens_older_than_30_minutes()
    {
        $user = User::factory()->create(['email' => 'test@company.com']);
        [$rawToken, $tokenRecord] = PasswordResetToken::createTokenForEmail('test@company.com');

        // Tua thời gian trôi qua 31 phút
        Carbon::setTestNow(Carbon::now()->addMinutes(31));

        $response = $this->get(route('password.reset', ['token' => $rawToken]));

        $response->assertRedirect(route('password.request'));
        $response->assertSessionHasErrors(['email' => 'Liên kết đã hết hạn (chỉ có hiệu lực trong 30 phút). Vui lòng gửi yêu cầu mới.']);
    }

    /** @test */
    public function it_enforces_single_use_token_policy()
    {
        $user = User::factory()->create(['email' => 'test@company.com']);
        [$rawToken, $tokenRecord] = PasswordResetToken::createTokenForEmail('test@company.com');

        // Lần 1: Đổi mật khẩu thành công
        $response1 = $this->post(route('password.update'), [
            'token'                 => $rawToken,
            'email'                 => 'test@company.com',
            'password'              => 'NewStrongPassword123@',
            'password_confirmation' => 'NewStrongPassword123@',
        ]);

        $response1->assertRedirect(route('login'));
        $this->assertTrue(Hash::check('NewStrongPassword123@', $user->fresh()->password));
        $this->assertNotNull($tokenRecord->fresh()->used_at);

        // Lần 2: Nhấp lại liên kết cũ -> Bị từ chối ngay lập tức!
        $response2 = $this->get(route('password.reset', ['token' => $rawToken]));

        $response2->assertRedirect(route('password.request'));
        $response2->assertSessionHasErrors(['email' => 'Liên kết đặt lại mật khẩu này đã được sử dụng trước đó. Vui lòng gửi yêu cầu mới.']);
    }
}
