/**
 * 인증 관련 공통 유틸리티
 */
const Auth = {
  // 토큰 키
  TOKEN_KEY: 'accessToken',
  REFRESH_TOKEN_KEY: 'refreshToken',
  USER_KEY: 'user',

  /**
   * 로그인 정보 저장 (localStorage 사용으로 브라우저를 닫아도 유지)
   */
  setAuth(authData) {
    if (authData.accessToken) {
      localStorage.setItem(this.TOKEN_KEY, authData.accessToken);
    }
    if (authData.refreshToken) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, authData.refreshToken);
    }
    if (authData.user) {
      localStorage.setItem(this.USER_KEY, JSON.stringify(authData.user));
    }
    // 쿠키에도 저장 (서버 사이드 인증용)
    if (authData.accessToken) {
      document.cookie = `accessToken=${encodeURIComponent(authData.accessToken)}; path=/; SameSite=Lax; max-age=86400`;
    }
  },

  /**
   * 토큰 가져오기
   */
  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  },

  /**
   * 리프레시 토큰 가져오기
   */
  getRefreshToken() {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  },

  /**
   * 사용자 정보 가져오기
   */
  getUser() {
    const user = localStorage.getItem(this.USER_KEY);
    try {
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },

  /**
   * 로그인 여부 확인
   */
  isAuthenticated() {
    return !!this.getToken();
  },

  /**
   * 로그아웃 (모든 인증 정보 삭제)
   */
  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    // 쿠키도 삭제
    document.cookie =
      'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC';
  },

  /**
   * 로그인 페이지로 리다이렉트
   */
  redirectToLogin() {
    this.logout();
    window.location.href = '/';
  },

  /**
   * 인증이 필요한 페이지용 - 토큰 체크
   */
  requireAuth() {
    if (!this.isAuthenticated()) {
      alert('로그인이 필요합니다.');
      this.redirectToLogin();
      return false;
    }
    return true;
  },

  /**
   * 인증된 fetch 요청 (자동으로 토큰 헤더 추가 및 에러 처리)
   */
  async fetch(url, options = {}) {
    const token = this.getToken();

    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers || {}),
      },
      credentials: 'include',
    };

    try {
      const response = await fetch(url, config);

      // 인증 에러 처리
      if (response.status === 401 || response.status === 403) {
        console.error('인증 에러:', response.status);
        alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
        this.redirectToLogin();
        throw new Error('Authentication failed');
      }

      return response;
    } catch (error) {
      // 네트워크 에러는 그대로 throw
      if (error.message === 'Authentication failed') {
        throw error;
      }
      console.error('Request failed:', error);
      throw error;
    }
  },

  /**
   * 인증된 JSON fetch 요청 (응답을 JSON으로 파싱)
   */
  async fetchJson(url, options = {}) {
    const response = await this.fetch(url, options);

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  },

  /**
   * 로그인 API 호출
   */
  async login(loginId, password) {
    const response = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId, password }),
    });

    const data = await response.json().catch(() => ({}));
    return { ok: response.ok, status: response.status, data };
  },

  /**
   * 회원가입 API 호출
   */
  async signup(loginId, password) {
    const response = await fetch('/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId, password }),
    });

    const data = await response.json().catch(() => ({}));
    return { ok: response.ok, status: response.status, data };
  },

  /**
   * 네비게이션 바 렌더링 (포인트 포함)
   */
  async renderNavbar() {
    if (!this.isAuthenticated()) {
      return;
    }

    // body에 has-navbar 클래스 추가
    document.body.classList.add('has-navbar');

    // navbar HTML 생성
    const navbar = document.createElement('div');
    navbar.className = 'navbar';
    navbar.innerHTML = `
      <a href="/products" class="navbar-logo">SHOPPE</a>
      <div class="navbar-right">
        <div class="navbar-points-v8" title="내 포인트 잔액">
          <span class="navbar-points-icon">✨</span>
          <span class="navbar-points-value" id="navbar-points-value">...</span>
          <span class="navbar-points-label">P</span>
        </div>
        <button class="navbar-logout" id="navbar-logout-btn">로그아웃</button>
      </div>
    `;

    // body 시작 부분에 삽입
    document.body.insertBefore(navbar, document.body.firstChild);

    // 로그아웃 버튼 이벤트
    document
      .getElementById('navbar-logout-btn')
      .addEventListener('click', () => {
        if (confirm('로그아웃하시겠습니까?')) {
          this.logout();
          window.location.href = '/';
        }
      });

    // 포인트 조회
    this.loadPoints();
  },

  /**
   * 포인트 조회 및 표시
   */
  async loadPoints() {
    try {
      const data = await this.fetchJson('/api/points/balance');
      const pointsElement = document.getElementById('navbar-points-value');
      if (pointsElement && data.balance !== undefined) {
        pointsElement.textContent = data.balance.toLocaleString('ko-KR');
      }
    } catch (error) {
      console.error('포인트 조회 실패:', error);
      const pointsElement = document.getElementById('navbar-points-value');
      if (pointsElement) {
        pointsElement.textContent = '0';
      }
    }
  },
};

// 전역으로 노출
window.Auth = Auth;
