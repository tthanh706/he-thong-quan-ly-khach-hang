import { beforeAll, describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { App } from '../App';
import { SessionProvider } from '../auth/SessionContext';

function renderRoute(path: string, userId: string | null): string {
  return renderToString(
    <MemoryRouter initialEntries={[path]}>
      <SessionProvider initialUserId={userId}>{<App />}</SessionProvider>
    </MemoryRouter>,
  );
}

beforeAll(() => {
  // React Router gọi useLayoutEffect khi render trên server: chỉ là cảnh báo, không ảnh hưởng kết quả.
  const originalError = console.error;
  vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    if (String(args[0]).includes('useLayoutEffect does nothing on the server')) return;
    originalError(...args);
  });
});

describe('Giao diện thể hiện đúng phân quyền', () => {
  it('màn hình đăng nhập liệt kê 3 vai trò với phạm vi mặc định', () => {
    const html = renderRoute('/login', null);

    expect(html).toContain('SCRUM-5');
    expect(html).toContain('Nhân viên kinh doanh');
    expect(html).toContain('Trưởng nhóm');
    expect(html).toContain('Giám đốc kinh doanh');
    expect(html).toContain('Phạm vi mặc định');
  });

  it('trang khách hàng của nhân viên A không render bản ghi của nhân viên B', () => {
    const html = renderRoute('/customers', 'U1');

    expect(html).toContain('KH-001');
    expect(html).not.toContain('KH-003');
    expect(html).not.toContain('Tập đoàn Hoàng Gia');
    expect(html).toContain('Dữ liệu của tôi');
  });

  it('trang khách hàng của trưởng nhóm có dữ liệu của cả nhóm', () => {
    const html = renderRoute('/customers', 'U3');

    expect(html).toContain('KH-001');
    expect(html).toContain('KH-003');
    expect(html).toContain('Dữ liệu của nhóm tôi');
  });

  it('trang khách hàng của giám đốc thấy toàn bộ', () => {
    const html = renderRoute('/customers', 'U5');

    expect(html).toContain('KH-001');
    expect(html).toContain('KH-003');
    expect(html).toContain('Toàn bộ dữ liệu');
  });

  it('mở thẳng bản ghi ngoài phạm vi hiển thị thông báo tiếng Việt, không lộ dữ liệu bản ghi', () => {
    const html = renderRoute('/customers/C3', 'U1');

    expect(html).toContain('Không có quyền');
    expect(html).toContain('Trần Thu Hà'); // người sở hữu bản ghi
    expect(html).toContain('Dữ liệu của tôi'); // phạm vi hiện tại
    expect(html).not.toContain('Tập đoàn Hoàng Gia'); // không lộ nội dung nghiệp vụ
    expect(html).not.toContain('hoanggia');
  });

  it('mở bản ghi của chính mình thì hiển thị đầy đủ thông tin', () => {
    const html = renderRoute('/customers/C1', 'U1');

    expect(html).toContain('Công ty Cổ phần Minh Khai');
    expect(html).toContain('Thông tin phân quyền');
    expect(html).not.toContain('Không có quyền');
  });

  it('trang kiểm thử phân quyền báo cáo đạt đủ kịch bản', () => {
    const html = renderRoute('/access-checks', 'U1');

    expect(html).toContain('Kiểm thử tự động phân quyền');
    expect(html).toContain('kiểm thử đạt');
  });
});
