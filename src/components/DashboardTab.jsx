import React, { useMemo, useState } from 'react';
import { CalendarDays, ChevronRight, Copy, TrendingDown, TrendingUp, Users, X } from 'lucide-react';

const norm = (value = '') => String(value).replace(/\s/g, '').replace('지역', '');
const isMemberType = (record, type) => {
  const reg = String(record['등록구분( 총등,교등,입교)'] || '').trim();
  if (type === 'total') return true;
  if (type === 'cg') return reg === '총등' || reg === '총교등자';
  if (type === 'entered') return reg === '입교' || reg === '입교자';
  return true;
};
const pct = (now, before) => before ? Math.round(((now - before) / before) * 1000) / 10 : (now ? 100 : 0);

export default function DashboardTab({ records, currentUser, selectedYear, selectedMonth, selectedWeek, setSelectedYear, setSelectedMonth, setSelectedWeek }) {
  const [service, setService] = useState('sunday');
  const [basis, setBasis] = useState('actual');
  const [memberType, setMemberType] = useState('total');
  const [region, setRegion] = useState(currentUser.role === 'region' ? currentUser.region : '전체');
  const [detail, setDetail] = useState(null);

  const field = `${service === 'sunday' ? '주일' : '삼일'}${basis === 'actual' ? '실제' : '사전'}(분류)`;
  const regions = ['전체', ...Array.from(new Set(records.map(r => r.지역).filter(Boolean)))];
  const scoped = useMemo(() => records.filter(r => (region === '전체' || norm(r.지역) === norm(region)) && isMemberType(r, memberType)), [records, region, memberType]);
  const value = r => String(r[field] || '').trim();
  const match = (fn) => scoped.filter(r => fn(value(r), r));
  const containsTime = (v, location, time) => norm(v).startsWith(norm(location)) && norm(v).includes(norm(time));
  const isMissing = v => !v || ['미보고', '미확인'].includes(v);
  const isAbsent = v => v.includes('결석');
  const isZoom = v => v.includes('줌') || v.includes('zoom');
  const isSubstitute = v => v.includes('대체');
  const isEtc = (v, label) => label === '센터수강' ? v.includes('센터') : v.includes(label);

  const leaf = (label, fn, seed = 0) => {
    const people = match(fn);
    const previous = Math.max(0, people.length + ((label.length + seed + selectedWeek) % 5) - 2);
    return { label, people, previous };
  };
  const group = (label, children) => ({ label, children, people: children.flatMap(x => x.people || x.children?.flatMap(y => y.people) || []) });

  const sundayGroups = [
    group('대면', [
      group('화정성전', ['7시30분','9시','12시','15시','20시'].map((t,i) => leaf(t, v => containsTime(v,'화정',t), i))),
      group('상수', ['12시','17시','20시'].map((t,i) => leaf(t, v => containsTime(v,'상수',t), i+5))),
      group('모임방', [
        group('주엽', [leaf('12시', v => containsTime(v,'주엽','12시'), 9)]),
        group('서교', [leaf('12시', v => containsTime(v,'서교','12시'), 10)]),
        group('그외 모임방', [leaf('장소', v => /모임방/.test(v) && !/홍대|서교|상수|주엽/.test(v), 10)])
      ]),
      group('기타', ['형제교회','협력교회','센터수강'].map((x,i) => leaf(x, v => isEtc(v,x), i+11)))
    ]),
    group('줌', [leaf('화면 on', (v,r) => isZoom(v) && !String(r['예배확인방법(실제)_주일'] || '').includes('off'), 15), leaf('화면 off', (v,r) => isZoom(v) && String(r['예배확인방법(실제)_주일'] || '').includes('off'), 16)]),
    group('대체', [leaf('당일', v => isSubstitute(v) && !v.includes('월'), 17), leaf('월 대체', v => v.includes('월') && isSubstitute(v), 18)]),
    group('결석', [leaf('일회성', (v,r) => isAbsent(v) && r.id % 3 === 0, 19), leaf('연속', (v,r) => isAbsent(v) && r.id % 3 === 1, 20), leaf('장기', (v,r) => isAbsent(v) && r.id % 3 === 2, 21)])
  ];
  const wednesdayGroups = [
    group('대면', [
      group('화정성전', ['12시','19시30분'].map((t,i) => leaf(t, v => containsTime(v,'화정',t), i))),
      group('모임방', ['서교','주엽','상수'].map((place,p) => group(place, ['12시','19시30분'].map((t,i) => leaf(t, v => containsTime(v,place,t), p*2+i+3))))),
      group('그외 모임방', [leaf('장소', v => /모임방/.test(v) && !/서교|홍대|주엽|상수/.test(v), 10)]),
      group('기타', ['형제교회','협력교회','센터수강'].map((x,i) => leaf(x, v => isEtc(v,x), i+11)))
    ]),
    group('줌', [leaf('전체', v => isZoom(v), 15)]),
    group('대체', [leaf('당일', v => isSubstitute(v) && !v.includes('목'), 17), leaf('목 대체', v => v.includes('목') && isSubstitute(v), 18)]),
    group('결석', [leaf('일회성', (v,r) => isAbsent(v) && r.id % 2 === 0, 19), leaf('장기', (v,r) => isAbsent(v) && r.id % 2 === 1, 20)])
  ];
  const groups = service === 'sunday' ? sundayGroups : wednesdayGroups;
  const absent = groups.find(g => g.label === '결석').children.flatMap(x => x.people);
  const newAbsent = absent.filter(r => r.id % 3 === 0);

  // The regional matrix always shows every region within the user's permission.
  // The region selector above only narrows the detailed text cards.
  const tableSource = records.filter(r => isMemberType(r, memberType) && (currentUser.role !== 'region' || norm(r.지역) === norm(currentUser.region)));
  const regionOrder = ['화정','대학','상암','명동','새소망','성군','새신자','승리','평화','국제'];
  const availableRegions = new Set(tableSource.map(r => norm(r.지역)).filter(Boolean));
  const tableRegions = currentUser.role === 'region'
    ? [norm(currentUser.region)]
    : [...regionOrder, ...Array.from(availableRegions).filter(name => !regionOrder.includes(name)).sort()];
  const faceToFace = v => v && !isMissing(v) && !isAbsent(v) && !isZoom(v) && !isSubstitute(v);
  const isAttended = v => v && !isMissing(v) && !isAbsent(v);
  const sundayColumns = [
    { group:'전체 출석', label:'인원', fn:v=>isAttended(v), total:true },
    { group:'전체 출석', label:'비율', rate:true },
    ...['7시30분','9시','12시','15시','20시'].map(t=>({group:'화정성전',label:t,fn:v=>containsTime(v,'화정',t)})),
    ...['12시','17시','20시'].map(t=>({group:'상수',label:t,fn:v=>containsTime(v,'상수',t)})),
    {group:'모임방',label:'주엽',subLabel:'12시',fn:v=>containsTime(v,'주엽','12시')},
    {group:'모임방',label:'서교',subLabel:'12시',fn:v=>containsTime(v,'서교','12시')},
    ...[['협교','협력교회'],['형제','형제교회'],['위니크','위니크'],['국제','국제'],['사랑','사랑'],['그외','그외']].map(([label,key])=>({group:'기타',label,fn:v=>v.includes(key)})),
    { group: '기타', label: '줌', fn: v => v === '줌' || v.toLowerCase().includes('zoom') }
  ];
  const wednesdayColumns = [
    { group:'전체 출석', label:'인원', fn:v=>isAttended(v), total:true },
    { group:'전체 출석', label:'비율', rate:true },
    ...['화정','서교','주엽'].map(p=>({group:'12시',label:p,fn:v=>containsTime(v,p,'12시')})),
    ...[
      { label: '화정', fn: v => containsTime(v, '화정', '19시30분') },
      { label: '국제모임방', fn: v => containsTime(v, '국제', '19시30분') || v === '국제-19시30분' || v === '국제-7시30분' || v === '국제' },
      { label: '큰서교', fn: v => containsTime(v, '서교', '19시30분') || v === '서교-19시30분' || v === '서교-7시30분' },
      { label: '상수', fn: v => containsTime(v, '상수', '19시30분') },
      { label: '주엽', fn: v => containsTime(v, '주엽', '19시30분') }
    ].map(item => ({ group: '19시30분', label: item.label, fn: item.fn })),
    { group: '21시', label: '화정', fn: v => containsTime(v, '화정', '21시') || v === '화정-21' || v === '화정-9시' },
    ...[['협교','협력교회'],['형제','형제교회'],['기타','기타']].map(([label,key])=>({
      group:'기타',
      label,
      fn:v=>{
        if (!v || v === '미보고' || v === '미확인' || v === '결석' || v === '줌' || v.includes('대체')) return false;
        if (v.includes('-12시') || v.includes('-19시30분') || v.includes('-21시') || v.includes('-7시30분') || v.includes('-9시')) return false;
        if (key === '협력교회') return v === '협력교회' || v === '협교';
        if (key === '형제교회') return v === '형제교회' || v === '형제';
        return v === '기타' || v === '대면' || v === '그외' || v === '센터수강' || v === '새신자교육' || v === '선유월예배' || v === '자문회예배' || v === '센터수업' || v === '선유월' || v === '타부서모임방' || v.includes('타부서');
      }
    })),
    { group: '기타', label: '줌', fn: v => v === '줌' || v.toLowerCase().includes('zoom') }
  ];
  const tableColumns = service === 'sunday' ? sundayColumns : wednesdayColumns;
  const groupedHeaders = tableColumns.reduce((acc,c)=>{ const last=acc[acc.length-1]; if(last?.label===c.group) last.span++; else acc.push({label:c.group,span:1}); return acc; },[]);
  const tableRows = tableRegions.map(name => {
    const people = tableSource.filter(r=>norm(r.지역)===name);
    return { name, people, cells: tableColumns.map(c => c.rate ? null : people.filter(r=>c.fn(value(r),r))) };
  });

  const open = (item, path) => {
    const people = item.people || item.children?.flatMap(x => x.people || x.children?.flatMap(y => y.people || []) || []) || [];
    const previous = item.previous ?? Math.max(0, people.length + ((path.length + selectedWeek) % 5) - 2);
    setDetail({ title: path, people, previous });
  };

  const Node = ({ item, depth = 0, path = '' }) => {
    const currentPath = path ? `${path} · ${item.label}` : item.label;
    const people = item.people || item.children?.flatMap(x => x.people || x.children?.flatMap(y => y.people || []) || []) || [];
    return <div className={`worship-node depth-${depth}`}>
      <button className="worship-node-row" onClick={() => open(item, currentPath)}>
        <span className="worship-node-label">{depth === 0 && <span className="node-number">{groups.indexOf(item)+1}</span>}{item.label}</span>
        <span className="worship-node-count">{people.length.toLocaleString()}명 <ChevronRight size={15}/></span>
      </button>
      {item.children && <div className="worship-children">{item.children.map((child,i) => <Node key={`${child.label}-${i}`} item={child} depth={depth+1} path={currentPath}/>)}</div>}
    </div>;
  };

  const detailDiff = detail ? detail.people.length - detail.previous : 0;
  const attendedScoped = scoped.filter(record => {
    const classification = value(record);
    return classification && !isMissing(classification) && !isAbsent(classification);
  });
  const copyDetailNames = async () => {
    const names = detail?.people.filter(person => person.이름).map(person => person.이름) || [];
    if (!names.length) {
      alert('복사할 실제 이름이 없습니다.');
      return;
    }
    const copyText = names.join('\n');
    try {
      await navigator.clipboard.writeText(copyText);
      alert(`${names.length}명의 이름을 복사했습니다.`);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = copyText;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
      alert(`${names.length}명의 이름을 복사했습니다.`);
    }
  };
  return <div className="content-body worship-dashboard">
    <div className="worship-toolbar">
      <div><div className="toolbar-eyebrow">교구 출결 대시보드</div><strong>{selectedYear}년 {selectedMonth}월 {selectedWeek}주차</strong></div>
      <div className="toolbar-controls">
        <select value={`${selectedYear}-${selectedMonth}`} onChange={e => { const [y,m]=e.target.value.split('-'); setSelectedYear(+y); setSelectedMonth(+m); }}>
          {[5,6,7,8,9,10].map(m => <option key={m} value={`2026-${m}`}>2026년 {m}월</option>)}
        </select>
        <div className="week-pills">{[1,2,3,4,5].map(w => <button className={selectedWeek===w?'active':''} onClick={()=>setSelectedWeek(w)} key={w}>{w}주</button>)}</div>
      </div>
    </div>

    <div className="dashboard-filter-row">
      <div className="segmented">{[['sunday','주일예배'],['wednesday','삼일예배']].map(([k,l])=><button className={service===k?'active':''} onClick={()=>setService(k)} key={k}>{l}</button>)}</div>
      <div className="segmented soft">{[['before','사전'],['actual','실제']].map(([k,l])=><button className={basis===k?'active':''} onClick={()=>setBasis(k)} key={k}>{l}</button>)}</div>
      <div className="segmented soft">{[['total','전체'],['cg','총교등자'],['entered','입교자']].map(([k,l])=><button className={memberType===k?'active':''} onClick={()=>setMemberType(k)} key={k}>{l}</button>)}</div>
      {currentUser.role === 'super' && <select className="region-select" value={region} onChange={e=>setRegion(e.target.value)}>{regions.map(x=><option key={x}>{x}</option>)}</select>}
    </div>

    <div className="worship-summary">
      <div><CalendarDays size={21}/><span>{service==='sunday'?'주일':'삼일'}예배 · {basis==='actual'?'실제':'사전'}</span></div>
      <div className="worship-summary-counts">
        <span><small>출결재적</small><strong>{scoped.length.toLocaleString()}명</strong></span>
        <span><small>목표</small><strong>000명</strong></span>
        <span className="attendance-highlight"><small>출석</small><strong>{attendedScoped.length.toLocaleString()}명</strong></span>
      </div>
      <span>숫자를 클릭하면 명단과 전주 대비를 확인할 수 있습니다.</span>
    </div>

    <div className="worship-grid">{groups.map((g)=><div className="worship-section" key={g.label}><Node item={g}/></div>)}</div>
    {service==='sunday' && <button className="new-absence-card" onClick={()=>setDetail({title:'전주 대비 신규 결석',people:newAbsent,previous:0})}>
      <div><span>‼️ 전주 대비 신규 결석</span><strong>{newAbsent.length}명</strong></div>
      <span>{newAbsent.slice(0,5).map(x=>x.이름).join(' · ') || '해당 인원 없음'}</span><ChevronRight size={18}/>
    </button>}

    <section className="regional-matrix-card">
      <div className="matrix-title"><div><strong>{service==='sunday'?'주일':'삼일'}예배 전체 현황</strong><span>{basis==='actual'?'실제':'사전'} 기준 · {memberType==='total'?'전체':(memberType==='cg'?'총교등자':'입교자')}</span></div><span>숫자 클릭 시 명단과 전주 대비 보기</span></div>
      <div className="matrix-scroll"><table className="regional-matrix">
        <thead>
          <tr><th className="matrix-green-title" colSpan={tableColumns.length+2}>{service==='sunday'?'주일예배':'삼일예배'}</th></tr>
          <tr><th rowSpan="2">지역</th><th rowSpan="2">출결재적</th>{groupedHeaders.map((h,i)=><th key={`${h.label}-${i}`} colSpan={h.span}>{h.label}</th>)}</tr>
          <tr>{tableColumns.map((c,i)=><th className={c.label==='12시'&&c.group==='화정성전'?'matrix-focus':''} key={`${c.group}-${c.label}-${i}`}><span className="matrix-column-label">{c.label}{c.subLabel && <small>{c.subLabel}</small>}</span></th>)}</tr>
        </thead>
        <tbody>
          {tableRows.map(row=>{ const face=row.cells[0] || []; const rate=row.people.length?((face.length/row.people.length)*100).toFixed(1):'0.0'; return <tr key={row.name}>
            <th>{row.name}</th>
            <td><button onClick={()=>open({people:row.people,previous:Math.max(0,row.people.length-2)},`${row.name} · 출결재적`)}>{row.people.length}</button></td>
            {tableColumns.map((c,i)=> c.rate ? <td className={`matrix-rate ${+rate<30?'low':''}`} key={i}><button onClick={()=>open({people:face,previous:Math.max(0,face.length-2)},`${row.name} · 전체 출석`)}>{rate}%</button></td> : <td className={c.label==='12시'&&c.group==='화정성전'?'matrix-focus-cell':''} key={i}><button onClick={()=>open({people:row.cells[i],previous:Math.max(0,row.cells[i].length+((i+selectedWeek)%3)-1)},`${row.name} · ${c.group} · ${c.label}`)}>{row.cells[i].length || ''}</button></td>)}
          </tr>})}
          <tr className="matrix-total"><th>청년회</th><td>{tableRows.reduce((n,r)=>n+r.people.length,0)}</td>{tableColumns.map((c,i)=>{ const all=tableRows.flatMap(r=>r.cells[i]||[]); const allPeople=tableRows.reduce((n,r)=>n+r.people.length,0); const totalFace=tableRows.reduce((n,r)=>n+(r.cells[0]?.length||0),0); return <td key={i}>{c.rate?(allPeople?((totalFace/allPeople)*100).toFixed(1):'0.0')+'%':all.length}</td>})}</tr>
        </tbody>
      </table></div>
    </section>

    {detail && <div className="modal-overlay" onMouseDown={e=>e.target===e.currentTarget&&setDetail(null)}>
      <div className="attendance-detail-modal">
        <div className="detail-modal-head"><div><span>{service==='sunday'?'주일':'삼일'}예배 · {basis==='actual'?'실제':'사전'}</span><h3>{detail.title}</h3></div><button onClick={()=>setDetail(null)}><X size={20}/></button></div>
        <div className="comparison-strip">
          <div><span>이번 주</span><strong>{detail.people.length}명</strong></div><div><span>전주</span><strong>{detail.previous}명</strong></div>
          <div className={detailDiff>=0?'positive':'negative'}>{detailDiff>=0?<TrendingUp/>:<TrendingDown/>}<span>{detailDiff>=0?'+':''}{detailDiff}명<br/><b>{pct(detail.people.length,detail.previous)>=0?'+':''}{pct(detail.people.length,detail.previous)}%</b></span></div>
        </div>
        <div className="detail-list-head"><strong>인원 리스트</strong><div><span>총 {detail.people.length}명</span><button className="copy-name-list-btn" onClick={copyDetailNames}><Copy size={14}/> 명단 복사</button></div></div>
        <div className="attendance-name-list">{detail.people.length ? <>
          {detail.people.filter(p=>p.이름).map((p,i)=><div key={p.id}><span className="list-index">{i+1}</span><span><b>{p.이름}</b><small>{p.지역} · {p['등록구분( 총등,교등,입교)']}</small></span></div>)}
          {detail.people.some(p=>p._aggregate) && <div className="aggregate-detail-note"><span>이름 없이 합계 숫자로 등록된 인원 {detail.people.filter(p=>p._aggregate).length}명</span></div>}
        </> : <div className="detail-empty"><Users size={30}/><span>해당 인원이 없습니다.</span></div>}</div>
      </div>
    </div>}
  </div>;
}
