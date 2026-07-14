import React, { useState } from 'react';
import { ClipboardList, KeyRound, User, AlertCircle } from 'lucide-react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function LoginPage({ clerks, onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const form = e.target;
    const domUsername = form.elements.username?.value || username;
    const domPassword = form.elements.password?.value || password;

    const u = domUsername.trim().toLowerCase();
    const p = domPassword.trim();
    const email = u.includes('@') ? u : `${u}@clerk.com`;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, p);
      const user = userCredential.user;

      const matchedClerk = clerks.find(c => 
        String(c.email || c.id).toLowerCase() === user.email.toLowerCase() || 
        String(c.uid) === user.uid
      );

      if (matchedClerk) {
        onLogin(matchedClerk);
      } else {
        onLogin({
          id: user.email.split('@')[0],
          email: user.email,
          name: user.email.split('@')[0],
          role: 'super',
          region: '전체',
          uid: user.uid
        });
      }
    } catch (err) {
      console.warn("Login failure:", err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('아이디 또는 비밀번호가 일치하지 않습니다.');
      } else {
        setError('로그인 처리 중 에러가 발생했습니다.');
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-glass-card">
        <div className="login-header">
          <div className="login-logo-box">
            <ClipboardList size={28} />
          </div>
          <h1 className="login-title">Clerk's Home</h1>
          <p className="login-subtitle">예배 출결 관리 시스템</p>
        </div>

        {error && (
          <div className="login-error-alert">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group" style={{ marginBottom: '18px' }}>
            <label className="form-label" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>아이디</label>
            <div style={{ position: 'relative' }}>
              <User size={18} className="login-input-icon" />
              <input
                type="text"
                name="username"
                className="login-form-control"
                placeholder="ID 입력"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                disabled={isLoading}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                autoComplete="username"
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>비밀번호</label>
            <div style={{ position: 'relative' }}>
              <KeyRound size={18} className="login-input-icon" />
              <input
                type="password"
                name="password"
                className="login-form-control"
                placeholder="비밀번호 입력"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                disabled={isLoading}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                autoComplete="current-password"
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="login-btn-submit"
            disabled={isLoading}
          >
            {isLoading ? '인증 중...' : '로그인'}
          </button>
        </form>

        <div className="login-footer" style={{ marginTop: '10px' }}>
          <span>© 2026 Clerk's Home. All rights reserved.</span>
        </div>
      </div>
    </div>
  );
}
