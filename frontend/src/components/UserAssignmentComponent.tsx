import { useEffect, useMemo, useState } from 'react';
import type { BusinessGroup, Role, UserSummary } from '../types';

type Props = {
  user: UserSummary;
  currentUserId: number;
  roles: Role[];
  groups: BusinessGroup[];
  saving: boolean;
  onSave: (roleIds: number[], groupIds: number[]) => Promise<void>;
};

export function UserAssignmentComponent({
  user,
  currentUserId,
  roles,
  groups,
  saving,
  onSave,
}: Props) {
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<number[]>([]);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    setSelectedRoles(user.roles.map((role: Role) => role.id));
    setSelectedGroups(user.business_groups.map((group: BusinessGroup) => group.id));
    setLocalError('');
  }, [user]);

  const teamLeaderRole = useMemo(
    () => roles.find((role) => role.name === 'team_leader'),
    [roles],
  );
  const adminRole = useMemo(() => roles.find((role) => role.name === 'admin'), [roles]);

  const isOwnAdminAccount =
    user.id === currentUserId &&
    !!adminRole &&
    user.roles.some((role: Role) => role.id === adminRole.id);

  const toggleRole = (roleId: number) => {
    if (isOwnAdminAccount && adminRole?.id === roleId && selectedRoles.includes(roleId)) {
      setLocalError('Không thể tự thu hồi vai trò quản trị của chính mình.');
      return;
    }

    setLocalError('');
    setSelectedRoles((current) =>
      current.includes(roleId)
        ? current.filter((id) => id !== roleId)
        : [...current, roleId],
    );
  };

  const toggleGroup = (groupId: number) => {
    setLocalError('');
    setSelectedGroups((current) =>
      current.includes(groupId)
        ? current.filter((id) => id !== groupId)
        : [...current, groupId],
    );
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (teamLeaderRole && selectedRoles.includes(teamLeaderRole.id) && selectedGroups.length === 0) {
      setLocalError('Trưởng nhóm bắt buộc phải được gán ít nhất một nhóm kinh doanh.');
      return;
    }

    if (selectedRoles.length === 0) {
      setLocalError('Người dùng phải có ít nhất một vai trò.');
      return;
    }

    setLocalError('');
    await onSave(selectedRoles, selectedGroups);
  };

  return (
    <form className="assignment-card" onSubmit={submit}>
      <div className="assignment-header">
        <div>
          <h2>{user.name}</h2>
          <p>{user.email}</p>
        </div>
        <span className="user-id">ID #{user.id}</span>
      </div>

      {localError && <div className="message error">{localError}</div>}

      <section>
        <h3>Vai trò</h3>
        <p className="hint">Một người dùng có thể giữ nhiều vai trò cùng lúc.</p>
        <div className="choice-grid">
          {roles.map((role) => (
            <label className="choice" key={role.id}>
              <input
                type="checkbox"
                checked={selectedRoles.includes(role.id)}
                onChange={() => toggleRole(role.id)}
              />
              <span>
                <strong>{role.display_name}</strong>
                <small>{role.name}</small>
              </span>
            </label>
          ))}
        </div>
      </section>

      <section>
        <h3>Nhóm kinh doanh</h3>
        <p className="hint">Trưởng nhóm phải được gán ít nhất một nhóm cụ thể.</p>
        <div className="choice-grid">
          {groups.map((group) => (
            <label className="choice" key={group.id}>
              <input
                type="checkbox"
                checked={selectedGroups.includes(group.id)}
                onChange={() => toggleGroup(group.id)}
              />
              <span><strong>{group.name}</strong></span>
            </label>
          ))}
        </div>
      </section>

      <button className="primary" type="submit" disabled={saving}>
        {saving ? 'Đang lưu...' : 'Lưu phân quyền'}
      </button>
    </form>
  );
}
