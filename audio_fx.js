/* 0. 통합 오디오 엔진 (사운드 합성 및 마스터 볼륨 제어) */
  const audioCtx = (window.AudioContext || window.webkitAudioContext) ? new (window.AudioContext || window.webkitAudioContext)() : null;
  let masterGainNode = null;

  function getMasterGainNode() {
    if (!audioCtx) return null;
    if (!masterGainNode) {
      masterGainNode = audioCtx.createGain();
      masterGainNode.connect(audioCtx.destination);
    }
    return masterGainNode;
  }

  /* 환경설정 상태 관리 (기본값: 67% = 1.0x 기존 표준 볼륨, 100% = 1.5x) */
  const SETTINGS_STORAGE_KEY = 'fifth_hand_settings_v1';
  let appSettings = {
    volumePercent: 67,
    chainHighlightEnabled: true
  };

  function getMasterVolumeMultiplier() {
    return (appSettings.volumePercent / 67);
  }

  function updateMasterAudioVolume() {
    if (audioCtx && getMasterGainNode()) {
      const mult = getMasterVolumeMultiplier();
      masterGainNode.gain.setValueAtTime(mult, audioCtx.currentTime);
    }
  }

  function loadSettings() {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.volumePercent !== undefined) appSettings.volumePercent = Math.max(0, Math.min(100, parsed.volumePercent));
        if (parsed.chainHighlightEnabled !== undefined) appSettings.chainHighlightEnabled = Boolean(parsed.chainHighlightEnabled);
      }
    } catch(e) {}
    applySettingsToUI();
    updateMasterAudioVolume();
  }

  function saveSettings() {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(appSettings));
    } catch(e) {}
  }

  function applySettingsToUI() {
    const slider = document.getElementById('slider-master-volume');
    if (slider) slider.value = appSettings.volumePercent;
    updateVolumeLabel(appSettings.volumePercent);
    updateChainHighlightToggleUI();
  }

  function updateChainHighlightToggleUI() {
    const btn = document.getElementById('btn-toggle-chain-highlight');
    const badge = document.getElementById('lbl-chain-highlight-state');
    const isOn = Boolean(appSettings.chainHighlightEnabled);
    if (btn) {
      btn.setAttribute('aria-pressed', isOn ? 'true' : 'false');
      if (isOn) {
        btn.style.background = 'linear-gradient(135deg, #065f46 0%, #059669 100%)';
        btn.style.borderColor = '#34d399';
        btn.style.color = '#ecfdf5';
        btn.innerHTML = '<span>✨ 연쇄 하이라이트 연출 켜짐 (순차 점등 활성화)</span>';
      } else {
        btn.style.background = '#1e293b';
        btn.style.borderColor = '#475569';
        btn.style.color = '#94a3b8';
        btn.innerHTML = '<span>⚪ 연쇄 하이라이트 연출 꺼짐 (즉시 결과만 표시)</span>';
      }
    }
    if (badge) {
      badge.innerText = isOn ? 'ON (켜짐)' : 'OFF (꺼짐)';
      badge.style.color = isOn ? '#6ee7b7' : '#94a3b8';
      badge.style.borderColor = isOn ? '#10b981' : '#475569';
      badge.style.background = isOn ? 'rgba(6, 78, 59, 0.55)' : '#1e293b';
    }
  }

  function toggleChainHighlightSetting() {
    appSettings.chainHighlightEnabled = !appSettings.chainHighlightEnabled;
    if (!appSettings.chainHighlightEnabled && typeof clearChainHighlightTimers === 'function') {
      clearChainHighlightTimers();
    }
    updateChainHighlightToggleUI();
    saveSettings();
    playBeep(appSettings.chainHighlightEnabled ? 660 : 340, 'triangle', 0.1);
  }
  window.toggleChainHighlightSetting = toggleChainHighlightSetting;

  function updateVolumeLabel(val) {
    const lbl = document.getElementById('lbl-volume-percent');
    if (!lbl) return;
    const v = parseInt(val, 10);
    if (v === 0) lbl.innerText = '음소거 (0%)';
    else if (v === 67) lbl.innerText = '67% (기본)';
    else lbl.innerText = `${v}%`;
  }

  function onVolumeSliderChange(val) {
    appSettings.volumePercent = parseInt(val, 10);
    updateVolumeLabel(appSettings.volumePercent);
    updateMasterAudioVolume();
    saveSettings();
  }

  function playTestSound() {
    playBeep(640, 'triangle', 0.12);
  }

  function onSettingNameChange() {
    const bInput = document.getElementById('setting-bearer-name');
    const cInput = document.getElementById('setting-comp-name');
    if (bInput) {
      customBearerName = bInput.value.trim();
      bearerName = customBearerName || pickedClass;
    }
    if (cInput) {
      customCompName = cInput.value.trim();
    }
    refreshUI();
    saveSessionState();
  }

  function openSettingsModal() {
    const m = document.getElementById('settings-modal');
    if (m) {
      m.classList.add('open');
      m.style.display = 'flex';
    }
    const bInput = document.getElementById('setting-bearer-name');
    if (bInput) bInput.value = customBearerName || '';
    const cInput = document.getElementById('setting-comp-name');
    if (cInput) cInput.value = customCompName || '';
    applySettingsToUI();
    playBeep(520, 'sine', 0.08);
  }

  function closeSettingsModal(e) {
    if (e && e.target !== e.currentTarget && e.target.className !== 'popover-close-btn') return;
    const m = document.getElementById('settings-modal');
    if (m) {
      m.classList.remove('open');
      m.style.display = 'none';
    }
    playBeep(320, 'sine', 0.08);
  }

  function ensureAudioUnlocked() {
    if (audioCtx) {
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      } else if (audioCtx.state === 'running') {
        window.removeEventListener('click', ensureAudioUnlocked);
        window.removeEventListener('keydown', ensureAudioUnlocked);
      }
    }
  }
  window.addEventListener('click', ensureAudioUnlocked, { once: false });
  window.addEventListener('keydown', ensureAudioUnlocked, { once: false });

  // DOM 캐시 객체
  const DOM = {};

  function cacheDOMElements() {
    DOM.dicePanel = document.getElementById('dice-panel');
    DOM.diceTotal = document.getElementById('dice-total-display');
    DOM.diceFormula = document.getElementById('dice-formula-display');
    DOM.logBox = document.getElementById('log-box');
    DOM.hpBar = document.getElementById('hp-bar');
    DOM.hpText = document.getElementById('hp-text');
    DOM.shieldBar = document.getElementById('shield-bar');
    DOM.shieldText = document.getElementById('shield-text');
    DOM.heatBar = document.getElementById('heat-bar');
    DOM.heatText = document.getElementById('heat-text');
    DOM.steamFx = document.getElementById('steam-fx');
    DOM.btnExecQueue = document.getElementById('btn-execute-queue');

    DOM.dashTitleName = document.getElementById('dash-title-name');
    DOM.levelBadge = document.getElementById('level-badge');
    DOM.btnLvlDown = document.getElementById('btn-lvl-down');
    DOM.btnLvlUp = document.getElementById('btn-lvl-up');
    DOM.charSummary = document.getElementById('char-summary');
    DOM.bearerAcVal = document.getElementById('bearer-ac-val');
    DOM.bearerDmgBonus = document.getElementById('bearer-dmg-bonus');
    DOM.compAcVal = document.getElementById('comp-ac-val');
    DOM.compDmgBonus = document.getElementById('comp-dmg-bonus');
    DOM.compNameLabel = document.getElementById('comp-name-label');
    DOM.compHpBar = document.getElementById('comp-hp-bar');
    DOM.compHpText = document.getElementById('comp-hp-text');
    DOM.compShieldBar = document.getElementById('comp-shield-bar');
    DOM.compShieldText = document.getElementById('comp-shield-text');
    DOM.pyriteCount = document.getElementById('pyrite-count');
    DOM.potionCount = document.getElementById('potion-count');
    DOM.deathStackCount = document.getElementById('death-stack-count');
    DOM.headerPyrite = document.getElementById('header-pyrite');
    DOM.headerPotion = document.getElementById('header-potion');
    DOM.compBtnC = document.getElementById('comp-btn-c');

    DOM.compBtnA = document.getElementById('comp-btn-a');
    DOM.compBtnB = document.getElementById('comp-btn-b');
    DOM.senChargeTray = document.getElementById('sen-charge-tray');
    DOM.senDots = [1, 2, 3].map(i => document.getElementById(`sen-dot-${i}`));
    DOM.btnResumeSession = document.getElementById('btn-resume-session');

    DOM.skillCards = {};
    DOM.skillCircles = {};
    DOM.skillNames = {};
    DOM.skillCosts = {};
    DOM.skillSubs = {};
    DOM.skillTips = {};
    DOM.skillPopups = {};
    [0, 1, 2, 3, 4].forEach(idx => {
      DOM.skillCards[idx] = document.getElementById(`card-bearer-${idx}`);
      DOM.skillCircles[idx] = document.getElementById(`circle-${idx}`);
      DOM.skillNames[idx] = document.getElementById(`name-${idx}`);
      DOM.skillCosts[idx] = document.getElementById(`cost-${idx}`);
      DOM.skillSubs[idx] = document.getElementById(`sub-${idx}`);
      DOM.skillTips[idx] = document.getElementById(`tip-${idx}`);
      DOM.skillPopups[idx] = document.getElementById(`popup-bearer-${idx}`);
    });

    DOM.compWraps = {};
    DOM.compBtns = {};
    DOM.compTips = {};
    DOM.compPopups = {};
    ['a', 'b', 'c'].forEach(tag => {
      const upper = tag.toUpperCase();
      DOM.compWraps[upper] = document.getElementById(`wrap-comp-${upper}`);
      DOM.compBtns[tag] = document.getElementById(`comp-btn-${tag}`);
      DOM.compTips[tag] = document.getElementById(`comp-tip-${tag}`);
      DOM.compPopups[upper] = document.getElementById(`popup-comp-${upper}`);
    });
    DOM.compWraps['HEAT'] = document.getElementById('wrap-comp-HEAT');
    DOM.compBtns['heat'] = document.getElementById('comp-btn-heat');
  }
  window.addEventListener('DOMContentLoaded', cacheDOMElements);

  function playBeep(freq = 440, type = 'sine', dur = 0.1) {
    if (!audioCtx) return;
    try {
      ensureAudioUnlocked();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
      osc.connect(gain);
      gain.connect(getMasterGainNode() || audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + dur);
    } catch(e) {}
  }

  function playHeartbeatSound() {
    if (!audioCtx) return;
    try {
      ensureAudioUnlocked();
      const now = audioCtx.currentTime;
      const osc1 = audioCtx.createOscillator(), gain1 = audioCtx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(75, now);
      osc1.frequency.exponentialRampToValueAtTime(32, now + 0.14);
      gain1.gain.setValueAtTime(0.45, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc1.connect(gain1);
      gain1.connect(getMasterGainNode() || audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.14);
    } catch(e) {}
  }

  
  /* 스킬 선택 시 탑뷰(Top-Down) 대시보드 바닥에 쾅 쳐박히는 절도 있는 헤비 임팩트 사운드 & 크랙 연출 */
  let slamNoiseBuffer = null;
  function getSlamNoiseBuffer() {
    if (!audioCtx) return null;
    if (slamNoiseBuffer) return slamNoiseBuffer;
    const len = Math.floor(audioCtx.sampleRate * 0.08);
    const buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const env = Math.pow(1 - (i / len), 1.8);
      data[i] = (Math.random() * 2 - 1) * env;
    }
    slamNoiseBuffer = buf;
    return slamNoiseBuffer;
  }

  function playSkillSlamSound(isUnqueue = false) {
    if (!audioCtx) return;
    try {
      ensureAudioUnlocked();
      const now = audioCtx.currentTime;
      const dest = getMasterGainNode() || audioCtx.destination;

      if (isUnqueue) {
        // 큐 해제 시: 짧고 절도 있는 저음 철컥 릴리즈
        const relOsc = audioCtx.createOscillator();
        const relGain = audioCtx.createGain();
        relOsc.type = 'triangle';
        relOsc.frequency.setValueAtTime(95, now);
        relOsc.frequency.exponentialRampToValueAtTime(32, now + 0.075);
        relGain.gain.setValueAtTime(0.32, now);
        relGain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);
        relOsc.connect(relGain);
        relGain.connect(dest);
        relOsc.start(now);
        relOsc.stop(now + 0.08);
        return;
      }

      // 1) 초저음 서브베이스 수직 타격 (통 튀는 고음 없이 아래로 묵직하게 꽂히는 저음 펀치)
      const subOsc = audioCtx.createOscillator();
      const subGain = audioCtx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(135, now);
      subOsc.frequency.exponentialRampToValueAtTime(22, now + 0.135);
      subGain.gain.setValueAtTime(0.68, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      subOsc.connect(subGain);
      subGain.connect(dest);
      subOsc.start(now);
      subOsc.stop(now + 0.145);

      // 2) 중저음 바디 슬램 (묵직한 석판/강철 타격 질감)
      const bodyOsc = audioCtx.createOscillator();
      const bodyGain = audioCtx.createGain();
      bodyOsc.type = 'triangle';
      bodyOsc.frequency.setValueAtTime(92, now);
      bodyOsc.frequency.exponentialRampToValueAtTime(18, now + 0.105);
      bodyGain.gain.setValueAtTime(0.46, now);
      bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
      bodyOsc.connect(bodyGain);
      bodyGain.connect(dest);
      bodyOsc.start(now);
      bodyOsc.stop(now + 0.115);

      // 3) 파열 노이즈 트랜지언트 (대시보드 표면에 쾅 박히며 멈추는 절도 있는 타격 어택)
      const nBuf = getSlamNoiseBuffer();
      if (nBuf) {
        const noiseSrc = audioCtx.createBufferSource();
        noiseSrc.buffer = nBuf;
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(820, now);
        filter.frequency.exponentialRampToValueAtTime(130, now + 0.065);
        const nGain = audioCtx.createGain();
        nGain.gain.setValueAtTime(0.55, now);
        nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
        noiseSrc.connect(filter);
        filter.connect(nGain);
        nGain.connect(dest);
        noiseSrc.start(now);
        noiseSrc.stop(now + 0.07);
      }
    } catch(e) {}
  }

  function triggerSkillSlamImpact(cardEl, isUnqueue = false) {
    playSkillSlamSound(isUnqueue);
    if (!cardEl) return;

    cardEl.classList.remove('skill-slam-impact');
    const oldFx = cardEl.querySelector('.skill-slam-fx-wrap');
    if (oldFx) oldFx.remove();
    void cardEl.offsetWidth;
    cardEl.classList.add('skill-slam-impact');

    if (!isUnqueue) {
      const fxWrap = document.createElement('div');
      fxWrap.className = 'skill-slam-fx-wrap';
      fxWrap.innerHTML = `
        <div class="skill-slam-ring"></div>
      `;
      cardEl.appendChild(fxWrap);
      setTimeout(() => {
        if (fxWrap.parentNode) fxWrap.remove();
      }, 360);

      const panelBox = cardEl.closest('.panel-box');
      if (panelBox) {
        panelBox.classList.remove('panel-floor-tremor');
        void panelBox.offsetWidth;
        panelBox.classList.add('panel-floor-tremor');
        setTimeout(() => panelBox.classList.remove('panel-floor-tremor'), 210);
      }
    }

    setTimeout(() => {
      cardEl.classList.remove('skill-slam-impact');
    }, 300);
  }

  function playDiceRollTick(step, totalSteps) {
    if (!audioCtx) return;
    try {
      ensureAudioUnlocked();
      const now = audioCtx.currentTime;
      const dest = getMasterGainNode() || audioCtx.destination;
      const progress = step / Math.max(1, totalSteps - 1);

      // 주사위가 화면 가까이로 다가올수록 음고와 존재감이 커지는 입체 클래터 사운드
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      const baseFreq = 210 + (progress * 320) + ((step % 2) * 35);
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.58, now + 0.036);

      const vol = 0.09 + (progress * 0.16);
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.036);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + 0.038);
    } catch(e) {}
  }

  function playDiceLandSound(rawOrCrit = false) {
    if (!audioCtx) return;
    try {
      ensureAudioUnlocked();
      const now = audioCtx.currentTime;
      const dest = getMasterGainNode() || audioCtx.destination;
      const raw = (typeof rawOrCrit === 'number') ? rawOrCrit : (rawOrCrit ? 20 : 10);

      // 1) 공통 테이블 슬램(착지 타격) 저음 임팩트
      const thudOsc = audioCtx.createOscillator(), thudGain = audioCtx.createGain();
      thudOsc.type = 'triangle';
      const startFreq = (raw === 20 || raw === 1) ? 220 : ((raw >= 16 || raw <= 5) ? 195 : 165);
      const thudDur = (raw === 20 || raw === 1) ? 0.24 : 0.16;
      const thudVol = (raw === 20 || raw === 1) ? 0.55 : ((raw >= 16 || raw <= 5) ? 0.45 : 0.36);
      thudOsc.frequency.setValueAtTime(startFreq, now);
      thudOsc.frequency.exponentialRampToValueAtTime(26, now + thudDur);
      thudGain.gain.setValueAtTime(thudVol, now);
      thudGain.gain.exponentialRampToValueAtTime(0.001, now + thudDur);
      thudOsc.connect(thudGain);
      thudGain.connect(dest);
      thudOsc.start(now);
      thudOsc.stop(now + thudDur);

      if (raw === 20) {
        // 👑 자연 20: 초특급 묵직한 타격음 + 4단 천상의 금빛 팡파르
        const punchOsc = audioCtx.createOscillator(), punchGain = audioCtx.createGain();
        punchOsc.type = 'sawtooth';
        punchOsc.frequency.setValueAtTime(130, now);
        punchOsc.frequency.exponentialRampToValueAtTime(38, now + 0.22);
        punchGain.gain.setValueAtTime(0.28, now);
        punchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        punchOsc.connect(punchGain);
        punchGain.connect(dest);
        punchOsc.start(now);
        punchOsc.stop(now + 0.22);

        [523.25, 659.25, 783.99, 1046.50, 1567.98].forEach((freq, idx) => {
          const critOsc = audioCtx.createOscillator(), critGain = audioCtx.createGain();
          critOsc.type = idx < 3 ? 'triangle' : 'sine';
          const t0 = now + (idx * 0.042);
          critOsc.frequency.setValueAtTime(freq, t0);
          critGain.gain.setValueAtTime(0.22, t0);
          critGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.48);
          critOsc.connect(critGain);
          critGain.connect(dest);
          critOsc.start(t0);
          critOsc.stop(t0 + 0.48);
        });
      } else if (raw === 1) {
        // 💀 자연 1: 심연 추락 역충격 + 유리 파열/불협화음 둠 드롭
        [146.83, 103.83, 73.42].forEach((freq, idx) => {
          const doomOsc = audioCtx.createOscillator(), doomGain = audioCtx.createGain();
          doomOsc.type = 'sawtooth';
          const t0 = now + (idx * 0.045);
          doomOsc.frequency.setValueAtTime(freq, t0);
          doomOsc.frequency.exponentialRampToValueAtTime(freq * 0.48, t0 + 0.38);
          doomGain.gain.setValueAtTime(0.24, t0);
          doomGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.38);
          doomOsc.connect(doomGain);
          doomGain.connect(dest);
          doomOsc.start(t0);
          doomOsc.stop(t0 + 0.39);
        });
      } else if (raw >= 16) {
        // ✨ 자연 16~19 고점: 시원한 상향 파워 트라이어드 코드
        [523.25, 659.25, 783.99].forEach((freq, idx) => {
          const hiOsc = audioCtx.createOscillator(), hiGain = audioCtx.createGain();
          hiOsc.type = 'triangle';
          const t0 = now + (idx * 0.035);
          hiOsc.frequency.setValueAtTime(freq, t0);
          hiGain.gain.setValueAtTime(0.16, t0);
          hiGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.28);
          hiOsc.connect(hiGain);
          hiGain.connect(dest);
          hiOsc.start(t0);
          hiOsc.stop(t0 + 0.28);
        });
      } else if (raw <= 5) {
        // ⚠️ 자연 2~5 저점: 묵직하고 위태로운 저음 금속성 울림
        [164.81, 123.47].forEach((freq, idx) => {
          const loOsc = audioCtx.createOscillator(), loGain = audioCtx.createGain();
          loOsc.type = 'sawtooth';
          const t0 = now + (idx * 0.04);
          loOsc.frequency.setValueAtTime(freq, t0);
          loOsc.frequency.exponentialRampToValueAtTime(freq * 0.72, t0 + 0.24);
          loGain.gain.setValueAtTime(0.15, t0);
          loGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.24);
          loOsc.connect(loGain);
          loGain.connect(dest);
          loOsc.start(t0);
          loOsc.stop(t0 + 0.25);
        });
      }
    } catch(e) {}
  }

  let currentDiceInterval = null;
  let currentDiceStepTimeout = null;
  let chainHighlightTimers = [];
  let chainHighlightQueue = [];
  let isChainHighlightActive = false;

  function clearChainHighlightTimers() {
    if (chainHighlightTimers.length > 0) {
      chainHighlightTimers.forEach(t => clearTimeout(t));
      chainHighlightTimers = [];
    }
    chainHighlightQueue = [];
    isChainHighlightActive = false;
    document.querySelectorAll(
      '.chain-ui-pulse-gold, .chain-ui-pulse-red, .chain-ui-pulse-blue, .chain-ui-pulse-green, .chain-ui-pulse-purple, .chain-hit-impact, .chain-chip-pop'
    ).forEach(el => {
      el.classList.remove(
        'chain-ui-pulse-gold', 'chain-ui-pulse-red', 'chain-ui-pulse-blue', 'chain-ui-pulse-green', 'chain-ui-pulse-purple',
        'chain-hit-impact', 'chain-chip-pop'
      );
    });
    document.querySelectorAll('.log-item.chain-running').forEach(el => {
      el.classList.remove('chain-running');
    });
    document.querySelectorAll('.log-seq-token.seq-active').forEach(el => {
      el.classList.remove('seq-active');
      el.classList.add('seq-done');
    });
  }
  window.clearChainHighlightTimers = clearChainHighlightTimers;

  function clearAllSkillTimers() {
    if (currentDiceInterval) {
      clearInterval(currentDiceInterval);
      currentDiceInterval = null;
    }
    if (currentDiceStepTimeout) {
      clearTimeout(currentDiceStepTimeout);
      currentDiceStepTimeout = null;
    }
  }

  let shouldDemoteLogsOnNextAction = false;

  function demoteOldRoundLogs() {
    const box = DOM.logBox || document.getElementById('log-box');
    if (!box) return;
    box.querySelectorAll('.log-item.current-round-log').forEach(el => {
      el.classList.remove('current-round-log');
    });
    shouldDemoteLogsOnNextAction = false;
  }

  /* ==========================================================================
     [개편] 인과관계 교차 연쇄 하이라이트 & 타격감 엔진
     - 로그 문구(원인) 점등 ➔ 실제 변화된 적 HP / 아군 게이지 / 상태 칩(결과) 타격·강조를
       순차적으로 교차 보여주어 플레이어가 어디가 왜 바뀌었는지 직관적으로 식별하게 함
     ========================================================================== */
  function playChainHitImpactSound() {
    if (!audioCtx) return;
    try {
      ensureAudioUnlocked();
      const now = audioCtx.currentTime;
      const dest = getMasterGainNode() || audioCtx.destination;

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(28, now + 0.13);
      gain.gain.setValueAtTime(0.38, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.135);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + 0.14);

      const nBuf = getSlamNoiseBuffer();
      if (nBuf) {
        const nSrc = audioCtx.createBufferSource();
        nSrc.buffer = nBuf;
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(620, now);
        const nGain = audioCtx.createGain();
        nGain.gain.setValueAtTime(0.32, now);
        nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        nSrc.connect(filter);
        filter.connect(nGain);
        nGain.connect(dest);
        nSrc.start(now);
        nSrc.stop(now + 0.065);
      }
    } catch (e) {}
  }

  function findMatchingStatusChips(tokenText, isCompContext, enemyUid) {
    const clean = String(tokenText || '');
    const matched = [];
    const keywords = [
      '방어 약화', '방어약화', '행동 제약', '행동제약', '지속 피해', '지속피해',
      '쳐내고 베기', '백색 철벽', '결사의 수호',
      '스프링보드', '무결점의 방어', '군신의 혼', '성염 인챈트', '무형보', '비연참',
      '질풍참', '비월절명', '회귀일원', '마력 순환', '성염 증폭', '불꽃의 비',
      '타오르는 칼날', '신기루 장막', '과부하 조광', '태양의 부름', '유리함', '불리함',
      '허상의 디딤돌', '원격 투영', '빛의 굴절', '육탄 엄호', '투지 발휘', '전열의 고함',
      '복수의 칼날', '불굴의 방파제', '공명 증폭', '생사 역전', '마탄의 잔향', '단죄의 잔향',
      '역장 패링', '무영의 검무', '약초 연무', '재정비', '비추는 불꽃', '태우는 불꽃',
      '성염 암벽', '백광의 은신', '백광의 잔상', '꿰뚫린 검', '육탄전', '배후 도약',
      '배후 강타', '마력 역류', '노출된 불빛', '표적 조명', '임계', '경고', '도발', '교란'
    ];
    const hitKw = keywords.filter(kw => clean.includes(kw));

    // 의미 기반 매칭 보조 플래그 (토큰 문구에 스킬명이 생략되어 있더라도 효과 설명으로 실제 버프 칩/배지 매칭)
    const isReductionEffect = /피격\s*(?:피해\s*)?-?\d+\s*(?:감소|경감)/.test(clean);
    const isAcBuffEffect = /이번R\s*AC\s*[+-]\d+|AC\s*[+-]\d+/.test(clean);
    const isNextAtkBuffEffect = /다음R\s*공격\s*피해\s*\+\d+|차턴\s*\+\d+|다음\s*(?:1회\s*)?(?:직접\s*)?공격.*\+\d+/.test(clean);
    const isEnemyAtkDownEffect = /공격력\s*-\d+|공\s*-\d+|공격\s*피해량\s*-\d+/.test(clean);
    const isEnemyDotEffect = /지속\s*피해|DoT/.test(clean);
    const isEnemyWeakEffect = /방어\s*약화|방약/.test(clean);
    const isEnemyBindEffect = /행동\s*제약/.test(clean) && !/면역/.test(clean);
    const isEnemyDisEffect = /공격.*\[?불리함\]?\s*강제|명중.*\[?불리함\]?\s*강제/.test(clean);
    const isEnemyTauntEffect = /단일\s*공격\s*유도|도발/.test(clean);
    const isEnemyConfuseEffect = /강제\s*전환|교란/.test(clean);

    const matchEnemyBadgesInCard = (enCard) => {
      if (!enCard) return;
      enCard.querySelectorAll('.enemy-status-badge').forEach(b => {
        const bTxt = b.textContent || '';
        if (hitKw.some(kw => bTxt.includes(kw.replace(/\s+/g, '')) || bTxt.includes(kw)) ||
            (isEnemyAtkDownEffect && bTxt.includes('공격력')) ||
            (isEnemyDotEffect && bTxt.includes('지속피해')) ||
            (isEnemyWeakEffect && bTxt.includes('방어약화')) ||
            (isEnemyBindEffect && bTxt.includes('행동제약')) ||
            (isEnemyDisEffect && bTxt.includes('불리함')) ||
            (isEnemyTauntEffect && bTxt.includes('도발')) ||
            (isEnemyConfuseEffect && bTxt.includes('교란'))) {
          if (!matched.includes(b)) matched.push(b);
        }
      });
    };

    if (enemyUid) {
      matchEnemyBadgesInCard(document.querySelector(`[data-enemy-uid="${enemyUid}"]`));
    } else if (isEnemyAtkDownEffect || isEnemyDotEffect || isEnemyWeakEffect || isEnemyBindEffect || isEnemyDisEffect || isEnemyTauntEffect || isEnemyConfuseEffect) {
      document.querySelectorAll('[data-drop-target="enemy"]').forEach(card => matchEnemyBadgesInCard(card));
    }

    const checkAllyChipMatch = (chip) => {
      const titleEl = chip.querySelector('.status-tooltip-title');
      const descEl = chip.querySelector('.status-tooltip-desc');
      const cTitle = titleEl ? titleEl.textContent : (chip.textContent || '');
      const cDesc = descEl ? descEl.textContent : (chip.textContent || '');
      const cFull = cTitle + ' ' + cDesc;

      if (hitKw.some(kw => cFull.includes(kw) || cFull.includes(kw.replace(/\s+/g, '')))) return true;
      if (isReductionEffect && /피격.*(?:감소|경감)|쳐내고 베기|백색 철벽|결사의 수호|성염 인챈트|육탄 엄호|투지 발휘|전열의 고함|복수의 칼날|불굴의 방파제|무영의 검무|성염 암벽|생사 역전|약초 연무/.test(cFull)) return true;
      if (isAcBuffEffect && /AC\s*[+-]\d+|비연참|질풍참|비월절명|꿰뚫린 검|배후 도약|노출된 불빛/.test(cFull)) return true;
      if (isNextAtkBuffEffect && /차턴|다음.*공격|불꽃의 비|허상의 디딤돌|마탄의 잔향|단죄의 잔향|마력 순환|성염 증폭/.test(cFull)) return true;
      return false;
    };

    const traySelector = isCompContext ? '#comp-status-tray .status-chip' : '#bearer-status-tray .status-chip';
    document.querySelectorAll(traySelector).forEach(chip => {
      if (checkAllyChipMatch(chip) && !matched.includes(chip)) {
        matched.push(chip);
      }
    });

    // 반대쪽 트레이에도 해당 키워드/효과 칩이 있으면 함께 탐색
    if (matched.length === 0) {
      document.querySelectorAll('#bearer-status-tray .status-chip, #comp-status-tray .status-chip').forEach(chip => {
        if (checkAllyChipMatch(chip) && !matched.includes(chip)) {
          matched.push(chip);
        }
      });
    }
    if (matched.length === 0 && hitKw.length > 0) {
      document.querySelectorAll('.enemy-status-badge').forEach(chip => {
        const cTxt = chip.textContent || '';
        if (hitKw.some(kw => cTxt.includes(kw) || cTxt.includes(kw.replace(/\s+/g, ''))) && !matched.includes(chip)) {
          matched.push(chip);
        }
      });
    }
    return matched;
  }

  function isZeroDamageToken(text) {
    const str = String(text || '').trim();
    if (/(?:스침\s*[1-9]|(?<!\d)[1-9]\d*\s*피해|명중!\s*잔여\s*HP)/.test(str)) {
      return false;
    }
    return /(?:(?<!\d)0\s*피해|피해\s*:?\s*0|피격\s*:?\s*0\s*피해|대리\s*흡수\s*:?\s*0\s*피해|피해0|빗나감|완전\s*회피|회피됨|스침\s*없음|피해\s*없음|불발)/.test(str);
  }

  function getAoeEnemyHitSelector(full) {
    if (typeof syncedEnemies !== 'undefined' && Array.isArray(syncedEnemies) && syncedEnemies.length > 0) {
      const hitUids = [];
      for (const en of syncedEnemies) {
        if (!en || !en.uid) continue;
        const escapedName = (en.name || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (escapedName) {
          const missRegex = new RegExp(escapedName + ':\\s*빗나감\\s*\\(\\s*(?:피해\\s*0|0\\s*피해|피해0)\\s*\\)');
          if (missRegex.test(full)) {
            continue; // 완전히 빗나가서 피해 0인 개체는 피격 하이라이트 제외
          }
        }
        hitUids.push(en.uid);
      }
      if (hitUids.length > 0) {
        return hitUids.map(uid => `[data-enemy-uid="${uid}"], [data-enemy-uid="${uid}"] .enemy-card-row1`).join(', ');
      }
    }
    return '[data-drop-target="enemy"], [data-drop-target="enemy"] .enemy-card-row1, .target-enemy-chip, .target-enemy-chip .enemy-card-row1';
  }

  function getAoeEnemyDebuffSelector(full) {
    if (typeof syncedEnemies !== 'undefined' && Array.isArray(syncedEnemies) && syncedEnemies.length > 0) {
      const uids = syncedEnemies.filter(en => en && en.uid && en.hp > 0).map(en => en.uid);
      if (uids.length > 0) {
        return uids.map(uid => `[data-enemy-uid="${uid}"] .enemy-card-row-status, [data-enemy-uid="${uid}"]`).join(', ');
      }
    }
    return '[data-drop-target="enemy"] .enemy-card-row-status, [data-drop-target="enemy"], .target-enemy-chip .enemy-card-row-status, .target-enemy-chip';
  }

  function resolveChainTargetSelector(tokenText, fullPlainText) {
    const t = String(tokenText || '');
    const full = String(fullPlainText || '');

    // 전체 로그에서 타겟 적 탐색
    let contextEnemyUid = null;
    let explicitEnemyInToken = false;
    if (typeof syncedEnemies !== 'undefined' && Array.isArray(syncedEnemies)) {
      for (const en of syncedEnemies) {
        if (en && en.name && t.includes(en.name)) {
          contextEnemyUid = en.uid;
          explicitEnemyInToken = true;
          break;
        }
      }
      // 광역 공격이나 적 전체 대상일 때는 full에서 특정 단일 적을 임의로 뽑지 않음
      if (!contextEnemyUid && !/적\s*전체|광역|모든\s*적/.test(t) && !/적\s*전체|광역/.test(full)) {
        for (const en of syncedEnemies) {
          if (en && en.name && full.includes(en.name)) {
            contextEnemyUid = en.uid;
            break;
          }
        }
      }
    }

    const compNameStr = (typeof getCompName === 'function') ? getCompName() : '동료';
    const hasExplicitCompInToken = t.includes(compNameStr) || /동료|워리어|소서러|마검사|리퍼|데드로|릴리|센|마윤겸/.test(t);
    const hasExplicitBearerInToken = t.includes(bearerName) || /베어러|파이터|검객|메이지|등지기/.test(t);

    const isCompContext = hasExplicitCompInToken || (!hasExplicitBearerInToken && /\[동료/.test(full));
    const isBearerContext = hasExplicitBearerInToken || (!hasExplicitCompInToken && /\[베어러/.test(full));

    // 버프/디버프/상태효과 여부를 먼저 정밀 판별 ("피격 피해 -3 감소", "지속 피해: 2 부여", "다음R 공격 피해 +3", "공격 피해량 -2 경감", "종료 시 ... 3 피해" 등이 피해량 토큰으로 오인되지 않도록 보호)
    const isBuffOrStatusToken = (
      /방어\s*약화|방약|행동\s*제약|지속\s*피해|지속피해|DoT|도발|교란|유리함|불리함|피격\s*(?:피해\s*)?-?\d+\s*(?:감소|경감)|이번R\s*AC\s*[+-]\d+|회피\s*시.*반격|종료\s*시.*피해|다음R\s*공격\s*피해\s*\+\d+|다음\s*(?:1회\s*)?(?:직접\s*)?공격\s*\+\d+|차턴\s*\+\d+|공격력\s*-\d+|공\s*-\d+|공격\s*피해량\s*-\d+|장막|무형보|철벽|수호|패링|엄호|고함|방파제|정화|역류|육탄전|배후|은신|암벽|비연참|질풍참|비월절명|군신의 혼|타오르는 칼날|과부하 조광|스프링보드|무결점|빛의 굴절|원격 투영|생사 역전|약초 연무|마탄의 잔향|단죄의 잔향|쳐내고 베기|성염 인챈트|불꽃의 비/.test(t)
      && !/^피해량\s*:|^광역\s*피해량\s*:|스침\s*\d+\s*피해|➔\s*\[?명중/.test(t.trim())
    );

    // 0) 회피 / 빗나감 / 0 피해 토큰 감지: 타격 임팩트 및 하이라이트 원천 차단 (버프 경감 0 피해 포함)
    const isMissOrZeroDamage = isZeroDamageToken(t);
    if (isMissOrZeroDamage) {
      return { selector: null, color: 'gray', isHitImpact: false };
    }

    const isDamageToken = !isBuffOrStatusToken && !isMissOrZeroDamage && (
      /피해|명중|스침|처치|잔여 HP|타격|치명타|기폭|-?\d+\s*➔\s*HP/.test(t)
    );

    // 1) 실제 타격 피해량 / 명중 / 스침 / 잔여 HP ➔ 적의 HP 또는 피격 아군의 HP (타격감 있는 Hit Impact!)
    if (isDamageToken) {
      // 적의 공격에 아군이 피격된 경우
      if (/적 단일 공격|적 광역 공격|피격!|대리 흡수/.test(full)) {
        if (isCompContext && !hasExplicitBearerInToken) {
          return { selector: '#comp-hp-bar, #comp-resource-panel', color: 'red', isHitImpact: true, isCompContext: true };
        }
        return { selector: '#hp-bar, #bearer-resource-panel', color: 'red', isHitImpact: true, isCompContext: false };
      }
      // 광역 공격 / 적 전체 타격인 경우: 피격된 모든 적 카드를 일괄 하이라이트!
      const isAoeDamage = /적\s*전체|광역|모든\s*적/.test(t) || (!explicitEnemyInToken && /적\s*전체|광역/.test(full));
      if (isAoeDamage) {
        return { selector: getAoeEnemyHitSelector(full), color: 'red', isHitImpact: true, enemyUid: null };
      }

      // 아군이 단일 적을 타격한 경우 -> 해당 적 카드(및 적 HP 줄)에 타격감 임팩트!
      if (contextEnemyUid) {
        return {
          selector: `[data-enemy-uid="${contextEnemyUid}"], [data-enemy-uid="${contextEnemyUid}"] .enemy-card-row1`,
          color: 'red',
          isHitImpact: true,
          enemyUid: contextEnemyUid
        };
      }
      if (/적 전체|광역|모든 적/.test(t) || /적 전체|광역/.test(full)) {
        return { selector: getAoeEnemyHitSelector(full), color: 'red', isHitImpact: true, enemyUid: null };
      }
    }

    // 2) 버프 / 디버프 / 상태 효과 ➔ 베어러·동료 상태창에 추가된 칩 또는 적의 상태 배지 하이라이트!
    if (isBuffOrStatusToken) {
      const isAllySelfBuff = /이번R\s*피격|피격\s*(?:피해\s*)?-?\d+\s*(?:감소|경감)|이번R\s*AC|회피\s*시.*반격|종료\s*시.*피해|다음R\s*공격|베어러\s*다음\s*공격|단죄의\s*잔향|마탄의\s*잔향|마력\s*순환|불꽃의\s*비|성염\s*인챈트|쳐내고\s*베기|백색\s*철벽|결사의\s*수호|무결점의\s*방어|군신의\s*혼|무형보|비연참|질풍참|비월절명|신기루\s*장막|과부하\s*조광|스프링보드|타오르는\s*칼날|허상의\s*디딤돌|빛의\s*굴절|투지\s*발휘|육탄\s*엄호|전열의\s*고함|복수의\s*칼날|불굴의\s*방파제|역장\s*패링|무영의\s*검무|약초\s*연무|생사\s*역전|공명\s*증폭|재정비/.test(t);

      const isEnemyDebuff = !isAllySelfBuff && (
        /방어\s*약화|방약|행동\s*제약|지속\s*피해|지속피해|DoT|전염|공격력\s*-\d+|공\s*-\d+|공격\s*피해량\s*-\d+|강제\s*전환|공격.*\[?불리함\]?\s*강제|명중.*\[?불리함\]?\s*강제/.test(t)
      );

      if (isEnemyDebuff) {
        const isAoeDebuff = /적중한\s*모든|적\s*전체|모든\s*대상|다른\s*모든\s*적/.test(t) || (!explicitEnemyInToken && /적\s*전체|광역/.test(full));
        if (contextEnemyUid && !isAoeDebuff) {
          return {
            selector: `[data-enemy-uid="${contextEnemyUid}"] .enemy-card-row-status, [data-enemy-uid="${contextEnemyUid}"]`,
            color: 'purple',
            isStatusChip: true,
            enemyUid: contextEnemyUid,
            isCompContext: false
          };
        }
        return {
          selector: getAoeEnemyDebuffSelector(full),
          color: 'purple',
          isStatusChip: true,
          enemyUid: null,
          isCompContext: false
        };
      }

      if (hasExplicitBearerInToken && !hasExplicitCompInToken) {
        return {
          selector: '#bearer-status-tray, #bearer-resource-panel',
          color: 'purple',
          isStatusChip: true,
          isCompContext: false,
          enemyUid: contextEnemyUid
        };
      }
      if (hasExplicitCompInToken && !hasExplicitBearerInToken) {
        return {
          selector: '#comp-status-tray, #comp-resource-panel',
          color: 'purple',
          isStatusChip: true,
          isCompContext: true,
          enemyUid: contextEnemyUid
        };
      }
      if (isCompContext && !isBearerContext) {
        return {
          selector: '#comp-status-tray, #comp-resource-panel',
          color: 'purple',
          isStatusChip: true,
          isCompContext: true,
          enemyUid: contextEnemyUid
        };
      }
      return {
        selector: '#bearer-status-tray, #bearer-resource-panel',
        color: 'purple',
        isStatusChip: true,
        isCompContext: false,
        enemyUid: contextEnemyUid
      };
    }

    // 3) 방어막 획득 / 차감 (단, 방어막 무시 피해는 제외)
    const isShieldBypassDmg = /방어막.*무시|무시하고.*피해/.test(t);
    if (!isShieldBypassDmg && /방어막/.test(t)) {
      if (isCompContext && !isBearerContext) {
        return { selector: '#comp-shield-bar, #comp-resource-panel', color: 'blue', isCompContext: true };
      }
      return { selector: '#shield-bar, #bearer-resource-panel', color: 'blue', isCompContext: false };
    }

    // 4) 과열 / 냉각 / 벤트
    if (/과열|냉각|벤트/.test(t)) {
      return { selector: '#heat-bar, #bearer-resource-panel', color: /-\d+|냉각|벤트/.test(t) ? 'blue' : 'red' };
    }

    // 5) HP 회복 / 치유 / 부활
    if (/회복|치유|부활|\+\d+/.test(t) && /HP|생명|회복|치유|부활/.test(t + ' ' + full)) {
      if (isCompContext && !isBearerContext) {
        return { selector: '#comp-hp-bar, #comp-resource-panel', color: 'green', isCompContext: true };
      }
      return { selector: '#hp-bar, #bearer-resource-panel', color: 'green', isCompContext: false };
    }

    // 6) 마탄 차징
    if (/마탄|차징/.test(t)) {
      return { selector: '#sen-charge-tray, #comp-resource-panel', color: 'purple', isCompContext: true };
    }

    // 7) 특정 적 조준 표시 ([🎯바람 도마뱀 A (AC 11)] 등)
    if (contextEnemyUid && (/🎯/.test(t) || (typeof syncedEnemies !== 'undefined' && syncedEnemies.some(e => e && e.name && t.includes(e.name))))) {
      return { selector: `[data-enemy-uid="${contextEnemyUid}"]`, color: 'gold', enemyUid: contextEnemyUid };
    }

    // 8) 휘석 / 영약 / 생환
    if (/휘석|영약|생환/.test(t)) {
      return { selector: '#btn-open-bag', color: 'gold' };
    }

    // 9) 막간의 교감 / 합격기
    if (/비추는 불꽃|태우는 불꽃|합격기/.test(t)) {
      return { selector: '#communion-bar', color: 'gold' };
    }

    // 10) 주사위 굴림값
    if (/^\d+$/.test(t.trim()) || /1d20|2d20|AC\s*\d+/.test(t)) {
      return { selector: '#dice-panel', color: 'gold' };
    }

    return { selector: '#dice-panel', color: 'gold' };
  }

  function pulseDashboardTargetElements(meta, duration = 360) {
    if (!meta || !meta.selector) return;
    const color = meta.color || 'gold';
    const cls = `chain-ui-pulse-${color}`;
    try {
      const els = document.querySelectorAll(meta.selector);
      els.forEach(el => {
        el.classList.remove(
          'chain-ui-pulse-gold', 'chain-ui-pulse-red', 'chain-ui-pulse-blue', 'chain-ui-pulse-green', 'chain-ui-pulse-purple',
          'chain-hit-impact'
        );
        void el.offsetWidth;
        if (meta.isHitImpact) {
          el.classList.add('chain-hit-impact');
        } else {
          el.classList.add(cls);
        }
        const timer = setTimeout(() => {
          el.classList.remove(cls, 'chain-hit-impact');
        }, duration);
        chainHighlightTimers.push(timer);
      });

      // 버프/상태이상 단계일 경우 실제 추가된 상태 칩(.status-chip / .enemy-status-badge)을 찾아 핀포인트 팝업!
      if (meta.isStatusChip) {
        const chips = findMatchingStatusChips(meta.text, meta.isCompContext, meta.enemyUid);
        chips.forEach(chip => {
          chip.classList.remove('chain-chip-pop');
          void chip.offsetWidth;
          chip.classList.add('chain-chip-pop');
          const cTimer = setTimeout(() => {
            chip.classList.remove('chain-chip-pop');
          }, duration);
          chainHighlightTimers.push(cTimer);
        });
      }
    } catch (e) {}
  }

  /* 주사위 비교 수치, 순수 주사위 합산값, 적의 AC 표기 등 불필요한 토큰은 연쇄 하이라이트에서 제외 */
  function isExcludedDiceOrAcToken(cleanText) {
    const t = String(cleanText || '').trim();
    if (!t || t.length < 2) return true;
    // 1) 순수 숫자(주사위 합산 결과값 등: 예 "18", "14") 제외
    if (/^[+-]?\d+$/.test(t)) return true;
    // 2) 주사위 굴림식이나 적 AC 비교 구문(예: "1d20(15)", "9 < AC 11", "주사위 12 ≥ AC 11", "[🎯바람 도마뱀 A (AC 11)]") 제외
    if (/1d20|2d20|\bAC\s*\d+(?!\s*증가|\s*감소)|[<>≤≥]=?\s*AC\b|주사위\s*\d+/i.test(t)) return true;
    // 3) 피해/명중/처치/버프 정보가 없는 단순 타겟 이름표([🎯...]) 제외
    if (/^\[\s*🎯/.test(t) && !/피해|명중|처치|스침|기폭/.test(t)) return true;
    if (/^\[?🎯?\s*개체별\s*판정\]?$/.test(t)) return true;
    // 4) 이미 피해량/명중 판정에 반영된 조건 안내문(중복 하이라이트 방지) 제외
    if (/^\((?:가변 서클|일반 캔트립|직전 라운드 명중 실패 보정|베어러 포함 인텐트 감지|단일 교차 집중|적 전체 광역 참격|순수 \d+\(15\+\) 달성|워리어 포함 인텐트 감지|단독 적 파편 집중|마탄 \d+스택 방출|마탄 \d+스택 산탄|마탄 \d+스택 압축|방어막 무시|.*조건.*감지 ➔ 명중 \[유리함\] 자동 적용|.*감지 ➔ 명중 \[유리함\] 자동 적용)/.test(t)) return true;
    // 5) 피해 0 / 0 피해 / 빗나감 / 완전 회피 등 무효·실패 토큰 제외 (버프 경감 0 피해 포함)
    if (isZeroDamageToken(t)) {
      return true;
    }
    return false;
  }

  function runSequentialChainHighlightOnLogItem(itemEl) {
    if (!itemEl || !appSettings.chainHighlightEnabled) return;
    const rawHtml = itemEl.innerHTML;
    const plainText = itemEl.textContent || '';

    const isCombatOrEffectLog = /공격|피격|회피|피해|회복|방어막|과열|냉각|벤트|치명타|대성공|대실패|장전|개방|투영|교감|합격기|정화|도발|제약|약화|지속 피해|DoT|반격|패링|연성|등불|저해|영약|철벽|수호/.test(plainText);
    if (!isCombatOrEffectLog) return;

    if (isChainHighlightActive) {
      chainHighlightQueue.push(itemEl);
      return;
    }

    let tokenIdx = 0;
    const tokenMetaList = [];

    const registerToken = (fullMatch, innerHtml) => {
      const cleanInner = innerHtml.replace(/<[^>]+>/g, '').trim();
      if (isExcludedDiceOrAcToken(cleanInner)) {
        return fullMatch;
      }
      const isHeaderToken = (tokenIdx === 0 && /^\[[^\]]+\]$/.test(cleanInner));
      const resolveFn = (typeof window !== 'undefined' && typeof window.resolveChainTargetSelector === 'function')
        ? window.resolveChainTargetSelector
        : resolveChainTargetSelector;
      const targetInfo = resolveFn(cleanInner, plainText);
      const idx = tokenIdx++;
      const color = isHeaderToken ? 'gold' : (targetInfo.color || 'gold');
      tokenMetaList.push({
        idx,
        text: cleanInner,
        isHeaderToken: isHeaderToken,
        selector: targetInfo.selector,
        color: color,
        isHitImpact: Boolean(targetInfo.isHitImpact),
        isStatusChip: Boolean(targetInfo.isStatusChip),
        isCompContext: Boolean(targetInfo.isCompContext),
        enemyUid: targetInfo.enemyUid || null
      });
      return `<span class="log-seq-token seq-color-${color}" data-seq-idx="${idx}">${fullMatch}</span>`;
    };

    // <b>...</b> 태그와 부가 효과 <span>(..., ...)</span> 구문을 문서 순서대로 캡처
    const tokenRegex = /(<b(?:\s+[^>]*)?>[\s\S]*?<\/b>)|(<span\s+style="color:\s*#[0-9a-fA-F]{3,6};?"[^>]*>\([^<]+\)<\/span>)/gi;
    const enhancedHtml = rawHtml.replace(tokenRegex, (match) => registerToken(match, match));

    if (tokenMetaList.length === 0) {
      isChainHighlightActive = false;
      while (chainHighlightQueue.length > 0) {
        const next = chainHighlightQueue.shift();
        if (next && next.isConnected) {
          runSequentialChainHighlightOnLogItem(next);
          break;
        }
      }
      return;
    }

    itemEl.innerHTML = enhancedHtml;
    const tokenSpans = itemEl.querySelectorAll('.log-seq-token');    if (tokenSpans.length === 0) {
      isChainHighlightActive = false;
      while (chainHighlightQueue.length > 0) {
        const next = chainHighlightQueue.shift();
        if (next && next.isConnected) {
          runSequentialChainHighlightOnLogItem(next);
          break;
        }
      }
      return;
    }

    isChainHighlightActive = true;

    // [순차 타임라인 구성 (0.4초 = 400ms 간격)]
    // 예: 0.0s 로그의 [베어러 공격] 반짝! -> 0.4s 로그의 피해 반짝! -> 0.8s 에너미 카드 반짝! -> 1.2s 로그의 버프 반짝! -> 1.6s 아군의 상태이상 반짝!
    const beatInterval = 400;
    const timelineSteps = [];

    tokenMetaList.forEach((meta, i) => {
      if (meta.isHeaderToken) {
        // 첫 머리말([베어러 공격], [동료 공격] 등)은 로그 단독 점등 스텝(0.0s)으로 배치
        timelineSteps.push({
          kind: 'log_only',
          tokenIdx: i,
          meta: meta
        });
      } else {
        // 1박자: 로그 문구(피해 / 버프 / 방어막 등) 단독 점등
        timelineSteps.push({
          kind: 'log_cause',
          tokenIdx: i,
          meta: meta
        });
        // 2박자 (0.8초 뒤): 로그 점등이 꺼지면서 대시보드 UI 타겟(에너미 카드 / 아군 상태이상 칩 / 게이지)이 단독으로 반짝!
        if (meta.selector) {
          timelineSteps.push({
            kind: 'ui_effect',
            tokenIdx: i,
            meta: meta
          });
        }
      }
    });

    const initTimer = setTimeout(() => {
      if (!appSettings.chainHighlightEnabled) return;
      itemEl.classList.add('chain-running');

      timelineSteps.forEach((step, stepIdx) => {
        const stepStart = stepIdx * beatInterval;
        const timer = setTimeout(() => {
          if (!appSettings.chainHighlightEnabled) return;

          if (step.kind === 'log_only' || step.kind === 'log_cause') {
            // 로그 문구만 단독 점등 (이전 로그 토큰들은 완료 상태로 전환)
            tokenSpans.forEach((sp, sIdx) => {
              if (sIdx < step.tokenIdx) {
                sp.classList.remove('seq-active');
                sp.classList.add('seq-done');
              } else if (sIdx === step.tokenIdx) {
                sp.classList.remove('seq-done');
                sp.classList.add('seq-active');
              } else {
                sp.classList.remove('seq-active', 'seq-done');
              }
            });
            const logFreqMap = { red: 420, green: 560, blue: 480, purple: 520, gold: 600 };
            playBeep(logFreqMap[step.meta.color] || 520, 'sine', 0.05);
          } else if (step.kind === 'ui_effect') {
            // 직전 로그 토큰 점등을 해제(seq-done)하고, 대시보드 UI 타겟(에너미 카드 / 아군 상태칩 등)만 단독 점등!
            tokenSpans.forEach((sp, sIdx) => {
              if (sIdx <= step.tokenIdx) {
                sp.classList.remove('seq-active');
                sp.classList.add('seq-done');
              }
            });
            pulseDashboardTargetElements(step.meta, beatInterval - 40);
            if (step.meta.isHitImpact) {
              playChainHitImpactSound();
            } else if (step.meta.isStatusChip) {
              playBeep(step.meta.color === 'purple' ? 680 : 620, 'triangle', 0.08);
            } else {
              playBeep(540, 'triangle', 0.06);
            }
          }
        }, stepStart);
        chainHighlightTimers.push(timer);
      });

      const finalTimer = setTimeout(() => {
        itemEl.classList.remove('chain-running');
        tokenSpans.forEach(sp => {
          sp.classList.remove('seq-active');
          sp.classList.add('seq-done');
        });
        isChainHighlightActive = false;
        try {
          window.dispatchEvent(new CustomEvent('chainHighlightFinished', { detail: { item: itemEl } }));
        } catch(e) {}
        while (chainHighlightQueue.length > 0) {
          const next = chainHighlightQueue.shift();
          if (next && next.isConnected) {
            runSequentialChainHighlightOnLogItem(next);
            break;
          }
        }
      }, timelineSteps.length * beatInterval + 100);
      chainHighlightTimers.push(finalTimer);
    }, 25);
    chainHighlightTimers.push(initTimer);
  }

  
  function executeAfterChainHighlight(callback, fallbackDelay = 2200) {
    if (!appSettings.chainHighlightEnabled || !isChainHighlightActive) {
      setTimeout(callback, 60);
      return;
    }
    let called = false;
    const runner = () => {
      if (called) return;
      called = true;
      window.removeEventListener('chainHighlightFinished', runner);
      setTimeout(callback, 200);
    };
    window.addEventListener('chainHighlightFinished', runner, { once: true });
    setTimeout(runner, fallbackDelay);
  }
  window.executeAfterChainHighlight = executeAfterChainHighlight;
  window.isChainHighlightActive = () => isChainHighlightActive;

function log(msg, mode = 'current') {
    const box = DOM.logBox || document.getElementById('log-box');
    if (!box) return;
    const item = document.createElement('div');
    if (mode === 'divider') {
      item.className = 'log-item round-divider-log';
    } else if (mode === 'past') {
      item.className = 'log-item';
    } else {
      item.className = 'log-item current-round-log';
    }
    item.innerHTML = msg;
    box.prepend(item);

    if (mode === 'current' && appSettings.chainHighlightEnabled) {
      runSequentialChainHighlightOnLogItem(item);
    }

    if (box.children.length > 80) {
      box.lastElementChild.remove();
    }
  }

  function clearLogs() {
    const box = DOM.logBox || document.getElementById('log-box');
    if (box) box.innerHTML = '';
  }
window.resolveChainTargetSelector = resolveChainTargetSelector;