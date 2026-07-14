import React, { useState } from 'react';
import { X, Clipboard, ArrowRight } from 'lucide-react';

export default function TextUploadModal({ isOpen, onClose, onApply, activeWeekKey }) {
  const [text, setText] = useState('');

  const parseAttendanceText = (rawText) => {
    if (!rawText.trim()) return null;

    // 1. Detect target region
    let region = '상암지역';
    const regionMatch = rawText.match(/([가-힣0-9a-zA-Z]+지역)/);
    if (regionMatch) {
      region = regionMatch[1].trim();
    } else {
      const fallbackMatch = rawText.match(/([가-힣0-9a-zA-Z]+)\s*\n*.*출결재적/);
      if (fallbackMatch) {
        let rName = fallbackMatch[1].trim();
        if (!rName.endsWith('지역') && rName !== '청년회') {
          rName = rName + '지역';
        }
        region = rName;
      }
    }

    // Determine Sunday vs Wednesday (Sunday is default if '삼일' is not explicitly found)
    const hasWednesday = rawText.includes('삼일예배') || rawText.includes('삼일');
    const hasSunday = !hasWednesday;

    const parseSection = (sectionText, isSunday) => {
      const stats = {
        total: 0,
        attended: 0,
        daemyun: {
          hwajeong: {}, // time -> count
          moimbang: {}, // loc -> time -> count
          hyungje: 0,
          hupryuk: 0,
          center: 0,
          saesinjaru: 0,
          sunyuwol: 0,
          jamunhoe: 0,
          sarang: 0
        },
        zoom: {
          on: 0,
          off: 0,
          total: 0
        },
        daeche: {
          dangil: 0,
          wol: 0,
          mok: 0,
          total: 0
        },
        gyulsub: {
          ilhoisung: 0,
          yunsuk: 0,
          janggi: 0,
          total: 0
        },
        absentNames: [],
        people: []
      };

      // Extract section header numbers, e.g. "총교등자 100명/출석 90명" (supporting U+FE0F variation selector emojis)
      const headerMatch = sectionText.match(/(?:총교등자|입교자)\s*(\d+)명\s*\/\s*출석\s*(\d+)명/);
      if (headerMatch) {
        stats.total = parseInt(headerMatch[1], 10);
        stats.attended = parseInt(headerMatch[2], 10);
      }

      // Helper regex helper for simple matches supporting optional parentheses
      const getCount = (pattern) => {
        const m = sectionText.match(pattern);
        return m ? parseInt(m[1], 10) : 0;
      };

      // Extract Hwajeong times: match leading bullet/star *7시30분 (12), - 9시 22, • 12시 5, - 20시 (1)
      const hwajeongStart = sectionText.indexOf('화정성전');
      const moimbangStart = sectionText.indexOf('모임방', hwajeongStart + 1);
      const hwajeongText = hwajeongStart >= 0
        ? sectionText.slice(hwajeongStart, moimbangStart > hwajeongStart ? moimbangStart : undefined)
        : '';
      const hwajeongLines = hwajeongText.match(/[*•-]\s*(\d+시\s*\d+분|\d+시)\s*\(?(\d+)\)?/g) || [];
      hwajeongLines.forEach(line => {
        const m = line.match(/[*•-]\s*(\d+시\s*\d+분|\d+시)\s*\(?(\d+)\)?/);
        if (m) {
          const time = m[1].replace(/\s+/g, '');
          stats.daemyun.hwajeong[time] = parseInt(m[2], 10);
        }
      });

      // Extract Moimbang times line-by-line
      const lines = sectionText.split('\n');
      let currentMoimbang = null;
      lines.forEach(line => {
        const cleanLine = line.trim();
        if (cleanLine.startsWith('*') || cleanLine.startsWith('•') || cleanLine.startsWith('-') || cleanLine.startsWith('ㄴ') || cleanLine.startsWith('➖')) {
          // If it declares a location header, e.g. "*홍대/상수" or "*주엽" or "➖모임방 23명" or "- 홍대"
          if (cleanLine.includes('홍대') || cleanLine.includes('상수') || cleanLine.includes('주엽') || cleanLine.includes('서교') || cleanLine.includes('그외')) {
            currentMoimbang = cleanLine.replace(/[*•\-ㄴ➖]/g, '').replace(/\d+\s*명?$/, '').trim();
          } else if (currentMoimbang) {
            // It's a sub-item under the current location, e.g. "ㄴ 12시 (19)" or "- 12시 00" or "- 타부서모임방 08"
            const m = cleanLine.match(/^[-\s*•ㄴ]*(\d+시\s*\d+분|\d+시|장소|타부서모임방)\s*\(?(\d+)\)?/);
            if (m) {
              const time = m[1].replace(/\s+/g, '');
              const count = parseInt(m[2], 10);
              if (!stats.daemyun.moimbang[currentMoimbang]) {
                stats.daemyun.moimbang[currentMoimbang] = {};
              }
              stats.daemyun.moimbang[currentMoimbang][time] = count;
            }
          }
        }
      });

      // Other face-to-face categories
      stats.daemyun.hyungje = getCount(/형제교회\s*\(?(\d+)\)?명?/) || getCount(/형제\s*\(?(\d+)\)?명?/);
      stats.daemyun.hupryuk = getCount(/협력교회\s*\(?(\d+)\)?명?/) || getCount(/협교\s*\(?(\d+)\)?명?/);
      stats.daemyun.center = getCount(/센터수강\s*\(?(\d+)\)?명?/) || getCount(/센터수업\s*\(?(\d+)\)?명?/) || getCount(/센터\s*\(?(\d+)\)?명?/);
      stats.daemyun.saesinjaru = getCount(/새신자교육\s*\(?(\d+)\)?명?/) || getCount(/새신자수업\s*\(?(\d+)\)?명?/);
      stats.daemyun.sunyuwol = getCount(/선유월예배\s*\(?(\d+)\)?명?/) || getCount(/선유월\s*\(?(\d+)\)?명?/);
      stats.daemyun.jamunhoe = getCount(/자문회예배\s*\(?(\d+)\)?명?/) || getCount(/자문회\s*\(?(\d+)\)?명?/);
      stats.daemyun.sarang = getCount(/사랑예배\s*\(?(\d+)\)?명?/) || getCount(/사랑\s*\(?(\d+)\)?명?/);

      // Zoom
      if (isSunday) {
        stats.zoom.on = getCount(/화면\s*on\s*:\s*\(?(\d+)\)?/i) || getCount(/온\s*:\s*\(?(\d+)\)?/);
        stats.zoom.off = getCount(/화면\s*off\s*:\s*\(?(\d+)\)?/i) || getCount(/오프\s*:\s*\(?(\d+)\)?/);
        stats.zoom.total = getCount(/줌\s*\(?(\d+)\)?명/) || getCount(/줌\s*\(?(\d+)\)?/);
      } else {
        stats.zoom.total = getCount(/줌\s*\(?(\d+)\)?명/) || getCount(/줌\s*\(?(\d+)\)?/);
      }

      // Alternative substitute worships
      stats.daeche.dangil = getCount(/당일\s*\(?(\d+)\)?/);
      stats.daeche.wol = getCount(/월\s*대체\s*\(?(\d+)\)?/) || getCount(/월대체\s*\(?(\d+)\)?/);
      stats.daeche.mok = getCount(/목\s*대체\s*\(?(\d+)\)?/) || getCount(/목대체\s*\(?(\d+)\)?/);
      stats.daeche.total = getCount(/대체\s*\(?(\d+)\)?명/) || getCount(/대체\s*\(?(\d+)\)?/);

      // Gyulsub
      stats.gyulsub.ilhoisung = getCount(/일회성\s*\(?(\d+)\)?/);
      stats.gyulsub.yunsuk = getCount(/연속\s*\(?(\d+)\)?/);
      stats.gyulsub.janggi = getCount(/장기\s*\(?(\d+)\)?/);
      stats.gyulsub.total = getCount(/결석\s*\(?(\d+)\)?명/) || getCount(/결석\s*\(?(\d+)\)?/);

      // Map every real-name line to the category immediately above it.
      // Supports names with distinguishing suffixes such as 조혜인92.
      let currentLocation = '';
      let currentAssignment = null;
      const actualField = isSunday ? '주일실제(분류)' : '삼일실제(분류)';
      lines.forEach(rawLine => {
        const line = rawLine.trim();
        if (!line) return;

        const locationMatch = line.match(/^[*-]\s*(화정성전|홍대|서교|주엽|상수|그외\s*모임방)/);
        if (locationMatch) {
          currentLocation = locationMatch[1].replace(/\s/g, '').replace('홍대', '서교');
          currentAssignment = null;
          return;
        }

        const timeMatch = line.match(/^[-*]\s*(\d+시(?:\s*\d+분)?)\s*0*(\d+)/);
        if (timeMatch && currentLocation && currentLocation !== '그외모임방') {
          const time = timeMatch[1].replace(/\s/g, '');
          const location = currentLocation === '화정성전' ? '화정' : currentLocation;
          currentAssignment = { field: actualField, value: `${location}-${time}` };
          return;
        }

        const categoryRules = [
          [/^[*-]?\s*형제교회/, '형제교회'], [/^[*-]?\s*협력교회/, '협력교회'],
          [/^[*-]?\s*센터수강/, '센터수강'], [/^[*-]?\s*새신자교육/, '새신자교육'],
          [/^[*-]?\s*선유월예배/, '선유월예배'], [/^[*-]?\s*자문회예배/, '자문회예배'],
          [/^[*-]?\s*사랑예배/, '사랑예배']
        ];
        const category = categoryRules.find(([regex]) => regex.test(line));
        if (category) {
          currentAssignment = { field: actualField, value: category[1] };
          return;
        }
        if (/^2\.\s*줌/.test(line)) { currentAssignment = { field: actualField, value: '줌' }; return; }
        if (/^[*-]\s*당일/.test(line)) { currentAssignment = { field: actualField, value: '당일대체' }; return; }
        if (/^[*-]\s*월\s*대체/.test(line)) { currentAssignment = { field: actualField, value: '월대체' }; return; }
        if (/^[*-]\s*목\s*대체/.test(line)) { currentAssignment = { field: actualField, value: '목대체' }; return; }
        if (/^[*-]\s*일회성/.test(line)) { currentAssignment = { field: actualField, value: '결석', reason: '일회성' }; return; }
        if (/^[*-]\s*연속/.test(line)) { currentAssignment = { field: actualField, value: '결석', reason: '연속' }; return; }
        if (/^[*-]\s*장기/.test(line)) { currentAssignment = { field: actualField, value: '결석', reason: '장기' }; return; }
        if (/^[*-]\s*미보고/.test(line)) { currentAssignment = { field: actualField, value: '미보고' }; return; }
        if (/^‼️/.test(line)) { currentAssignment = null; return; }

        if (currentAssignment && !/^[*\-▪️➖#]|^\d+\./.test(line)) {
          const names = line.split(/[\s,·/]+/)
            .map(name => name.trim())
            .filter(name => /^[가-힣]{2,4}[a-zA-Z0-9]*$/.test(name) && name !== '이름');
          names.forEach(name => stats.people.push({ name, ...currentAssignment }));
        }
      });

      // Absent names block line-by-line scanner
      const gyulsubIndex = sectionText.indexOf('결석');
      if (gyulsubIndex !== -1) {
        const afterGyulsub = sectionText.slice(gyulsubIndex);
        const gyLines = afterGyulsub.split('\n');
        for (let i = 1; i < gyLines.length; i++) {
          const l = gyLines[i].trim();
          // Break if we reach another header group
          if (l.startsWith('▪') || l.startsWith('➖') || l.startsWith('1.') || l.startsWith('2.') || l.startsWith('3.')) {
            break;
          }
          if (l.includes('미보고') || l.includes('최종 출결')) {
            break;
          }
          // If the line contains words and isn't a bullet indicator
          if (l && !l.startsWith('-') && !l.startsWith('*') && !l.startsWith('•') && !l.startsWith('ㄴ') && !l.startsWith('➖')) {
            const names = l.split(/[\s,·/]+/)
              .map(n => n.trim())
              .filter(n => /^[가-힣]{2,4}[a-zA-Z0-9]*$/.test(n) && n !== '이름');
            stats.absentNames.push(...names);
          }
        }
      }

      return stats;
    };

    let sunCg = null;
    let sunIp = null;
    let wedCg = null;
    let wedIp = null;

    if (hasSunday) {
      const sunPart = rawText.split(/#삼일예배|삼일예배/)[0];
      const cgIndex = sunPart.indexOf('총교등자');
      const ipIndex = sunPart.indexOf('입교자');
      
      if (cgIndex !== -1 && ipIndex !== -1) {
        sunCg = parseSection(sunPart.slice(cgIndex, ipIndex), true);
        sunIp = parseSection(sunPart.slice(ipIndex), true);
      } else if (cgIndex !== -1) {
        sunCg = parseSection(sunPart.slice(cgIndex), true);
      }
    }

    if (hasWednesday) {
      const parts = rawText.split(/#삼일예배|삼일예배/);
      const wedPart = parts[1] || parts[0];
      const cgIndex = wedPart.indexOf('총교등자');
      const ipIndex = wedPart.indexOf('입교자');

      if (cgIndex !== -1 && ipIndex !== -1) {
        wedCg = parseSection(wedPart.slice(cgIndex, ipIndex), false);
        wedIp = parseSection(wedPart.slice(ipIndex), false);
      } else if (cgIndex !== -1) {
        wedCg = parseSection(wedPart.slice(cgIndex), false);
      }
    }

    return {
      region,
      hasSunday,
      hasWednesday,
      sunCg,
      sunIp,
      wedCg,
      wedIp,
      parsedPeople: [
        ...(sunCg?.people || []).map(person => ({ ...person, group: 'cg' })),
        ...(sunIp?.people || []).map(person => ({ ...person, group: 'ip' })),
        ...(wedCg?.people || []).map(person => ({ ...person, group: 'cg' })),
        ...(wedIp?.people || []).map(person => ({ ...person, group: 'ip' }))
      ]
    };
  };

  const handleApply = () => {
    const parsed = parseAttendanceText(text);
    if (!parsed || (!parsed.sunCg && !parsed.wedCg)) {
      alert('출결 보고서 형식을 분석할 수 없습니다. 총교등자/입교자 단어가 명확히 포함된 텍스트인지 다시 한번 확인해 주세요.');
      return;
    }
    onApply(parsed);
    setText('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%' }}>
        <div className="modal-header">
          <div>
            <span className="badge badge-blue" style={{ marginBottom: '6px' }}>텍스트 업로드</span>
            <h3 className="modal-title">보고서 텍스트 복사 ➡️ 출결관리 등록</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '20px' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.5 }}>
            💡 카카오톡으로 보고된 <strong>[주일예배]</strong> 또는 <strong>[삼일예배]</strong> 보고서 텍스트를 그대로 아래 박스에 붙여넣기 하세요.<br />
            지역명, 총교등자/입교자 비율, 대면/줌/대체/결석 인원 및 신규 결석자의 이름까지 자동 분석하여 출결관리 데이터로 완벽하게 변환해 줍니다.
          </p>
          <textarea
            className="report-text-area"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="여기에 카카오톡 보고서 텍스트를 붙여넣으세요..."
            style={{ width: '100%', height: '350px', fontFamily: 'monospace', fontSize: '0.85rem', padding: '12px', boxSizing: 'border-box' }}
          />
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            취소
          </button>
          <button className="btn btn-primary" onClick={handleApply} style={{ gap: '6px' }}>
            분석 및 적용
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
