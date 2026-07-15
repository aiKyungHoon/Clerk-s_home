import React, { useState, useEffect } from 'react';
import { LayoutDashboard, ClipboardList, Users, Bell, Menu, X, LogOut } from 'lucide-react';
import DashboardTab from './components/DashboardTab';
import AttendanceTab from './components/AttendanceTab';
import MemberTab from './components/MemberTab';
import LoginPage from './components/LoginPage';
import { getMockRecords, getMockMembers } from './mockData';
import { db, auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, onSnapshot, doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';

// Safe Storage Helpers to prevent SecurityErrors in Safari Private Mode & Edge InPrivate Mode
const safeSessionGet = (key, defaultVal = '') => {
  try {
    const val = sessionStorage.getItem(key);
    return val !== null ? val : defaultVal;
  } catch (e) {
    return defaultVal;
  }
};

const safeSessionSet = (key, val) => {
  try {
    sessionStorage.setItem(key, val);
  } catch (e) {
    // fallback silently
  }
};

const safeSessionRemove = (key) => {
  try {
    sessionStorage.removeItem(key);
  } catch (e) {
    // fallback silently
  }
};

const safeLocalGet = (key, defaultVal = '') => {
  try {
    const val = localStorage.getItem(key);
    return val !== null ? val : defaultVal;
  } catch (e) {
    return defaultVal;
  }
};

const safeLocalSet = (key, val) => {
  try {
    localStorage.setItem(key, val);
  } catch (e) {
    // fallback silently
  }
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return safeSessionGet('clerks_logged_in') === 'true';
  });
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = safeSessionGet('clerks_current_user');
    return saved ? JSON.parse(saved) : { username: '', role: '', region: '전체', name: '' };
  });
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'attendance', 'members'
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [clerks, setClerks] = useState([]);

  // Monitor Firebase Auth state change
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const userEmail = firebaseUser.email || '';
        const profile = clerks.find(c => {
          const cEmail = String(c?.email || c?.id || '');
          const cUid = String(c?.uid || '');
          return (
            (cEmail && userEmail && cEmail.toLowerCase() === userEmail.toLowerCase()) ||
            (cUid && firebaseUser.uid && cUid === firebaseUser.uid)
          );
        });
        if (profile) {
          setCurrentUser(profile);
          setIsLoggedIn(true);
          safeSessionSet('clerks_logged_in', 'true');
          safeSessionSet('clerks_current_user', JSON.stringify(profile));
        } else if (clerks.length > 0) {
          const emailPrefix = userEmail ? userEmail.split('@')[0] : 'user';
          const tempProfile = {
            id: emailPrefix,
            email: userEmail,
            name: emailPrefix,
            role: 'super',
            region: '전체',
            uid: firebaseUser.uid
          };
          setCurrentUser(tempProfile);
          setIsLoggedIn(true);
          safeSessionSet('clerks_logged_in', 'true');
          safeSessionSet('clerks_current_user', JSON.stringify(tempProfile));
        }
      } else {
        setIsLoggedIn(false);
        setCurrentUser({ username: '', role: '', region: '전체', name: '' });
        safeSessionRemove('clerks_logged_in');
        safeSessionRemove('clerks_current_user');
      }
    });
    return () => unsubscribe();
  }, [clerks]);
  
  // Weekly selection state (주차별 관리)
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(7);
  const [selectedWeek, setSelectedWeek] = useState(3);

  const activeWeekKey = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${selectedWeek}`;

  // Helper to calculate the Sunday date string for the selected year/month/week
  const getSundayDateForWeek = (y, m, w) => {
    const firstDay = new Date(y, m - 1, 1);
    const dayOfWeek = firstDay.getDay(); // 0 is Sunday, 1 is Monday, etc.
    
    const firstSunday = new Date(firstDay);
    if (dayOfWeek !== 0) {
      firstSunday.setDate(1 + (7 - dayOfWeek));
    }
    
    const targetSunday = new Date(firstSunday);
    targetSunday.setDate(firstSunday.getDate() + (w - 1) * 7);
    
    const yearStr = targetSunday.getFullYear();
    const monthStr = String(targetSunday.getMonth() + 1).padStart(2, '0');
    const dateStr = String(targetSunday.getDate()).padStart(2, '0');
    return `${yearStr}-${monthStr}-${dateStr}`;
  };

  const selectedDate = getSundayDateForWeek(selectedYear, selectedMonth, selectedWeek);
  
  // State for attendance records
  const [records, setRecords] = useState([]);

  const defaultClerks = [
    { id: '1', username: 'admin', password: 'admin1234', name: '전체 관리자', role: 'super', region: '전체' },
    { id: 'region-hwajeong', username: 'hwajeong', email: 'hwajeong@clerk.com', password: 'hwajeong1234', name: '화정지역 담당자', role: 'region', region: '화정지역' },
    { id: 'region-daehak', username: 'daehak', email: 'daehak@clerk.com', password: 'daehak1234', name: '대학지역 담당자', role: 'region', region: '대학지역' },
    { id: 'region-sangam', username: 'sangam', email: 'sangam@clerk.com', password: 'sangam1234', name: '상암지역 담당자', role: 'region', region: '상암지역' },
    { id: 'region-myeongdong', username: 'myeongdong', email: 'myeongdong@clerk.com', password: 'myeongdong1234', name: '명동지역 담당자', role: 'region', region: '명동지역' },
    { id: 'region-saesomang', username: 'saesomang', email: 'saesomang@clerk.com', password: 'saesomang1234', name: '새소망지역 담당자', role: 'region', region: '새소망지역' },
    { id: 'region-seonggun', username: 'seonggun', email: 'seonggun@clerk.com', password: 'seonggun1234', name: '성군지역 담당자', role: 'region', region: '성군지역' },
    { id: 'region-saesinja', username: 'saesinja', email: 'saesinja@clerk.com', password: 'saesinja1234', name: '새신자지역 담당자', role: 'region', region: '새신자지역' },
    { id: 'region-seungri', username: 'seungri', email: 'seungri@clerk.com', password: 'seungri1234', name: '승리지역 담당자', role: 'region', region: '승리지역' },
    { id: 'region-pyeonghwa', username: 'pyeonghwa', email: 'pyeonghwa@clerk.com', password: 'pyeonghwa1234', name: '평화지역 담당자', role: 'region', region: '평화지역' },
    { id: 'region-gukje', username: 'gukje', email: 'gukje@clerk.com', password: 'gukje1234', name: '국제지역 담당자', role: 'region', region: '국제지역' }
  ];

  // Sync clerks from Firestore/LocalStorage
  useEffect(() => {
    let unsubscribe = null;
    try {
      unsubscribe = onSnapshot(collection(db, "clerks"), (snapshot) => {
        if (!snapshot.empty) {
          const list = [];
          snapshot.forEach(doc => {
            list.push({ id: doc.id, ...doc.data() });
          });
          const existingKeys = new Set(list.flatMap(clerk => [clerk.username, clerk.region]));
          const missingDefaults = defaultClerks.filter(clerk => !existingKeys.has(clerk.username) && !existingKeys.has(clerk.region));
          const mergedList = [...list, ...missingDefaults];
          setClerks(mergedList);
          safeLocalSet('attendance_clerks', JSON.stringify(mergedList));
          missingDefaults.forEach(clerk => setDoc(doc(db, "clerks", String(clerk.id)), clerk).catch(e => console.warn("Firestore clerk migration error:", e)));
        } else {
          setClerks(defaultClerks);
          defaultClerks.forEach(c => {
            setDoc(doc(db, "clerks", String(c.id)), c).catch(e => console.warn("Firestore init clerk error:", e));
          });
        }
      }, (error) => {
        console.warn("Firestore clerks error, fallback to local:", error);
        const saved = safeLocalGet('attendance_clerks');
        if (saved) setClerks(JSON.parse(saved));
      });
    } catch (e) {
      console.warn("Firestore clerks init error, fallback to local:", e);
      const saved = safeLocalGet('attendance_clerks');
      if (saved) setClerks(JSON.parse(saved));
    }
    return () => unsubscribe && unsubscribe();
  }, []);

  // Sync records from Firestore/LocalStorage
  useEffect(() => {
    let unsubscribe = null;
    try {
      unsubscribe = onSnapshot(collection(db, "records"), (snapshot) => {
        const list = [];
        snapshot.forEach(doc => {
          list.push({ id: doc.id, ...doc.data() });
        });
        
        // Remove synthetic/placeholder names previously generated by reports
        const syntheticNamePattern = /^(화정|대학|상암|명동|새소망|성군|새신자|승리|평화|국제)(총교|입교)\d+$/;
        const cleanedRecords = list.filter(record => !syntheticNamePattern.test(String(record.이름 || '').trim()));
        
        setRecords(cleanedRecords);
        safeLocalSet('attendance_records', JSON.stringify(cleanedRecords));
      }, (error) => {
        console.warn("Firestore records error, fallback to local:", error);
        const saved = safeLocalGet('attendance_records');
        if (saved) setRecords(JSON.parse(saved));
      });
    } catch (e) {
      console.warn("Firestore records init error, fallback to local:", e);
      const saved = safeLocalGet('attendance_records');
      if (saved) setRecords(JSON.parse(saved));
    }
    return () => unsubscribe && unsubscribe();
  }, []);

  // Filter records for the active week
  const activeWeekRecords = records.filter(r => r.weekKey === activeWeekKey);
  const activeWeekMembers = getMockMembers(activeWeekRecords);

  const normalizeRegion = (name) => (name || '').replace('지역', '').trim();

  const syncToFirestore = async (newRecords) => {
    try {
      const oldRecords = records;
      const oldIds = new Set(oldRecords.map(r => r.id));
      const newIds = new Set(newRecords.map(r => r.id));

      const toDelete = oldRecords.filter(r => !newIds.has(r.id));
      const toWrite = newRecords;

      // Batch delete in chunks of 400
      let deleteChunks = [];
      let currentDeleteBatch = writeBatch(db);
      let dCount = 0;
      toDelete.forEach(r => {
        currentDeleteBatch.delete(doc(db, "records", r.id));
        dCount++;
        if (dCount === 400) {
          deleteChunks.push(currentDeleteBatch);
          currentDeleteBatch = writeBatch(db);
          dCount = 0;
        }
      });
      if (dCount > 0) deleteChunks.push(currentDeleteBatch);
      for (const batch of deleteChunks) {
        await batch.commit();
      }

      // Batch set in chunks of 400
      let writeChunks = [];
      let currentWriteBatch = writeBatch(db);
      let wCount = 0;
      toWrite.forEach(r => {
        const docRef = doc(db, "records", r.id);
        currentWriteBatch.set(docRef, r);
        wCount++;
        if (wCount === 400) {
          writeChunks.push(currentWriteBatch);
          currentWriteBatch = writeBatch(db);
          wCount = 0;
        }
      });
      if (wCount > 0) writeChunks.push(currentWriteBatch);
      for (const batch of writeChunks) {
        await batch.commit();
      }
    } catch (e) {
      console.warn("Firestore sync error:", e);
    }
  };

  // Save updates to Firestore/LocalStorage
  const handleUpdateRecords = async (updatedActiveRecords) => {
    let newAll = [];
    setRecords(prev => {
      const otherWeeks = prev.filter(r => r.weekKey !== activeWeekKey);
      const updatedWithKey = updatedActiveRecords.map(r => ({
        ...r,
        weekKey: activeWeekKey
      }));
      newAll = [...otherWeeks, ...updatedWithKey];
      safeLocalSet('attendance_records', JSON.stringify(newAll));
      return newAll;
    });
    await syncToFirestore(newAll);
  };

  const handleBulkUpload = async (uploadedActiveRecords) => {
    let newAll = [];
    setRecords(prev => {
      const otherWeeks = prev.filter(r => r.weekKey !== activeWeekKey);
      const uploadedWithKey = uploadedActiveRecords.map(r => ({
        ...r,
        weekKey: activeWeekKey
      }));
      newAll = [...otherWeeks, ...uploadedWithKey];
      safeLocalSet('attendance_records', JSON.stringify(newAll));
      return newAll;
    });
    await syncToFirestore(newAll);
  };

  // Clerk Account CRUD Handlers
  const handleAddClerk = async (newClerk) => {
    setClerks(prev => [newClerk, ...prev]);
    try {
      await setDoc(doc(db, "clerks", String(newClerk.id)), newClerk);
    } catch (e) {
      console.warn("Firestore add clerk failed:", e);
    }
  };

  const handleUpdateClerk = async (updatedClerk) => {
    setClerks(prev => prev.map(c => c.id === updatedClerk.id ? updatedClerk : c));
    try {
      await setDoc(doc(db, "clerks", String(updatedClerk.id)), updatedClerk);
    } catch (e) {
      console.warn("Firestore update clerk failed:", e);
    }
  };

  const handleDeleteClerk = async (clerkId) => {
    setClerks(prev => prev.filter(c => c.id !== clerkId));
    try {
      await deleteDoc(doc(db, "clerks", String(clerkId)));
    } catch (e) {
      console.warn("Firestore delete clerk failed:", e);
    }
  };

  // Get human readable tab name
  const getTabTitle = () => {
    switch(activeTab) {
      case 'dashboard': return '대시보드';
      case 'attendance': return '출결 관리';
      case 'members': return '담당자 계정 관리';
      default: return '홈';
    }
  };

  if (!isLoggedIn) {
    return (
      <LoginPage 
        clerks={clerks}
        onLogin={(userData) => {
          setIsLoggedIn(true);
          setCurrentUser(userData);
          safeSessionSet('clerks_logged_in', 'true');
          safeSessionSet('clerks_current_user', JSON.stringify(userData));
        }}
      />
    );
  }

  return (
    <div className="app-container">
      {/* Sidebar Backdrop Overlay on Mobile */}
      {isSidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="sidebar-logo-icon">
              <ClipboardList size={20} />
            </div>
            <span className="sidebar-title">예배 출결 관리</span>
          </div>
          <button 
            className="sidebar-close-btn"
            onClick={() => setIsSidebarOpen(false)}
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        <nav style={{ flex: 1 }}>
          <ul className="sidebar-menu">
            <li className="sidebar-item">
              <button 
                className={`sidebar-link ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('dashboard');
                  setIsSidebarOpen(false);
                }}
              >
                <LayoutDashboard size={18} />
                대시보드
              </button>
            </li>
            <li className="sidebar-item">
              <button 
                className={`sidebar-link ${activeTab === 'attendance' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('attendance');
                  setIsSidebarOpen(false);
                }}
              >
                <ClipboardList size={18} />
                출결관리
              </button>
            </li>
            {currentUser.role === 'super' && <li className="sidebar-item">
              <button 
                className={`sidebar-link ${activeTab === 'members' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('members');
                  setIsSidebarOpen(false);
                }}
              >
                <Users size={18} />
                담당자 관리
              </button>
            </li>}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="avatar">
              {currentUser.name ? currentUser.name.slice(0, 2) : (currentUser.role === 'super' ? '본부' : '지')}
            </div>
            <div className="user-info">
              <span className="user-name">{currentUser.name || '사용자'}</span>
              <span className="user-role">
                {currentUser.role === 'super' ? '본부 총괄' : `${currentUser.region} 총무`}
              </span>
            </div>
          </div>
          <button 
            className="btn-logout"
            onClick={async () => {
              try {
                await signOut(auth);
                setIsSidebarOpen(false);
              } catch (e) {
                console.warn("Signout failed:", e);
              }
            }}
          >
            로그아웃
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <main className="main-content">
        <header className="top-navbar">
          <div className="page-title-area" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              className="sidebar-toggle-btn"
              onClick={() => setIsSidebarOpen(true)}
              style={{
                display: 'none',
                background: 'none',
                border: 'none',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <Menu size={24} />
            </button>
            <h2 className="page-title">{getTabTitle()}</h2>
          </div>

          <div className="navbar-right">
            <div style={{ position: 'relative', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <Bell size={20} />
              <span style={{ position: 'absolute', top: -4, right: -4, width: 8, height: 8, backgroundColor: 'var(--accent-rose)', borderRadius: '50%' }} />
            </div>
          </div>
        </header>

        {/* Tab Switcher */}
        {activeTab === 'dashboard' && (
          <DashboardTab 
            records={activeWeekRecords} 
            members={activeWeekMembers} 
            currentUser={currentUser}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            selectedWeek={selectedWeek}
            setSelectedYear={setSelectedYear}
            setSelectedMonth={setSelectedMonth}
            setSelectedWeek={setSelectedWeek}
          />
        )}
        {activeTab === 'attendance' && (
          <AttendanceTab 
            records={activeWeekRecords}
            allRecords={records} 
            onUpdateRecords={handleUpdateRecords} 
            onBulkUpload={handleBulkUpload}
            selectedDate={selectedDate}
            currentUser={currentUser}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            selectedWeek={selectedWeek}
            setSelectedYear={setSelectedYear}
            setSelectedMonth={setSelectedMonth}
            setSelectedWeek={setSelectedWeek}
          />
        )}
        {activeTab === 'members' && currentUser.role === 'super' && (
          <MemberTab 
            clerks={clerks} 
            onAddClerk={handleAddClerk}
            onUpdateClerk={handleUpdateClerk}
            onDeleteClerk={handleDeleteClerk}
            currentUser={currentUser}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-bottom-nav">
        <button 
          className={`mobile-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <LayoutDashboard size={20} />
          <span>대시보드</span>
        </button>
        <button 
          className={`mobile-nav-item ${activeTab === 'attendance' ? 'active' : ''}`}
          onClick={() => setActiveTab('attendance')}
        >
          <ClipboardList size={20} />
          <span>출결관리</span>
        </button>
        {currentUser.role === 'super' && (
          <button 
            className={`mobile-nav-item ${activeTab === 'members' ? 'active' : ''}`}
            onClick={() => setActiveTab('members')}
          >
            <Users size={20} />
            <span>담당자 관리</span>
          </button>
        )}
        <button 
          className="mobile-nav-item"
          onClick={async () => {
            if (window.confirm("정말로 로그아웃 하시겠습니까?")) {
              try {
                await signOut(auth);
              } catch (e) {
                console.warn("Signout failed:", e);
              }
            }
          }}
          style={{ color: 'var(--accent-rose)' }}
        >
          <LogOut size={20} />
          <span>로그아웃</span>
        </button>
      </nav>
    </div>
  );
}
