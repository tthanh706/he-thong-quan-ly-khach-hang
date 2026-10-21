<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\LeadStatusEnum;
use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\WebForm;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

class WebFormController extends Controller
{
    /**
     * Danh sách biểu mẫu web thu thập lead (S4-01)
     */
    public function index(Request $request): JsonResponse
    {
        $query = WebForm::query()->withCount('leads')->with('creator:id,name,email');

        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('source', 'like', "%{$search}%");
            });
        }

        if ($request->has('is_active') && $request->input('is_active') !== '') {
            $query->where('is_active', filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        $forms = $query->orderBy('created_at', 'desc')->paginate($request->input('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $forms,
        ]);
    }

    /**
     * Tạo mới biểu mẫu thu thập lead
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'source' => 'nullable|string|max:100',
            'title' => 'nullable|string|max:200',
            'description' => 'nullable|string',
            'submit_button_text' => 'nullable|string|max:50',
            'success_message' => 'nullable|string',
            'rate_limit_per_minute' => 'nullable|integer|min:1|max:60',
            'is_active' => 'nullable|boolean',
        ]);

        $currentUser = $request->attributes->get('current_user') ?? auth()->user();

        $form = new WebForm();
        $form->name = $validated['name'];
        $form->code = 'WF-' . strtoupper(Str::random(6));
        $form->embed_token = Str::random(40);
        $form->source = $validated['source'] ?: 'Website';
        $form->title = $validated['title'] ?? ('Đăng ký tư vấn: ' . $validated['name']);
        $form->description = $validated['description'] ?? 'Vui lòng để lại thông tin, chúng tôi sẽ liên hệ tư vấn trong 15 phút.';
        $form->submit_button_text = $validated['submit_button_text'] ?: 'Gửi thông tin';
        $form->success_message = $validated['success_message'] ?: 'Cảm ơn bạn đã quan tâm! Đội ngũ tư vấn sẽ liên hệ ngay.';
        $form->rate_limit_per_minute = $validated['rate_limit_per_minute'] ?? 5;
        $form->is_active = $request->input('is_active', true);
        $form->created_by = $currentUser?->id;
        $form->save();

        return response()->json([
            'success' => true,
            'message' => 'Tạo biểu mẫu web thành công',
            'data' => $this->formatFormResponse($form),
        ], 201);
    }

    /**
     * Chi tiết biểu mẫu kèm thống kê và mã nhúng
     */
    public function show(int $id): JsonResponse
    {
        $form = WebForm::with(['creator:id,name,email'])
            ->withCount('leads')
            ->findOrFail($id);

        $recentLeads = Lead::where('web_form_id', $form->id)
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        return response()->json([
            'success' => true,
            'data' => array_merge($this->formatFormResponse($form), [
                'recent_leads' => $recentLeads,
            ]),
        ]);
    }

    /**
     * Cập nhật biểu mẫu web
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $form = WebForm::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:150',
            'source' => 'nullable|string|max:100',
            'title' => 'nullable|string|max:200',
            'description' => 'nullable|string',
            'submit_button_text' => 'nullable|string|max:50',
            'success_message' => 'nullable|string',
            'rate_limit_per_minute' => 'nullable|integer|min:1|max:60',
            'is_active' => 'nullable|boolean',
        ]);

        $form->fill($validated);
        $form->save();

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật biểu mẫu thành công',
            'data' => $this->formatFormResponse($form),
        ]);
    }

    /**
     * Xóa biểu mẫu
     */
    public function destroy(int $id): JsonResponse
    {
        $form = WebForm::findOrFail($id);
        $form->delete();

        return response()->json([
            'success' => true,
            'message' => 'Đã xóa biểu mẫu web',
        ]);
    }

    /**
     * Lấy mã nhúng HTML và iframe
     */
    public function getEmbedCode(int $id): JsonResponse
    {
        $form = WebForm::findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $this->generateEmbedSnippets($form),
        ]);
    }

    /**
     * PUBLIC API: Lấy thông tin form để render trên website bất kỳ
     */
    public function getPublicForm(string $token): JsonResponse
    {
        $form = WebForm::where('embed_token', $token)
            ->where('is_active', true)
            ->first();

        if (!$form) {
            return response()->json([
                'success' => false,
                'message' => 'Biểu mẫu không tồn tại hoặc đã ngừng hoạt động',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'code' => $form->code,
                'title' => $form->title,
                'description' => $form->description,
                'submit_button_text' => $form->submit_button_text,
                'source' => $form->source,
                'fields' => [
                    ['name' => 'name', 'label' => 'Họ và tên', 'type' => 'text', 'required' => true, 'placeholder' => 'Nguyễn Văn A'],
                    ['name' => 'email', 'label' => 'Email liên hệ', 'type' => 'email', 'required' => true, 'placeholder' => 'email@example.com'],
                    ['name' => 'phone', 'label' => 'Số điện thoại', 'type' => 'tel', 'required' => true, 'placeholder' => '0912 345 678'],
                    ['name' => 'company', 'label' => 'Tên công ty / Tổ chức', 'type' => 'text', 'required' => false, 'placeholder' => 'Công ty ABC'],
                    ['name' => 'interest_demand', 'label' => 'Nhu cầu quan tâm', 'type' => 'textarea', 'required' => false, 'placeholder' => 'Nhu cầu giải pháp hoặc sản phẩm...'],
                ],
            ],
        ]);
    }

    /**
     * PUBLIC API: Thu thập Lead từ biểu mẫu nhúng (S4-01)
     * - Chống spam honeypot
     * - Rate limit theo IP
     * - Gắn đúng nguồn và trạng thái Mới (waiting_assignment)
     */
    public function submitPublicForm(Request $request, string $token): JsonResponse
    {
        $form = WebForm::where('embed_token', $token)->first();

        if (!$form || !$form->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Biểu mẫu không tồn tại hoặc đã tạm dừng nhận đăng ký',
            ], 404);
        }

        // 1. Chống Spam: Kỹ thuật Honeypot (_hp_website không được phép có giá trị)
        if ($request->filled('_hp_website') || $request->filled('fax_number_hp')) {
            return response()->json([
                'success' => false,
                'message' => 'Hệ thống phát hiện hoạt động tự động bất thường (Spam).',
            ], 422);
        }

        // 2. Chống Spam: Giới hạn tần suất gửi theo địa chỉ IP
        $clientIp = $request->ip() ?: 'unknown_ip';
        $rateLimitKey = 'web_form_submit:' . $form->id . ':' . md5($clientIp);
        $maxAttempts = $form->rate_limit_per_minute ?: 5;

        if (RateLimiter::tooManyAttempts($rateLimitKey, $maxAttempts)) {
            $seconds = RateLimiter::availableIn($rateLimitKey);
            return response()->json([
                'success' => false,
                'message' => "Bạn đã gửi quá nhiều yêu cầu từ địa chỉ IP này ({$clientIp}). Vui lòng thử lại sau {$seconds} giây.",
            ], 429);
        }

        RateLimiter::hit($rateLimitKey, 60);

        // 3. Xác thực dữ liệu lead
        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'email' => 'required|email|max:150',
            'phone' => 'required|string|max:30',
            'company' => 'nullable|string|max:150',
            'interest_demand' => 'nullable|string|max:1000',
        ], [
            'name.required' => 'Vui lòng nhập họ và tên',
            'email.required' => 'Vui lòng nhập email',
            'email.email' => 'Email không đúng định dạng',
            'phone.required' => 'Vui lòng nhập số điện thoại',
        ]);

        // 4. Tạo Lead mới ở trạng thái Mới (waiting_assignment) và gắn đúng nguồn của form
        $lead = Lead::create([
            'name' => trim($validated['name']),
            'email' => strtolower(trim($validated['email'])),
            'phone' => trim($validated['phone']),
            'company' => !empty($validated['company']) ? trim($validated['company']) : null,
            'interest_demand' => !empty($validated['interest_demand']) ? trim($validated['interest_demand']) : null,
            'source' => $form->source ?: 'Website Form',
            'status' => LeadStatusEnum::WAITING_ASSIGNMENT,
            'web_form_id' => $form->id,
            'ip_address' => $clientIp,
        ]);

        // Cập nhật lượt gửi
        $form->increment('submission_count');

        return response()->json([
            'success' => true,
            'message' => $form->success_message ?: 'Gửi thông tin thành công! Cảm ơn bạn đã đăng ký.',
            'data' => [
                'lead_id' => $lead->id,
                'form_code' => $form->code,
                'created_at' => $lead->created_at,
            ],
        ], 201);
    }

    /**
     * Helpers tạo snippet nhúng
     */
    private function formatFormResponse(WebForm $form): array
    {
        $arr = $form->toArray();
        $arr['embed_snippets'] = $this->generateEmbedSnippets($form);
        return $arr;
    }

    private function generateEmbedSnippets(WebForm $form): array
    {
        $backendUrl = config('app.url', 'http://127.0.0.1:8000');
        $submitUrl = "{$backendUrl}/api/v1/public/web-forms/{$form->embed_token}/submit";
        $formEmbedUrl = "{$backendUrl}/web-form-embed/{$form->embed_token}";

        $iframeSnippet = "<iframe\n  src=\"{$formEmbedUrl}\"\n  width=\"100%\"\n  height=\"520\"\n  frameborder=\"0\"\n  style=\"border:none;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,0.08);overflow:hidden;\"\n  title=\"{$form->name}\">\n</iframe>";

        $htmlSnippet = <<<HTML
<!-- CRM Lead Capture Form ({$form->code}) -->
<form id="crm-lead-form-{$form->code}" action="{$submitUrl}" method="POST" style="max-width:500px;font-family:sans-serif;padding:24px;border:1px solid #e2e8f0;border-radius:12px;background:#ffffff;">
  <h3 style="margin-top:0;margin-bottom:8px;color:#1e293b;">{$form->title}</h3>
  <p style="margin-top:0;margin-bottom:16px;color:#64748b;font-size:14px;">{$form->description}</p>
  
  <!-- Anti-spam Honeypot -->
  <input type="text" name="_hp_website" style="display:none!important;" tabindex="-1" autocomplete="off" />

  <div style="margin-bottom:12px;">
    <label style="display:block;font-size:13px;font-weight:600;margin-bottom:4px;color:#334155;">Họ và tên *</label>
    <input type="text" name="name" required placeholder="Nguyễn Văn A" style="width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid #cbd5e1;border-radius:6px;font-size:14px;" />
  </div>

  <div style="margin-bottom:12px;">
    <label style="display:block;font-size:13px;font-weight:600;margin-bottom:4px;color:#334155;">Email *</label>
    <input type="email" name="email" required placeholder="email@example.com" style="width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid #cbd5e1;border-radius:6px;font-size:14px;" />
  </div>

  <div style="margin-bottom:12px;">
    <label style="display:block;font-size:13px;font-weight:600;margin-bottom:4px;color:#334155;">Số điện thoại *</label>
    <input type="tel" name="phone" required placeholder="0912 345 678" style="width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid #cbd5e1;border-radius:6px;font-size:14px;" />
  </div>

  <div style="margin-bottom:12px;">
    <label style="display:block;font-size:13px;font-weight:600;margin-bottom:4px;color:#334155;">Công ty / Doanh nghiệp</label>
    <input type="text" name="company" placeholder="Công ty ABC" style="width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid #cbd5e1;border-radius:6px;font-size:14px;" />
  </div>

  <div style="margin-bottom:16px;">
    <label style="display:block;font-size:13px;font-weight:600;margin-bottom:4px;color:#334155;">Nhu cầu quan tâm</label>
    <textarea name="interest_demand" rows="3" placeholder="Mô tả nhu cầu cần tư vấn..." style="width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid #cbd5e1;border-radius:6px;font-size:14px;resize:vertical;"></textarea>
  </div>

  <button type="submit" style="width:100%;padding:12px;background:#2563eb;color:#fff;border:none;border-radius:6px;font-size:15px;font-weight:600;cursor:pointer;">
    {$form->submit_button_text}
  </button>
  <div id="form-msg-{$form->code}" style="margin-top:12px;font-size:14px;display:none;"></div>
</form>
<script>
document.getElementById('crm-lead-form-{$form->code}').addEventListener('submit', async function(e) {
  e.preventDefault();
  const form = e.target;
  const msgEl = document.getElementById('form-msg-{$form->code}');
  const data = Object.fromEntries(new FormData(form));
  try {
    const res = await fetch('{$submitUrl}', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (res.ok && result.success) {
      msgEl.style.display = 'block';
      msgEl.style.color = '#16a34a';
      msgEl.innerText = result.message;
      form.reset();
    } else {
      msgEl.style.display = 'block';
      msgEl.style.color = '#dc2626';
      msgEl.innerText = result.message || 'Có lỗi xảy ra, vui lòng thử lại.';
    }
  } catch (err) {
    msgEl.style.display = 'block';
    msgEl.style.color = '#dc2626';
    msgEl.innerText = 'Lỗi kết nối tới máy chủ CRM.';
  }
});
</script>
HTML;

        return [
            'embed_token' => $form->embed_token,
            'submit_url' => $submitUrl,
            'iframe_code' => $iframeSnippet,
            'html_snippet' => $htmlSnippet,
        ];
    }

    /**
     * View độc lập cho thẻ iframe khi nhúng vào website đối tác
     */
    public function renderEmbedView(string $token)
    {
        $form = WebForm::where('embed_token', $token)->first();

        if (!$form || !$form->is_active) {
            return response('<div style="font-family:sans-serif;padding:32px;text-align:center;color:#64748b;"><h3>Biểu mẫu không khả dụng</h3><p>Biểu mẫu không tồn tại hoặc đã tạm đóng nhận thông tin.</p></div>', 404)
                ->header('Content-Type', 'text/html; charset=UTF-8');
        }

        $backendUrl = config('app.url', 'http://127.0.0.1:8000');
        $submitUrl = "{$backendUrl}/api/v1/public/web-forms/{$form->embed_token}/submit";

        $html = <<<HTML
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{$form->title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background: #ffffff; color: #1e293b; padding: 20px; font-size: 14px; }
    .card { max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 12px; }
    h2 { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 6px; }
    p.desc { font-size: 13px; color: #64748b; margin-bottom: 18px; }
    .form-group { margin-bottom: 14px; }
    label { display: block; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 5px; }
    .req { color: #ef4444; }
    input, textarea { width: 100%; padding: 10px 12px; border: 1.5px solid #e2e8f0; border-radius: 8px; font-size: 14px; transition: border-color .15s; outline: none; }
    input:focus, textarea:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15); }
    button { width: 100%; padding: 12px; background: #2563eb; color: #ffffff; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background .15s; margin-top: 6px; }
    button:hover { background: #1d4ed8; }
    button:disabled { opacity: 0.6; cursor: not-allowed; }
    .msg { margin-top: 14px; padding: 12px; border-radius: 8px; font-size: 13px; display: none; line-height: 1.5; }
    .msg-success { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
    .msg-error { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
    .footer-badge { margin-top: 16px; text-align: center; font-size: 11px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="card">
    <h2>{$form->title}</h2>
    <p class="desc">{$form->description}</p>
    
    <form id="leadForm">
      <!-- Honeypot anti-spam -->
      <input type="text" name="_hp_website" style="display:none!important;" tabindex="-1" autocomplete="off" />

      <div class="form-group">
        <label>Họ và tên <span class="req">*</span></label>
        <input type="text" name="name" required placeholder="Ví dụ: Nguyễn Văn An" />
      </div>

      <div class="form-group">
        <label>Email liên hệ <span class="req">*</span></label>
        <input type="email" name="email" required placeholder="an.nguyen@congty.com" />
      </div>

      <div class="form-group">
        <label>Số điện thoại <span class="req">*</span></label>
        <input type="tel" name="phone" required placeholder="0912 345 678" />
      </div>

      <div class="form-group">
        <label>Tên công ty / Doanh nghiệp</label>
        <input type="text" name="company" placeholder="Công ty TNHH Giải pháp Số" />
      </div>

      <div class="form-group">
        <label>Nhu cầu quan tâm</label>
        <textarea name="interest_demand" rows="3" placeholder="Mô tả sơ lược về nhu cầu triển khai hệ thống CRM..."></textarea>
      </div>

      <button type="submit" id="btnSubmit">{$form->submit_button_text}</button>
      <div id="msgBox" class="msg"></div>
    </form>
    <div class="footer-badge">Bảo mật thông tin bởi CRM Enterprise System</div>
  </div>

  <script>
    const form = document.getElementById('leadForm');
    const btn = document.getElementById('btnSubmit');
    const msg = document.getElementById('msgBox');

    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      btn.disabled = true;
      btn.innerText = 'Đang gửi thông tin...';
      msg.style.display = 'none';

      const formData = new FormData(form);
      const payload = Object.fromEntries(formData.entries());

      try {
        const res = await fetch('{$submitUrl}', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        msg.style.display = 'block';

        if (res.ok && data.success) {
          msg.className = 'msg msg-success';
          msg.innerText = data.message || 'Gửi thông tin thành công!';
          form.reset();
        } else {
          msg.className = 'msg msg-error';
          msg.innerText = data.message || 'Không thể gửi biểu mẫu. Vui lòng thử lại.';
        }
      } catch (err) {
        msg.style.display = 'block';
        msg.className = 'msg msg-error';
        msg.innerText = 'Không thể kết nối tới máy chủ CRM. Vui lòng kiểm tra mạng.';
      } finally {
        btn.disabled = false;
        btn.innerText = '{$form->submit_button_text}';
      }
    });
  </script>
</body>
</html>
HTML;

        return response($html)->header('Content-Type', 'text/html; charset=UTF-8');
    }
}
