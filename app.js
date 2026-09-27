// ==========================================================================
// AUTH-102 LOGIC ENGINE & SCRUM INTERACTIVE SIMULATOR
// ==========================================================================

// Mock Registered Database Users
const REGISTERED_USERS = [
    { id: 101, email: "user.demo@company.com", name: "Nguyễn Văn A" },
    { id: 102, email: "khachhang@partner.org", name: "Trần Thị B" }
];

// Mock Token Database
let dbTokens = [];
let activeToken = null;
let countdownInterval = null;

// DOM Elements Initialization
document.addEventListener("DOMContentLoaded", () => {
    initTabs();
    initForms();
    initPresets();
    initPasswordStrength();
});

// Tab Switcher Logic
function initTabs() {
    const tabBtns = document.querySelectorAll(".tab-btn");
    const tabContents = document.querySelectorAll(".tab-content");

    tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const target = btn.getAttribute("data-tab");

            tabBtns.forEach(b => b.classList.remove("active"));
            tabContents.forEach(c => c.classList.remove("active"));

            btn.classList.add("active");
            document.getElementById(target).classList.add("active");
        });
    });

    // Copy Gherkin Button
    const copyBtn = document.getElementById("btn-copy-gherkin");
    if (copyBtn) {
        copyBtn.addEventListener("click", () => {
            const gherkinText = `
FEATURE: [AUTH-102] Đặt lại mật khẩu khi quên qua email
  Là người dùng hệ thống
  Tôi muốn nhận email liên kết đổi mật khẩu
  Để khôi phục truy cập khi đang làm việc / đi gặp khách hàng.

  Scenario: Yêu cầu gửi email khôi phục & Bảo mật chống dò email
    Given người dùng đang ở trang "Quên mật khẩu"
    When người dùng nhập email và nhấn "Gửi liên kết đặt lại"
    Then hệ thống phản hồi thông báo trung tính: "Nếu địa chỉ email của bạn tồn tại trên hệ thống, chúng tôi đã gửi một liên kết hướng dẫn đặt lại mật khẩu."
    And nếu email TỒN TẠI trong CSDL: Hệ thống sinh Token (SHA-256) hạn 30 phút và gửi email.
    And nếu email KHÔNG TỒN TẠI: Hệ thống KHÔNG gửi email và KHÔNG báo lỗi "Email không tồn tại" ra UI.

  Scenario: Hết hạn Token sau 30 phút
    Given người dùng nhận được email khôi phục mật khẩu
    When người dùng nhấp vào liên kết SAU 30 PHÚT kể từ thời điểm tạo
    Then giao diện hiển thị thông báo lỗi: "Liên kết đã hết hạn (chỉ có hiệu lực trong 30 phút)."

  Scenario: Token chỉ sử dụng 1 lần duy nhất
    Given người dùng đã đặt lại mật khẩu thành công
    When nhấp lại liên kết đó lần thứ hai
    Then hệ thống báo lỗi: "Liên kết này đã được sử dụng hoặc không còn hợp lệ."
            `.trim();

            navigator.clipboard.writeText(gherkinText).then(() => {
                const originalHTML = copyBtn.innerHTML;
                copyBtn.innerHTML = `<i class="fa-solid fa-check"></i> Đã Copy Gherkin!`;
                copyBtn.classList.replace("btn-outline", "btn-success");
                setTimeout(() => {
                    copyBtn.innerHTML = originalHTML;
                    copyBtn.classList.replace("btn-success", "btn-outline");
                }, 2000);
            });
        });
    }
}

// Form Handlers
function initForms() {
    // Forgot Password Submit
    const btnSend = document.getElementById("btn-send-reset");
    if (btnSend) {
        btnSend.addEventListener("click", handleForgotSubmit);
    }

    // Reset Password Submit
    const btnResetPass = document.getElementById("btn-submit-new-pass");
    if (btnResetPass) {
        btnResetPass.addEventListener("click", handleResetPasswordSubmit);
    }

    // Click Email Link Action
    const btnEmailLink = document.getElementById("btn-click-email-link");
    if (btnEmailLink) {
        btnEmailLink.addEventListener("click", handleEmailLinkClick);
    }

    // Fast-forward 31 mins Action
    const btnFastForward = document.getElementById("btn-fastforward");
    if (btnFastForward) {
        btnFastForward.addEventListener("click", handleFastForward);
    }
}

// Handle Forgot Password Request
function handleForgotSubmit() {
    const emailInput = document.getElementById("email-input").value.trim().toLowerCase();

    if (!emailInput || !emailInput.includes("@")) {
        alert("Vui lòng nhập định dạng email hợp lệ (ví dụ: user@company.com)");
        return;
    }

    // Display generic confirmation regardless of email existence (ANTI-ENUMERATION SECURITY RULE)
    document.getElementById("display-target-email").innerText = emailInput;
    switchScreen("step-sent", "Bước 2: Đã Gửi Email");

    // Check if user exists in mock DB
    const user = REGISTERED_USERS.find(u => u.email === emailInput);

    if (user) {
        // Generate Token
        const rawToken = "tok_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const tokenHash = simpleHash(rawToken);
        const createdAt = Date.now();
        const expiresAt = createdAt + 30 * 60 * 1000; // 30 mins

        activeToken = {
            id: dbTokens.length + 1,
            user_id: user.id,
            user_email: user.email,
            rawToken: rawToken,
            token_hash: tokenHash,
            createdAt: createdAt,
            expiresAt: expiresAt,
            usedAt: null
        };

        dbTokens.unshift(activeToken);
        updateDBInspector();

        // Render Email in Virtual Inbox
        renderVirtualEmail(user.email, rawToken, expiresAt);
        logAudit(`[API 200] Yêu cầu reset pass cho ${user.email}. Token created (Expires in 30m). Email dispatched.`, "success");
    } else {
        // User does not exist in DB
        logAudit(`[API 200] Yêu cầu reset pass cho ${emailInput}. [ANTI-ENUMERATION]: Email KHÔNG tồn tại. KHÔNG tạo token hay gửi mail, nhưng UI trả về thông báo y hệt.`, "warning");
        renderEmptyInbox();
    }
}

// Render Virtual Email
function renderVirtualEmail(recipient, rawToken, expiresAt) {
    document.getElementById("empty-inbox-view").style.display = "none";
    document.getElementById("inbox-list").style.display = "block";
    document.getElementById("mail-recipient").innerText = recipient;
    document.getElementById("email-count-badge").innerText = "1 Thư mới";

    startTimer(expiresAt, "inbox-timer");
}

function renderEmptyInbox() {
    document.getElementById("empty-inbox-view").style.display = "flex";
    document.getElementById("inbox-list").style.display = "none";
    document.getElementById("email-count-badge").innerText = "0 Thư mới";
}

// Handle Email Link Click
function handleEmailLinkClick() {
    if (!activeToken) {
        showErrorScreen("Token Không Hợp Lệ", "Không tìm thấy dữ liệu liên kết khôi phục.");
        return;
    }

    const now = Date.now();

    // Check 1: Token Expired? (>30 minutes)
    if (now > activeToken.expiresAt) {
        logAudit(`[AUTH FAIL] Truy cập Token ${activeToken.token_hash.substring(0, 8)}... thất bại: TOKEN HẾT HẠN (>30 Phút).`, "danger");
        showErrorScreen("Liên Kết Đã Hết Hạn (30 Phút)", "Liên kết đặt lại mật khẩu này chỉ có hiệu lực đúng 30 phút kể từ khi gửi. Vui lòng gửi lại yêu cầu mới.");
        return;
    }

    // Check 2: Token Already Used?
    if (activeToken.usedAt !== null) {
        logAudit(`[AUTH FAIL] Truy cập Token ${activeToken.token_hash.substring(0, 8)}... thất bại: TOKEN ĐÃ ĐƯỢC SỬ DỤNG 1 LẦN TRƯỚC ĐÓ.`, "danger");
        showErrorScreen("Liên Kết Đã Được Sử Dụng", "Mỗi liên kết chỉ sử dụng được 1 lần duy nhất để bảo mật tài khoản. Bạn đã đổi mật khẩu bằng liên kết này trước đó.");
        return;
    }

    // Token Valid -> Proceed to Reset Form
    logAudit(`[AUTH SUCCESS] Token hợp lệ! Cho phép truy cập màn hình Đặt Mật Khẩu Mới.`, "success");
    switchScreen("step-reset", "Bước 3: Đặt Mật Khẩu Mới");
    startTimer(activeToken.expiresAt, "token-timer-display");
}

// Handle Fast Forward (Simulate 31 minutes pass)
function handleFastForward() {
    if (!activeToken) {
        alert("Chưa có token nào để thử nghiệm hết hạn. Hãy gửi yêu cầu trước!");
        return;
    }

    // Set expiresAt to 1 minute in the past
    activeToken.expiresAt = Date.now() - 60 * 1000;
    updateDBInspector();

    document.getElementById("inbox-timer").innerText = "00:00 (Đã hết hạn!)";
    document.getElementById("token-timer-display").innerText = "00:00";
    
    logAudit(`[QA SIMULATOR] Đã tua nhanh thời gian thêm 31 phút. Token ${activeToken.token_hash.substring(0, 8)}... hiện ĐÃ HẾT HẠN!`, "warning");
    alert("⚡ Đã tua nhanh 31 phút! Bây giờ bấm nút 'Đặt Lại Mật Khẩu Ngay' trong email để xem hệ thống chặn token hết hạn.");
}

// Handle New Password Submission
function handleResetPasswordSubmit() {
    const newPass = document.getElementById("new-pass").value;
    const confirmPass = document.getElementById("confirm-pass").value;

    if (!newPass || newPass.length < 8) {
        alert("Mật khẩu mới phải có tối thiểu 8 ký tự!");
        return;
    }

    if (newPass !== confirmPass) {
        alert("Xác nhận mật khẩu không khớp!");
        return;
    }

    if (!activeToken || Date.now() > activeToken.expiresAt || activeToken.usedAt !== null) {
        showErrorScreen("Thao Tác Thất Bại", "Token đã không còn hợp lệ.");
        return;
    }

    // Mark token as USED
    activeToken.usedAt = Date.now();
    updateDBInspector();

    logAudit(`[API 200] Đổi mật khẩu thành công cho ${activeToken.user_email}. Token marked USED_AT = NOW(). Thu hồi toàn bộ sessions cũ.`, "success");
    switchScreen("step-success", "Bước 4: Hoàn Tất Đổi Mật Khẩu");
}

// Password Strength Meter
function initPasswordStrength() {
    const passInput = document.getElementById("new-pass");
    const fill = document.getElementById("strength-fill");
    const text = document.getElementById("strength-text");

    if (!passInput) return;

    passInput.addEventListener("input", () => {
        const val = passInput.value;
        let score = 0;

        if (val.length >= 8) score++;
        if (/[A-Z]/.test(val)) score++;
        if (/[a-z]/.test(val)) score++;
        if (/[0-9]/.test(val)) score++;
        if (/[^A-Za-z0-9]/.test(val)) score++;

        if (val.length === 0) {
            fill.style.width = "0%";
            fill.style.backgroundColor = "transparent";
            text.innerText = "Độ mạnh: Chưa nhập";
            return;
        }

        switch (score) {
            case 1:
            case 2:
                fill.style.width = "30%";
                fill.style.backgroundColor = "var(--danger)";
                text.innerText = "Độ mạnh: Yếu (Cần thêm chữ hoa/số)";
                break;
            case 3:
            case 4:
                fill.style.width = "70%";
                fill.style.backgroundColor = "var(--warning)";
                text.innerText = "Độ mạnh: Trung bình";
                break;
            case 5:
                fill.style.width = "100%";
                fill.style.backgroundColor = "var(--success)";
                text.innerText = "Độ mạnh: Rất Mạnh (An toàn)";
                break;
        }
    });
}

// Preset Quick Buttons for QA Testing
function initPresets() {
    document.getElementById("btn-preset-valid").addEventListener("click", () => {
        resetToForgotStep();
        document.getElementById("email-input").value = "user.demo@company.com";
        handleForgotSubmit();
    });

    document.getElementById("btn-preset-invalid").addEventListener("click", () => {
        resetToForgotStep();
        document.getElementById("email-input").value = "hacker.unknown@fake-domain.com";
        handleForgotSubmit();
    });

    document.getElementById("btn-preset-expired").addEventListener("click", () => {
        document.getElementById("email-input").value = "user.demo@company.com";
        handleForgotSubmit();
        setTimeout(handleFastForward, 300);
    });

    document.getElementById("btn-preset-reused").addEventListener("click", () => {
        document.getElementById("email-input").value = "user.demo@company.com";
        handleForgotSubmit();
        setTimeout(() => {
            handleEmailLinkClick();
            document.getElementById("new-pass").value = "Password123@";
            document.getElementById("confirm-pass").value = "Password123@";
            handleResetPasswordSubmit();
            setTimeout(() => {
                // Try to click link again
                handleEmailLinkClick();
            }, 500);
        }, 300);
    });
}

// Helper Functions
function switchScreen(screenId, badgeText) {
    document.querySelectorAll(".simulator-screen").forEach(s => s.classList.remove("active"));
    document.getElementById(screenId).classList.add("active");
    if (badgeText) {
        document.getElementById("current-step-badge").innerText = badgeText;
    }
}

function resetToForgotStep() {
    switchScreen("step-forgot", "Bước 1: Quên Mật Khẩu");
    renderEmptyInbox();
}

function showErrorScreen(title, desc) {
    document.getElementById("error-title").innerText = title;
    document.getElementById("error-desc").innerText = desc;
    switchScreen("step-error", "Lỗi Bảo Mật / Token");
}

function togglePasswordVis(inputId) {
    const input = document.getElementById(inputId);
    input.type = input.type === "password" ? "text" : "password";
}

function startTimer(expiresAt, elementId) {
    if (countdownInterval) clearInterval(countdownInterval);

    function update() {
        const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
        const mins = String(Math.floor(remaining / 60)).padStart(2, '0');
        const secs = String(remaining % 60).padStart(2, '0');

        const el = document.getElementById(elementId);
        if (el) el.innerText = `${mins}:${secs}`;

        if (remaining <= 0) {
            clearInterval(countdownInterval);
            if (el) el.innerText = "00:00 (Đã hết hạn!)";
        }
    }

    update();
    countdownInterval = setInterval(update, 1000);
}

function updateDBInspector() {
    const tbody = document.getElementById("db-tokens-tbody");
    if (dbTokens.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">Chưa có token nào trong Database</td></tr>`;
        return;
    }

    tbody.innerHTML = dbTokens.map(t => {
        const isExpired = Date.now() > t.expiresAt;
        const isUsed = t.usedAt !== null;
        let statusBadge = `<span class="badge badge-status">ACTIVE</span>`;

        if (isUsed) {
            statusBadge = `<span class="badge badge-dark">USED</span>`;
        } else if (isExpired) {
            statusBadge = `<span class="badge badge-warning">EXPIRED</span>`;
        }

        return `
            <tr>
                <td>#${t.id}</td>
                <td>${t.user_email}</td>
                <td><code>${t.token_hash.substring(0, 16)}...</code></td>
                <td>${isExpired ? "Hết hạn" : "Còn hiệu lực (30m)"}</td>
                <td>${statusBadge}</td>
            </tr>
        `;
    }).join("");
}

function logAudit(message, type = "info") {
    const console = document.getElementById("audit-log-console");
    const div = document.createElement("div");
    div.className = `log-line ${type}`;
    const time = new Date().toLocaleTimeString('vi-VN');
    div.innerText = `[${time}] ${message}`;
    console.appendChild(div);
    console.scrollTop = console.scrollHeight;
}

function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(16, '0') + "a8f3e9b1c";
}
