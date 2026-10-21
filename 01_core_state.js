/* 세션 전역 상태 */
  let curLevel = 1, curRound = 1;
  let maxHp = 12, hp = 12, shield = 0, heat = 0;
  let compMaxHp = 13, compHp = 13, compShield = 0, compCd = 0;

  let bearerDeck = ['f_1_1', 'f_1_2', 'f_1_3', 'f_1_4', 'f_1_5'];
  let compDeck = ['w_1_1', 'w_1_2', 'w_1_3'];
  let compCds = { A: 0, B: 0, C: 0 };
  let selectedDeckSlotIdx = 0;
  let selectedCompSlotIdx = 0;
  let deckModalMode = 'bearer'; // 'bearer' | 'comp'
  let allowAllLevelSkills = false;
  let slotRunOptions = {};
  let compSlotOptions = {};
  let senCondenseActive = false;
  let senBonusActionReady = false;
  let mageChargedSpells = [];
  let bearerLastAttackMissed = false;
  let bearerEvadedLastRound = false;
  let bearerDirectDmgThisRound = 0;
  let bearerTookHpDmgThisRound = false;
  let bearerAttackRollUsedThisRound = false;
  let compAttackRollUsedThisRound = false;
  let bearerActedThisRound = false;
  let compActedThisRound = false;
  let enemyVulnCharges = 0;
  let warGodSoulActive = false;
  let blazingBladeActive = false;
  let communionFlame = 'none'; // 'none' | 'shine' | 'burn'
  let communionActiveThisRound = 'none'; // 'none' | 'shine' | 'burn'
  let bearerDealtDirectHitThisRound = false;
  let compDealtDirectHitThisRound = false;
  let compRevivedThisRound = false;
  let bearerDodgedAttackThisRound = false;
  let bearerHitDamagesThisRound = [];
  let bearerTakenDirectDmgSumThisRound = 0;
  let warriorTargetedByUidsThisRound = new Set();
  let warriorDirectHitCountThisRound = 0;
  let reaperDomainActiveThisRound = false;
  let lastGmRoundEndDotSum = 0;

  function ensureValidBearerDeck(forceReset = false) {
    const def = DEFAULT_BEARER_DECKS[pickedClass] || DEFAULT_BEARER_DECKS['파이터'];
    if (forceReset || !Array.isArray(bearerDeck) || bearerDeck.length !== 5) {
      bearerDeck = [...def];
      return;
    }
    const allMatchClass = bearerDeck.every(id => {
      const sk = getBearerSkillById(id);
      return sk && sk.cls === pickedClass;
    });
    if (!allMatchClass) {
      bearerDeck = [...def];
    }
  }

  function ensureValidCompDeck(forceReset = false) {
    const def = DEFAULT_COMP_DECKS[pickedComp] || DEFAULT_COMP_DECKS['데드로'];
    if (forceReset || !Array.isArray(compDeck) || compDeck.length !== 3) {
      compDeck = [...def];
      return;
    }
    const allMatchComp = compDeck.every(id => {
      const sk = getCompSkillById(id);
      return sk && sk.comp === pickedComp;
    });
    if (!allMatchComp) {
      compDeck = [...def];
    }
  }

  /* [Phase 2 & 3] 4Lv 패시브 편성 여부 체크 헬퍼 */
  function hasBearerPassive(passiveName) {
    if (curLevel < 4 && !allowAllLevelSkills) return false;
    if (Array.isArray(bearerDeck)) {
      return bearerDeck.some(id => {
        const sk = getBearerSkillById(id);
        return sk && sk.isPassive && sk.name === passiveName;
      });
    }
    return false;
  }

  /* [Phase 2] 과열 3단계 판별 및 실시간 공격력/AC 보정 헬퍼 (룰북 v2.24) */
  function getOverheatStage(h = heat) {
    if (h >= 100) return 'critical'; // 임계 (100)
    if (h >= 70) return 'warning';   // 경고 (70~99)
    return 'stable';                 // 안정 (0~69)
  }

  function getOverheatDmgBonus(h = heat) {
    if (h >= 100) return 2; // 임계: 직접 타격 피해 +2
    if (h >= 70) return 1;  // 경고: 직접 타격 피해 +1
    return 0;               // 안정: +0
  }

  function getOverheatAcPenalty(h = heat) {
    if (hasBearerPassive('성염 저항')) return 0; // 메이지 4Lv [성염 저항] 편성 시 과열 AC 페널티 면제
    if (h >= 100) return -2; // 임계: 베어러 AC -2
    if (h >= 70) return -1;  // 경고: 베어러 AC -1
    return 0;
  }

  function getBearerEffectiveAc() {
    const b = BEARERS[pickedClass] || BEARERS['파이터'];
    let ac = b.ac + getOverheatAcPenalty(heat);
    // 상태 칩에 따른 임시 AC 증감 반영 (예: 대실패 기믹 등)
    bearerStatuses.forEach(s => {
      if (s.acMod) ac += s.acMod;
    });
    return ac;
  }

  function getCompEffectiveAc() {
    const c = COMPS[pickedComp] || COMPS['데드로'];
    let ac = c.ac;
    compStatuses.forEach(s => {
      if (s.acMod) ac += s.acMod;
    });
    return ac;
  }

  /* [Phase 2] 방어막 비중첩 원칙(Math.max) 부여 헬퍼 (베어러 & 컴패니언 공통) */
  function grantShield(target, amount, sourceLabel = '방어막', silentLog = false) {
    if (amount <= 0) return;
    if (target === 'bearer') {
      const prev = shield;
      shield = Math.max(shield, amount);
      if (!silentLog) {
        if (prev > 0 && prev >= amount) {
          log(`🛡️ <b>[${sourceLabel} · 비중첩 유지]</b> 기존 방어막(<b>${prev}</b>)이 신규 방어막(${amount}) 이상이므로 <b>${shield}</b> 상태를 유지합니다.`);
        } else if (prev > 0 && amount > prev) {
          log(`🛡️ <b>[${sourceLabel} · 비중첩 갱신]</b> 방어막이 <b>${prev} ➔ ${shield}</b>(으)로 교체 갱신되었습니다! (합산 불가 원칙)`);
        } else {
          log(`🛡️ <b>[${sourceLabel}]</b> <b>베어러 방어막 ${shield} 획득</b>!`);
        }
      }
    } else {
      const prev = compShield;
      compShield = Math.max(compShield, amount);
      if (prev > 0 && prev >= amount) {
        log(`🛡️ <b>[${sourceLabel} · 비중첩 유지]</b> ${getCompName()}의 기존 방어막(<b>${prev}</b>)이 신규 방어막(${amount}) 이상이므로 <b>${compShield}</b> 상태를 유지합니다.`);
      } else if (prev > 0 && amount > prev) {
        log(`🛡️ <b>[${sourceLabel} · 비중첩 갱신]</b> ${getCompName()}의 방어막이 <b>${prev} ➔ ${compShield}</b>(으)로 교체 갱신되었습니다! (합산 불가 원칙)`);
      } else {
        log(`🛡️ <b>[${sourceLabel}]</b> ${getCompName()} 방어막 <b>${compShield}</b> 획득!`);
      }
    }
    refreshUI();
    saveSessionState();
  }

  /* [Phase 2] 과열 판정 4단계 처리 원칙 중 ③ 과열 증가 & ④ 초과 자해 피해(초과량÷10, 방어막 무시) 정산 */
  function applyHeatIncrease(cost, sourceLabel = '성염 가동') {
    if (cost <= 0) return { prevHeat: heat, newHeat: heat, excess: 0, recoilDmg: 0 };
    const prevHeat = heat;
    const rawHeat = prevHeat + cost;
    let excess = 0;
    let recoilDmg = 0;

    if (rawHeat > 100) {
      excess = rawHeat - 100;
      heat = 100;
      recoilDmg = Math.floor(excess / 10);
      if (hasBearerPassive('성염 저항')) {
        recoilDmg = Math.max(0, recoilDmg - 1);
      }
      if (recoilDmg > 0) {
        // ④ 초과 자해 피해는 방금 생성된 방어막을 무시하고 실제 HP를 직접 차감!
        hp = Math.max(0, hp - recoilDmg);
        playBeep(160, 'sawtooth', 0.35);
        log(`⚠️ <b>[과열 100 초과 자해 반동 (${sourceLabel})]</b> 누적 과열 <b>${rawHeat}</b> 도달 (초과량 <b>+${excess}</b> ➔ 10당 1 피해)! 방어막을 무시하고 베어러 실제 HP <b>-${recoilDmg}</b> 직접 차감! (잔여 HP: <b>${hp}/${maxHp}</b>, 과열 <b>100</b> 고정)`);
        recordActionBriefing(`   ↳ ⚠️ [초과 과열 자해] 과열 ${rawHeat}(+${excess} 초과) ➔ 방어막 무시 베어러 실제 HP -${recoilDmg} (잔여 HP: ${hp}/${maxHp})`);
      }
    } else {
      heat = rawHeat;
    }
    refreshUI();
    saveSessionState();
    return { prevHeat, newHeat: heat, excess, recoilDmg };
  }

  /* [Phase 2] 행동 제약 면역 여부 판별 헬퍼 */
  function isBearerImmuneToRestriction() {
    if (warGodSoulActive || bearerStatuses.some(s => s.name.includes('군신의 혼'))) return true;
    return false;
  }

  function isCompImmuneToRestriction() {
    return compStatuses.some(s => s.name.includes('투지 발휘') || s.name.includes('육탄 엄호'));
  }
  let pyrite = 0, potion = 1, deathStack = 0, senCharge = 0;
  let upgrades = { a: 0, b: 0, c: 0, d: 0 };
  let diceMode = 'auto', enemyVuln = false;
  let pickedOrigin = '신성국 아티스', pickedClass = '파이터', pickedComp = '데드로', bearerName = '파이터';
  let customBearerName = '', customCompName = '';
  let combatStarted = false;

  function getCompName() {
    if (customCompName && customCompName.trim().length > 0) return customCompName.trim();
    return (COMPS[pickedComp] && COMPS[pickedComp]['name']) ? COMPS[pickedComp]['name'] : pickedComp;
  }
  let bearerStatuses = [], compStatuses = [], actionQueue = [], isExecuting = false;
  let skillTarget = { b: 'bearer', c: 'bearer', compB: 'bearer' };
  let wasInCrisis = false;
  let dedroComboReady = -999;
  let lampOverloadRound = -999;

  /* 이번 라운드 행동 결과 수집 버퍼 및 헬퍼 함수 */
  let lastRoundActionSummary = [];
  function recordActionBriefing(text) {
    if (text) {
      lastRoundActionSummary.push(text);
    }
  }

  function proceedToSetup() {
    try {
      playBeep(580, 'triangle', 0.15);
    } catch(e) {}
    const titleScreen = document.getElementById('title-screen');
    const nameEl = document.getElementById('name-screen');
    if (titleScreen) titleScreen.style.display = 'none';
    if (nameEl) {
      nameEl.style.display = 'flex';
      const input = document.getElementById('bearer-solo-name');
      if (input) input.focus();
    }
  }
  window.proceedToSetup = proceedToSetup;

  function returnToTitleFromName() {
    try {
      playBeep(320, 'sine', 0.08);
    } catch(e) {}
    const nameEl = document.getElementById('name-screen');
    const titleScreen = document.getElementById('title-screen');
    if (nameEl) nameEl.style.display = 'none';
    if (titleScreen) titleScreen.style.display = 'flex';
  }
  window.returnToTitleFromName = returnToTitleFromName;

  function confirmNameAndProceed() {
    const input = document.getElementById('bearer-solo-name');
    const val = input ? input.value.trim() : '';
    customBearerName = val;
    bearerName = val || pickedClass;
    try {
      playBeep(640, 'triangle', 0.15);
    } catch(e) {}
    const nameScreen = document.getElementById('name-screen');
    const originScreen = document.getElementById('origin-screen');
    if (nameScreen) nameScreen.style.display = 'none';
    if (originScreen) originScreen.style.display = 'flex';
    selectOriginTab(pickedOrigin);
    playOriginEntranceAnimation();
  }
  window.confirmNameAndProceed = confirmNameAndProceed;

  function returnToNameFromOrigin() {
    try {
      playBeep(320, 'sine', 0.08);
    } catch(e) {}
    const originScreen = document.getElementById('origin-screen');
    const nameScreen = document.getElementById('name-screen');
    if (originScreen) originScreen.style.display = 'none';
    if (nameScreen) nameScreen.style.display = 'flex';
  }
  window.returnToNameFromOrigin = returnToNameFromOrigin;

  window.addEventListener('DOMContentLoaded', () => {
    const enterBtn = document.querySelector('.btn-enter-game');
    if (enterBtn) {
      enterBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        proceedToSetup();
      });
    }
  });

  function selectOriginTab(origin) {
    pickedOrigin = origin; playBeep(540, 'triangle', 0.08);
    const d = ORIGIN_DATA[origin] || ORIGIN_DATA['신성국 아티스'];
    const canonicalName = d ? d.name : origin;

    document.querySelectorAll('#origin-card-list .origin-hero-card').forEach(card => {
      const cardOrigin = card.getAttribute('data-origin');
      const isMatch = (cardOrigin === origin || cardOrigin === canonicalName);
      card.classList.toggle('active', isMatch);
      const pill = card.querySelector('.origin-select-pill');
      if (pill) {
        pill.innerText = isMatch ? '✓ 선택됨' : '';
      }
      const footer = card.querySelector('.hover-detail-footer');
      if (footer) {
        footer.innerText = isMatch ? '✓ 현재 서약 배경으로 선택됨' : '클릭하여 이 출신 배경으로 서약';
      }
    });

    const confirmBtn = document.getElementById('btn-confirm-origin');
    if (confirmBtn && d) {
      confirmBtn.innerHTML = `<span>✓ [${d.name}] 배경으로 서약 확정 (클래스 선택으로)</span>`;
    }
  }

  function confirmOriginAndProceed() {
    playBeep(640, 'triangle', 0.15);
    clearOriginHoverTimers();
    const oScreen = document.getElementById('origin-screen');
    if (oScreen) {
      oScreen.classList.remove('origin-card-hovered');
      oScreen.querySelectorAll('.origin-hero-card.is-hovered-focus').forEach(c => c.classList.remove('is-hovered-focus'));
      oScreen.style.display = 'none';
    }
    const cScreen = document.getElementById('class-screen');
    if (cScreen) cScreen.style.display = 'flex';
    selectClassTab(pickedClass);
    playClassEntranceAnimation();
  }

  let originHoverUnlockTimer = null;
  let originMouseMoveHandler = null;
  let originHoverEnterTimer = null;
  const screenHoverLeaveTimers = {};

  function clearOriginHoverTimers() {
    if (originHoverEnterTimer) {
      clearTimeout(originHoverEnterTimer);
      originHoverEnterTimer = null;
    }
    Object.keys(screenHoverLeaveTimers).forEach(k => {
      if (screenHoverLeaveTimers[k]) {
        clearTimeout(screenHoverLeaveTimers[k]);
        screenHoverLeaveTimers[k] = null;
      }
    });
  }

  function bindCardScreenHoverFocus(screenId, rowId) {
    const screenEl = document.getElementById(screenId);
    const row = document.getElementById(rowId);
    if (!screenEl || !row) return;
    const cards = row.querySelectorAll('.origin-hero-card');
    cards.forEach(card => {
      if (card.dataset.focusBound === '1') return;
      card.dataset.focusBound = '1';
      card.addEventListener('mouseenter', () => {
        if (row.classList.contains('hover-locked')) return;
        if (screenHoverLeaveTimers[screenId]) {
          clearTimeout(screenHoverLeaveTimers[screenId]);
          screenHoverLeaveTimers[screenId] = null;
        }
        cards.forEach(c => {
          if (c === card) {
            if (!c.classList.contains('is-hovered-focus')) c.classList.add('is-hovered-focus');
          } else {
            if (c.classList.contains('is-hovered-focus')) c.classList.remove('is-hovered-focus');
          }
        });
        if (!screenEl.classList.contains('origin-card-hovered')) {
          screenEl.classList.add('origin-card-hovered');
        }
      });
      card.addEventListener('mouseleave', () => {
        if (screenHoverLeaveTimers[screenId]) {
          clearTimeout(screenHoverLeaveTimers[screenId]);
        }
        screenHoverLeaveTimers[screenId] = setTimeout(() => {
          const stillHovered = row.querySelector('.origin-hero-card:hover');
          if (!stillHovered) {
            screenEl.classList.remove('origin-card-hovered');
            cards.forEach(c => c.classList.remove('is-hovered-focus'));
          }
          screenHoverLeaveTimers[screenId] = null;
        }, 200);
      });
    });
  }

  function initOriginHoverFocus() {
    bindCardScreenHoverFocus('origin-screen', 'origin-card-list');
    bindCardScreenHoverFocus('class-screen', 'class-card-list');
    bindCardScreenHoverFocus('comp-screen', 'comp-card-list');
  }
  window.addEventListener('DOMContentLoaded', initOriginHoverFocus);

  function playCardScreenEntranceAnimation(screenId, rowId) {
    const screenEl = document.getElementById(screenId);
    const row = document.getElementById(rowId);
    if (!row) return;
    initOriginHoverFocus();
    clearOriginHoverTimers();
    if (screenEl) screenEl.classList.remove('origin-card-hovered');
    if (originHoverUnlockTimer) clearTimeout(originHoverUnlockTimer);
    if (originMouseMoveHandler) {
      window.removeEventListener('mousemove', originMouseMoveHandler);
      originMouseMoveHandler = null;
    }
    row.classList.add('hover-locked');
    const cards = row.querySelectorAll('.origin-hero-card');
    cards.forEach((card, idx) => {
      card.classList.remove('card-entering', 'is-hovered-focus');
      card.style.animationDelay = `${idx * 110}ms`;
      void card.offsetWidth;
      card.classList.add('card-entering');
    });
    // 카드 4장이 모두 올라온 뒤(약 900ms 후), 마우스를 실제로 움직일 때 호버 팝업 잠금 해제
    originHoverUnlockTimer = setTimeout(() => {
      let lastX = null, lastY = null;
      originMouseMoveHandler = (e) => {
        if (lastX === null) {
          lastX = e.clientX;
          lastY = e.clientY;
          return;
        }
        if (Math.hypot(e.clientX - lastX, e.clientY - lastY) > 6) {
          row.classList.remove('hover-locked');
          cards.forEach(c => {
            c.classList.remove('card-entering');
            c.style.animationDelay = '';
          });
          const hoveredCard = row.querySelector('.origin-hero-card:hover');
          if (hoveredCard && screenEl) {
            cards.forEach(c => c.classList.toggle('is-hovered-focus', c === hoveredCard));
            screenEl.classList.add('origin-card-hovered');
          }
          window.removeEventListener('mousemove', originMouseMoveHandler);
          originMouseMoveHandler = null;
        }
      };
      window.addEventListener('mousemove', originMouseMoveHandler);
    }, 900);
  }

  function playOriginEntranceAnimation() {
    playCardScreenEntranceAnimation('origin-screen', 'origin-card-list');
  }
  window.playOriginEntranceAnimation = playOriginEntranceAnimation;

  function playClassEntranceAnimation() {
    playCardScreenEntranceAnimation('class-screen', 'class-card-list');
  }
  window.playClassEntranceAnimation = playClassEntranceAnimation;

  function playCompEntranceAnimation() {
    playCardScreenEntranceAnimation('comp-screen', 'comp-card-list');
  }
  window.playCompEntranceAnimation = playCompEntranceAnimation;

  function returnToOriginFromClass() {
    playBeep(320, 'sine', 0.08);
    clearOriginHoverTimers();
    const cScreen = document.getElementById('class-screen');
    if (cScreen) {
      cScreen.classList.remove('origin-card-hovered');
      cScreen.querySelectorAll('.origin-hero-card.is-hovered-focus').forEach(c => c.classList.remove('is-hovered-focus'));
      cScreen.style.display = 'none';
    }
    document.getElementById('origin-screen').style.display = 'flex';
    selectOriginTab(pickedOrigin);
    playOriginEntranceAnimation();
  }

  function selectClassTab(cls) {
    pickedClass = cls; playBeep(560, 'triangle', 0.08);
    if (typeof warmUpSkillIconsForClass === 'function') warmUpSkillIconsForClass(cls);
    if (!customBearerName) bearerName = cls;

    document.querySelectorAll('#class-card-list .origin-hero-card').forEach(card => {
      const cardCls = card.getAttribute('data-class');
      const isMatch = (cardCls === cls);
      card.classList.toggle('active', isMatch);
      const pill = card.querySelector('.origin-select-pill');
      if (pill) {
        pill.innerText = isMatch ? '✓ 선택됨' : '';
      }
      const footer = card.querySelector('.hover-detail-footer');
      if (footer) {
        footer.innerText = isMatch ? '✓ 현재 서약 클래스로 선택됨' : '클릭하여 이 클래스로 서약';
      }
    });

    const confirmBtn = document.getElementById('btn-confirm-class');
    if (confirmBtn) {
      confirmBtn.innerHTML = `<span>✓ [${cls}] 클래스로 서약 확정 (동료 선택으로)</span>`;
    }

    // 레거시 DOM 폴백 호환성 유지
    document.querySelectorAll('#class-tab-list .screen-tab-btn').forEach(tab => {
      tab.classList.toggle('active', tab.innerText.includes(cls));
    });
    const d = CLASS_DATA[cls]; if (!d) return;
    const imgEl = document.getElementById('class-panel-img');
    if (imgEl) imgEl.src = d.image;
    const nameEl = document.getElementById('class-panel-name');
    if (nameEl) nameEl.innerText = d.name;
    const roleEl = document.getElementById('class-panel-role');
    if (roleEl) roleEl.innerText = d.role;
    const hpEl = document.getElementById('class-panel-hp');
    if (hpEl) hpEl.innerText = `HP ${d.hp}`;
    const acEl = document.getElementById('class-panel-ac');
    if (acEl) acEl.innerText = `AC ${d.ac}`;
    const featEl = document.getElementById('class-panel-feat');
    if (featEl) featEl.innerText = d.feat;
    const skillsEl = document.getElementById('class-panel-skills');
    if (skillsEl) {
      skillsEl.innerHTML = d.skills.map(s => `
        <div class="skill-preview-item"><span class="skill-preview-tag" style="min-width:105px; width:105px; flex-shrink:0; color:#fbd38d;">${s.name}</span><span>${s.desc}</span></div>
      `).join('');
    }
  }

  function confirmClassAndProceed() {
    if (!customBearerName) bearerName = pickedClass;
    playBeep(640, 'triangle', 0.15);
    clearOriginHoverTimers();
    const cScreen = document.getElementById('class-screen');
    if (cScreen) {
      cScreen.classList.remove('origin-card-hovered');
      cScreen.querySelectorAll('.origin-hero-card.is-hovered-focus').forEach(c => c.classList.remove('is-hovered-focus'));
      cScreen.style.display = 'none';
    }
    const pScreen = document.getElementById('comp-screen');
    if (pScreen) pScreen.style.display = 'flex';
    selectCompTab(pickedComp);
    playCompEntranceAnimation();
  }

  function returnToClassFromComp() {
    playBeep(320, 'sine', 0.08);
    clearOriginHoverTimers();
    const pScreen = document.getElementById('comp-screen');
    if (pScreen) {
      pScreen.classList.remove('origin-card-hovered');
      pScreen.querySelectorAll('.origin-hero-card.is-hovered-focus').forEach(c => c.classList.remove('is-hovered-focus'));
      pScreen.style.display = 'none';
    }
    const cScreen = document.getElementById('class-screen');
    if (cScreen) cScreen.style.display = 'flex';
    selectClassTab(pickedClass);
    playClassEntranceAnimation();
  }

  function selectCompTab(comp) {
    pickedComp = comp; playBeep(580, 'triangle', 0.08);
    if (typeof warmUpSkillIconsForComp === 'function') warmUpSkillIconsForComp(comp);
    const d = COMP_DATA[comp];
    const compFullName = d ? d.name : comp;

    const compInput = document.getElementById('comp-custom-name-input');
    if (compInput && d) {
      compInput.placeholder = `미입력 시 기본 이름(${d.name})으로 지정됩니다`;
    }

    document.querySelectorAll('#comp-card-list .origin-hero-card').forEach(card => {
      const cardComp = card.getAttribute('data-comp');
      const isMatch = (cardComp === comp);
      card.classList.toggle('active', isMatch);
      const pill = card.querySelector('.origin-select-pill');
      if (pill) {
        pill.innerText = isMatch ? '✓ 선택됨' : '';
      }
      const footer = card.querySelector('.hover-detail-footer');
      if (footer) {
        footer.innerText = isMatch ? '✓ 현재 서약 맹우로 선택됨' : '클릭하여 이 맹우와 서약';
      }
    });

    const confirmBtn = document.getElementById('btn-confirm-comp');
    if (confirmBtn) {
      confirmBtn.innerHTML = `<span>✓ [${compFullName}] 맹우와 여정 시작 (대시보드 전개)</span>`;
    }

    // 레거시 DOM 폴백 호환성 유지
    document.querySelectorAll('#comp-tab-list .screen-tab-btn').forEach(tab => {
      tab.classList.toggle('active', tab.innerText.includes(comp));
    });
    if (!d) return;
    const imgEl = document.getElementById('comp-panel-img');
    if (imgEl) imgEl.src = d.image;
    const nameEl = document.getElementById('comp-panel-name');
    if (nameEl) nameEl.innerText = d.name;
    const clsEl = document.getElementById('comp-panel-class');
    if (clsEl) clsEl.innerText = d.class;
    const hpEl = document.getElementById('comp-panel-hp');
    if (hpEl) hpEl.innerText = `HP ${d.hp}`;
    const acEl = document.getElementById('comp-panel-ac');
    if (acEl) acEl.innerText = `AC ${d.ac}`;
    const loreEl = document.getElementById('comp-panel-lore');
    if (loreEl) loreEl.innerText = d.lore;
    const featEl = document.getElementById('comp-panel-feat');
    if (featEl) featEl.innerText = d.feat;
    const skillsEl = document.getElementById('comp-panel-skills');
    if (skillsEl) {
      skillsEl.innerHTML = d.skills.map(s => `
        <div class="skill-preview-item"><span class="skill-preview-tag" style="min-width:110px; width:110px; flex-shrink:0; color:#d8b4fe;">${s.name}</span><span>${s.desc}</span></div>
      `).join('');
    }
  }


  function confirmCompAndProceed() {
    const compInput = document.getElementById('comp-custom-name-input');
    if (compInput) {
      customCompName = compInput.value.trim();
    }
    playBeep(720, 'triangle', 0.2);
    clearOriginHoverTimers();
    const pScreen = document.getElementById('comp-screen');
    if (pScreen) {
      pScreen.classList.remove('origin-card-hovered');
      pScreen.querySelectorAll('.origin-hero-card.is-hovered-focus').forEach(c => c.classList.remove('is-hovered-focus'));
      pScreen.style.display = 'none';
    }
    completeSetupAndLaunch();
  }

  function completeSetupAndLaunch() {
    try {
      curLevel = 1; curRound = 1; combatStarted = false;
      if (!customBearerName) bearerName = pickedClass;
      const b = BEARERS[pickedClass] || BEARERS['파이터'];
      const c = COMPS[pickedComp] || COMPS['데드로'];
      maxHp = b.hp; hp = maxHp; shield = 0; heat = 0;
      compMaxHp = c.hp; compHp = compMaxHp; compShield = 0; compCd = 0;
      senCharge = 0; deathStack = 0;
      bearerStatuses = []; compStatuses = [];
      diceMode = 'auto'; updateDiceModeUI();
      pyrite = 0;
      potion = 1; upgrades = { a: 0, b: 0, c: 0, d: 0 };
      ensureValidBearerDeck(true);
      ensureValidCompDeck(true);
      compCds = { A: 0, B: 0, C: 0 };
      slotRunOptions = {};
      compSlotOptions = {};
      senCondenseActive = false;
      senBonusActionReady = false;
      mageChargedSpells = [];
      bearerLastAttackMissed = false;
      bearerEvadedLastRound = false;
      bearerDirectDmgThisRound = 0;
      bearerTookHpDmgThisRound = false;
      bearerAttackRollUsedThisRound = false;
      compAttackRollUsedThisRound = false;
      bearerActedThisRound = false;
      compActedThisRound = false;
      enemyVulnCharges = 0;
      warGodSoulActive = false;
      blazingBladeActive = false;
      dedroComboReady = -999;
      lampOverloadRound = -999;
      communionFlame = 'none';
      communionActiveThisRound = 'none';
      bearerDealtDirectHitThisRound = false;
      compDealtDirectHitThisRound = false;
      compRevivedThisRound = false;
      bearerDodgedAttackThisRound = false;
      bearerHitDamagesThisRound = [];
      bearerTakenDirectDmgSumThisRound = 0;
      warriorTargetedByUidsThisRound = new Set();
      warriorDirectHitCountThisRound = 0;
      reaperDomainActiveThisRound = false;
      lastGmRoundEndDotSum = 0;
      wasInCrisis = false;

      document.getElementById('main-dashboard').style.display = 'flex';
      renderStatuses(); loadNotebook(); refreshUI();
      log(`🗡️ <b>[여정 시작]</b> ${bearerName} (${pickedClass} / ${pickedOrigin}) & 동료 ${getCompName()} (${c.class}) 준비 완료! (1레벨 기본 5스킬 덱 편성됨)`, 'past');
      saveSessionState();
    } catch(err) {
      console.error("Dashboard launch error:", err);
      document.getElementById('main-dashboard').style.display = 'flex';
    }
  }

  const SESSION_STORAGE_KEY = 'fifth_hand_trpg_session_v1';

  function saveSessionState() {
    try {
      const data = {
        curLevel, curRound, maxHp, hp, shield, heat,
        compMaxHp, compHp, compShield, compCd, senCharge, deathStack,
        pyrite, potion, upgrades,
        bearerDeck, compDeck, compCds, senCondenseActive, allowAllLevelSkills, mageChargedSpells,
        bearerLastAttackMissed, bearerEvadedLastRound, bearerActedThisRound, compActedThisRound,
        warGodSoulActive, blazingBladeActive, enemyVulnCharges, communionFlame, communionActiveThisRound, compRevivedThisRound,
        pickedOrigin, pickedClass, pickedComp,
        bearerName, customBearerName, customCompName, combatStarted,
        bearerStatuses, compStatuses,
        skillTarget,
        diceMode, enemyVuln, dedroComboReady, lampOverloadRound,
        timestamp: Date.now()
      };
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data));
      checkResumeButtonVisibility();
      if (typeof broadcastPlayerStateToGm === 'function') broadcastPlayerStateToGm();
    } catch(e) {}
  }

  function checkResumeButtonVisibility() {
    const btn = DOM.btnResumeSession || document.getElementById('btn-resume-session');
    if (!btn) return;
    try {
      const hasSave = !!localStorage.getItem(SESSION_STORAGE_KEY);
      btn.style.display = hasSave ? 'inline-flex' : 'none';
    } catch(e) {
      btn.style.display = 'none';
    }
  }

  function resumeSavedSession() {
    try {
      const saved = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!saved) return;
      const data = JSON.parse(saved);
      curLevel = data.curLevel || 1;
      curRound = data.curRound || 1;
      pickedOrigin = data.pickedOrigin || '신성국 아티스';
      pickedClass = data.pickedClass || '파이터';
      pickedComp = data.pickedComp || '데드로';
      deathStack = data.deathStack || 0;

      const bBase = BEARERS[pickedClass] || BEARERS['파이터'];
      const cBase = COMPS[pickedComp] || COMPS['데드로'];
      const expectedMaxHp = bBase.hp + ((curLevel - 1) * 4) + (deathStack * 2);
      const expectedCompMaxHp = cBase.hp + ((curLevel - 1) * 4);

      maxHp = data.maxHp || expectedMaxHp;
      hp = Math.max(0, Math.min(maxHp, data.hp !== undefined ? data.hp : maxHp));
      shield = Math.max(0, data.shield || 0);
      heat = Math.max(0, Math.min(100, data.heat || 0));
      compMaxHp = data.compMaxHp || expectedCompMaxHp;
      compHp = Math.max(0, Math.min(compMaxHp, data.compHp !== undefined ? data.compHp : compMaxHp));
      compShield = Math.max(0, data.compShield || 0);
      compCd = data.compCd || 0;
      senCharge = data.senCharge || 0;
      pyrite = data.pyrite || 0;
      potion = data.potion !== undefined ? data.potion : 1;
      upgrades = data.upgrades || { a: 0, b: 0, c: 0, d: 0 };
      bearerName = data.bearerName || pickedClass;
      customBearerName = data.customBearerName || '';
      customCompName = data.customCompName || '';
      combatStarted = Boolean(data.combatStarted);
      if (Array.isArray(data.bearerDeck) && data.bearerDeck.length === 5) {
        bearerDeck = data.bearerDeck;
      }
      ensureValidBearerDeck(false);
      if (Array.isArray(data.compDeck) && data.compDeck.length === 3) {
        compDeck = data.compDeck;
      }
      ensureValidCompDeck(false);
      compCds = (data.compCds && typeof data.compCds === 'object') ? data.compCds : { A: 0, B: 0, C: 0 };
      senCondenseActive = Boolean(data.senCondenseActive);
      allowAllLevelSkills = Boolean(data.allowAllLevelSkills);
      mageChargedSpells = Array.isArray(data.mageChargedSpells) ? data.mageChargedSpells : [];
      bearerLastAttackMissed = Boolean(data.bearerLastAttackMissed);
      bearerEvadedLastRound = Boolean(data.bearerEvadedLastRound);
      bearerActedThisRound = Boolean(data.bearerActedThisRound);
      compActedThisRound = Boolean(data.compActedThisRound);
      warGodSoulActive = Boolean(data.warGodSoulActive);
      blazingBladeActive = Boolean(data.blazingBladeActive);
      enemyVulnCharges = data.enemyVulnCharges || 0;
      communionFlame = data.communionFlame || 'none';
      communionActiveThisRound = data.communionActiveThisRound || 'none';
      compRevivedThisRound = Boolean(data.compRevivedThisRound);
      bearerStatuses = data.bearerStatuses || [];
      compStatuses = data.compStatuses || [];
      skillTarget = data.skillTarget || { b: 'bearer', c: 'bearer', compB: 'bearer' };
      if (data.diceMode !== undefined) {
        diceMode = data.diceMode;
        updateDiceModeUI();
      }
      if (data.enemyVuln !== undefined) {
        enemyVuln = data.enemyVuln;
        updateEnemyVulnUI();
      }
      if (data.dedroComboReady !== undefined) {
        dedroComboReady = data.dedroComboReady;
      }
      if (data.lampOverloadRound !== undefined) {
        lampOverloadRound = data.lampOverloadRound;
      }


      const tScreen = document.getElementById('title-screen');
      const nScreen = document.getElementById('name-screen');
      const oScreen = document.getElementById('origin-screen');
      const cScreen = document.getElementById('class-screen');
      const pScreen = document.getElementById('comp-screen');
      const gScreen = document.getElementById('vfx-guide-screen');
      const mDash = document.getElementById('main-dashboard');

      if (tScreen) tScreen.style.display = 'none';
      if (nScreen) nScreen.style.display = 'none';
      if (oScreen) oScreen.style.display = 'none';
      if (cScreen) cScreen.style.display = 'none';
      if (pScreen) pScreen.style.display = 'none';
      if (gScreen) gScreen.style.display = 'none';
      if (mDash) mDash.style.display = 'flex';

      renderStatuses();
      loadNotebook();
      refreshUI();
      playBeep(640, 'triangle', 0.2);
      log(`⚡ <b>[세션 복원 완료]</b> 저장된 여정(${bearerName} & ${getCompName()}, Lv.${curLevel})을 정상적으로 이어갑니다.`, 'past');
    } catch(err) {
      log(`⚠️ <b>[세션 복원 실패]</b> 저장된 데이터가 손상되었거나 호환되지 않습니다.`);
    }
  }

  function exportSessionJSON() {
    try {
      saveSessionState();
      const saved = localStorage.getItem(SESSION_STORAGE_KEY);
      const notebook = localStorage.getItem('fifth_hand_notebook') || '';
      const payload = {
        session: saved ? JSON.parse(saved) : null,
        notebook: notebook,
        version: '2.24'
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fifth_hand_save_${bearerName || 'hero'}_lv${curLevel}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      log(`💾 <b>[백업 완료]</b> 세션 백업 파일이 생성되었습니다.`);
      playBeep(720, 'sine', 0.12);
    } catch(e) {
      log(`⚠️ 세션 백업 내보내기 중 문제가 발생했습니다.`);
    }
  }

  function importSessionJSON(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const payload = JSON.parse(e.target.result);
        if (payload.session) {
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload.session));
        }
        if (payload.notebook) {
          localStorage.setItem('fifth_hand_notebook', payload.notebook);
        }
        event.target.value = '';
        checkResumeButtonVisibility();
        resumeSavedSession();
      } catch(err) {
        log(`⚠️ <b>[가져오기 실패]</b> 올바른 JSON 세션 파일이 아닙니다.`);
      }
    };
    reader.readAsText(file);
  }

  let setupResetArmed = false;
  function returnToSetup(btn) {
    if (!setupResetArmed) {
      setupResetArmed = true;
      const targetBtn = btn || document.querySelector("button[onclick*='returnToSetup']");
      if (targetBtn) {
        const origText = targetBtn.innerHTML;
        const origBorder = targetBtn.style.borderColor;
        const origColor = targetBtn.style.color;
        targetBtn.innerHTML = '⚠️ 정말 재설정? (한번 더 클릭)';
        targetBtn.style.borderColor = '#ef4444';
        targetBtn.style.color = '#fca5a5';
        setTimeout(() => {
          setupResetArmed = false;
          targetBtn.innerHTML = origText;
          targetBtn.style.borderColor = origBorder;
          targetBtn.style.color = origColor;
        }, 2500);
      }
      return;
    }
    setupResetArmed = false;
    clearAllSkillTimers();
    const settingsModal = document.getElementById('settings-modal');
    if (settingsModal) {
      settingsModal.classList.remove('open');
      settingsModal.style.display = 'none';
    }
    bearerStatuses = []; compStatuses = []; actionQueue = []; renderStatuses();
    customBearerName = ''; customCompName = ''; combatStarted = false;
    const nameInput = document.getElementById('bearer-solo-name');
    const compNameInput = document.getElementById('comp-custom-name-input');
    if (compNameInput) compNameInput.value = '';
    if (nameInput) nameInput.value = '';
    const guideScreen = document.getElementById('vfx-guide-screen');
    if (guideScreen) guideScreen.style.display = 'none';
    document.getElementById('main-dashboard').style.display = 'none';
    document.getElementById('name-screen').style.display = 'flex';
  }

  function refreshUI() {
    const b = BEARERS[pickedClass], c = COMPS[pickedComp];
    const bonusDmg = curLevel - 1;

    // 현재 HP 및 자원이 최대치를 초과하지 않도록 안전 클램핑
    hp = Math.max(0, Math.min(maxHp, hp));
    compHp = Math.max(0, Math.min(compMaxHp, compHp));
    shield = Math.max(0, shield);
    compShield = Math.max(0, compShield);
    heat = Math.max(0, Math.min(100, heat));

    const titleEl = DOM.dashTitleName || document.getElementById('dash-title-name');
    if (titleEl) {
      titleEl.innerHTML = `🗡 <span class="unit-name-main">${bearerName}</span> <span class="unit-class-pill">(${pickedClass})</span>`;
    }

    const lvlBadge = DOM.levelBadge || document.getElementById('level-badge');
    if (lvlBadge) lvlBadge.innerText = `Lv.${curLevel}`;

    const btnLvlDown = DOM.btnLvlDown || document.getElementById('btn-lvl-down');
    if (btnLvlDown) btnLvlDown.disabled = (curLevel <= 1);

    const btnLvlUp = DOM.btnLvlUp || document.getElementById('btn-lvl-up');
    if (btnLvlUp) btnLvlUp.disabled = (curLevel >= 4);

    const trait = ORIGIN_DATA[pickedOrigin] || { traitName: '출신 특전', traitTag: '', traitDesc: '' };
    const isArtisGlow = Boolean(pickedOrigin && pickedOrigin.includes('아티스') && (hp * 2 <= maxHp));
    const charSummary = DOM.charSummary || document.getElementById('char-summary');
    if (charSummary) {
      charSummary.innerHTML = `
        <span class="${isArtisGlow ? 'origin-trait-chip active-glow' : 'origin-trait-chip'}">
          <span>✨ ${pickedOrigin} · 특전: [${trait.traitName}]${isArtisGlow ? ' <b style="color:#fde68a;">[발동 중!]</b>' : ''}</span>
          <div class="tooltip-box" style="white-space:normal!important;word-break:keep-all!important;overflow-wrap:break-word!important;box-sizing:border-box!important;">
            <div class="tooltip-title"><span>[출신 특전] ${trait.traitName}</span><span style="font-size:10.5px; color:#68d391;">${pickedOrigin}</span></div>
            <div style="color:#fbd38d; font-weight:bold; margin-bottom:3px; white-space:normal!important; word-break:keep-all!important;">${trait.traitTag}</div>
            <div style="white-space:normal!important; word-break:keep-all!important; overflow-wrap:break-word!important;">${trait.traitDesc}</div>
          </div>
        </span>
      `;
    }

    const effBearerAc = getBearerEffectiveAc();
    const acPen = getOverheatAcPenalty(heat);
    const heatDmgBonus = getOverheatDmgBonus(heat);
    const totalBearerDmgBonus = bonusDmg + heatDmgBonus;

    const bearerAc = DOM.bearerAcVal || document.getElementById('bearer-ac-val');
    if (bearerAc) {
      bearerAc.innerText = effBearerAc;
      bearerAc.style.color = (effBearerAc < b.ac) ? '#f87171' : ((effBearerAc > b.ac) ? '#68d391' : '#ecc94b');
      bearerAc.title = `기본 AC ${b.ac}${acPen < 0 ? ` / 과열 페널티 ${acPen}` : ''}`;
    }

    const bearerDmg = DOM.bearerDmgBonus || document.getElementById('bearer-dmg-bonus');
    if (bearerDmg) {
      bearerDmg.innerText = `+${totalBearerDmgBonus}`;
      bearerDmg.style.color = (heatDmgBonus > 0) ? '#fca5a5' : '#fbd38d';
      bearerDmg.title = `레벨 보너스 +${bonusDmg}${heatDmgBonus > 0 ? ` / 과열 공격력 보정 +${heatDmgBonus}` : ''}`;
    }

    const effCompAc = getCompEffectiveAc();
    const compAc = DOM.compAcVal || document.getElementById('comp-ac-val');
    if (compAc) {
      compAc.innerText = effCompAc;
      compAc.style.color = (effCompAc < c.ac) ? '#f87171' : ((effCompAc > c.ac) ? '#68d391' : '#ecc94b');
    }

    const compDmg = DOM.compDmgBonus || document.getElementById('comp-dmg-bonus');
    if (compDmg) compDmg.innerText = `+${bonusDmg}`;

    const hpPercent = maxHp > 0 ? (hp / maxHp) * 100 : 0;
    const isCrisis = hp > 0 && (hpPercent <= 25 || hp <= 3);

    const hpBar = DOM.hpBar || document.getElementById('hp-bar');
    if (hpBar) hpBar.style.width = `${Math.max(0, Math.min(100, hpPercent))}%`;
    const hpText = DOM.hpText || document.getElementById('hp-text');
    if (hpText) hpText.innerText = `${hp} / ${maxHp}`;

    if (isCrisis) {
      if (hpBar) hpBar.classList.add('hp-crisis-pulse');
      if (!wasInCrisis) {
        wasInCrisis = true; playHeartbeatSound();
        log(`🩸 <b>[치명적 위기]</b> 베어러의 생명력이 25% 이하로 추락했습니다! 마력회로가 찢어지고 시야가 붉게 물듭니다.<br><span style="color:#fbd38d;">${getCompName()}</span>: <i style="color:#fecaca;">${COMP_CRISIS_LINES[pickedComp]}</i>`);
      }
    } else {
      wasInCrisis = false;
      if (hpBar) hpBar.classList.remove('hp-crisis-pulse');
    }

    const sBar = DOM.shieldBar || document.getElementById('shield-bar');
    if (sBar) sBar.style.width = `${Math.max(0, Math.min(100, (shield / 15) * 100))}%`;
    const sText = DOM.shieldText || document.getElementById('shield-text');
    if (sText) sText.innerText = `${shield} / 15`;

    const heatBar = DOM.heatBar || document.getElementById('heat-bar');
    if (heatBar) heatBar.style.width = `${heat}%`;
    const heatText = DOM.heatText || document.getElementById('heat-text');
    if (heatText) heatText.innerText = `${heat} / 100`;

    const steamFx = DOM.steamFx || document.getElementById('steam-fx');
    if (heatBar) heatBar.classList.remove('state-warning', 'state-critical');
    if (steamFx) steamFx.classList.remove('active', 'critical');

    if (heat >= 100) {
      if (heatBar) heatBar.classList.add('state-critical');
      if (steamFx) steamFx.classList.add('active', 'critical');
    } else if (heat >= 70) {
      if (heatBar) heatBar.classList.add('state-warning');
      if (steamFx) steamFx.classList.add('active');
    }
    renderStatuses();

    const compName = DOM.compNameLabel || document.getElementById('comp-name-label');
    if (compName) {
      compName.innerHTML = `🤝 <span class="unit-name-main">${getCompName()}</span> <span class="unit-class-pill">(${c.class})</span>`;
    }

    const compHpB = DOM.compHpBar || document.getElementById('comp-hp-bar');
    if (compHpB) compHpB.style.width = `${Math.max(0, Math.min(100, (compHp / compMaxHp) * 100))}%`;

    const compHpT = DOM.compHpText || document.getElementById('comp-hp-text');
    if (compHpT) compHpT.innerText = `${compHp} / ${compMaxHp}`;

    const compSB = DOM.compShieldBar || document.getElementById('comp-shield-bar');
    if (compSB) compSB.style.width = `${Math.max(0, Math.min(100, (compShield / 15) * 100))}%`;
    const compST = DOM.compShieldText || document.getElementById('comp-shield-text');
    if (compST) compST.innerText = `${compShield} / 15`;

    const chargeTray = document.getElementById('sen-charge-tray');
    if (pickedComp === '센') {
      chargeTray.style.display = 'flex';
      for (let i = 1; i <= 3; i++) document.getElementById(`sen-dot-${i}`).className = (i <= senCharge) ? 'charge-dot active' : 'charge-dot';
    } else { chargeTray.style.display = 'none'; }

    ensureValidCompDeck(false);
    const compSlotTags = ['A', 'B', 'C'];
    const compDmgBonusStr = bonusDmg > 0 ? ` (+${bonusDmg} 레벨 가산)` : '';
    let activeCdList = [];

    compSlotTags.forEach((tag, idx) => {
      const lower = tag.toLowerCase();
      const skId = compDeck[idx];
      const sk = getCompSkillById(skId);
      const wrapEl = (DOM.compWraps && DOM.compWraps[tag]) || document.getElementById(`wrap-comp-${tag}`);
      const btnEl = (DOM.compBtns && DOM.compBtns[lower]) || document.getElementById(`comp-btn-${lower}`);
      const iconBoxEl = document.getElementById(`icon-comp-${lower}`);
      const nameEl = document.getElementById(`name-comp-${lower}`);
      const cdCtrlEl = document.getElementById(`cd-ctrl-comp-${lower}`);
      const tipEl = (DOM.compTips && DOM.compTips[lower]) || document.getElementById(`comp-tip-${lower}`);
      if (!sk || !btnEl) return;

      const curSlotCd = compCds[tag] || 0;
      if (curSlotCd > 0) activeCdList.push(`${tag}:${curSlotCd}R`);

      if (cdCtrlEl) {
        cdCtrlEl.style.display = (sk.cd > 0 || curSlotCd > 0) ? 'flex' : 'none';
      }

      const needsCharge = Boolean(sk.reqCharge && senCharge < sk.reqCharge);
      const isDown = (compHp <= 0);
      const isRevivedWait = Boolean(compRevivedThisRound);
      const isSameSkillInBonus = Boolean(senBonusActionReady && sk.id === 'ms_4_2');
      const isDisabled = isDown || isRevivedWait || (compActedThisRound && !senBonusActionReady) || isSameSkillInBonus || (curSlotCd > 0) || needsCharge;

      btnEl.disabled = isDisabled;
      if (wrapEl) wrapEl.classList.toggle('comp-tile-disabled', isDisabled);

      if (needsCharge || isRevivedWait) {
        const qIdx = actionQueue.findIndex(item => item.actor === 'comp' && item.key === tag);
        if (qIdx !== -1) { actionQueue.splice(qIdx, 1); renderQueueUI(); }
      }

      if (iconBoxEl) {
        const circleCls = sk.cd > 0 ? 'c-2' : 'c-0';
        let overlayInner = '';
        if (isDown) {
          overlayInner = `<span class="dash-cd-icon">💀</span>`;
        } else if (isRevivedWait) {
          overlayInner = `<span class="dash-cd-icon" title="부활 당해 라운드 행동 불가 (단일 공격 타겟 보호 중)">🛡️</span>`;
        } else if (curSlotCd > 0) {
          overlayInner = `<span class="dash-cd-number">${curSlotCd}</span>`;
        } else if (needsCharge || isSameSkillInBonus) {
          overlayInner = `<span class="dash-cd-icon">🔒</span>`;
        }
        syncDashSkillIconBox(iconBoxEl, sk, circleCls, overlayInner);
      }

      if (nameEl) {
        nameEl.innerText = sk.name;
        nameEl.classList.toggle('awakened', sk.reqLv >= 2);
      }

      if (tipEl) {
        const cdLabel = sk.cd > 0 ? `쿨다운 ${sk.cd}R (현재: ${curSlotCd > 0 ? curSlotCd + 'R 대기' : '준비'})` : '상시 사용 (쿨다운 없음)';
        const lvTag = sk.reqLv > 1 ? ` · Lv.${sk.reqLv} 전문화` : ' · 기본';
        const chargeNote = (pickedComp === '센') ? `<div style="margin-top:4px; color:#b794f4; font-weight:800;">🔮 현재 마탄 차징: ${senCharge} / 3스택</div>` : '';
        tipEl.innerHTML = `
          <div class="tooltip-title">
            <span style="color:#d8b4fe;">[${tag}슬롯${lvTag}] ${sk.name}${sk.dmg > 0 ? ` (기본 ${sk.dmg}${compDmgBonusStr})` : ''}</span>
          </div>
          <div style="font-size:10.5px; color:#f8fafc; font-weight:800; margin-bottom:3px;">⚡ ${sk.subText}</div>
          <div style="font-size:10px; color:#68d391; font-weight:800; margin-bottom:4px;">⏱️ ${cdLabel}</div>
          <div style="color:#cbd5e1; font-size:11px; line-height:1.5;">${sk.desc}</div>
          ${chargeNote}
        `;
      }
    });

    // 컴패니언 행동 소모 시 덱 비활성화 및 어둡게 처리 (단, 무영의 검무 추가 행동 대기 중일 때는 활성 유지)
    const compSkillPanelEl = document.querySelector('.comp-skill-panel');
    const compGridEl = document.querySelector('.comp-action-grid');
    const isCompDeckLockedByAct = Boolean(compActedThisRound && !senBonusActionReady);
    if (compSkillPanelEl) {
      compSkillPanelEl.classList.toggle('panel-acted-done', isCompDeckLockedByAct);
      const titleRow = compSkillPanelEl.querySelector('.panel-box-title');
      if (titleRow) {
        let pill = document.getElementById('comp-acted-pill');
        if (isCompDeckLockedByAct) {
          if (!pill) {
            pill = document.createElement('span');
            pill.id = 'comp-acted-pill';
            pill.className = 'acted-status-pill';
            pill.style.cursor = 'pointer';
            pill.title = '이번 라운드 동료 행동을 소모했습니다 (클릭 시 수동 재활성화)';
            pill.onclick = (ev) => toggleActorActedState('comp', ev);
            titleRow.appendChild(pill);
          }
          pill.innerText = '✓ 행동 완료 (재활성화)';
        } else if (pill) {
          pill.remove();
        }
      }
    }
    if (compGridEl) {
      compGridEl.classList.toggle('deck-acted-disabled', isCompDeckLockedByAct);
    }

    // 동료 개별 스킬 쿨타임은 슬롯 배지로 표시

    // 마검사 4Lv [무영의 검무] 추가 행동 바 표시 제어
    const bonusBar = document.getElementById('comp-bonus-action-bar');
    if (bonusBar) {
      bonusBar.style.display = (senBonusActionReady && compHp > 0) ? 'flex' : 'none';
    }

    // [열기 전도 (성염 분담)] 아이콘 타일 및 플로팅 툴팁 갱신
    const heatWrap = (DOM.compWraps && DOM.compWraps.HEAT) || document.getElementById('wrap-comp-HEAT');
    const heatBtn = (DOM.compBtns && DOM.compBtns.heat) || document.getElementById('comp-btn-heat');
    const heatTip = document.getElementById('comp-tip-heat');
    if (heatBtn) {
      const isCompRestricted = compStatuses.some(s => s.name.includes('행동 제약')) && !isCompImmuneToRestriction();
      const canConduction = (compHp >= 1) && !compRevivedThisRound && (pyrite >= 1) && (heat > 0) && !isCompRestricted;
      const isHeatDisabled = Boolean(compActedThisRound && !senBonusActionReady) || (!canConduction && !actionQueue.some(i => i.actor === 'comp' && i.key === 'HEAT'));
      heatBtn.disabled = isHeatDisabled;
      if (heatWrap) heatWrap.classList.toggle('comp-tile-disabled', isHeatDisabled);

      let heatStatusLine = `<span style="color:#68d391;">✓ 사용 가능 (💎 휘석 -1 · ${getCompName()} 실제 HP -1 ➔ 베어러 과열 -30 냉각)</span>`;
      if (compHp < 1) heatStatusLine = `<span style="color:#f87171;">🔒 시전 불가: 동료 탈진 상태</span>`;
      else if (compRevivedThisRound) heatStatusLine = `<span style="color:#f87171;">🛡️ 시전 불가: 부활 당해 라운드 재정비 중</span>`;
      else if (pyrite < 1) heatStatusLine = `<span style="color:#f87171;">🔒 시전 불가: 장미 휘석 1개 필요 (보유: ${pyrite}개)</span>`;
      else if (heat <= 0) heatStatusLine = `<span style="color:#94a3b8;">❄️ 현재 베어러 과열 0 (냉각 불필요)</span>`;
      else if (isCompRestricted) heatStatusLine = `<span style="color:#f87171;">⛓️ 시전 불가: 동료 [행동 제약] 중</span>`;

      if (heatTip) {
        heatTip.innerHTML = `
          <div class="tooltip-title">
            <span style="color:#fbd38d;">🔥 열기 전도 (성염 분담)</span>
            <span style="font-size:10px; color:#38bdf8;">과열 -30</span>
          </div>
          <div style="font-size:10.5px; font-weight:800; margin-bottom:4px; border-bottom:1px dashed rgba(255,255,255,0.15); padding-bottom:3px;">${heatStatusLine}</div>
          <div style="color:#cbd5e1; font-size:11px; line-height:1.5;">
            컴패니언이 자신의 턴 행동을 소모하고 <b>장미 휘석 1개</b>를 매개로 베어러의 끓어오르는 성염 열기를 대신 받아냅니다.<br>
            방어막을 무시하고 <b>컴패니언의 실제 HP가 1 차감</b>되며, 즉시 <b>베어러의 과열을 -30 냉각</b>합니다.
          </div>
        `;
      }
    }

    const pyriteCount = DOM.pyriteCount || document.getElementById('pyrite-count');
    if (pyriteCount) pyriteCount.innerText = pyrite;
    const potionCount = DOM.potionCount || document.getElementById('potion-count');
    if (potionCount) potionCount.innerText = potion;
    const deathStackCount = DOM.deathStackCount || document.getElementById('death-stack-count');
    if (deathStackCount) deathStackCount.innerText = deathStack;
    const headerPyrite = DOM.headerPyrite || document.getElementById('header-pyrite');
    if (headerPyrite) headerPyrite.innerText = pyrite;
    const headerPotion = DOM.headerPotion || document.getElementById('header-potion');
    if (headerPotion) headerPotion.innerText = potion;

    /* 카른 출신 특전: 심토의 안목 [⛏️ 채취] 버튼 노출 조건부 제어 */
    const miningBtn = document.getElementById('btn-mining-check');
    if (miningBtn) {
      const isKarn = Boolean(pickedOrigin && pickedOrigin.includes('카른'));
      miningBtn.style.display = isKarn ? 'inline-flex' : 'none';
    }

    /* 전투 개시 버튼 상태 갱신 */
    const startCombatBtn = document.getElementById('btn-start-combat');
    if (startCombatBtn) {
      if (combatStarted) {
        startCombatBtn.innerText = `⚔️ 교전중(${curRound}R)`;
        startCombatBtn.style.background = '#1e293b';
        startCombatBtn.style.borderColor = '#475569';
        startCombatBtn.style.color = '#94a3b8';
      } else {
        startCombatBtn.innerText = '⚔️ 전투 개시';
        startCombatBtn.style.background = '#3b1d1d';
        startCombatBtn.style.borderColor = '#f87171';
        startCombatBtn.style.color = '#fca5a5';
      }
    }

    /* [Phase 3] 베어러 5스킬 덱 카드 렌더링 및 메이지 성염 장전 바 동기화 */
    ensureValidBearerDeck(false);
    renderMageChargeBar();

    [0, 1, 2, 3, 4].forEach(slotIdx => {
      const skillId = bearerDeck[slotIdx];
      const sk = getBearerSkillById(skillId);
      const cardEl = (DOM.skillCards && DOM.skillCards[slotIdx]) || document.getElementById(`card-bearer-${slotIdx}`);
      const iconBoxEl = document.getElementById(`icon-bearer-${slotIdx}`);
      const nameEl = (DOM.skillNames && DOM.skillNames[slotIdx]) || document.getElementById(`name-${slotIdx}`);
      const tipEl = (DOM.skillTips && DOM.skillTips[slotIdx]) || document.getElementById(`tip-${slotIdx}`);
      if (!sk || !cardEl) return;

      if (nameEl) {
        nameEl.innerText = sk.name;
        if (sk.reqLv >= 2) nameEl.classList.add('awakened');
        else nameEl.classList.remove('awakened');
      }

      let lockReason = '';
      if (!sk.isPassive) {
        if (sk.reqHeat && heat < sk.reqHeat) {
          lockReason = `[잠김] 과열 ${sk.reqHeat} 필요 (${heat}/${sk.reqHeat})`;
        } else if (sk.reqHalfHp && (hp * 2 > maxHp)) {
          lockReason = `[잠김] HP 50% 이하 필요 (${hp}/${maxHp})`;
        } else if (sk.reqCompAlive && compHp <= 0) {
          lockReason = `[잠김] 동료 생존 시에만 가능`;
        }
      }

      if (iconBoxEl) {
        const overlayInner = lockReason ? `<span class="dash-cd-icon">🔒</span>` : '';
        syncDashSkillIconBox(iconBoxEl, sk, `c-${sk.circle}`, overlayInner);
      }

      cardEl.classList.toggle('passive-card', Boolean(sk.isPassive));
      if (lockReason) {
        cardEl.classList.add('heat-locked');
        const qIdx = actionQueue.findIndex(item => item.actor === 'bearer' && item.key === slotIdx);
        if (qIdx !== -1) {
          actionQueue.splice(qIdx, 1);
          renderQueueUI();
        }
      } else {
        cardEl.classList.remove('heat-locked');
      }

      if (tipEl) {
        const bonusDmg = curLevel - 1;
        const heatDmg = getOverheatDmgBonus(heat);
        const totalBonus = bonusDmg + heatDmg + (warGodSoulActive ? 3 : 0);
        const dmgStr = (sk.dmg > 0) ? ` (기본 ${sk.dmg}${totalBonus > 0 ? ` + 보정 ${totalBonus}` : ''})` : '';
        let condHtml = '';
        if (sk.reqHeat) {
          condHtml += `<div style="font-size:10.5px; color:${heat >= sk.reqHeat ? '#68d391' : '#f87171'}; font-weight:800; margin-bottom:4px; border-bottom:1px dashed rgba(255,255,255,0.15); padding-bottom:3px;">🔒 시전 조건: 현재 과열 ${sk.reqHeat} 이상 (현재: ${heat}/100)</div>`;
        }
        if (sk.reqHalfHp) {
          condHtml += `<div style="font-size:10.5px; color:${(hp * 2 <= maxHp) ? '#68d391' : '#f87171'}; font-weight:800; margin-bottom:4px; border-bottom:1px dashed rgba(255,255,255,0.15); padding-bottom:3px;">🔒 시전 조건: 베어러 현재 HP 절반 이하 (현재: ${hp}/${maxHp})</div>`;
        }
        if (sk.reqCompAlive) {
          condHtml += `<div style="font-size:10.5px; color:${compHp > 0 ? '#68d391' : '#f87171'}; font-weight:800; margin-bottom:4px; border-bottom:1px dashed rgba(255,255,255,0.15); padding-bottom:3px;">🔒 시전 조건: 동료 생존 시에만 가능</div>`;
        }
        const opt = slotRunOptions[slotIdx] || {};
        const costTagStr = sk.isPassive ? '4Lv 패시브 (상시)' : (sk.id === 'm_1_3' ? '충전 마법 과열 지불' : (sk.id === 'l_1_1' ? `과열 +${opt.varCost !== undefined ? opt.varCost : '0~50'}` : (sk.circle === 'var' ? `과열 +${opt.varCost || '10~50'}` : `과열 +${sk.cost}`)));
        tipEl.innerHTML = `
          <div class="tooltip-title">
            <span style="color:#fbd38d;">[${sk.circleLabel}] ${sk.name}${dmgStr}</span>
            <span style="font-size:10px; color:#38bdf8;">${costTagStr}</span>
          </div>
          <div style="font-size:10.5px; color:#f8fafc; font-weight:800; margin-bottom:4px;">⚡ ${sk.subText}</div>
          ${condHtml}
          <div style="color:#cbd5e1; font-size:11px; line-height:1.55;">${sk.desc}</div>
        `;
      }
    });

    // 베어러 행동 소모 시 덱 비활성화 및 어둡게 처리
    const bearerSkillPanelEl = document.querySelector('.bearer-skill-panel');
    const bearerGridEl = document.getElementById('bearer-skill-grid');
    if (bearerSkillPanelEl) {
      bearerSkillPanelEl.classList.toggle('panel-acted-done', Boolean(bearerActedThisRound));
      const titleRow = bearerSkillPanelEl.querySelector('.panel-box-title');
      if (titleRow) {
        let pill = document.getElementById('bearer-acted-pill');
        if (bearerActedThisRound) {
          if (!pill) {
            pill = document.createElement('span');
            pill.id = 'bearer-acted-pill';
            pill.className = 'acted-status-pill';
            pill.style.cursor = 'pointer';
            pill.title = '이번 라운드 베어러 행동을 소모했습니다 (클릭 시 수동 재활성화)';
            pill.onclick = (ev) => toggleActorActedState('bearer', ev);
            titleRow.appendChild(pill);
          }
          pill.innerText = '✓ 행동 완료 (재활성화)';
        } else if (pill) {
          pill.remove();
        }
      }
    }
    if (bearerGridEl) {
      bearerGridEl.classList.toggle('deck-acted-disabled', Boolean(bearerActedThisRound));
    }

    if (typeof renderCommunionBar === 'function') {
      renderCommunionBar();
    }
    if (typeof renderSyncBridgeUI === 'function') {
      renderSyncBridgeUI();
    }
    const modalEl = document.getElementById('skilltree-modal');
    if (modalEl && modalEl.classList.contains('open')) {
      renderDeckBuilderModal();
    }
  }

  /* 메이지 전용: 성염 장전 슬롯 바 렌더링 */
  function renderMageChargeBar() {
    const bar = document.getElementById('mage-charge-bar');
    if (!bar) return;
    const hasChargeSkillInDeck = (pickedClass === '메이지') && bearerDeck.includes('m_1_3');
    if (pickedClass !== '메이지' || (!hasChargeSkillInDeck && mageChargedSpells.length === 0)) {
      bar.style.display = 'none';
      return;
    }
    bar.style.display = 'flex';
    const slotsEl = document.getElementById('mage-charge-slots');
    if (slotsEl) {
      let html = '';
      for (let i = 0; i < 2; i++) {
        const sp = mageChargedSpells[i];
        if (sp) {
          html += `<span class="mage-charge-chip filled">⚡ ${i + 1}: ${sp.name} (${sp.dmg > 0 ? `${sp.dmg}피해` : '보조'})</span>`;
        } else {
          html += `<span class="mage-charge-chip">슬롯 ${i + 1}: 비어있음</span>`;
        }
      }
      slotsEl.innerHTML = html;
    }
    const relBtn = document.getElementById('btn-mage-release');
    if (relBtn) {
      if (typeof bindMageReleaseDrag === 'function') bindMageReleaseDrag();
      const isBearerRestr = bearerStatuses.some(s => s.name.includes('행동 제약')) && !isBearerImmuneToRestriction();
      const hasSameRoundSpell = mageChargedSpells.some(sp => (sp.chargedRound || 0) >= curRound);
      relBtn.disabled = (mageChargedSpells.length === 0 || isExecuting || isBearerRestr || hasSameRoundSpell);
      if (mageChargedSpells.length > 0 && isBearerRestr) {
        relBtn.innerText = `⛓️ 개방 불가 (행동 제약 중)`;
      } else if (mageChargedSpells.length > 0 && hasSameRoundSpell) {
        relBtn.innerText = `⏳ 개방 (${mageChargedSpells.length}/2)`;
      } else {
        relBtn.innerText = `⚡ 일괄 개방 (${mageChargedSpells.length}/2 · 무행동)`;
      }
    }
  }

  function clearChargedSpells() {
    if (mageChargedSpells.length === 0) return;
    mageChargedSpells = [];
    playBeep(320, 'sine', 0.1);
    log(`🔮 <b>[성염 장전 초기화]</b> 지팡이에 충전되어 있던 마법 슬롯을 비웠습니다.`);
    refreshUI();
    saveSessionState();
  }

  /* [Phase 3 & 4] 베어러(5스킬) & 컴패니언(3스킬) 통합 덱 편성 & 전문화 모달 컨트롤러 */
  function openRadialTreeModal(mode = 'bearer') {
    deckModalMode = (mode === 'comp') ? 'comp' : 'bearer';
    const m = document.getElementById('skilltree-modal');
    if (m) {
      m.classList.add('open');
      m.style.display = 'flex';
    }
    ensureValidBearerDeck(false);
    ensureValidCompDeck(false);
    renderDeckBuilderModal();
    playBeep(520, 'sine', 0.08);
  }
  window.openDeckBuilderModal = openRadialTreeModal;

  function openCompDeckModal() {
    openRadialTreeModal('comp');
  }
  window.openCompDeckModal = openCompDeckModal;

  function switchDeckModalMode(mode) {
    deckModalMode = (mode === 'comp') ? 'comp' : 'bearer';
    playBeep(560, 'triangle', 0.08);
    renderDeckBuilderModal();
  }
  window.switchDeckModalMode = switchDeckModalMode;
  window.switchDeckBuilderMode = switchDeckModalMode;

  function closeRadialTreeModal(e) {
    if (e && e.target !== e.currentTarget && e.target.className !== 'popover-close-btn') return;
    const m = document.getElementById('skilltree-modal');
    if (m) {
      m.classList.remove('open');
      m.style.display = 'none';
    }
    playBeep(320, 'sine', 0.08);
  }

  function toggleDeckUnlockAll() {
    allowAllLevelSkills = !allowAllLevelSkills;
    playBeep(allowAllLevelSkills ? 640 : 420, 'triangle', 0.08);
    renderDeckBuilderModal();
    refreshUI();
    saveSessionState();
  }

  function resetCurrentDeckToDefault() {
    if (deckModalMode === 'comp') {
      ensureValidCompDeck(true);
      selectedCompSlotIdx = 0;
      compCds = { A: 0, B: 0, C: 0 };
      actionQueue = actionQueue.filter(item => item.actor !== 'comp');
      playBeep(480, 'triangle', 0.12);
      log(`🃏 <b>[동료 덱 초기화]</b> ${getCompName()} 1레벨 기본 3스킬 덱으로 복원되었습니다.`);
    } else {
      ensureValidBearerDeck(true);
      selectedDeckSlotIdx = 0;
      actionQueue = actionQueue.filter(item => item.actor !== 'bearer');
      playBeep(480, 'triangle', 0.12);
      log(`🃏 <b>[베어러 덱 초기화]</b> ${pickedClass} 1레벨 기본 5스킬 덱으로 복원되었습니다.`);
    }
    renderDeckBuilderModal();
    renderQueueUI();
    refreshUI();
    saveSessionState();
  }
  window.resetBearerDeckToDefault = resetCurrentDeckToDefault;
  window.resetCurrentDeckToDefault = resetCurrentDeckToDefault;