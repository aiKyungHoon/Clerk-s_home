import React, { useState, useRef } from 'react';
import { Upload, Download, Copy, Search, Trash2, Plus, FileSpreadsheet } from 'lucide-react';
import XLSX from 'xlsx-js-style';
import ReportModal from './ReportModal';
import TextUploadModal from './TextUploadModal';
import { getMockRecords } from '../mockData';

export default function AttendanceTab({ 
  records, 
  allRecords,
  onUpdateRecords, 
  onBulkUpload, 
  selectedDate, 
  currentUser,
  selectedYear,
  selectedMonth,
  selectedWeek,
  setSelectedYear,
  setSelectedMonth,
  setSelectedWeek
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRegion, setFilterRegion] = useState(() => {
    return currentUser.role === 'super' ? '전체' : currentUser.region;
  });
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isTextUploadOpen, setIsTextUploadOpen] = useState(false);
  const [activeWorshipTab, setActiveWorshipTab] = useState('sunday'); // 'sunday' or 'wednesday'
  const [activeWorshipType, setActiveWorshipType] = useState('actual'); // 'actual' or 'planned'

  const worshipField = activeWorshipTab === 'sunday'
    ? (activeWorshipType === 'planned' ? '주일사전(분류)' : '주일실제(분류)')
    : (activeWorshipType === 'planned' ? '삼일사전(분류)' : '삼일실제(분류)');
  const fileInputRef = useRef(null);

  const uniqueRegions = ['전체', '화정지역', '대학지역', '상암지역', '명동지역', '새소망지역', '성군지역', '새신자지역', '승리지역', '평화지역', '국제지역'];

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const columns = [
    { key: '지역', label: '지역' },
    { key: '이름', label: '이름' },
    { key: '등록구분( 총등,교등,입교)', label: '등록구분' },
    { key: '삼일사전(분류)', label: '삼일사전' },
    { key: '미확인/미보고 사유(사전)', label: '삼일사전사유' },
    { key: '삼일실제(분류)', label: '삼일실제' },
    { key: '예배확인방법(실제)', label: '삼일예배확인' },
    { key: '미확인/미보고 사유(실제)', label: '삼일실제사유' },
    { key: '인증분류(위아원)', label: '삼일인증' },
    { key: '주일사전(분류)', label: '주일사전' },
    { key: '미확인/미보고 사유(사전)_주일', label: '주일사전사유' },
    { key: '주일실제(분류)', label: '주일실제' },
    { key: '예배확인방법(실제)_주일', label: '주일예배확인' },
    { key: '미확인/미보고 사유(실제)_주일', label: '주일실제사유' },
    { key: '인증분류(위아원)_주일', label: '주일인증' },
    { key: '시험', label: '시험' }
  ];

  const excelHeaders = [
    '지역', '이름', '등록구분( 총등,교등,입교)', '삼일사전(분류)', '미확인/미보고 사유(사전)',
    '삼일실제(분류)', '예배확인방법(실제)', '미확인/미보고 사유(실제)', '인증분류(위아원)',
    '주일사전(분류)', '미확인/미보고 사유(사전)_주일', '주일실제(분류)', '예배확인방법(실제)_주일',
    '미확인/미보고 사유(실제)_주일', '인증분류(위아원)_주일', '시험'
  ];

  // Handle Excel Upload
  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        if (rawRows.length < 2) {
          alert('데이터가 없는 엑셀 파일이거나 형식이 잘못되었습니다.');
          return;
        }

        const parsedRecords = [];
        for (let i = 1; i < rawRows.length; i++) {
          const row = rawRows[i];
          if (row.length === 0 || !row[1]) continue;

          let regionVal = String(row[0] || '').trim();
          // Auto-append "지역" to prevent unmatched filter display issue
          if (regionVal && !regionVal.endsWith('지역')) {
            regionVal = regionVal + '지역';
          }
          if (!regionVal) regionVal = '상암지역';

          parsedRecords.push({
            id: Date.now() + i,
            지역: regionVal,
            이름: String(row[1] || '').trim(),
            '등록구분( 총등,교등,입교)': String(row[2] || '총등').trim(),
            '삼일사전(분류)': String(row[3] || '미보고').trim(),
            '미확인/미보고 사유(사전)': String(row[4] || '').trim(),
            '삼일실제(분류)': String(row[5] || '미보고').trim(),
            '예배확인방법(실제)': String(row[6] || '').trim(),
            '미확인/미보고 사유(실제)': String(row[7] || '').trim(),
            '인증분류(위아원)': String(row[8] || '').trim(),
            '주일사전(분류)': String(row[9] || '미보고').trim(),
            '미확인/미보고 사유(사전)_주일': String(row[10] || '').trim(),
            '주일실제(분류)': String(row[11] || '미보고').trim(),
            '예배확인방법(실제)_주일': String(row[12] || '').trim(),
            '미확인/미보고 사유(실제)_주일': String(row[13] || '').trim(),
            '인증분류(위아원)_주일': String(row[14] || '').trim(),
            '시험': String(row[15] || '').trim()
          });
        }

        onBulkUpload(parsedRecords);
        setCurrentPage(1);
        alert(`성공적으로 ${parsedRecords.length}명의 출결 데이터를 업로드했습니다.`);
      } catch (err) {
        alert('엑셀 파일을 파싱하는 데 실패했습니다. 올바른 양식인지 확인해 주세요.');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = ''; // reset
  };

  // Sample template download (headers only)
  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([excelHeaders]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '출결양식지');
    XLSX.writeFile(wb, 'Clerks_Home_출결양식지.xlsx');
  };

  // Export current active records to Excel
  const handleExportData = () => {
    const isSunday = activeWorshipTab === 'sunday';
    const typeLabel = activeWorshipType === 'planned' ? '사전 현황' : '실제 현황';
    const titleText = `${isSunday ? '주일예배' : '삼일예배'} · ${typeLabel}`;

    const wb = XLSX.utils.book_new();
    
    // Sheet 1: 예배현황집계 (Visual Breakdown Table)
    let wsData = [];
    let merges = [];

    if (isSunday) {
      // Row 0: Title
      wsData.push([titleText]);
      merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 20 } });

      // Row 1: Group Headers
      wsData.push([
        '지역', '출결재적', '대면예배', '', '화정성전', '', '', '', '', '상수', '', '', '모임방', '', '기타', '', '', '', '', '', ''
      ]);
      merges.push({ s: { r: 1, c: 2 }, e: { r: 1, c: 3 } }); // 대면예배
      merges.push({ s: { r: 1, c: 4 }, e: { r: 1, c: 8 } }); // 화정성전
      merges.push({ s: { r: 1, c: 9 }, e: { r: 1, c: 11 } }); // 상수
      merges.push({ s: { r: 1, c: 12 }, e: { r: 1, c: 13 } }); // 모임방
      merges.push({ s: { r: 1, c: 14 }, e: { r: 1, c: 20 } }); // 기타

      // Row 2: Sub Headers
      wsData.push([
        '', '', '인원', '비율', '7시30분', '9시', '12시', '15시', '20시', '12시', '17시', '20시', '주엽 12시', '서교 12시', '협교', '형제', '위니크', '국제', '사랑', '그외', '줌'
      ]);
      
      merges.push({ s: { r: 1, c: 0 }, e: { r: 2, c: 0 } });
      merges.push({ s: { r: 1, c: 1 }, e: { r: 2, c: 1 } });

      // Row 3+: Regions
      sunRowsData.forEach(row => {
        const ratePct = row.total > 0 ? `${((row.daemyunTotal / row.total) * 100).toFixed(1)}%` : '0.0%';
        wsData.push([
          row.region,
          row.total,
          row.daemyunTotal,
          ratePct,
          row.hwajeong[0] || 0,
          row.hwajeong[1] || 0,
          row.hwajeong[2] || 0,
          row.hwajeong[3] || 0,
          row.hwajeong[4] || 0,
          row.sangsu[0] || 0,
          row.sangsu[1] || 0,
          row.sangsu[2] || 0,
          row.moimbang[0] || 0,
          row.moimbang[1] || 0,
          row.others[0] || 0,
          row.others[1] || 0,
          row.others[2] || 0,
          row.others[3] || 0,
          row.others[4] || 0,
          row.others[5] || 0,
          row.others[6] || 0
        ]);
      });

      // Total Row
      const totalRate = sunTotalSum > 0 ? `${((sunDaemyunSum / sunTotalSum) * 100).toFixed(1)}%` : '0.0%';
      wsData.push([
        '청년회',
        sunTotalSum,
        sunDaemyunSum,
        totalRate,
        ...sunHwajeongSums,
        ...sunSangsuSums,
        ...sunMoimbangSums,
        ...sunOthersSums
      ]);

    } else {
      // Row 0: Title
      wsData.push([titleText]);
      merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 16 } });

      // Row 1: Group Headers
      wsData.push([
        '시간 예배장소', '출결재적', '총합', '', '12시', '', '', '19시 30분', '', '', '', '', '21시', '기타', '', '', ''
      ]);
      merges.push({ s: { r: 1, c: 2 }, e: { r: 1, c: 3 } }); // 총합
      merges.push({ s: { r: 1, c: 4 }, e: { r: 1, c: 6 } }); // 12시
      merges.push({ s: { r: 1, c: 7 }, e: { r: 1, c: 11 } }); // 19시 30분
      merges.push({ s: { r: 1, c: 13 }, e: { r: 1, c: 16 } }); // 기타

      // Row 2: Sub Headers
      wsData.push([
        '', '', '인원', '비율', '화정', '서교', '주엽', '화정', '국제', '서교', '상수', '주엽', '화정', '협교', '형제', '기타', '줌'
      ]);
      merges.push({ s: { r: 1, c: 0 }, e: { r: 2, c: 0 } });
      merges.push({ s: { r: 1, c: 1 }, e: { r: 2, c: 1 } });
      merges.push({ s: { r: 1, c: 12 }, e: { r: 2, c: 12 } });

      // Row 3+: Regions
      wedRowsData.forEach(row => {
        const ratePct = row.total > 0 ? `${((row.daemyunTotal / row.total) * 100).toFixed(1)}%` : '0.0%';
        wsData.push([
          row.region,
          row.total,
          row.daemyunTotal,
          ratePct,
          row.w12[0] || 0,
          row.w12[1] || 0,
          row.w12[2] || 0,
          row.w1930[0] || 0,
          row.w1930[1] || 0,
          row.w1930[2] || 0,
          row.w1930[3] || 0,
          row.w1930[4] || 0,
          row.w21[0] || 0,
          row.wothers[0] || 0,
          row.wothers[1] || 0,
          row.wothers[2] || 0,
          row.wothers[3] || 0
        ]);
      });

      // Total Row
      const totalRate = wedTotalSum > 0 ? `${((wedDaemyunSum / wedTotalSum) * 100).toFixed(1)}%` : '0.0%';
      wsData.push([
        '청년회',
        wedTotalSum,
        wedDaemyunSum,
        totalRate,
        ...wed12Sums,
        ...wed1930Sums,
        ...wed21Sums,
        ...wedOthersSums
      ]);
    }

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!merges'] = merges;
    XLSX.utils.book_append_sheet(wb, ws, '예배현황집계');

    // Sheet 2: 개인별출결명단 (Raw Individual Data)
    const dataToExport = records.filter(r => !r._aggregate).map(r => [
      r.지역, r.이름, r['등록구분( 총등,교등,입교)'],
      r['삼일사전(분류)'], r['미확인/미보고 사유(사전)'],
      r['삼일실제(분류)'], r['예배확인방법(실제)'], r['미확인/미보고 사유(실제)'], r['인증분류(위아원)'],
      r['주일사전(분류)'], r['미확인/미보고 사유(사전)_주일'],
      r['주일실제(분류)'], r['예배확인방법(실제)_주일'], r['미확인/미보고 사유(실제)_주일'], r['인증분류(위아원)_주일'],
      r.시험
    ]);
    const wsRaw = XLSX.utils.aoa_to_sheet([excelHeaders, ...dataToExport]);
    XLSX.utils.book_append_sheet(wb, wsRaw, '개인별출결명단');

    XLSX.writeFile(wb, `Clerks_Home_${selectedYear}년_${selectedMonth}월_${selectedWeek}주차_${titleText.replace(' · ', '_')}.xlsx`);
  };

  const handleExportBreakdown = () => {
    const isSunday = activeWorshipTab === 'sunday';
    const typeLabel = activeWorshipType === 'planned' ? '사전 현황' : '실제 현황';
    const titleText = `${isSunday ? '주일예배' : '삼일예배'} · ${typeLabel}`;

    const createCell = (val, styles = {}) => {
      return {
        v: val,
        t: typeof val === 'number' ? 'n' : 's',
        s: {
          alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
          font: { name: 'Malgun Gothic', sz: 10 },
          border: {
            top: { style: 'thin', color: { rgb: 'E2E8F0' } },
            bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
            left: { style: 'thin', color: { rgb: 'E2E8F0' } },
            right: { style: 'thin', color: { rgb: 'E2E8F0' } }
          },
          ...styles
        }
      };
    };

    const wb = XLSX.utils.book_new();
    const ws = {};
    const merges = [];

    // Title Row style (Row 0)
    const titleStyle = {
      fill: { fgColor: { rgb: '166534' } },
      font: { name: 'Malgun Gothic', sz: 12, bold: true, color: { rgb: 'FFFFFF' } },
      border: {
        top: { style: 'thin', color: { rgb: '166534' } },
        bottom: { style: 'thin', color: { rgb: '166534' } },
        left: { style: 'thin', color: { rgb: '166534' } },
        right: { style: 'thin', color: { rgb: '166534' } }
      }
    };

    // Group Header style (Row 1)
    const groupHeaderStyle = {
      fill: { fgColor: { rgb: 'F8FAFC' } },
      font: { name: 'Malgun Gothic', sz: 10, bold: true, color: { rgb: '334155' } },
      border: {
        top: { style: 'thin', color: { rgb: 'CBD5E1' } },
        bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
        left: { style: 'thin', color: { rgb: 'CBD5E1' } },
        right: { style: 'thin', color: { rgb: 'CBD5E1' } }
      }
    };

    // Sub Header style (Row 2)
    const subHeaderStyle = {
      fill: { fgColor: { rgb: 'F8FAFC' } },
      font: { name: 'Malgun Gothic', sz: 9, bold: true, color: { rgb: '475569' } },
      border: {
        top: { style: 'thin', color: { rgb: 'CBD5E1' } },
        bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
        left: { style: 'thin', color: { rgb: 'CBD5E1' } },
        right: { style: 'thin', color: { rgb: 'CBD5E1' } }
      }
    };

    // Region Row label style
    const regionNameStyle = {
      fill: { fgColor: { rgb: 'F8FAFC' } },
      font: { name: 'Malgun Gothic', sz: 10, bold: true, color: { rgb: '0F172A' } }
    };

    // Peak Cell Style
    const maxCellStyle = {
      fill: { fgColor: { rgb: 'FEF08A' } }, // Yellow highlight
      font: { name: 'Malgun Gothic', sz: 10, bold: true, color: { rgb: '854D0E' } }
    };

    // Normal Cell Style
    const normalCellStyle = {
      font: { name: 'Malgun Gothic', sz: 10 }
    };

    // Red font for 12:00 Hwajeong
    const redHourCellStyle = {
      font: { name: 'Malgun Gothic', sz: 10, color: { rgb: 'B91C1C' }, bold: true }
    };

    // Red font max cell
    const redHourMaxCellStyle = {
      fill: { fgColor: { rgb: 'FEF08A' } },
      font: { name: 'Malgun Gothic', sz: 10, color: { rgb: 'B91C1C' }, bold: true }
    };

    // Total Row style
    const totalRowStyle = {
      fill: { fgColor: { rgb: 'DCFCE7' } },
      font: { name: 'Malgun Gothic', sz: 10, bold: true, color: { rgb: '166534' } },
      border: {
        top: { style: 'medium', color: { rgb: '86EFAC' } },
        bottom: { style: 'medium', color: { rgb: '86EFAC' } },
        left: { style: 'thin', color: { rgb: 'E2E8F0' } },
        right: { style: 'thin', color: { rgb: 'E2E8F0' } }
      }
    };

    const totalRowRedStyle = {
      fill: { fgColor: { rgb: 'DCFCE7' } },
      font: { name: 'Malgun Gothic', sz: 10, bold: true, color: { rgb: 'B91C1C' } },
      border: {
        top: { style: 'medium', color: { rgb: '86EFAC' } },
        bottom: { style: 'medium', color: { rgb: '86EFAC' } },
        left: { style: 'thin', color: { rgb: 'E2E8F0' } },
        right: { style: 'thin', color: { rgb: 'E2E8F0' } }
      }
    };

    const maxCols = isSunday ? 20 : 17;

    // Helper to write to worksheet
    const writeCell = (r, c, val, styles = {}) => {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      ws[cellRef] = createCell(val, styles);
    };

    if (isSunday) {
      // Row 0: Title
      writeCell(0, 0, titleText, titleStyle);
      for (let col = 1; col < maxCols; col++) {
        writeCell(0, col, '', titleStyle);
      }
      merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: maxCols - 1 } });

      // Row 1 & 2 Headers
      // Region
      writeCell(1, 0, '지역', groupHeaderStyle);
      writeCell(2, 0, '', groupHeaderStyle);
      merges.push({ s: { r: 1, c: 0 }, e: { r: 2, c: 0 } });

      // Total members
      writeCell(1, 1, '출결재적', groupHeaderStyle);
      writeCell(2, 1, '', groupHeaderStyle);
      merges.push({ s: { r: 1, c: 1 }, e: { r: 2, c: 1 } });

      // Face-to-face
      writeCell(1, 2, '대면예배', groupHeaderStyle);
      writeCell(1, 3, '', groupHeaderStyle);
      merges.push({ s: { r: 1, c: 2 }, e: { r: 1, c: 3 } });

      // Hwajeong
      writeCell(1, 4, '화정성전', groupHeaderStyle);
      for (let c = 5; c <= 8; c++) writeCell(1, c, '', groupHeaderStyle);
      merges.push({ s: { r: 1, c: 4 }, e: { r: 1, c: 8 } });

      // Sangsu
      writeCell(1, 9, '상수', groupHeaderStyle);
      for (let c = 10; c <= 11; c++) writeCell(1, c, '', groupHeaderStyle);
      merges.push({ s: { r: 1, c: 9 }, e: { r: 1, c: 11 } });

      // Moimbang
      writeCell(1, 12, '모임방', groupHeaderStyle);
      writeCell(1, 13, '', groupHeaderStyle);
      merges.push({ s: { r: 1, c: 12 }, e: { r: 1, c: 13 } });

      // Others
      writeCell(1, 14, '기타', groupHeaderStyle);
      for (let c = 15; c <= 20; c++) writeCell(1, c, '', groupHeaderStyle);
      merges.push({ s: { r: 1, c: 14 }, e: { r: 1, c: 20 } });

      // Row 2 Headers
      writeCell(2, 2, '인원', subHeaderStyle);
      writeCell(2, 3, '비율', subHeaderStyle);
      writeCell(2, 4, '7시30분', subHeaderStyle);
      writeCell(2, 5, '9시', subHeaderStyle);
      writeCell(2, 6, '12시', subHeaderStyle);
      writeCell(2, 7, '15시', subHeaderStyle);
      writeCell(2, 8, '20시', subHeaderStyle);
      writeCell(2, 9, '12시', subHeaderStyle);
      writeCell(2, 10, '17시', subHeaderStyle);
      writeCell(2, 11, '20시', subHeaderStyle);
      writeCell(2, 12, '주엽 12시', subHeaderStyle);
      writeCell(2, 13, '서교 12시', subHeaderStyle);
      writeCell(2, 14, '협교', subHeaderStyle);
      writeCell(2, 15, '형제', subHeaderStyle);
      writeCell(2, 16, '위니크', subHeaderStyle);
      writeCell(2, 17, '국제', subHeaderStyle);
      writeCell(2, 18, '사랑', subHeaderStyle);
      writeCell(2, 19, '그외', subHeaderStyle);
      writeCell(2, 20, '줌', subHeaderStyle);

      // Data Rows
      let currentRowIdx = 3;
      sunRowsData.forEach(row => {
        const ratePct = row.total > 0 ? `${((row.daemyunTotal / row.total) * 100).toFixed(1)}%` : '0.0%';
        let rateColor = 'F1F5F9';
        let rateTextColor = '334155';
        let rateBold = false;
        const rateVal = parseFloat(ratePct);
        if (rateVal >= 70) {
          rateColor = 'DCFCE7';
          rateTextColor = '166534';
          rateBold = true;
        } else if (rateVal <= 30) {
          rateColor = 'FFE4E6';
          rateTextColor = '991B1B';
          rateBold = true;
        }

        const rateStyle = {
          fill: { fgColor: { rgb: rateColor } },
          font: { name: 'Malgun Gothic', sz: 10, bold: rateBold, color: { rgb: rateTextColor } }
        };

        const getCellStyles = (val, max, isRedHour = false) => {
          const isMax = val > 0 && (val >= 14 || val === max);
          if (isRedHour) {
            return isMax ? redHourMaxCellStyle : redHourCellStyle;
          }
          return isMax ? maxCellStyle : normalCellStyle;
        };

        writeCell(currentRowIdx, 0, row.region, regionNameStyle);
        writeCell(currentRowIdx, 1, row.total, normalCellStyle);
        writeCell(currentRowIdx, 2, row.daemyunTotal, { font: { name: 'Malgun Gothic', sz: 10, bold: true } });
        writeCell(currentRowIdx, 3, ratePct, rateStyle);
        writeCell(currentRowIdx, 4, row.hwajeong[0] || '', getCellStyles(row.hwajeong[0], row.pointerMax));
        writeCell(currentRowIdx, 5, row.hwajeong[1] || '', getCellStyles(row.hwajeong[1], row.pointerMax));
        writeCell(currentRowIdx, 6, row.hwajeong[2] || '', getCellStyles(row.hwajeong[2], row.pointerMax, true)); // 12시 화정 (Red text)
        writeCell(currentRowIdx, 7, row.hwajeong[3] || '', getCellStyles(row.hwajeong[3], row.pointerMax));
        writeCell(currentRowIdx, 8, row.hwajeong[4] || '', getCellStyles(row.hwajeong[4], row.pointerMax));
        writeCell(currentRowIdx, 9, row.sangsu[0] || '', getCellStyles(row.sangsu[0], row.pointerMax));
        writeCell(currentRowIdx, 10, row.sangsu[1] || '', getCellStyles(row.sangsu[1], row.pointerMax));
        writeCell(currentRowIdx, 11, row.sangsu[2] || '', getCellStyles(row.sangsu[2], row.pointerMax));
        writeCell(currentRowIdx, 12, row.moimbang[0] || '', getCellStyles(row.moimbang[0], row.pointerMax));
        writeCell(currentRowIdx, 13, row.moimbang[1] || '', getCellStyles(row.moimbang[1], row.pointerMax));
        writeCell(currentRowIdx, 14, row.others[0] || '', getCellStyles(row.others[0], row.pointerMax));
        writeCell(currentRowIdx, 15, row.others[1] || '', getCellStyles(row.others[1], row.pointerMax));
        writeCell(currentRowIdx, 16, row.others[2] || '', getCellStyles(row.others[2], row.pointerMax));
        writeCell(currentRowIdx, 17, row.others[3] || '', getCellStyles(row.others[3], row.pointerMax));
        writeCell(currentRowIdx, 18, row.others[4] || '', getCellStyles(row.others[4], row.pointerMax));
        writeCell(currentRowIdx, 19, row.others[5] || '', getCellStyles(row.others[5], row.pointerMax));
        writeCell(currentRowIdx, 20, row.others[6] || '', getCellStyles(row.others[6], row.pointerMax));

        currentRowIdx++;
      });

      // Total Row
      const totalRate = sunTotalSum > 0 ? `${((sunDaemyunSum / sunTotalSum) * 100).toFixed(1)}%` : '0.0%';
      writeCell(currentRowIdx, 0, '청년회', totalRowStyle);
      writeCell(currentRowIdx, 1, sunTotalSum, totalRowStyle);
      writeCell(currentRowIdx, 2, sunDaemyunSum, totalRowStyle);
      writeCell(currentRowIdx, 3, totalRate, totalRowStyle);
      writeCell(currentRowIdx, 4, sunHwajeongSums[0], totalRowStyle);
      writeCell(currentRowIdx, 5, sunHwajeongSums[1], totalRowStyle);
      writeCell(currentRowIdx, 6, sunHwajeongSums[2], totalRowRedStyle); // 12시 화정 (Red text)
      writeCell(currentRowIdx, 7, sunHwajeongSums[3], totalRowStyle);
      writeCell(currentRowIdx, 8, sunHwajeongSums[4], totalRowStyle);
      writeCell(currentRowIdx, 9, sunSangsuSums[0], totalRowStyle);
      writeCell(currentRowIdx, 10, sunSangsuSums[1], totalRowStyle);
      writeCell(currentRowIdx, 11, sunSangsuSums[2], totalRowStyle);
      writeCell(currentRowIdx, 12, sunMoimbangSums[0], totalRowStyle);
      writeCell(currentRowIdx, 13, sunMoimbangSums[1], totalRowStyle);
      writeCell(currentRowIdx, 14, sunOthersSums[0], totalRowStyle);
      writeCell(currentRowIdx, 15, sunOthersSums[1], totalRowStyle);
      writeCell(currentRowIdx, 16, sunOthersSums[2], totalRowStyle);
      writeCell(currentRowIdx, 17, sunOthersSums[3], totalRowStyle);
      writeCell(currentRowIdx, 18, sunOthersSums[4], totalRowStyle);
      writeCell(currentRowIdx, 19, sunOthersSums[5], totalRowStyle);
      writeCell(currentRowIdx, 20, sunOthersSums[6], totalRowStyle);

    } else {
      // Wednesday Worship
      writeCell(0, 0, titleText, titleStyle);
      for (let col = 1; col < maxCols; col++) {
        writeCell(0, col, '', titleStyle);
      }
      merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: maxCols - 1 } });

      // Row 1 & 2 Headers
      // Region
      writeCell(1, 0, '시간 예배장소', groupHeaderStyle);
      writeCell(2, 0, '', groupHeaderStyle);
      merges.push({ s: { r: 1, c: 0 }, e: { r: 2, c: 0 } });

      // Total members
      writeCell(1, 1, '출결재적', groupHeaderStyle);
      writeCell(2, 1, '', groupHeaderStyle);
      merges.push({ s: { r: 1, c: 1 }, e: { r: 2, c: 1 } });

      // Total sum
      writeCell(1, 2, '총합', groupHeaderStyle);
      writeCell(1, 3, '', groupHeaderStyle);
      merges.push({ s: { r: 1, c: 2 }, e: { r: 1, c: 3 } });

      // 12:00
      writeCell(1, 4, '12시', groupHeaderStyle);
      writeCell(1, 5, '', groupHeaderStyle);
      writeCell(1, 6, '', groupHeaderStyle);
      merges.push({ s: { r: 1, c: 4 }, e: { r: 1, c: 6 } });

      // 19:30
      writeCell(1, 7, '19시 30분', groupHeaderStyle);
      for (let c = 8; c <= 11; c++) writeCell(1, c, '', groupHeaderStyle);
      merges.push({ s: { r: 1, c: 7 }, e: { r: 1, c: 11 } });

      // 21:00
      writeCell(1, 12, '21시', groupHeaderStyle);
      writeCell(2, 12, '', groupHeaderStyle);
      merges.push({ s: { r: 1, c: 12 }, e: { r: 2, c: 12 } });

      // Others
      writeCell(1, 13, '기타', groupHeaderStyle);
      writeCell(1, 14, '', groupHeaderStyle);
      writeCell(1, 15, '', groupHeaderStyle);
      writeCell(1, 16, '', groupHeaderStyle);
      merges.push({ s: { r: 1, c: 13 }, e: { r: 1, c: 16 } });

      // Row 2 Headers
      writeCell(2, 2, '인원', subHeaderStyle);
      writeCell(2, 3, '비율', subHeaderStyle);
      writeCell(2, 4, '화정', subHeaderStyle);
      writeCell(2, 5, '서교', subHeaderStyle);
      writeCell(2, 6, '주엽', subHeaderStyle);
      writeCell(2, 7, '화정', subHeaderStyle);
      writeCell(2, 8, '국제', subHeaderStyle);
      writeCell(2, 9, '서교', subHeaderStyle);
      writeCell(2, 10, '상수', subHeaderStyle);
      writeCell(2, 11, '주엽', subHeaderStyle);
      writeCell(2, 12, '화정', subHeaderStyle);
      writeCell(2, 13, '협교', subHeaderStyle);
      writeCell(2, 14, '형제', subHeaderStyle);
      writeCell(2, 15, '기타', subHeaderStyle);
      writeCell(2, 16, '줌', subHeaderStyle);

      // Data Rows
      let currentRowIdx = 3;
      wedRowsData.forEach(row => {
        const ratePct = row.total > 0 ? `${((row.daemyunTotal / row.total) * 100).toFixed(1)}%` : '0.0%';
        let rateColor = 'F1F5F9';
        let rateTextColor = '334155';
        let rateBold = false;
        const rateVal = parseFloat(ratePct);
        if (rateVal >= 70) {
          rateColor = 'DCFCE7';
          rateTextColor = '166534';
          rateBold = true;
        } else if (rateVal <= 30) {
          rateColor = 'FFE4E6';
          rateTextColor = '991B1B';
          rateBold = true;
        }

        const rateStyle = {
          fill: { fgColor: { rgb: rateColor } },
          font: { name: 'Malgun Gothic', sz: 10, bold: rateBold, color: { rgb: rateTextColor } }
        };

        const allRowVals = [...row.w12, ...row.w1930, ...row.w21, ...row.wothers];
        const maxVal = Math.max(...allRowVals.filter(v => v > 0));
        const getCellStyles = (val) => {
          const isMax = val > 0 && (val >= 14 || val === maxVal);
          return isMax ? maxCellStyle : normalCellStyle;
        };

        writeCell(currentRowIdx, 0, row.region, regionNameStyle);
        writeCell(currentRowIdx, 1, row.total, normalCellStyle);
        writeCell(currentRowIdx, 2, row.daemyunTotal, { font: { name: 'Malgun Gothic', sz: 10, bold: true } });
        writeCell(currentRowIdx, 3, ratePct, rateStyle);
        writeCell(currentRowIdx, 4, row.w12[0] || '', getCellStyles(row.w12[0]));
        writeCell(currentRowIdx, 5, row.w12[1] || '', getCellStyles(row.w12[1]));
        writeCell(currentRowIdx, 6, row.w12[2] || '', getCellStyles(row.w12[2]));
        writeCell(currentRowIdx, 7, row.w1930[0] || '', getCellStyles(row.w1930[0]));
        writeCell(currentRowIdx, 8, row.w1930[1] || '', getCellStyles(row.w1930[1]));
        writeCell(currentRowIdx, 9, row.w1930[2] || '', getCellStyles(row.w1930[2]));
        writeCell(currentRowIdx, 10, row.w1930[3] || '', getCellStyles(row.w1930[3]));
        writeCell(currentRowIdx, 11, row.w1930[4] || '', getCellStyles(row.w1930[4]));
        writeCell(currentRowIdx, 12, row.w21[0] || '', getCellStyles(row.w21[0]));
        writeCell(currentRowIdx, 13, row.wothers[0] || '', getCellStyles(row.wothers[0]));
        writeCell(currentRowIdx, 14, row.wothers[1] || '', getCellStyles(row.wothers[1]));
        writeCell(currentRowIdx, 15, row.wothers[2] || '', getCellStyles(row.wothers[2]));
        writeCell(currentRowIdx, 16, row.wothers[3] || '', getCellStyles(row.wothers[3]));

        currentRowIdx++;
      });

      // Total Row
      const totalRate = wedTotalSum > 0 ? `${((wedDaemyunSum / wedTotalSum) * 100).toFixed(1)}%` : '0.0%';
      writeCell(currentRowIdx, 0, '청년회', totalRowStyle);
      writeCell(currentRowIdx, 1, wedTotalSum, totalRowStyle);
      writeCell(currentRowIdx, 2, wedDaemyunSum, totalRowStyle);
      writeCell(currentRowIdx, 3, totalRate, totalRowStyle);
      writeCell(currentRowIdx, 4, wed12Sums[0], totalRowStyle);
      writeCell(currentRowIdx, 5, wed12Sums[1], totalRowStyle);
      writeCell(currentRowIdx, 6, wed12Sums[2], totalRowStyle);
      writeCell(currentRowIdx, 7, wed1930Sums[0], totalRowStyle);
      writeCell(currentRowIdx, 8, wed1930Sums[1], totalRowStyle);
      writeCell(currentRowIdx, 9, wed1930Sums[2], totalRowStyle);
      writeCell(currentRowIdx, 10, wed1930Sums[3], totalRowStyle);
      writeCell(currentRowIdx, 11, wed1930Sums[4], totalRowStyle);
      writeCell(currentRowIdx, 12, wed21Sums[0], totalRowStyle);
      writeCell(currentRowIdx, 13, wedOthersSums[0], totalRowStyle);
      writeCell(currentRowIdx, 14, wedOthersSums[1], totalRowStyle);
      writeCell(currentRowIdx, 15, wedOthersSums[2], totalRowStyle);
      writeCell(currentRowIdx, 16, wedOthersSums[3], totalRowStyle);
    }

    // Set Sheet Options
    const range = { s: { r: 0, c: 0 }, e: { r: 13, c: maxCols - 1 } };
    ws['!ref'] = XLSX.utils.encode_range(range);
    ws['!merges'] = merges;
    ws['!views'] = [{ showGridLines: true }];

    // Column widths
    ws['!cols'] = Array(maxCols).fill({ wch: 10 });
    ws['!cols'][0] = { wch: 14 }; // Region column wider

    XLSX.utils.book_append_sheet(wb, ws, '예배현황집계');

    // Also let's append Sheet 2: 개인별출결명단 (Raw Data list)
    const dataToExport = records.filter(r => !r._aggregate).map(r => [
      r.지역, r.이름, r['등록구분( 총등,교등,입교)'],
      r['삼일사전(분류)'], r['미확인/미보고 사유(사전)'],
      r['삼일실제(분류)'], r['예배확인방법(실제)'], r['미확인/미보고 사유(실제)'], r['인증분류(위아원)'],
      r['주일사전(분류)'], r['미확인/미보고 사유(사전)_주일'],
      r['주일실제(분류)'], r['예배확인방법(실제)_주일'], r['미확인/미보고 사유(실제)_주일'], r['인증분류(위아원)_주일'],
      r.시험
    ]);
    const wsRaw = XLSX.utils.aoa_to_sheet([excelHeaders, ...dataToExport]);
    wsRaw['!views'] = [{ showGridLines: true }];
    XLSX.utils.book_append_sheet(wb, wsRaw, '개인별출결명단');

    XLSX.writeFile(wb, `Clerks_Home_${selectedYear}년_${selectedMonth}월_${selectedWeek}주차_${titleText.replace(' · ', '_')}_현황표.xlsx`);
  };

  // Inline Cell Edits
  const handleCellChange = (id, key, value) => {
    const updated = records.map(r => r.id === id ? { ...r, [key]: value } : r);
    onUpdateRecords(updated);
  };

  // CRUD Actions
  const handleAddRow = () => {
    const defaultNewRow = {
      id: Date.now(),
      지역: currentUser.role === 'region' ? currentUser.region : '상암지역',
      이름: '',
      '등록구분( 총등,교등,입교)': '총등',
      '삼일사전(분류)': '미보고',
      '미확인/미보고 사유(사전)': '',
      '삼일실제(분류)': '미보고',
      '예배확인방법(실제)': '',
      '미확인/미보고 사유(실제)': '',
      '인증분류(위아원)': '',
      '주일사전(분류)': '미보고',
      '미확인/미보고 사유(사전)_주일': '',
      '주일실제(분류)': '미보고',
      '예배확인방법(실제)_주일': '',
      '미확인/미보고 사유(실제)_주일': '',
      '인증분류(위아원)_주일': '',
      '시험': ''
    };
    onUpdateRecords([defaultNewRow, ...records]);
    setCurrentPage(1);
  };

  const handleDeleteRow = (id) => {
    const row = records.find(r => r.id === id);
    if (window.confirm(`정말로 ${row?.이름 || '지정되지 않은'} 신도의 행을 출결표에서 삭제하시겠습니까?`)) {
      const updated = records.filter(r => r.id !== id);
      onUpdateRecords(updated);
    }
  };

  const handleLoadSampleData = () => {
    if (window.confirm('테스트용 샘플 데이터(1,998명)를 로드하시겠습니까?\n기존에 입력한 현재 주차 데이터는 덮어씌워집니다.')) {
      onBulkUpload(getMockRecords());
    }
  };

  const handleApplyTextReport = (parsedData) => {
    const { region: parsedRegion, hasSunday, hasWednesday, sunCg, sunIp, wedCg, wedIp, parsedPeople } = parsedData;
    const region = currentUser.role === 'region' ? currentUser.region : parsedRegion;

    const normalizeRegion = (name) => (name || '').replace('지역', '').trim();
    const activeWeekKey = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${selectedWeek}`;

    const activeWeekOtherRegionRecords = records.filter(r => 
      normalizeRegion(r.지역) !== normalizeRegion(region)
    );

    const regionWeekRecords = records.filter(r =>
      normalizeRegion(r.지역) === normalizeRegion(region)
    );

    const realRecords = regionWeekRecords.filter(r => !r._aggregate);
    const dummyRecords = regionWeekRecords.filter(r => r._aggregate);

    const buildSlots = (stats, isSunday) => {
      const slots = [];
      if (!stats) return slots;

      // Add Hwajeong
      Object.keys(stats.daemyun.hwajeong).forEach(time => {
        const count = stats.daemyun.hwajeong[time];
        for (let i = 0; i < count; i++) {
          slots.push({ field: isSunday ? '주일실제(분류)' : '삼일실제(분류)', value: `화정-${time}` });
        }
      });

      // Add Moimbang
      Object.keys(stats.daemyun.moimbang).forEach(loc => {
        Object.keys(stats.daemyun.moimbang[loc]).forEach(time => {
          const count = stats.daemyun.moimbang[loc][time];
          let locName = loc;
          if (locName === '홍대/상수') locName = '서교';
          if (locName === '홍대') locName = '서교';
          for (let i = 0; i < count; i++) {
            slots.push({ field: isSunday ? '주일실제(분류)' : '삼일실제(분류)', value: `${locName}-${time}` });
          }
        });
      });

      // Add others
      for (let i = 0; i < stats.daemyun.hyungje; i++) {
        slots.push({ field: isSunday ? '주일실제(분류)' : '삼일실제(분류)', value: '형제교회' });
      }
      for (let i = 0; i < stats.daemyun.hupryuk; i++) {
        slots.push({ field: isSunday ? '주일실제(분류)' : '삼일실제(분류)', value: '협력교회' });
      }
      for (let i = 0; i < stats.daemyun.center; i++) {
        slots.push({ field: isSunday ? '주일실제(분류)' : '삼일실제(분류)', value: '센터수강' });
      }
      for (let i = 0; i < (stats.daemyun.saesinjaru || 0); i++) {
        slots.push({ field: isSunday ? '주일실제(분류)' : '삼일실제(분류)', value: '새신자교육' });
      }
      for (let i = 0; i < (stats.daemyun.sunyuwol || 0); i++) {
        slots.push({ field: isSunday ? '주일실제(분류)' : '삼일실제(분류)', value: '선유월예배' });
      }
      for (let i = 0; i < (stats.daemyun.jamunhoe || 0); i++) {
        slots.push({ field: isSunday ? '주일실제(분류)' : '삼일실제(분류)', value: '자문회예배' });
      }
      for (let i = 0; i < (stats.daemyun.sarang || 0); i++) {
        slots.push({ field: isSunday ? '주일실제(분류)' : '삼일실제(분류)', value: '사랑예배' });
      }

      // Add Zoom
      if (isSunday) {
        for (let i = 0; i < stats.zoom.on; i++) {
          slots.push({ field: '주일실제(분류)', value: '줌' });
        }
        for (let i = 0; i < stats.zoom.off; i++) {
          slots.push({ field: '주일실제(분류)', value: '줌' });
        }
        if (stats.zoom.total > slots.filter(s => s.value === '줌').length) {
          const diff = stats.zoom.total - slots.filter(s => s.value === '줌').length;
          for (let i = 0; i < diff; i++) {
            slots.push({ field: '주일실제(분류)', value: '줌' });
          }
        }
      } else {
        for (let i = 0; i < stats.zoom.total; i++) {
          slots.push({ field: '삼일실제(분류)', value: '줌' });
        }
      }

      // Add Daeche
      if (isSunday) {
        for (let i = 0; i < stats.daeche.dangil; i++) {
          slots.push({ field: '주일실제(분류)', value: '당일대체' });
        }
        for (let i = 0; i < stats.daeche.wol; i++) {
          slots.push({ field: '주일실제(분류)', value: '월대체' });
        }
      } else {
        for (let i = 0; i < stats.daeche.dangil; i++) {
          slots.push({ field: '삼일실제(분류)', value: '당일대체' });
        }
        for (let i = 0; i < stats.daeche.mok; i++) {
          slots.push({ field: '삼일실제(분류)', value: '목대체' });
        }
      }

      // Add Gyulsub
      const gyulsubReasonField = isSunday ? '미확인/미보고 사유(실제)_주일' : '미확인/미보고 사유(실제)';
      for (let i = 0; i < stats.gyulsub.ilhoisung; i++) {
        slots.push({ field: isSunday ? '주일실제(분류)' : '삼일실제(분류)', value: '결석', reasonField: gyulsubReasonField, reasonValue: '일회성' });
      }
      for (let i = 0; i < stats.gyulsub.yunsuk; i++) {
        slots.push({ field: isSunday ? '주일실제(분류)' : '삼일실제(분류)', value: '결석', reasonField: gyulsubReasonField, reasonValue: '연속' });
      }
      for (let i = 0; i < stats.gyulsub.janggi; i++) {
        slots.push({ field: isSunday ? '주일실제(분류)' : '삼일실제(분류)', value: '결석', reasonField: gyulsubReasonField, reasonValue: '장기' });
      }

      return slots;
    };

    const sunCgSlots = buildSlots(sunCg, true);
    const sunIpSlots = buildSlots(sunIp, true);
    const wedCgSlots = buildSlots(wedCg, false);
    const wedIpSlots = buildSlots(wedIp, false);

    // Group incoming parsed people
    const parsedByName = {};
    if (parsedPeople && parsedPeople.length > 0) {
      parsedPeople.forEach(p => {
        if (!parsedByName[p.name]) {
          parsedByName[p.name] = {
            name: p.name,
            group: p.group,
            updates: {}
          };
        }
        parsedByName[p.name].updates[p.field] = p.value;
        if (p.field === '주일실제(분류)') {
          parsedByName[p.name].updates['주일사전(분류)'] = p.value;
        } else if (p.field === '삼일실제(분류)') {
          parsedByName[p.name].updates['삼일사전(분류)'] = p.value;
        }
        if (p.reason) {
          if (p.field.includes('주일')) {
            parsedByName[p.name].updates['미확인/미보고 사유(실제)_주일'] = p.reason;
            parsedByName[p.name].updates['미확인/미보고 사유(사전)_주일'] = p.reason;
          } else {
            parsedByName[p.name].updates['미확인/미보고 사유(실제)'] = p.reason;
            parsedByName[p.name].updates['미확인/미보고 사유(사전)'] = p.reason;
          }
        }
      });
    }

    // Map existing real records
    const realMap = {};
    realRecords.forEach(r => {
      realMap[r.이름] = { ...r };
    });

    // Update real records with new parsed values
    Object.values(parsedByName).forEach(p => {
      if (realMap[p.name]) {
        realMap[p.name] = {
          ...realMap[p.name],
          ...p.updates
        };
      } else {
        realMap[p.name] = {
          id: `${activeWeekKey}-${region}-${p.group}-${p.name}-${Date.now()}`,
          weekKey: activeWeekKey,
          지역: region,
          이름: p.name,
          '등록구분( 총등,교등,입교)': p.group === 'ip' ? '입교' : '총등',
          '삼일사전(분류)': '미보고',
          '미확인/미보고 사유(사전)': '',
          '삼일실제(분류)': '미보고',
          '예배확인방법(실제)': '',
          '미확인/미보고 사유(실제)': '',
          '인증분류(위아원)': '',
          '주일사전(분류)': '미보고',
          '미확인/미보고 사유(사전)_주일': '',
          '주일실제(분류)': '미보고',
          '예배확인방법(실제)_주일': '',
          '미확인/미보고 사유(실제)_주일': '',
          '인증분류(위아원)_주일': '',
          '시험': '',
          ...p.updates
        };
      }
    });

    // Reset fields for the day being imported if members are missing from the report
    if (hasSunday) {
      Object.keys(realMap).forEach(name => {
        if (!parsedByName[name]) {
          realMap[name]['주일사전(분류)'] = '미보고';
          realMap[name]['주일실제(분류)'] = '미보고';
          realMap[name]['미확인/미보고 사유(사전)_주일'] = '';
          realMap[name]['미확인/미보고 사유(실제)_주일'] = '';
          realMap[name]['예배확인방법(실제)_주일'] = '';
          realMap[name]['인증분류(위아원)_주일'] = '';
        }
      });
    }
    if (hasWednesday) {
      Object.keys(realMap).forEach(name => {
        if (!parsedByName[name]) {
          realMap[name]['삼일사전(분류)'] = '미보고';
          realMap[name]['삼일실제(분류)'] = '미보고';
          realMap[name]['미확인/미보고 사유(사전)'] = '';
          realMap[name]['미확인/미보고 사유(실제)'] = '';
          realMap[name]['예배확인방법(실제)'] = '';
          realMap[name]['인증분류(위아원)'] = '';
        }
      });
    }

    // Process and match dummy slots
    // 1. Sunday slots
    let unmatchedSunCgSlots = [];
    let unmatchedSunIpSlots = [];
    if (hasSunday) {
      unmatchedSunCgSlots = [...sunCgSlots];
      unmatchedSunIpSlots = [...sunIpSlots];
      Object.values(parsedByName).forEach(p => {
        const sunVal = p.updates['주일실제(분류)'];
        if (sunVal && sunVal !== '미보고') {
          const slotsList = p.group === 'ip' ? unmatchedSunIpSlots : unmatchedSunCgSlots;
          const idx = slotsList.findIndex(s => s.value === sunVal);
          if (idx !== -1) slotsList.splice(idx, 1);
        }
      });
    } else {
      dummyRecords.forEach(dummy => {
        const group = dummy['등록구분( 총등,교등,입교)'] === '입교' ? 'ip' : 'cg';
        const val = dummy['주일실제(분류)'];
        if (val && val !== '미보고') {
          const slotsList = group === 'ip' ? unmatchedSunIpSlots : unmatchedSunCgSlots;
          slotsList.push({
            value: val,
            reasonValue: dummy['미확인/미보고 사유(실제)_주일'] || ''
          });
        }
      });
    }

    // 2. Wednesday slots
    let unmatchedWedCgSlots = [];
    let unmatchedWedIpSlots = [];
    if (hasWednesday) {
      unmatchedWedCgSlots = [...wedCgSlots];
      unmatchedWedIpSlots = [...wedIpSlots];
      Object.values(parsedByName).forEach(p => {
        const wedVal = p.updates['삼일실제(분류)'];
        if (wedVal && wedVal !== '미보고') {
          const slotsList = p.group === 'ip' ? unmatchedWedIpSlots : unmatchedWedCgSlots;
          const idx = slotsList.findIndex(s => s.value === wedVal);
          if (idx !== -1) slotsList.splice(idx, 1);
        }
      });
    } else {
      dummyRecords.forEach(dummy => {
        const group = dummy['등록구분( 총등,교등,입교)'] === '입교' ? 'ip' : 'cg';
        const val = dummy['삼일실제(분류)'];
        if (val && val !== '미보고') {
          const slotsList = group === 'ip' ? unmatchedWedIpSlots : unmatchedWedCgSlots;
          slotsList.push({
            value: val,
            reasonValue: dummy['미확인/미보고 사유(실제)'] || ''
          });
        }
      });
    }

    // Calculate total targets from report headers
    const cgTotal = Math.max(sunCg?.total || 0, wedCg?.total || 0);
    const ipTotal = Math.max(sunIp?.total || 0, wedIp?.total || 0);

    const realCgCount = Object.values(realMap).filter(r => r['등록구분( 총등,교등,입교)'] !== '입교').length;
    const realIpCount = Object.values(realMap).filter(r => r['등록구분( 총등,교등,입교)'] === '입교').length;

    const cgDummyNeeded = Math.max(0, cgTotal - realCgCount);
    const ipDummyNeeded = Math.max(0, ipTotal - realIpCount);

    const cgDummyCount = Math.max(cgDummyNeeded, unmatchedSunCgSlots.length, unmatchedWedCgSlots.length);
    const ipDummyCount = Math.max(ipDummyNeeded, unmatchedSunIpSlots.length, unmatchedWedIpSlots.length);

    // Zip Sunday and Wednesday dummy slots
    const buildFinalDummyRecords = (isIpgyoGroup, sunSlots, wedSlots, targetCount) => {
      const list = [];
      for (let i = 0; i < targetCount; i++) {
        const sunSlot = sunSlots[i] || null;
        const wedSlot = wedSlots[i] || null;
        list.push({
          id: `${activeWeekKey}-${region}-${isIpgyoGroup ? 'ip' : 'cg'}-dummy-${i}-${Date.now()}`,
          _aggregate: true,
          weekKey: activeWeekKey,
          지역: region,
          이름: '',
          '등록구분( 총등,교등,입교)': isIpgyoGroup ? '입교' : '총등',
          
          '삼일사전(분류)': wedSlot ? wedSlot.value : '미보고',
          '미확인/미보고 사유(사전)': (wedSlot && wedSlot.reasonValue) ? wedSlot.reasonValue : '',
          '삼일실제(분류)': wedSlot ? wedSlot.value : '미보고',
          '예배확인방법(실제)': '',
          '미확인/미보고 사유(실제)': (wedSlot && wedSlot.reasonValue) ? wedSlot.reasonValue : '',
          '인증분류(위아원)': '',
          
          '주일사전(분류)': sunSlot ? sunSlot.value : '미보고',
          '미확인/미보고 사유(사전)_주일': (sunSlot && sunSlot.reasonValue) ? sunSlot.reasonValue : '',
          '주일실제(분류)': sunSlot ? sunSlot.value : '미보고',
          '예배확인방법(실제)_주일': '',
          '미확인/미보고 사유(실제)_주일': (sunSlot && sunSlot.reasonValue) ? sunSlot.reasonValue : '',
          '인증분류(위아원)_주일': '',
          '시험': ''
        });
      }
      return list;
    };

    const completedRegionRecords = [
      ...Object.values(realMap),
      ...buildFinalDummyRecords(false, unmatchedSunCgSlots, unmatchedWedCgSlots, cgDummyCount),
      ...buildFinalDummyRecords(true, unmatchedSunIpSlots, unmatchedWedIpSlots, ipDummyCount)
    ];

    const completedActiveWeekRecords = [...activeWeekOtherRegionRecords, ...completedRegionRecords];
    onUpdateRecords(completedActiveWeekRecords);
    alert(`${region} 보고서가 적용되었습니다. 실제 이름 ${Object.keys(parsedByName).length}명과 합계 숫자가 반영되었습니다.`);
  };

  const normalizeRegion = (name) => {
    if (!name) return '';
    return name.replace('지역', '').trim();
  };

  // ===================================================
  // Sunday & Wednesday Worship Breakdown Calculations for Attendance Tab
  // ===================================================
  const regionsList = currentUser.role === 'region'
    ? [normalizeRegion(currentUser.region)]
    : ['화정', '대학', '상암', '명동', '새소망', '성군', '새신자', '승리', '평화', '국제'];

  const getSundayRowData = (regionName) => {
    const regRecords = records.filter(r => normalizeRegion(r.지역) === normalizeRegion(regionName));
    const total = regRecords.length;

    const filterHwajeong = (time) => {
      return regRecords.filter(r => {
        const val = (r[worshipField] || '').trim();
        if (!val.startsWith('화정-')) return false;
        const timePart = val.replace('화정-', '');
        const normTime = timePart.startsWith('0') ? timePart.slice(1) : timePart;
        const normTarget = time.startsWith('0') ? time.slice(1) : time;
        return normTime === normTarget;
      }).length;
    };

    const filterSangsu = (time) => {
      return regRecords.filter(r => {
        const val = (r[worshipField] || '').trim();
        if (!val.startsWith('상수-')) return false;
        const timePart = val.replace('상수-', '');
        const normTime = timePart.startsWith('0') ? timePart.slice(1) : timePart;
        const normTarget = time.startsWith('0') ? time.slice(1) : time;
        return normTime === normTarget;
      }).length;
    };

    const filterMoimbang = (locName) => {
      return regRecords.filter(r => {
        const val = (r[worshipField] || '').trim();
        if (locName === '주엽') return val === '주엽-12시' || val === '주엽-12';
        if (locName === '서교') return val === '서교-12시' || val === '서교-12';
        return false;
      }).length;
    };

    const filterOthers = (catName) => {
      return regRecords.filter(r => {
        const val = (r[worshipField] || '').trim();
        if (!val || val === '미보고' || val === '미확인' || val === '결석' || val === '줌' || val.includes('대체')) {
          return false;
        }
        if (val.startsWith('화정-') || val.startsWith('상수-') || val.startsWith('주엽-') || val.startsWith('서교-')) {
          return false;
        }
        
        if (catName === '협교') return val === '협력교회';
        if (catName === '형제') return val === '형제교회';
        if (catName === '위니크') return val === '위니크';
        if (catName === '국제') return val === '국제';
        if (catName === '사랑') return val === '사랑' || val === '사랑예배';
        if (catName === '그외') {
          return val === '그외' || val === '대면' || val === '센터수강' || val === '새신자교육' || val === '선유월예배' || val === '자문회예배' || val === '센터수업' || val === '선유월' || val === '타부서모임방' || val.includes('타부서');
        }
        return false;
      }).length;
    };

    const hwajeong_730 = filterHwajeong('7시30분');
    const hwajeong_900 = filterHwajeong('9시');
    const hwajeong_1200 = filterHwajeong('12시');
    const hwajeong_1500 = filterHwajeong('15시');
    const hwajeong_2000 = filterHwajeong('20시');

    const sangsu_1200 = filterSangsu('12시');
    const sangsu_1700 = filterSangsu('17시');
    const sangsu_2000 = filterSangsu('20시');

    const moimbang_juyeop = filterMoimbang('주엽');
    const moimbang_seogyo = filterMoimbang('서교');

    const others_hupgyo = filterOthers('협교');
    const others_hyungje = filterOthers('형제');
    const others_winique = filterOthers('위니크');
    const others_gukje = filterOthers('국제');
    const others_sarang = filterOthers('사랑');
    const others_geuoe = filterOthers('그외');
    const others_zoom = regRecords.filter(r => {
      const val = String(r[worshipField] || '').trim();
      return val === '줌' || val.toLowerCase().includes('zoom');
    }).length;

    const daemyunTotal = 
      hwajeong_730 + hwajeong_900 + hwajeong_1200 + hwajeong_1500 + hwajeong_2000 +
      sangsu_1200 + sangsu_1700 + sangsu_2000 +
      moimbang_juyeop + moimbang_seogyo +
      others_hupgyo + others_hyungje + others_winique + others_gukje + others_sarang + others_geuoe + others_zoom;

    return {
      region: regionName,
      total,
      daemyunTotal,
      hwajeong: [hwajeong_730, hwajeong_900, hwajeong_1200, hwajeong_1500, hwajeong_2000],
      pointerMax: Math.max(hwajeong_730, hwajeong_900, hwajeong_1200, hwajeong_1500, hwajeong_2000),
      sangsu: [sangsu_1200, sangsu_1700, sangsu_2000],
      moimbang: [moimbang_juyeop, moimbang_seogyo],
      others: [others_hupgyo, others_hyungje, others_winique, others_gukje, others_sarang, others_geuoe, others_zoom]
    };
  };

  const getWednesdayRowData = (regionName) => {
    const regRecords = records.filter(r => normalizeRegion(r.지역) === normalizeRegion(regionName));
    const total = regRecords.length;

    const filterWedClass = (time, loc) => {
      return regRecords.filter(r => {
        const val = (r[worshipField] || '').trim();
        
        if (time === '12시') {
          return val === `${loc}-12시` || val === `${loc}-12` || val === `${loc}-12시00분`;
        }
        
        if (time === '19시30분') {
          if (loc === '국제모임방' || loc === '국제') return val === '국제-19시30분' || val === '국제-7시30분' || val === '국제';
          if (loc === '큰서교') return val === '서교-19시30분' || val === '서교-7시30분';
          return val === `${loc}-19시30분` || val === `${loc}-7시30분` || val === `${loc}-19시 30분`;
        }

        if (time === '21시') {
          return val === `${loc}-21시` || val === `${loc}-9시` || val === `${loc}-21`;
        }
        
        return false;
      }).length;
    };

    const filterWedOthers = (catName) => {
      return regRecords.filter(r => {
        const val = (r[worshipField] || '').trim();
        if (!val || val === '미보고' || val === '미확인' || val === '결석' || val === '줌' || val.includes('대체')) {
          return false;
        }
        if (val.includes('-12시') || val.includes('-19시30분') || val.includes('-21시') || val.includes('-7시30분') || val.includes('-9시')) {
          return false;
        }

        if (catName === '협교') return val === '협력교회' || val === '협교';
        if (catName === '형제') return val === '형제교회' || val === '형제';
        if (catName === '기타') {
          return val === '기타' || val === '대면' || val === '그외' || val === '센터수강' || val === '새신자교육' || val === '선유월예배' || val === '자문회예배' || val === '센터수업' || val === '선유월' || val === '타부서모임방' || val.includes('타부서');
        }
        return false;
      }).length;
    };

    const w12_hwajeong = filterWedClass('12시', '화정');
    const w12_seogyo = filterWedClass('12시', '서교');
    const w12_juyeop = filterWedClass('12시', '주엽');

    const w1930_hwajeong = filterWedClass('19시30분', '화정');
    const w1930_gukje = filterWedClass('19시30분', '국제');
    const w1930_seogyo = filterWedClass('19시30분', '큰서교');
    const w1930_sangsu = filterWedClass('19시30분', '상수');
    const w1930_juyeop = filterWedClass('19시30분', '주엽');

    const w21_hwajeong = filterWedClass('21시', '화정');

    const wothers_hupgyo = filterWedOthers('협교');
    const wothers_hyungje = filterWedOthers('형제');
    const wothers_gita = filterWedOthers('기타');
    const wothers_zoom = regRecords.filter(r => {
      const val = String(r[worshipField] || '').trim();
      return val === '줌' || val.toLowerCase().includes('zoom');
    }).length;

    const daemyunTotal = regRecords.filter(record => {
      const classification = String(record[worshipField] || '').trim();
      return classification && classification !== '미보고' && classification !== '미확인' && !classification.includes('결석');
    }).length;
    const categorizedFaceTotal =
      w12_hwajeong + w12_seogyo + w12_juyeop +
      w1930_hwajeong + w1930_gukje + w1930_seogyo + w1930_sangsu + w1930_juyeop +
      w21_hwajeong +
      wothers_hupgyo + wothers_hyungje + wothers_gita + wothers_zoom;

    return {
      region: regionName,
      total,
      daemyunTotal,
      w12: [w12_hwajeong, w12_seogyo, w12_juyeop],
      w1930: [w1930_hwajeong, w1930_gukje, w1930_seogyo, w1930_sangsu, w1930_juyeop],
      w21: [w21_hwajeong],
      wothers: [wothers_hupgyo, wothers_hyungje, wothers_gita, wothers_zoom]
    };
  };

  const sunRowsData = regionsList.map(name => getSundayRowData(name));
  const wedRowsData = regionsList.map(name => getWednesdayRowData(name));

  // Sunday sums
  const sunTotalSum = sunRowsData.reduce((acc, r) => acc + r.total, 0);
  const sunDaemyunSum = sunRowsData.reduce((acc, r) => acc + r.daemyunTotal, 0);
  const sunHwajeongSums = [0, 1, 2, 3, 4].map(idx => sunRowsData.reduce((acc, r) => acc + r.hwajeong[idx], 0));
  const sunSangsuSums = [0, 1, 2].map(idx => sunRowsData.reduce((acc, r) => acc + r.sangsu[idx], 0));
  const sunMoimbangSums = [0, 1].map(idx => sunRowsData.reduce((acc, r) => acc + r.moimbang[idx], 0));
  const sunOthersSums = [0, 1, 2, 3, 4, 5, 6].map(idx => sunRowsData.reduce((acc, r) => acc + r.others[idx], 0));

  // Wednesday sums
  const wedTotalSum = wedRowsData.reduce((acc, r) => acc + r.total, 0);
  const wedDaemyunSum = wedRowsData.reduce((acc, r) => acc + r.daemyunTotal, 0);
  const wed12Sums = [0, 1, 2].map(idx => wedRowsData.reduce((acc, r) => acc + r.w12[idx], 0));
  const wed1930Sums = [0, 1, 2, 3, 4].map(idx => wedRowsData.reduce((acc, r) => acc + r.w1930[idx], 0));
  const wed21Sums = [0].map(idx => wedRowsData.reduce((acc, r) => acc + r.w21[idx], 0));
  const wedOthersSums = [0, 1, 2, 3].map(idx => wedRowsData.reduce((acc, r) => acc + r.wothers[idx], 0));

  const getCellBg = (val, maxValInRow) => {
    if (val === 0) return 'transparent';
    return val >= 14 || val === maxValInRow ? '#fef08a' : 'transparent';
  };

  const getRateColorStyle = (rate) => {
    const val = parseFloat(rate);
    if (val >= 70.0) return { backgroundColor: '#dcfce7', color: '#166534', fontWeight: 'bold' };
    if (val <= 30.0) return { backgroundColor: '#ffe4e6', color: '#991b1b', fontWeight: 'bold' };
    return { backgroundColor: '#f1f5f9', color: '#334155' };
  };

  // Filtered listing
  const filteredRecords = records
    .filter(r => {
      if (r._aggregate) return false;
      const matchSearch = (r.이름 || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchRegion = filterRegion === '전체' || normalizeRegion(r.지역) === normalizeRegion(filterRegion);
      return matchSearch && matchRegion;
    });

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRecords.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="content-body">
      {/* Weekly Selector Bar inside content-body for perfect alignment */}
      <div className="weekly-selector-bar" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#1e293b',
        color: '#f8fafc',
        padding: '12px 24px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        border: '1px solid #334155',
        boxSizing: 'border-box'
      }}>
        {/* Left Side: Path title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            backgroundColor: '#0f172a',
            color: '#38bdf8'
          }}>
            <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="18" width="18" xmlns="http://www.w3.org/2000/svg" style={{ color: '#38bdf8' }}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem' }}>
            <span style={{ color: '#94a3b8', fontWeight: 500 }}>교구 현황</span>
            <span style={{ color: '#64748b' }}>&gt;</span>
            <span style={{ color: '#f8fafc', fontWeight: 700 }}>
              {selectedYear}년 {selectedMonth}월 {selectedWeek}주차
            </span>
          </div>
        </div>

        {/* Right Side: Selectors */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* Month Selector dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>월 선택</span>
            <select
              style={{
                backgroundColor: '#0f172a',
                color: '#f8fafc',
                border: '1px solid #475569',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '0.85rem',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer'
              }}
              value={`${selectedYear}-${selectedMonth}`}
              onChange={(e) => {
                const [y, m] = e.target.value.split('-');
                setSelectedYear(parseInt(y));
                setSelectedMonth(parseInt(m));
              }}
            >
              <option value="2026-5">2026년 5월</option>
              <option value="2026-6">2026년 6월</option>
              <option value="2026-7">2026년 7월</option>
              <option value="2026-8">2026년 8월</option>
              <option value="2026-9">2026년 9월</option>
              <option value="2026-10">2026년 10월</option>
            </select>
          </div>

          {/* Week Selector buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>주차</span>
            <div style={{
              display: 'flex',
              backgroundColor: '#0f172a',
              borderRadius: '6px',
              padding: '2px',
              border: '1px solid #475569'
            }}>
              {[1, 2, 3, 4, 5].map((w) => (
                <button
                  key={w}
                  style={{
                    backgroundColor: selectedWeek === w ? '#38bdf8' : 'transparent',
                    color: selectedWeek === w ? '#0f172a' : '#94a3b8',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '6px 14px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onClick={() => setSelectedWeek(w)}
                >
                  {w}주
                </button>
              ))}
            </div>
          </div>

          {/* Status Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#022c22',
            color: '#4ade80',
            border: '1px solid #065f46',
            borderRadius: '6px',
            padding: '6px 12px',
            fontSize: '0.8rem',
            fontWeight: 700
          }}>
            <span style={{ display: 'inline-block', width: '6px', height: '6px', backgroundColor: '#4ade80', borderRadius: '50%' }} />
            작성 가능
          </div>

          {/* Screen Icon */}
          <button style={{
            backgroundColor: '#334155',
            border: 'none',
            borderRadius: '6px',
            color: '#94a3b8',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}>
            <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="16" width="16" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
          </button>
        </div>
      </div>

      {/* Rebranded Toolbar: wrapped inside a Card component for clean layout alignment */}
      <div className="card actions-bar" style={{ padding: '16px 24px', flexDirection: 'row', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
          <div className="search-input-wrapper">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="이름으로 검색..."
              className="search-input"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>

          <select
            className="form-control"
            style={{ minWidth: '150px', cursor: 'pointer' }}
            value={filterRegion}
            onChange={e => { setFilterRegion(e.target.value); setCurrentPage(1); }}
            disabled={currentUser.role === 'region'}
          >
            {currentUser.role === 'region' ? (
              <option value={currentUser.region}>지역: {currentUser.region}</option>
            ) : (
              uniqueRegions.map(r => (
                <option key={r} value={r}>{r === '전체' ? '지역: 전체' : r}</option>
              ))
            )}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".xlsx, .xls"
            style={{ display: 'none' }}
          />
          <button className="btn btn-secondary" onClick={handleDownloadTemplate} title="엑셀 파일 양식 다운로드">
            <Download size={16} />
            양식 다운로드
          </button>
          <button className="btn btn-secondary" onClick={handleUploadClick} title="출결 데이터가 있는 엑셀파일 업로드">
            <Upload size={16} />
            엑셀 업로드
          </button>
          <button className="btn btn-secondary" onClick={() => setIsTextUploadOpen(true)} title="출결 보고용 텍스트 업로드 및 분석">
            <Upload size={16} />
            텍스트 업로드
          </button>
          <button className="btn btn-secondary" onClick={handleExportBreakdown} title="현재 화면의 예배 현황표를 색상/병합을 포함하여 다운로드" style={{ borderColor: '#166534', color: '#166534', fontWeight: 600 }}>
            <FileSpreadsheet size={16} />
            현황표 엑셀
          </button>
          <button className="btn btn-secondary" onClick={handleExportData} title="전체 개인별 상세 출결 목록을 다운로드">
            <Download size={16} />
            명단 엑셀
          </button>
          <button className="btn btn-emerald" onClick={() => setIsReportOpen(true)} title="출결 보고용 텍스트 생성">
            <Copy size={16} />
            결과텍스트 복사
          </button>
          
          {/* Load Sample Data Button */}
          <button className="btn btn-secondary" onClick={handleLoadSampleData} title="테스트용 샘플 데이터(1,998명) 로드" style={{ borderColor: 'var(--accent-blue)', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <FileSpreadsheet size={16} />
            샘플 로드
          </button>
          
          <button className="btn btn-rose" onClick={() => {
            if (window.confirm('정말로 모든 출결 데이터를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없으며 모든 신도 목록과 출결 기록이 초기화됩니다.')) {
              onBulkUpload([]);
            }
          }} title="모든 출결 데이터 초기화" style={{ backgroundColor: 'var(--accent-rose)', color: 'white', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Trash2 size={16} />
            데이터 초기화
          </button>
          <button className="btn btn-primary" onClick={handleAddRow}>
            <Plus size={16} />
            행 추가
          </button>
        </div>
      </div>

      {/* Active Worship Tab & Type Toggle */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div className="segmented">
          <button
            className={activeWorshipTab === 'sunday' ? 'active' : ''}
            onClick={() => setActiveWorshipTab('sunday')}
          >
            주일예배
          </button>
          <button
            className={activeWorshipTab === 'wednesday' ? 'active' : ''}
            onClick={() => setActiveWorshipTab('wednesday')}
          >
            삼일예배
          </button>
        </div>

        <div className="segmented soft">
          <button
            className={activeWorshipType === 'planned' ? 'active' : ''}
            onClick={() => setActiveWorshipType('planned')}
          >
            사전
          </button>
          <button
            className={activeWorshipType === 'actual' ? 'active' : ''}
            onClick={() => setActiveWorshipType('actual')}
          >
            실제
          </button>
        </div>
      </div>

      {/* Render selected breakdown table */}
      {activeWorshipTab === 'sunday' ? (
        <div className="card" style={{ overflow: 'hidden', padding: 0, marginBottom: '20px', border: '1px solid var(--border-light)' }}>
          <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
            <table className="table-custom" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '0.85rem', margin: 0 }}>
              <thead>
                <tr>
                  <th colSpan="20" style={{ backgroundColor: '#166534', color: 'white', fontWeight: 700, padding: '10px', fontSize: '1rem', borderBottom: '1px solid #14532d' }}>
                    주일예배 · {activeWorshipType === 'planned' ? '사전 현황' : '실제 현황'}
                  </th>
                </tr>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  <th rowSpan="2" style={{ borderRight: '1px solid var(--border-light)', borderBottom: '2.5px solid var(--border-light)', verticalAlign: 'middle' }}>지역</th>
                  <th rowSpan="2" style={{ borderRight: '1px solid var(--border-light)', borderBottom: '2.5px solid var(--border-light)', verticalAlign: 'middle' }}>출결재적</th>
                  <th colSpan="2" style={{ borderRight: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)' }}>대면예배</th>
                  <th colSpan="5" style={{ borderRight: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)' }}>화정성전</th>
                  <th colSpan="3" style={{ borderRight: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)' }}>상수</th>
                  <th colSpan="2" style={{ borderRight: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)' }}>모임방</th>
                  <th colSpan="7" style={{ borderBottom: '1px solid var(--border-light)' }}>기타</th>
                </tr>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  <th style={{ borderRight: '1px solid var(--border-light)', borderBottom: '2.5px solid var(--border-light)', fontSize: '0.75rem' }}>인원</th>
                  <th style={{ borderRight: '1px solid var(--border-light)', borderBottom: '2.5px solid var(--border-light)', fontSize: '0.75rem' }}>비율</th>
                  <th style={{ borderRight: '1px solid var(--border-light)', borderBottom: '2.5px solid var(--border-light)', fontSize: '0.75rem' }}>7시30분</th>
                  <th style={{ borderRight: '1px solid var(--border-light)', borderBottom: '2.5px solid var(--border-light)', fontSize: '0.75rem' }}>9시</th>
                  <th style={{ borderRight: '1px solid var(--border-light)', borderBottom: '2.5px solid var(--border-light)', fontSize: '0.75rem', color: '#b91c1c', fontWeight: 'bold' }}>12시</th>
                  <th style={{ borderRight: '1px solid var(--border-light)', borderBottom: '2.5px solid var(--border-light)', fontSize: '0.75rem' }}>15시</th>
                  <th style={{ borderRight: '1px solid var(--border-light)', borderBottom: '2.5px solid var(--border-light)', fontSize: '0.75rem' }}>20시</th>
                  <th style={{ borderRight: '1px solid var(--border-light)', borderBottom: '2.5px solid var(--border-light)', fontSize: '0.75rem' }}>12시</th>
                  <th style={{ borderRight: '1px solid var(--border-light)', borderBottom: '2.5px solid var(--border-light)', fontSize: '0.75rem' }}>17시</th>
                  <th style={{ borderRight: '1px solid var(--border-light)', borderBottom: '2.5px solid var(--border-light)', fontSize: '0.75rem' }}>20시</th>
                  <th style={{ borderRight: '1px solid var(--border-light)', borderBottom: '2.5px solid var(--border-light)', fontSize: '0.75rem' }}>주엽<br/><span style={{ color: '#64748b', fontSize: '0.68rem' }}>12시</span></th>
                  <th style={{ borderRight: '1px solid var(--border-light)', borderBottom: '2.5px solid var(--border-light)', fontSize: '0.75rem' }}>서교<br/><span style={{ color: '#64748b', fontSize: '0.68rem' }}>12시</span></th>
                  <th style={{ borderRight: '1px solid var(--border-light)', borderBottom: '2.5px solid var(--border-light)', fontSize: '0.75rem' }}>협교</th>
                  <th style={{ borderRight: '1px solid var(--border-light)', borderBottom: '2.5px solid var(--border-light)', fontSize: '0.75rem' }}>형제</th>
                  <th style={{ borderRight: '1px solid var(--border-light)', borderBottom: '2.5px solid var(--border-light)', fontSize: '0.75rem' }}>위니크</th>
                  <th style={{ borderRight: '1px solid var(--border-light)', borderBottom: '2.5px solid var(--border-light)', fontSize: '0.75rem' }}>국제</th>
                  <th style={{ borderRight: '1px solid var(--border-light)', borderBottom: '2.5px solid var(--border-light)', fontSize: '0.75rem' }}>사랑</th>
                  <th style={{ borderRight: '1px solid var(--border-light)', borderBottom: '2.5px solid var(--border-light)', fontSize: '0.75rem' }}>그외</th>
                  <th style={{ borderBottom: '2.5px solid var(--border-light)', fontSize: '0.75rem' }}>줌</th>
                </tr>
              </thead>
              <tbody>
                {sunRowsData.map((row, rIdx) => {
                  const allCells = [...row.hwajeong, ...row.sangsu, ...row.moimbang, ...row.others];
                  const maxVal = Math.max(...allCells.filter(v => v > 0));
                  const ratePct = row.total > 0 ? `${((row.daemyunTotal / row.total) * 100).toFixed(1)}%` : '0.0%';

                  return (
                    <tr key={rIdx}>
                      <td style={{ fontWeight: 600, borderRight: '1px solid var(--border-light)' }}>{row.region}</td>
                      <td style={{ borderRight: '1px solid var(--border-light)' }}>{row.total}</td>
                      <td style={{ borderRight: '1px solid var(--border-light)', fontWeight: 600 }}>{row.daemyunTotal}</td>
                      <td style={{ borderRight: '1px solid var(--border-light)', ...getRateColorStyle(ratePct) }}>{ratePct}</td>
                      <td style={{ borderRight: '1px solid var(--border-light)', backgroundColor: getCellBg(row.hwajeong[0], maxVal) }}>{row.hwajeong[0] || ''}</td>
                      <td style={{ borderRight: '1px solid var(--border-light)', backgroundColor: getCellBg(row.hwajeong[1], maxVal) }}>{row.hwajeong[1] || ''}</td>
                      <td style={{ borderRight: '1px solid var(--border-light)', color: '#b91c1c', fontWeight: 'bold', backgroundColor: getCellBg(row.hwajeong[2], maxVal) }}>{row.hwajeong[2] || ''}</td>
                      <td style={{ borderRight: '1px solid var(--border-light)', backgroundColor: getCellBg(row.hwajeong[3], maxVal) }}>{row.hwajeong[3] || ''}</td>
                      <td style={{ borderRight: '1px solid var(--border-light)', backgroundColor: getCellBg(row.hwajeong[4], maxVal) }}>{row.hwajeong[4] || ''}</td>
                      <td style={{ borderRight: '1px solid var(--border-light)', backgroundColor: getCellBg(row.sangsu[0], maxVal) }}>{row.sangsu[0] || ''}</td>
                      <td style={{ borderRight: '1px solid var(--border-light)', backgroundColor: getCellBg(row.sangsu[1], maxVal) }}>{row.sangsu[1] || ''}</td>
                      <td style={{ borderRight: '1px solid var(--border-light)', backgroundColor: getCellBg(row.sangsu[2], maxVal) }}>{row.sangsu[2] || ''}</td>
                      <td style={{ borderRight: '1px solid var(--border-light)', backgroundColor: getCellBg(row.moimbang[0], maxVal) }}>{row.moimbang[0] || ''}</td>
                      <td style={{ borderRight: '1px solid var(--border-light)', backgroundColor: getCellBg(row.moimbang[1], maxVal) }}>{row.moimbang[1] || ''}</td>
                      <td style={{ borderRight: '1px solid var(--border-light)', backgroundColor: getCellBg(row.others[0], maxVal) }}>{row.others[0] || ''}</td>
                      <td style={{ borderRight: '1px solid var(--border-light)', backgroundColor: getCellBg(row.others[1], maxVal) }}>{row.others[1] || ''}</td>
                      <td style={{ borderRight: '1px solid var(--border-light)', backgroundColor: getCellBg(row.others[2], maxVal) }}>{row.others[2] || ''}</td>
                      <td style={{ borderRight: '1px solid var(--border-light)', backgroundColor: getCellBg(row.others[3], maxVal) }}>{row.others[3] || ''}</td>
                      <td style={{ borderRight: '1px solid var(--border-light)', backgroundColor: getCellBg(row.others[4], maxVal) }}>{row.others[4] || ''}</td>
                      <td style={{ borderRight: '1px solid var(--border-light)', backgroundColor: getCellBg(row.others[5], maxVal) }}>{row.others[5] || ''}</td>
                      <td style={{ backgroundColor: getCellBg(row.others[6], maxVal) }}>{row.others[6] || ''}</td>
                    </tr>
                  );
                })}
                <tr style={{ backgroundColor: '#dcfce7', fontWeight: 'bold', borderTop: '2px solid #86efac' }}>
                  <td style={{ borderRight: '1px solid var(--border-light)' }}>청년회</td>
                  <td style={{ borderRight: '1px solid var(--border-light)' }}>{sunTotalSum}</td>
                  <td style={{ borderRight: '1px solid var(--border-light)' }}>{sunDaemyunSum}</td>
                  <td style={{ borderRight: '1px solid var(--border-light)', color: '#166534' }}>{sunTotalSum > 0 ? `${((sunDaemyunSum / sunTotalSum) * 100).toFixed(1)}%` : '0.0%'}</td>
                  <td style={{ borderRight: '1px solid var(--border-light)' }}>{sunHwajeongSums[0]}</td>
                  <td style={{ borderRight: '1px solid var(--border-light)' }}>{sunHwajeongSums[1]}</td>
                  <td style={{ borderRight: '1px solid var(--border-light)', color: '#b91c1c' }}>{sunHwajeongSums[2]}</td>
                  <td style={{ borderRight: '1px solid var(--border-light)' }}>{sunHwajeongSums[3]}</td>
                  <td style={{ borderRight: '1px solid var(--border-light)' }}>{sunHwajeongSums[4]}</td>
                  <td style={{ borderRight: '1px solid var(--border-light)' }}>{sunSangsuSums[0]}</td>
                  <td style={{ borderRight: '1px solid var(--border-light)' }}>{sunSangsuSums[1]}</td>
                  <td style={{ borderRight: '1px solid var(--border-light)' }}>{sunSangsuSums[2]}</td>
                  <td style={{ borderRight: '1px solid var(--border-light)' }}>{sunMoimbangSums[0]}</td>
                  <td style={{ borderRight: '1px solid var(--border-light)' }}>{sunMoimbangSums[1]}</td>
                  <td style={{ borderRight: '1px solid var(--border-light)' }}>{sunOthersSums[0]}</td>
                  <td style={{ borderRight: '1px solid var(--border-light)' }}>{sunOthersSums[1]}</td>
                  <td style={{ borderRight: '1px solid var(--border-light)' }}>{sunOthersSums[2]}</td>
                  <td style={{ borderRight: '1px solid var(--border-light)' }}>{sunOthersSums[3]}</td>
                  <td style={{ borderRight: '1px solid var(--border-light)' }}>{sunOthersSums[4]}</td>
                  <td style={{ borderRight: '1px solid var(--border-light)' }}>{sunOthersSums[5]}</td>
                  <td>{sunOthersSums[6]}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden', padding: 0, marginBottom: '20px', border: '1px solid var(--border-light)' }}>
          <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
            <table className="table-custom" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '0.85rem', margin: 0 }}>
              <thead>
                <tr>
                  <th colSpan="18" style={{ backgroundColor: '#166534', color: 'white', fontWeight: 700, padding: '10px', fontSize: '1rem', borderBottom: '1px solid #14532d' }}>
                    삼일예배 · {activeWorshipType === 'planned' ? '사전 현황' : '실제 현황'}
                  </th>
                </tr>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  <th rowSpan="2" style={{ borderRight: '1px solid var(--border-light)', borderBottom: '2.5px solid var(--border-light)', verticalAlign: 'middle' }}>시간<br/>예배장소</th>
                  <th rowSpan="2" style={{ borderRight: '1px solid var(--border-light)', borderBottom: '2.5px solid var(--border-light)', verticalAlign: 'middle' }}>출결재적</th>
                  <th colSpan="2" style={{ borderRight: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)' }}>총합</th>
                  <th colSpan="3" style={{ borderRight: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)' }}>12시</th>
                  <th colSpan="5" style={{ borderRight: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)' }}>19시 30분</th>
                  <th colSpan="1" style={{ borderRight: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)' }}>21시</th>
                  <th colSpan="4" style={{ borderBottom: '1px solid var(--border-light)' }}>기타</th>
                </tr>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  <th style={{ borderRight: '1px solid var(--border-light)', borderBottom: '2.5px solid var(--border-light)', fontSize: '0.75rem' }}>인원</th>
                  <th style={{ borderRight: '1px solid var(--border-light)', borderBottom: '2.5px solid var(--border-light)', fontSize: '0.75rem' }}>비율</th>
                  <th style={{ borderRight: '1px solid var(--border-light)', borderBottom: '2.5px solid var(--border-light)', fontSize: '0.75rem' }}>화정</th>
                  <th style={{ borderRight: '1px solid var(--border-light)', borderBottom: '2.5px solid var(--border-light)', fontSize: '0.75rem' }}>서교</th>
                  <th style={{ borderRight: '1px solid var(--border-light)', borderBottom: '2.5px solid var(--border-light)', fontSize: '0.75rem' }}>주엽</th>
                  <th style={{ borderRight: '1px solid var(--border-light)', borderBottom: '2.5px solid var(--border-light)', fontSize: '0.75rem' }}>화정</th>
                  <th style={{ borderRight: '1px solid var(--border-light)', borderBottom: '2.5px solid var(--border-light)', fontSize: '0.75rem' }}>국제모임방</th>
                  <th style={{ borderRight: '1px solid var(--border-light)', borderBottom: '2.5px solid var(--border-light)', fontSize: '0.75rem' }}>큰서교</th>
                  <th style={{ borderRight: '1px solid var(--border-light)', borderBottom: '2.5px solid var(--border-light)', fontSize: '0.75rem' }}>상수</th>
                  <th style={{ borderRight: '1px solid var(--border-light)', borderBottom: '2.5px solid var(--border-light)', fontSize: '0.75rem' }}>주엽</th>
                  <th style={{ borderRight: '1px solid var(--border-light)', borderBottom: '2.5px solid var(--border-light)', fontSize: '0.75rem' }}>화정</th>
                  <th style={{ borderRight: '1px solid var(--border-light)', borderBottom: '2.5px solid var(--border-light)', fontSize: '0.75rem' }}>협교</th>
                  <th style={{ borderRight: '1px solid var(--border-light)', borderBottom: '2.5px solid var(--border-light)', fontSize: '0.75rem' }}>형제</th>
                  <th style={{ borderRight: '1px solid var(--border-light)', borderBottom: '2.5px solid var(--border-light)', fontSize: '0.75rem' }}>기타</th>
                  <th style={{ borderBottom: '2.5px solid var(--border-light)', fontSize: '0.75rem' }}>줌</th>
                </tr>
              </thead>
              <tbody>
                {wedRowsData.map((row, rIdx) => {
                  const allCells = [...row.w12, ...row.w1930, ...row.w21, ...row.wothers];
                  const maxVal = Math.max(...allCells.filter(v => v > 0));
                  const ratePct = row.total > 0 ? `${((row.daemyunTotal / row.total) * 100).toFixed(1)}%` : '0.0%';

                  return (
                    <tr key={rIdx}>
                      <td style={{ fontWeight: 600, borderRight: '1px solid var(--border-light)' }}>{row.region}</td>
                      <td style={{ borderRight: '1px solid var(--border-light)' }}>{row.total}</td>
                      <td style={{ borderRight: '1px solid var(--border-light)', fontWeight: 600 }}>{row.daemyunTotal}</td>
                      <td style={{ borderRight: '1px solid var(--border-light)', ...getRateColorStyle(ratePct) }}>{ratePct}</td>
                      <td style={{ borderRight: '1px solid var(--border-light)', backgroundColor: getCellBg(row.w12[0], maxVal) }}>{row.w12[0] || ''}</td>
                      <td style={{ borderRight: '1px solid var(--border-light)', backgroundColor: getCellBg(row.w12[1], maxVal) }}>{row.w12[1] || ''}</td>
                      <td style={{ borderRight: '1px solid var(--border-light)', backgroundColor: getCellBg(row.w12[2], maxVal) }}>{row.w12[2] || ''}</td>
                      <td style={{ borderRight: '1px solid var(--border-light)', backgroundColor: getCellBg(row.w1930[0], maxVal) }}>{row.w1930[0] || ''}</td>
                      <td style={{ borderRight: '1px solid var(--border-light)', backgroundColor: getCellBg(row.w1930[1], maxVal) }}>{row.w1930[1] || ''}</td>
                      <td style={{ borderRight: '1px solid var(--border-light)', backgroundColor: getCellBg(row.w1930[2], maxVal) }}>{row.w1930[2] || ''}</td>
                      <td style={{ borderRight: '1px solid var(--border-light)', backgroundColor: getCellBg(row.w1930[3], maxVal) }}>{row.w1930[3] || ''}</td>
                      <td style={{ borderRight: '1px solid var(--border-light)', backgroundColor: getCellBg(row.w1930[4], maxVal) }}>{row.w1930[4] || ''}</td>
                      <td style={{ borderRight: '1px solid var(--border-light)', backgroundColor: getCellBg(row.w21[0], maxVal) }}>{row.w21[0] || ''}</td>
                      <td style={{ borderRight: '1px solid var(--border-light)', backgroundColor: getCellBg(row.wothers[0], maxVal) }}>{row.wothers[0] || ''}</td>
                      <td style={{ borderRight: '1px solid var(--border-light)', backgroundColor: getCellBg(row.wothers[1], maxVal) }}>{row.wothers[1] || ''}</td>
                      <td style={{ borderRight: '1px solid var(--border-light)', backgroundColor: getCellBg(row.wothers[2], maxVal) }}>{row.wothers[2] || ''}</td>
                      <td style={{ backgroundColor: getCellBg(row.wothers[3], maxVal) }}>{row.wothers[3] || ''}</td>
                    </tr>
                  );
                })}
                <tr style={{ backgroundColor: '#dcfce7', fontWeight: 'bold', borderTop: '2px solid #86efac' }}>
                  <td style={{ borderRight: '1px solid var(--border-light)' }}>청년회</td>
                  <td style={{ borderRight: '1px solid var(--border-light)' }}>{wedTotalSum}</td>
                  <td style={{ borderRight: '1px solid var(--border-light)' }}>{wedDaemyunSum}</td>
                  <td style={{ borderRight: '1px solid var(--border-light)', color: '#166534' }}>{wedTotalSum > 0 ? `${((wedDaemyunSum / wedTotalSum) * 100).toFixed(1)}%` : '0.0%'}</td>
                  <td style={{ borderRight: '1px solid var(--border-light)' }}>{wed12Sums[0]}</td>
                  <td style={{ borderRight: '1px solid var(--border-light)' }}>{wed12Sums[1]}</td>
                  <td style={{ borderRight: '1px solid var(--border-light)' }}>{wed12Sums[2]}</td>
                  <td style={{ borderRight: '1px solid var(--border-light)' }}>{wed1930Sums[0]}</td>
                  <td style={{ borderRight: '1px solid var(--border-light)' }}>{wed1930Sums[1]}</td>
                  <td style={{ borderRight: '1px solid var(--border-light)' }}>{wed1930Sums[2]}</td>
                  <td style={{ borderRight: '1px solid var(--border-light)' }}>{wed1930Sums[3]}</td>
                  <td style={{ borderRight: '1px solid var(--border-light)' }}>{wed1930Sums[4]}</td>
                  <td style={{ borderRight: '1px solid var(--border-light)' }}>{wed21Sums[0]}</td>
                  <td style={{ borderRight: '1px solid var(--border-light)' }}>{wedOthersSums[0]}</td>
                  <td style={{ borderRight: '1px solid var(--border-light)' }}>{wedOthersSums[1]}</td>
                  <td style={{ borderRight: '1px solid var(--border-light)' }}>{wedOthersSums[2]}</td>
                  <td>{wedOthersSums[3]}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grid Table Card Wrapper */}
      {filteredRecords.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
          <table className="table-custom" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th style={{ width: '40px' }}>관리</th>
                <th style={{ minWidth: '100px' }}>지역</th>
                <th style={{ minWidth: '100px' }}>이름</th>
                <th style={{ minWidth: '100px' }}>등록구분</th>
                
                {/* Conditional Column Headers based on selected day */}
                {activeWorshipTab === 'wednesday' ? (
                  <>
                    <th style={{ minWidth: '120px' }}>삼일사전</th>
                    <th style={{ minWidth: '120px' }}>삼일사전사유</th>
                    <th style={{ minWidth: '120px' }}>삼일실제</th>
                    <th style={{ minWidth: '120px' }}>삼일실제확인</th>
                    <th style={{ minWidth: '120px' }}>삼일실제사유</th>
                    <th style={{ minWidth: '120px' }}>삼일인증</th>
                  </>
                ) : (
                  <>
                    <th style={{ minWidth: '120px' }}>주일사전</th>
                    <th style={{ minWidth: '120px' }}>주일사전사유</th>
                    <th style={{ minWidth: '120px' }}>주일실제</th>
                    <th style={{ minWidth: '120px' }}>주일실제확인</th>
                    <th style={{ minWidth: '120px' }}>주일실제사유</th>
                    <th style={{ minWidth: '120px' }}>주일인증</th>
                  </>
                )}
                
                <th style={{ minWidth: '100px' }}>시험</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((r, idx) => (
                  <tr key={r.id || idx}>
                    <td>
                      <button
                        className="btn btn-secondary btn-icon-only"
                        style={{ color: 'var(--accent-rose)', border: 'none', padding: '4px' }}
                        onClick={() => handleDeleteRow(r.id)}
                        title="행 삭제"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                    <td>
                      <input
                        type="text"
                        className="editable-cell-input"
                        value={r.지역 || ''}
                        onChange={e => handleCellChange(r.id, '지역', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="editable-cell-input"
                        value={r.이름 || ''}
                        onChange={e => handleCellChange(r.id, '이름', e.target.value)}
                        style={{ fontWeight: 600 }}
                      />
                    </td>
                    <td>
                      <select
                        className="editable-cell-select"
                        value={r['등록구분( 총등,교등,입교)'] || '총등'}
                        onChange={e => handleCellChange(r.id, '등록구분( 총등,교등,입교)', e.target.value)}
                      >
                        <option value="총등">총등</option>
                        <option value="교등">교등</option>
                        <option value="입교">입교</option>
                      </select>
                    </td>
                    
                    {/* Conditional Input Cells based on selected day */}
                    {activeWorshipTab === 'wednesday' ? (
                      <>
                        <td>
                          <input
                            type="text"
                            className="editable-cell-input"
                            value={r['삼일사전(분류)'] || ''}
                            onChange={e => handleCellChange(r.id, '삼일사전(분류)', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="editable-cell-input"
                            value={r['미확인/미보고 사유(사전)'] || ''}
                            onChange={e => handleCellChange(r.id, '미확인/미보고 사유(사전)', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="editable-cell-input"
                            value={r['삼일실제(분류)'] || ''}
                            onChange={e => handleCellChange(r.id, '삼일실제(분류)', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="editable-cell-input"
                            value={r['예배확인방법(실제)'] || ''}
                            onChange={e => handleCellChange(r.id, '예배확인방법(실제)', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="editable-cell-input"
                            value={r['미확인/미보고 사유(실제)'] || ''}
                            onChange={e => handleCellChange(r.id, '미확인/미보고 사유(실제)', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="editable-cell-input"
                            value={r['인증분류(위아원)'] || ''}
                            onChange={e => handleCellChange(r.id, '인증분류(위아원)', e.target.value)}
                          />
                        </td>
                      </>
                    ) : (
                      <>
                        <td>
                          <input
                            type="text"
                            className="editable-cell-input"
                            value={r['주일사전(분류)'] || ''}
                            onChange={e => handleCellChange(r.id, '주일사전(분류)', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="editable-cell-input"
                            value={r['미확인/미보고 사유(사전)_주일'] || ''}
                            onChange={e => handleCellChange(r.id, '미확인/미보고 사유(사전)_주일', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="editable-cell-input"
                            value={r['주일실제(분류)'] || ''}
                            onChange={e => handleCellChange(r.id, '주일실제(분류)', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="editable-cell-input"
                            value={r['예배확인방법(실제)_주일'] || ''}
                            onChange={e => handleCellChange(r.id, '예배확인방법(실제)_주일', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="editable-cell-input"
                            value={r['미확인/미보고 사유(실제)_주일'] || ''}
                            onChange={e => handleCellChange(r.id, '미확인/미보고 사유(실제)_주일', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="editable-cell-input"
                            value={r['인증분류(위아원)_주일'] || ''}
                            onChange={e => handleCellChange(r.id, '인증분류(위아원)_주일', e.target.value)}
                          />
                        </td>
                      </>
                    )}
                    
                    <td>
                      <input
                        type="text"
                        className="editable-cell-input"
                        value={r['시험'] || ''}
                        onChange={e => handleCellChange(r.id, '시험', e.target.value)}
                      />
                    </td>
                  </tr>
                ))
              ) : null}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        {filteredRecords.length > 0 && (
          <div className="pagination-container" style={{ borderTop: '1px solid var(--border-light)' }}>
            <div>
              총 <strong>{filteredRecords.length}</strong>명 중 <strong>{indexOfFirstItem + 1}</strong> - <strong>{Math.min(indexOfLastItem, filteredRecords.length)}</strong>명 표시
            </div>
            <div className="pagination-buttons">
              <button
                className="pagination-btn"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                이전
              </button>
              <span style={{ display: 'flex', alignItems: 'center', padding: '0 10px', fontWeight: 600 }}>
                {currentPage} / {totalPages}
              </span>
              <button
                className="pagination-btn"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                다음
              </button>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Copy Report Modal */}
      {isReportOpen && (
        <ReportModal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          records={records}
          selectedDate={selectedDate}
          currentUser={currentUser}
          filterRegion={filterRegion}
        />
      )}
      {isTextUploadOpen && (
        <TextUploadModal
          isOpen={isTextUploadOpen}
          onClose={() => setIsTextUploadOpen(false)}
          onApply={handleApplyTextReport}
          activeWeekKey={`${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${selectedWeek}`}
        />
      )}
    </div>
  );
}
