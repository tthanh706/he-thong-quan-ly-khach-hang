import React, { useEffect, useState } from 'react';
import { useOpportunityMembers } from '../../hooks/useOpportunityMembers';
import type { AddMemberRequest, TransferOwnershipRequest } from '../../types/opportunityMember';

interface UserOption {
  id: number;
  name: string;
  email: string;
}

interface OpportunityMembersPanelProps {
  opportunityId: number;
  currentOwnerId: number;
  currentOwnerName: string;
  canManageMembers: boolean; // owner hoặc có quyền
  canTransferOwnership: boolean;
  teamUsers: UserOption[]; // danh sách user trong team để chọn
  onOwnershipTransferred?: (newOwnerId: number) => void;
}

export const OpportunityMembersPanel: React.FC<OpportunityMembersPanelProps> = ({
  opportunityId,
  currentOwnerId,
  currentOwnerName,
  canManageMembers,
  canTransferOwnership,
  teamUsers,
  onOwnershipTransferred,
}) => {
  const {
    members,
    ownershipLogs,
    loading,
    error,
    fetchMembers,
    fetchOwnershipLogs,
    addMember,
    removeMember,
    transferOwnership,
  } = useOpportunityMembers(opportunityId);

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [transferUserId, setTransferUserId] = useState<number | ''>('');
  const [transferNote, setTransferNote] = useState('');
  const [keepAsMember, setKeepAsMember] = useState(true);

  useEffect(() => {
    fetchMembers();
    fetchOwnershipLogs();
  }, [fetchMembers, fetchOwnershipLogs]);

  const availableUsers = teamUsers.filter(
    (u) =>
      u.id !== currentOwnerId &&
      !members.some((m) => m.user_id === u.id)
  );

  const handleAddMember = async () => {
    if (!selectedUserId) return;
    try {
      await addMember({ user_id: Number(selectedUserId), role: 'member' });
      setSelectedUserId('');
      setShowAddForm(false);
    } catch {
      // error đã hiển thị
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa thành viên này khỏi cơ hội?')) return;
    try {
      await removeMember(userId);
    } catch {
      // error đã hiển thị
    }
  };

  const handleTransfer = async () => {
    if (!transferUserId) return;
    if (
      !window.confirm(
        'Bạn có chắc muốn chuyển quyền sở hữu cơ hội này? Hành động sẽ được ghi nhật ký.'
      )
    )
      return;

    try {
      await transferOwnership({
        new_owner_id: Number(transferUserId),
        note: transferNote || null,
        keep_as_member: keepAsMember,
      });
      setShowTransferForm(false);
      setTransferUserId('');
      setTransferNote('');
      if (onOwnershipTransferred) {
        onOwnershipTransferred(Number(transferUserId));
      }
    } catch {
      // error đã hiển thị
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-6">
      {/* Owner */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Người sở hữu chính</h3>
        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-md">
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
            {currentOwnerName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-medium text-gray-900">{currentOwnerName}</div>
            <div className="text-xs text-blue-700">Chịu trách nhiệm chính</div>
          </div>
        </div>
      </div>

      {/* Members */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-gray-900">
            Thành viên cùng theo dõi ({members.length})
          </h3>
          {canManageMembers && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              + Thêm thành viên
            </button>
          )}
        </div>

        {error && (
          <div className="mb-3 p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>
        )}

        {showAddForm && (
          <div className="mb-4 p-3 border border-gray-200 rounded-md bg-gray-50">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chọn thành viên
            </label>
            <div className="flex gap-2">
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value ? Number(e.target.value) : '')}
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">-- Chọn người dùng --</option>
                {availableUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddMember}
                disabled={!selectedUserId || loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                Thêm
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                Hủy
              </button>
            </div>
          </div>
        )}

        {loading && members.length === 0 ? (
          <div className="py-6 text-center text-gray-500">Đang tải...</div>
        ) : members.length === 0 ? (
          <div className="py-6 text-center text-gray-500 text-sm">
            Chưa có thành viên nào được chia sẻ. Chỉ người sở hữu đang theo dõi.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {members.map((member) => (
              <li key={member.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-sm font-medium">
                    {member.user?.name?.charAt(0).toUpperCase() ?? '?'}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{member.user?.name}</div>
                    <div className="text-xs text-gray-500">
                      {member.user?.email} · Thêm lúc {formatDate(member.added_at)}
                    </div>
                  </div>
                </div>
                {canManageMembers && (
                  <button
                    onClick={() => handleRemoveMember(member.user_id)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Xóa
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        <p className="mt-2 text-xs text-gray-500">
          Thành viên được chia sẻ có quyền xem cơ hội và ghi hoạt động, nhưng không thể đổi người sở hữu.
        </p>
      </div>

      {/* Transfer Ownership */}
      {canTransferOwnership && (
        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-gray-900">Chuyển quyền sở hữu</h3>
            <button
              onClick={() => setShowTransferForm(!showTransferForm)}
              className="text-sm px-3 py-1.5 border border-orange-500 text-orange-600 rounded-md hover:bg-orange-50"
            >
              Chuyển quyền
            </button>
          </div>

          {showTransferForm && (
            <div className="p-4 border border-orange-200 rounded-md bg-orange-50 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Người nhận quyền sở hữu *
                </label>
                <select
                  value={transferUserId}
                  onChange={(e) =>
                    setTransferUserId(e.target.value ? Number(e.target.value) : '')
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">-- Chọn người dùng --</option>
                  {teamUsers
                    .filter((u) => u.id !== currentOwnerId)
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ghi chú (tùy chọn)
                </label>
                <textarea
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  rows={2}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Lý do chuyển quyền..."
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={keepAsMember}
                  onChange={(e) => setKeepAsMember(e.target.checked)}
                />
                Giữ người sở hữu cũ làm thành viên sau khi chuyển
              </label>

              <div className="flex gap-2">
                <button
                  onClick={handleTransfer}
                  disabled={!transferUserId || loading}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md text-sm hover:bg-orange-700 disabled:opacity-50"
                >
                  Xác nhận chuyển quyền
                </button>
                <button
                  onClick={() => setShowTransferForm(false)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  Hủy
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ownership Logs */}
      {ownershipLogs.length > 0 && (
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Nhật ký chuyển quyền sở hữu
          </h3>
          <ul className="space-y-2">
            {ownershipLogs.map((log) => (
              <li key={log.id} className="text-sm p-3 bg-gray-50 rounded-md">
                <div className="font-medium text-gray-800">
                  {log.from_owner?.name ?? '—'} → {log.to_owner?.name}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Bởi {log.changed_by_user?.name} · {formatDate(log.changed_at)}
                  {log.note && ` · ${log.note}`}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};