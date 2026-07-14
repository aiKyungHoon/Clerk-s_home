const fs = require('fs');

const reportText = `[ 430708 (수) 삼일 당일 출결 보고_목대체 ]

#성군지역

▪️출결재적(총교입) 251명
- 목표 000명
- 출석 227명

▪️총교등자 239명/출석 224명
1. 대면 114명
- 화정성전 38명
*12시 17
*19시30분 19 
*21시 02

- 모임방 49명
*홍대 
- 12시 00 
- 19시 30분 00 

*주엽 44
- 12시 13 
- 19시 30분 31 

*상수  
- 12시 00 
- 19시 30분 00 

*그외 모임방 
- 타부서모임방 05 

- 기타 27
*형제교회 17명
*협력교회 10명
*센터수강 00명 

2. 줌 101명

3. 대체 09명
- 당일 01 
정승훈
- 목 대체 08 
주선정 김은혜 서재홍 강담희 김금희 
정보원 오기선 김희혜

4. 결석 09명
- 일회성 06 
김지수90 윤재상 김영수 권민석 김나경 
신정윤 
- 장기 03
정다빈 원오미 정용진 

‼️전주 대비 신규 결석 00명 
이름*5 

*미보고 06
조규희 최희은 안성진 이상민 장두원 
이상윤 

➖➖➖➖➖➖
▪️입교자 12명/출석 03명
1. 대면 002명
- 화정성전 00명
*12시 00
*19시30분 00 
*21시

- 모임방 01명
*홍대 
- 12시 00 
- 19시 30분 00 

*주엽 
- 12시 00 
- 19시 30분 01 
이상오

*상수  
- 12시 00 
- 19시 30분 00 

*그외 모임방 
- 장소 00 

- 기타 
*형제교회 00명
*협력교회 01명
정민규
*센터수강 00명 

2. 줌 001명
김태환

3. 대체 00명
- 당일 00 
- 목 대체 00 

4. 결석 08명
- 일회성 01
이재현A 
- 장기 07
오규빈 지유담 이훈탁 이현성 최나람 
조영래 유수진 
`;

const parseSection = (sectionText, isSunday) => {
  const stats = {
    total: 0,
    daemyun: {
      hwajeong: {},
      moimbang: {},
      hyungje: 0,
      hupryuk: 0,
      center: 0,
      saesinjaru: 0,
      sunyuwol: 0,
      jamunhoe: 0,
      sarang: 0
    },
    zoom: { on: 0, off: 0, total: 0 },
    daeche: { dangil: 0, wol: 0, mok: 0 },
    gyulsub: { ilhoisung: 0, yunsuk: 0, janggi: 0 }
  };

  const headerMatch = sectionText.match(/(?:총교등자|입교자)\s*(\d+)명\s*\/\s*출석\s*(\d+)명/);
  if (headerMatch) {
    stats.total = parseInt(headerMatch[1], 10);
  }

  const hwajeongStart = sectionText.indexOf('화정성전');
  const moimbangStart = sectionText.indexOf('모임방', hwajeongStart + 1);
  if (hwajeongStart !== -1 && moimbangStart !== -1) {
    const hwajeongText = sectionText.slice(hwajeongStart, moimbangStart);
    const hwajeongLines = hwajeongText.match(/[*•-]\s*(\d+시\s*\d+분|\d+시)\s*\(?(\d+)\)?/g) || [];
    hwajeongLines.forEach(line => {
      const m = line.match(/[*•-]\s*(\d+시\s*\d+분|\d+시)\s*\(?(\d+)\)?/);
      if (m) {
        const time = m[1].replace(/\s+/g, '');
        stats.daemyun.hwajeong[time] = parseInt(m[2], 10);
      }
    });
  }

  const moimbangEnd = sectionText.indexOf('기타', moimbangStart + 1);
  if (moimbangStart !== -1 && moimbangEnd !== -1) {
    const moimbangText = sectionText.slice(moimbangStart, moimbangEnd);
    const lines = moimbangText.split('\n');
    let currentMoimbang = null;
    let currentAssignment = null;
    lines.forEach(line => {
      const cleanLine = line.trim();
      if (cleanLine.startsWith('*') || cleanLine.startsWith('•') || cleanLine.startsWith('-') || cleanLine.startsWith('ㄴ') || cleanLine.startsWith('➖')) {
        if (cleanLine.includes('홍대') || cleanLine.includes('상수') || cleanLine.includes('주엽') || cleanLine.includes('서교') || cleanLine.includes('그외')) {
          currentMoimbang = cleanLine.replace(/[*•\-ㄴ➖]/g, '').replace(/\d+\s*명?$/, '').trim();
        } else if (currentMoimbang) {
          if (/^[*-]\s*미보고/.test(line)) { currentAssignment = { field: 'unreported', value: '미보고' }; return; }
          if (/^‼️/.test(line)) { currentAssignment = null; return; }
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
  }

  const categoryRules = [
    { key: 'hyungje', keywords: ['형제교회', '형제'] },
    { key: 'hupryuk', keywords: ['협력교회', '협교'] },
    { key: 'center', keywords: ['센터수강', '센터수업'] },
    { key: 'saesinjaru', keywords: ['새신자교육', '새신자자루'] },
    { key: 'sunyuwol', keywords: ['선유월예배', '선유월'] },
    { key: 'jamunhoe', keywords: ['자문회예배', '자문회'] },
    { key: 'sarang', keywords: ['사랑예배', '사랑'] }
  ];

  categoryRules.forEach(rule => {
    rule.keywords.forEach(kw => {
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`[*-]?\\s*${escaped}\\s*\\(?(0|\\d+)\\)?`);
      const m = sectionText.match(regex);
      if (m) {
        stats.daemyun[rule.key] = parseInt(m[1], 10);
      }
    });
  });

  const zoomTotalMatch = sectionText.match(/2\.\s*줌\s*\(?(\d+)\)?/);
  if (zoomTotalMatch) {
    stats.zoom.total = parseInt(zoomTotalMatch[1], 10);
  }

  const daecheDangilMatch = sectionText.match(/[*-]\s*당일\s*\(?(\d+)\)?/);
  if (daecheDangilMatch) {
    stats.daeche.dangil = parseInt(daecheDangilMatch[1], 10);
  }

  const daecheWolMatch = sectionText.match(/[*-]\s*월\s*대체\s*\(?(\d+)\)?/);
  if (daecheWolMatch) {
    stats.daeche.wol = parseInt(daecheWolMatch[1], 10);
  }

  const daecheMokMatch = sectionText.match(/[*-]\s*목\s*대체\s*\(?(\d+)\)?/);
  if (daecheMokMatch) {
    stats.daeche.mok = parseInt(daecheMokMatch[1], 10);
  }

  const gyulsubIlhoisungMatch = sectionText.match(/[*-]\s*일회성\s*\(?(\d+)\)?/);
  if (gyulsubIlhoisungMatch) {
    stats.gyulsub.ilhoisung = parseInt(gyulsubIlhoisungMatch[1], 10);
  }

  const gyulsubYunsukMatch = sectionText.match(/[*-]\s*연속\s*\(?(\d+)\)?/);
  if (gyulsubYunsukMatch) {
    stats.gyulsub.yunsuk = parseInt(gyulsubYunsukMatch[1], 10);
  }

  const gyulsubJanggiMatch = sectionText.match(/[*-]\s*장기\s*\(?(\d+)\)?/);
  if (gyulsubJanggiMatch) {
    stats.gyulsub.janggi = parseInt(gyulsubJanggiMatch[1], 10);
  }

  return stats;
};

const parseReport = (text) => {
  const isWednesday = text.includes('삼일') || text.includes('(수)');
  const wedPart = text;

  const cgIndex = wedPart.indexOf('총교등자');
  const ipIndex = wedPart.indexOf('입교자');

  const wedCg = parseSection(wedPart.slice(cgIndex, ipIndex), false);
  const wedIp = parseSection(wedPart.slice(ipIndex), false);

  console.log("wedCg stats:");
  console.log(JSON.stringify(wedCg, null, 2));

  console.log("\nwedIp stats:");
  console.log(JSON.stringify(wedIp, null, 2));
};

parseReport(reportText);
