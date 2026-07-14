# 🏠 Clerk's Home (교구 출결 및 현황 대시보드)

교구의 주일예배 및 삼일예배 출결 정보를 카카오톡 텍스트 보고서 복사-붙여넣기, 엑셀 템플릿 업로드 등을 통해 편리하게 수집하고, 실시간으로 시각화 대시보드 및 통계 현황표를 제공하는 **React + Firebase 기반 교구 행정 관리 시스템**입니다.

## ✨ 핵심 기능

1. **📊 실시간 교구 현황 대시보드**
   * 주일예배 및 삼일예배 사전/실제 출결 현황 실시간 모니터링
   * 교동/총등/입교 등록 구분에 따른 세분화된 필터링 지원 (`전체`, `총교등자`, `입교자`)
   * 각 지역별 출석 인원/비율 및 예배 장소(대면성전, 모임방, 줌, 대체, 결석, 미보고) 종합 현황 매트릭스 표 제공

2. **📝 카카오톡 텍스트 보고서 자동 파싱**
   * 카카오톡 출결 보고서 복사 후 붙여넣기로 전체 실명 출결 상태 및 더미 데이터(합계 숫자) 자동 매핑 및 병합
   * 지역 해시태그(`#성군지역`), 다양한 대면 장소(화정, 상수, 모임방 등), 기타 미분류 항목(`사랑예배`, `타부서모임방`, `새신자교육` 등)에 대한 정밀 정규식 매싱 처리

3. **📅 주차별 데이터 관리 및 실시간 동기화**
   * 연도-월-주차 선택 및 주차별 출결 상태 실시간 조회
   * Google Firebase Cloud Firestore를 통한 다중 기기 실시간 동기화 및 강력한 로컬 백업(`localStorage`) 지원
   * 클릭 한 번으로 간편하게 데이터를 공백 상태로 비우는 **[데이터 초기화]** 기능 제공

4. **📥 현황표 엑셀 양식 다운로드 및 명단 관리**
   * 실시간 교구 현황 매트릭스 표를 서식 스타일(배경색, 폰트, 테두리, 셀 병합) 그대로 `.xlsx`로 내보내기 지원 (`xlsx-js-style` 연동)
   * 엑셀 양식 템플릿(16개 표준 컬럼) 다운로드 및 대량 업로드 지원

5. **🔐 담당자(Clerk) 계정 관리 및 세션 보안**
   * 전체 관리자(Super Manager) 및 지역 담당자(Regional Manager) 권한 관리
   * 담당자 추가, 수정, 삭제 및 보안 세션 로그인 지원

---

## 🛠️ 기술 스택 (Technology Stack)

* **Frontend**: React (Vite), JavaScript (ES6+), Vanilla CSS
* **Styling & UI**: Lucide-React (Icons), Modern HSL Color Palette
* **Database**: Firebase Cloud Firestore (실시간 NoSQL)
* **Excel Engine**: SheetsJS (XLSX), `xlsx-js-style`
* **Deployment**: Firebase Hosting

---

## 🚀 시작하기 (Local Development)

### 1. 패키지 설치
```bash
npm install
```

### 2. 로컬 실행
```bash
npm run dev
```

### 3. 빌드 및 프로덕션 번들 생성
```bash
npm run build
```

---

## ☁️ 배포 가이드 (Firebase Deployment)

본 프로젝트는 Firebase Hosting에 배포하여 운영됩니다.

```bash
# Firebase CLI 로그인
npx firebase login

# Hosting 배포 진행
npx firebase deploy --only hosting
```
