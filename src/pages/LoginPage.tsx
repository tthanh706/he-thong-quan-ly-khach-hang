import { useNavigate } from 'react-router-dom';
import { useSession } from '../auth/SessionContext';
import { store } from '../services/store';
import { DEFAULT_SCOPE_BY_ROLE, describeRole } from '../auth/permissions';
import { ROLE_LABEL, SCOPE_LABEL } from '../types';
import { initials } from '../utils/format';

export function LoginPage() {
  const { users, login } = useSession();
  const navigate = useNavigate();

  return (
    <div className="login">
      <div className="login__card">
        <div className="login__head">
          <span className="sidebar__logo">S5</span>
          <div>
            <h1>SCRUM-5 · SCRUM-89</h1>
            <p>Phân quyền theo vai trò và theo dữ liệu sở hữu</p>
          </div>
        </div>

        <p className="login__hint">
          Chọn tài khoản để trải nghiệm. Nhân viên chỉ thấy khách hàng của mình, trưởng nhóm thấy toàn nhóm,
          giám đốc thấy tất cả.
        </p>

        <ul className="login__list">
          {users.map((user) => (
            <li key={user.id}>
              <button
                type="button"
                className="login__item"
                onClick={() => {
                  login(user.id);
                  navigate('/dashboard');
                }}
              >
                <span className="avatar" style={{ background: user.avatarColor }}>
                  {initials(user.name)}
                </span>
                <span className="login__item-text">
                  <strong>{user.name}</strong>
                  <small>
                    {ROLE_LABEL[user.role]} · {store.teamName(user.teamId)}
                  </small>
                  <small className="login__scope">
                    Phạm vi mặc định: {SCOPE_LABEL[DEFAULT_SCOPE_BY_ROLE[user.role]]}
                  </small>
                </span>
                <span className="login__go">→</span>
              </button>
            </li>
          ))}
        </ul>

        <div className="login__roles">
          <strong>Cơ chế phân quyền</strong>
          <ul>
            <li>
              <b>Nhân viên</b>: {describeRole('employee').split('·')[1]?.trim()}, không xoá được bản ghi.
            </li>
            <li>
              <b>Trưởng nhóm</b>: xem và sửa dữ liệu của toàn nhóm, có thể thu hẹp về dữ liệu của mình.
            </li>
            <li>
              <b>Giám đốc</b>: xem toàn bộ hệ thống, có thể chuyển phạm vi giữa của tôi / nhóm / tất cả.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
