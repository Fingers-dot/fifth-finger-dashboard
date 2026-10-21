/* ==========================================================================
     9. 이미지 프리로딩 & GPU 사전 디코딩(Baking) 엔진 (전역 스코프 & 우선순위 큐)
     - 93개 스킬 아이콘이 한꺼번에 네트워크를 점유하지 않도록 우선순위 큐로 제어하고,
       완료된 이미지는 오프스크린 GPU 레이어(#gpu-image-warmup-layer)에 상주시킵니다.
     ========================================================================== */
  const PRELOADED_IMAGE_CACHE = new Map();
  const WARMED_SKILL_IDS = new Set();
  const SKILL_PRELOAD_QUEUE = [];
  let activePreloadWorkers = 0;
  const MAX_CONCURRENT_SKILL_PRELOADS = 6;

  function getGpuWarmupLayer() {
    let layer = document.getElementById('gpu-image-warmup-layer');
    if (!layer && document.body) {
      layer = document.createElement('div');
      layer.id = 'gpu-image-warmup-layer';
      layer.setAttribute('aria-hidden', 'true');
      layer.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;opacity:0.001;pointer-events:none;overflow:hidden;z-index:-9999;contain:strict;';
      document.body.appendChild(layer);
    }
    return layer;
  }

  function bakeDecodedImageToGpuLayer(src) {
    if (!src) return Promise.resolve(null);
    if (PRELOADED_IMAGE_CACHE.has(src)) return Promise.resolve(PRELOADED_IMAGE_CACHE.get(src));
    return new Promise((resolve) => {
      const img = new Image();
      img.decoding = 'sync';
      img.loading = 'eager';
      const finalize = () => {
        PRELOADED_IMAGE_CACHE.set(src, img);
        const layer = getGpuWarmupLayer();
        if (layer && !layer.querySelector(`img[data-baked-src="${CSS.escape(src)}"]`)) {
          const clone = document.createElement('img');
          clone.src = src;
          clone.setAttribute('data-baked-src', src);
          clone.width = 16;
          clone.height = 16;
          layer.appendChild(clone);
        }
        resolve(img);
      };
      img.onload = () => {
        if (typeof img.decode === 'function') {
          img.decode().then(finalize).catch(finalize);
        } else {
          finalize();
        }
      };
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }
  window.bakeDecodedImageToGpuLayer = bakeDecodedImageToGpuLayer;

  function runSkillIconPreloadSingle(sk) {
    return new Promise((resolve) => {
      if (!sk || !sk.id) {
        resolve();
        return;
      }
      if (loadedCustomSkillIcons.has(sk.id) || missingCustomSkillIcons.has(sk.id)) {
        resolve();
        return;
      }
      const candidates = getSkillIconCandidates(sk);
      let idx = 0;

      const tryCandidate = () => {
        if (idx >= candidates.length) {
          missingCustomSkillIcons.add(sk.id);
          document.querySelectorAll(`img.skill-custom-img[data-skill-id="${sk.id}"]`).forEach(el => {
            el.style.display = 'none';
            if (el.parentElement) {
              el.parentElement.classList.remove('has-custom-img');
              el.parentElement.classList.add('missing-custom-img');
            }
          });
          resolve();
          return;
        }
        const url = candidates[idx++];
        const probe = new Image();
        probe.decoding = 'sync';
        probe.onload = () => {
          const commitLoaded = () => {
            resolvedSkillIconUrlMap.set(sk.id, url);
            loadedCustomSkillIcons.add(sk.id);
            missingCustomSkillIcons.delete(sk.id);
            bakeDecodedImageToGpuLayer(url);
            document.querySelectorAll(`img.skill-custom-img[data-skill-id="${sk.id}"]`).forEach(el => {
              if (el.getAttribute('src') !== url) el.src = url;
              el.style.display = '';
              if (el.parentElement) {
                el.parentElement.classList.remove('missing-custom-img');
                el.parentElement.classList.add('has-custom-img');
              }
            });
            resolve();
          };
          if (typeof probe.decode === 'function') {
            probe.decode().then(commitLoaded).catch(commitLoaded);
          } else {
            commitLoaded();
          }
        };
        probe.onerror = tryCandidate;
        probe.src = url;
      };

      tryCandidate();
    });
  }

  function pumpSkillPreloadQueue() {
    while (activePreloadWorkers < MAX_CONCURRENT_SKILL_PRELOADS && SKILL_PRELOAD_QUEUE.length > 0) {
      const nextSk = SKILL_PRELOAD_QUEUE.shift();
      activePreloadWorkers++;
      runSkillIconPreloadSingle(nextSk).finally(() => {
        activePreloadWorkers--;
        pumpSkillPreloadQueue();
      });
    }
  }

  function preloadSkillIconByCandidateChain(sk, highPriority = false) {
    if (!sk || !sk.id) return;
    if (WARMED_SKILL_IDS.has(sk.id)) {
      if (highPriority) {
        const qIdx = SKILL_PRELOAD_QUEUE.findIndex(item => item.id === sk.id);
        if (qIdx > 0) {
          const [item] = SKILL_PRELOAD_QUEUE.splice(qIdx, 1);
          SKILL_PRELOAD_QUEUE.unshift(item);
        }
      }
      return;
    }
    WARMED_SKILL_IDS.add(sk.id);
    if (highPriority) {
      SKILL_PRELOAD_QUEUE.unshift(sk);
    } else {
      SKILL_PRELOAD_QUEUE.push(sk);
    }
    pumpSkillPreloadQueue();
  }

  function warmUpSkillIconsForClass(cls) {
    const targetCls = cls || pickedClass;
    const all = getClassSkillList(targetCls);
    // 1레벨 기본 스킬 5종 최우선 큐 배치 후 나머지 전문화 스킬 배치
    all.filter(sk => sk.reqLv === 1).forEach(sk => preloadSkillIconByCandidateChain(sk, true));
    all.filter(sk => sk.reqLv > 1).forEach(sk => preloadSkillIconByCandidateChain(sk, true));
  }
  window.warmUpSkillIconsForClass = warmUpSkillIconsForClass;

  function warmUpSkillIconsForComp(comp) {
    const targetComp = comp || pickedComp;
    const all = getCompSkillList(targetComp);
    preloadSkillIconByCandidateChain({ id: 'comp_heat', name: '열기 전도' }, true);
    all.filter(sk => sk.reqLv === 1).forEach(sk => preloadSkillIconByCandidateChain(sk, true));
    all.filter(sk => sk.reqLv > 1).forEach(sk => preloadSkillIconByCandidateChain(sk, true));
  }
  window.warmUpSkillIconsForComp = warmUpSkillIconsForComp;

  function initImagePreloaderAndGpuBaker() {
    getGpuWarmupLayer();

    // 1단계 (즉시 병렬): 현재 선택된 클래스/동료 스킬 아이콘을 포트레이트 대기 없이 즉시 최우선 프리로드 시작
    warmUpSkillIconsForClass(pickedClass);
    warmUpSkillIconsForComp(pickedComp);

    // 전체 93종 스킬 아이콘을 우선순위 큐에 등록 (동시 6개씩 병목 없이 순차 디코딩)
    Object.values(BEARER_SKILL_DB).forEach(sk => preloadSkillIconByCandidateChain(sk, false));
    Object.values(COMP_SKILL_DB).forEach(sk => preloadSkillIconByCandidateChain(sk, false));

    // 2단계: 출신 배경 4종 + 클래스 4종 + 동료 4종 핵심 포트레이트 12종 디코딩 & GPU 굽기
    const corePortraits = [
      'assets/artis.png', 'assets/tison.png', 'assets/karn.png', 'assets/renig.png',
      'assets/fighter.png', 'assets/swordsman.png', 'assets/mage.png', 'assets/lamplighter.png',
      'assets/dedro.png', 'assets/lily.png', 'assets/sen.png', 'assets/mayungeom.png'
    ];
    Promise.all(corePortraits.map(src => bakeDecodedImageToGpuLayer(src))).then(() => {
      // 3단계: 대륙 전체도 및 12개 권역 지도 이미지 순차 백그라운드 디코딩 & GPU 굽기
      setTimeout(() => {
        const mapCodes = Object.keys(MAP_REGIONS_DATA);
        let mIdx = 0;
        const bakeNextMap = () => {
          if (mIdx >= mapCodes.length) return;
          const reg = MAP_REGIONS_DATA[mapCodes[mIdx++]];
          if (reg && reg.fileName) {
            bakeDecodedImageToGpuLayer(`maps/${reg.fileName}`).then((res) => {
              if (!res) bakeDecodedImageToGpuLayer(`assets/maps/${reg.fileName}`);
              setTimeout(bakeNextMap, 60);
            });
          } else {
            bakeNextMap();
          }
        };
        bakeNextMap();
      }, 600);
    });
  }

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initImagePreloaderAndGpuBaker);
  } else {
    initImagePreloaderAndGpuBaker();
  }

  /* ==========================================================================
     10. [수술 1~2단계] 온라인 방 코드(PeerJS) + 클립보드 파서 & 전장 타겟 조준 시스템
     ========================================================================== */
  const SYNC_SAVED_ENEMIES_KEY = 'fifth_finger_synced_enemies_v224';

  let syncedEnemies = [];
  let syncedStageName = '';
  let syncedStagePyrite = 0;
  let syncConnectionMode = 'none'; // 'none' | 'peer' | 'clipboard'
  let activePeerRoomCode = '';
  let playerPeerInstance = null;
  let playerPeerConn = null;
  let processedSyncMsgIds = new Set();

  // [2단계 & 3단계] 베어러 & 동료 개별 조준 타겟 UID 및 라운드 내 적중 추적기
  let selectedBearerTargetUid = null;
  let selectedCompTargetUid = null;
  let lastBearerHitTargetUid = null;
  let lastCompHitTargetUid = null;
  let bearerDirectHitUidsThisRound = new Set();
  let compDirectHitUidsThisRound = new Set();
  let bearerRollHitUidsThisRound = new Set();
  let compRollHitUidsThisRound = new Set();
  let pendingGmActionEffects = [];

  function queueGmEffect(eff) {
    if (eff) pendingGmActionEffects.push(eff);
  }
  window.queueGmEffect = queueGmEffect;

  /* 대시보드 로컬 적 데이터(syncedEnemies)에 즉시 피해 및 상태이상 시뮬레이션 반영 (1순위 행동 ➔ 2순위 행동 시너지 보장) */
  function applyLocalSyncedEnemyDamage(enemyObj, amount, ignoreShield = false) {
    if (!enemyObj || enemyObj.hp <= 0 || amount <= 0) return { absorbed: 0, hpLost: 0, killed: false };
    let effectiveAmount = amount;
    if ((enemyObj.dmgReduction || 0) > 0) {
      effectiveAmount = Math.max(0, amount - enemyObj.dmgReduction);
      if (effectiveAmount <= 0) {
        return { absorbed: 0, hpLost: 0, killed: false };
      }
    }
    let dmgToHp = effectiveAmount;
    let absorbed = 0;

    if (!ignoreShield && (enemyObj.shield || 0) > 0) {
      if (enemyObj.shield >= amount) {
        absorbed = amount;
        enemyObj.shield -= amount;
        dmgToHp = 0;
      } else {
        absorbed = enemyObj.shield;
        dmgToHp = amount - absorbed;
        enemyObj.shield = 0;
      }
    }

    const isP1Boss = (!enemyObj.isPhase2 && /보스|결전/.test(enemyObj.grade || ''));
    const nextHp = enemyObj.hp - dmgToHp;
    if (isP1Boss && enemyObj.hp > Math.floor(enemyObj.maxHp / 2) && nextHp <= Math.floor(enemyObj.maxHp / 2)) {
      enemyObj.hp = Math.max(1, nextHp);
      enemyObj.isPhase2 = true;
      enemyObj.ac = 14;
      enemyObj.shield = 0;
      enemyObj.status.weak = false;
      enemyObj.status.weakCharges = 0;
      enemyObj.status.bindTurns = 0;
    } else {
      enemyObj.hp = Math.max(0, nextHp);
    }

    const killed = (enemyObj.hp <= 0);
    if (killed) {
      enemyObj.shield = 0;
      enemyObj.status.weak = false;
      enemyObj.status.weakCharges = 0;
      enemyObj.status.bindTurns = 0;
      enemyObj.status.dots = [];
    }
    ensureValidEnemyTargets();
    saveSyncedEnemiesToStorage();
    renderSyncBridgeUI();
    return { absorbed, hpLost: dmgToHp, killed };
  }
  window.applyLocalSyncedEnemyDamage = applyLocalSyncedEnemyDamage;

  function applyLocalEnemyWeak(enemyObj, charges = 1) {
    if (!enemyObj || enemyObj.hp <= 0) return;
    enemyObj.status.weak = true;
    enemyObj.status.weakCharges = Math.max(enemyObj.status.weakCharges || 0, charges);
    enemyVuln = true;
    enemyVulnCharges = Math.max(enemyVulnCharges, charges);
    updateEnemyVulnUI();
    saveSyncedEnemiesToStorage();
    renderSyncBridgeUI();
  }

  function consumeLocalEnemyWeak(enemyObj) {
    if (!enemyObj || !enemyObj.status || !enemyObj.status.weak) return false;
    if ((enemyObj.status.weakCharges || 1) > 1) {
      enemyObj.status.weakCharges--;
    } else {
      enemyObj.status.weak = false;
      enemyObj.status.weakCharges = 0;
    }
    const anyStillWeak = getLivingSyncedEnemies().some(e => e.status && e.status.weak);
    enemyVuln = anyStillWeak;
    if (!anyStillWeak) enemyVulnCharges = 0;
    updateEnemyVulnUI();
    saveSyncedEnemiesToStorage();
    renderSyncBridgeUI();
    return true;
  }

  function applyLocalEnemyBind(enemyObj, turns = 1) {
    if (!enemyObj || enemyObj.hp <= 0) return;
    enemyObj.status.bindTurns = Math.max(enemyObj.status.bindTurns || 0, turns);
    saveSyncedEnemiesToStorage();
    renderSyncBridgeUI();
  }

  function addLocalEnemyDot(enemyObj, dmg = 2, turns = 2) {
    if (!enemyObj || enemyObj.hp <= 0) return;
    if (!Array.isArray(enemyObj.status.dots)) enemyObj.status.dots = [];
    enemyObj.status.dots.push({
      id: 'ldot_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5),
      dmg,
      turns
    });
    saveSyncedEnemiesToStorage();
    renderSyncBridgeUI();
  }

  function extendLocalEnemyDots(enemyObj, addTurns = 1) {
    if (!enemyObj || enemyObj.hp <= 0 || !Array.isArray(enemyObj.status.dots)) return 0;
    let count = 0;
    enemyObj.status.dots.forEach(d => {
      d.turns += addTurns;
      count++;
    });
    saveSyncedEnemiesToStorage();
    renderSyncBridgeUI();
    return count;
  }

  function analyzeEnemyIntentString(intentStr, enemyName) {
    const str = String(intentStr || '');
    const nameStr = String(enemyName || '');
    const isChargeIntent = /충전|예고/.test(str);
    const isAoeIntent = /광역|전체|모두/.test(str);
    const isFlying = /활공|비행|체공|공중|날개|부유/.test(str + ' ' + nameStr);
    const compNameStr = (typeof getCompName === 'function') ? getCompName() : '';
    const targetsBearer = Boolean(
      isAoeIntent ||
      /베어러/.test(str) ||
      (bearerName && str.includes(bearerName))
    );
    const targetsComp = Boolean(
      isAoeIntent ||
      /동료|컴패니언|워리어|소서러|마검사|리퍼|데드로|릴리|센|마윤겸/.test(str) ||
      (compNameStr && str.includes(compNameStr))
    );
    const isSingleAmbiguous = Boolean(!isAoeIntent && /단일/.test(str) && !targetsBearer && !targetsComp);

    return {
      isAoeIntent,
      isChargeIntent,
      isFlying,
      targetsBearer,
      targetsComp,
      isSingleAmbiguous
    };
  }
  window.analyzeEnemyIntentString = analyzeEnemyIntentString;

  function normalizeSyncedEnemy(raw, idx = 0) {
    if (!raw) return null;
    const baseName = raw.baseName || raw.name || `적 ${idx + 1}`;
    const letterTag = raw.letterTag || '';
    const fullName = (letterTag && !String(raw.name || '').endsWith(' ' + letterTag))
      ? `${baseName} ${letterTag}`
      : (raw.name || baseName);

    let curIntent = raw.intent || '';
    if (!curIntent && Array.isArray(raw.intentsP1)) {
      const list = (raw.isPhase2 && Array.isArray(raw.intentsP2) && raw.intentsP2.length > 0) ? raw.intentsP2 : raw.intentsP1;
      const tIdx = (typeof raw.turnIdx === 'number') ? raw.turnIdx : 0;
      curIntent = list[tIdx % Math.max(1, list.length)] || list[0] || '';
    }

    const st = raw.status || {};
    const dots = Array.isArray(st.dots) ? st.dots.map((d, dIdx) => ({
      id: d.id || `dot_${idx}_${dIdx}`,
      dmg: Number(d.dmg) || 2,
      turns: Number(d.turns) || 1
    })) : [];

    const bindTurns = Number(st.bindTurns) || 0;
    const weak = Boolean(st.weak);
    const weakCharges = Number(st.weakCharges) || (weak ? 1 : 0);

    const intentMeta = analyzeEnemyIntentString(curIntent, fullName);

    return {
      uid: raw.uid || `sync_enemy_${idx}`,
      baseKey: raw.baseKey || 'custom',
      baseName: baseName,
      letterTag: letterTag,
      name: fullName,
      grade: raw.grade || '일반',
      hp: (raw.hp !== undefined) ? Number(raw.hp) : 10,
      maxHp: (raw.maxHp !== undefined) ? Number(raw.maxHp) : 10,
      shield: Number(raw.shield) || 0,
      ac: (raw.ac !== undefined) ? Number(raw.ac) : 11,
      isPhase2: Boolean(raw.isPhase2),
      intent: curIntent,
      resolvedTarget: raw.resolvedTarget || null,
      dmgReduction: Number(raw.dmgReduction) || 0,
      atkMod: Number(raw.atkMod) || 0,
      atkModTurns: Number(raw.atkModTurns) || (raw.atkMod ? 1 : 0),
      forceDis: Boolean(raw.forceDis),
      forceDisTurns: Number(raw.forceDisTurns) || (raw.forceDis ? 1 : 0),
      tauntedBy: raw.tauntedBy || null,
      confusedToUid: raw.confusedToUid || null,
      confusedToName: raw.confusedToName || null,
      isAoeIntent: intentMeta.isAoeIntent,
      isChargeIntent: intentMeta.isChargeIntent,
      isFlying: intentMeta.isFlying,
      targetsBearer: (raw.resolvedTarget === 'bearer') ? true : ((raw.resolvedTarget === 'comp') ? false : intentMeta.targetsBearer),
      targetsComp: (raw.resolvedTarget === 'comp') ? true : ((raw.resolvedTarget === 'bearer') ? false : intentMeta.targetsComp),
      isSingleAmbiguous: raw.resolvedTarget ? false : intentMeta.isSingleAmbiguous,
      status: {
        weak,
        weakCharges,
        bindTurns,
        dots,
        extraChips: Array.isArray(st.extraChips) ? st.extraChips : []
      }
    };
  }

  function getLivingSyncedEnemies() {
    return syncedEnemies.filter(e => e && e.hp > 0);
  }
  window.getLivingSyncedEnemies = getLivingSyncedEnemies;

  function ensureValidEnemyTargets() {
    const living = getLivingSyncedEnemies();
    if (living.length === 0) {
      selectedBearerTargetUid = null;
      selectedCompTargetUid = null;
      return;
    }
    if (!selectedBearerTargetUid || !living.some(e => e.uid === selectedBearerTargetUid)) {
      selectedBearerTargetUid = living[0].uid;
    }
    if (!selectedCompTargetUid || !living.some(e => e.uid === selectedCompTargetUid)) {
      selectedCompTargetUid = living[0].uid;
    }
  }
  window.ensureValidEnemyTargets = ensureValidEnemyTargets;

  function getEnemyByUid(uid) {
    if (!uid) return null;
    return syncedEnemies.find(e => e && e.uid === uid) || null;
  }
  window.getEnemyByUid = getEnemyByUid;

  function getTargetEnemyForActor(actor = 'bearer', explicitUid = null) {
    ensureValidEnemyTargets();
    const living = getLivingSyncedEnemies();
    if (living.length === 0) return null;
    if (explicitUid) {
      const found = living.find(e => e.uid === explicitUid);
      if (found) return found;
    }
    const targetUid = (actor === 'comp') ? selectedCompTargetUid : selectedBearerTargetUid;
    return living.find(e => e.uid === targetUid) || living[0];
  }
  window.getTargetEnemyForActor = getTargetEnemyForActor;

  /* 타겟 바에서 적 칩 클릭 시: 베어러+동료 동시 조준(점사) */
  function selectFocusTargetForBoth(uid, e) {
    if (e) e.stopPropagation();
    const en = getEnemyByUid(uid);
    if (!en || en.hp <= 0) return;
    selectedBearerTargetUid = uid;
    selectedCompTargetUid = uid;
    // 이미 등록된 단일 스킬 옵션의 타겟도 함께 갱신
    Object.keys(slotRunOptions).forEach(k => {
      if (slotRunOptions[k]) slotRunOptions[k].enemyUid = uid;
    });
    Object.keys(compSlotOptions).forEach(k => {
      if (compSlotOptions[k]) compSlotOptions[k].enemyUid = uid;
    });
    playBeep(620, 'triangle', 0.08);
    renderSyncBridgeUI();
    renderQueueUI();
  }
  window.selectFocusTargetForBoth = selectFocusTargetForBoth;

  /* 타겟 칩 내부의 [🗡️베어러] 또는 [🤝동료] 핀 클릭 시: 개별 분리 조준 */
  function selectTargetForActor(actor, uid, e) {
    if (e) e.stopPropagation();
    const en = getEnemyByUid(uid);
    if (!en || en.hp <= 0) return;
    if (actor === 'comp') {
      selectedCompTargetUid = uid;
      Object.keys(compSlotOptions).forEach(k => {
        if (compSlotOptions[k]) compSlotOptions[k].enemyUid = uid;
      });
    } else {
      selectedBearerTargetUid = uid;
      Object.keys(slotRunOptions).forEach(k => {
        if (slotRunOptions[k]) slotRunOptions[k].enemyUid = uid;
      });
    }
    playBeep(actor === 'comp' ? 560 : 660, 'sine', 0.08);
    renderSyncBridgeUI();
    renderQueueUI();
  }
  window.selectTargetForActor = selectTargetForActor;

  /* 스킬 인라인 팝업 상단용 빠른 타겟 선택기 HTML 생성 */
  function buildPopupTargetPickerHtml(actor, slotKey) {
    ensureValidEnemyTargets();
    const living = getLivingSyncedEnemies();
    if (living.length <= 1) return '';
    const curUid = (actor === 'comp')
      ? ((compSlotOptions[slotKey] && compSlotOptions[slotKey].enemyUid) || selectedCompTargetUid)
      : ((slotRunOptions[slotKey] && slotRunOptions[slotKey].enemyUid) || selectedBearerTargetUid);

    const chips = living.map((e, idx) => {
      const isAct = (e.uid === curUid);
      return `<button type="button" class="popup-target-chip ${isAct ? 'active' : ''}" onclick="setPopupActorTarget('${actor}', '${slotKey}', '${e.uid}', event)">🎯${idx + 1}. ${e.name} (AC ${e.ac})</button>`;
    }).join('');

    return `
      <div class="popup-target-picker" onclick="event.stopPropagation()">
        <div class="popup-target-picker-title">
          <span>🎯 ${actor === 'comp' ? getCompName() : bearerName} 공격 대상 지정</span>
          <span style="color:#94a3b8; font-weight:700;">클릭 변경</span>
        </div>
        <div class="popup-target-chip-row">${chips}</div>
      </div>
    `;
  }
  window.buildPopupTargetPickerHtml = buildPopupTargetPickerHtml;

  function setPopupActorTarget(actor, slotKey, uid, e) {
    if (e) e.stopPropagation();
    if (actor === 'comp') {
      selectedCompTargetUid = uid;
      compSlotOptions[slotKey] = Object.assign({}, compSlotOptions[slotKey] || {}, { enemyUid: uid });
    } else {
      selectedBearerTargetUid = uid;
      slotRunOptions[slotKey] = Object.assign({}, slotRunOptions[slotKey] || {}, { enemyUid: uid });
    }
    playBeep(640, 'sine', 0.06);
    // 팝업 내 활성 칩 UI 즉시 갱신
    const popId = (actor === 'comp') ? `popup-comp-${slotKey}` : `popup-bearer-${slotKey}`;
    const popEl = document.getElementById(popId);
    if (popEl) {
      const pickerWrap = popEl.querySelector('.popup-target-picker');
      if (pickerWrap) {
        const temp = document.createElement('div');
        temp.innerHTML = buildPopupTargetPickerHtml(actor, slotKey);
        if (temp.firstElementChild) {
          pickerWrap.replaceWith(temp.firstElementChild);
        }
      }
    }
    renderSyncBridgeUI();
    renderQueueUI();
  }
  window.setPopupActorTarget = setPopupActorTarget;

  /* 연동된 적이 없을 때 원클릭으로 가상 타겟(적 1, 적 2, 적 3) 생성 */
  function createQuickDummyEnemies() {
    syncedStageName = '전술 교전 구역';
    syncedStagePyrite = 0;
    syncedEnemies = [
      normalizeSyncedEnemy({ uid: 'dummy_1', name: '적 1 (전방)', grade: '표적 A', hp: 10, maxHp: 10, ac: 11, intent: '교전 중 (단일 대상 조준용)' }, 0),
      normalizeSyncedEnemy({ uid: 'dummy_2', name: '적 2 (중앙)', grade: '표적 B', hp: 10, maxHp: 10, ac: 11, intent: '교전 중 (단일 대상 조준용)' }, 1),
      normalizeSyncedEnemy({ uid: 'dummy_3', name: '적 3 (후방)', grade: '표적 C', hp: 10, maxHp: 10, ac: 11, intent: '교전 중 (단일 대상 조준용)' }, 2)
    ];
    syncConnectionMode = 'clipboard';
    ensureValidEnemyTargets();
    saveSyncedEnemiesToStorage();
    renderSyncBridgeUI();
    renderQueueUI();
    playBeep(600, 'triangle', 0.12);
    log(`🎯 <b>[임시 타겟 슬롯 생성]</b> 단일 공격 대상 지정을 위해 <b>[적 1] [적 2] [적 3]</b> 타겟 슬롯을 활성화했습니다.`);
  }
  window.createQuickDummyEnemies = createQuickDummyEnemies;

    function isPlayerOnlineConnected() {
    return Boolean(syncConnectionMode === 'peer' && playerPeerConn && playerPeerConn.open);
  }
  window.isPlayerOnlineConnected = isPlayerOnlineConnected;

  function updateOnlineRoundEndButtonsUI() {
    const btnAdvance = document.getElementById('btn-advance-round');
    const btnEndCombat = document.getElementById('btn-end-combat');
    const isOnline = isPlayerOnlineConnected();

    if (btnAdvance) {
      btnAdvance.disabled = isOnline;
      btnAdvance.title = isOnline
        ? '온라인 연결 중 (마스터 컨트롤러에서 라운드를 종료합니다)'
        : '단독 모드 수동 라운드 종료 (쿨다운 -1 · 유지비/지속피해 정산 · 다음 라운드 개시)';
    }

    if (btnEndCombat) {
      btnEndCombat.disabled = isOnline;
      btnEndCombat.title = isOnline
        ? '온라인 연결 중 (마스터 컨트롤러에서 전투를 종료합니다)'
        : '단독 모드 전투 종료 (과열 냉각 · 방어막/버프 초기화)';
    }
  }
  window.updateOnlineRoundEndButtonsUI = updateOnlineRoundEndButtonsUI;

  function renderSyncBridgeUI() {
    ensureValidEnemyTargets();
    updateOnlineRoundEndButtonsUI();
    const bar = document.getElementById('battle-sync-bridge');
    const pill = document.getElementById('sync-status-pill');
    const stageLbl = document.getElementById('sync-stage-label');
    const previewStrip = document.getElementById('sync-enemy-preview-strip');
    const clearBtn = document.getElementById('btn-clear-synced-enemies');
    const peerBtn = document.getElementById('btn-peer-connect');
    if (!bar || !pill || !previewStrip) return;

    bar.classList.remove('sync-connected', 'sync-parsed');
    pill.className = 'sync-status-pill';

    const living = getLivingSyncedEnemies();

    if (syncConnectionMode === 'peer' && playerPeerConn && playerPeerConn.open) {
      bar.classList.add('sync-connected');
      pill.classList.add('peer-ok');
      pill.innerText = '연결됨';
      if (peerBtn) {
        peerBtn.innerText = '연결해제';
        peerBtn.classList.add('connected-disconnect');
      }
    } else if (syncConnectionMode === 'clipboard' || syncedEnemies.length > 0) {
      bar.classList.add('sync-parsed');
      pill.classList.add('clip-ok');
      pill.innerText = '미연결';
      if (peerBtn) {
        peerBtn.innerText = '연결';
        peerBtn.classList.remove('connected-disconnect');
      }
    } else {
      pill.innerText = '미연결';
      if (peerBtn) {
        peerBtn.innerText = '연결';
        peerBtn.classList.remove('connected-disconnect');
      }
    }

    if (stageLbl) {
      if (syncedStageName) {
        stageLbl.style.display = 'inline-flex';
        stageLbl.innerText = `📍 ${syncedStageName}`;
      } else {
        stageLbl.style.display = 'none';
      }
    }

    if (clearBtn) {
      clearBtn.style.display = (syncedEnemies.length > 0) ? 'inline-flex' : 'none';
    }

    if (syncedEnemies.length === 0) {
      previewStrip.innerHTML = `
        <span style="color:#64748b; font-size:11px;">💡 상단 <b>[코드]</b>로 마스터와 연결하거나, 우측 <b>[📥 인텐트 붙여넣기]</b>로 전장 에너미를 불러오세요. (스킬을 드래그하여 타겟에 놓으면 즉시 발동!)</span>
      `;
      return;
    }

    const allDeadNotice = (living.length === 0)
      ? `<div style="width:100%; display:flex; align-items:center; gap:6px; color:#6ee7b7; font-weight:800; font-size:11.5px; padding:2px 4px; margin-bottom:4px;"><span style="font-size:13px;">🎉</span> 전장의 모든 적이 처치되었습니다!</div>`
      : '';

    const chipsHtml = syncedEnemies.map((e, idx) => {
      const isDead = (e.hp <= 0);
      const shieldStr = (!isDead && e.shield > 0) ? ` <span style="color:#38bdf8; font-weight:800;">(+방${e.shield})</span>` : '';

      if (isDead) {
        return `
          <div class="target-enemy-chip enemy-two-row-card dead"
               data-enemy-uid="${e.uid}">
            <div class="enemy-card-row1">
              <span style="color:#64748b; font-weight:900;">🎯${idx + 1}.</span>
              <span style="color:#94a3b8; font-weight:900; text-decoration:line-through;">${e.name}</span>
              <span style="color:#475569;">|</span>
              <span style="color:#64748b; font-weight:800;">HP 0/${e.maxHp}</span>
              <span style="color:#475569;">|</span>
              <span style="font-size:10px; background:#334155; color:#cbd5e1; padding:1px 6px; border-radius:4px; font-weight:900; white-space:nowrap;">💀 처치됨</span>
            </div>
            <div class="enemy-card-row-status">
              <span style="font-size:10px; color:#64748b; font-weight:700;">전투 불능</span>
            </div>
            <div class="enemy-card-row2">
              <div class="enemy-intent-line1">💀 처치됨 (행동 종료)</div>
            </div>
          </div>
        `;
      }

      // 2줄: 상태이상 배지 목록 구성 (방어약화, 행동제약, 지속피해, 공격력 감소, 명중 불리함, 도발, 교란, 추가 칩)
      const statusBadges = [];
      if (e.status && e.status.weak) {
        statusBadges.push(`<span class="enemy-status-badge weak">⚠️방어약화(+3)${e.status.weakCharges > 1 ? '·' + e.status.weakCharges + 'R' : ''}</span>`);
      }
      if (e.status && e.status.bindTurns > 0) {
        statusBadges.push(`<span class="enemy-status-badge bind">⛓️행동제약:${e.status.bindTurns}R</span>`);
      }
      if (e.status && Array.isArray(e.status.dots) && e.status.dots.length > 0) {
        e.status.dots.forEach(d => {
          statusBadges.push(`<span class="enemy-status-badge dot">🩸지속피해:${d.dmg}(${d.turns}R)</span>`);
        });
      }
      if (e.atkMod && e.atkMod < 0) {
        statusBadges.push(`<span class="enemy-status-badge atk">📉공격력${e.atkMod}:${e.atkModTurns || 1}R</span>`);
      }
      if (e.forceDis) {
        statusBadges.push(`<span class="enemy-status-badge dis">🎲명중불리함:${e.forceDisTurns || 1}R</span>`);
      }
      if (e.tauntedBy) {
        const tauntName = (e.tauntedBy === 'comp') ? getCompName() : bearerName;
        statusBadges.push(`<span class="enemy-status-badge taunt">🛡️도발됨(${tauntName})</span>`);
      }
      const confuseEnemy = e.confusedToUid ? getEnemyByUid(e.confusedToUid) : null;
      const confuseLabel = confuseEnemy ? confuseEnemy.name : (e.confusedToName || '');
      if (confuseLabel) {
        statusBadges.push(`<span class="enemy-status-badge confuse">🎭교란➔${confuseLabel}</span>`);
      }
      if (e.dmgReduction && e.dmgReduction > 0) {
        statusBadges.push(`<span class="enemy-status-badge reduction">🛡️피격경감:-${e.dmgReduction}</span>`);
      }
      if (e.status && Array.isArray(e.status.extraChips) && e.status.extraChips.length > 0) {
        e.status.extraChips.forEach(ec => {
          const ecType = ec.type || 'bind';
          const ecTurns = ec.turns || 1;
          if (ecType === 'bind') statusBadges.push(`<span class="enemy-status-badge bind">⛓️행동제약:${ecTurns}R</span>`);
          else if (ecType === 'weak') statusBadges.push(`<span class="enemy-status-badge weak">⚠️방어약화:${ecTurns}R</span>`);
          else if (ecType.startsWith('dot_')) statusBadges.push(`<span class="enemy-status-badge dot">🩸지속피해:${ecType.split('_')[1]}(${ecTurns}R)</span>`);
          else if (ecType.startsWith('atk_-')) statusBadges.push(`<span class="enemy-status-badge atk">📉공격력-${ecType.split('_-')[1]}:${ecTurns}R</span>`);
          else if (ecType === 'dis') statusBadges.push(`<span class="enemy-status-badge dis">🎲명중불리함:${ecTurns}R</span>`);
        });
      }

      const statusRowHtml = statusBadges.length > 0
        ? statusBadges.join('')
        : `<span class="enemy-status-empty">없음</span>`;

      const intentText = e.intent ? e.intent : '패턴 대기 중';
      // 인텐트 2줄 분리: 1줄 = [스킬명] ➔ 타겟 / 2줄 = (고정 피해 + 부가효과)
      let intentLine1 = intentText;
      let intentLine2 = '';
      const parenSplitIdx = intentText.indexOf(' (');
      if (parenSplitIdx !== -1) {
        intentLine1 = intentText.slice(0, parenSplitIdx).trim();
        intentLine2 = intentText.slice(parenSplitIdx + 1).trim();
      } else {
        const warnSplitIdx = intentText.indexOf(' [⚠️');
        if (warnSplitIdx !== -1) {
          intentLine1 = intentText.slice(0, warnSplitIdx).trim();
          intentLine2 = intentText.slice(warnSplitIdx + 1).trim();
        }
      }

      return `
        <div class="target-enemy-chip enemy-two-row-card"
             data-drop-target="enemy"
             data-enemy-uid="${e.uid}"
             onclick="onEnemyCardClick('${e.uid}', event)">
          <div class="enemy-card-row1">
            <span style="color:#fbbf24; font-weight:900;">🎯${idx + 1}.</span>
            <span style="color:#f8fafc; font-weight:900;">${e.name}</span>
            <span style="color:#475569;">|</span>
            <span style="color:#fca5a5; font-weight:800;">HP ${e.hp}/${e.maxHp}${shieldStr}</span>
            <span style="color:#475569;">|</span>
            <span style="color:#fde047; font-weight:800;">AC ${e.ac}</span>
          </div>
          <div class="enemy-card-row-status">
            <span class="enemy-status-row-label">상태이상:</span>
            ${statusRowHtml}
          </div>
          <div class="enemy-card-row2">
            <div class="enemy-intent-line1">⚔️ ${intentLine1}</div>
            ${intentLine2 ? `<div class="enemy-intent-line2">${intentLine2}</div>` : ''}
          </div>
        </div>
      `;
    }).join('');

    previewStrip.innerHTML = allDeadNotice + chipsHtml;
  }
  window.renderSyncBridgeUI = renderSyncBridgeUI;

  /* 스킬이 단일 적 대상인지 광역 적 대상인지 판별하여 타겟 라벨 반환 */
  function isBearerSkillSingleEnemyTarget(sk, opt = {}) {
    if (!sk || sk.isPassive) return false;
    if (sk.id === 's_1_4') return (opt.twinMode === 'single');
    if (sk.id === 'm_3_1' || sk.id === 'l_3_1') return true;
    if (sk.id === 'l_3_2') {
      ensureValidCompDeck(false);
      const projTag = opt.projCompKey || 'A';
      const sIdx = projTag === 'A' ? 0 : (projTag === 'B' ? 1 : 2);
      const cSk = getCompSkillById(compDeck[sIdx]);
      return isCompSkillSingleEnemyTarget(cSk, opt.projOpt || {});
    }
    return Boolean(sk.isAttack && !sk.isAoe);
  }
  window.isBearerSkillSingleEnemyTarget = isBearerSkillSingleEnemyTarget;

  function isBearerSkillAoeEnemyTarget(sk, opt = {}) {
    if (!sk || sk.isPassive) return false;
    if (sk.id === 's_1_4') return (opt.twinMode !== 'single');
    if (sk.id === 'l_3_2') {
      ensureValidCompDeck(false);
      const projTag = opt.projCompKey || 'A';
      const sIdx = projTag === 'A' ? 0 : (projTag === 'B' ? 1 : 2);
      const cSk = getCompSkillById(compDeck[sIdx]);
      return isCompSkillAoeEnemyTarget(cSk, opt.projOpt || {});
    }
    return Boolean(sk.isAttack && sk.isAoe);
  }
  window.isBearerSkillAoeEnemyTarget = isBearerSkillAoeEnemyTarget;

  function isCompSkillSingleEnemyTarget(sk, opt = {}) {
    if (!sk) return false;
    if (sk.id === 'so_2_2' || sk.id === 'r_2_1') return Boolean(opt.singleEnemy);
    if (sk.id === 'so_1_2') return (opt.mode !== 'emergency');
    if (sk.id === 'so_1_3' || sk.id === 'so_4_1') return true;
    if (sk.id === 'so_3_2') return (opt.resonanceMode === 'vent');
    return Boolean(sk.isAttack && !sk.isAoe);
  }
  window.isCompSkillSingleEnemyTarget = isCompSkillSingleEnemyTarget;

  function isCompSkillAoeEnemyTarget(sk, opt = {}) {
    if (!sk) return false;
    if (sk.id === 'so_2_2' || sk.id === 'r_2_1') return !opt.singleEnemy;
    if (sk.id === 'ms_4_2') return true;
    return Boolean(sk.isAttack && sk.isAoe);
  }
  window.isCompSkillAoeEnemyTarget = isCompSkillAoeEnemyTarget;

  function parseEnemyIntentText(rawText, isSilent = false) {
    const text = String(rawText || '').trim();
    if (!text) return false;

    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    let parsedStage = '';
    let parsedPyrite = 0;
    const parsedList = [];
    let currentEnemy = null;

    lines.forEach(line => {
      if (line.includes('[STAGE]')) {
        const stMatch = line.match(/\[STAGE\]\s*([^|]+)/i);
        if (stMatch) parsedStage = stMatch[1].trim();
        const pyMatch = line.match(/\[장미\s*휘석\]\s*(\d+)/i);
        if (pyMatch) parsedPyrite = parseInt(pyMatch[1], 10) || 0;
        return;
      }

      if (/^[▶▷•\-*]?\s*\[/.test(line) && /HP\s*\d+/i.test(line) && /AC\s*\d+/i.test(line)) {
        const cleaned = line.replace(/^[▶▷•\-*]+\s*/, '').trim();
        const headerMatch = cleaned.match(/^\[([^\]]+)\]\s*([^\(]+)\(\s*HP\s*(\d+)(?:\s*\/\s*(\d+))?\s*\|\s*AC\s*(\d+)\s*\)(.*)$/i);
        if (headerMatch) {
          const rawGrade = headerMatch[1].trim();
          const rawName = headerMatch[2].trim();
          const curHp = parseInt(headerMatch[3], 10);
          const maxHpVal = headerMatch[4] ? parseInt(headerMatch[4], 10) : curHp;
          const acVal = parseInt(headerMatch[5], 10);
          const tailTags = headerMatch[6] || '';

          let grade = rawGrade;
          let letterTag = '';
          const gradeLetterMatch = rawGrade.match(/^(.*?)\s+([A-Z])$/);
          if (gradeLetterMatch) {
            grade = gradeLetterMatch[1].trim();
            letterTag = gradeLetterMatch[2].trim();
          }

          let shieldVal = 0;
          const shMatch = tailTags.match(/\[방어막\s*:\s*(\d+)\]|\(\+방어막\s*(\d+)\)/);
          if (shMatch) shieldVal = parseInt(shMatch[1] || shMatch[2], 10) || 0;
          let dmgRedVal = 0;
          const drMatch = tailTags.match(/\[피격\s*경감\s*:\s*(\d+)\]/);
          if (drMatch) dmgRedVal = parseInt(drMatch[1], 10) || 0;

          const hasWeak = /\[방어\s*약화/.test(tailTags);
          const weakMatch = tailTags.match(/\[방어\s*약화\s*:\s*(\d+)/);
          const weakChargesVal = weakMatch ? parseInt(weakMatch[1], 10) : (hasWeak ? 1 : 0);
          let bindTurns = 0;
          const bindMatch = tailTags.match(/\[행동\s*제약(?:\s*:\s*(\d+))?/);
          if (bindMatch) bindTurns = bindMatch[1] ? parseInt(bindMatch[1], 10) : 1;
          let atkModVal = 0, atkModTurnsVal = 0;
          const atkMatch = tailTags.match(/\[공격력\s*(-?\d+)(?:\s*:\s*(\d+)R?)?\]/);
          if (atkMatch) {
            atkModVal = parseInt(atkMatch[1], 10) || 0;
            atkModTurnsVal = atkMatch[2] ? parseInt(atkMatch[2], 10) : 1;
          }
          const hasForceDis = /\[명중\s*불리함/.test(tailTags);
          const disMatch = tailTags.match(/\[명중\s*불리함\s*:\s*(\d+)/);
          const forceDisTurnsVal = disMatch ? parseInt(disMatch[1], 10) : (hasForceDis ? 1 : 0);

          const dots = [];
          const dotRegex = /\[지속\s*피해\s*:\s*(\d+)(?:\s*\(?(\d+)(?:턴|라운드|T|R)?\)?)?\]/gi;
          let dMatch;
          while ((dMatch = dotRegex.exec(tailTags)) !== null) {
            dots.push({
              id: `dot_p_${parsedList.length}_${dots.length}`,
              dmg: parseInt(dMatch[1], 10) || 2,
              turns: dMatch[2] ? parseInt(dMatch[2], 10) : 2
            });
          }

          currentEnemy = {
            uid: `parsed_enemy_${parsedList.length}`,
            baseName: rawName,
            letterTag: letterTag,
            name: (letterTag && !rawName.endsWith(' ' + letterTag)) ? `${rawName} ${letterTag}` : rawName,
            grade: grade,
            hp: curHp,
            maxHp: maxHpVal,
            shield: shieldVal,
            dmgReduction: dmgRedVal,
            ac: acVal,
            isPhase2: /2페이즈/.test(tailTags + ' ' + rawGrade),
            intent: '',
            atkMod: atkModVal,
            atkModTurns: atkModTurnsVal,
            forceDis: hasForceDis,
            forceDisTurns: forceDisTurnsVal,
            status: {
              weak: hasWeak,
              weakCharges: weakChargesVal,
              bindTurns: bindTurns,
              dots: dots
            }
          };
          parsedList.push(currentEnemy);
        }
        return;
      }

      if (currentEnemy && (/^[└↳]/.test(line) || line.startsWith('의도:'))) {
        const intentCleaned = line.replace(/^[└↳\s]+/, '').replace(/^의도\s*:\s*/, '').trim();
        if (currentEnemy.intent) {
          currentEnemy.intent += ' / ' + intentCleaned;
        } else {
          currentEnemy.intent = intentCleaned;
        }
      }
    });

    if (parsedList.length === 0) {
      if (!isSilent) {
        playBeep(220, 'sawtooth', 0.15);
        log(`⚠️ <b>[인텐트 파싱 실패]</b> 텍스트에서 <code>▶ [등급] 적 명칭 (HP X/Y | AC Z)</code> 형식의 적 데이터를 찾지 못했습니다.`);
      }
      return false;
    }

    if (parsedStage) syncedStageName = parsedStage;
    syncedStagePyrite = parsedPyrite;
    syncedEnemies = parsedList.map((e, i) => normalizeSyncedEnemy(e, i)).filter(Boolean);
    if (syncConnectionMode === 'none') {
      syncConnectionMode = 'clipboard';
    }
    ensureValidEnemyTargets();

    const anyWeak = syncedEnemies.some(e => e.hp > 0 && e.status && e.status.weak);
    if (anyWeak !== enemyVuln) {
      enemyVuln = anyWeak;
      enemyVulnCharges = anyWeak ? (hasBearerPassive('강경 속박') ? 2 : 1) : 0;
      updateEnemyVulnUI();
    }

    saveSyncedEnemiesToStorage();
    renderSyncBridgeUI();
    renderQueueUI();
    refreshUI();

    if (!isSilent) {
      playBeep(680, 'triangle', 0.16);
      const summaryNames = syncedEnemies.map(e => `<b>${e.name}</b>(HP ${e.hp}/${e.maxHp}·AC ${e.ac})`).join(', ');
      log(`📥 <b>[전장 적 데이터 동기화 완료]</b> ${syncedEnemies.length}체 인식됨: ${summaryNames}`);
    }
    return true;
  }
  window.parseEnemyIntentText = parseEnemyIntentText;

  function openIntentPasteModal() {
    const m = document.getElementById('intent-paste-modal');
    if (m) {
      m.classList.add('open');
      m.style.display = 'flex';
      const ta = document.getElementById('intent-paste-textarea');
      if (ta) ta.focus();
    }
    playBeep(540, 'sine', 0.08);
  }
  window.openIntentPasteModal = openIntentPasteModal;

  function closeIntentPasteModal(e) {
    if (e && e.target !== e.currentTarget && e.target.className !== 'popover-close-btn') return;
    const m = document.getElementById('intent-paste-modal');
    if (m) {
      m.classList.remove('open');
      m.style.display = 'none';
    }
    playBeep(320, 'sine', 0.08);
  }
  window.closeIntentPasteModal = closeIntentPasteModal;

  function fillSampleIntentText() {
    const ta = document.getElementById('intent-paste-textarea');
    if (!ta) return;
    ta.value =
`[STAGE] 물레울 마을 피난민 천막촌 [TS-TS-01] | [장미 휘석] 0개
【 ENEMY INTENT 】
▶ [일반 A] 바람 도마뱀 (HP 8/8 | AC 11)
   └ 의도: [돌풍 꼬리치기] ➔ 아군 전체 (고정 3 광역 피해)
▶ [일반 B] 바람 도마뱀 (HP 8/8 | AC 11) [방어 약화]
   └ 의도: [물어뜯기] ➔ 베어러 (고정 4 피해)`;
    playBeep(600, 'sine', 0.08);
  }
  window.fillSampleIntentText = fillSampleIntentText;

  async function pasteFromClipboardToModal() {
    const ta = document.getElementById('intent-paste-textarea');
    if (!navigator.clipboard || !navigator.clipboard.readText) {
      log(`⚠️ 브라우저 클립보드 자동 읽기 권한이 제한되어 있습니다. 텍스트 상자에 직접 붙여넣기(Ctrl+V) 해주세요.`);
      return;
    }
    try {
      const clipText = await navigator.clipboard.readText();
      if (ta && clipText) {
        ta.value = clipText;
        if (parseEnemyIntentText(clipText, false)) {
          closeIntentPasteModal();
        }
      }
    } catch (err) {
      log(`⚠️ 클립보드 접근 권한이 필요합니다. 아래 입력창에 직접 붙여넣기(Ctrl+V) 해주세요.`);
    }
  }
  window.pasteFromClipboardToModal = pasteFromClipboardToModal;

  function confirmIntentPasteParse() {
    const ta = document.getElementById('intent-paste-textarea');
    if (!ta) return;
    const ok = parseEnemyIntentText(ta.value, false);
    if (ok) {
      closeIntentPasteModal();
    }
  }
  window.confirmIntentPasteParse = confirmIntentPasteParse;

  function clearSyncedEnemies() {
    syncedEnemies = [];
    syncedStageName = '';
    syncedStagePyrite = 0;
    selectedBearerTargetUid = null;
    selectedCompTargetUid = null;
    if (syncConnectionMode === 'clipboard') {
      syncConnectionMode = 'none';
    }
    saveSyncedEnemiesToStorage();
    renderSyncBridgeUI();
    renderQueueUI();
    refreshUI();
    playBeep(340, 'sine', 0.1);
    log(`🧹 <b>[적 동기화 초기화]</b> 연동된 전장 적 목록을 비웠습니다.`);
  }
  window.clearSyncedEnemies = clearSyncedEnemies;

  function saveSyncedEnemiesToStorage() {
    try {
      localStorage.setItem(SYNC_SAVED_ENEMIES_KEY, JSON.stringify({
        syncedEnemies,
        syncedStageName,
        syncedStagePyrite,
        selectedBearerTargetUid,
        selectedCompTargetUid,
        syncConnectionMode: syncConnectionMode === 'clipboard' ? 'clipboard' : 'none',
        timestamp: Date.now()
      }));
    } catch (e) {}
  }

  function loadSyncedEnemiesFromStorage() {
    try {
      const raw = localStorage.getItem(SYNC_SAVED_ENEMIES_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data && Array.isArray(data.syncedEnemies) && data.syncedEnemies.length > 0) {
        syncedEnemies = data.syncedEnemies.map((e, i) => normalizeSyncedEnemy(e, i)).filter(Boolean);
        syncedStageName = data.syncedStageName || '';
        syncedStagePyrite = data.syncedStagePyrite || 0;
        selectedBearerTargetUid = data.selectedBearerTargetUid || null;
        selectedCompTargetUid = data.selectedCompTargetUid || null;
        if (syncConnectionMode === 'none') {
          syncConnectionMode = 'clipboard';
        }
        ensureValidEnemyTargets();
      }
    } catch (e) {}
  }

  function buildPlayerPartySyncPayload() {
    const c = COMPS[pickedComp] || COMPS['데드로'];
    return {
      type: 'PLAYER_PARTY_SYNC',
      msgId: 'p_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      timestamp: Date.now(),
      party: {
        bearerName: bearerName || pickedClass,
        pickedOrigin: pickedOrigin,
        pickedClass: pickedClass,
        curLevel: curLevel,
        curRound: curRound,
        combatStarted: combatStarted,
        hp: hp,
        maxHp: maxHp,
        shield: shield,
        ac: (typeof getBearerEffectiveAc === 'function') ? getBearerEffectiveAc() : 12,
        heat: heat,
        overheatStage: (typeof getOverheatStage === 'function') ? getOverheatStage(heat) : 'stable',
        hasAttentionFocus: (typeof hasBearerPassive === 'function') ? hasBearerPassive('주의 집중') : false,
        hasRecognitionInhibit: (typeof hasBearerPassive === 'function') ? hasBearerPassive('인식 저해') : false,
        hasFirmBind: (typeof hasBearerPassive === 'function') ? hasBearerPassive('강경 속박') : false,
        bearerStatuses: bearerStatuses.map(s => ({ name: s.name, type: s.type, desc: s.desc })),
        compName: (typeof getCompName === 'function') ? getCompName() : c.name,
        pickedComp: pickedComp,
        compClass: c.class,
        compHp: compHp,
        compMaxHp: compMaxHp,
        compShield: compShield,
        compAc: (typeof getCompEffectiveAc === 'function') ? getCompEffectiveAc() : c.ac,
        compRevivedThisRound: Boolean(compRevivedThisRound),
        compStatuses: compStatuses.map(s => ({ name: s.name, type: s.type, desc: s.desc })),
        pyrite: pyrite,
        potion: potion,
        deathStack: deathStack,
        communionFlame: communionFlame || 'none',
        communionActiveThisRound: communionActiveThisRound || 'none'
      }
    };
  }

  function sendSyncPacketToGm(packet) {
    if (!packet) return;
    if (!packet.msgId) {
      packet.msgId = 'pkt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    }
    processedSyncMsgIds.add(packet.msgId);

    if (playerPeerConn && playerPeerConn.open) {
      try { playerPeerConn.send(packet); } catch (e) {}
    }
  }
  window.sendSyncPacketToGm = sendSyncPacketToGm;

  function broadcastPlayerStateToGm() {
    if (!playerPeerConn || !playerPeerConn.open) return;
    const payload = buildPlayerPartySyncPayload();
    sendSyncPacketToGm(payload);
  }
  window.broadcastPlayerStateToGm = broadcastPlayerStateToGm;

  function handleIncomingGmPacket(packet) {
    if (!packet || typeof packet !== 'object') return;
    if (packet.msgId) {
      if (processedSyncMsgIds.has(packet.msgId)) return;
      processedSyncMsgIds.add(packet.msgId);
      if (processedSyncMsgIds.size > 300) {
        const firstKey = processedSyncMsgIds.values().next().value;
        processedSyncMsgIds.delete(firstKey);
      }
    }

    if (packet.type === 'GM_HELLO' || packet.type === 'GM_REQUEST_PARTY') {
      syncConnectionMode = 'peer';
      renderSyncBridgeUI();
      broadcastPlayerStateToGm();
      return;
    }

    if (packet.type === 'GM_STATE_SYNC') {
      const prevCount = syncedEnemies.length;
      syncConnectionMode = 'peer';
      syncedStageName = packet.stageName || '';
      syncedStagePyrite = Number(packet.stagePyrite) || 0;
      const rawList = Array.isArray(packet.enemies) ? packet.enemies : [];
      syncedEnemies = rawList.map((e, i) => normalizeSyncedEnemy(e, i)).filter(Boolean);
      ensureValidEnemyTargets();

      const anyWeak = syncedEnemies.some(e => e.hp > 0 && e.status && e.status.weak);
      if (anyWeak !== enemyVuln) {
        enemyVuln = anyWeak;
        enemyVulnCharges = anyWeak ? (hasBearerPassive('강경 속박') ? 2 : 1) : 0;
        updateEnemyVulnUI();
      }

      saveSyncedEnemiesToStorage();
      renderSyncBridgeUI();
      renderQueueUI();

      if (prevCount === 0 && syncedEnemies.length > 0) {
        log(`🔗 <b>[마스터 컨트롤러 실시간 연결됨]</b> 전장(${syncedStageName || '교전 구역'})의 적 ${syncedEnemies.length}체 데이터가 실시간 동기화되었습니다!`, 'past');
      }
      return;
    }

    if (packet.type === 'GM_PARTY_RESOURCE_UPDATE') {
      if (packet.pyrite !== undefined) pyrite = Math.max(0, Number(packet.pyrite) || 0);
      if (packet.potion !== undefined) potion = Math.max(0, Number(packet.potion) || 0);
      if (packet.deathStack !== undefined) {
        const nextDs = Math.max(0, Number(packet.deathStack) || 0);
        if (nextDs !== deathStack) {
          const diff = nextDs - deathStack;
          deathStack = nextDs;
          maxHp = Math.max(BEARERS[pickedClass].hp + ((curLevel - 1) * 4), BEARERS[pickedClass].hp + ((curLevel - 1) * 4) + (deathStack * 2));
          if (diff > 0) {
            combatStarted = false; curRound = 1;
            hp = maxHp; compHp = compMaxHp; heat = 0; shield = 0; compShield = 0; senCharge = 0;
            compCds = { A: 0, B: 0, C: 0 }; compCd = 0; compRevivedThisRound = false; bearerActedThisRound = false; compActedThisRound = false;
            mageChargedSpells = []; warGodSoulActive = false; blazingBladeActive = false;
            bearerStatuses = []; compStatuses = []; actionQueue = [];
            renderStatuses(); renderQueueUI();
            playBeep(180, 'sine', 0.4);
            log(`🩸 <b>[생환 발동 (GM 동기화)]</b> 창세신의 안수로 안전 거점에서 기상했습니다. 베어러 최대 HP 영구 +${diff * 2} (현재 <b>${hp}/${maxHp}</b>) 및 동료(${getCompName()}) HP 전량 회복(<b>${compHp}/${compMaxHp}</b>), 과열/방어막 0 초기화! (생환 스택: <b>${deathStack}점</b> 누적)`);
          } else {
            hp = Math.min(maxHp, hp);
          }
        }
      }
      if (packet.communionState !== undefined) {
        const cs = packet.communionState;
        communionFlame = (cs === 'shine' || cs === 'burn') ? cs : 'none';
        communionActiveThisRound = 'none';
      }
      refreshUI();
      saveSessionState();
      return;
    }

    if (packet.type === 'GM_ATTACK_PACKET' && typeof window.onReceiveGmAttackPacket === 'function') {
      window.onReceiveGmAttackPacket(packet);
      return;
    }

    if (packet.type === 'GM_ROUND_END' && typeof window.advancePlayerRound === 'function') {
      lastGmRoundEndDotSum = Number(packet.totalDotDamage) || 0;
      window.advancePlayerRound('gm_sync');
      return;
    }

    if (packet.type === 'GM_COMBAT_END' && typeof endCombat === 'function') {
      endCombat(true);
      log(`🌐 <b>[마스터 전투 종료 동기화]</b> 마스터 컨트롤러에서 전투 종료를 선언하여 과열·방어막·전술 버프가 초기화되었습니다.`, 'divider');
      return;
    }

    if (packet.type === 'GM_BOSS_PHASE2_AWAKEN') {
      bearerStatuses = bearerStatuses.filter(s => !s.name.includes('행동 제약') && s.name !== '방어 약화');
      compStatuses = compStatuses.filter(s => !s.name.includes('행동 제약') && s.name !== '방어 약화');
      renderStatuses();
      refreshUI();
      playBeep(180, 'sawtooth', 0.35);
      log(`⚠️ <b>[보스 2페이즈 각성: ${packet.enemyName || '보스'}]</b> ${packet.p2Title || ''}! 룰북 규정에 따라 아군의 외적 상태이상([행동 제약], [방어 약화])이 모두 정화되었습니다!`);
      return;
    }
  }

  function initPlayerSyncBridges() {
    loadSyncedEnemiesFromStorage();
    renderSyncBridgeUI();
  }

  function connectToGmPeerRoom(codeOverride) {
    const inputEl = document.getElementById('peer-room-code-input');
    const rawCode = (codeOverride || (inputEl ? inputEl.value : '') || '').trim().toUpperCase().replace(/^5F-/, '');
    if (!rawCode) {
      playBeep(240, 'sawtooth', 0.15);
      log(`⚠️ <b>[방 코드 미입력]</b> 마스터 컨트롤러에 표시된 4자리 방 코드를 입력한 뒤 [🔗 온라인 연결]을 눌러주세요.`);
      if (inputEl) inputEl.focus();
      return;
    }
    if (typeof Peer === 'undefined') {
      log(`⚠️ <b>[오프라인 환경]</b> PeerJS 라이브러리를 불러올 수 없습니다. [📥 인텐트 붙여넣기]를 사용해 주세요.`);
      return;
    }

    const btn = document.getElementById('btn-peer-connect');
    if (btn) btn.innerText = '⏳ 연결중...';

    try {
      if (playerPeerInstance) {
        playerPeerInstance.destroy();
        playerPeerInstance = null;
      }
      playerPeerInstance = new Peer();
      playerPeerInstance.on('open', () => {
        const targetPeerId = `fifth-finger-v224-${rawCode}`;
        const conn = playerPeerInstance.connect(targetPeerId, { reliable: true });
        playerPeerConn = conn;

        conn.on('open', () => {
          activePeerRoomCode = rawCode;
          syncConnectionMode = 'peer';
          playBeep(720, 'triangle', 0.18);
          log(`🌐 <b>[온라인 P2P 연결 성공]</b> 마스터 방(코드: <b>${rawCode}</b>)과 실시간 양방향 연결이 수립되었습니다!`);
          renderSyncBridgeUI();
          sendSyncPacketToGm({
            type: 'PLAYER_HELLO',
            msgId: 'phello_' + Date.now(),
            party: buildPlayerPartySyncPayload().party
          });
        });

        conn.on('data', (data) => {
          handleIncomingGmPacket(data);
        });

        conn.on('close', () => {
          if (syncConnectionMode === 'peer') syncConnectionMode = 'none';
          renderSyncBridgeUI();
          log(`🔌 <b>[온라인 연결 종료]</b> 마스터 컨트롤러와의 원격 연결이 해제되었습니다.`);
        });

        conn.on('error', () => {
          if (btn) btn.innerText = '🔗 온라인 연결';
          log(`⚠️ <b>[연결 오류]</b> 방 코드(${rawCode}) 연결 중 오류가 발생했습니다.`);
        });
      });

      playerPeerInstance.on('error', () => {
        if (btn) btn.innerText = '🔗 온라인 연결';
        playBeep(220, 'sawtooth', 0.18);
        log(`⚠️ <b>[방 코드 확인 필요]</b> 마스터 방(<b>${rawCode}</b>)을 찾을 수 없습니다. 마스터 컨트롤러에서 [🌐 온라인 방 열기]가 켜져 있는지 확인하세요.`);
      });
    } catch (e) {
      if (btn) btn.innerText = '🔗 온라인 연결';
    }
  }
  window.connectToGmPeerRoom = connectToGmPeerRoom;

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initPlayerSyncBridges);
  } else {
    initPlayerSyncBridges();
  }

  /* ==========================================================================
     11. [수술 4단계] 플레이어 ➔ 마스터 타격 패킷 송신 & 마스터 ➔ 플레이어 적 공격 자동 정산
     ========================================================================== */
  function sendPlayerActionPacketToGm(effectsList) {
    if (!Array.isArray(effectsList) || effectsList.length === 0) return;
    if (!playerPeerConn || !playerPeerConn.open) return;
    const pkt = {
      type: 'PLAYER_ACTION_PACKET',
      msgId: 'pact_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      timestamp: Date.now(),
      round: curRound,
      actorSummary: `${bearerName} & ${getCompName()}`,
      effects: effectsList,
      party: buildPlayerPartySyncPayload().party
    };
    sendSyncPacketToGm(pkt);
  }
  window.sendPlayerActionPacketToGm = sendPlayerActionPacketToGm;

  /* 단일 아군(베어러 또는 동료)이 적의 직접 공격에 피격되었을 때 방어막·경감·장막·회피·반격을 자동 처리 */
  function resolveIncomingHitOnAlly(targetActor, enemyUid, enemyName, rawRoll, baseDmg, extraEffects = {}) {
    const isBearer = (targetActor === 'bearer');
    const unitName = isBearer ? bearerName : getCompName();
    const effAc = isBearer ? getBearerEffectiveAc() : getCompEffectiveAc();
    const isCrit = (rawRoll === 20);
    const isFumble = (rawRoll === 1);
    const isHit = isCrit || (!isFumble && rawRoll >= effAc);

    // [복수의 칼날] 공격 시도 적 기록 (명중 여부 무관)
    if (enemyUid) {
      if (!isBearer && compStatuses.some(s => s.name.includes('복수의 칼날'))) {
        warriorTargetedByUidsThisRound.add(enemyUid);
      } else if (isBearer && bearerStatuses.some(s => s.name.includes('복수의 칼날'))) {
        warriorTargetedByUidsThisRound.add(enemyUid);
      }
    }

    // 1) 명중 굴림 빗나감 처리 & 회피 반격([비연참] / [역장 패링]) 자동 발동!
    if (!isHit) {
      let counterMsg = '';
      if (isBearer) {
        bearerEvadedLastRound = true;
        bearerDodgedAttackThisRound = true;
        if (bearerStatuses.some(s => s.name === '🦅 비연참')) {
          const enObj = getEnemyByUid(enemyUid);
          if (enObj) applyLocalSyncedEnemyDamage(enObj, 4, false);
          sendPlayerActionPacketToGm([{ kind: 'damage', targetUid: enemyUid, dmg: 4, ignoreShield: false, label: '비연참 회피 반격 4 피해' }]);
          counterMsg = ` ➔ ⚡<b>[비연참 회피 반격!]</b> ${enemyName}에게 판정 없이 <b>고정 4 피해</b> 즉시 반격!`;
        } else if (bearerStatuses.some(s => s.name.includes('역장 패링'))) {
          const enObj = getEnemyByUid(enemyUid);
          if (enObj) applyLocalSyncedEnemyDamage(enObj, 2, false);
          sendPlayerActionPacketToGm([{ kind: 'damage', targetUid: enemyUid, dmg: 2, ignoreShield: false, label: '원격 투영: 역장 패링 반격 2 피해' }]);
          counterMsg = ` ➔ ⚡<b>[원격 투영: 역장 패링 반격!]</b> ${enemyName}에게 판정 없이 <b>고정 2 피해</b> 즉시 반격!`;
        }
      } else {
        if (compStatuses.some(s => s.name.includes('역장 패링'))) {
          senCharge = Math.min(3, senCharge + 1);
          const enObj = getEnemyByUid(enemyUid);
          if (enObj) applyLocalSyncedEnemyDamage(enObj, 2, false);
          sendPlayerActionPacketToGm([{ kind: 'damage', targetUid: enemyUid, dmg: 2, ignoreShield: false, label: '역장 패링 회피 반격 2 피해' }]);
          counterMsg = ` ➔ ⚡<b>[역장 패링 반격!]</b> ${enemyName}에게 판정 없이 <b>고정 2 피해</b> & 마탄 차징 +1스택(${senCharge}/3)!`;
        }
      }
      return {
        hit: false,
        finalDmg: 0,
        logHtml: `💨 <b>[${unitName} 회피 성공!]</b> ${enemyName}의 공격(주사위 <span style="color:#cbd5e1; font-weight:800;">${rawRoll} &lt; AC ${effAc}</span>)을 흘려냈습니다! (피해 0)${counterMsg}`
      };
    }

    // 2) 완전 회피 / 무적 버프 체크 (무형보, 허상의 디딤돌, 찬란한 백광의 은신, 백광의 잔상, 스프링보드)
    if (isBearer) {
      const muhyung = bearerStatuses.find(s => s.name === '💨 무형보');
      if (muhyung) {
        bearerStatuses = bearerStatuses.filter(s => s.id !== muhyung.id);
        bearerEvadedLastRound = true;
        bearerDodgedAttackThisRound = true;
        renderStatuses();
        return {
          hit: false,
          finalDmg: 0,
          logHtml: `💨 <b>[무형보 완전 회피!]</b> ${unitName}이(가) 잔상을 남기며 ${enemyName}의 공격을 완벽히 흘려냈습니다! (피해 0 · 무형보 1회 소모)`
        };
      }
      if (bearerStatuses.some(s => s.name === '🦶 허상의 디딤돌 (무적)' || s.name === '✨ 찬란한 백광의 은신 (피격 0)')) {
        return {
          hit: false,
          finalDmg: 0,
          logHtml: `✨ <b>[${unitName} 피격 무효화!]</b> 환영/백광 은신 효과로 ${enemyName}의 공격 피해가 <b>0</b>으로 무효화되었습니다!`
        };
      }
      const afterglow = bearerStatuses.find(s => s.name === '✨ 백광의 잔상 (1회 피격 0)');
      if (afterglow) {
        bearerStatuses = bearerStatuses.filter(s => s.id !== afterglow.id);
        renderStatuses();
        return {
          hit: false,
          finalDmg: 0,
          logHtml: `✨ <b>[백광의 잔상 1회 무효화!]</b> ${unitName}이(가) 받는 첫 피격 피해를 <b>0</b>으로 무효화했습니다!`
        };
      }
    } else {
      if (compStatuses.some(s => s.name === '🛡️ 스프링보드')) {
        return {
          hit: false,
          finalDmg: 0,
          logHtml: `🛡️ <b>[스프링보드 도약 무효화!]</b> 체공 중인 ${unitName}은(는) ${enemyName}의 직접 피격 피해를 <b>0</b>으로 무시합니다!`
        };
      }
    }

    // [불굴의 방파제] 직접 피격 횟수 카운트 (피해 0 경감 포함)
    if ((!isBearer && compStatuses.some(s => s.name.includes('불굴의 방파제'))) ||
        (isBearer && bearerStatuses.some(s => s.name.includes('불굴의 방파제')))) {
      warriorDirectHitCountThisRound++;
    }

    let dmg = Math.max(0, baseDmg);
    let modNotes = [];

    // 3) 등지기 [신기루 장막] 우선 처리 (룰북 v2.24: "5 이하 피해는 1로 줄이며 최대 2회 방어, 5 초과 피해는 5를 경감하고 즉시 소멸한다. 장막을 통과해 들어온 최종 수치에 대상의 피격 보정(예: [방어 약화]의 +3 피해)을 합산한다.")
    const veil = (isBearer ? bearerStatuses : compStatuses).find(s => s.name === '🌫️ 신기루 장막');
    if (veil && dmg > 0) {
      if (dmg <= 5) {
        dmg = 1;
        veil.hitsLeft = (veil.hitsLeft !== undefined ? veil.hitsLeft : 2) - 1;
        modNotes.push(`신기루장막(1로 경감${veil.hitsLeft <= 0 ? '·소멸' : ''})`);
        if (veil.hitsLeft <= 0) {
          if (isBearer) bearerStatuses = bearerStatuses.filter(s => s.id !== veil.id);
          else compStatuses = compStatuses.filter(s => s.id !== veil.id);
        }
      } else {
        dmg = Math.max(0, dmg - 5);
        modNotes.push('신기루장막(-5 경감 후 소멸)');
        if (isBearer) bearerStatuses = bearerStatuses.filter(s => s.id !== veil.id);
        else compStatuses = compStatuses.filter(s => s.id !== veil.id);
      }
    }

    // 4) 대상의 피격 보정 ([방어 약화] +3 및 각종 피격 경감 버프·패시브) 합산
    const statusList = isBearer ? bearerStatuses : compStatuses;
    const weakDebuff = statusList.find(s => s.name === '방어 약화');
    if (weakDebuff) {
      dmg += 3;
      modNotes.push('방어약화 +3');
      if (isBearer) bearerStatuses = bearerStatuses.filter(s => s.id !== weakDebuff.id);
      else compStatuses = compStatuses.filter(s => s.id !== weakDebuff.id);
    }

    let reduction = 0;
    if (isBearer) {
      if (hasBearerPassive('주의 집중')) { reduction += 2; modNotes.push('주의집중 -2'); }
      bearerStatuses.forEach(s => {
        if (s.name === '🛡️ 쳐내고 베기') { reduction += 3; modNotes.push('쳐내고베기 -3'); }
        else if (s.name === '🛡️ 백색 철벽' || s.name === '⚔️ 결사의 수호') { reduction += 3; modNotes.push('백색철벽 -3'); }
        else if (s.name === '🔥 성염 인챈트') {
          const m = s.desc.match(/(\d+)\s*감소/);
          const rVal = m ? parseInt(m[1], 10) : 3;
          reduction += rVal;
          modNotes.push(`성염인챈트 -${rVal}`);
        }
        else if (s.name === '🪨 융기하는 성염 암벽 (피격 -3)') { reduction += 3; modNotes.push('성염암벽 -3'); }
        else if (s.name === '☯️ 생사 역전 (피격 -3)') { reduction += 3; modNotes.push('생사역전 -3'); }
        else if (s.name === '🌿 약초 연무 (피격 -2)') { reduction += 2; modNotes.push('약초연무 -2'); }
        else if (s.name.includes('투지 발휘')) { reduction += 3; modNotes.push('투지발휘(투영) -3'); }
        else if (s.name === '🛡️ 전열의 고함 (피격 -3)') { reduction += 3; modNotes.push('전열의고함(투영) -3'); }
        else if (s.name === '🗡️ 복수의 칼날 (피격-2·반격3)') { reduction += 2; modNotes.push('복수의칼날(투영) -2'); }
        else if (s.name === '🏰 불굴의 방파제 (피격-4·반격4)') { reduction += 4; modNotes.push('불굴의방파제(투영) -4'); }
        else if (s.name === '⚡ 무영의 검무 (피격 -3)') { reduction += 3; modNotes.push('무영의검무(투영) -3'); }
      });
    } else {
      compStatuses.forEach(s => {
        if (s.name === '🛡️ 육탄 엄호') { reduction += 3; modNotes.push('투지발휘 -3'); }
        else if (s.name === '🛡️ 전열의 고함 (피격 -3)') { reduction += 3; modNotes.push('전열의고함 -3'); }
        else if (s.name === '🗡️ 복수의 칼날 (피격-2·반격3)') { reduction += 2; modNotes.push('복수의칼날 -2'); }
        else if (s.name === '🏰 불굴의 방파제 (피격-4·반격4)') { reduction += 4; modNotes.push('불굴의방파제 -4'); }
        else if (s.name === '⚡ 무영의 검무 (피격 -3)') { reduction += 3; modNotes.push('무영의검무 -3'); }
        else if (s.name === '🪨 융기하는 성염 암벽 (피격 -3)') { reduction += 3; modNotes.push('성염암벽 -3'); }
        else if (s.name === '🌿 약초 연무 (피격 -2)') { reduction += 2; modNotes.push('약초연무 -2'); }
      });
    }

    dmg = Math.max(0, dmg - reduction);

    // 4.5) 파이터 3Lv [무결점의 방어] 처리 (단일 적중 시 0 무효화, 다중 적중 시 [최대 피해량 - 최소 피해량]만 최종 적용)
    if (isBearer && bearerStatuses.some(s => s.name === '🛡️ 무결점의 방어')) {
      bearerHitDamagesThisRound.push(dmg);
      if (bearerHitDamagesThisRound.length === 1) {
        modNotes.push(`무결점의방어(1회 적중(${dmg}) ➔ 0 무효화 대기)`);
        dmg = 0;
      } else {
        const maxD = Math.max(...bearerHitDamagesThisRound);
        const minD = Math.min(...bearerHitDamagesThisRound);
        const prevTargetTotal = bearerTakenDirectDmgSumThisRound;
        const newTargetTotal = Math.max(0, maxD - minD);
        dmg = Math.max(0, newTargetTotal - prevTargetTotal);
        modNotes.push(`무결점의방어(최대${maxD}-최소${minD}=${newTargetTotal})`);
      }
    }

    if (isBearer) {
      bearerTakenDirectDmgSumThisRound += dmg;
    }

    // 5) 방어막(Shield) 우선 차감 후 실제 HP 차감
    let absorbedByShield = 0;
    let hpLost = dmg;
    if (isBearer) {
      if (shield > 0 && dmg > 0) {
        if (shield >= dmg) {
          absorbedByShield = dmg;
          shield -= dmg;
          hpLost = 0;
        } else {
          absorbedByShield = shield;
          hpLost = dmg - shield;
          shield = 0;
        }
      }
      if (hpLost > 0) {
        hp = Math.max(0, hp - hpLost);
        bearerTookHpDmgThisRound = true;
      }
    } else {
      if (compShield > 0 && dmg > 0) {
        if (compShield >= dmg) {
          absorbedByShield = dmg;
          compShield -= dmg;
          hpLost = 0;
        } else {
          absorbedByShield = compShield;
          hpLost = dmg - compShield;
          compShield = 0;
        }
      }
      if (compHp > 0 && hpLost > 0) {
        compHp = Math.max(0, compHp - hpLost);
      }
    }

    // 6) 피격 부가 효과 (상태이상 및 강제 과열) 부여
    let statusAddedNotes = [];
    const addStatusFn = isBearer ? addBearerStatus : addCompStatus;
    if (extraEffects.inflictWeak) {
      addStatusFn('방어 약화', 'debuff', '다음 직접 공격 피격 시 +3 추가 피해 후 즉시 해제');
      statusAddedNotes.push('[방어 약화]');
    }
    if (extraEffects.inflictBind) {
      addStatusFn('행동 제약', 'debuff', '1라운드간 서클/쿨다운 스킬 사용 불가');
      statusAddedNotes.push('[행동 제약]');
    }
    if (extraEffects.inflictDot && extraEffects.inflictDot.dmg > 0) {
      const dVal = extraEffects.inflictDot.dmg;
      addStatusFn(`지속 피해: ${dVal}`, 'debuff', `라운드 종료 시 고정 ${dVal} 피해 (방어막 무시)`);
      statusAddedNotes.push(`[지속 피해: ${dVal}]`);
    }
    if (isBearer && extraEffects.forceHeat && extraEffects.forceHeat > 0) {
      applyHeatIncrease(extraEffects.forceHeat, `${enemyName} 피격 과열`);
      statusAddedNotes.push(`[과열 +${extraEffects.forceHeat}]`);
    }

    renderStatuses();
    const curHpStr = isBearer ? `${hp}/${maxHp}` : `${compHp}/${compMaxHp}`;
    const shieldNote = absorbedByShield > 0 ? ` (방어막 ${absorbedByShield} 흡수)` : '';
    const modStr = modNotes.length > 0 ? ` [${modNotes.join(', ')}]` : '';
    const stStr = statusAddedNotes.length > 0 ? ` + ${statusAddedNotes.join(' ')} 부여` : '';
    const hitIcon = (dmg === 0) ? '🛡️' : '🩸';

    return {
      hit: (dmg > 0),
      finalDmg: dmg,
      hpLost: hpLost,
      logHtml: `${hitIcon} <b>[${unitName} 피격: ${dmg} 피해]</b> ${enemyName}의 공격(주사위 <span style="color:#cbd5e1; font-weight:800;">${rawRoll} ≥ AC ${effAc}</span>) 적중! ➔ (잔여 HP: ${curHpStr})${modStr}${shieldNote}${stStr}`
    };
  }

  const incomingGmAttackQueue = [];
  let isProcessingGmAttack = false;

  function onReceiveGmAttackPacket(pkt) {
    if (!pkt) return;
    incomingGmAttackQueue.push(pkt);
    processNextGmAttackInQueue();
  }
  window.onReceiveGmAttackPacket = onReceiveGmAttackPacket;

  function processNextGmAttackInQueue() {
    if (isProcessingGmAttack || incomingGmAttackQueue.length === 0) return;
    isProcessingGmAttack = true;
    const pkt = incomingGmAttackQueue.shift();
    try {
      executeSingleIncomingGmAttack(pkt);
    } catch (e) {
      console.error('Error executing incoming GM attack:', e);
    }
    const attackInterval = (pkt && pkt.targetType === 'aoe') ? 3000 : 2000;
    setTimeout(() => {
      isProcessingGmAttack = false;
      processNextGmAttackInQueue();
    }, attackInterval);
  }

  function executeSingleIncomingGmAttack(pkt) {
    if (!pkt) return;
    if (shouldDemoteLogsOnNextAction) demoteOldRoundLogs();

    const enemyUid = pkt.enemyUid || '';
    const enemyName = pkt.enemyName || '적';
    const skillName = pkt.skillName || '공격';
    const rawRoll = Number(pkt.rawRoll) || 10;
    const rollFormula = pkt.rollFormula || `1d20(${rawRoll})`;
    const baseDmg = Math.max(0, (Number(pkt.baseDmg) || 0) + (Number(pkt.atkMod) || 0));
    let targetType = pkt.targetType || 'bearer'; // 'bearer' | 'comp' | 'aoe'
    const extraEffects = {
      inflictWeak: Boolean(pkt.inflictWeak),
      inflictBind: Boolean(pkt.inflictBind),
      inflictDot: pkt.inflictDot || null,
      forceHeat: Number(pkt.forceHeat) || 0
    };

    // 등지기 4Lv 패시브 [인식 저해]: 적 명중 주사위 1~4 나올 시 자해 전환!
    if (pkt.selfHit || (hasBearerPassive('인식 저해') && rawRoll <= 4)) {
      playBeep(680, 'triangle', 0.2);
      log(`👁️ <b>[패시브: 인식 저해 발동!]</b> ${enemyName}의 [${skillName}] 명중 주사위가 <b>${rawRoll}</b>(4 이하)로 나와 공격 목표가 <b>${enemyName} 본인으로 강제 전환(자해)</b>되었습니다!`);
      refreshUI();
      saveSessionState();
      return;
    }

    // 단일 공격 도발/수호/재정비 강제 전환 확인
    if (targetType === 'comp') {
      if (compHp <= 0 || compRevivedThisRound || bearerStatuses.some(s => s.name === '⚔️ 결사의 수호' || s.name.includes('태양의 부름'))) {
        targetType = 'bearer';
      }
    } else if (targetType === 'bearer') {
      if (compHp > 0 && !compRevivedThisRound && compStatuses.some(s => s.name === '🛡️ 육탄 엄호' || s.name.includes('전열의 고함') || s.name.includes('불굴의 방파제'))) {
        targetType = 'comp';
      }
    }

    playBeep(220, 'sawtooth', 0.2);

    // 파이터 [백색 철벽: 결사의 수호] 광역 피격 시: 아군 전체 총합 피해를 파이터의 방어막과 HP로 전량 대신 흡수!
    if (targetType === 'aoe' && bearerStatuses.some(s => s.name === '⚔️ 결사의 수호')) {
      const resB = resolveIncomingHitOnAlly('bearer', enemyUid, `${enemyName}(${skillName}·결사의수호 본체)`, rawRoll, baseDmg, extraEffects);
      let compShareLog = '';
      if (compHp > 0 && rawRoll >= getCompEffectiveAc() && rawRoll !== 1) {
        const compDmg = Math.max(0, baseDmg - 3);
        let compAbs = 0, compHpLoss = compDmg;
        if (shield > 0 && compDmg > 0) {
          if (shield >= compDmg) { compAbs = compDmg; shield -= compDmg; compHpLoss = 0; }
          else { compAbs = shield; compHpLoss = compDmg - shield; shield = 0; }
        }
        if (compHpLoss > 0) { hp = Math.max(0, hp - compHpLoss); bearerTookHpDmgThisRound = true; }
        bearerTakenDirectDmgSumThisRound += compDmg;
        const compAddedSt = [];
        if (extraEffects.inflictWeak) { addCompStatus('방어 약화', 'debuff', '다음 직접 공격 피격 시 +3 추가 피해 후 즉시 해제'); compAddedSt.push('[방어 약화]'); }
        if (extraEffects.inflictBind) { addCompStatus('행동 제약', 'debuff', '1라운드간 쿨다운 스킬 사용 불가'); compAddedSt.push('[행동 제약]'); }
        if (extraEffects.inflictDot && extraEffects.inflictDot.dmg > 0) {
          const dVal = extraEffects.inflictDot.dmg;
          addCompStatus(`지속 피해: ${dVal}`, 'debuff', `라운드 종료 시 고정 ${dVal} 피해 (방어막 무시)`);
          compAddedSt.push(`[지속 피해: ${dVal}]`);
        }
        const compStStr = compAddedSt.length > 0 ? ` (${getCompName()}에게 ${compAddedSt.join(' ')} 적용)` : '';
        const shareIcon = (compDmg === 0) ? '🛡️' : '⚔️';
        compShareLog = `<br>${shareIcon} <b>[${bearerName} 결사의 수호 대리 흡수: ${compDmg} 피해]</b> ${getCompName()}에게 향한 광역 피해까지 ${bearerName}이(가) 전량 대신 감당했습니다! (잔여 HP: ${hp}/${maxHp})${compStStr}`;
      }
      log(`👹 <b>[적 광역 공격: ${enemyName} — ${skillName}]</b> (${rollFormula})<br>${resB.logHtml}${compShareLog}`);
      refreshUI();
      saveSessionState();
      return;
    }

    if (targetType === 'aoe') {
      const resB = resolveIncomingHitOnAlly('bearer', enemyUid, `${enemyName}(${skillName})`, rawRoll, baseDmg, extraEffects);
      const resC = (compHp > 0)
        ? resolveIncomingHitOnAlly('comp', enemyUid, `${enemyName}(${skillName})`, rawRoll, baseDmg, extraEffects)
        : { logHtml: `<span style="color:#64748b;">(${getCompName()} 탈진 상태)</span>` };
      log(`👹 <b>[적 광역 공격: ${enemyName} — ${skillName}]</b> (${rollFormula})<br>${resB.logHtml}<br>${resC.logHtml}`);
    } else {
      const res = resolveIncomingHitOnAlly(targetType, enemyUid, `${enemyName}(${skillName})`, rawRoll, baseDmg, extraEffects);
      log(`👹 <b>[적 단일 공격: ${enemyName} — ${skillName}]</b> (${rollFormula})<br>${res.logHtml}`);
    }

    refreshUI();
    saveSessionState();
  }
  window.onReceiveGmAttackPacket = onReceiveGmAttackPacket;


  /* ==========================================================================
     12. [v2.24 6차 개편] 미니멀 온라인 연결/연결해제 토글 & 즉시 발동 / 라운드 종료 분리
     ========================================================================== */
  function disconnectGmPeerRoom() {
    try {
      if (playerPeerConn) {
        playerPeerConn.close();
        playerPeerConn = null;
      }
      if (playerPeerInstance) {
        playerPeerInstance.destroy();
        playerPeerInstance = null;
      }
    } catch (e) {}
    activePeerRoomCode = '';
    syncConnectionMode = (syncedEnemies.length > 0) ? 'clipboard' : 'none';
    playBeep(320, 'sine', 0.12);
    log(`🔌 <b>[온라인 연결 해제]</b> 마스터 컨트롤러와의 연결을 종료했습니다.`);
    renderSyncBridgeUI();
  }
  window.disconnectGmPeerRoom = disconnectGmPeerRoom;

  function toggleGmPeerConnection() {
    if (syncConnectionMode === 'peer' && playerPeerConn && playerPeerConn.open) {
      disconnectGmPeerRoom();
    } else {
      connectToGmPeerRoom();
    }
  }
  window.toggleGmPeerConnection = toggleGmPeerConnection;

  /* 단일 스킬 즉시 실행 완료 시점: 마스터 패킷 송신 + 공명하는 등불 / 합격기 즉시 체크 (라운드 강제 종료 없음!) */
  let jointAttackTriggeredRound = -1;
  let resonantLampTriggeredRound = -1;

  function completeImmediateSkillExecution() {
    clearAllSkillTimers();
    isExecuting = false;
    actionQueue = [];

    const hasEnemySync = (syncedEnemies.length > 0);

    const triggerResonantLamp = (onDone) => {
      if (hasBearerPassive('공명하는 등불') && resonantLampTriggeredRound !== curRound) {
        const commonRollUids = [...bearerRollHitUidsThisRound].filter(uid => compRollHitUidsThisRound.has(uid));
        if (hasEnemySync && commonRollUids.length > 0) {
          resonantLampTriggeredRound = curRound;
          const hitNames = [];
          commonRollUids.forEach(uid => {
            const resTarget = getEnemyByUid(uid);
            if (resTarget) {
              if (resTarget.hp > 0) {
                applyLocalSyncedEnemyDamage(resTarget, 3, false);
                queueGmEffect({ kind: 'damage', targetUid: resTarget.uid, dmg: 3, ignoreShield: false, label: '공명하는 등불 +3' });
                hitNames.push(`${resTarget.name}(잔여 HP ${resTarget.hp}/${resTarget.maxHp})`);
              } else {
                queueGmEffect({ kind: 'damage', targetUid: resTarget.uid, dmg: 3, ignoreShield: false, label: '공명하는 등불 +3' });
                hitNames.push(`${resTarget.name}(💀처치 완료)`);
              }
            }
          });
          if (hitNames.length > 0) {
            playBeep(740, 'triangle', 0.15);
            log(`🏮 <b>[패시브: 공명하는 등불 ➔ 🎯${hitNames.join(', ')}]</b> 베어러와 ${getCompName()}이(가) 동일한 적에게 명중 공격을 적중시켜 성염이 공명합니다! ➔ <b>고정 3 추가 피해</b>!`);
            recordActionBriefing(`   ↳ 🏮 [패시브: 공명하는 등불 ➔ 🎯${hitNames.join(', ')}] 베어러 & 동료 동일 적 합동 명중 ➔ 고정 3 추가 피해`);
          }
        } else if (!hasEnemySync && bearerAttackRollUsedThisRound && compAttackRollUsedThisRound) {
          resonantLampTriggeredRound = curRound;
          playBeep(740, 'triangle', 0.15);
          log(`🏮 <b>[패시브: 공명하는 등불]</b> 베어러와 ${getCompName()}의 명중 공격이 교차하며 성염이 공명합니다! 공통으로 적중한 적에게 <b>고정 3 추가 피해</b>!`);
          recordActionBriefing(`   ↳ 🏮 [패시브: 공명하는 등불] 베어러 & 동료 합동 명중 시 공통 타격 적에게 고정 3 추가 피해`);
        }
      }
      if (onDone) onDone();
    };

    const triggerJointAttack = () => {
      if (communionActiveThisRound !== 'none' && jointAttackTriggeredRound !== curRound) {
        const commonDirectUids = [...bearerDirectHitUidsThisRound].filter(uid => compDirectHitUidsThisRound.has(uid));
        const canTriggerJoint = hasEnemySync ? (commonDirectUids.length > 0) : (bearerDealtDirectHitThisRound && compDealtDirectHitThisRound);
        if (canTriggerJoint) {
          jointAttackTriggeredRound = curRound;
          const jointDmg = 1 + curLevel;
          const flameName = (communionActiveThisRound === 'shine') ? '비추는 불꽃' : '태우는 불꽃';
          if (hasEnemySync && commonDirectUids.length > 0) {
            const jNames = [];
            commonDirectUids.forEach(uid => {
              const jTarget = getEnemyByUid(uid);
              if (jTarget) {
                if (jTarget.hp > 0) {
                  applyLocalSyncedEnemyDamage(jTarget, jointDmg, true);
                  queueGmEffect({ kind: 'damage', targetUid: jTarget.uid, dmg: jointDmg, ignoreShield: true, label: `합격기(${flameName}) +${jointDmg}` });
                  jNames.push(`${jTarget.name}(잔여 HP ${jTarget.hp}/${jTarget.maxHp})`);
                } else {
                  queueGmEffect({ kind: 'damage', targetUid: jTarget.uid, dmg: jointDmg, ignoreShield: true, label: `합격기(${flameName}) +${jointDmg}` });
                  jNames.push(`${jTarget.name}(💀처치 완료)`);
                }
              }
            });
            playBeep(880, 'triangle', 0.25);
            log(`💥 <b>[합격기 폭발! (${flameName} 공명) ➔ 🎯${jNames.join(', ')}]</b> ${bearerName}와(과) ${getCompName()}이(가) 동시에 직접 타격한 대상에게 <b>방어막(Shield)을 무시하고 실제 HP에 즉시 [고정 ${jointDmg} 피해](1+Lv.${curLevel})</b>를 입힙니다!`);
            recordActionBriefing(`   ↳ 💥 [합격기 발동 (${flameName}) ➔ 🎯${jNames.join(', ')}] 방어막 무시 실제 HP 고정 +${jointDmg} 추가 피해!`);
          } else {
            playBeep(880, 'triangle', 0.25);
            log(`💥 <b>[합격기 폭발! (${flameName} 공명)]</b> ${bearerName}와(과) ${getCompName()}이(가) 동시에 직접 타격한 공통의 적에게 <b>방어막(Shield)을 무시하고 실제 HP에 즉시 [고정 ${jointDmg} 피해](1+Lv.${curLevel})</b>를 입힙니다!`);
            recordActionBriefing(`   ↳ 💥 [합격기 발동 (${flameName})] 공통 타격 적에게 방어막 무시 실제 HP 고정 +${jointDmg} 추가 피해!`);
          }
        }
      }

      // 후속 타격 완료 후 마스터 패킷 전송 및 UI 반영
      if (pendingGmActionEffects.length > 0 && typeof sendPlayerActionPacketToGm === 'function') {
        sendPlayerActionPacketToGm(pendingGmActionEffects);
        pendingGmActionEffects = [];
      }
      renderQueueUI();
      refreshUI();
      saveSessionState();
    };

    // 공명하는 등불 또는 합격기 발동 조건 사전 확인
    const hasCommonDirect = hasEnemySync
      ? [...bearerDirectHitUidsThisRound].some(uid => compDirectHitUidsThisRound.has(uid))
      : (bearerDealtDirectHitThisRound && compDealtDirectHitThisRound);
    const willTriggerJoint = Boolean(communionActiveThisRound !== 'none' && jointAttackTriggeredRound !== curRound && hasCommonDirect);

    const hasCommonRoll = hasEnemySync
      ? [...bearerRollHitUidsThisRound].some(uid => compRollHitUidsThisRound.has(uid))
      : (bearerAttackRollUsedThisRound && compAttackRollUsedThisRound);
    const willTriggerLamp = Boolean(hasBearerPassive('공명하는 등불') && resonantLampTriggeredRound !== curRound && hasCommonRoll);

    if (willTriggerLamp || willTriggerJoint) {
      const runFollowups = () => {
        if (willTriggerLamp) {
          triggerResonantLamp(() => {
            if (willTriggerJoint) {
              if (typeof executeAfterChainHighlight === 'function') {
                executeAfterChainHighlight(triggerJointAttack, 2000);
              } else {
                setTimeout(triggerJointAttack, 1800);
              }
            } else {
              if (pendingGmActionEffects.length > 0 && typeof sendPlayerActionPacketToGm === 'function') {
                sendPlayerActionPacketToGm(pendingGmActionEffects);
                pendingGmActionEffects = [];
              }
              renderQueueUI();
              refreshUI();
              saveSessionState();
            }
          });
        } else if (willTriggerJoint) {
          triggerJointAttack();
        }
      };

      if (typeof executeAfterChainHighlight === 'function') {
        executeAfterChainHighlight(runFollowups, 2400);
      } else {
        setTimeout(runFollowups, 2000);
      }
    } else {
      // 후속 타격 없을 시 즉시 패킷 전송 및 큐 갱신
      if (pendingGmActionEffects.length > 0 && typeof sendPlayerActionPacketToGm === 'function') {
        sendPlayerActionPacketToGm(pendingGmActionEffects);
        pendingGmActionEffects = [];
      }
      renderQueueUI();
      refreshUI();
      saveSessionState();
    }

    if (senBonusActionReady && compHp > 0) {
      log(`⚡ <b>[무영의 검무: 추가 행동 대기]</b> 동료 기술 바에서 <b>추가로 발동할 다른 스킬 1개</b>를 드래그하여 발동하세요!`);
    }
  }
  window.completeImmediateSkillExecution = completeImmediateSkillExecution;

  /* 라운드 종료 정산 (GM 컨트롤러에서 라운드 종료 신호를 보내거나, 단독 모드에서 [⏭️ 라운드 종료] 클릭 시 실행) */
  function advancePlayerRound(source = 'manual') {
    if (isExecuting) return;
    if (source === 'manual' && typeof isPlayerOnlineConnected === 'function' && isPlayerOnlineConnected()) {
      playBeep(220, 'sawtooth', 0.15);
      log('⚠️ <b>[온라인 연결 중]</b> 마스터와 연결된 상태에서는 마스터 컨트롤러에서 라운드를 종료합니다.');
      return;
    }
    senBonusActionReady = false;
    finishExecution();
    bearerAttackRollUsedThisRound = false;
    compAttackRollUsedThisRound = false;
    bearerActedThisRound = false;
    compActedThisRound = false;
    bearerDealtDirectHitThisRound = false;
    compDealtDirectHitThisRound = false;
    bearerDirectHitUidsThisRound.clear();
    compDirectHitUidsThisRound.clear();
    bearerRollHitUidsThisRound.clear();
    compRollHitUidsThisRound.clear();
    if (source === 'gm_sync') {
      log(`🌐 <b>[마스터 라운드 동기화]</b> 마스터 컨트롤러의 라운드 종료에 맞춰 <b>${curRound}라운드</b>가 개시되었습니다.`, 'divider');
    }
    refreshUI();
    saveSessionState();
  }
  window.advancePlayerRound = advancePlayerRound;

  function toggleActorActedState(actor, e) {
    if (e) e.stopPropagation();
    if (actor === 'bearer') {
      bearerActedThisRound = !bearerActedThisRound;
      playBeep(bearerActedThisRound ? 360 : 580, 'sine', 0.08);
      log(bearerActedThisRound ? `🔒 <b>[베어러 행동 완료 처리]</b> 베어러 스킬 덱이 비활성화되었습니다.` : `🔓 <b>[베어러 덱 재활성화]</b> 이번 라운드 베어러 스킬 덱 잠금을 해제했습니다.`);
    } else {
      compActedThisRound = !compActedThisRound;
      playBeep(compActedThisRound ? 360 : 580, 'sine', 0.08);
      log(compActedThisRound ? `🔒 <b>[동료 행동 완료 처리]</b> 동료 스킬 덱이 비활성화되었습니다.` : `🔓 <b>[동료 덱 재활성화]</b> 이번 라운드 ${getCompName()} 스킬 덱 잠금을 해제했습니다.`);
    }
    refreshUI();
    saveSessionState();
  }
  window.toggleActorActedState = toggleActorActedState;

  function executeBearerSkillImmediate(slotIdx) {
    if (isExecuting) return;
    if (bearerActedThisRound) {
      playBeep(220, 'sawtooth', 0.16);
      log(`⏳ <b>[베어러 행동 완료]</b> 이번 라운드 베어러의 행동(1회)을 이미 소모했습니다.`);
      return;
    }
    if (typeof clearChainHighlightTimers === 'function') clearChainHighlightTimers();
    closeAllStatusMenus();
    if (shouldDemoteLogsOnNextAction) {
      demoteOldRoundLogs();
      lastRoundActionSummary = [];
    }
    if (!combatStarted && curRound === 1) {
      triggerCombatStartPerks(false);
    }
    isExecuting = true;
    pendingGmActionEffects = [];
    const cardEl = (DOM.skillCards && DOM.skillCards[slotIdx]) || document.getElementById(`card-bearer-${slotIdx}`);
    triggerSkillSlamImpact(cardEl, false);
    resetDicePanelVisuals();
    try {
      runBearerSkillLogic(slotIdx, () => {
        bearerActedThisRound = true;
        completeImmediateSkillExecution();
      });
    } catch (e) {
      console.error(e);
      bearerActedThisRound = true;
      completeImmediateSkillExecution();
    }
  }
  window.executeBearerSkillImmediate = executeBearerSkillImmediate;

  function executeCompSkillImmediate(tag) {
    if (isExecuting) return;
    if (compActedThisRound && !senBonusActionReady) {
      playBeep(220, 'sawtooth', 0.16);
      log(`⏳ <b>[동료 행동 완료]</b> 이번 라운드 ${getCompName()}의 행동(1회)을 이미 소모했습니다.`);
      return;
    }
    if (typeof clearChainHighlightTimers === 'function') clearChainHighlightTimers();
    closeAllStatusMenus();
    if (shouldDemoteLogsOnNextAction) {
      demoteOldRoundLogs();
      lastRoundActionSummary = [];
    }
    if (!combatStarted && curRound === 1) {
      triggerCombatStartPerks(false);
    }
    const isBonusTurn = Boolean(senBonusActionReady);
    if (senBonusActionReady) {
      senBonusActionReady = false;
    }
    isExecuting = true;
    pendingGmActionEffects = [];
    const wrapEl = (DOM.compWraps && DOM.compWraps[tag]) || document.getElementById(`wrap-comp-${tag}`);
    triggerSkillSlamImpact(wrapEl, false);
    resetDicePanelVisuals();
    try {
      runCompSkillLogic(tag, () => {
        // 무영의 검무(ms_4_2) 시전 직후에는 senBonusActionReady가 true로 켜지므로 추가 행동 1회까지 소모한 뒤 덱을 잠금
        compActedThisRound = isBonusTurn ? true : !senBonusActionReady;
        completeImmediateSkillExecution();
      });
    } catch (e) {
      console.error(e);
      compActedThisRound = true;
      completeImmediateSkillExecution();
    }
  }
  window.executeCompSkillImmediate = executeCompSkillImmediate;

  // (스킬 및 슬롯 옵션 즉시 발동 바인딩은 선언부로 통합 정리 완료)