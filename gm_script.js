/* =========================================================================
   [공식 DB 100% 동기화] 공식 엑셀 DB 및 1장 시나리오 기반 에너미 16종 전수 탑재
   ========================================================================= */
const PRESETS = {
  // 1. 1장 공식 시나리오 모듈 마물 (4종)
  lizard: {
    name: "바람 도마뱀", grade: "일반", maxHp: 8, ac: 11,
    intentsP1: [
      "[돌풍 꼬리치기] ➔ 아군 전체 (고정 3 광역 피해)",
      "[물어뜯기] ➔ 베어러 (고정 4 피해)",
      "[위협적인 활공] ➔ 단일 아군 1체 (고정 2 피해 + [방어 약화] 부여)"
    ]
  },
  sludge: {
    name: "오염된 진흙 하수체", grade: "일반", maxHp: 8, ac: 11,
    intentsP1: [
      "[자폭 돌진] ➔ 아군 전체 (고정 3 광역 피해)",
      "[진흙 튀기기] ➔ 단일 아군 1체 (고정 3 피해)"
    ]
  },
  elite_snake: {
    name: "돌굳이 구렁이", grade: "정예", maxHp: 20, ac: 12, bindDmgP1: 4,
    intentsP1: [
      "[경직독 이빨] ➔ 베어러 (고정 5 피해 + [행동 제약] 1턴 부여)",
      "[석화 꼬리 후려치기] ➔ 아군 전체 (고정 4 광역 피해)",
      "[똬리 틀기] ➔ 자신 방어막 8 부여 및 다음 턴 공격 명중 [유리함]"
    ]
  },
  elite_mutant: {
    name: "변종 침식 괴수", grade: "정예", maxHp: 20, ac: 12,
    intentsP1: [
      "[부식성 침 뱉기] ➔ 베어러 (고정 5 피해 + [방어 약화] 부여)",
      "[휘석 파열포] ➔ 이번 턴 충전 (다음 턴 단일 대상 고정 8 피해 예고)",
      "[산성 발톱] ➔ 단일 아군 1체 (고정 6 피해)"
    ]
  },

  // 2. 아티스 제국군 표준 보병 8종 (공식 엑셀 '일반 정예' 시트 100% 동기화)
  minion_infantry: {
    name: "징집 보병", grade: "일반", maxHp: 7, ac: 11,
    intentsP1: ["[찌르기] ➔ 단일 4 피해", "[돌격] ➔ 단일 5 피해 (자신도 1 피해)"]
  },
  minion_shield: {
    name: "방패병", grade: "일반", maxHp: 9, ac: 12,
    intentsP1: ["[방패 밀치기] ➔ 단일 3 피해 + [행동 제약]", "[방진 전개] ➔ 자신 방어막 6 생성"]
  },
  minion_bomb: {
    name: "화약/분진병", grade: "일반", maxHp: 6, ac: 10,
    intentsP1: ["[타르 투척] ➔ 단일 2 피해 + [방어 약화]", "[유황탄] ➔ 단일 2 피해 + [지속 피해: 3] 1턴"]
  },
  minion_archer: {
    name: "감시탑 사수", grade: "일반", maxHp: 5, ac: 11,
    intentsP1: ["[쇠뇌 사격] ➔ 단일 3 피해", "[정밀 조준] ➔ 이번 턴 충전 (다음 턴 단일 7 피해)"]
  },
  elite_1: {
    name: "돌격 집행관", grade: "정예", maxHp: 22, ac: 13,
    intentsP1: ["[대형 메이스] ➔ 단일 6 피해", "[단두 강타] ➔ 이번 턴 충전 (다음 턴 단일 12 피해)"]
  },
  elite_shield: {
    name: "중장갑 방패장", grade: "정예", maxHp: 24, ac: 13,
    intentsP1: ["[철벽 파쇄] ➔ 단일 5 피해 + [행동 제약]", "[성벽 요새화] ➔ 아군 1체 또는 자신 방어막 12 생성"]
  },
  elite_inquisitor: {
    name: "이단심문관", grade: "정예", maxHp: 18, ac: 12,
    intentsP1: ["[역장 마력탄] ➔ 단일 5 피해 + [방어 약화]", "[휘석 폭주] ➔ 파티 전체 4 광역 피해"]
  },
  elite_sniper: {
    name: "정예 저격수", grade: "정예", maxHp: 16, ac: 13,
    intentsP1: ["[저지 사격] ➔ 단일 5 피해 + 피격 대상의 다음 1회 판정에 [불리함] 부여", "[저격 선고] ➔ 이번 턴 충전 (다음 턴 단일 10 피해)"]
  },

  // 3. 공식 캠페인 권역 보스 4종 (공식 엑셀 '보스' 시트 확정안 동기화)
  boss_1: {
    name: "작골의 데암베르트", grade: "보스 1", maxHp: 40, ac: 12, p2Ac: 13, awakenAtRoundEnd: true, bindDmgP1: 4, bindDmgP2: 6,
    intentsP1: [
      "[불볕] ➔ 아군 전체 (고정 3 광역 피해)",
      "[타오르는 뼈] ➔ 베어러 (고정 5 피해 + [방어 약화] 부여)"
    ],
    p2Title: "피의 발도술",
    p2Desc: "찰나의 순간 검을 뽑아 '자신의 왼팔 안쪽'을 깊게 베어 가른 뒤 검집으로 밀어 넣는다. 뿜어져 나온 피가 검집 안으로 콸콸 쏟아져 들어가며 마찰을 잃은 검날이 섬뜩하게 미끄러진다.",
    intentsP2: [
      "[떠오르는 태양] ➔ 단일 아군 1체 (고정 8 피해)",
      "[햇무리] ➔ 아군 전체 (고정 5 광역 피해 + [행동 제약] 1턴 부여)",
      "[흔들리는 고개] ➔ 자신 강화 (피격 피해 5 경감 + 다음 턴 명중 판정 유리함)"
    ]
  },
  boss_2: {
    name: "위험한 정치가 앙게르", grade: "보스 2", maxHp: 50, ac: 13, p2Ac: 14,
    intentsP1: [
      "[아름다운 징벌] ➔ 베어러 (고정 7 피해 + [방어 약화] 부여)",
      "[하늘이 내려준 땅문서] ➔ 아군 전체 (고정 5 광역 피해 + [행동 제약] 1턴 부여)"
    ],
    p2Title: "피와 잉크의 지배자",
    p2Desc: "잉크 원액을 날카로운 가시 형태로 굳힌 뒤, 망설임 없이 '자신의 열 손가락 손톱 밑 생살 속'으로 찔러 박아 넣는다. 손톱이 들리고 살점이 찢겨 나가는 끔찍한 파열음과 함께 열 손가락 끝에서 피와 마력 잉크가 엉겨 붙은 실선들이 신경망처럼 뻗어 나간다.",
    intentsP2: [
      "[비소식] ➔ 아군 전체 (고정 6 광역 피해)",
      "[불편한 이슬] ➔ 단일 아군 1체 (고정 9 피해 + [지속 피해: 3] 2턴 부여)",
      "[은혜로운 조사] ➔ 자신 강화 (피격 피해 6 경감 + 다음 턴 [비소식] 판정 유리함)"
    ]
  },
  boss_3: {
    name: "저무는 메이지 휴", grade: "보스 3", maxHp: 60, ac: 13, p2Ac: 14,
    intentsP1: [
      "[저무는 해] ➔ 베어러 (고정 8 피해 + [지속 피해: 3] 2턴)",
      "[비스듬한 빛] ➔ 아군 전체 (고정 6 광역 피해 + [방어 약화])"
    ],
    p2Title: "각성 프리즘 아이",
    p2Desc: "자신의 손끝에서 고밀도 마력광선을 쏘아 올려 '자신의 왼쪽 눈'을 직격해 태워버린다. 안구가 타들어 가는 악취와 함께 살점이 익는 연기 속에서 시신경에 다층 프리즘을 박아 넣는다. 뇌 속 순수 마력이 프리즘 안구 속에서 직접 굴절하며 극채색 살육의 광채를 뿜어낸다.",
    intentsP2: [
      "[하늘의 둘레] ➔ 아군 전체 (고정 8 광역 피해)",
      "[아지랑이] ➔ 자신 강화 (피격 피해 6 경감 + 다음 턴 판정 유리함)",
      "[아름다운 빛] ➔ 베어러 (고정 10 피해 + [행동 제약] 1턴)"
    ]
  },
  boss_4: {
    name: "교황 레아 아티스도티르", grade: "최종 결전", maxHp: 70, ac: 13, p2Ac: 14,
    intentsP1: [
      "[브레스드 파이어] ➔ 단일 아군 1체 (고정 8 피해 + [지속 피해: 3] 2턴)",
      "[스프레딩 플레임] ➔ 아군 전체 (고정 6 광역 피해 + 베어러 과열 +20 강제 누적)"
    ],
    p2Title: "마검 비룡 소환",
    p2Desc: "비틀거리던 교황이 자신의 '왼손 새끼손가락'을 제단에 내리찍어 잘라낸다. 뿜어져 나온 피와 뼛가루가 화염과 엉겨 붙으며 거대한 화염의 마검 [비룡]으로 실체화된다.",
    intentsP2: [
      "[화염 칼날] ➔ 베어러 (고정 10 피해 + [방어 약화] 부여)",
      "[화염 분신] ➔ 자신 강화 (피격 피해 6 경감 + 다음 턴 [리핑 플레임] 판정 유리함)",
      "[리핑 플레임] ➔ 아군 전체 (고정 8 광역 피해 + [행동 제약] 1턴 부여)"
    ]
  }
};

let activeEnemies = [];
let enemyCounter = 0;
let pendingPhase2Enemy = null;
const GM_STORAGE_KEY = 'fifth_hand_gm_session_v30';

/* 세션 스토리지 엔진 */
function saveGmSession() {
  try {
    const stageName = document.getElementById('stage-name')?.value || '전투 구역';
    const stagePyrite = document.getElementById('stage-pyrite')?.value || '0';
    const stagePotion = document.getElementById('stage-potion')?.value || '1';
    const stageDeathStack = document.getElementById('stage-death-stack')?.value || '0';
    const stageCommunion = document.getElementById('stage-communion')?.value || 'none';
    const payload = {
      activeEnemies,
      enemyCounter,
      stageName,
      stagePyrite,
      stagePotion,
      stageDeathStack,
      stageCommunion,
      timestamp: Date.now()
    };
    localStorage.setItem(GM_STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {}
  if (typeof broadcastGmStateToPlayer === 'function') broadcastGmStateToPlayer(false);
}

function loadGmSession() {
  try {
    const raw = localStorage.getItem(GM_STORAGE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (data && Array.isArray(data.activeEnemies)) {
      activeEnemies = data.activeEnemies;
      enemyCounter = data.enemyCounter || activeEnemies.length;
      if (document.getElementById('stage-name')) document.getElementById('stage-name').value = data.stageName || '전투 구역';
      if (document.getElementById('stage-pyrite')) document.getElementById('stage-pyrite').value = data.stagePyrite ?? '0';
      if (document.getElementById('stage-potion')) document.getElementById('stage-potion').value = data.stagePotion ?? '1';
      if (document.getElementById('stage-death-stack')) document.getElementById('stage-death-stack').value = data.stageDeathStack ?? '0';
      if (document.getElementById('stage-communion')) document.getElementById('stage-communion').value = data.stageCommunion || 'none';
      return true;
    }
  } catch (err) {}
  return false;
}

/* 마스터 컨트롤러 파티 물자 수동 증감 & 플레이어 대시보드 양방향 동기화 */
function adjGmResource(field, delta) {
  const idMap = {
    pyrite: 'stage-pyrite',
    potion: 'stage-potion',
    deathStack: 'stage-death-stack'
  };
  const el = document.getElementById(idMap[field]);
  if (!el) return;
  const cur = parseInt(el.value || '0', 10) || 0;
  const next = Math.max(0, cur + delta);
  el.value = String(next);
  onManualGmResourceEdit();
}

function onManualGmResourceEdit() {
  const pyrite = Math.max(0, parseInt(document.getElementById('stage-pyrite')?.value || '0', 10) || 0);
  const potion = Math.max(0, parseInt(document.getElementById('stage-potion')?.value || '0', 10) || 0);
  const deathStack = Math.max(0, parseInt(document.getElementById('stage-death-stack')?.value || '0', 10) || 0);
  const commVal = document.getElementById('stage-communion')?.value || 'none';

  if (connectedPlayerParty) {
    connectedPlayerParty.pyrite = pyrite;
    connectedPlayerParty.potion = potion;
    connectedPlayerParty.deathStack = deathStack;
    connectedPlayerParty.communionFlame = (commVal === 'shine' || commVal === 'burn') ? commVal : 'none';
    connectedPlayerParty.communionActiveThisRound = 'none';
  }

  updateIntentPreview();
  saveGmSession();

  sendPacketFromGm({
    type: 'GM_PARTY_RESOURCE_UPDATE',
    msgId: 'gmres_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    pyrite,
    potion,
    deathStack,
    communionState: commVal
  });
}

function syncResourceInputsFromParty(p) {
  if (!p) return;
  const pyEl = document.getElementById('stage-pyrite');
  const poEl = document.getElementById('stage-potion');
  const dsEl = document.getElementById('stage-death-stack');
  const cmEl = document.getElementById('stage-communion');
  const cmSub = document.getElementById('gm-communion-sub');

  if (pyEl && p.pyrite !== undefined) pyEl.value = String(p.pyrite);
  if (poEl && p.potion !== undefined) poEl.value = String(p.potion);
  if (dsEl && p.deathStack !== undefined) dsEl.value = String(p.deathStack);
  if (cmEl) {
    if (p.communionActiveThisRound === 'shine') {
      cmEl.value = 'none';
      if (cmSub) { cmSub.innerText = '이번R 비추는 불꽃 발동중!'; cmSub.style.color = '#7dd3fc'; }
    } else if (p.communionActiveThisRound === 'burn') {
      cmEl.value = 'none';
      if (cmSub) { cmSub.innerText = '이번R 태우는 불꽃 발동중!'; cmSub.style.color = '#fde68a'; }
    } else if (p.communionFlame === 'shine') {
      cmEl.value = 'shine';
      if (cmSub) { cmSub.innerText = '비추는 불꽃 보유중'; cmSub.style.color = '#38bdf8'; }
    } else if (p.communionFlame === 'burn') {
      cmEl.value = 'burn';
      if (cmSub) { cmSub.innerText = '태우는 불꽃 보유중'; cmSub.style.color = '#f59e0b'; }
    } else {
      cmEl.value = 'none';
      if (cmSub) { cmSub.innerText = '휴식·교감 불꽃'; cmSub.style.color = '#64748b'; }
    }
  }
}

/* 크로스 플랫폼 클립보드 복사 엔진 */
function copyToClipboard(text, onSuccess, onError) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => {
      if (onSuccess) onSuccess();
    }).catch(() => {
      fallbackCopy(text, onSuccess, onError);
    });
  } else {
    fallbackCopy(text, onSuccess, onError);
  }
}

function fallbackCopy(text, onSuccess, onError) {
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    if (successful) {
      if (onSuccess) onSuccess();
    } else {
      if (onError) onError();
    }
  } catch (err) {
    if (onError) onError();
  }
}

/* =========================================================================
   [코어 전술 엔진] 1. 단일 대미지 디스패처 (applyDamage)
   - 일반 피격: 방어막 우선 차감 -> 초과 피해 HP 반영
   - DoT 지속 피해: 방어막 무시 HP 직격
   - 1페이즈 보스 오버킬 방지 클램핑 및 자동 2페이즈 각성 연동
   - 적 사망 시 상태이상 및 잔여 칩 자동 소멸
   ========================================================================= */
function applyDamage(e, amount, isDot = false) {
  if (!e || e.hp <= 0 || amount <= 0) return 0;

  let damageToHp = amount;

  // 0. 보스 2페이즈 자가 강화 등 피격 피해 경감 버프 우선 차감 (DoT 및 방어막 무시 공격 제외)
  if (!isDot && (e.dmgReduction || 0) > 0) {
    const reduced = Math.min(damageToHp, e.dmgReduction);
    damageToHp = Math.max(0, damageToHp - e.dmgReduction);
    if (reduced > 0) {
      showToast(`🛡️ ${e.name}: 자가 강화로 피격 피해 -${reduced} 경감 (잔여 피해: ${damageToHp})`);
    }
    if (damageToHp <= 0) return 0;
  }

  // 1. 일반 공격 피격 시 방어막 우선 흡수
  if (!isDot && (e.shield || 0) > 0) {
    if (e.shield >= amount) {
      e.shield -= amount;
      showToast(`🛡️ ${e.name}: 방어막으로 ${amount} 피해 전량 흡수 (잔여: ${e.shield})`);
      return 0;
    } else {
      const absorbed = e.shield;
      damageToHp = amount - absorbed;
      e.shield = 0;
      showToast(`🛡️ ${e.name}: 방어막 ${absorbed} 소진 후 HP로 ${damageToHp} 관통`);
    }
  }

  // 2. HP 차감 연산 및 1페이즈 보스 오버킬 방지
  const isP1Boss = (!e.isPhase2 && e.intentsP2 && e.intentsP2.length > 0);
  const targetHp = e.hp - damageToHp;

  if (isP1Boss) {
    // 룰북 원칙: 1페이즈 보스는 치명타나 대형 스킬을 맞아도 즉사하지 않고 최소 HP 1 보존
    e.hp = Math.max(1, targetHp);
    const halfHp = Math.floor(e.maxHp / 2);
    if (e.hp <= halfHp) {
      const isRoundEndAwaken = Boolean(e.awakenAtRoundEnd || e.baseKey === 'boss_1');
      if (isRoundEndAwaken) {
        if (!e.pendingPhase2Awaken) {
          e.pendingPhase2Awaken = true;
          showToast(`⚠️ ${e.name}: HP ${e.hp} 도달! 룰북 규정에 따라 [라운드 종료 시점]에 2페이즈로 각성합니다!`);
        }
      } else {
        transitionPhase2(e); // 보스 2~4: 50% 이하 진입 즉시 단일 각성 엔진 호출
      }
    }
  } else {
    e.hp = Math.max(0, targetHp);
  }

  // 3. 적 처치(HP 0) 처리: 상태이상 트레이 및 지속피해 즉시 정리
  if (e.hp <= 0) {
    e.shield = 0;
    e.status.dots = [];
    e.status.weak = false;
    e.status.bindTurns = 0;
  }

  return damageToHp;
}

/* =========================================================================
   [코어 전술 엔진] 2. 단일 페이즈 전이 엔진 (transitionPhase2)
   - AC 14 상향
   - 1페이즈 잔여 방어막 0 초기화
   - 외적 디버프 해제 및 체내 DoT 유지
   - 2페이즈 1턴(idx 0) 리셋
   - 생애주기 보존 플래그(justAwakened = true) 세팅
   ========================================================================= */
function transitionPhase2(enemy) {
  if (!enemy || enemy.isPhase2) return;

  enemy.isPhase2 = true;
  enemy.pendingPhase2Awaken = false;
  enemy.ac = enemy.p2Ac || (enemy.baseKey === 'boss_1' ? 13 : 14);
  enemy.turnIdx = 0; // 2페이즈 1턴 리셋
  enemy.shield = 0;  // 1페이즈 방어막 완전 해제
  enemy.justAwakened = true; // 핵심 생애주기 플래그: 다음 라운드 정산 시 턴 증가 차단

  // 외적 디버프 해제, 체내 DoT는 룰북 규정대로 유지
  enemy.status.weak = false;
  enemy.status.weakCharges = 0;
  enemy.status.bindTurns = 0;

  // 룰북 원칙: 보스 2페이즈 돌입 시 보스와 아군 양측의 외적 상태이상([행동 제약], [방어 약화]) 즉시 모두 해제
  if (typeof sendPacketFromGm === 'function') {
    sendPacketFromGm({
      type: 'GM_BOSS_PHASE2_AWAKEN',
      msgId: 'gmp2_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      enemyUid: enemy.uid,
      enemyName: enemy.name,
      p2Title: enemy.p2Title || '2페이즈 각성',
      p2Ac: enemy.ac
    });
  }

  pendingPhase2Enemy = enemy;

  const p2Modal = document.getElementById('phase2-modal');
  if (p2Modal) {
    document.getElementById('phase2-title').innerText = `${enemy.name} : ${enemy.p2Title || '2페이즈 각성'}`;
    document.getElementById('phase2-desc').innerText = enemy.p2Desc || '보스가 2페이즈로 각성했습니다.';
    p2Modal.classList.add('active');
  }

  showToast(`⚠️ ${enemy.name}: HP ${enemy.hp} 도달! 2페이즈 각성 연출 발동!`);
  gmLog(`⚠️ <b>[보스 2페이즈 각성!]</b> ${enemy.name}: ${enemy.p2Title || '2페이즈 각성'} (AC ${enemy.ac} 상향, 2페이즈 1턴 리셋, 외적 상태이상 해제)`, 'enemy');
}

/* 네이밍 태그 엔진 (A, B 순차 부여 공식 규격) */
function updateEnemyTags() {
  const counts = {};
  activeEnemies.forEach(e => {
    counts[e.baseKey] = (counts[e.baseKey] || 0) + 1;
  });

  const curIdx = {};
  activeEnemies.forEach(e => {
    const p = PRESETS[e.baseKey] || PRESETS.minion_infantry;
    const isBoss = e.baseKey.startsWith('boss');
    if (isBoss || counts[e.baseKey] <= 1) {
      e.baseName = p.name;
      e.letterTag = '';
      e.name = p.name;
    } else {
      const idx = (curIdx[e.baseKey] || 0);
      curIdx[e.baseKey] = idx + 1;
      e.letterTag = String.fromCharCode(65 + idx);
      e.baseName = p.name;
      e.name = `${p.name} ${e.letterTag}`;
    }
  });
}

/* =========================================================================
   [수술 4단계] 스냅샷 되돌리기(Undo) 스택 & 스마트 인텐트·타겟 자동 생성 엔진
   ========================================================================= */
let gmUndoStack = [];

function pushGmUndoSnapshot(reasonLabel = '상태 변경') {
  try {
    const snap = {
      reason: reasonLabel,
      timestamp: Date.now(),
      activeEnemies: JSON.parse(JSON.stringify(activeEnemies))
    };
    gmUndoStack.push(snap);
    if (gmUndoStack.length > 15) gmUndoStack.shift();
    updateGmUndoButtonUI();
  } catch (e) {}
}

function updateGmUndoButtonUI() {
  const btn = document.getElementById('btn-gm-undo');
  if (!btn) return;
  if (gmUndoStack.length > 0) {
    const last = gmUndoStack[gmUndoStack.length - 1];
    btn.disabled = false;
    btn.style.opacity = '1';
    btn.innerText = `↩ 되돌리기 (${gmUndoStack.length})`;
    btn.title = `직전 기록(${last.reason}) 이전 상태로 되돌립니다`;
  } else {
    btn.disabled = true;
    btn.style.opacity = '0.45';
    btn.innerText = '↩ 되돌리기';
  }
}

function undoLastGmState() {
  if (gmUndoStack.length === 0) return;
  const snap = gmUndoStack.pop();
  activeEnemies = snap.activeEnemies;
  updateGmUndoButtonUI();
  renderEnemyCards();
  updateIntentPreview();
  saveGmSession();
  showToast(`↩ [되돌리기 완료] '${snap.reason}' 직전 상태로 복원되었습니다!`);
  gmLog(`↩ <b>[되돌리기]</b> '${snap.reason}' 직전 상태로 복원`, 'system');
}

/* 인텐트 원문에서 단일 공격인지, 광역인지, 충전/자신 버프인지 분석 */
function classifyRawIntent(rawIntent) {
  const s = String(rawIntent || '');
  const isCharge = /충전|예고/.test(s);
  const isSelfBuff = /➔\s*자신\s*강화|자신.*방어막|방어막\s*\d+\s*(?:생성|부여)/.test(s) || (!/피해/.test(s) && /자신|방어막|강화/.test(s));
  const isAoe = !isSelfBuff && /광역|전체|모두/.test(s);
  const isFixedBearer = !isAoe && !isSelfBuff && /➔\s*베어러/.test(s) && !/단일/.test(s);
  const isSingle = !isAoe && !isCharge && !isSelfBuff && (/단일/.test(s) || /베어러/.test(s) || /동료/.test(s));
  return { isCharge, isSelfBuff, isAoe, isFixedBearer, isSingle };
}

/* 스마트 AI: 적들의 단일 공격 타겟(bearer vs comp)을 룰북 규칙 및 AI 성향에 맞춰 자동 배정 */
function assignSmartTargetsAndIntents(randomizePattern = false) {
  const modeEl = document.getElementById('gm-ai-mode-select');
  const aiMode = modeEl ? modeEl.value : 'balanced';
  const living = activeEnemies.filter(e => e.hp > 0);
  if (living.length === 0) {
    renderEnemyCards();
    updateIntentPreview();
    saveGmSession();
    return;
  }

  // 동료가 탈진했거나 부활 당해 라운드 재정비 중이면 단일 공격은 무조건 베어러로 고정
  const compUnavailable = Boolean(
    connectedPlayerParty &&
    (connectedPlayerParty.compHp <= 0 || connectedPlayerParty.compRevivedThisRound)
  );
  const hasAttentionFocus = Boolean(connectedPlayerParty && connectedPlayerParty.hasAttentionFocus);

  if (randomizePattern) {
    pushGmUndoSnapshot('스마트 인텐트 재배정');
    living.forEach((e, idx) => {
      const list = (e.isPhase2 && e.intentsP2 && e.intentsP2.length > 0) ? e.intentsP2 : e.intentsP1;
      if (aiMode === 'random') {
        e.turnIdx = Math.floor(Math.random() * list.length);
      } else {
        e.turnIdx = (e.turnIdx + idx) % list.length;
      }
    });
  }

  // 1차 타겟 배정
  let bearerTargetCount = 0;
  living.forEach((e, idx) => {
    const list = (e.isPhase2 && e.intentsP2 && e.intentsP2.length > 0) ? e.intentsP2 : e.intentsP1;
    const rawIntent = list[e.turnIdx] || list[0] || '';
    const meta = classifyRawIntent(rawIntent);

    if (meta.isAoe) {
      e.resolvedTarget = 'aoe';
      bearerTargetCount++;
      return;
    }
    if (meta.isCharge || meta.isSelfBuff) {
      e.resolvedTarget = 'self';
      return;
    }

    // 도발 상태가 있으면 최우선 준수
    if (e.tauntedBy === 'bearer') {
      e.resolvedTarget = 'bearer';
      bearerTargetCount++;
      return;
    }
    if (e.tauntedBy === 'comp' && !compUnavailable) {
      e.resolvedTarget = 'comp';
      return;
    }

    if (compUnavailable) {
      e.resolvedTarget = 'bearer';
      bearerTargetCount++;
      return;
    }

    // 원문에 이미 '➔ 베어러'로 고정된 패턴인 경우 (단, 균형/무작위에서도 원문 존중하되 필요 시 토글 가능)
    if (meta.isFixedBearer && aiMode !== 'random') {
      e.resolvedTarget = 'bearer';
      bearerTargetCount++;
      return;
    }

    if (aiMode === 'weakness' && connectedPlayerParty) {
      const bScore = (connectedPlayerParty.hp || 10) + (connectedPlayerParty.shield || 0) + (connectedPlayerParty.ac || 11);
      const cScore = (connectedPlayerParty.compHp || 10) + (connectedPlayerParty.compShield || 0) + (connectedPlayerParty.compAc || 11);
      e.resolvedTarget = (cScore < bScore) ? 'comp' : 'bearer';
    } else if (aiMode === 'random') {
      e.resolvedTarget = (Math.random() < 0.55) ? 'bearer' : 'comp';
    } else {
      // 균형 배분(balanced): 홀짝 교차 배분하여 전술 퍼즐 유도
      e.resolvedTarget = (idx % 2 === 0) ? 'bearer' : 'comp';
    }

    if (e.resolvedTarget === 'bearer') bearerTargetCount++;
  });

  // 룰북 v2.24 파이터 4Lv 패시브 [주의 집중]: 최소 2개 인텐트가 반드시 베어러를 포함하도록 강제!
  if (hasAttentionFocus && bearerTargetCount < 2) {
    for (const e of living) {
      if (bearerTargetCount >= 2) break;
      if (e.resolvedTarget === 'comp' && e.tauntedBy !== 'comp') {
        e.resolvedTarget = 'bearer';
        bearerTargetCount++;
      }
    }
  }

  renderEnemyCards();
  updateIntentPreview();
  saveGmSession();
  if (randomizePattern) {
    showToast(`🧠 스마트 전술 AI(${aiMode === 'balanced' ? '균형 배분' : (aiMode === 'weakness' ? '약자 집중' : '무작위')})가 인텐트와 타겟을 배정했습니다!`);
  }
}

/* 특정 적의 단일 공격 타겟을 베어러 ⇄ 동료로 1클릭 수동 전환 */
function toggleEnemySingleTarget(uid) {
  const e = activeEnemies.find(item => item.uid === uid);
  if (!e || e.hp <= 0) return;
  e.tauntedBy = null;
  e.confusedToUid = null;
  e.confusedToName = null;
  e.resolvedTarget = (e.resolvedTarget === 'comp') ? 'bearer' : 'comp';
  renderEnemyCards();
  updateIntentPreview();
  saveGmSession();
}

/* 인텐트 문자열을 실제 확정된 타겟 이름(베어러 실명 / 동료 실명 / 환체교란 적) 및 공격력 증감에 맞춰 변환 */
function formatResolvedIntent(e) {
  const list = (e.isPhase2 && e.intentsP2 && e.intentsP2.length > 0) ? e.intentsP2 : e.intentsP1;
  let text = list[e.turnIdx] || list[0] || '';
  const bName = connectedPlayerParty?.bearerName ? `베어러(${connectedPlayerParty.bearerName})` : '베어러';
  const cName = connectedPlayerParty?.compName ? `동료(${connectedPlayerParty.compName})` : '동료';

  if (e.confusedToUid && e.confusedToName) {
    if (/➔/.test(text)) {
      text = text.replace(/➔\s*(아군 전체|파티 전체|모든 아군|단일 아군 1체|베어러(?:\([^)]*\))?(?:\s*·\s*단일)?|동료(?:\([^)]*\))?(?:\s*·\s*단일)?|단일)/, `➔ [🎭환체 교란: 🎯${e.confusedToName}] `);
    } else {
      text += ` ➔ [🎭환체 교란: 🎯${e.confusedToName}]`;
    }
  } else if (e.resolvedTarget === 'bearer' || e.tauntedBy === 'bearer') {
    if (/단일 아군 1체/.test(text)) text = text.replace('단일 아군 1체', bName);
    else if (/➔\s*단일/.test(text)) text = text.replace(/➔\s*단일/, `➔ ${bName} · 단일`);
    else if (/➔\s*베어러/.test(text)) text = text.replace(/➔\s*베어러/, `➔ ${bName}`);
  } else if (e.resolvedTarget === 'comp' || e.tauntedBy === 'comp') {
    if (/단일 아군 1체/.test(text)) text = text.replace('단일 아군 1체', cName);
    else if (/➔\s*베어러/.test(text)) text = text.replace(/➔\s*베어러/, `➔ ${cName}`);
    else if (/➔\s*단일/.test(text)) text = text.replace(/➔\s*단일/, `➔ ${cName} · 단일`);
  }

  const modTags = [];
  if (e.dmgReduction && e.dmgReduction > 0) modTags.push(`피격 피해 -${e.dmgReduction} 경감`);
  if (e.atkMod && e.atkMod !== 0) modTags.push(`공격력 ${e.atkMod > 0 ? '+' + e.atkMod : e.atkMod}`);
  if (e.forceDis) modTags.push('명중 [불리함] 강제');
  if (e.nextAdv) modTags.push('명중 [유리함]');
  if (e.tauntedBy) modTags.push(`${e.tauntedBy === 'bearer' ? bName : cName} 도발됨`);
  if (modTags.length > 0) {
    text += ` [${modTags.join(' · ')}]`;
  }
  return text;
}

function addEnemySlot(presetKey = 'lizard') {
  enemyCounter++;
  const preset = PRESETS[presetKey] || PRESETS.minion_infantry;
  const samePresetCount = activeEnemies.filter(e => e.baseKey === presetKey && e.hp > 0).length;

  const newEnemy = {
    uid: 'enemy_' + Date.now() + '_' + enemyCounter,
    baseKey: presetKey,
    baseName: preset.name,
    letterTag: '',
    name: preset.name,
    grade: preset.grade,
    maxHp: preset.maxHp,
    hp: preset.maxHp,
    shield: 0,
    ac: preset.ac,
    p2Ac: preset.p2Ac || (presetKey === 'boss_1' ? 13 : 14),
    awakenAtRoundEnd: Boolean(preset.awakenAtRoundEnd),
    bindDmgP1: preset.bindDmgP1 || 3,
    bindDmgP2: preset.bindDmgP2 || preset.bindDmgP1 || 3,
    intentsP1: [...preset.intentsP1],
    intentsP2: preset.intentsP2 ? [...preset.intentsP2] : [],
    p2Title: preset.p2Title || '',
    p2Desc: preset.p2Desc || '',
    turnIdx: samePresetCount % Math.max(1, preset.intentsP1.length),
    isPhase2: false,
    justAwakened: false,
    resolvedTarget: (samePresetCount % 2 === 0) ? 'bearer' : 'comp',
    atkMod: 0,
    forceDis: false,
    nextAdv: false,
    tauntedBy: null,
    confusedToUid: null,
    confusedToName: null,
    status: {
      weak: false,
      weakCharges: 0,
      bindTurns: 0,
      dots: []
    }
  };

  activeEnemies.push(newEnemy);
  updateEnemyTags();
  assignSmartTargetsAndIntents(false);
}

function removeEnemySlot(uid) {
  const target = activeEnemies.find(e => e.uid === uid);
  const removedName = target ? target.name : '에너미';
  pushGmUndoSnapshot(`${removedName} 삭제`);
  activeEnemies = activeEnemies.filter(e => e.uid !== uid);
  updateEnemyTags();
  assignSmartTargetsAndIntents(false);
  showToast(`🗑️ [${removedName}] 슬롯이 삭제되었습니다.`);
}

function changeEnemyPreset(uid, newKey) {
  const enemy = activeEnemies.find(e => e.uid === uid);
  const p = PRESETS[newKey];
  if (!enemy || !p) return;

  enemy.baseKey = newKey;
  enemy.baseName = p.name;
  enemy.letterTag = '';
  enemy.name = p.name;
  enemy.grade = p.grade;
  enemy.maxHp = p.maxHp;
  enemy.hp = p.maxHp;
  enemy.shield = 0;
  enemy.ac = p.ac;
  enemy.p2Ac = p.p2Ac || (newKey === 'boss_1' ? 13 : 14);
  enemy.awakenAtRoundEnd = Boolean(p.awakenAtRoundEnd);
  enemy.bindDmgP1 = p.bindDmgP1 || 3;
  enemy.bindDmgP2 = p.bindDmgP2 || p.bindDmgP1 || 3;
  enemy.pendingPhase2Awaken = false;
  enemy.intentsP1 = [...p.intentsP1];
  enemy.intentsP2 = p.intentsP2 ? [...p.intentsP2] : [];
  enemy.p2Title = p.p2Title || '';
  enemy.p2Desc = p.p2Desc || '';
  enemy.turnIdx = 0;
  enemy.isPhase2 = false;
  enemy.justAwakened = false;
  enemy.atkMod = 0;
  enemy.forceDis = false;
  enemy.nextAdv = false;
  enemy.tauntedBy = null;
  enemy.confusedToUid = null;
  enemy.confusedToName = null;
  enemy.status = { weak: false, weakCharges: 0, bindTurns: 0, dots: [] };

  updateEnemyTags();
  assignSmartTargetsAndIntents(false);
}

/* 수동 체력 증감 (단일 대미지 디스패처로 통합) */
function adjHp(uid, delta) {
  const e = activeEnemies.find(item => item.uid === uid);
  if (!e) return;
  pushGmUndoSnapshot(`${e.name} HP 수동 조절`);

  if (delta < 0) {
    applyDamage(e, -delta, false);
  } else if (delta > 0) {
    e.hp = Math.min(e.maxHp, e.hp + delta);
  }

  renderEnemyCards();
  updateIntentPreview();
  saveGmSession();
}

function adjShield(uid, delta) {
  const e = activeEnemies.find(item => item.uid === uid);
  if (!e) return;
  e.shield = Math.max(0, (e.shield || 0) + delta);
  renderEnemyCards();
  updateIntentPreview();
  saveGmSession();
}

function setShield(uid, val) {
  const e = activeEnemies.find(item => item.uid === uid);
  if (!e) return;
  e.shield = Math.max(0, val);
  renderEnemyCards();
  updateIntentPreview();
  saveGmSession();
}

function openPhase2ModalByUid(uid) {
  const enemy = activeEnemies.find(e => e.uid === uid);
  if (!enemy || !enemy.p2Desc) return;
  pendingPhase2Enemy = enemy;
  document.getElementById('phase2-title').innerText = `${enemy.name} : ${enemy.p2Title || '2페이즈 각성'}`;
  document.getElementById('phase2-desc').innerText = enemy.p2Desc;
  document.getElementById('phase2-modal').classList.add('active');
}

function closePhase2Modal() {
  document.getElementById('phase2-modal').classList.remove('active');
  renderEnemyCards();
  updateIntentPreview();
  saveGmSession();
}

function copyPhase2Script() {
  if (!pendingPhase2Enemy) return;
  const txt = `【 2페이즈 각성 : ${pendingPhase2Enemy.name} 】\n"${pendingPhase2Enemy.p2Desc}"`;
  copyToClipboard(txt, () => {
    showToast("📜 각성 낭독문이 클립보드에 복사되었습니다!");
  }, () => {
    showToast("⚠️ 복사 실패: 브라우저 권한을 확인해주세요.");
  });
}

function toggleWeak(uid) {
  const e = activeEnemies.find(item => item.uid === uid);
  if (!e) return;
  e.status.weak = !e.status.weak;
  e.status.weakCharges = e.status.weak ? (connectedPlayerParty?.hasFirmBind ? 2 : 1) : 0;
  renderEnemyCards();
  updateIntentPreview();
  saveGmSession();
}

function adjBindTurns(uid, delta) {
  const e = activeEnemies.find(item => item.uid === uid);
  if (!e) return;
  e.status.bindTurns = Math.max(0, e.status.bindTurns + delta);
  renderEnemyCards();
  updateIntentPreview();
  saveGmSession();
}

function addDotToEnemy(uid, defaultDmg = 3, defaultTurns = 2) {
  const e = activeEnemies.find(item => item.uid === uid);
  if (!e) return;
  e.status.dots.push({
    id: 'dot_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    dmg: defaultDmg,
    turns: defaultTurns
  });
  renderEnemyCards();
  updateIntentPreview();
  saveGmSession();
}

function removeDotFromEnemy(uid, dotId) {
  const e = activeEnemies.find(item => item.uid === uid);
  if (!e) return;
  e.status.dots = e.status.dots.filter(d => d.id !== dotId);
  renderEnemyCards();
  updateIntentPreview();
  saveGmSession();
}

function adjSingleDotTurns(uid, dotId, delta) {
  const e = activeEnemies.find(item => item.uid === uid);
  if (!e) return;
  const dot = e.status.dots.find(d => d.id === dotId);
  if (!dot) return;
  dot.turns = Math.max(0, dot.turns + delta);
  if (dot.turns === 0) {
    e.status.dots = e.status.dots.filter(d => d.id !== dotId);
  }
  renderEnemyCards();
  updateIntentPreview();
  saveGmSession();
}

function changeSingleDotDmg(uid, dotId, newDmg) {
  const e = activeEnemies.find(item => item.uid === uid);
  if (!e) return;
  const dot = e.status.dots.find(d => d.id === dotId);
  if (dot) dot.dmg = newDmg;
  renderEnemyCards();
  updateIntentPreview();
  saveGmSession();
}

function extendAllDots(uid) {
  const e = activeEnemies.find(item => item.uid === uid);
  if (!e || e.status.dots.length === 0) return;
  e.status.dots.forEach(d => d.turns++);
  showToast(`🩸 ${e.name}: 모든 지속 피해 잔여 라운드 +1R 일괄 연장`);
  renderEnemyCards();
  updateIntentPreview();
  saveGmSession();
}

/* [신규] 상태이상 줄 우측 [+] 버튼: 디폴트로 [행동 제약: 1R] 추가 및 드롭박스 제어 */
function addDefaultEnemyStatus(uid) {
  const e = activeEnemies.find(item => item.uid === uid);
  if (!e) return;
  if (!e.status.bindTurns || e.status.bindTurns <= 0) {
    e.status.bindTurns = 1;
  } else {
    if (!Array.isArray(e.status.extraChips)) e.status.extraChips = [];
    e.status.extraChips.push({
      id: 'echip_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      type: 'bind',
      turns: 1
    });
  }
  renderEnemyCards();
  updateIntentPreview();
  saveGmSession();
}

function getEnemyStatusChipList(e) {
  const chips = [];
  if (!e || !e.status) return chips;
  if (e.status.bindTurns > 0) {
    chips.push({ key: 'bind', type: 'bind', turns: e.status.bindTurns });
  }
  if (e.status.weak) {
    chips.push({ key: 'weak', type: 'weak', turns: e.status.weakCharges || 1 });
  }
  if (Array.isArray(e.status.dots)) {
    e.status.dots.forEach(d => {
      const dmgVal = Math.min(4, Math.max(1, Number(d.dmg) || 2));
      chips.push({ key: 'dot:' + d.id, type: 'dot_' + dmgVal, turns: d.turns || 1, dotId: d.id, dmg: dmgVal });
    });
  }
  if (e.atkMod && e.atkMod < 0) {
    const absMod = Math.min(3, Math.max(1, Math.abs(e.atkMod)));
    chips.push({ key: 'atk', type: 'atk_-' + absMod, turns: e.atkModTurns || 1, rawAtkMod: e.atkMod });
  }
  if (e.forceDis) {
    chips.push({ key: 'dis', type: 'dis', turns: e.forceDisTurns || 1 });
  }
  if (Array.isArray(e.status.extraChips)) {
    e.status.extraChips.forEach(ec => {
      chips.push({ key: 'extra:' + ec.id, type: ec.type || 'bind', turns: ec.turns || 1, extraId: ec.id });
    });
  }
  return chips;
}

function removeEnemyStatusChipByKey(e, chipKey) {
  if (!e || !e.status) return 1;
  let prevTurns = 1;
  if (chipKey === 'bind') {
    prevTurns = e.status.bindTurns || 1;
    e.status.bindTurns = 0;
  } else if (chipKey === 'weak') {
    prevTurns = e.status.weakCharges || 1;
    e.status.weak = false;
    e.status.weakCharges = 0;
  } else if (chipKey.startsWith('dot:')) {
    const dotId = chipKey.slice(4);
    const found = (e.status.dots || []).find(d => d.id === dotId);
    if (found) prevTurns = found.turns || 1;
    e.status.dots = (e.status.dots || []).filter(d => d.id !== dotId);
  } else if (chipKey === 'atk') {
    prevTurns = e.atkModTurns || 1;
    e.atkMod = 0;
    e.atkModTurns = 0;
  } else if (chipKey === 'dis') {
    prevTurns = e.forceDisTurns || 1;
    e.forceDis = false;
    e.forceDisTurns = 0;
  } else if (chipKey.startsWith('extra:')) {
    const extraId = chipKey.slice(6);
    const found = (e.status.extraChips || []).find(c => c.id === extraId);
    if (found) prevTurns = found.turns || 1;
    e.status.extraChips = (e.status.extraChips || []).filter(c => c.id !== extraId);
  }
  return Math.max(1, prevTurns);
}

function changeEnemyStatusType(uid, chipKey, newType) {
  const e = activeEnemies.find(item => item.uid === uid);
  if (!e) return;

  if (chipKey.startsWith('dot:') && newType.startsWith('dot_')) {
    const dotId = chipKey.slice(4);
    const dot = (e.status.dots || []).find(d => d.id === dotId);
    if (dot) {
      dot.dmg = parseInt(newType.split('_')[1], 10) || 2;
      renderEnemyCards();
      updateIntentPreview();
      saveGmSession();
      return;
    }
  }

  const turns = removeEnemyStatusChipByKey(e, chipKey);

  if (newType === 'bind') {
    e.status.bindTurns = Math.max(e.status.bindTurns || 0, turns);
  } else if (newType === 'weak') {
    e.status.weak = true;
    e.status.weakCharges = turns;
  } else if (newType.startsWith('dot_')) {
    const dmg = parseInt(newType.split('_')[1], 10) || 2;
    e.status.dots.push({
      id: 'dot_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      dmg: dmg,
      turns: turns
    });
  } else if (newType.startsWith('atk_-')) {
    const modVal = -parseInt(newType.split('_-')[1], 10) || -1;
    e.atkMod = modVal;
    e.atkModTurns = turns;
  } else if (newType === 'dis') {
    e.forceDis = true;
    e.forceDisTurns = turns;
  }

  renderEnemyCards();
  updateIntentPreview();
  saveGmSession();
}

function changeEnemyStatusTurns(uid, chipKey, newTurns) {
  const e = activeEnemies.find(item => item.uid === uid);
  if (!e) return;
  const t = Math.max(1, parseInt(newTurns, 10) || 1);

  if (chipKey === 'bind') {
    e.status.bindTurns = t;
  } else if (chipKey === 'weak') {
    e.status.weak = true;
    e.status.weakCharges = t;
  } else if (chipKey.startsWith('dot:')) {
    const dotId = chipKey.slice(4);
    const dot = (e.status.dots || []).find(d => d.id === dotId);
    if (dot) dot.turns = t;
  } else if (chipKey === 'atk') {
    e.atkModTurns = t;
  } else if (chipKey === 'dis') {
    e.forceDisTurns = t;
  } else if (chipKey.startsWith('extra:')) {
    const extraId = chipKey.slice(6);
    const found = (e.status.extraChips || []).find(c => c.id === extraId);
    if (found) found.turns = t;
  }

  renderEnemyCards();
  updateIntentPreview();
  saveGmSession();
}

function removeEnemyStatusChip(uid, chipKey) {
  const e = activeEnemies.find(item => item.uid === uid);
  if (!e) return;
  removeEnemyStatusChipByKey(e, chipKey);
  renderEnemyCards();
  updateIntentPreview();
  saveGmSession();
}

/* =========================================================================
   [수술 4단계] 플레이어 타격 패킷 실시간 수신 & 자동 정산 (onReceivePlayerActionPacket)
   ========================================================================= */
function onReceivePlayerActionPacket(packet) {
  if (!packet || !Array.isArray(packet.effects) || packet.effects.length === 0) return;
  if (packet.party) {
    connectedPlayerParty = packet.party;
    renderGmSyncMonitorUI();
  }

  pushGmUndoSnapshot(`${packet.actorSummary || '플레이어'} 턴 타격`);
  const logs = [];

  packet.effects.forEach(eff => {
    if (!eff) return;

    if (eff.kind === 'damage') {
      const en = activeEnemies.find(e => e.uid === eff.targetUid && e.hp > 0);
      if (en) {
        if (eff.consumedWeak && en.status.weak) {
          if ((en.status.weakCharges || 1) > 1) en.status.weakCharges--;
          else { en.status.weak = false; en.status.weakCharges = 0; }
        }
        applyDamage(en, Number(eff.dmg) || 0, Boolean(eff.ignoreShield));
        logs.push(`${en.name} -${eff.dmg}(${eff.label || '타격'})`);
      }
    } else if (eff.kind === 'aoe_damage') {
      activeEnemies.filter(e => e.hp > 0).forEach(en => {
        applyDamage(en, Number(eff.dmg) || 0, Boolean(eff.ignoreShield));
      });
      logs.push(`적 전체 -${eff.dmg}(${eff.label || '광역'})`);
    } else if (eff.kind === 'status') {
      const en = activeEnemies.find(e => e.uid === eff.targetUid && e.hp > 0);
      if (en) {
        if (eff.addWeakCharges) {
          en.status.weak = true;
          en.status.weakCharges = Math.max(en.status.weakCharges || 0, eff.addWeakCharges);
        }
        if (eff.addBindTurns) {
          en.status.bindTurns = Math.max(en.status.bindTurns || 0, eff.addBindTurns);
        }
        if (eff.atkModDelta) {
          en.atkMod = (en.atkMod || 0) + eff.atkModDelta;
          en.atkModTurns = Math.max(en.atkModTurns || 1, eff.atkModTurns || 1);
        }
        logs.push(`${en.name}: ${eff.label || '상태 부여'}`);
      }
    } else if (eff.kind === 'dot') {
      const en = activeEnemies.find(e => e.uid === eff.targetUid && e.hp > 0);
      if (en) {
        en.status.dots.push({
          id: 'dot_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
          dmg: Number(eff.dotDmg) || 2,
          turns: Number(eff.dotTurns) || 2
        });
        logs.push(`${en.name}: [DoT ${eff.dotDmg}딜(${eff.dotTurns}T)]`);
      }
    } else if (eff.kind === 'extend_dots') {
      const en = activeEnemies.find(e => e.uid === eff.targetUid && e.hp > 0);
      if (en && en.status.dots.length > 0) {
        en.status.dots.forEach(d => { d.turns += (Number(eff.addTurns) || 1); });
        logs.push(`${en.name}: 모든 DoT +1T 연장`);
      }
    } else if (eff.kind === 'aoe_extend_dots') {
      activeEnemies.filter(e => e.hp > 0).forEach(en => {
        en.status.dots.forEach(d => { d.turns += (Number(eff.addTurns) || 1); });
      });
      logs.push(`적 전체 DoT +1T 연장`);
    } else if (eff.kind === 'detonate_dots') {
      const en = activeEnemies.find(e => e.uid === eff.targetUid && e.hp > 0);
      if (en) {
        en.status.dots = [];
        applyDamage(en, Number(eff.dmg) || 0, true);
        logs.push(`${en.name}: 빛의 파동 DoT 기폭(-${eff.dmg})`);
      }
    } else if (eff.kind === 'plague_spread') {
      const en = activeEnemies.find(e => e.uid === eff.targetUid && e.hp > 0);
      if (en) {
        en.status.dots.forEach(d => { d.turns += 1; });
        en.status.dots.push({
          id: 'dot_' + Date.now() + '_plague',
          dmg: 3,
          turns: 2
        });
        const copyDots = en.status.dots.map(d => ({ dmg: d.dmg, turns: d.turns }));
        activeEnemies.filter(o => o.hp > 0 && o.uid !== en.uid).forEach(other => {
          copyDots.forEach((cd, cIdx) => {
            other.status.dots.push({
              id: 'dot_spread_' + Date.now() + '_' + cIdx + '_' + Math.random().toString(36).slice(2, 5),
              dmg: cd.dmg,
              turns: cd.turns
            });
          });
        });
        logs.push(`${en.name}: 전염되는 사독 발동(전체 전염!)`);
      }
    } else if (eff.kind === 'debuff') {
      const en = activeEnemies.find(e => e.uid === eff.targetUid && e.hp > 0);
      if (en) {
        if (eff.atkModDelta) {
          en.atkMod = (en.atkMod || 0) + eff.atkModDelta;
          en.atkModTurns = Math.max(en.atkModTurns || 1, eff.atkModTurns || 1);
        }
        if (eff.forceDis) {
          en.forceDis = true;
          en.forceDisTurns = Math.max(en.forceDisTurns || 1, eff.forceDisTurns || 1);
        }
        logs.push(`${en.name}: ${eff.label || '약화'}`);
      }
    } else if (eff.kind === 'aoe_debuff') {
      activeEnemies.filter(e => e.hp > 0).forEach(en => {
        if (eff.atkModDelta) {
          en.atkMod = (en.atkMod || 0) + eff.atkModDelta;
          en.atkModTurns = Math.max(en.atkModTurns || 1, eff.atkModTurns || 1);
        }
        if (eff.forceDis) {
          en.forceDis = true;
          en.forceDisTurns = Math.max(en.forceDisTurns || 1, eff.forceDisTurns || 1);
        }
      });
      logs.push(`${eff.label || '적 전체 약화'}`);
    } else if (eff.kind === 'taunt') {
      const en = activeEnemies.find(e => e.uid === eff.targetUid && e.hp > 0);
      if (en) {
        en.tauntedBy = eff.tauntedBy;
        en.resolvedTarget = eff.tauntedBy;
        logs.push(`${en.name}: ${eff.label || '도발됨'}`);
      }
    } else if (eff.kind === 'aoe_taunt') {
      activeEnemies.filter(e => e.hp > 0).forEach(en => {
        en.tauntedBy = eff.tauntedBy;
        if (en.resolvedTarget === 'bearer' || en.resolvedTarget === 'comp') {
          en.resolvedTarget = eff.tauntedBy;
        }
        if (eff.atkModDelta) en.atkMod = (en.atkMod || 0) + eff.atkModDelta;
        if (eff.forceDis) en.forceDis = true;
      });
      logs.push(`${eff.label || '전체 도발 적용'}`);
    } else if (eff.kind === 'confuse') {
      const en = activeEnemies.find(e => e.uid === eff.targetUid && e.hp > 0);
      if (en) {
        en.confusedToUid = eff.redirectToUid;
        en.confusedToName = eff.redirectToName;
        logs.push(`${en.name}: 환체 교란 ➔ ${eff.redirectToName}`);
      }
    } else if (eff.kind === 'vent_dis') {
      const firstSingle = activeEnemies.find(e => {
        if (e.hp <= 0) return false;
        const list = (e.isPhase2 && e.intentsP2 && e.intentsP2.length > 0) ? e.intentsP2 : e.intentsP1;
        const meta = classifyRawIntent(list[e.turnIdx] || list[0] || '');
        return !meta.isAoe && !meta.isCharge && !meta.isSelfBuff;
      });
      if (firstSingle) {
        firstSingle.forceDis = true;
        logs.push(`${firstSingle.name}: 강제 벤트 [명중 불리함]`);
      }
    }
  });

  renderEnemyCards();
  updateIntentPreview();
  saveGmSession();

  if (logs.length > 0) {
    showToast(`💥 [플레이어 타격 자동 반영] ${logs.join(' | ')}`);
    gmLog(`💥 <b>[${packet.actorSummary || '플레이어'} 턴 타격]</b> ${logs.join(' | ')}`, 'player');
  }
}
window.onReceivePlayerActionPacket = onReceivePlayerActionPacket;

/* =========================================================================
   [수술 4단계] 마스터 ➔ 플레이어 적 인텐트 공격 실행 엔진 (executeEnemyAttack)
   ========================================================================= */
function executeEnemyAttack(uid) {
  const e = activeEnemies.find(item => item.uid === uid);
  if (!e || e.hp <= 0) return;

  pushGmUndoSnapshot(`${e.name} 행동 실행`);

  const list = (e.isPhase2 && e.intentsP2 && e.intentsP2.length > 0) ? e.intentsP2 : e.intentsP1;
  let rawIntent = list[e.turnIdx] || list[0] || '';
  if (e.status.bindTurns > 0) {
    const bindDmg = e.isPhase2
      ? (e.bindDmgP2 || (e.baseKey === 'boss_1' ? 6 : 3))
      : (e.bindDmgP1 || ((e.baseKey === 'boss_1' || e.baseKey === 'elite_snake') ? 4 : 3));
    rawIntent = `[행동 제약 기본공격] ➔ ${e.resolvedTarget === 'comp' ? '동료' : '베어러'} (고정 ${bindDmg} 피해)`;
  }

  const skMatch = rawIntent.match(/\[([^\]]+)\]/);
  const skillName = skMatch ? skMatch[1] : '기본 공격';
  const meta = classifyRawIntent(rawIntent);

  // 1) 충전 턴인 경우
  if (meta.isCharge && e.status.bindTurns === 0) {
    showToast(`🔋 [${e.name}] '${skillName}' 충전 중! 다음 라운드 강력한 일격을 예고합니다.`);
    gmLog(`🔋 <b>[${e.name} 충전]</b> '${skillName}' 집중! 다음 턴 강공격 예고`, 'enemy');
    return;
  }

  // 2) 자신 또는 아군 방어막([성벽 요새화]) / 자가 강화 턴인 경우
  if (meta.isSelfBuff && e.status.bindTurns === 0) {
    const shMatch = rawIntent.match(/방어막\s*(\d+)/);
    let shieldTargetEnemy = e;
    if (shMatch) {
      const shAmt = parseInt(shMatch[1], 10) || 6;
      if (/아군\s*1체/.test(rawIntent)) {
        const otherAllies = activeEnemies.filter(o => o.hp > 0 && o.uid !== e.uid);
        if (otherAllies.length > 0) {
          otherAllies.sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp));
          shieldTargetEnemy = otherAllies[0];
        }
      }
      shieldTargetEnemy.shield = Math.max(shieldTargetEnemy.shield || 0, shAmt);
    }
    const redMatch = rawIntent.match(/피격\s*피해\s*(\d+)\s*경감/);
    if (redMatch) {
      e.dmgReduction = parseInt(redMatch[1], 10) || 0;
    }
    if (/유리함/.test(rawIntent)) {
      e.nextAdv = true;
    }
    renderEnemyCards();
    updateIntentPreview();
    saveGmSession();
    const buffDescParts = [];
    if (shMatch) {
      const targetLabel = (shieldTargetEnemy.uid !== e.uid) ? `${shieldTargetEnemy.name} 방어막 ${shieldTargetEnemy.shield}` : `방어막 ${e.shield}`;
      buffDescParts.push(targetLabel);
    }
    if (e.dmgReduction > 0) buffDescParts.push(`피격 -${e.dmgReduction} 경감`);
    if (e.nextAdv) buffDescParts.push('차턴 유리함');
    showToast(`🛡️ [${e.name}] '${skillName}' 실행 완료! (${buffDescParts.join(' · ') || '자신 강화'})`);
    gmLog(`🛡️ <b>[${e.name} 강화]</b> '${skillName}' (${buffDescParts.join(' · ') || '자신 강화'})`, 'enemy');
    return;
  }

  // 기본 피해량 추출
  let baseDmg = 4;
  const dmgMatch = rawIntent.match(/(\d+)\s*(?:광역\s*)?피해/);
  if (dmgMatch) baseDmg = parseInt(dmgMatch[1], 10);
  const finalEnemyDmg = Math.max(0, baseDmg + (e.atkMod || 0));

  // 부가 상태이상 추출
  const inflictWeak = /\[방어\s*약화\]/.test(rawIntent) && e.status.bindTurns === 0;
  const inflictBind = /\[행동\s*제약\]/.test(rawIntent) && e.status.bindTurns === 0;
  const inflictDis = /\[불리함\]/.test(rawIntent) && e.status.bindTurns === 0;
  let inflictDot = null;
  const dotMatch = rawIntent.match(/\[지속\s*피해\s*:\s*(\d+)\]\s*(\d+)?/);
  if (dotMatch && e.status.bindTurns === 0) {
    inflictDot = { dmg: parseInt(dotMatch[1], 10) || 2, turns: dotMatch[2] ? parseInt(dotMatch[2], 10) : 2 };
  }
  let forceHeat = 0;
  const heatMatch = rawIntent.match(/과열\s*\+(\d+)/);
  if (heatMatch && e.status.bindTurns === 0) {
    forceHeat = parseInt(heatMatch[1], 10) || 0;
  }

  // 3) 등지기 [환체 교란]에 걸린 적일 경우: 단일 공격은 지정된 적 1체, 광역 공격은 시전자 본인을 제외한 나머지 모든 생존 적을 판정 없이 즉시 타격!
  if (e.confusedToUid || e.confusedToName) {
    let targets = [];
    if (meta.isAoe && e.status.bindTurns === 0) {
      targets = activeEnemies.filter(o => o.hp > 0 && o.uid !== e.uid);
    } else {
      targets = activeEnemies.filter(o => o.hp > 0 && o.uid !== e.uid && (o.uid === e.confusedToUid || (e.confusedToName && o.name === e.confusedToName)));
      if (targets.length === 0) {
        const fallbackOther = activeEnemies.find(o => o.hp > 0 && o.uid !== e.uid);
        if (fallbackOther) targets = [fallbackOther];
      }
    }
    e.confusedToUid = null;
    e.confusedToName = null;
    if (targets.length > 0) {
      const hitNames = [];
      targets.forEach(otherEn => {
        let dmgToOther = finalEnemyDmg;
        if (otherEn.status && otherEn.status.weak) {
          dmgToOther += 3;
          if ((otherEn.status.weakCharges || 1) > 1) otherEn.status.weakCharges--;
          else { otherEn.status.weak = false; otherEn.status.weakCharges = 0; }
        }
        applyDamage(otherEn, dmgToOther, false);
        if (otherEn.hp > 0) {
          if (inflictWeak) { otherEn.status.weak = true; otherEn.status.weakCharges = Math.max(otherEn.status.weakCharges || 0, 1); }
          if (inflictBind) { otherEn.status.bindTurns = Math.max(otherEn.status.bindTurns || 0, 1); }
          if (inflictDis) { otherEn.forceDis = true; otherEn.forceDisTurns = Math.max(otherEn.forceDisTurns || 0, 1); }
          if (inflictDot) { otherEn.status.dots.push({ id: 'dot_conf_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5), dmg: inflictDot.dmg, turns: inflictDot.turns }); }
        }
        hitNames.push(`${otherEn.name}(-${dmgToOther}➔HP ${otherEn.hp})`);
      });
      renderEnemyCards();
      updateIntentPreview();
      saveGmSession();
      showToast(`🎭 [환체 교란 ${meta.isAoe ? '광역 ' : ''}적중!] ${e.name}의 [${skillName}] ➔ ${hitNames.join(', ')} 판정 없이 적중!`);
      gmLog(`🎭 <b>[환체 교란 ${meta.isAoe ? '광역 ' : ''}적중!]</b> ${e.name}의 [${skillName}] ➔ ${hitNames.join(', ')}`, 'enemy');
      return;
    }
  }

  // 4) 적 명중 주사위 1d20 굴림 (불리함 / 유리함 반영)
  const d1 = Math.floor(Math.random() * 20) + 1;
  const d2 = Math.floor(Math.random() * 20) + 1;
  let isAdv = Boolean(e.nextAdv);
  let isDis = Boolean(e.forceDis);
  if (isAdv && isDis) { isAdv = false; isDis = false; }
  e.nextAdv = false;

  const rawRoll = isAdv ? Math.max(d1, d2) : (isDis ? Math.min(d1, d2) : d1);
  const rollFormula = isAdv ? `2d20H(${d1},${d2})➔${rawRoll}` : (isDis ? `2d20L(${d1},${d2})➔${rawRoll}` : `1d20(${d1})`);

  const resBox = document.getElementById('dice-result-box');
  if (resBox) {
    resBox.innerHTML = `${e.name}: ${rollFormula}`;
  }

  // 5) 등지기 4Lv 패시브 [인식 저해]: 주사위 결과값 1~4 시 공격자 본인 자해 전환!
  const selfHit = Boolean(connectedPlayerParty && connectedPlayerParty.hasRecognitionInhibit && rawRoll <= 4);
  if (selfHit) {
    applyDamage(e, finalEnemyDmg, false);
    if (inflictWeak) { e.status.weak = true; e.status.weakCharges = 1; }
    if (inflictBind) { e.status.bindTurns = Math.max(e.status.bindTurns || 0, 1); }
    renderEnemyCards();
    updateIntentPreview();
    saveGmSession();
    showToast(`👁️ [인식 저해 자해 발동!] ${e.name}의 주사위가 ${rawRoll}(1~4)로 나와 자기 자신을 자해(-${finalEnemyDmg})했습니다!`);
    gmLog(`👁️ <b>[인식 저해 자해!]</b> ${e.name}의 주사위 ${rollFormula}(1~4) ➔ 자기 자신에게 <b>고정 ${finalEnemyDmg} 피해</b> 자해!`, 'enemy');
  }

  // 자신도 1 피해 입는 돌격 스킬 처리 (예: 징집 보병 [돌격])
  if (/자신도\s*(\d+)\s*피해/.test(rawIntent)) {
    const selfRecoil = parseInt(rawIntent.match(/자신도\s*(\d+)\s*피해/)[1], 10) || 1;
    applyDamage(e, selfRecoil, false);
  }

  const targetType = (meta.isAoe && e.status.bindTurns === 0) ? 'aoe' : (e.resolvedTarget === 'comp' ? 'comp' : 'bearer');

  const atkPacket = {
    type: 'GM_ATTACK_PACKET',
    msgId: 'gmatk_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    enemyUid: e.uid,
    enemyName: e.name,
    skillName: skillName,
    rawRoll: rawRoll,
    rollFormula: rollFormula,
    targetType: targetType,
    baseDmg: baseDmg,
    atkMod: e.atkMod || 0,
    selfHit: selfHit,
    inflictWeak: inflictWeak,
    inflictBind: inflictBind,
    inflictDis: inflictDis,
    inflictDot: inflictDot,
    forceHeat: forceHeat
  };

  sendPacketFromGm(atkPacket);
  renderEnemyCards();
  updateIntentPreview();
  saveGmSession();

  if (!selfHit) {
    const tKor = targetType === 'aoe' ? '아군 전체' : (targetType === 'comp' ? (connectedPlayerParty?.compName || '동료') : (connectedPlayerParty?.bearerName || '베어러'));
    showToast(`⚔️ [${e.name} ➔ ${tKor}] ${skillName} 굴림: ${rollFormula} (피해 ${finalEnemyDmg}) ➔ 대시보드로 전송됨!`);
    const effectBadges = [];
    if (inflictWeak) effectBadges.push('[방어 약화]');
    if (inflictBind) effectBadges.push('[행동 제약]');
    if (inflictDis) effectBadges.push('[명중 불리함]');
    if (inflictDot) effectBadges.push(`[DoT ${inflictDot.dmg}딜]`);
    if (forceHeat) effectBadges.push(`[과열 +${forceHeat}]`);
    const effStr = effectBadges.length > 0 ? ` + ${effectBadges.join(' ')}` : '';
    gmLog(`⚔️ <b>[${e.name} ➔ 🎯${tKor}]</b> [${skillName}] | 주사위: <b>${rollFormula}</b> (고정 ${finalEnemyDmg} 피해${effStr})`, 'enemy');
  }
}

function executeAllEnemyAttacks() {
  const living = activeEnemies.filter(e => e.hp > 0);
  if (living.length === 0) return;
  living.forEach((e, idx) => {
    setTimeout(() => {
      if (e.hp > 0) executeEnemyAttack(e.uid);
    }, idx * 1500);
  });
}

/* =========================================================================
   [코어 전술 엔진] 3. 라운드 종료 정산 엔진 (resolveRoundEnd)
   ========================================================================= */
let pendingConfusedRoundEndConfirmUntil = 0;

function resolveRoundEnd(forceConfirm = false) {
  const unexecutedConfused = activeEnemies.filter(e => e.hp > 0 && (e.confusedToUid || e.confusedToName));
  if (unexecutedConfused.length > 0 && !forceConfirm && Date.now() > pendingConfusedRoundEndConfirmUntil) {
    pendingConfusedRoundEndConfirmUntil = Date.now() + 4500;
    const names = unexecutedConfused.map(e => `${e.name}(➔${e.confusedToName || '교란 대상'})`).join(', ');
    showToast(`⚠️ [환체 교란 미실행 경고] ${names}의 교란 공격이 아직 실행되지 않았습니다! 먼저 [⚔️ 전체 공격 실행]을 누르거나, 그대로 종료하려면 4초 내 [⚡ 라운드 종료]를 한 번 더 누르세요.`);
    return;
  }
  pendingConfusedRoundEndConfirmUntil = 0;
  pushGmUndoSnapshot('라운드 종료 정산');
  let logMsgs = [];
  let roundTotalDotDmg = 0;

  activeEnemies.forEach(e => {
    if (e.hp > 0) {
      // 라운드 한정 디버프/도발/자가 피격경감 정산
      e.dmgReduction = 0;
      if (e.atkModTurns && e.atkModTurns > 1) {
        e.atkModTurns--;
      } else {
        e.atkMod = 0;
        e.atkModTurns = 0;
      }
      if (e.forceDisTurns && e.forceDisTurns > 1) {
        e.forceDisTurns--;
      } else {
        e.forceDis = false;
        e.forceDisTurns = 0;
      }
      e.tauntedBy = null;
      e.confusedToUid = null;
      e.confusedToName = null;

      // 1. 방어막 무시 지속 피해(DoT) 단일 디스패처 직격
      if (e.status.dots && e.status.dots.length > 0) {
        let totalDotDmg = 0;
        e.status.dots.forEach(d => {
          if (d.turns > 0) totalDotDmg += d.dmg;
        });

        if (totalDotDmg > 0) {
          roundTotalDotDmg += totalDotDmg;
          applyDamage(e, totalDotDmg, true);
          const dotDetails = e.status.dots.map(d => `${d.dmg}딜(${d.turns}T)`).join(' + ');
          logMsgs.push(`${e.name}: DoT [${dotDetails}] -${totalDotDmg} ➔ 잔여 HP ${e.hp}`);
        }

        if (e.hp > 0) {
          e.status.dots.forEach(d => d.turns--);
          e.status.dots = e.status.dots.filter(d => d.turns > 0);
        }
      }

      // 2. 생존 적 대상 후속 정산 및 라운드 종료 시점 보스 각성(작골의 데암베르트 등) 체크
      if (e.hp > 0) {
        if (e.status.bindTurns > 0) e.status.bindTurns--;
        if (Array.isArray(e.status.extraChips)) {
          e.status.extraChips.forEach(c => { c.turns = (c.turns || 1) - 1; });
          e.status.extraChips = e.status.extraChips.filter(c => c.turns > 0);
        }

        const isP1BossReady = (!e.isPhase2 && e.intentsP2 && e.intentsP2.length > 0 && e.hp <= Math.floor(e.maxHp / 2));
        if (isP1BossReady || e.pendingPhase2Awaken) {
          transitionPhase2(e);
          logMsgs.push(`${e.name}: 2페이즈 각성(AC ${e.ac})`);
        }

        if (e.justAwakened) {
          e.justAwakened = false;
        } else {
          const list = (e.isPhase2 && e.intentsP2 && e.intentsP2.length > 0) ? e.intentsP2 : e.intentsP1;
          e.turnIdx = (e.turnIdx + 1) % list.length;
        }
      }
    }
  });

  const diceBox = document.getElementById('dice-result-box');
  if (diceBox) diceBox.innerText = '대기';

  // 새 라운드 인텐트 & 스마트 타겟 자동 배정
  assignSmartTargetsAndIntents(false);

  // 연결된 플레이어 대시보드로 라운드 종료 신호 전송 (스킬 덱 잠금 해제 및 라운드 정산 동기화)
  sendPacketFromGm({
    type: 'GM_ROUND_END',
    msgId: 'gmre_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    totalDotDamage: roundTotalDotDmg
  });

  if (logMsgs.length > 0) {
    showToast("⏱️ 라운드 정산: " + logMsgs.join(" | "));
    gmLog(`⏱️ <b>[라운드 정산]</b> ${logMsgs.join(' | ')}`, 'round');
  } else {
    showToast("⏱️ 라운드 정산 완료: 다음 턴 인텐트 및 스마트 타겟이 자동 생성되었습니다.");
    gmLog(`⏱️ <b>[라운드 정산 완료]</b> 지속 피해 없음 · 다음 턴 인텐트 및 스마트 타겟 자동 갱신`, 'round');
  }
}

function endGmCombat() {
  pushGmUndoSnapshot('전투 종료');
  activeEnemies.forEach(e => {
    e.shield = 0;
    e.dmgReduction = 0;
    e.atkMod = 0;
    e.atkModTurns = 0;
    e.forceDis = false;
    e.forceDisTurns = 0;
    e.nextAdv = false;
    e.tauntedBy = null;
    e.confusedToUid = null;
    e.confusedToName = null;
    e.status = { weak: false, weakCharges: 0, bindTurns: 0, dots: [], extraChips: [] };
  });

  if (connectedPlayerParty) {
    connectedPlayerParty.heat = 0;
    connectedPlayerParty.shield = 0;
    connectedPlayerParty.compShield = 0;
    if (connectedPlayerParty.compHp <= 0) {
      connectedPlayerParty.compHp = Math.ceil((connectedPlayerParty.compMaxHp || 10) / 2);
    }
    connectedPlayerParty.bearerStatuses = (connectedPlayerParty.bearerStatuses || []).filter(s => s.type !== 'buff' && !s.name.includes('행동 제약'));
    connectedPlayerParty.compStatuses = (connectedPlayerParty.compStatuses || []).filter(s => s.type !== 'buff' && !s.name.includes('행동 제약'));
    connectedPlayerParty.communionFlame = 'none';
    connectedPlayerParty.communionActiveThisRound = 'none';
    renderGmSyncMonitorUI();
  }

  const diceBox = document.getElementById('dice-result-box');
  if (diceBox) diceBox.innerText = '대기';

  renderEnemyCards();
  updateIntentPreview();
  saveGmSession();

  sendPacketFromGm({
    type: 'GM_COMBAT_END',
    msgId: 'gmce_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6)
  });

  showToast("❄️ 전투 종료: 전장 상태이상·방어막이 초기화되고 플레이어 대시보드에 전투 종료 신호를 보냈습니다.");
  gmLog(`❄️ <b>[전투 종료]</b> 상태이상·방어막 초기화 & 대시보드 동기화 완료`, 'round');
}

function nextEnemyTurn(uid) {
  const e = activeEnemies.find(item => item.uid === uid);
  if (!e) return;
  const list = (e.isPhase2 && e.intentsP2 && e.intentsP2.length > 0) ? e.intentsP2 : e.intentsP1;
  e.turnIdx = (e.turnIdx + 1) % list.length;
  e.justAwakened = false;
  assignSmartTargetsAndIntents(false);
}

function prevEnemyTurn(uid) {
  const e = activeEnemies.find(item => item.uid === uid);
  if (!e) return;
  const list = (e.isPhase2 && e.intentsP2 && e.intentsP2.length > 0) ? e.intentsP2 : e.intentsP1;
  e.turnIdx = (e.turnIdx - 1 + list.length) % list.length;
  e.justAwakened = false;
  assignSmartTargetsAndIntents(false);
}

function advanceAllTurns() {
  let skippedAwakened = 0;
  activeEnemies.forEach(e => {
    if (e.hp > 0) {
      if (e.justAwakened) {
        e.justAwakened = false;
        skippedAwakened++;
      } else {
        const list = (e.isPhase2 && e.intentsP2 && e.intentsP2.length > 0) ? e.intentsP2 : e.intentsP1;
        e.turnIdx = (e.turnIdx + 1) % list.length;
      }
    }
  });
  assignSmartTargetsAndIntents(false);

  if (skippedAwakened > 0) {
    showToast("⏩ 인텐트 순환 (방금 각성한 보스의 1턴 패턴은 안전하게 보존되었습니다)");
  } else {
    showToast("⏩ 살아있는 모든 적의 인텐트 패턴과 스마트 타겟이 다음 턴으로 갱신되었습니다.");
  }
}

function renderEnemyCards() {
  const container = document.getElementById('enemy-cards-container');
  document.getElementById('enemy-count-label').innerText = `(${activeEnemies.length}체 활성)`;

  if (activeEnemies.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:36px; font-size:12px; color:#64748b;">아래 [＋ 에너미 추가] 버튼을 눌러 적을 추가하십시오.</div>`;
    return;
  }

  const bName = connectedPlayerParty?.bearerName ? `베어러(${connectedPlayerParty.bearerName})` : '베어러';
  const cName = connectedPlayerParty?.compName ? `동료(${connectedPlayerParty.compName})` : '동료';

  container.innerHTML = activeEnemies.map(e => {
    const isDead = e.hp <= 0;
    const hpPct = (e.hp / e.maxHp) * 100;
    const list = (e.isPhase2 && e.intentsP2 && e.intentsP2.length > 0) ? e.intentsP2 : e.intentsP1;
    const rawIntent = list[e.turnIdx] || list[0] || '';
    const meta = classifyRawIntent(rawIntent);
    const curIntent = formatResolvedIntent(e);
    const curShield = e.shield || 0;

    let targetChipHtml = '';
    if (!isDead) {
      if (e.confusedToUid && e.confusedToName) {
        targetChipHtml = `<span style="font-size:10.5px; background:#4a044e; border:1px solid #f472b6; color:#fbcfe8; padding:1px 6px; border-radius:4px; font-weight:900;">🎭 교란됨 ➔ 🎯${e.confusedToName}</span>`;
      } else if (meta.isAoe && e.status.bindTurns === 0) {
        targetChipHtml = `<span style="font-size:10.5px; background:#451a03; border:1px solid #f59e0b; color:#fde68a; padding:1px 6px; border-radius:4px; font-weight:900;">🌪️ 광역 (아군 전체)</span>`;
      } else if ((meta.isCharge || meta.isSelfBuff) && e.status.bindTurns === 0) {
        targetChipHtml = `<span style="font-size:10.5px; background:#1e293b; border:1px solid #64748b; color:#cbd5e1; padding:1px 6px; border-radius:4px; font-weight:900;">🔋 충전 / 자신 강화</span>`;
      } else {
        const isTargetingComp = (e.resolvedTarget === 'comp');
        targetChipHtml = `
          <button class="btn-action" style="${isTargetingComp ? 'background:#3b0764; border-color:#c084fc; color:#e9d5ff;' : 'background:#0c4a6e; border-color:#38bdf8; color:#bae6fd;'}" onclick="toggleEnemySingleTarget('${e.uid}')" title="클릭하여 단일 공격 목표(베어러 ⇄ 동료)를 전환합니다">
            🎯 조준: ${isTargetingComp ? cName : bName} ⇄
          </button>
        `;
      }
    }

    return `
      <div class="enemy-card ${isDead ? 'dead' : ''}">
        <!-- 1행 상단 헤더: 좌측 보스/에너미 선택 드롭다운 + 우측 빈칸(2페이즈 각성·낭독문·처치 배지) + 우상단 삭제 버튼 -->
        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
          <div style="display:flex; align-items:center; gap:6px; flex:1; min-width:0; flex-wrap:wrap;">
            <select class="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-amber-200 outline-none font-bold" style="width:calc(50% - 4px); min-width:190px;" onchange="changeEnemyPreset('${e.uid}', this.value)">
              <optgroup label="1장 시나리오 모듈">
                <option value="lizard" ${e.baseKey === 'lizard' ? 'selected' : ''}>일반: 바람 도마뱀</option>
                <option value="sludge" ${e.baseKey === 'sludge' ? 'selected' : ''}>일반: 오염된 진흙 하수체</option>
                <option value="elite_snake" ${e.baseKey === 'elite_snake' ? 'selected' : ''}>정예: 돌굳이 구렁이</option>
                <option value="elite_mutant" ${e.baseKey === 'elite_mutant' ? 'selected' : ''}>정예: 변종 침식 괴수</option>
              </optgroup>
              <optgroup label="아티스 제국군 표준 보병">
                <option value="minion_infantry" ${e.baseKey === 'minion_infantry' ? 'selected' : ''}>일반: 징집 보병</option>
                <option value="minion_shield" ${e.baseKey === 'minion_shield' ? 'selected' : ''}>일반: 방패병</option>
                <option value="minion_bomb" ${e.baseKey === 'minion_bomb' ? 'selected' : ''}>일반: 화약/분진병</option>
                <option value="minion_archer" ${e.baseKey === 'minion_archer' ? 'selected' : ''}>일반: 감시탑 사수</option>
                <option value="elite_1" ${e.baseKey === 'elite_1' ? 'selected' : ''}>정예: 돌격 집행관</option>
                <option value="elite_shield" ${e.baseKey === 'elite_shield' ? 'selected' : ''}>정예: 중장갑 방패장</option>
                <option value="elite_inquisitor" ${e.baseKey === 'elite_inquisitor' ? 'selected' : ''}>정예: 이단심문관</option>
                <option value="elite_sniper" ${e.baseKey === 'elite_sniper' ? 'selected' : ''}>정예: 정예 저격수</option>
              </optgroup>
              <optgroup label="공식 캠페인 권역 보스">
                <option value="boss_1" ${e.baseKey === 'boss_1' ? 'selected' : ''}>보스 1: 작골의 데암베르트</option>
                <option value="boss_2" ${e.baseKey === 'boss_2' ? 'selected' : ''}>보스 2: 위험한 정치가 앙게르</option>
                <option value="boss_3" ${e.baseKey === 'boss_3' ? 'selected' : ''}>보스 3: 저무는 메이지 휴</option>
                <option value="boss_4" ${e.baseKey === 'boss_4' ? 'selected' : ''}>최종 결전: 교황 레아 아티스도티르</option>
              </optgroup>
            </select>
            ${e.isPhase2 ? `
              <span style="font-size:10.5px; background:#450a0a; color:#fca5a5; border:1px solid #ef4444; padding:2px 7px; border-radius:5px; font-weight:900; white-space:nowrap;">2페이즈 각성</span>
              <button class="btn-action" style="padding:2px 8px; font-size:10.5px; background:#450a0a; border-color:#ef4444; color:#fecaca; white-space:nowrap;" onclick="openPhase2ModalByUid('${e.uid}')" title="각성 바디호러 낭독문 다시 열기">📜 낭독문</button>
            ` : ''}
            ${isDead ? `<span style="font-size:10.5px; background:#334155; color:#cbd5e1; padding:2px 7px; border-radius:5px; font-weight:900; white-space:nowrap;">💀 처치됨</span>` : ''}
          </div>
          <button class="btn-action" style="padding:2px 8px; font-size:11px; color:#f87171; flex-shrink:0; margin-left:auto;" onclick="removeEnemySlot('${e.uid}')">✕ 삭제</button>
        </div>

        <!-- 2행 좌우 분할: 좌측 보스 정보 상자(방어도·조준 1줄 깔끔 유지) / 우측 반토막 HP & 방어막 게이지 -->
        <div style="display:grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap:8px; align-items:stretch;">
          <!-- 좌측 상자: 방어도 및 조준 토글 1줄 고정 -->
          <div style="background:#090c14; border:1px solid #1e2638; border-radius:6px; padding:6px 10px; display:flex; align-items:center; gap:8px; flex-wrap:nowrap; overflow:hidden;">
            <span style="font-size:11.5px; color:#94a3b8; font-weight:800; white-space:nowrap;">방어도: <b class="text-amber-400">AC ${e.ac}</b></span>
            ${targetChipHtml}
          </div>

          <!-- 우측 영역: 반토막 낸 HP 게이지 & 방어막 게이지 (보스 이름 반복 문구 제거) -->
          <div style="display:flex; flex-direction:column; justify-content:center; gap:5px;">
            <!-- HP 게이지 + 우측 -1 / +1 버튼 -->
            <div style="display:flex; align-items:center; gap:6px;">
              <div style="position:relative; flex:1; min-width:0; height:20px; background:#080a10; border-radius:4px; overflow:hidden; border:1px solid #334155;">
                <div style="width:${hpPct}%; height:100%; background:linear-gradient(90deg, #991b1b, #ef4444); transition:width 0.15s;"></div>
                <div style="position:absolute; inset:0; display:flex; justify-content:center; align-items:center; font-size:10.5px; font-weight:900; color:#fff; text-shadow:0 1px 2px rgba(0,0,0,0.9);">
                  HP ${e.hp} / ${e.maxHp}
                </div>
              </div>
              <div style="display:flex; gap:3px; flex-shrink:0;">
                <button class="btn-action" style="padding:2px 8px; font-size:11px;" onclick="adjHp('${e.uid}', -1)">-1</button>
                <button class="btn-action" style="padding:2px 8px; font-size:11px;" onclick="adjHp('${e.uid}', 1)">+1</button>
              </div>
            </div>

            <!-- 방어막 게이지 + 우측 -1 / +1 버튼 -->
            <div style="display:flex; align-items:center; gap:6px;">
              <div style="position:relative; flex:1; min-width:0; height:20px; background:#080c14; border-radius:4px; overflow:hidden; border:1px solid #1e3a5f;">
                <div style="width:${Math.min(100, (curShield / 12) * 100)}%; height:100%; background:linear-gradient(90deg, #0369a1, #38bdf8); transition:width 0.15s;"></div>
                <div style="position:absolute; inset:0; display:flex; justify-content:center; align-items:center; font-size:10.5px; font-weight:900; color:${curShield > 0 ? '#f0f9ff' : '#94a3b8'}; text-shadow:0 1px 2px rgba(0,0,0,0.9);">
                  🛡️ 방어막: ${curShield}
                </div>
              </div>
              <div style="display:flex; gap:3px; flex-shrink:0;">
                <button class="btn-action" style="padding:2px 8px; font-size:11px;" onclick="adjShield('${e.uid}', -1)">-1</button>
                <button class="btn-action" style="padding:2px 8px; font-size:11px;" onclick="adjShield('${e.uid}', 1)">+1</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 3행: 상태이상 통합 줄 (방어막 아래 차곡차곡 표시 + 우측 끝 [+] 버튼으로 행동 제약: 1R 디폴트 드롭박스 생성) -->
        ${!isDead ? (() => {
          const statusChips = getEnemyStatusChipList(e);
          const chipItemsHtml = statusChips.map(ch => {
            let borderCol = '#3b4866';
            let bgCol = '#141926';
            let textCol = '#e2e8f0';
            if (ch.type === 'bind') { borderCol = '#ef4444'; bgCol = '#2a1215'; textCol = '#fca5a5'; }
            else if (ch.type === 'weak') { borderCol = '#f59e0b'; bgCol = '#2e1d09'; textCol = '#fde68a'; }
            else if (ch.type.startsWith('dot_')) { borderCol = '#ec4899'; bgCol = '#381228'; textCol = '#fbcfe8'; }
            else if (ch.type.startsWith('atk_-')) { borderCol = '#a855f7'; bgCol = '#261238'; textCol = '#e9d5ff'; }
            else if (ch.type === 'dis') { borderCol = '#38bdf8'; bgCol = '#0f2438'; textCol = '#bae6fd'; }

            return `
              <div style="display:inline-flex; align-items:center; gap:3px; background:${bgCol}; border:1px solid ${borderCol}; border-radius:5px; padding:2px 6px; font-size:10.5px; font-weight:800; color:${textCol};">
                <select class="bg-gray-950/90 border border-gray-700/80 rounded px-1 py-0.5 text-[10.5px] font-extrabold outline-none cursor-pointer" style="color:${textCol};" onchange="changeEnemyStatusType('${e.uid}', '${ch.key}', this.value)">
                  <option value="bind" ${ch.type === 'bind' ? 'selected' : ''}>⛓️ 행동 제약</option>
                  <option value="weak" ${ch.type === 'weak' ? 'selected' : ''}>⚠️ 방어 약화(+3)</option>
                  <option value="dot_1" ${ch.type === 'dot_1' ? 'selected' : ''}>🩸 지속 피해 1</option>
                  <option value="dot_2" ${ch.type === 'dot_2' ? 'selected' : ''}>🩸 지속 피해 2</option>
                  <option value="dot_3" ${ch.type === 'dot_3' ? 'selected' : ''}>🩸 지속 피해 3</option>
                  <option value="dot_4" ${ch.type === 'dot_4' ? 'selected' : ''}>🩸 지속 피해 4</option>
                  <option value="atk_-1" ${ch.type === 'atk_-1' ? 'selected' : ''}>📉 공격력 -1</option>
                  <option value="atk_-2" ${ch.type === 'atk_-2' ? 'selected' : ''}>📉 공격력 -2</option>
                  <option value="atk_-3" ${ch.type === 'atk_-3' ? 'selected' : ''}>📉 공격력 -3</option>
                  <option value="dis" ${ch.type === 'dis' ? 'selected' : ''}>🎲 명중 불리함</option>
                </select>
                <span>:</span>
                <select class="bg-gray-950/90 border border-gray-700/80 rounded px-1 py-0.5 text-[10.5px] font-extrabold text-white outline-none cursor-pointer" onchange="changeEnemyStatusTurns('${e.uid}', '${ch.key}', this.value)">
                  ${[1, 2, 3, 4, 5].map(rVal => `<option value="${rVal}" ${ch.turns === rVal ? 'selected' : ''}>${rVal}R</option>`).join('')}
                </select>
                <button type="button" style="color:#f87171; font-weight:900; margin-left:2px; font-size:10px; line-height:1; cursor:pointer;" onclick="removeEnemyStatusChip('${e.uid}', '${ch.key}')" title="상태이상 제거">✕</button>
              </div>
            `;
          }).join('');

          return `
            <div style="background:#090c14; border:1px solid #1e2638; border-radius:6px; padding:5px 8px; display:flex; justify-content:space-between; align-items:center; gap:6px; flex-wrap:wrap;">
              <div style="display:flex; align-items:center; gap:5px; flex-wrap:wrap; flex:1; min-width:0;">
                <span style="font-size:11px; font-weight:900; color:#94a3b8; white-space:nowrap;">상태이상:</span>
                ${chipItemsHtml || `<span style="font-size:10.5px; color:#475569;">없음</span>`}
              </div>
              <div style="display:flex; align-items:center; gap:4px; flex-shrink:0; margin-left:auto;">
                ${e.status.dots.length > 0 ? `<button class="btn-action" style="background:#1e3a5f; border-color:#38bdf8; color:#7dd3fc; font-size:10px; padding:2px 6px;" onclick="extendAllDots('${e.uid}')" title="리퍼 혈맥 절단 등: 모든 지속 피해 잔여 라운드 +1R 연장">⚡DoT+1R</button>` : ''}
                <button class="btn-action" style="background:#1e293b; border-color:#38bdf8; color:#7dd3fc; font-size:12px; font-weight:900; padding:1px 8px; line-height:1.3;" onclick="addDefaultEnemyStatus('${e.uid}')" title="상태이상 추가 (디폴트: 행동 제약: 1R)">＋</button>
              </div>
            </div>
          `;
        })() : ''}

        <!-- 인텐트 순환 바 + 우측 공격 실행 버튼 -->
        <div style="display:flex; align-items:center; gap:6px;">
          <div style="flex:1; min-width:0; display:flex; justify-content:space-between; align-items:center; gap:6px; background:#07090e; padding:4px 8px; border-radius:4px; border:1px solid #1c2436;">
            <div style="font-size:11px; color:#cbd5e1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1; min-width:0;" title="${curIntent}">
              <b class="text-sky-400">[${e.turnIdx + 1}턴]</b> ${curIntent}
            </div>
            <div style="display:flex; gap:2px; flex-shrink:0;">
              <button class="btn-action" style="padding:0 5px;" onclick="prevEnemyTurn('${e.uid}')">◀</button>
              <button class="btn-action" style="padding:0 5px;" onclick="nextEnemyTurn('${e.uid}')">▶</button>
            </div>
          </div>
          ${!isDead ? `<button class="btn-action" style="flex-shrink:0; white-space:nowrap; background:linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%); border-color:#f87171; color:#ffffff; padding:4px 10px;" onclick="executeEnemyAttack('${e.uid}')" title="이 적의 이번 턴 인텐트를 즉시 실행하여 플레이어 대시보드에 자동 타격합니다">⚔️ 공격 실행</button>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function getCommunionLabelKor() {
  if (connectedPlayerParty) {
    if (connectedPlayerParty.communionActiveThisRound === 'shine') return '비추는 불꽃(발동중)';
    if (connectedPlayerParty.communionActiveThisRound === 'burn') return '태우는 불꽃(발동중)';
    if (connectedPlayerParty.communionFlame === 'shine') return '비추는 불꽃(보유)';
    if (connectedPlayerParty.communionFlame === 'burn') return '태우는 불꽃(보유)';
  }
  const val = document.getElementById('stage-communion')?.value || 'none';
  if (val === 'shine') return '비추는 불꽃(보유)';
  if (val === 'burn') return '태우는 불꽃(보유)';
  return '없음';
}

function updateIntentPreview() {
  const stage = document.getElementById('stage-name')?.value || '전투 구역';
  const pyrite = document.getElementById('stage-pyrite')?.value || '0';
  const potion = document.getElementById('stage-potion')?.value || '1';
  const deathStack = document.getElementById('stage-death-stack')?.value || '0';
  const commKor = getCommunionLabelKor();

  const headerLine = `[STAGE] ${stage} | [장미 휘석] ${pyrite}개 | [회복 영약] ${potion}병 | [생환 스택] ${deathStack} | [교감] ${commKor}`;

  const livingEnemies = activeEnemies.filter(e => e.hp > 0);

  if (livingEnemies.length === 0) {
    document.getElementById('intent-preview-box').innerText = 
`${headerLine}
【 ENEMY INTENT 】
(살아있는 적이 없습니다. 모든 적이 처치되었습니다!)`;
    return;
  }

  const enemyLines = livingEnemies.map(e => {
    let tags = [];
    if (e.shield > 0) tags.push(`[방어막: ${e.shield}]`);
    if (e.dmgReduction > 0) tags.push(`[피격 경감: ${e.dmgReduction}]`);
    if (e.status.weak) tags.push(e.status.weakCharges > 1 ? `[방어 약화: ${e.status.weakCharges}R]` : "[방어 약화]");
    if (e.status.bindTurns > 0) tags.push(`[행동 제약: ${e.status.bindTurns}R]`);
    if (e.status.dots.length > 0) {
      e.status.dots.forEach(d => {
        tags.push(`[지속 피해: ${d.dmg} (${d.turns}R)]`);
      });
    }
    if (e.atkMod && e.atkMod < 0) tags.push(`[공격력 ${e.atkMod}: ${e.atkModTurns || 1}R]`);
    if (e.forceDis) tags.push(`[명중 불리함: ${e.forceDisTurns || 1}R]`);
    const statusStr = tags.length > 0 ? " " + tags.join(" ") : "";

    let curIntent = formatResolvedIntent(e);
    if (e.status.bindTurns > 0) {
      curIntent += ` \n   └ ⚠️ [행동 제약 중] 충전/광역/상태이상 불가 ➔ 기본 단일 공격으로 실행!`;
    }

    const gradeHeader = e.letterTag ? `${e.grade} ${e.letterTag}` : e.grade;
    const displayName = e.baseName || PRESETS[e.baseKey]?.name || e.name;

    return `▶ [${gradeHeader}] ${displayName} (HP ${e.hp}/${e.maxHp} | AC ${e.ac})${statusStr}
   └ 의도: ${curIntent}`;
  }).join('\n');

  const fullText = 
`${headerLine}
【 ENEMY INTENT 】
${enemyLines}`;

  document.getElementById('intent-preview-box').innerText = fullText;
}

function updateAll() {
  updateIntentPreview();
}

function copyIntentText(btn) {
  const txt = document.getElementById('intent-preview-box').innerText;
  copyToClipboard(txt, () => {
    const orig = btn.innerHTML;
    btn.innerHTML = "<span>✓ 복사 완료! (디스코드 붙여넣기)</span>";
    btn.style.borderColor = "#22c55e";
    showToast("📋 라운드 인텐트가 클립보드에 복사되었습니다!");
    setTimeout(() => {
      btn.innerHTML = orig;
      btn.style.borderColor = "#ef4444";
    }, 1200);
  }, () => {
    showToast("⚠️ 복사 실패: 브라우저 클립보드 권한을 확인해주세요.");
  });
}

function toggleLegacyGmScroll() {
  const drawer = document.getElementById('legacy-gm-scroll-drawer');
  const arrow = document.getElementById('legacy-scroll-arrow');
  if (!drawer) return;
  const isOpen = drawer.getAttribute('data-open') === 'true';
  if (isOpen) {
    drawer.setAttribute('data-open', 'false');
    drawer.style.maxHeight = '0px';
    drawer.style.opacity = '0';
    drawer.style.paddingTop = '0px';
    drawer.style.paddingBottom = '0px';
    drawer.style.borderTopWidth = '0px';
    if (arrow) arrow.innerText = '▼ 펼치기';
  } else {
    drawer.setAttribute('data-open', 'true');
    drawer.style.maxHeight = '620px';
    drawer.style.opacity = '1';
    drawer.style.paddingTop = '12px';
    drawer.style.paddingBottom = '14px';
    drawer.style.borderTopWidth = '1px';
    if (arrow) arrow.innerText = '▲ 접기';
  }
}

function rollEnemyDice(mode) {
  const d1 = Math.floor(Math.random() * 20) + 1;
  const d2 = Math.floor(Math.random() * 20) + 1;
  const resBox = document.getElementById('dice-result-box');
  let diceResText = '';
  if (mode === 'adv') {
    const higher = Math.max(d1, d2);
    resBox.innerHTML = `2d20H(${d1},${d2}) ➔ <b style="color:#86efac; font-size:13.5px;">${higher}</b>`;
    diceResText = `2d20H(${d1},${d2}) ➔ ${higher} (유리함)`;
  } else if (mode === 'dis') {
    const lower = Math.min(d1, d2);
    resBox.innerHTML = `2d20L(${d1},${d2}) ➔ <b style="color:#fca5a5; font-size:13.5px;">${lower}</b>`;
    diceResText = `2d20L(${d1},${d2}) ➔ ${lower} (불리함)`;
  } else {
    resBox.innerHTML = `1d20(${d1}) ➔ <b style="color:#fbd38d; font-size:13.5px;">${d1}</b>`;
    diceResText = `1d20(${d1}) ➔ ${d1}`;
  }
  gmLog(`🎲 <b>[마스터 다이스]</b> ${diceResText}`, 'system');
}

/* =========================================================================
   [전투 액션 로그 엔진] 마스터 컨트롤러 실시간 액션 로그 (gmLog / clearGmLog)
   ========================================================================= */
function gmLog(msg, category = 'system') {
  const box = document.getElementById('gm-log-box');
  if (!box) return;
  const placeholder = box.querySelector('div[style*="text-align:center"]');
  if (placeholder) placeholder.remove();

  const item = document.createElement('div');
  item.className = 'gm-log-item ' + category;
  item.innerHTML = msg;
  box.prepend(item);

  if (box.children.length > 80) {
    box.lastElementChild.remove();
  }
}
window.gmLog = gmLog;

function clearGmLog() {
  const box = document.getElementById('gm-log-box');
  if (box) {
    box.innerHTML = '<div style="color:#64748b; font-size:10.5px; text-align:center; padding:16px 0;">전투 액션 로그가 여기에 기록됩니다.</div>';
  }
}
window.clearGmLog = clearGmLog;

function showToast(msg) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast-msg';
  toast.innerText = msg;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function resetToScene1Preset() {
  pushGmUndoSnapshot('조우 초기화');
  activeEnemies = [];
  enemyCounter = 0;
  if (document.getElementById('stage-name')) document.getElementById('stage-name').value = "물레울 마을 피난민 천막촌";
  if (!connectedPlayerParty) {
    if (document.getElementById('stage-pyrite')) document.getElementById('stage-pyrite').value = "0";
    if (document.getElementById('stage-potion')) document.getElementById('stage-potion').value = "1";
    if (document.getElementById('stage-death-stack')) document.getElementById('stage-death-stack').value = "0";
    if (document.getElementById('stage-communion')) document.getElementById('stage-communion').value = "none";
  }

  addEnemySlot('lizard');
  addEnemySlot('lizard');
  if (activeEnemies[1]) {
    activeEnemies[1].turnIdx = 1;
  }
  assignSmartTargetsAndIntents(false);
  showToast("🔄 [1장 씬 1: 도마뱀 2체] 공식 세팅 및 스마트 타겟 배정이 초기화되었습니다.");
}

/* =========================================================================
   [수술 1~4단계] 마스터 컨트롤러 ⇄ 플레이어 대시보드 온라인 방 코드(PeerJS) 브릿지
   ========================================================================= */
let gmPeerInstance = null;
let gmPeerConnections = [];
let gmRoomCode = '';
let gmConnMode = 'none'; // 'none' | 'peer'
let connectedPlayerParty = null;
let gmProcessedMsgIds = new Set();

function buildGmStateSyncPayload() {
  const stage = document.getElementById('stage-name')?.value || '전투 구역';
  const pyrite = parseInt(document.getElementById('stage-pyrite')?.value || '0', 10) || 0;

  const serializedEnemies = activeEnemies.map(e => {
    let curIntent = formatResolvedIntent(e);
    if (e.status.bindTurns > 0) {
      const bindDmg = e.isPhase2
        ? (e.bindDmgP2 || (e.baseKey === 'boss_1' ? 6 : 3))
        : (e.bindDmgP1 || ((e.baseKey === 'boss_1' || e.baseKey === 'elite_snake') ? 4 : 3));
      curIntent += ` [⚠️ 행동 제약 중: 기본 단일 공격(고정 ${bindDmg} 피해)으로 실행]`;
    }
    return {
      uid: e.uid,
      baseKey: e.baseKey,
      baseName: e.baseName || e.name,
      letterTag: e.letterTag || '',
      name: e.name,
      grade: e.grade,
      hp: e.hp,
      maxHp: e.maxHp,
      shield: e.shield || 0,
      ac: e.ac,
      p2Ac: e.p2Ac || (e.baseKey === 'boss_1' ? 13 : 14),
      awakenAtRoundEnd: Boolean(e.awakenAtRoundEnd || e.baseKey === 'boss_1'),
      isPhase2: Boolean(e.isPhase2),
      turnIdx: e.turnIdx,
      intent: curIntent,
      resolvedTarget: e.resolvedTarget || null,
      dmgReduction: e.dmgReduction || 0,
      atkMod: e.atkMod || 0,
      atkModTurns: e.atkModTurns || (e.atkMod ? 1 : 0),
      forceDis: Boolean(e.forceDis),
      forceDisTurns: e.forceDisTurns || (e.forceDis ? 1 : 0),
      tauntedBy: e.tauntedBy || null,
      confusedToUid: e.confusedToUid || null,
      confusedToName: e.confusedToName || null,
      status: {
        weak: Boolean(e.status.weak),
        weakCharges: e.status.weakCharges || (e.status.weak ? 1 : 0),
        bindTurns: e.status.bindTurns || 0,
        dots: Array.isArray(e.status.dots) ? e.status.dots : []
      }
    };
  });

  return {
    type: 'GM_STATE_SYNC',
    msgId: 'gm_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    timestamp: Date.now(),
    stageName: stage,
    stagePyrite: pyrite,
    enemies: serializedEnemies
  };
}

function sendPacketFromGm(packet) {
  if (!packet) return;
  if (!packet.msgId) {
    packet.msgId = 'gmpkt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
  }
  gmProcessedMsgIds.add(packet.msgId);

  gmPeerConnections = gmPeerConnections.filter(c => c && c.open);
  gmPeerConnections.forEach(conn => {
    try { conn.send(packet); } catch (e) {}
  });
}

function broadcastGmStateToPlayer(showToastFeedback = false) {
  const payload = buildGmStateSyncPayload();
  sendPacketFromGm(payload);
  if (showToastFeedback) {
    if (gmPeerConnections.filter(c => c && c.open).length === 0) {
      showToast('⚠️ 현재 온라인 연결된 플레이어가 없습니다. 먼저 [🌐 온라인 방 열기]로 연결하세요.');
    } else {
      showToast(`📡 적 ${activeEnemies.filter(e => e.hp > 0).length}체 상태를 플레이어 대시보드로 전송했습니다.`);
    }
  }
}

function renderGmSyncMonitorUI() {
  const badge = document.getElementById('gm-conn-status-badge');
  const strip = document.getElementById('gm-party-status-strip');
  if (!badge || !strip) return;

  const openConns = gmPeerConnections.filter(c => c && c.open).length;
  if (gmConnMode === 'peer' && openConns > 0) {
    badge.style.background = 'rgba(6, 78, 59, 0.85)';
    badge.style.borderColor = '#10b981';
    badge.style.color = '#6ee7b7';
    badge.style.cursor = 'pointer';
    badge.title = '클릭하여 방 코드 복사';
    badge.innerText = gmRoomCode ? `🟢 연결됨(${openConns}명) · 코드 ${gmRoomCode} 복사` : `🟢 온라인 P2P 연결됨 (${openConns}명)`;
  } else if (gmRoomCode) {
    badge.style.background = 'rgba(30, 58, 138, 0.85)';
    badge.style.borderColor = '#38bdf8';
    badge.style.color = '#bae6fd';
    badge.style.cursor = 'pointer';
    badge.title = '클릭하여 방 코드 복사';
    badge.innerText = `🔑 코드 ${gmRoomCode} 복사`;
  } else {
    badge.style.background = '#1e293b';
    badge.style.borderColor = '#475569';
    badge.style.color = '#94a3b8';
    badge.style.cursor = 'default';
    badge.title = '방이 개설되면 클릭하여 방 코드를 복사합니다';
    badge.innerText = '⚪ 온라인 방 미개설';
  }

  if (!connectedPlayerParty) {
    strip.innerHTML = `
      <!-- 좌측: 베어러 (미연결 기본 프리뷰) -->
      <div style="display:flex; flex-direction:column; gap:4px; opacity:0.6;">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:4px;">
          <span style="color:#f8fafc; font-weight:900; font-size:11.5px;">베어러<span style="color:#7dd3fc; font-weight:800;">(미연결)</span></span>
          <span style="font-size:11px; color:#cbd5e1;">AC <b style="color:#fde047;">--</b></span>
        </div>
        <div class="gm-gauge-track">
          <div class="gm-gauge-fill gm-gauge-hp" style="width:0%;"></div>
          <div class="gm-gauge-label">HP -- / --</div>
        </div>
        <div class="gm-gauge-track">
          <div class="gm-gauge-fill gm-gauge-shield" style="width:0%;"></div>
          <div class="gm-gauge-label">방어막 0</div>
        </div>
        <div class="gm-gauge-track">
          <div class="gm-gauge-fill gm-gauge-heat-stable" style="width:0%;"></div>
          <div class="gm-gauge-label">과열 0 / 100</div>
        </div>
        <div style="font-size:10.5px; color:#64748b; margin-top:1px;">상태: 대기</div>
      </div>

      <!-- 우측: 동료 (미연결 기본 프리뷰) -->
      <div style="display:flex; flex-direction:column; gap:4px; opacity:0.6; border-left:1px dashed #1e293b; padding-left:14px;">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:4px;">
          <span style="color:#fde68a; font-weight:900; font-size:11.5px;">동료<span style="color:#d8b4fe; font-weight:800;">(미연결)</span></span>
          <span style="font-size:11px; color:#cbd5e1;">AC <b style="color:#fde047;">--</b></span>
        </div>
        <div class="gm-gauge-track">
          <div class="gm-gauge-fill gm-gauge-hp" style="width:0%;"></div>
          <div class="gm-gauge-label">HP -- / --</div>
        </div>
        <div class="gm-gauge-track">
          <div class="gm-gauge-fill gm-gauge-shield" style="width:0%;"></div>
          <div class="gm-gauge-label">방어막 0</div>
        </div>
        <div style="font-size:10.5px; color:#64748b; margin-top:1px;">상태: 대기</div>
      </div>
    `;
    return;
  }

  const p = connectedPlayerParty;
  syncResourceInputsFromParty(p);

  const bHpPct = p.maxHp > 0 ? Math.max(0, Math.min(100, (p.hp / p.maxHp) * 100)) : 0;
  const bShieldVal = p.shield || 0;
  const bShieldPct = Math.max(0, Math.min(100, (bShieldVal / 15) * 100));
  const bHeatVal = p.heat || 0;
  const bHeatPct = Math.max(0, Math.min(100, bHeatVal));
  const bHeatClass = (bHeatVal >= 100) ? 'gm-gauge-heat-crit' : ((bHeatVal >= 70) ? 'gm-gauge-heat-warn' : 'gm-gauge-heat-stable');

  const cHpPct = p.compMaxHp > 0 ? Math.max(0, Math.min(100, (p.compHp / p.compMaxHp) * 100)) : 0;
  const cShieldVal = p.compShield || 0;
  const cShieldPct = Math.max(0, Math.min(100, (cShieldVal / 15) * 100));

  const bStatuses = Array.isArray(p.bearerStatuses) && p.bearerStatuses.length > 0
    ? p.bearerStatuses.map(s => `<span style="color:${s.type === 'debuff' ? '#fca5a5' : '#7dd3fc'}; font-weight:800;">${s.name}</span>`).join(', ')
    : '<span style="color:#64748b;">정상</span>';
  const cStatuses = Array.isArray(p.compStatuses) && p.compStatuses.length > 0
    ? p.compStatuses.map(s => `<span style="color:${s.type === 'debuff' ? '#fca5a5' : '#d8b4fe'}; font-weight:800;">${s.name}</span>`).join(', ')
    : '<span style="color:#64748b;">정상</span>';

  const passiveBadges = [];
  if (p.hasAttentionFocus) passiveBadges.push('<span style="color:#fde047; font-weight:900;">[주의 집중]</span>');
  if (p.hasFirmBind) passiveBadges.push('<span style="color:#fde047; font-weight:900;">[강경 속박]</span>');
  if (p.hasRecognitionInhibit) passiveBadges.push('<span style="color:#fde047; font-weight:900;">[인식 저해]</span>');

  strip.innerHTML = `
    <!-- 좌측: 베어러 게이지 카드 -->
    <div style="display:flex; flex-direction:column; gap:4px; min-width:0;">
      <div style="display:flex; justify-content:space-between; align-items:center; gap:6px; flex-wrap:wrap;">
        <span style="color:#f8fafc; font-weight:900; font-size:11.5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
          ${p.bearerName}<span style="color:#7dd3fc; font-weight:800;">(${p.pickedClass} Lv.${p.curLevel})</span>
        </span>
        <span style="font-size:11px; color:#cbd5e1; flex-shrink:0;">AC <b style="color:#fde047;">${p.ac}</b></span>
      </div>
      <div class="gm-gauge-track">
        <div class="gm-gauge-fill gm-gauge-hp" style="width:${bHpPct}%;"></div>
        <div class="gm-gauge-label">HP ${p.hp} / ${p.maxHp}</div>
      </div>
      <div class="gm-gauge-track">
        <div class="gm-gauge-fill gm-gauge-shield" style="width:${bShieldPct}%;"></div>
        <div class="gm-gauge-label">방어막 ${bShieldVal}</div>
      </div>
      <div class="gm-gauge-track" title="과열 단계(안정 0~69 / 경고 70~99 / 임계 100)는 게이지 색상으로 표시됩니다">
        <div class="gm-gauge-fill ${bHeatClass}" style="width:${bHeatPct}%;"></div>
        <div class="gm-gauge-label">과열 ${bHeatVal} / 100</div>
      </div>
      <div style="font-size:10.5px; color:#94a3b8; margin-top:1px; line-height:1.35; word-break:keep-all;">
        상태: ${bStatuses} ${passiveBadges.join(' ')}
      </div>
    </div>

    <!-- 우측: 동료 게이지 카드 -->
    <div style="display:flex; flex-direction:column; gap:4px; min-width:0; border-left:1px dashed #1e293b; padding-left:14px;">
      <div style="display:flex; justify-content:space-between; align-items:center; gap:6px; flex-wrap:wrap;">
        <span style="color:#fde68a; font-weight:900; font-size:11.5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
          ${p.compName}<span style="color:#d8b4fe; font-weight:800;">(${p.compClass} Lv.${p.curLevel})</span>
        </span>
        <span style="font-size:11px; color:#cbd5e1; flex-shrink:0;">AC <b style="color:#fde047;">${p.compAc}</b></span>
      </div>
      <div class="gm-gauge-track">
        <div class="gm-gauge-fill gm-gauge-hp" style="width:${cHpPct}%;"></div>
        <div class="gm-gauge-label">HP ${p.compHp} / ${p.compMaxHp}</div>
      </div>
      <div class="gm-gauge-track">
        <div class="gm-gauge-fill gm-gauge-shield" style="width:${cShieldPct}%;"></div>
        <div class="gm-gauge-label">방어막 ${cShieldVal}</div>
      </div>
      <div style="font-size:10.5px; color:#94a3b8; margin-top:1px; line-height:1.35; word-break:keep-all;">
        상태: ${cStatuses} ${p.compRevivedThisRound ? '<span style="color:#34d399; font-weight:900;">[🛡️부활 재정비중]</span>' : ''}
      </div>
    </div>
  `;
}

function handleIncomingPlayerPacket(packet) {
  if (!packet || typeof packet !== 'object') return;
  if (packet.msgId) {
    if (gmProcessedMsgIds.has(packet.msgId)) return;
    gmProcessedMsgIds.add(packet.msgId);
    if (gmProcessedMsgIds.size > 300) {
      const first = gmProcessedMsgIds.values().next().value;
      gmProcessedMsgIds.delete(first);
    }
  }

  if (packet.type === 'PLAYER_HELLO' || packet.type === 'PLAYER_PARTY_SYNC') {
    gmConnMode = 'peer';
    const prevCompDown = Boolean(connectedPlayerParty && (connectedPlayerParty.compHp <= 0 || connectedPlayerParty.compRevivedThisRound));
    if (packet.party) connectedPlayerParty = packet.party;
    const nowCompDown = Boolean(connectedPlayerParty && (connectedPlayerParty.compHp <= 0 || connectedPlayerParty.compRevivedThisRound));

    renderGmSyncMonitorUI();
    if (packet.type === 'PLAYER_HELLO' || prevCompDown !== nowCompDown) {
      assignSmartTargetsAndIntents(false);
    } else {
      renderEnemyCards();
      updateIntentPreview();
      broadcastGmStateToPlayer(false);
    }
    if (packet.type === 'PLAYER_HELLO') {
      showToast(`🟢 플레이어 대시보드(${packet.party?.bearerName || '베어러'})와 실시간 연결되었습니다!`);
      gmLog(`🟢 <b>[플레이어 연결 성공]</b> ${packet.party?.bearerName || '베어러'}(${packet.party?.pickedClass || ''}) & ${packet.party?.compName || '동료'} 대시보드 연결됨`, 'system');
    }
    return;
  }

  if (packet.type === 'PLAYER_ACTION_PACKET' && typeof window.onReceivePlayerActionPacket === 'function') {
    window.onReceivePlayerActionPacket(packet);
  }
}

const GM_PEER_CODE_SESSION_KEY = 'fifth_finger_gm_room_code_v224';

function openGmPeerRoom(preferredCode = '') {
  if (typeof Peer === 'undefined') {
    showToast('⚠️ 인터넷 연결을 확인해 주세요 (PeerJS 로드 필요).');
    return;
  }
  const btn = document.getElementById('btn-gm-open-room');
  if (btn) btn.innerText = '⏳ 방 생성중...';

  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = (typeof preferredCode === 'string' && /^[A-Z0-9]{4}$/.test(preferredCode.trim().toUpperCase()))
    ? preferredCode.trim().toUpperCase()
    : '';
  if (!code) {
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }

  try {
    if (gmPeerInstance) {
      gmPeerInstance.destroy();
      gmPeerInstance = null;
    }
    gmPeerConnections = [];
    const peerId = `fifth-finger-v224-${code}`;
    gmPeerInstance = new Peer(peerId);

    gmPeerInstance.on('open', () => {
      gmRoomCode = code;
      try { sessionStorage.setItem(GM_PEER_CODE_SESSION_KEY, code); } catch (e) {}
      if (btn) btn.innerText = '🌐 방 재발급';
      renderGmSyncMonitorUI();
      showToast(`🌐 온라인 방 활성화 완료! 플레이어 대시보드 방 코드: [${code}]`);
      gmLog(`🌐 <b>[온라인 방 개설]</b> 플레이어 대시보드 연결 코드: <b>[${code}]</b>`, 'system');
    });

    gmPeerInstance.on('connection', (conn) => {
      gmPeerConnections.push(conn);
      conn.on('open', () => {
        gmConnMode = 'peer';
        renderGmSyncMonitorUI();
        broadcastGmStateToPlayer(false);
        conn.send({ type: 'GM_REQUEST_PARTY', msgId: 'req_' + Date.now() });
      });
      conn.on('data', (data) => {
        handleIncomingPlayerPacket(data);
      });
      conn.on('close', () => {
        gmPeerConnections = gmPeerConnections.filter(c => c !== conn && c.open);
        if (gmPeerConnections.length === 0) {
          gmConnMode = 'none';
          connectedPlayerParty = null;
        }
        renderGmSyncMonitorUI();
        showToast('🔌 플레이어 대시보드와의 연결이 종료되었습니다.');
        gmLog(`🔌 <b>[플레이어 연결 종료]</b> 대시보드 연결 해제됨`, 'system');
      });
    });

    gmPeerInstance.on('error', () => {
      if (btn) btn.innerText = gmRoomCode ? '🌐 방 재발급' : '🌐 온라인 방 열기 (P2P)';
      showToast('⚠️ 온라인 방 생성 중 오류가 발생했습니다. 다시 시도해 주세요.');
    });
  } catch (e) {
    if (btn) btn.innerText = gmRoomCode ? '🌐 방 재발급' : '🌐 온라인 방 열기 (P2P)';
  }
}

function copyGmRoomCode() {
  if (!gmRoomCode) return;
  copyToClipboard(gmRoomCode, () => {
    showToast(`🔑 방 코드 [${gmRoomCode}]가 클립보드에 복사되었습니다!`);
  });
}

function initGmSyncBridges() {
  renderGmSyncMonitorUI();
  updateGmUndoButtonUI();
}

window.onload = () => {
  initGmSyncBridges();
  const restored = loadGmSession();
  if (restored) {
    updateEnemyTags();
    renderEnemyCards();
    updateIntentPreview();
    showToast("💾 이전 GM 세션 데이터가 성공적으로 복원되었습니다.");
  } else {
    resetToScene1Preset();
  }
  try {
    const savedRoomCode = sessionStorage.getItem(GM_PEER_CODE_SESSION_KEY);
    if (savedRoomCode) {
      setTimeout(() => openGmPeerRoom(savedRoomCode), 250);
    }
  } catch (e) {}
};