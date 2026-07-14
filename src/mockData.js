// Clerk's Home mock data representing all 10 regions for both Sunday and Wednesday Worship tables

export const getMockRecords = () => {
  const list = [];
  
  const familyNames = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '신', '한', '오', '서', '황'];
  const givenNames1 = ['민', '서', '도', '예', '시', '하', '주', '지', '준', '수', '아', '우', '윤', '현', '태', '채', '경', '찬', '은', '재'];
  const givenNames2 = ['준', '우', '윤', '준', '아', '은', '호', '후', '빈', '서', '연', '현', '민', '수', '성', '원', '영', '지', '희', '정'];

  const generateName = (idx) => {
    const f = familyNames[idx % familyNames.length];
    const g1 = givenNames1[(idx >> 1) % givenNames1.length];
    const g2 = givenNames2[(idx >> 2) % givenNames2.length];
    return `${f}${g1}${g2}${idx}`;
  };

  const regionalSpecs = [
    {
      region: '화정',
      total: 198,
      // Sunday Daemyun
      sunHwajeong: { '7시30분': 3, '9시': 27, '12시': 51, '15시': 11, '20시': 9 },
      sunSangsu: { '12시': 5, '17시': 1, '20시': 1 },
      sunMoimbang: { '주엽': 2, '서교': 2 },
      sunOthers: { '협력교회': 25, '형제교회': 8, '위니크': 0, '국제': 0, '사랑': 0, '그외': 0 },
      // Wednesday Daemyun
      wed12: { '화정': 12, '서교': 1, '주엽': 0 },
      wed1930: { '화정': 69, '국제모임방': 0, '큰서교': 0, '상수': 3, '주엽': 0 },
      wed21: { '화정': 4 },
      wedOthers: { '협교': 10, '형제': 4, '기타': 4 }
    },
    {
      region: '대학',
      total: 127,
      // Sunday
      sunHwajeong: { '7시30분': 5, '9시': 5, '12시': 8, '15시': 12, '20시': 11 },
      sunSangsu: { '12시': 8, '17시': 0, '20시': 5 },
      sunMoimbang: { '주엽': 25, '서교': 2 },
      sunOthers: { '협력교회': 0, '형제교회': 0, '위니크': 0, '국제': 0, '사랑': 0, '그외': 6 },
      // Wednesday
      wed12: { '화정': 2, '서교': 3, '주엽': 13 },
      wed1930: { '화정': 8, '국제모임방': 0, '큰서교': 0, '상수': 1, '주엽': 40 },
      wed21: { '화정': 1 },
      wedOthers: { '협교': 0, '형제': 0, '기타': 7 }
    },
    {
      region: '상암',
      total: 189,
      // Sunday
      sunHwajeong: { '7시30분': 0, '9시': 4, '12시': 10, '15시': 6, '20시': 2 },
      sunSangsu: { '12시': 56, '17시': 10, '20시': 5 },
      sunMoimbang: { '주엽': 0, '서교': 0 },
      sunOthers: { '협력교회': 23, '형제교회': 11, '위니크': 0, '국제': 0, '사랑': 2, '그외': 0 },
      // Wednesday
      wed12: { '화정': 2, '서교': 4, '주엽': 0 },
      wed1930: { '화정': 7, '국제모임방': 0, '큰서교': 0, '상수': 46, '주엽': 0 },
      wed21: { '화정': 1 },
      wedOthers: { '협교': 7, '형제': 7, '기타': 9 }
    },
    {
      region: '명동',
      total: 182,
      // Sunday
      sunHwajeong: { '7시30분': 5, '9시': 7, '12시': 10, '15시': 6, '20시': 5 },
      sunSangsu: { '12시': 0, '17시': 8, '20시': 11 },
      sunMoimbang: { '주엽': 22, '서교': 34 },
      sunOthers: { '협력교회': 11, '형제교회': 14, '위니크': 0, '국제': 0, '사랑': 0, '그외': 2 },
      // Wednesday
      wed12: { '화정': 5, '서교': 0, '주엽': 0 },
      wed1930: { '화정': 10, '국제모임방': 0, '큰서교': 0, '상수': 5, '주엽': 17 },
      wed21: { '화정': 3 },
      wedOthers: { '협교': 2, '형제': 10, '기타': 1 }
    },
    {
      region: '새소망',
      total: 177,
      // Sunday
      sunHwajeong: { '7시30분': 3, '9시': 14, '12시': 45, '15시': 7, '20시': 9 },
      sunSangsu: { '12시': 2, '17시': 3, '20시': 3 },
      sunMoimbang: { '주엽': 0, '서교': 0 },
      sunOthers: { '협력교회': 13, '형제교회': 10, '위니크': 0, '국제': 0, '사랑': 0, '그외': 2 },
      // Wednesday
      wed12: { '화정': 9, '서교': 0, '주엽': 1 },
      wed1930: { '화정': 34, '국제모임방': 0, '큰서교': 0, '상수': 3, '주엽': 0 },
      wed21: { '화정': 2 },
      wedOthers: { '협교': 8, '형제': 8, '기타': 3 }
    },
    {
      region: '성군',
      total: 250,
      // Sunday
      sunHwajeong: { '7시30분': 7, '9시': 20, '12시': 10, '15시': 8, '20시': 12 },
      sunSangsu: { '12시': 0, '17시': 6, '20시': 2 },
      sunMoimbang: { '주엽': 43, '서교': 0 },
      sunOthers: { '협력교회': 25, '형제교회': 10, '위니크': 0, '국제': 0, '사랑': 2, '그외': 6 },
      // Wednesday
      wed12: { '화정': 4, '서교': 0, '주엽': 16 },
      wed1930: { '화정': 10, '국제모임방': 0, '큰서교': 0, '상수': 0, '주엽': 46 },
      wed21: { '화정': 4 },
      wedOthers: { '협교': 4, '형제': 11, '기타': 0 }
    },
    {
      region: '새신자',
      total: 163,
      // Sunday
      sunHwajeong: { '7시30분': 0, '9시': 3, '12시': 2, '15시': 1, '20시': 1 },
      sunSangsu: { '12시': 0, '17시': 14, '20시': 3 },
      sunMoimbang: { '주엽': 2, '서교': 53 },
      sunOthers: { '협력교회': 5, '형제교회': 3, '위니크': 0, '국제': 0, '사랑': 1, '그외': 16 },
      // Wednesday
      wed12: { '화정': 1, '서교': 0, '주엽': 6 },
      wed1930: { '화정': 1, '국제모임방': 0, '큰서교': 63, '상수': 0, '주엽': 3 },
      wed21: { '화정': 1 },
      wedOthers: { '협교': 4, '형제': 2, '기타': 18 }
    },
    {
      region: '승리',
      total: 361,
      // Sunday
      sunHwajeong: { '7시30분': 0, '9시': 0, '12시': 3, '15시': 1, '20시': 0 },
      sunSangsu: { '12시': 24, '17시': 2, '20시': 3 },
      sunMoimbang: { '주엽': 3, '서교': 0 },
      sunOthers: { '협력교회': 20, '형제교회': 2, '위니크': 19, '국제': 0, '사랑': 0, '그외': 3 },
      // Wednesday
      wed12: { '화정': 0, '서교': 0, '주엽': 0 },
      wed1930: { '화정': 2, '국제모임방': 0, '큰서교': 0, '상수': 2, '주엽': 3 },
      wed21: { '화정': 0 },
      wedOthers: { '협교': 0, '형제': 2, '기타': 1 }
    },
    {
      region: '평화',
      total: 293,
      // Sunday
      sunHwajeong: { '7시30분': 0, '9시': 0, '12시': 0, '15시': 0, '20시': 1 },
      sunSangsu: { '12시': 10, '17시': 1, '20시': 0 },
      sunMoimbang: { '주엽': 9, '서교': 0 },
      sunOthers: { '협력교회': 4, '형제교회': 0, '위니크': 0, '국제': 0, '사랑': 0, '그외': 9 },
      // Wednesday
      wed12: { '화정': 0, '서교': 0, '주엽': 0 },
      wed1930: { '화정': 2, '국제모임방': 0, '큰서교': 0, '상수': 0, '주엽': 11 },
      wed21: { '화정': 0 },
      wedOthers: { '협교': 0, '형제': 0, '기타': 0 }
    },
    {
      region: '국제',
      total: 58,
      // Sunday
      sunHwajeong: { '7시30분': 0, '9시': 0, '12시': 1, '15시': 0, '20시': 0 },
      sunSangsu: { '12시': 0, '17시': 0, '20시': 0 },
      sunMoimbang: { '주엽': 0, '서교': 0 },
      sunOthers: { '협력교회': 2, '형제교회': 0, '위니크': 0, '국제': 30, '사랑': 0, '그외': 0 },
      // Wednesday
      wed12: { '화정': 0, '서교': 0, '주엽': 0 },
      wed1930: { '화정': 0, '국제모임방': 31, '큰서교': 0, '상수': 0, '주엽': 0 },
      wed21: { '화정': 0 },
      wedOthers: { '협교': 0, '형제': 2, '기타': 0 }
    }
  ];

  let globalIdIdx = 1;

  regionalSpecs.forEach(spec => {
    // Generate Sunday classifications list
    let sunList = [];
    Object.entries(spec.sunHwajeong).forEach(([time, count]) => {
      for (let i = 0; i < count; i++) sunList.push(`화정-${time}`);
    });
    Object.entries(spec.sunSangsu).forEach(([time, count]) => {
      for (let i = 0; i < count; i++) sunList.push(`상수-${time}`);
    });
    Object.entries(spec.sunMoimbang).forEach(([loc, count]) => {
      for (let i = 0; i < count; i++) sunList.push(`${loc}-12시`);
    });
    Object.entries(spec.sunOthers).forEach(([cat, count]) => {
      for (let i = 0; i < count; i++) sunList.push(cat);
    });

    const sunDaemyunCount = sunList.length;
    const sunRemaining = spec.total - sunDaemyunCount;
    const sunGyulsubCount = Math.round(sunRemaining * 0.1);
    const sunMibogoCount = Math.max(0, sunRemaining - sunGyulsubCount);
    
    for (let i = 0; i < sunGyulsubCount; i++) sunList.push('결석');
    for (let i = 0; i < sunMibogoCount; i++) sunList.push('미보고');

    // Generate Wednesday classifications list
    let wedList = [];
    Object.entries(spec.wed12).forEach(([loc, count]) => {
      for (let i = 0; i < count; i++) wedList.push(`${loc}-12시`);
    });
    Object.entries(spec.wed1930).forEach(([loc, count]) => {
      for (let i = 0; i < count; i++) {
        let mapping = loc;
        if (loc === '국제모임방') mapping = '국제';
        else if (loc === '큰서교') mapping = '서교-19시30분'; // fits 서교
        wedList.push(`${mapping}-19시30분`);
      }
    });
    Object.entries(spec.wed21).forEach(([loc, count]) => {
      for (let i = 0; i < count; i++) wedList.push(`${loc}-21시`);
    });
    Object.entries(spec.wedOthers).forEach(([cat, count]) => {
      let mapping = '기타';
      if (cat === '협교') mapping = '협력교회';
      else if (cat === '형제') mapping = '형제교회';
      
      for (let i = 0; i < count; i++) wedList.push(mapping);
    });

    const wedDaemyunCount = wedList.length;
    const wedRemaining = spec.total - wedDaemyunCount;
    const wedGyulsubCount = Math.round(wedRemaining * 0.1);
    const wedMibogoCount = Math.max(0, wedRemaining - wedGyulsubCount);

    for (let i = 0; i < wedGyulsubCount; i++) wedList.push('결석');
    for (let i = 0; i < wedMibogoCount; i++) wedList.push('미보고');

    // Zip and write rows
    for (let i = 0; i < spec.total; i++) {
      const uniqueName = generateName(globalIdIdx);
      const sunClass = sunList[i] || '미보고';
      const wedClass = wedList[i] || '미보고';

      let regType = '총등';
      if (i % 25 === 0) regType = '입교';

      list.push({
        id: globalIdIdx,
        weekKey: '2026-07-3',
        지역: `${spec.region}지역`,
        이름: uniqueName,
        '등록구분( 총등,교등,입교)': regType,
        
        // Tuesday/Wednesday columns (삼일)
        '삼일사전(분류)': wedClass === '미보고' ? '미보고' : wedClass,
        '미확인/미보고 사유(사전)': wedClass === '결석' ? '개인사정' : '',
        '삼일실제(분류)': wedClass,
        '예배확인방법(실제)': wedClass === '미보고' ? '' : (wedClass === '결석' ? '결석' : '대면'),
        '미확인/미보고 사유(실제)': wedClass === '결석' ? '개인사정' : '',
        '인증분류(위아원)': '',
        
        // Friday/Saturday/Sunday columns (주일)
        '주일사전(분류)': sunClass === '미보고' ? '미보고' : sunClass,
        '미확인/미보고 사유(사전)_주일': sunClass === '결석' ? '개인사정' : '',
        '주일실제(분류)': sunClass,
        '예배확인방법(실제)_주일': sunClass === '미보고' ? '' : (sunClass === '결석' ? '결석' : '대면'),
        '미확인/미보고 사유(실제)_주일': sunClass === '결석' ? '개인사정' : '',
        '인증분류(위아원)_주일': '',
        '시험': ''
      });

      globalIdIdx++;
    }
  });

  return list;
};

export const getMockMembers = (records) => {
  return records.map(r => ({
    id: r.id,
    지역: r.지역,
    이름: r.이름,
    등록구분: r['등록구분( 총등,교등,입교)']
  }));
};
