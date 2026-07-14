import React, { useState, useEffect } from 'react';
import { X, Copy, Check } from 'lucide-react';

export default function ReportModal({ isOpen, onClose, records, selectedDate, currentUser, filterRegion }) {
  const [activeTab, setActiveTab] = useState('tue-pre'); // 'mon-alt', 'tue-pre', 'wed-act', 'thu-alt', 'fri-pre', 'sat-pre', 'sun-act'
  const [reportText, setReportText] = useState('');
  const [copied, setCopied] = useState(false);

  const tabs = [
    { id: 'mon-alt', label: '월요일 (월대체)', offset: 1, field: '주일실제(분류)', isPre: false, labelText: '월대체' },
    { id: 'tue-pre', label: '화요일 (삼일사전)', offset: 2, field: '삼일사전(분류)', isPre: true, labelText: '삼일사전' },
    { id: 'wed-act', label: '수요일 (삼일실제)', offset: 3, field: '삼일실제(분류)', isPre: false, labelText: '삼일실제' },
    { id: 'thu-alt', label: '목요일 (목대체)', offset: 4, field: '삼일실제(분류)', isPre: false, labelText: '목대체' },
    { id: 'fri-pre', label: '금요일 (주일사전)', offset: 5, field: '주일사전(분류)', isPre: true, labelText: '주일사전' },
    { id: 'sat-pre', label: '토요일 (주일사전)', offset: 6, field: '주일사전(분류)', isPre: true, labelText: '주일사전' },
    { id: 'sun-act', label: '일요일 (주일실제)', offset: 0, field: '주일실제(분류)', isPre: false, labelText: '주일실제' }
  ];

  const getFormattedDate = (baseDateStr, offsetDays) => {
    if (!baseDateStr) return '260712(일)';
    const d = new Date(baseDateStr);
    const dayOfWeek = d.getDay();
    const sunday = new Date(d);
    sunday.setDate(d.getDate() - dayOfWeek); // set to Sunday
    
    const targetDate = new Date(sunday);
    targetDate.setDate(sunday.getDate() + offsetDays);
    
    const yy = String(targetDate.getFullYear()).slice(-2);
    const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
    const dd = String(targetDate.getDate()).padStart(2, '0');
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const dayChar = weekdays[targetDate.getDay()];
    
    return `${yy}${mm}${dd}(${dayChar})`;
  };

  const generateReport = () => {
    const currentTab = tabs.find(t => t.id === activeTab);
    if (!currentTab) return '';

    const field = currentTab.field;
    const isPre = currentTab.isPre;
    const isSundayTab = ['mon-alt', 'fri-pre', 'sat-pre', 'sun-act'].includes(activeTab);
    
    const reasonField = isSundayTab 
      ? (isPre ? '미확인/미보고 사유(사전)_주일' : '미확인/미보고 사유(실제)_주일') 
      : (isPre ? '미확인/미보고 사유(사전)' : '미확인/미보고 사유(실제)');

    // Filter active region (e.g. '상암지역' or '전체' -> '청년회')
    const activeRegion = filterRegion || (currentUser && currentUser.role === 'region' ? currentUser.region : '전체');
    
    // Normalize region for robust filtering
    const normalizeRegion = (name) => (name || '').replace('지역', '').trim();
    
    const regionalRecords = activeRegion === '전체'
      ? records
      : records.filter(r => normalizeRegion(r.지역) === normalizeRegion(activeRegion));
      
    const targetRegion = activeRegion === '전체' ? '청년회' : activeRegion;

    const chongGyoRecords = regionalRecords.filter(r => !(r['등록구분( 총등,교등,입교)'] || '').includes('입교'));
    const ipgyoRecords = regionalRecords.filter(r => (r['등록구분( 총등,교등,입교)'] || '').includes('입교'));

    const totalCount = regionalRecords.length;
    
    // Count target (목표)
    const targetCount = regionalRecords.filter(r => {
      const val = (r[isSundayTab ? '주일사전(분류)' : '삼일사전(분류)'] || '').trim();
      return val && val !== '미보고' && val !== '미확인' && !val.includes('결석');
    }).length;

    // Count actual attendance (출석)
    const attendanceCount = regionalRecords.filter(r => {
      const val = (r[field] || '').trim();
      return val && val !== '미보고' && val !== '미확인' && !val.includes('결석');
    }).length;

    // Helper to compile counts for a group (chongGyo or ipgyo)
    const getWorshipStats = (groupRecords) => {
      const total = groupRecords.length;
      
      const attended = groupRecords.filter(r => {
        const val = (r[field] || '').trim();
        return val && val !== '미보고' && val !== '미확인' && !val.includes('결석');
      }).length;

      // 1. 대면 (Face-to-face)
      // Sunday 화정성전
      const sun_hwajeong_730 = groupRecords.filter(r => {
        const val = (r[field] || '').trim();
        return val === '화정-7시30분' || val === '화정-7시 30분' || val === '화정-07:30';
      }).length;
      const sun_hwajeong_9 = groupRecords.filter(r => {
        const val = (r[field] || '').trim();
        return val === '화정-9시' || val === '화정-9' || val === '화정-09:00';
      }).length;
      const sun_hwajeong_12 = groupRecords.filter(r => {
        const val = (r[field] || '').trim();
        return val === '화정-12시' || val === '화정-12' || val === '화정-12:00';
      }).length;
      const sun_hwajeong_15 = groupRecords.filter(r => {
        const val = (r[field] || '').trim();
        return val === '화정-15시' || val === '화정-15' || val === '화정-15:00';
      }).length;
      const sun_hwajeong_20 = groupRecords.filter(r => {
        const val = (r[field] || '').trim();
        return val === '화정-20시' || val === '화정-20' || val === '화정-20:00';
      }).length;

      const sun_hwajeong_total = sun_hwajeong_730 + sun_hwajeong_9 + sun_hwajeong_12 + sun_hwajeong_15 + sun_hwajeong_20;

      // Sunday 모임방
      const sun_sangsu_12 = groupRecords.filter(r => {
        const val = (r[field] || '').trim();
        return val === '상수-12시';
      }).length;
      const sun_seogyo_12 = groupRecords.filter(r => {
        const val = (r[field] || '').trim();
        return val === '서교-12시' || val === '서교-12';
      }).length;
      const sun_sangsu_17 = groupRecords.filter(r => {
        const val = (r[field] || '').trim();
        return val === '상수-17시';
      }).length;
      const sun_sangsu_20 = groupRecords.filter(r => {
        const val = (r[field] || '').trim();
        return val === '상수-20시';
      }).length;

      const sun_juyeop_12 = groupRecords.filter(r => {
        const val = (r[field] || '').trim();
        return val === '주엽-12시' || val === '주엽-12';
      }).length;

      const sun_other_moimbang = groupRecords.filter(r => {
        const val = (r[field] || '').trim();
        if (!val || val === '미보고' || val === '미확인' || val.includes('결석') || val.includes('줌') || val.includes('대체') || val.includes('형제') || val.includes('협력') || val.includes('센터')) return false;
        if (val.startsWith('화정-') || val.startsWith('상수-') || val.startsWith('서교-') || val.startsWith('홍대-') || val.startsWith('주엽-')) return false;
        return true;
      });

      const sun_other_moimbang_count = sun_other_moimbang.length;
      const sun_other_moimbang_label = sun_other_moimbang.length > 0 
        ? `${sun_other_moimbang[0].이름}(${sun_other_moimbang[0][field]})` 
        : '장소';

      const sun_moimbang_total = sun_juyeop_12 + sun_seogyo_12 + sun_other_moimbang_count;

      // Wednesday 화정성전
      const wed_hwajeong_12 = groupRecords.filter(r => {
        const val = (r[field] || '').trim();
        return val === '화정-12시' || val === '화정-12';
      }).length;
      const wed_hwajeong_1930 = groupRecords.filter(r => {
        const val = (r[field] || '').trim();
        return val === '화정-19시30분' || val === '화정-19시 30분' || val === '화정-7시30분';
      }).length;
      const wed_hwajeong_total = wed_hwajeong_12 + wed_hwajeong_1930;

      // Wednesday 모임방
      const wed_hongdae_12 = groupRecords.filter(r => {
        const val = (r[field] || '').trim();
        return val === '서교-12시' || val === '홍대-12시';
      }).length;
      const wed_hongdae_1930 = groupRecords.filter(r => {
        const val = (r[field] || '').trim();
        return val === '서교-19시30분' || val === '홍대-19시30분' || val === '서교-19시 30분';
      }).length;

      const wed_juyeop_12 = groupRecords.filter(r => {
        const val = (r[field] || '').trim();
        return val === '주엽-12시';
      }).length;
      const wed_juyeop_1930 = groupRecords.filter(r => {
        const val = (r[field] || '').trim();
        return val === '주엽-19시30분' || val === '주엽-19시 30분';
      }).length;

      const wed_sangsu_12 = groupRecords.filter(r => {
        const val = (r[field] || '').trim();
        return val === '상수-12시';
      }).length;
      const wed_sangsu_1930 = groupRecords.filter(r => {
        const val = (r[field] || '').trim();
        return val === '상수-19시30분' || val === '상수-19시 30분';
      }).length;

      const wed_other_moimbang = groupRecords.filter(r => {
        const val = (r[field] || '').trim();
        if (!val || val === '미보고' || val === '미확인' || val.includes('결석') || val.includes('줌') || val.includes('대체') || val.includes('형제') || val.includes('협력') || val.includes('센터')) return false;
        if (val.includes('화정-') || val.includes('서교-') || val.includes('홍대-') || val.includes('주엽-') || val.includes('상수-')) return false;
        return true;
      });
      const wed_other_moimbang_count = wed_other_moimbang.length;
      const wed_other_moimbang_label = wed_other_moimbang.length > 0 
        ? `${wed_other_moimbang[0].이름}(${wed_other_moimbang[0][field]})` 
        : '장소';

      const wed_moimbang_total = wed_hongdae_12 + wed_hongdae_1930 + wed_juyeop_12 + wed_juyeop_1930 + wed_sangsu_12 + wed_sangsu_1930 + wed_other_moimbang_count;

      // 기타 (형제교회, 협력교회, 센터수강)
      const hyungje = groupRecords.filter(r => {
        const val = (r[field] || '').trim();
        return val.includes('형제');
      }).length;
      const hupryuk = groupRecords.filter(r => {
        const val = (r[field] || '').trim();
        return val.includes('협력') || val.includes('협교');
      }).length;
      const center = groupRecords.filter(r => {
        const val = (r[field] || '').trim();
        return val.includes('센터') || val.includes('수강');
      }).length;

      const daemyun_total = isSundayTab 
        ? (sun_hwajeong_total + sun_sangsu_12 + sun_sangsu_17 + sun_sangsu_20 + sun_moimbang_total + hyungje + hupryuk + center)
        : (wed_hwajeong_total + wed_moimbang_total + hyungje + hupryuk + center);

      // 2. 줌 (Zoom)
      const zoom_total = groupRecords.filter(r => {
        const val = (r[field] || '').toLowerCase();
        return val.includes('줌') || val.includes('zoom');
      }).length;

      const zoom_on = groupRecords.filter(r => {
        const val = (r[field] || '').toLowerCase();
        return val.includes('줌') && (val.includes('on') || (!val.includes('off') && !val.includes('오프')));
      }).length;

      const zoom_off = groupRecords.filter(r => {
        const val = (r[field] || '').toLowerCase();
        return val.includes('줌') && (val.includes('off') || val.includes('오프'));
      }).length;

      // 3. 대체 (Substitute)
      const daeche_total = groupRecords.filter(r => {
        const val = (r[field] || '').trim();
        return val.includes('대체');
      }).length;

      const daeche_dangil = groupRecords.filter(r => {
        const val = (r[field] || '').trim();
        return val.includes('대체') && !val.includes('월') && !val.includes('목');
      }).length;

      const daeche_wol = groupRecords.filter(r => {
        const val = (r[field] || '').trim();
        return val.includes('월');
      }).length;

      const daeche_mok = groupRecords.filter(r => {
        const val = (r[field] || '').trim();
        return val.includes('목');
      }).length;

      // 4. 결석 (Absent)
      const gyulsub_records = groupRecords.filter(r => (r[field] || '').includes('결석'));
      const gyulsub_total = gyulsub_records.length;
      
      const gyulsub_janggi = gyulsub_records.filter(r => (r[reasonField] || '').includes('장기')).length;
      const gyulsub_yunsuk = gyulsub_records.filter(r => (r[reasonField] || '').includes('연속')).length;
      const gyulsub_ilhoisung = gyulsub_total - gyulsub_janggi - gyulsub_yunsuk;

      // ‼️ 전주 대비 신규 결석
      const new_absentees_list = gyulsub_records.slice(0, 5).map(r => r.이름);
      const new_absentees_names = new_absentees_list.length > 0 ? new_absentees_list.join(', ') : '없음';

      return {
        total,
        attended,
        daemyun_total,
        
        // Sunday 화정성전
        sun_hwajeong_total,
        sun_hwajeong_730,
        sun_hwajeong_9,
        sun_hwajeong_12,
        sun_hwajeong_15,
        sun_hwajeong_20,
        
        // Sunday 모임방
        sun_moimbang_total,
        sun_sangsu_12,
        sun_seogyo_12,
        sun_sangsu_17,
        sun_sangsu_20,
        sun_juyeop_12,
        sun_other_moimbang_count,
        sun_other_moimbang_label,

        // Wednesday 화정성전
        wed_hwajeong_total,
        wed_hwajeong_12,
        wed_hwajeong_1930,

        // Wednesday 모임방
        wed_moimbang_total,
        wed_hongdae_12,
        wed_hongdae_1930,
        wed_juyeop_12,
        wed_juyeop_1930,
        wed_sangsu_12,
        wed_sangsu_1930,
        wed_other_moimbang_count,
        wed_other_moimbang_label,

        // 기타
        hyungje,
        hupryuk,
        center,

        // 줌
        zoom_total,
        zoom_on,
        zoom_off,

        // 대체
        daeche_total,
        daeche_dangil,
        daeche_wol,
        daeche_mok,

        // 결석
        gyulsub_total,
        gyulsub_ilhoisung,
        gyulsub_yunsuk,
        gyulsub_janggi,
        new_absentees_names
      };
    };

    const cg = getWorshipStats(chongGyoRecords);
    const ip = getWorshipStats(ipgyoRecords);

    // Build template
    let text = `발신 청년서기 \n수신 지역서기 \n\n`;

    if (isSundayTab) {
      text += `[주일예배 텍스트 최종 양식] \n\n`;
      text += `${targetRegion}\n\n`;
      text += `▪️출결재적(총교입) ${totalCount}명\n`;
      text += `- 목표 ${targetCount}명\n`;
      text += `- 출석 ${attendanceCount}명\n\n`;

      // 1. 총교등자
      text += `▪️총교등자 ${cg.total}명/출석 ${cg.attended}명\n`;
      text += `1. 대면 ${cg.daemyun_total}명\n`;
      text += `- 화정성전 ${cg.sun_hwajeong_total}명\n`;
      text += `*7시30분 ${cg.sun_hwajeong_730} \n`;
      text += `*9시 ${cg.sun_hwajeong_9}\n`;
      text += `*12시 ${cg.sun_hwajeong_12}\n`;
      text += `*15시 ${cg.sun_hwajeong_15}\n`;
      text += `*20시 ${cg.sun_hwajeong_20}\n\n`;
      text += `- 상수 ${cg.sun_sangsu_12 + cg.sun_sangsu_17 + cg.sun_sangsu_20}명\n`;
      text += `- 12시 ${cg.sun_sangsu_12} \n`;
      text += `- 17시 ${cg.sun_sangsu_17} \n`;
      text += `- 20시 ${cg.sun_sangsu_20} \n\n`;
      text += `- 모임방 ${cg.sun_moimbang_total}명\n`;
      text += `*주엽 \n`;
      text += `- 12시 ${cg.sun_juyeop_12}\n\n`;
      text += `*서교 \n`;
      text += `- 12시 ${cg.sun_seogyo_12}\n\n`;
      text += `*그외 모임방 \n`;
      text += `- ${cg.sun_other_moimbang_label} ${cg.sun_other_moimbang_count} \n\n`;
      text += `- 기타 \n`;
      text += `*형제교회 ${cg.hyungje}명\n`;
      text += `*협력교회 ${cg.hupryuk}명\n`;
      text += `*센터수강 ${cg.center}명 \n\n`;
      text += `2. 줌 ${cg.zoom_total}명\n`;
      text += `- 화면 on : ${cg.zoom_on} \n`;
      text += `- 화면 off : ${cg.zoom_off} \n\n`;
      text += `3. 대체 ${cg.daeche_total}명\n`;
      text += `- 당일 ${cg.daeche_dangil} \n`;
      text += `- 월대체 ${cg.daeche_wol} \n\n`;
      text += `4. 결석 ${cg.gyulsub_total}명\n`;
      text += `- 일회성 ${cg.gyulsub_ilhoisung} \n`;
      text += `- 연속 ${cg.gyulsub_yunsuk} \n`;
      text += `- 장기 ${cg.gyulsub_janggi} \n\n`;
      text += `‼️전주 대비 신규 결석 ${cg.gyulsub_total}명 \n`;
      text += `${cg.new_absentees_names}\n\n`;

      text += `➖➖➖➖➖➖\n`;

      // 2. 입교자
      text += `▪️입교자 ${ip.total}명/출석 ${ip.attended}명\n`;
      text += `1. 대면 ${ip.daemyun_total}명\n`;
      text += `- 화정성전 ${ip.sun_hwajeong_total}명\n`;
      text += `*7시30분 ${ip.sun_hwajeong_730} \n`;
      text += `*9시 ${ip.sun_hwajeong_9}\n`;
      text += `*12시 ${ip.sun_hwajeong_12}\n`;
      text += `*15시 ${ip.sun_hwajeong_15}\n`;
      text += `*20시 ${ip.sun_hwajeong_20}\n\n`;
      text += `- 상수 ${ip.sun_sangsu_12 + ip.sun_sangsu_17 + ip.sun_sangsu_20}명\n`;
      text += `- 12시 ${ip.sun_sangsu_12} \n`;
      text += `- 17시 ${ip.sun_sangsu_17} \n`;
      text += `- 20시 ${ip.sun_sangsu_20} \n\n`;
      text += `- 모임방 ${ip.sun_moimbang_total}명\n`;
      text += `*주엽 \n`;
      text += `- 12시 ${ip.sun_juyeop_12}\n\n`;
      text += `*서교 \n`;
      text += `- 12시 ${ip.sun_seogyo_12}\n\n`;
      text += `*그외 모임방 \n`;
      text += `- ${ip.sun_other_moimbang_label} ${ip.sun_other_moimbang_count} \n\n`;
      text += `- 기타 \n`;
      text += `*형제교회 ${ip.hyungje}명\n`;
      text += `*협력교회 ${ip.hupryuk}명\n`;
      text += `*센터수강 ${ip.center}명 \n\n`;
      text += `2. 줌 ${ip.zoom_total}명\n`;
      text += `- 화면 on : ${ip.zoom_on} \n`;
      text += `- 화면 off : ${ip.zoom_off} \n\n`;
      text += `3. 대체 ${ip.daeche_total}명\n`;
      text += `- 당일 ${ip.daeche_dangil} \n`;
      text += `- 월대체 ${ip.daeche_wol} \n\n`;
      text += `4. 결석 ${ip.gyulsub_total}명\n`;
      text += `- 일회성 ${ip.gyulsub_ilhoisung} \n`;
      text += `- 연속 ${ip.gyulsub_yunsuk} \n`;
      text += `- 장기 ${ip.gyulsub_janggi} \n\n`;
      text += `‼️전주 대비 신규 결석 ${ip.gyulsub_total}명 \n`;
      text += `${ip.new_absentees_names}`;
      
    } else {
      // Wednesday worship
      text += `#삼일예배 #텍스트보고 \n\n`;
      text += `${targetRegion}\n\n`;
      text += `▪️출결재적(총교입) ${totalCount}명\n`;
      text += `- 목표 ${targetCount}명\n`;
      text += `- 출석 ${attendanceCount}명\n\n`;

      // 1. 총교등자
      text += `▪️총교등자 ${cg.total}명/출석 ${cg.attended}명\n`;
      text += `1. 대면 ${cg.daemyun_total}명\n`;
      text += `- 화정성전 ${cg.wed_hwajeong_total}명\n`;
      text += `*12시 ${cg.wed_hwajeong_12}\n`;
      text += `*19시30분 ${cg.wed_hwajeong_1930} \n\n`;
      text += `- 모임방 ${cg.wed_moimbang_total}명\n`;
      text += `*서교 \n`;
      text += `- 12시 ${cg.wed_hongdae_12} \n`;
      text += `- 19시 30분 ${cg.wed_hongdae_1930} \n\n`;
      text += `*주엽 \n`;
      text += `- 12시 ${cg.wed_juyeop_12} \n`;
      text += `- 19시 30분 ${cg.wed_juyeop_1930} \n\n`;
      text += `*상수  \n`;
      text += `- 12시 ${cg.wed_sangsu_12} \n`;
      text += `- 19시 30분 ${cg.wed_sangsu_1930} \n\n`;
      text += `*그외 모임방 \n`;
      text += `- ${cg.wed_other_moimbang_label} ${cg.wed_other_moimbang_count} \n\n`;
      text += `- 기타 \n`;
      text += `*형제교회 ${cg.hyungje}명\n`;
      text += `*협력교회 ${cg.hupryuk}명\n`;
      text += `*센터수강 ${cg.center}명 \n\n`;
      text += `2. 줌 ${cg.zoom_total}명\n\n`;
      text += `3. 대체 ${cg.daeche_total}명\n`;
      text += `- 당일 ${cg.daeche_dangil} \n`;
      text += `- 목 대체 ${cg.daeche_mok} \n\n`;
      text += `4. 결석 ${cg.gyulsub_total}명\n`;
      text += `- 일회성 ${cg.gyulsub_ilhoisung} \n`;
      text += `- 장기 ${cg.gyulsub_janggi} \n\n`;
      text += `‼️전주 대비 신규 결석 ${cg.gyulsub_total}명 \n`;
      text += `${cg.new_absentees_names}\n\n`;

      text += `➖➖➖➖➖➖\n`;

      // 2. 입교자
      text += `▪️입교자 ${ip.total}명/출석 ${ip.attended}명\n`;
      text += `1. 대면 ${ip.daemyun_total}명\n`;
      text += `- 화정성전 ${ip.wed_hwajeong_total}명\n`;
      text += `*12시 ${ip.wed_hwajeong_12}\n`;
      text += `*19시30분 ${ip.wed_hwajeong_1930} \n\n`;
      text += `- 모임방 ${ip.wed_moimbang_total}명\n`;
      text += `*서교 \n`;
      text += `- 12시 ${ip.wed_hongdae_12} \n`;
      text += `- 19시 30분 ${ip.wed_hongdae_1930} \n\n`;
      text += `*주엽 \n`;
      text += `- 12시 ${ip.wed_juyeop_12} \n`;
      text += `- 19시 30분 ${ip.wed_juyeop_1930} \n\n`;
      text += `*상수  \n`;
      text += `- 12시 ${ip.wed_sangsu_12} \n`;
      text += `- 19시 30분 ${ip.wed_sangsu_1930} \n\n`;
      text += `*그외 모임방 \n`;
      text += `- ${ip.wed_other_moimbang_label} ${ip.wed_other_moimbang_count} \n\n`;
      text += `- 기타 \n`;
      text += `*형제교회 ${ip.hyungje}명\n`;
      text += `*협력교회 ${ip.hupryuk}명\n`;
      text += `*센터수강 ${ip.center}명 \n\n`;
      text += `2. 줌 ${ip.zoom_total}명\n\n`;
      text += `3. 대체 ${ip.daeche_total}명\n`;
      text += `- 당일 ${ip.daeche_dangil} \n`;
      text += `- 목 대체 ${ip.daeche_mok} \n\n`;
      text += `4. 결석 ${ip.gyulsub_total}명\n`;
      text += `- 일회성 ${ip.gyulsub_ilhoisung} \n`;
      text += `- 장기 ${ip.gyulsub_janggi} \n\n`;
      text += `‼️전주 대비 신규 결석 ${ip.gyulsub_total}명 \n`;
      text += `${ip.new_absentees_names}`;
    }

    return text;
  };

  useEffect(() => {
    if (isOpen) {
      setReportText(generateReport());
      setCopied(false);
    }
  }, [isOpen, activeTab, records, selectedDate]);

  const handleCopy = () => {
    navigator.clipboard.writeText(reportText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%' }}>
        <div className="modal-header">
          <div>
            <span className="badge badge-blue" style={{ marginBottom: '6px' }}>출결관리 보고서</span>
            <h3 className="modal-title">결과 텍스트 자동 생성</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Tab selection */}
        <div className="report-tabs" style={{ display: 'flex', overflowX: 'auto', gap: '8px', paddingBottom: '8px' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`report-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              style={{ whiteSpace: 'nowrap' }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="modal-body" style={{ padding: '20px' }}>
          <div style={{ marginBottom: '12px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            ⚠️ 텍스트 상자 내의 내용을 직접 수정할 수 있습니다. 수정한 뒤 복사 버튼을 누르세요.
          </div>
          <textarea
            className="report-text-area"
            value={reportText}
            onChange={e => setReportText(e.target.value)}
            style={{ width: '100%', height: '300px', fontFamily: 'monospace', fontSize: '0.9rem' }}
          />
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            닫기
          </button>
          <button className="btn btn-primary" onClick={handleCopy} style={{ minWidth: '130px' }}>
            {copied ? (
              <>
                <Check size={16} />
                복사 완료
              </>
            ) : (
              <>
                <Copy size={16} />
                클립보드 복사
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
