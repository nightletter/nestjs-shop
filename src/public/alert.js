/**
 * Custom Alert Module
 * alert() 대신 사용하는 예쁜 알림 모달
 */

const Alert = {
  /**
   * 포인트 적립 알림 표시
   * @param {number} points - 적립된 포인트
   */
  showPointsEarned(points) {
    this.show({
      type: 'points',
      title: '포인트 적립 완료! 🎉',
      message: `${points.toLocaleString('ko-KR')}P가 적립되었습니다`,
      icon: '💰',
      confirmText: '확인',
    });
  },

  /**
   * 일반 알림 표시
   * @param {Object} options - 알림 옵션
   * @param {string} options.type - 알림 타입 (success, error, info, warning, points)
   * @param {string} options.title - 제목
   * @param {string} options.message - 메시지
   * @param {string} options.icon - 아이콘 (emoji)
   * @param {string} options.confirmText - 확인 버튼 텍스트
   * @param {Function} options.onConfirm - 확인 버튼 클릭 콜백
   */
  show(options = {}) {
    const {
      type = 'info',
      title = '알림',
      message = '',
      icon = 'ℹ️',
      confirmText = '확인',
      onConfirm = null,
    } = options;

    // 기존 알림이 있으면 제거
    this.close();

    // 오버레이 생성
    const overlay = document.createElement('div');
    overlay.className = 'alert-overlay';
    overlay.id = 'customAlertOverlay';

    // 모달 생성
    const modal = document.createElement('div');
    modal.className = `alert-modal alert-${type}`;

    // 아이콘 배경색 결정
    const iconBgColors = {
      success: 'linear-gradient(135deg, #27ae60 0%, #229954 100%)',
      error: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
      warning: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)',
      info: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
      points: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    };

    modal.innerHTML = `
      <div class="alert-icon" style="background: ${iconBgColors[type] || iconBgColors.info}">
        <span class="alert-icon-emoji">${icon}</span>
      </div>
      <h3 class="alert-title">${title}</h3>
      <p class="alert-message">${message}</p>
      <button class="alert-confirm-btn">${confirmText}</button>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // 애니메이션 시작
    requestAnimationFrame(() => {
      overlay.classList.add('alert-visible');
      modal.classList.add('alert-visible');
    });

    // 확인 버튼 클릭 이벤트
    const confirmBtn = modal.querySelector('.alert-confirm-btn');
    confirmBtn.addEventListener('click', () => {
      if (onConfirm) {
        onConfirm();
      }
      this.close();
    });

    // 오버레이 클릭 시 닫기 (optional)
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        if (onConfirm) {
          onConfirm();
        }
        this.close();
      }
    });

    // ESC 키로 닫기
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        this.close();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  },

  /**
   * 성공 알림
   */
  success(message, title = '성공') {
    this.show({
      type: 'success',
      title,
      message,
      icon: '✅',
    });
  },

  /**
   * 에러 알림
   */
  error(message, title = '오류') {
    this.show({
      type: 'error',
      title,
      message,
      icon: '❌',
    });
  },

  /**
   * 경고 알림
   */
  warning(message, title = '경고') {
    this.show({
      type: 'warning',
      title,
      message,
      icon: '⚠️',
    });
  },

  /**
   * 정보 알림
   */
  info(message, title = '안내') {
    this.show({
      type: 'info',
      title,
      message,
      icon: 'ℹ️',
    });
  },

  /**
   * 알림 닫기
   */
  close() {
    const overlay = document.getElementById('customAlertOverlay');
    if (overlay) {
      const modal = overlay.querySelector('.alert-modal');

      // 애니메이션과 함께 닫기
      overlay.classList.remove('alert-visible');
      if (modal) {
        modal.classList.remove('alert-visible');
      }

      setTimeout(() => {
        overlay.remove();
      }, 300);
    }
  },
};
