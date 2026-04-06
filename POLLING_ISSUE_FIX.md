# Complete.html 폴링 이슈 수정

## 🐛 문제점

**이슈:** 이미 처리된 결제건에서도 폴링이 계속 발생

**발생 상황:**
1. 결제 완료 후 complete.html 진입
2. 폴링으로 상태 확인 → "COMPLETED"
3. 페이지 새로고침 또는 뒤로가기 후 재방문
4. **문제:** 이미 완료된 주문인데도 폴링이 다시 시작됨

**원인:**
```javascript
// 기존 로직
if (!alreadyConfirmed) {
  confirm();  // confirm API 호출 후 폴링 시작
  sessionStorage.setItem(confirmKey, 'true');
} else {
  startPolling();  // 바로 폴링 시작 ← 문제!
}
```

- 페이지를 재방문하면 `alreadyConfirmed`가 true
- 주문 상태 확인 없이 바로 `startPolling()` 호출
- 이미 완료된 주문이어도 불필요한 폴링 발생

## ✅ 해결 방법

**개선된 로직:**

### 1. 페이지 초기화 시 주문 상태 먼저 확인

```javascript
async function initializePage() {
  const orderId = localStorage.getItem('currentOrderId');
  
  // 1단계: 현재 주문 상태 확인
  const response = await Auth.fetch(`/api/order/${orderId}/status`);
  const data = await response.json();
  
  // 2단계: 이미 완료/실패한 주문이면 바로 UI 표시
  if (data.status === 'COMPLETED') {
    handleOrderStatus(data.status, data.totalAmount);
    await showSuccess();
    return;  // 폴링 시작 안 함!
  } else if (data.status === 'FAILED') {
    handleOrderStatus(data.status, data.totalAmount);
    showError('결제에 실패했습니다.');
    return;  // 폴링 시작 안 함!
  }
  
  // 3단계: 진행 중인 주문만 confirm 및 폴링 시작
  if (!alreadyConfirmed) {
    confirm();
    sessionStorage.setItem(confirmKey, 'true');
  } else {
    startPolling();
  }
}

// 페이지 초기화 실행
initializePage();
```

### 2. 처리 흐름 개선

**시나리오 1: 첫 방문 (진행 중인 주문)**
```
페이지 로드
  ↓
initializePage()
  ↓
주문 상태 확인: "IN_PROGRESS"
  ↓
confirm() 호출
  ↓
startPolling()
  ↓
주문 완료되면 stopPolling()
```

**시나리오 2: 재방문 (이미 완료된 주문)**
```
페이지 로드 (새로고침/뒤로가기)
  ↓
initializePage()
  ↓
주문 상태 확인: "COMPLETED" ✅
  ↓
showSuccess() 바로 호출
  ↓
폴링 시작 안 함! ✅
```

**시나리오 3: 재방문 (진행 중인 주문)**
```
페이지 로드 (새로고침)
  ↓
initializePage()
  ↓
주문 상태 확인: "IN_PROGRESS"
  ↓
alreadyConfirmed = true
  ↓
startPolling() (confirm 스킵)
  ↓
주문 완료되면 stopPolling()
```

## 📊 개선 효과

### Before (문제 상황)
```
새로고침/재방문
  ↓
바로 startPolling() 시작
  ↓
setInterval 실행 (1초마다)
  ↓
이미 "COMPLETED"인데도 10초간 폴링 지속
  ↓
불필요한 API 요청 10회 발생 ❌
```

### After (개선)
```
새로고침/재방문
  ↓
주문 상태 1회 확인
  ↓
이미 "COMPLETED" 확인
  ↓
바로 완료 UI 표시
  ↓
폴링 시작 안 함 ✅
  ↓
API 요청 1회만 발생 ✅
```

## 🎯 장점

1. **불필요한 폴링 방지**: 이미 완료된 주문은 폴링 시작 안 함
2. **API 호출 감소**: 재방문 시 1회 조회로 완료
3. **UX 개선**: 즉시 완료 UI 표시 (폴링 대기 시간 없음)
4. **서버 부하 감소**: 불필요한 반복 요청 제거

## 📝 변경 파일

- `src/views/complete.html`
  - `initializePage()` 함수 추가
  - 페이지 진입 시 주문 상태 확인 로직 추가
  - 완료/실패 주문은 폴링 스킵

## ✅ 테스트 케이스

- [ ] 첫 방문 (진행 중 주문) → 폴링 정상 작동
- [ ] 페이지 새로고침 (완료된 주문) → 폴링 없이 바로 완료 UI 표시
- [ ] 뒤로가기 후 재방문 (완료된 주문) → 폴링 없이 바로 완료 UI 표시
- [ ] 페이지 새로고침 (진행 중 주문) → 폴링 재시작
- [ ] 실패한 주문 재방문 → 폴링 없이 바로 실패 UI 표시

## 🔧 기술적 세부사항

**중복 폴링 방지 메커니즘:**
1. `initializePage()`에서 상태 확인
2. 완료/실패 상태면 `return`으로 함수 종료
3. `confirm()` 및 `startPolling()` 실행 안 됨
4. 불필요한 `setInterval` 생성 방지

**에러 처리:**
- 초기 상태 조회 실패 시 에러 로그만 출력
- 기존 로직(confirm/polling) 계속 진행하여 안정성 유지
