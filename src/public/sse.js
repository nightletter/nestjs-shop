/**
 * SSE (Server-Sent Events) 클라이언트 모듈
 * 주문 이벤트 실시간 수신을 위한 재사용 가능한 모듈
 */

const SSE = {
  eventSource: null,
  listeners: {},

  /**
   * SSE 연결 열기
   * @param {string} orderId - 주문 ID
   * @param {Object} options - 옵션
   * @param {Function} options.onOpen - 연결 성공 콜백
   * @param {Function} options.onMessage - 메시지 수신 콜백
   * @param {Function} options.onError - 에러 발생 콜백
   * @returns {EventSource|null} EventSource 객체 또는 null
   */
  connect(userId, options = {}) {
    if (this.eventSource) {
      console.warn(
        '이미 SSE 연결이 열려있습니다. 기존 연결을 종료하고 새로 연결합니다.',
      );
      this.disconnect();
    }

    if (!userId) {
      console.error('주문 ID가 필요합니다.');
      return null;
    }

    try {
      const url = `/api/notifications/sse`;
      this.eventSource = new EventSource(url);

      // 연결 성공 핸들러
      this.eventSource.onopen = (event) => {
        console.log('✅ SSE 연결 성공:', userId);
        if (options.onOpen) {
          options.onOpen(event);
        }
      };

      // 메시지 수신 핸들러
      this.eventSource.onmessage = (event) => {
        console.log('📨 SSE 메시지 수신:', event.data);

        try {
          const data = JSON.parse(event.data);
          // console.log('주문 이벤트:', data);

          // 기본 메시지 핸들러
          if (options.onMessage) {
            options.onMessage(data);
          }

          // 등록된 이벤트 타입별 리스너 호출
          if (data.type && this.listeners[data.type]) {
            this.listeners[data.type].forEach((callback) => callback(data));
          }

          // 모든 이벤트에 대한 리스너 호출
          if (this.listeners['*']) {
            this.listeners['*'].forEach((callback) => callback(data));
          }
        } catch (error) {
          console.error('SSE 메시지 파싱 오류:', error);
        }
      };

      // 에러 핸들러
      this.eventSource.onerror = (error) => {
        console.error('❌ SSE 연결 오류:', error);

        if (options.onError) {
          options.onError(error);
        }

        // 연결 끊김 또는 오류 시 자동 종료
        if (this.eventSource.readyState === EventSource.CLOSED) {
          console.log('SSE 연결이 닫혔습니다.');
          this.disconnect();
        }
      };

      return this.eventSource;
    } catch (error) {
      console.error('SSE 연결 생성 실패:', error);
      return null;
    }
  },

  /**
   * 특정 이벤트 타입에 대한 리스너 등록
   * @param {string} eventType - 이벤트 타입 (예: 'payment.completed', 'order.shipped') 또는 '*' (모든 이벤트)
   * @param {Function} callback - 콜백 함수
   */
  on(eventType, callback) {
    if (!this.listeners[eventType]) {
      this.listeners[eventType] = [];
    }
    this.listeners[eventType].push(callback);
  },

  /**
   * 특정 이벤트 타입의 리스너 제거
   * @param {string} eventType - 이벤트 타입
   * @param {Function} callback - 제거할 콜백 함수
   */
  off(eventType, callback) {
    if (!this.listeners[eventType]) return;

    if (callback) {
      this.listeners[eventType] = this.listeners[eventType].filter(
        (cb) => cb !== callback,
      );
    } else {
      // 콜백이 없으면 해당 이벤트 타입의 모든 리스너 제거
      delete this.listeners[eventType];
    }
  },

  /**
   * SSE 연결 종료
   */
  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      console.log('SSE 연결 종료');
    }
    // 리스너도 초기화
    this.listeners = {};
  },

  /**
   * 현재 연결 상태 확인
   * @returns {boolean} 연결 여부
   */
  isConnected() {
    return this.eventSource && this.eventSource.readyState === EventSource.OPEN;
  },

  /**
   * 자동 정리 설정 (페이지 언로드 시)
   */
  setupAutoCleanup() {
    window.addEventListener('beforeunload', () => {
      this.disconnect();
    });
  },
};

// 페이지 언로드 시 자동 정리
SSE.setupAutoCleanup();
