import React, { useState } from 'react';
import { Search, Plus, Edit2, Trash2, ArrowUpDown, Download, Check, X, Shield, MapPin } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function MemberTab({ clerks, onAddClerk, onUpdateClerk, onDeleteClerk, currentUser }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRegion, setFilterRegion] = useState('전체');
  const [filterRole, setFilterRole] = useState('전체');

  // Sort state
  const [sortField, setSortField] = useState('name');
  const [sortAsc, setSortAsc] = useState(true);

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingClerk, setEditingClerk] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'region', // 'super' or 'region'
    region: '상암지역'
  });

  const uniqueRegions = ['전체', '화정지역', '대학지역', '상암지역', '명동지역', '새소망지역', '성군지역', '새신자지역', '승리지역', '평화지역', '국제지역'];

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const filteredClerks = clerks
    .filter(c => {
      const matchSearch = 
        (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.username || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchRegion = filterRegion === '전체' || c.region === filterRegion;
      const matchRole = filterRole === '전체' || c.role === filterRole;
      return matchSearch && matchRegion && matchRole;
    })
    .sort((a, b) => {
      const valA = a[sortField] || '';
      const valB = b[sortField] || '';
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

  // Excel download
  const handleDownloadExcel = () => {
    const dataToExport = filteredClerks.map((c, idx) => ({
      '번호': idx + 1,
      '아이디': c.username,
      '이름': c.name,
      '비밀번호': c.password,
      '권한': c.role === 'super' ? '전체 관리자' : '지역 담당자',
      '담당지역': c.region
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '담당자_계정_목록');
    XLSX.writeFile(wb, 'Clerks_Home_담당자_목록.xlsx');
  };

  // Form handlers
  const openAddModal = () => {
    if (currentUser.role !== 'super') {
      alert('담당자 추가는 전체 관리자만 가능합니다.');
      return;
    }
    setFormData({
      username: '',
      password: '',
      name: '',
      role: 'region',
      region: '상암지역'
    });
    setIsAddOpen(true);
  };

  const openEditModal = (clerk) => {
    if (currentUser.role !== 'super' && currentUser.id !== clerk.id) {
      alert('본인 계정 외의 담당자 정보 수정은 전체 관리자만 가능합니다.');
      return;
    }
    setEditingClerk(clerk);
    setFormData({
      username: clerk.username,
      password: clerk.password,
      name: clerk.name,
      role: clerk.role,
      region: clerk.region
    });
    setIsEditOpen(true);
  };

  const handleSubmitAdd = (e) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.password.trim() || !formData.name.trim()) {
      alert('모든 항목을 입력해 주세요.');
      return;
    }
    
    // Check duplicate ID
    if (clerks.some(c => c.username.toLowerCase() === formData.username.trim().toLowerCase())) {
      alert('이미 존재하는 아이디입니다.');
      return;
    }

    onAddClerk({
      id: Date.now(),
      username: formData.username.trim(),
      password: formData.password.trim(),
      name: formData.name.trim(),
      role: formData.role,
      region: formData.role === 'super' ? '전체' : formData.region
    });
    setIsAddOpen(false);
  };

  const handleSubmitEdit = (e) => {
    e.preventDefault();
    if (!formData.password.trim() || !formData.name.trim() || !editingClerk) {
      alert('비밀번호와 이름을 입력해 주세요.');
      return;
    }

    onUpdateClerk({
      ...editingClerk,
      password: formData.password.trim(),
      name: formData.name.trim(),
      role: formData.role,
      region: formData.role === 'super' ? '전체' : formData.region
    });
    setIsEditOpen(false);
  };

  const handleDelete = (clerk) => {
    if (currentUser.role !== 'super') {
      alert('담당자 계정 삭제는 전체 관리자만 가능합니다.');
      return;
    }
    if (clerk.id === currentUser.id) {
      alert('현재 로그인 중인 관리자 본인의 계정은 삭제할 수 없습니다.');
      return;
    }
    if (window.confirm(`정말로 '${clerk.name}' 담당자 계정을 삭제하시겠습니까?\n이 담당자는 더 이상 로그인할 수 없게 됩니다.`)) {
      onDeleteClerk(clerk.id);
    }
  };

  return (
    <div className="content-body">
      <div className="actions-bar">
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
          {/* Search */}
          <div className="search-input-wrapper">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="이름 또는 아이디 검색..."
              className="search-input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Region filter */}
          <select
            className="form-control"
            style={{ minWidth: '160px', cursor: 'pointer' }}
            value={filterRegion}
            onChange={e => setFilterRegion(e.target.value)}
          >
            <option value="전체">담당지역: 전체</option>
            {uniqueRegions.filter(r => r !== '전체').map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>

          {/* Role filter */}
          <select
            className="form-control"
            style={{ minWidth: '160px', cursor: 'pointer' }}
            value={filterRole}
            onChange={e => setFilterRole(e.target.value)}
          >
            <option value="전체">권한: 전체</option>
            <option value="super">전체 관리자</option>
            <option value="region">지역 담당자</option>
          </select>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={handleDownloadExcel}>
            <Download size={16} />
            계정 다운로드
          </button>
          {currentUser.role === 'super' && (
            <button className="btn btn-primary" onClick={openAddModal}>
              <Plus size={16} />
              담당자 추가
            </button>
          )}
        </div>
      </div>

      <div className="table-wrapper">
        <table className="table-custom">
          <thead>
            <tr>
              <th style={{ width: '80px' }}>번호</th>
              <th onClick={() => handleSort('username')} style={{ cursor: 'pointer' }}>
                아이디 <ArrowUpDown size={14} style={{ marginLeft: '4px', verticalAlign: 'middle' }} />
              </th>
              <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                이름 <ArrowUpDown size={14} style={{ marginLeft: '4px', verticalAlign: 'middle' }} />
              </th>
              <th style={{ width: '150px' }}>비밀번호</th>
              <th onClick={() => handleSort('role')} style={{ cursor: 'pointer' }}>
                권한 <ArrowUpDown size={14} style={{ marginLeft: '4px', verticalAlign: 'middle' }} />
              </th>
              <th onClick={() => handleSort('region')} style={{ cursor: 'pointer' }}>
                담당지역 <ArrowUpDown size={14} style={{ marginLeft: '4px', verticalAlign: 'middle' }} />
              </th>
              <th style={{ width: '120px', textAlign: 'center' }}>관리</th>
            </tr>
          </thead>
          <tbody>
            {filteredClerks.length > 0 ? (
              filteredClerks.map((c, idx) => (
                <tr key={c.id || idx}>
                  <td>{idx + 1}</td>
                  <td style={{ fontWeight: 600 }}>{c.username}</td>
                  <td>{c.name}</td>
                  <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                    {currentUser.role === 'super' || currentUser.id === c.id ? c.password : '••••••••'}
                  </td>
                  <td>
                    <span className={`badge ${c.role === 'super' ? 'badge-purple' : 'badge-emerald'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Shield size={12} />
                      {c.role === 'super' ? '전체 관리자' : '지역 담당자'}
                    </span>
                  </td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                      <MapPin size={12} style={{ color: 'var(--accent-blue)' }} />
                      {c.region === '전체' ? '전체' : c.region}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        className="btn btn-secondary btn-icon-only"
                        onClick={() => openEditModal(c)}
                        disabled={currentUser.role !== 'super' && currentUser.id !== c.id}
                        title="수정"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="btn btn-secondary btn-icon-only"
                        style={{ color: 'var(--accent-rose)' }}
                        onClick={() => handleDelete(c)}
                        disabled={currentUser.role !== 'super'}
                        title="삭제"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7">
                  <div className="empty-state">
                    <p className="empty-state-title">등록된 담당자 계정이 없습니다</p>
                    <p>검색어나 필터를 변경해 보세요.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Clerk Modal */}
      {isAddOpen && (
        <div className="modal-overlay" onClick={() => setIsAddOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3 className="modal-title">출결 관리 담당자 추가</h3>
              <button className="modal-close-btn" onClick={() => setIsAddOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmitAdd}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">아이디 (ID)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="로그인 아이디 입력"
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">비밀번호</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="로그인 비밀번호 설정"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">이름</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="담당자 이름 (예: 김경훈)"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">권한</label>
                  <select
                    className="form-control"
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="region">지역 담당자 (지정된 지역만 권한 부여)</option>
                    <option value="super">전체 관리자 (전체 지역 총괄 권한 부여)</option>
                  </select>
                </div>
                
                {formData.role === 'region' && (
                  <div className="form-group">
                    <label className="form-label">담당지역 지정</label>
                    <select
                      className="form-control"
                      value={formData.region}
                      onChange={e => setFormData({ ...formData, region: e.target.value })}
                    >
                      {uniqueRegions.filter(r => r !== '전체').map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddOpen(false)}>
                  취소
                </button>
                <button type="submit" className="btn btn-primary">
                  담당자 추가
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Clerk Modal */}
      {isEditOpen && (
        <div className="modal-overlay" onClick={() => setIsEditOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3 className="modal-title">담당자 계정 정보 수정</h3>
              <button className="modal-close-btn" onClick={() => setIsEditOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmitEdit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">아이디 (ID)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.username}
                    disabled
                  />
                  <small style={{ color: 'var(--text-muted)' }}>아이디는 수정할 수 없습니다.</small>
                </div>
                <div className="form-group">
                  <label className="form-label">비밀번호</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">이름</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                {currentUser.role === 'super' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">권한</label>
                      <select
                        className="form-control"
                        value={formData.role}
                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                      >
                        <option value="region">지역 담당자</option>
                        <option value="super">전체 관리자</option>
                      </select>
                    </div>
                    {formData.role === 'region' && (
                      <div className="form-group">
                        <label className="form-label">담당지역</label>
                        <select
                          className="form-control"
                          value={formData.region}
                          onChange={e => setFormData({ ...formData, region: e.target.value })}
                        >
                          {uniqueRegions.filter(r => r !== '전체').map(r => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditOpen(false)}>
                  취소
                </button>
                <button type="submit" className="btn btn-primary">
                  수정 완료
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
