<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\UserSession;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * S2-03: Tải lên ảnh đại diện (Avatar) hiển thị trên hệ thống.
 */
class AvatarUploadTest extends TestCase
{
    use RefreshDatabase;

    private const AVATAR_URL = '/api/v1/profile/avatar';

    protected function setUp(): void
    {
        parent::setUp();

        if (!function_exists('imagecreatetruecolor')) {
            $this->markTestSkipped('PHP extension gd chưa được bật.');
        }

        Storage::fake('public');
    }

    private function makeUser(): User
    {
        return User::create(['name' => 'An', 'email' => 'an@company.com', 'password' => Hash::make('password'), 'role' => 'staff']);
    }

    private function tokenFor(User $user): string
    {
        return UserSession::create([
            'user_id' => $user->id,
            'token' => hash('sha256', uniqid((string) $user->id, true)),
            'last_activity' => now(),
            'expires_at' => now()->addMinutes(30),
            'revoked' => false,
        ])->token;
    }

    private function upload(string $token, UploadedFile $file): \Illuminate\Testing\TestResponse
    {
        return $this->withToken($token)->post(self::AVATAR_URL, ['avatar' => $file], ['Accept' => 'application/json']);
    }

    public function test_user_can_upload_avatar(): void
    {
        $user = $this->makeUser();

        $response = $this->upload($this->tokenFor($user), UploadedFile::fake()->image('me.png', 256, 256));

        $response->assertOk()->assertJsonPath('message', 'Cập nhật ảnh đại diện thành công.');

        $path = $user->fresh()->avatar_path;
        $this->assertNotNull($path);
        $this->assertStringStartsWith("avatars/{$user->id}/", $path);
        Storage::disk('public')->assertExists($path);
        $this->assertStringEndsWith($path, (string) $response->json('data.avatar_url'));
    }

    public function test_avatar_url_is_exposed_on_current_user(): void
    {
        $user = $this->makeUser();
        $token = $this->tokenFor($user);
        $this->upload($token, UploadedFile::fake()->image('me.jpg', 128, 128))->assertOk();

        $this->withToken($token)->getJson('/api/me')
            ->assertOk()
            ->assertJsonPath('user.avatar_url', Storage::disk('public')->url($user->fresh()->avatar_path))
            ->assertJsonMissingPath('user.avatar_path');
    }

    public function test_replacing_avatar_deletes_previous_file(): void
    {
        $user = $this->makeUser();
        $token = $this->tokenFor($user);

        $this->upload($token, UploadedFile::fake()->image('old.png', 128, 128))->assertOk();
        $oldPath = $user->fresh()->avatar_path;

        $this->upload($token, UploadedFile::fake()->image('new.png', 128, 128))->assertOk();
        $newPath = $user->fresh()->avatar_path;

        $this->assertNotSame($oldPath, $newPath);
        Storage::disk('public')->assertMissing($oldPath);
        Storage::disk('public')->assertExists($newPath);
    }

    public function test_user_can_remove_avatar(): void
    {
        $user = $this->makeUser();
        $token = $this->tokenFor($user);
        $this->upload($token, UploadedFile::fake()->image('me.png', 128, 128))->assertOk();
        $path = $user->fresh()->avatar_path;

        $this->withToken($token)->deleteJson(self::AVATAR_URL)
            ->assertOk()
            ->assertJsonPath('data.avatar_url', null);

        $this->assertNull($user->fresh()->avatar_path);
        Storage::disk('public')->assertMissing($path);
    }

    public function test_avatar_must_be_valid_image(): void
    {
        $token = $this->tokenFor($this->makeUser());

        $this->upload($token, UploadedFile::fake()->create('cv.pdf', 100, 'application/pdf'))
            ->assertStatus(422)->assertJsonValidationErrors(['avatar']);

        $this->upload($token, UploadedFile::fake()->image('big.jpg', 512, 512)->size(3000))
            ->assertStatus(422)->assertJsonValidationErrors(['avatar']);

        $this->upload($token, UploadedFile::fake()->image('tiny.png', 32, 32))
            ->assertStatus(422)->assertJsonValidationErrors(['avatar']);
    }

    public function test_guest_cannot_upload_avatar(): void
    {
        $this->post(self::AVATAR_URL, ['avatar' => UploadedFile::fake()->image('me.png', 128, 128)], ['Accept' => 'application/json'])
            ->assertUnauthorized();
    }
}
