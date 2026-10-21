  /* ==========================================================================
     [v2.24 성좌형 스킬 트리 · 폴백 아이콘 · 드래그 앤 드롭 · 우측 고정 설명 패널]
     ========================================================================== */
  let inspectedSkillId = null;
  let currentDragPayload = null;

  const SKILL_ICON_GLYPHS = {
    // 파이터 (14)
    'f_1_1': '🗡️', 'f_1_2': '⚔️', 'f_1_3': '🦅', 'f_1_4': '🛡️', 'f_1_5': '💥',
    'f_2_1': '🌙', 'f_2_2': '🔨', 'f_2_3': '🚀',
    'f_3_1': '🏰', 'f_3_2': '🔥', 'f_3_3': '⚡',
    'f_4_1': '🪨', 'f_4_2': '🎯', 'f_4_3': '⛓️',
    // 검객 (14)
    's_1_1': '⚡', 's_1_2': '🌀', 's_1_3': '💨', 's_1_4': '⚔️', 's_1_5': '🐉',
    's_2_1': '☄️', 's_2_2': '🦅', 's_2_3': '✨',
    's_3_1': '🌪️', 's_3_2': '🌙', 's_3_3': '🌗',
    's_4_1': '🔄', 's_4_2': '🌺', 's_4_3': '🔥',
    // 메이지 (14)
    'm_1_1': '🔮', 'm_1_2': '💚', 'm_1_3': '🔋', 'm_1_4': '🔥', 'm_1_5': '☄️',
    'm_2_1': '🌪️', 'm_2_2': '🌧️', 'm_2_3': '💥',
    'm_3_1': '⛓️', 'm_3_2': '🛡️', 'm_3_3': '🗡️',
    'm_4_1': '❄️', 'm_4_2': '✨', 'm_4_3': '💎',
    // 등지기 (14)
    'l_1_1': '🏮', 'l_1_2': '🌫️', 'l_1_3': '💡', 'l_1_4': '🎭', 'l_1_5': '🐉',
    'l_2_1': '☀️', 'l_2_2': '🌟', 'l_2_3': '🦶',
    'l_3_1': '💥', 'l_3_2': '🪞', 'l_3_3': '🌈',
    'l_4_1': '🔔', 'l_4_2': '👥', 'l_4_3': '👁️',
    // 데드로 - 워리어 (9)
    'w_1_1': '⚔️', 'w_1_2': '🛡️', 'w_1_3': '🌪️',
    'w_2_1': '📢', 'w_2_2': '🔨',
    'w_3_1': '🩸', 'w_3_2': '💨',
    'w_4_1': '🏰', 'w_4_2': '🪓',
    // 릴리 - 소서러 (9)
    'so_1_1': '🔮', 'so_1_2': '🩸', 'so_1_3': '❄️',
    'so_2_1': '🍷', 'so_2_2': '🕸️',
    'so_3_1': '✨', 'so_3_2': '🔥',
    'so_4_1': '☯️', 'so_4_2': '💎',
    // 센 - 마검사 (9)
    'ms_1_1': '⚡', 'ms_1_2': '🛡️', 'ms_1_3': '🔫',
    'ms_2_1': '🗡️', 'ms_2_2': '⚔️',
    'ms_3_1': '💥', 'ms_3_2': '❄️',
    'ms_4_1': '🌟', 'ms_4_2': '🕺',
    // 마윤겸 - 리퍼 (9)
    'r_1_1': '🌙', 'r_1_2': '🩸', 'r_1_3': '🐍',
    'r_2_1': '☠️', 'r_2_2': '✂️',
    'r_3_1': '🌿', 'r_3_2': '☣️',
    'r_4_1': '💀', 'r_4_2': '⚰️'
  };

  const loadedCustomSkillIcons = new Set();
  const missingCustomSkillIcons = new Set();
  const resolvedSkillIconUrlMap = new Map();

  function getSkillObjectByIdAny(skillId) {
    if (skillId === 'comp_heat') return { id: 'comp_heat', name: '열기 전도' };
    return getBearerSkillById(skillId) || getCompSkillById(skillId) || null;
  }

  function getSkillIconBaseName(sk) {
    if (!sk) return '';
    if (sk.id === 'comp_heat') return '열기 전도';
    // 콜론(:)이 포함된 4레벨 동료 스킬은 윈도우 파일명 제약 회피를 위해 콜론 앞 핵심 스킬명 사용
    return String(sk.name || '').split(':')[0].trim();
  }
  window.getSkillIconBaseName = getSkillIconBaseName;

  function getSkillIconCandidates(sk) {
    if (!sk) return [];
    const baseName = getSkillIconBaseName(sk);
    const list = [];
    if (baseName) {
      // 1순위: 공식 한글 스킬명 (예: assets/skills/쾌속 찌르기.png, assets/skills/생사 역전.png)
      list.push(`assets/skills/${baseName}.png`);
      // 2순위: 띄어쓰기를 생략한 한글 스킬명 폴백 (예: assets/skills/쾌속찌르기.png)
      const noSpace = baseName.replace(/\s+/g, '');
      if (noSpace !== baseName) {
        list.push(`assets/skills/${noSpace}.png`);
      }
      // 콜론 뒤 부제까지 언더바 등으로 넣었을 경우 대비
      if (sk.name && sk.name.includes(':')) {
        const fullClean = String(sk.name).replace(/\s*:\s*/g, ' ').trim();
        list.push(`assets/skills/${fullClean}.png`);
      }
    }
    // 3순위: 레거시 영문 ID 폴백 (예: assets/skills/f_1_1.png)
    if (sk.id) {
      list.push(`assets/skills/${sk.id}.png`);
    }
    return list;
  }
  window.getSkillIconCandidates = getSkillIconCandidates;

  function getSkillIconStateClass(skillId) {
    if (!skillId) return 'missing-custom-img';
    if (loadedCustomSkillIcons.has(skillId)) return 'has-custom-img';
    if (missingCustomSkillIcons.has(skillId)) return 'missing-custom-img';
    return '';
  }

  function onSkillIconLoad(imgEl, skillId) {
    loadedCustomSkillIcons.add(skillId);
    missingCustomSkillIcons.delete(skillId);
    if (imgEl) {
      const currentSrc = imgEl.getAttribute('src');
      if (currentSrc) resolvedSkillIconUrlMap.set(skillId, currentSrc);
      if (imgEl.parentElement) {
        imgEl.parentElement.classList.remove('missing-custom-img');
        imgEl.parentElement.classList.add('has-custom-img');
      }
      if (typeof bakeDecodedImageToGpuLayer === 'function') {
        bakeDecodedImageToGpuLayer(currentSrc || imgEl.src);
      }
    }
  }
  window.onSkillIconLoad = onSkillIconLoad;

  function onSkillIconError(imgEl, skillId) {
    const sk = getSkillObjectByIdAny(skillId);
    if (imgEl && sk && !resolvedSkillIconUrlMap.has(skillId)) {
      const candidates = getSkillIconCandidates(sk);
      const curIdx = parseInt(imgEl.getAttribute('data-cand-idx') || '0', 10);
      const nextIdx = curIdx + 1;
      if (nextIdx < candidates.length) {
        imgEl.setAttribute('data-cand-idx', String(nextIdx));
        imgEl.src = candidates[nextIdx];
        return;
      }
    }
    missingCustomSkillIcons.add(skillId);
    if (imgEl) {
      imgEl.style.display = 'none';
      if (imgEl.parentElement) {
        imgEl.parentElement.classList.remove('has-custom-img');
        imgEl.parentElement.classList.add('missing-custom-img');
      }
    }
  }
  window.onSkillIconError = onSkillIconError;

  function getSkillIconHtml(sk) {
    if (!sk) return '<span class="skill-fallback-glyph">✦</span>';
    const glyph = SKILL_ICON_GLYPHS[sk.id] || '✦';
    if (missingCustomSkillIcons.has(sk.id)) {
      return `<span class="skill-fallback-glyph">${glyph}</span>`;
    }
    const resolvedSrc = resolvedSkillIconUrlMap.get(sk.id) || getSkillIconCandidates(sk)[0] || `assets/skills/${sk.id}.png`;
    return `<img class="skill-custom-img" src="${resolvedSrc}" data-skill-id="${sk.id}" data-cand-idx="0" decoding="sync" loading="eager" alt="" onload="onSkillIconLoad(this, '${sk.id}')" onerror="onSkillIconError(this, '${sk.id}')" /><span class="skill-fallback-glyph">${glyph}</span>`;
  }

  function syncDashSkillIconBox(iconBoxEl, sk, circleCls, overlayInnerHtml) {
    if (!iconBoxEl || !sk) return;
    const stateCls = getSkillIconStateClass(sk.id);
    iconBoxEl.className = `dash-skill-icon-box ${circleCls}${stateCls ? ' ' + stateCls : ''}`;

    // 장착된 스킬 ID가 바뀌었을 때만 내부 아이콘 DOM을 새로 생성 (쿨다운/HP/과열 조절 시 아이콘 재렌더링 원천 방지)
    if (iconBoxEl.getAttribute('data-rendered-skill') !== sk.id) {
      iconBoxEl.setAttribute('data-rendered-skill', sk.id);
      iconBoxEl.innerHTML = getSkillIconHtml(sk);
    }

    let overlayEl = iconBoxEl.querySelector('.dash-cd-overlay');
    if (overlayInnerHtml) {
      if (!overlayEl) {
        overlayEl = document.createElement('div');
        overlayEl.className = 'dash-cd-overlay';
        iconBoxEl.appendChild(overlayEl);
      }
      if (overlayEl.innerHTML !== overlayInnerHtml) {
        overlayEl.innerHTML = overlayInnerHtml;
      }
    } else if (overlayEl) {
      overlayEl.remove();
    }
  }

  function selectDeckBuilderSlot(idx) {
    if (deckModalMode === 'comp') {
      selectedCompSlotIdx = idx;
      const skId = compDeck[idx];
      if (skId) inspectedSkillId = skId;
    } else {
      selectedDeckSlotIdx = idx;
      const skId = bearerDeck[idx];
      if (skId) inspectedSkillId = skId;
    }
    playBeep(540, 'sine', 0.06);
    renderDeckBuilderModal();
  }

  function setInspectedSkill(skillId) {
    if (!skillId) return;
    inspectedSkillId = skillId;

    // 1. 좌측 성좌 노드 & 가지선 & 상단 슬롯 네온 하이라이트 즉시 동기화 (DOM 재렌더링 없이 60fps 유지)
    document.querySelectorAll('.constellation-skill-node').forEach(el => {
      el.classList.toggle('is-inspected-neon', el.getAttribute('data-skill-id') === skillId);
    });
    document.querySelectorAll('.constellation-branch-line').forEach(el => {
      el.classList.toggle('is-inspected-neon', el.getAttribute('data-skill-id') === skillId);
    });
    document.querySelectorAll('#deck-modal-active-slots .deck-slot-card').forEach(el => {
      el.classList.toggle('is-inspected-neon', el.getAttribute('data-skill-id') === skillId);
    });

    // 2. 우측 고정 상세 설명 패널 업데이트
    renderDeckInspectorPanel(skillId);
  }
  window.setInspectedSkill = setInspectedSkill;

  function renderDeckInspectorPanel(skillId) {
    const panel = document.getElementById('deck-inspector-panel');
    if (!panel) return;

    if (deckModalMode === 'comp') {
      const sk = getCompSkillById(skillId) || getCompSkillById(compDeck[selectedCompSlotIdx]) || getCompSkillById(compDeck[0]);
      if (!sk) return;
      const cdStr = sk.cd > 0 ? `쿨다운 ${sk.cd}라운드` : '상시 사용 (쿨다운 없음)';
      const lvLabel = sk.reqLv === 1 ? 'Lv.1 기본 기술' : `Lv.${sk.reqLv} 전문화 기술`;
      const bonusDmg = curLevel - 1;
      const dmgBadge = sk.dmg > 0
        ? `<span class="inspector-meta-pill">기본 피해 ${sk.dmg}${bonusDmg > 0 && sk.isAttack ? ` (+레벨 ${bonusDmg})` : ''}</span>`
        : '';

      let condHtml = '';
      if (sk.reqCharge) {
        const met = (senCharge >= sk.reqCharge);
        condHtml = `<div class="inspector-cond-banner ${met ? 'met' : ''}">🔒 시전 조건: [마탄 차징] 최소 ${sk.reqCharge}스택 이상 보유 (현재: ${senCharge}/3스택)</div>`;
      }

      panel.innerHTML = `
        <div class="inspector-header-block">
          <div class="inspector-skill-title">${sk.name}</div>
          <div class="inspector-badge-row">
            <span class="skill-circle-pill ${sk.cd > 0 ? 'c-2' : 'c-0'}" style="font-size:11px; padding:3px 9px;">${cdStr}</span>
            <span class="inspector-meta-pill lv-pill">${lvLabel}</span>
            ${dmgBadge}
          </div>
        </div>
        <div class="inspector-summary-box" style="border-left-color:#c084fc;">
          <div class="inspector-summary-label" style="color:#d8b4fe;">⚡ 한 줄 핵심 요약</div>
          <div class="inspector-summary-text">${sk.subText}</div>
        </div>
        ${condHtml}
        <div class="inspector-desc-block">
          <div class="inspector-desc-label">📖 룰북 원문 설명</div>
          <div class="inspector-desc-text">${sk.desc}</div>
        </div>
      `;
      return;
    }

    const sk = getBearerSkillById(skillId) || getBearerSkillById(bearerDeck[selectedDeckSlotIdx]) || getBearerSkillById(bearerDeck[0]);
    if (!sk) return;

    const costStr = sk.isPassive ? '상시 발동 (과열 +0)' : (sk.id === 'm_1_3' ? '충전 마법 과열 적용' : `과열 +${sk.cost}`);
    const lvLabel = sk.reqLv === 1 ? 'Lv.1 기본 성염' : (sk.isPassive ? 'Lv.4 전문화 패시브' : `Lv.${sk.reqLv} 전문화 성염`);
    const bonusDmg = curLevel - 1;
    const dmgBadge = sk.dmg > 0
      ? `<span class="inspector-meta-pill">기본 피해 ${sk.dmg}${bonusDmg > 0 && sk.isAttack ? ` (+레벨 ${bonusDmg})` : ''}</span>`
      : '';

    let condBanners = [];
    if (sk.reqHeat) {
      const met = (heat >= sk.reqHeat);
      condBanners.push(`<div class="inspector-cond-banner ${met ? 'met' : ''}">🔒 시전 조건: 현재 과열 ${sk.reqHeat} 이상 필요 (현재 과열: ${heat}/100)</div>`);
    }
    if (sk.reqHalfHp) {
      const met = (hp * 2 <= maxHp);
      condBanners.push(`<div class="inspector-cond-banner ${met ? 'met' : ''}">🔒 시전 조건: 베어러 현재 HP 절반(50%) 이하 필요 (현재 HP: ${hp}/${maxHp})</div>`);
    }
    if (sk.reqCompAlive) {
      const met = (compHp > 0);
      condBanners.push(`<div class="inspector-cond-banner ${met ? 'met' : ''}">🔒 시전 조건: 동료(${getCompName()}) 생존 상태 필요</div>`);
    }

    panel.innerHTML = `
      <div class="inspector-header-block">
        <div class="inspector-skill-title">${sk.name}</div>
        <div class="inspector-badge-row">
          <span class="skill-circle-pill c-${sk.circle}" style="font-size:11px; padding:3px 9px;">${sk.circleLabel}</span>
          <span class="inspector-meta-pill cost-pill">${costStr}</span>
          <span class="inspector-meta-pill lv-pill">${lvLabel}</span>
          ${dmgBadge}
        </div>
      </div>
      <div class="inspector-summary-box">
        <div class="inspector-summary-label">⚡ 한 줄 핵심 요약</div>
        <div class="inspector-summary-text">${sk.subText}</div>
      </div>
      ${condBanners.join('')}
      <div class="inspector-desc-block">
        <div class="inspector-desc-label">📖 룰북 원문 설명</div>
        <div class="inspector-desc-text">${sk.desc}</div>
      </div>
    `;
  }

  function equipCompSkillToDeck(skillId, targetSlotOverride = null) {
    const sk = getCompSkillById(skillId);
    if (!sk) return;
    setInspectedSkill(skillId);

    if (sk.reqLv > curLevel && !allowAllLevelSkills) {
      playBeep(220, 'sawtooth', 0.15);
      log(`🔒 <b>[레벨 부족]</b> [${sk.name}]은(는) <b>Lv.${sk.reqLv}</b>에 해금되는 동료 전문화 기술입니다.`);
      return;
    }

    const destIdx = (targetSlotOverride !== null && targetSlotOverride !== undefined) ? targetSlotOverride : selectedCompSlotIdx;
    const existingIdx = compDeck.indexOf(skillId);

    if (existingIdx !== -1) {
      if (targetSlotOverride !== null && existingIdx !== destIdx) {
        // 드래그 앤 드롭으로 이미 장착된 스킬을 다른 슬롯에 놓으면 두 슬롯 위치 스왑
        const temp = compDeck[destIdx];
        compDeck[destIdx] = compDeck[existingIdx];
        compDeck[existingIdx] = temp;
        selectedCompSlotIdx = destIdx;
        playBeep(620, 'triangle', 0.1);
        log(`🤝 <b>[동료 슬롯 위치 교환]</b> ${['A','B','C'][existingIdx]}슬롯 ⇄ ${['A','B','C'][destIdx]}슬롯 스킬 순서를 맞바꾸었습니다.`);
        renderDeckBuilderModal();
        renderQueueUI();
        refreshUI();
        saveSessionState();
        return;
      }
      selectedCompSlotIdx = existingIdx;
      playBeep(440, 'sine', 0.06);
      renderDeckBuilderModal();
      return;
    }

    const slotTag = ['A', 'B', 'C'][destIdx] || 'A';
    const oldSkill = getCompSkillById(compDeck[destIdx]);
    compDeck[destIdx] = skillId;
    compCds[slotTag] = 0;
    actionQueue = actionQueue.filter(item => !(item.actor === 'comp' && item.key === slotTag));
    delete compSlotOptions[slotTag];

    playBeep(660, 'triangle', 0.12);
    log(`🤝 <b>[동료 덱 재편]</b> ${getCompName()} ${slotTag}슬롯: [${oldSkill ? oldSkill.name : '빈 슬롯'}] ➔ <b>[${sk.name}]</b> 편성 완료!`);

    selectedCompSlotIdx = (targetSlotOverride !== null) ? destIdx : ((destIdx + 1) % 3);
    renderDeckBuilderModal();
    renderQueueUI();
    refreshUI();
    saveSessionState();
  }
  window.equipCompSkillToDeck = equipCompSkillToDeck;

  function equipSkillToDeck(skillId, targetSlotOverride = null) {
    const sk = getBearerSkillById(skillId);
    if (!sk) return;
    setInspectedSkill(skillId);

    if (sk.reqLv > curLevel && !allowAllLevelSkills) {
      playBeep(220, 'sawtooth', 0.15);
      log(`🔒 <b>[레벨 부족]</b> [${sk.name}]은(는) <b>Lv.${sk.reqLv}</b>에 해금되는 전문화 기술입니다. (상단 [현재 레벨 해금만 허용] 버튼을 눌러 자유 편성 모드를 켤 수 있습니다.)`);
      return;
    }

    const destIdx = (targetSlotOverride !== null && targetSlotOverride !== undefined) ? targetSlotOverride : selectedDeckSlotIdx;
    const existingIdx = bearerDeck.indexOf(skillId);

    if (existingIdx !== -1) {
      if (targetSlotOverride !== null && existingIdx !== destIdx) {
        const temp = bearerDeck[destIdx];
        bearerDeck[destIdx] = bearerDeck[existingIdx];
        bearerDeck[existingIdx] = temp;
        selectedDeckSlotIdx = destIdx;
        playBeep(620, 'triangle', 0.1);
        log(`🃏 <b>[성염 덱 슬롯 교환]</b> 슬롯 ${existingIdx + 1} ⇄ 슬롯 ${destIdx + 1} 스킬 순서를 맞바꾸었습니다.`);
        renderDeckBuilderModal();
        renderQueueUI();
        refreshUI();
        saveSessionState();
        return;
      }
      selectedDeckSlotIdx = existingIdx;
      playBeep(440, 'sine', 0.06);
      renderDeckBuilderModal();
      return;
    }

    if (sk.isPassive) {
      const existingPassiveIdx = bearerDeck.findIndex(id => {
        const s = getBearerSkillById(id);
        return s && s.isPassive;
      });
      if (existingPassiveIdx !== -1 && existingPassiveIdx !== destIdx) {
        const oldPassive = getBearerSkillById(bearerDeck[existingPassiveIdx]);
        bearerDeck[existingPassiveIdx] = skillId;
        selectedDeckSlotIdx = existingPassiveIdx;
        playBeep(660, 'triangle', 0.12);
        log(`👑 <b>[패시브 교체 (최대 1개 제한)]</b> 기존 패시브 [${oldPassive.name}] 대신 <b>[${sk.name}]</b>을(를) 슬롯 ${existingPassiveIdx + 1}에 편성했습니다!`);
        renderDeckBuilderModal();
        refreshUI();
        saveSessionState();
        return;
      }
    }

    const oldSkill = getBearerSkillById(bearerDeck[destIdx]);
    bearerDeck[destIdx] = skillId;
    actionQueue = actionQueue.filter(item => !(item.actor === 'bearer' && item.key === destIdx));
    delete slotRunOptions[destIdx];

    playBeep(660, 'triangle', 0.12);
    log(`🃏 <b>[성염 덱 재편]</b> 슬롯 ${destIdx + 1}: [${oldSkill ? oldSkill.name : '빈 슬롯'}] ➔ <b>[${sk.circleLabel} · ${sk.name}]</b> 편성 완료!`);

    selectedDeckSlotIdx = (targetSlotOverride !== null) ? destIdx : ((destIdx + 1) % 5);
    renderDeckBuilderModal();
    renderQueueUI();
    refreshUI();
    saveSessionState();
  }

  /* 드래그 앤 드롭 이벤트 핸들러 (트리 ➔ 슬롯, 슬롯 ⇄ 슬롯, 슬롯 ➔ 트리 복원) */
  function onTreeNodeDragStart(e, skillId) {
    currentDragPayload = { source: 'tree', skillId };
    setInspectedSkill(skillId);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'copyMove';
      e.dataTransfer.setData('text/plain', skillId);
    }
  }
  window.onTreeNodeDragStart = onTreeNodeDragStart;

  function onDeckSlotDragStart(e, slotIdx, skillId) {
    currentDragPayload = { source: 'slot', slotIdx, skillId };
    setInspectedSkill(skillId);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', skillId);
    }
  }
  window.onDeckSlotDragStart = onDeckSlotDragStart;

  function onDeckSlotDragOver(e) {
    e.preventDefault();
    if (e.currentTarget) e.currentTarget.classList.add('drag-over-target');
  }
  window.onDeckSlotDragOver = onDeckSlotDragOver;

  function onDeckSlotDragLeave(e) {
    if (e.currentTarget) e.currentTarget.classList.remove('drag-over-target');
  }
  window.onDeckSlotDragLeave = onDeckSlotDragLeave;

  function onDeckSlotDrop(e, targetSlotIdx) {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget) e.currentTarget.classList.remove('drag-over-target');
    if (!currentDragPayload) return;

    const { source, slotIdx, skillId } = currentDragPayload;
    currentDragPayload = null;

    if (source === 'slot') {
      if (slotIdx === targetSlotIdx) return;
      if (deckModalMode === 'comp') {
        const tmp = compDeck[targetSlotIdx];
        compDeck[targetSlotIdx] = compDeck[slotIdx];
        compDeck[slotIdx] = tmp;
        selectedCompSlotIdx = targetSlotIdx;
      } else {
        const tmp = bearerDeck[targetSlotIdx];
        bearerDeck[targetSlotIdx] = bearerDeck[slotIdx];
        bearerDeck[slotIdx] = tmp;
        selectedDeckSlotIdx = targetSlotIdx;
      }
      playBeep(620, 'triangle', 0.1);
      renderDeckBuilderModal();
      renderQueueUI();
      refreshUI();
      saveSessionState();
      return;
    }

    if (source === 'tree' && skillId) {
      if (deckModalMode === 'comp') {
        equipCompSkillToDeck(skillId, targetSlotIdx);
      } else {
        equipSkillToDeck(skillId, targetSlotIdx);
      }
    }
  }
  window.onDeckSlotDrop = onDeckSlotDrop;

  function onTreeCanvasDragOver(e) {
    if (currentDragPayload && currentDragPayload.source === 'slot') {
      e.preventDefault();
    }
  }
  window.onTreeCanvasDragOver = onTreeCanvasDragOver;

  function onTreeCanvasDrop(e) {
    if (!currentDragPayload || currentDragPayload.source !== 'slot') return;
    e.preventDefault();
    const { slotIdx } = currentDragPayload;
    currentDragPayload = null;

    if (deckModalMode === 'comp') {
      const defaults = DEFAULT_COMP_DECKS[pickedComp] || DEFAULT_COMP_DECKS['데드로'];
      const fallbackId = defaults.find(id => !compDeck.includes(id)) || defaults[slotIdx];
      if (fallbackId && compDeck[slotIdx] !== fallbackId) {
        compDeck[slotIdx] = fallbackId;
        playBeep(420, 'sine', 0.1);
        log(`🤝 <b>[슬롯 복원]</b> ${['A','B','C'][slotIdx]}슬롯의 전문화 기술을 해제하고 기본 기술로 복원했습니다.`);
        renderDeckBuilderModal();
        refreshUI();
        saveSessionState();
      }
    } else {
      const defaults = DEFAULT_BEARER_DECKS[pickedClass] || DEFAULT_BEARER_DECKS['파이터'];
      const fallbackId = defaults.find(id => !bearerDeck.includes(id)) || defaults[slotIdx];
      if (fallbackId && bearerDeck[slotIdx] !== fallbackId) {
        bearerDeck[slotIdx] = fallbackId;
        playBeep(420, 'sine', 0.1);
        log(`🃏 <b>[슬롯 복원]</b> 슬롯 ${slotIdx + 1}의 전문화 기술을 해제하고 기본 성염으로 복원했습니다.`);
        renderDeckBuilderModal();
        refreshUI();
        saveSessionState();
      }
    }
  }
  window.onTreeCanvasDrop = onTreeCanvasDrop;

  /* 성좌 좌표 레이아웃 정의: 중심(50, 52)에서 상하좌우 반경 21씩 떨어진 완벽한 90도 정마름모(정사각형 회전) */
  const CONSTELLATION_HUBS = {
    1: { x: 50, y: 31 }, // 상단 꼭짓점 (12시)
    2: { x: 29, y: 52 }, // 좌측 꼭짓점 (9시)
    3: { x: 50, y: 73 }, // 하단 꼭짓점 (6시)
    4: { x: 71, y: 52 }  // 우측 꼭짓점 (3시)
  };

  const BEARER_CONSTELLATION_COORDS = {
    1: [
      { x: 26, y: 22 },
      { x: 37, y: 12 },
      { x: 50, y: 9 },
      { x: 63, y: 12 },
      { x: 74, y: 22 }
    ],
    2: [
      { x: 13, y: 38 },
      { x: 9,  y: 52 },
      { x: 13, y: 66 }
    ],
    3: [
      { x: 34, y: 88 },
      { x: 50, y: 91 },
      { x: 66, y: 88 }
    ],
    4: [
      { x: 87, y: 38 },
      { x: 91, y: 52 },
      { x: 87, y: 66 }
    ]
  };

  const COMP_CONSTELLATION_COORDS = {
    1: [
      { x: 35, y: 13 },
      { x: 50, y: 9 },
      { x: 65, y: 13 }
    ],
    2: [
      { x: 11, y: 42 },
      { x: 11, y: 62 }
    ],
    3: [
      { x: 36, y: 89 },
      { x: 64, y: 89 }
    ],
    4: [
      { x: 89, y: 42 },
      { x: 89, y: 62 }
    ]
  };

  function renderDeckBuilderModal() {
    ensureValidBearerDeck(false);
    ensureValidCompDeck(false);

    const tabBearer = document.getElementById('tab-deck-bearer');
    const tabComp = document.getElementById('tab-deck-comp');
    if (tabBearer) tabBearer.classList.toggle('active', deckModalMode === 'bearer');
    if (tabComp) tabComp.classList.toggle('active', deckModalMode === 'comp');

    const unlockBtn = document.getElementById('btn-toggle-unlock-all');
    if (unlockBtn) {
      if (allowAllLevelSkills) {
        unlockBtn.innerText = '🔓 전 레벨 자유 편성 켜짐';
        unlockBtn.style.borderColor = '#38bdf8';
        unlockBtn.style.color = '#7dd3fc';
      } else {
        unlockBtn.innerText = `🔒 현재 레벨(Lv.${curLevel}) 해금만 허용`;
        unlockBtn.style.borderColor = '#475569';
        unlockBtn.style.color = '#cbd5e1';
      }
    }

    const titleLbl = document.getElementById('deck-active-header-title');
    const activeSlotsEl = document.getElementById('deck-modal-active-slots');
    const badgesEl = document.getElementById('deck-validation-badges');
    const warnEl = document.getElementById('deck-cantrip-warning');
    const canvasEl = document.getElementById('deck-constellation-canvas');

    const isCompMode = (deckModalMode === 'comp');

    if (isCompMode) {
      const c = COMPS[pickedComp];
      if (!inspectedSkillId || !getCompSkillById(inspectedSkillId) || getCompSkillById(inspectedSkillId).comp !== pickedComp) {
        inspectedSkillId = compDeck[selectedCompSlotIdx] || compDeck[0];
      }
      if (titleLbl) {
        titleLbl.innerText = `🤝 ${getCompName()} (${c.class}) 전투 3스킬 덱 (성좌 아이콘을 슬롯으로 드래그 앤 드롭 또는 클릭)`;
        titleLbl.style.color = '#d8b4fe';
      }
      let noCdCount = 0;
      if (activeSlotsEl) {
        activeSlotsEl.classList.add('comp-slots-3');
        activeSlotsEl.innerHTML = compDeck.map((id, idx) => {
          const sk = getCompSkillById(id);
          if (!sk) return '';
          if (sk.cd === 0) noCdCount++;
          const slotTag = ['A', 'B', 'C'][idx];
          const isSelected = (idx === selectedCompSlotIdx);
          const isInspected = (sk.id === inspectedSkillId);
          const cdStr = sk.cd > 0 ? `쿨${sk.cd}R` : '상시';
          const circleClass = sk.cd > 0 ? 'c-2' : 'c-0';
          return `
            <div class="deck-slot-card icon-slot-card ${isSelected ? 'selected-slot' : ''} ${isInspected ? 'is-inspected-neon' : ''}"
                 data-skill-id="${sk.id}"
                 draggable="true"
                 ondragstart="onDeckSlotDragStart(event, ${idx}, '${sk.id}')"
                 ondragover="onDeckSlotDragOver(event)"
                 ondragleave="onDeckSlotDragLeave(event)"
                 ondrop="onDeckSlotDrop(event, ${idx})"
                 onmouseenter="setInspectedSkill('${sk.id}')"
                 onclick="selectDeckBuilderSlot(${idx})">
              <div class="slot-top-meta">
                <span style="color:${isSelected ? '#fbd38d' : '#d8b4fe'};">${slotTag}슬롯</span>
                <span class="skill-circle-pill ${circleClass}">${cdStr}</span>
              </div>
              <div class="slot-icon-frame ${circleClass} ${getSkillIconStateClass(sk.id)}">
                ${getSkillIconHtml(sk)}
              </div>
              <div class="slot-skill-name">${sk.name}</div>
            </div>
          `;
        }).join('');
      }
      if (badgesEl) {
        badgesEl.innerHTML = `
          <span style="font-size:10.5px; font-weight:800; padding:2px 8px; border-radius:6px; background:#1e293b; border:1px solid #c084fc; color:#e9d5ff;">맹우: ${getCompName()} (Lv.${curLevel})</span>
          <span style="font-size:10.5px; font-weight:800; padding:2px 8px; border-radius:6px; background:${noCdCount > 0 ? '#0f291e' : '#7f1d1d'}; border:1px solid ${noCdCount > 0 ? '#10b981' : '#ef4444'}; color:${noCdCount > 0 ? '#6ee7b7' : '#fecaca'};">무쿨다운 기술: ${noCdCount}개</span>
        `;
      }
      if (warnEl) {
        if (noCdCount === 0) {
          warnEl.style.display = 'block';
          warnEl.innerHTML = `⚠️ <b>[무쿨다운 기술 미편성 주의]</b> 현재 동료 덱에 쿨다운 없는 기술이 하나도 없습니다! 적에게 <b>[행동 제약]</b>이 부여되거나 모든 기술이 쿨다운에 들어가면 동료가 행동할 수 없습니다.`;
        } else {
          warnEl.style.display = 'none';
        }
      }
    } else {
      if (!inspectedSkillId || !getBearerSkillById(inspectedSkillId) || getBearerSkillById(inspectedSkillId).cls !== pickedClass) {
        inspectedSkillId = bearerDeck[selectedDeckSlotIdx] || bearerDeck[0];
      }
      if (titleLbl) {
        titleLbl.innerText = `⚔️ ${bearerName} (${pickedClass}) 전투 5스킬 덱 (성좌 아이콘을 슬롯으로 드래그 앤 드롭 또는 클릭)`;
        titleLbl.style.color = '#7dd3fc';
      }
      let cantripCount = 0;
      let passiveCount = 0;
      if (activeSlotsEl) {
        activeSlotsEl.classList.remove('comp-slots-3');
        activeSlotsEl.innerHTML = bearerDeck.map((id, idx) => {
          const sk = getBearerSkillById(id);
          if (!sk) return '';
          if (sk.circle === '0') cantripCount++;
          if (sk.isPassive) passiveCount++;
          const isSelected = (idx === selectedDeckSlotIdx);
          const isInspected = (sk.id === inspectedSkillId);
          const costStr = sk.isPassive ? '패시브' : (sk.id === 'm_1_3' ? '장전' : `+${sk.cost}`);
          return `
            <div class="deck-slot-card icon-slot-card ${isSelected ? 'selected-slot' : ''} ${isInspected ? 'is-inspected-neon' : ''}"
                 data-skill-id="${sk.id}"
                 draggable="true"
                 ondragstart="onDeckSlotDragStart(event, ${idx}, '${sk.id}')"
                 ondragover="onDeckSlotDragOver(event)"
                 ondragleave="onDeckSlotDragLeave(event)"
                 ondrop="onDeckSlotDrop(event, ${idx})"
                 onmouseenter="setInspectedSkill('${sk.id}')"
                 onclick="selectDeckBuilderSlot(${idx})">
              <div class="slot-top-meta">
                <span style="color:${isSelected ? '#fbd38d' : '#94a3b8'};">슬롯 ${idx + 1}</span>
                <span class="skill-circle-pill c-${sk.circle}">${costStr}</span>
              </div>
              <div class="slot-icon-frame c-${sk.circle} ${getSkillIconStateClass(sk.id)}">
                ${getSkillIconHtml(sk)}
              </div>
              <div class="slot-skill-name">${sk.name}</div>
            </div>
          `;
        }).join('');
      }
      if (badgesEl) {
        badgesEl.innerHTML = `
          <span style="font-size:10.5px; font-weight:800; padding:2px 8px; border-radius:6px; background:#1e293b; border:1px solid #38bdf8; color:#93c5fd;">현재 성장: Lv.${curLevel}</span>
          <span style="font-size:10.5px; font-weight:800; padding:2px 8px; border-radius:6px; background:${passiveCount > 0 ? '#3b0764' : '#1e293b'}; border:1px solid ${passiveCount > 0 ? '#c084fc' : '#475569'}; color:#e9d5ff;">4Lv 패시브: ${passiveCount} / 1</span>
          <span style="font-size:10.5px; font-weight:800; padding:2px 8px; border-radius:6px; background:${cantripCount > 0 ? '#0f291e' : '#7f1d1d'}; border:1px solid ${cantripCount > 0 ? '#10b981' : '#ef4444'}; color:${cantripCount > 0 ? '#6ee7b7' : '#fecaca'};">캔트립: ${cantripCount}개</span>
        `;
      }
      if (warnEl) {
        if (cantripCount === 0) {
          warnEl.style.display = 'block';
          warnEl.innerHTML = `⚠️ <b>[캔트립 미편성 주의]</b> 현재 덱에 <b>캔트립(0서클 · 과열 +0)</b> 기술이 하나도 없습니다! 적에게 <b>[행동 제약]</b>이 부여될 경우 서클 기술을 사용할 수 없어 오직 <b>[강제 벤트]</b>만 선언해야 합니다.`;
        } else {
          warnEl.style.display = 'none';
        }
      }
    }

    // 좌측 성좌 캔버스 렌더링 (SVG 회로선 + 1~4 코어 허브 + 스킬 아이콘 노드)
    if (canvasEl) {
      const allSkills = isCompMode ? getCompSkillList(pickedComp) : getClassSkillList(pickedClass);
      const coordMap = isCompMode ? COMP_CONSTELLATION_COORDS : BEARER_CONSTELLATION_COORDS;

      let svgLines = [];
      // 1 - 2 - 3 - 4 - 1 완전한 90도 정마름모 백본 라인 (4변 동일 길이)
      [[1, 2, 2], [2, 3, 3], [3, 4, 4], [4, 1, 4]].forEach(([fromLv, toLv, reqLv]) => {
        const h1 = CONSTELLATION_HUBS[fromLv];
        const h2 = CONSTELLATION_HUBS[toLv];
        const isUnlocked = (curLevel >= reqLv || allowAllLevelSkills);
        svgLines.push(`<line class="constellation-backbone-line ${isCompMode ? 'comp-mode' : ''} ${isUnlocked ? 'unlocked' : ''}" x1="${h1.x}" y1="${h1.y}" x2="${h2.x}" y2="${h2.y}" />`);
      });

      let hubNodesHtml = [];
      let skillNodesHtml = [];

      [1, 2, 3, 4].forEach(lv => {
        const hub = CONSTELLATION_HUBS[lv];
        const isLvUnlocked = (curLevel >= lv || allowAllLevelSkills);
        hubNodesHtml.push(`
          <div class="constellation-hub-node ${isCompMode ? 'comp-mode' : ''} ${isLvUnlocked ? 'unlocked' : ''}" style="left:${hub.x}%; top:${hub.y}%;">
            <span class="hub-num">${lv}</span>
            <span class="hub-lbl">Lv.${lv}</span>
          </div>
        `);

        const tierSkills = allSkills.filter(s => s.reqLv === lv);
        const coords = coordMap[lv] || [];
        tierSkills.forEach((sk, idx) => {
          const pt = coords[idx] || { x: hub.x, y: hub.y - 12 };
          const eqIdx = isCompMode ? compDeck.indexOf(sk.id) : bearerDeck.indexOf(sk.id);
          const isEquipped = (eqIdx !== -1);
          const isInspected = (sk.id === inspectedSkillId);

          svgLines.push(`
            <line class="constellation-branch-line ${isLvUnlocked ? 'unlocked' : ''} ${isEquipped ? 'equipped' : ''} ${isInspected ? 'is-inspected-neon' : ''}"
                  data-skill-id="${sk.id}"
                  x1="${hub.x}" y1="${hub.y}" x2="${pt.x}" y2="${pt.y}" />
          `);

          const circleCls = isCompMode ? (sk.cd > 0 ? 'c-2' : 'c-0') : `c-${sk.circle}`;
          const eqBadgeText = isEquipped ? (isCompMode ? ['A','B','C'][eqIdx] : `${eqIdx + 1}`) : '';
          const eqBadgeHtml = isEquipped ? `<span class="node-equip-badge">${eqBadgeText}</span>` : '';
          const clickFn = isCompMode ? `equipCompSkillToDeck('${sk.id}')` : `equipSkillToDeck('${sk.id}')`;

          skillNodesHtml.push(`
            <div class="constellation-skill-node ${circleCls} ${isEquipped ? 'equipped' : ''} ${!isLvUnlocked ? 'locked-node' : ''} ${isInspected ? 'is-inspected-neon' : ''}"
                 style="left:${pt.x}%; top:${pt.y}%;"
                 data-skill-id="${sk.id}"
                 draggable="${isLvUnlocked ? 'true' : 'false'}"
                 ondragstart="onTreeNodeDragStart(event, '${sk.id}')"
                 onmouseenter="setInspectedSkill('${sk.id}')"
                 onclick="${clickFn}">
              <div class="node-icon-box ${getSkillIconStateClass(sk.id)}">
                ${getSkillIconHtml(sk)}
                ${eqBadgeHtml}
              </div>
              <span class="node-name-pill">${sk.name}</span>
            </div>
          `);
        });
      });

      canvasEl.innerHTML = `
        <div class="constellation-square-stage">
          <svg class="constellation-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
            ${svgLines.join('')}
          </svg>
          ${hubNodesHtml.join('')}
          ${skillNodesHtml.join('')}
        </div>
      `;
    }

    renderDeckInspectorPanel(inspectedSkillId);
  }

  function changeLevel(delta) {
    const target = curLevel + delta;
    if (target < 1 || target > 4) return;
    if (delta > 0) {
      curLevel = target;
      maxHp = BEARERS[pickedClass].hp + ((curLevel - 1) * 4) + (deathStack * 2);
      hp = Math.min(maxHp, hp + 4);
      compMaxHp = COMPS[pickedComp].hp + ((curLevel - 1) * 4);
      compHp = Math.min(compMaxHp, compHp + 4);
      playBeep(720, 'sine', 0.25);
      log(`🌟 <b>[레벨업: Lv.${curLevel}]</b> 최대 HP +4 (현재 HP +4 회복) 및 모든 직접 공격 피해 +1 가산! <button class="status-add-btn" style="margin-left:4px; border-color:#fbd38d; color:#fbd38d;" onclick="openRadialTreeModal()">🃏 Lv.${curLevel} 신규 전문화 스킬 편성하기</button>`);
    } else {
      curLevel = target;
      maxHp = BEARERS[pickedClass].hp + ((curLevel - 1) * 4) + (deathStack * 2);
      hp = Math.min(maxHp, hp);
      compMaxHp = COMPS[pickedComp].hp + ((curLevel - 1) * 4);
      compHp = Math.min(compMaxHp, compHp);
      playBeep(330, 'sine', 0.15);
      log(`📉 <b>[레벨 조정: Lv.${curLevel}]</b> 레벨을 1단계 하향했습니다.`);
    }
    refreshUI();
    saveSessionState();
  }

  function removeSenCFromQueueIfZero() {
    if (pickedComp === '센' && senCharge <= 0) {
      ['A', 'B', 'C'].forEach((tag, sIdx) => {
        const sk = getCompSkillById(compDeck[sIdx]);
        if (sk && sk.reqCharge && senCharge < sk.reqCharge) {
          const qIdx = actionQueue.findIndex(item => item.actor === 'comp' && item.key === tag);
          if (qIdx !== -1) {
            actionQueue.splice(qIdx, 1);
            renderQueueUI();
          }
        }
      });
    }
  }

  function adjHp(val) {
    if (val < 0 && combatStarted) {
      bearerTookHpDmgThisRound = true;
    }
    hp = Math.max(0, Math.min(maxHp, hp + val));
    playBeep(val > 0 ? 580 : 220, 'sine', 0.08);
    refreshUI();
    saveSessionState();
  }
  function adjShield(val) {
    if (val > 0) grantShield('bearer', shield + val, '수동 방어막 조정', true);
    else { shield = Math.max(0, shield + val); refreshUI(); saveSessionState(); }
  }
  function setShield(val) {
    if (val > 0) grantShield('bearer', val, '방어막 설정', true);
    else { shield = 0; playBeep(480, 'triangle', 0.1); refreshUI(); saveSessionState(); }
  }
  function adjCompShield(val) {
    if (val > 0) grantShield('comp', compShield + val, '동료 수동 방어막 조정', false);
    else { compShield = Math.max(0, compShield + val); refreshUI(); saveSessionState(); }
  }
  function setCompShield(val) {
    if (val > 0) grantShield('comp', val, '동료 수동 방어막 설정', false);
    else { compShield = 0; playBeep(480, 'triangle', 0.1); refreshUI(); saveSessionState(); }
  }
  function adjHeat(val) { heat = Math.max(0, Math.min(100, heat + val)); playBeep(320, 'sawtooth', 0.08); refreshUI(); saveSessionState(); }

  function useVent() {
    if (heat <= 0) return;
    if (shouldDemoteLogsOnNextAction) demoteOldRoundLogs();
    const cooled = Math.min(50, heat); heat = Math.max(0, heat - 50);
    playBeep(260, 'sawtooth', 0.25);

    const hadOverload = compStatuses.some(s => s.name.includes('과부하 조광'));
    if (hadOverload) {
      compStatuses = compStatuses.filter(s => !s.name.includes('과부하 조광'));
      renderStatuses();
      log(`💨 <b>[조광 해제]</b> 벤트 급속 냉각으로 인해 동료의 [과부하 조광] 버프가 즉시 해제되었습니다.`);
    }
    if (warGodSoulActive || bearerStatuses.some(s => s.name.includes('군신의 혼'))) {
      warGodSoulActive = false;
      bearerStatuses = bearerStatuses.filter(s => !s.name.includes('군신의 혼'));
      renderStatuses();
      log(`💨 <b>[군신의 혼 해제]</b> 벤트 급속 냉각으로 인해 파이터의 [군신의 혼] 상태가 즉시 해제되었습니다.`);
    }

    bearerActedThisRound = true;
    const firstSingleEnemy = getLivingSyncedEnemies().find(en => !en.isAoeIntent && !en.isChargeIntent);
    if (firstSingleEnemy) firstSingleEnemy.forceDis = true;
    if (typeof sendPlayerActionPacketToGm === 'function') {
      sendPlayerActionPacketToGm([{ kind: 'vent_dis', label: '강제 벤트(적 첫 단일 공격 불리함 강제)' }]);
    }
    log(`💨 <b>[강제 벤트]</b> 증기 배출! 과열 -${cooled} 냉각 (이어지는 이번 라운드 적의 첫 단일 공격${firstSingleEnemy ? `[🎯${firstSingleEnemy.name}]` : ''}에 [불리함] 강제 / 메이지 성염 장전은 해제되지 않음)`);
    recordActionBriefing(`▶ 베어러: [강제 벤트] ➔ 과열 -${cooled} 냉각 (적 첫 단일 공격 1회 불리함)`);
    refreshUI();
    saveSessionState();
  }

  function adjCompHp(val) {
    compHp = Math.max(0, Math.min(compMaxHp, compHp + val));
    playBeep(val > 0 ? 580 : 220, 'sine', 0.08);
    refreshUI();
    saveSessionState();
  }

  function toggleBagPopover(e) {
    if (e) e.stopPropagation();
    closeAllStatusMenus();
    const pop = document.getElementById('bag-popover');
    if (!pop) return;
    const isShown = (pop.style.display === 'flex');
    if (isShown) {
      pop.style.display = 'none';
      closePotionMenu();
    } else {
      pop.style.display = 'flex';
      playBeep(520, 'sine', 0.08);
    }
  }
  window.toggleBagPopover = toggleBagPopover;

  function closeBagPopover() {
    const pop = document.getElementById('bag-popover');
    if (pop) pop.style.display = 'none';
    closePotionMenu();
  }
  window.closeBagPopover = closeBagPopover;

  function adjPyrite(val) { pyrite = Math.max(0, pyrite + val); playBeep(val > 0 ? 750 : 380, 'sine', 0.08); log(`💎 <b>[장미 휘석]</b> ${val > 0 ? `+${val}개 획득` : `${val}개 소비`} (보유: <b>${pyrite}개</b>)`); refreshUI(); saveSessionState(); }
  function adjPotion(val) { potion = Math.max(0, potion + val); playBeep(val > 0 ? 680 : 360, 'sine', 0.08); log(`🧪 <b>[회복 영약]</b> ${val > 0 ? `+${val}병` : `${val}병 차감`} (보유: <b>${potion}병</b>)`); refreshUI(); saveSessionState(); }

  function openPotionMenu(e) {
    if (e) e.stopPropagation();
    const menu = document.getElementById('potion-target-menu');
    if (menu) menu.style.display = 'flex';
  }

  function closePotionMenu(e) {
    if (e) e.stopPropagation();
    const menu = document.getElementById('potion-target-menu');
    if (menu) menu.style.display = 'none';
  }

  function usePotion(target) {
    if (potion <= 0) {
      playBeep(240, 'sawtooth', 0.2);
      log(`⚠️ <b>[회복 영약 부족]</b> 소지 중인 회복 영약이 없습니다.`);
      closePotionMenu();
      return;
    }

    if (shouldDemoteLogsOnNextAction) demoteOldRoundLogs();
    potion--;
    const healAmp = hasBearerPassive('치유 증폭') ? 3 : 0;
    const healAmt = 5 + healAmp;
    const ampStr = healAmp > 0 ? ' [치유 증폭 +3!]' : '';

    if (target === 'bearer') {
      hp = Math.min(maxHp, hp + healAmt);
      playBeep(640, 'sine', 0.2);
      log(`🧪 <b>[회복 영약 복용 (1행동 소모)]</b> 베어러의 HP가 <b>+${healAmt}</b>${ampStr} 회복되었습니다. (현재 HP: <b>${hp}/${maxHp}</b> / 남은 영약: <b>${potion}병</b>)`);
      recordActionBriefing(`▶ [소모품: 회복 영약 (1행동 소모)] ➔ 베어러 HP +${healAmt}${ampStr} 회복 (현재 HP: ${hp}/${maxHp}, 남은 영약: ${potion}병)`);
    } else {
      const wasDown = (compHp <= 0);
      compHp = Math.min(compMaxHp, compHp + healAmt);
      playBeep(640, 'sine', 0.2);
      if (wasDown) {
        compRevivedThisRound = true;
        actionQueue = actionQueue.filter(item => item.actor !== 'comp');
        applyTargetStatus('comp', '🛡️ 재정비 중 (행동불가·단일타겟면역)', 'buff', '부활 당해 라운드 행동 불가 · 다음 라운드 시작 전까지 적 단일 공격 대상에서 제외');
        renderQueueUI();
        log(`🧪 <b>[동료 전선 복귀 (1행동 소모)]</b> 탈진했던 ${getCompName()}에게 영약을 투여하여 HP <b>+${compHp}</b>${ampStr}(으)로 부활시켰습니다! (이번 라운드 행동 불가, 다음 라운드 시작 전까지 적 단일 공격 대상 제외)`);
        recordActionBriefing(`▶ [소모품: 회복 영약 (1행동 소모)] ➔ 탈진한 ${getCompName()} HP ${compHp}${ampStr} 부활! (이번 라운드 동료 행동 불가 & 다음 라운드까지 단일 공격 타겟 제외)`);
      } else {
        log(`🧪 <b>[동료 영약 치료 (1행동 소모)]</b> ${getCompName()}의 HP가 <b>+${healAmt}</b>${ampStr} 회복되었습니다. (현재 HP: <b>${compHp}/${compMaxHp}</b> / 남은 영약: <b>${potion}병</b>)`);
        recordActionBriefing(`▶ [소모품: 회복 영약 (1행동 소모)] ➔ ${getCompName()} HP +${healAmt}${ampStr} 회복 (현재 HP: ${compHp}/${compMaxHp}, 남은 영약: ${potion}병)`);
      }
    }
    closePotionMenu();
    refreshUI();
    saveSessionState();
  }

  function buyPotion() {
    if (pyrite < 3) {
      playBeep(240, 'sawtooth', 0.2);
      log(`⚠️ <b>[장미 휘석 부족]</b> 회복 영약 1병을 구매하려면 <b>장미 휘석 3개</b>가 필요합니다! (현재 보유: <b>${pyrite}개</b> / 부족: <b>${3 - pyrite}개</b>)`);
      return;
    }
    pyrite -= 3;
    potion += 1;
    playBeep(680, 'sine', 0.18);
    log(`🧪 <b>[회복 영약 구매]</b> 장미 휘석 3개를 지불하여 <b>회복 영약 1병</b>을 구매했습니다! (잔여 휘석: <b>${pyrite}개</b> / 영약 보유: <b>${potion}병</b>)`);
    refreshUI();
    saveSessionState();
  }

  function adjDeathStack(val) {
    if (val < 0 && deathStack <= 0) return;
    deathStack += val;
    maxHp = Math.max(BEARERS[pickedClass].hp + ((curLevel - 1) * 4), BEARERS[pickedClass].hp + ((curLevel - 1) * 4) + (deathStack * 2));
    if (val > 0) {
      combatStarted = false; curRound = 1;
      hp = maxHp; compHp = compMaxHp; heat = 0; shield = 0; compShield = 0; senCharge = 0;
      compCds = { A: 0, B: 0, C: 0 }; compCd = 0; compRevivedThisRound = false; bearerActedThisRound = false; compActedThisRound = false;
      mageChargedSpells = []; warGodSoulActive = false; blazingBladeActive = false;
      bearerStatuses = []; compStatuses = []; actionQueue = [];
      renderStatuses(); renderQueueUI();
      playBeep(180, 'sine', 0.4);
      log(`🩸 <b>[생환 발동]</b> 창세신의 안수로 안전 거점에서 기상했습니다. 베어러 최대 HP 영구 +2 (현재 <b>${hp}/${maxHp}</b>) 및 동료(${getCompName()}) HP 전량 회복(<b>${compHp}/${compMaxHp}</b>), 과열/방어막 0 초기화! (생환 스택: <b>${deathStack}점</b> 누적)`);
    } else {
      hp = Math.min(maxHp, hp);
      playBeep(320, 'sine', 0.08);
      log(`🩸 <b>[생환 스택 차감]</b> 생환 스택이 <b>${deathStack}점</b>으로 조정되었습니다. (최대 HP: <b>${maxHp}</b>, 현재 HP: <b>${hp}/${maxHp}</b>)`);
    }
    refreshUI();
    saveSessionState();
  }

  function adjSenCharge(val) {
    const prev = senCharge; senCharge = Math.max(0, Math.min(3, senCharge + val));
    if (senCharge !== prev) {
      playBeep(620, 'triangle', 0.1);
      log(`🔮 <b>[차징]</b> 센의 마탄 차징: <b>${senCharge} / 3</b>`);
      removeSenCFromQueueIfZero();
      refreshUI();
      saveSessionState();
    }
  }
  function resetSenCharge() {
    senCharge = 0;
    playBeep(280, 'sine', 0.08);
    log(`🔮 <b>[차징 리셋]</b> 마탄 스택을 초기화했습니다.`);
    removeSenCFromQueueIfZero();
    refreshUI();
    saveSessionState();
  }

  function restAtInn() {
    if (pyrite < 6) {
      playBeep(240, 'sawtooth', 0.2);
      log(`⚠ <b>[장미 휘석 부족]</b> 여관 숙박에는 <b>장미 휘석 6개</b>가 필요합니다! (현재 보유: <b>${pyrite}개</b> / 부족: <b>${6 - pyrite}개</b>)<br><span style="font-size:10.5px; color:#94a3b8;">💡 휘석이 부족할 때는 우측의 <b>[🏕️ 응급 야영 판정]</b>을 통해 체력을 회복하십시오.</span>`);
      return;
    }
    pyrite -= 6;
    combatStarted = false; curRound = 1;
    hp = maxHp; compHp = compMaxHp; heat = 0; shield = 0; compShield = 0; senCharge = 0;
    compCds = { A: 0, B: 0, C: 0 }; compCd = 0; compRevivedThisRound = false; bearerActedThisRound = false; compActedThisRound = false;
    mageChargedSpells = []; warGodSoulActive = false; blazingBladeActive = false;
    bearerStatuses = []; compStatuses = [];
    playBeep(660, 'sine', 0.25);
    log(`🛏️ <b>[여관 숙박 완료]</b> 장미 휘석 6개 소비 (잔여: <b>${pyrite}개</b>) ➔ 파티 전원 HP 완전 회복, 과열/방어막 0 초기화 및 모든 상태이상 완치!<br>🔥 <b>[막간의 교감]</b> 동료와 나눈 대화의 온기에 따라 불꽃을 선택하세요: <button class="status-add-btn" style="border-color:#38bdf8; color:#bae6fd; margin-left:4px;" onclick="acquireCommunionFlame('shine')">🌟 비추는 불꽃</button> <button class="status-add-btn" style="border-color:#f59e0b; color:#fde68a; margin-left:4px;" onclick="acquireCommunionFlame('burn')">🔥 태우는 불꽃</button>`);
    renderStatuses(); refreshUI(); saveSessionState();
  }

  function rollCampSearchDice() {
    demoteOldRoundLogs();
    let d1 = Math.floor(Math.random() * 20) + 1;
    let d2 = Math.floor(Math.random() * 20) + 1;
    let isAdv = (diceMode === 'adv');
    let isDis = (diceMode === 'dis');
    let raw = isAdv ? Math.max(d1, d2) : (isDis ? Math.min(d1, d2) : d1);
    let formulaStr = isAdv ? `2d20 High (${d1}, ${d2}) ➔ ${raw}` : (isDis ? `2d20 Low (${d1}, ${d2}) ➔ ${raw}` : `1d20(${d1})`);
    if (diceMode !== 'auto') { diceMode = 'auto'; updateDiceModeUI(); }
    const isExplorer = (pickedClass === '등지기');
    const mod = isExplorer ? 3 : 0;
    animateDiceAdvanced(raw, mod, '은신처 탐색', formulaStr, () => {
      log(`🏕 <b>[응급 야영 은신처 탐색 판정]</b> ➔ ${formulaStr} | 특기(+3): <b>${raw + 3}</b> · 일반(+0): <b>${raw}</b> · 동료 단독(+2): <b>${raw + 2}</b> (DC 10 ➔ 13 ➔ 16 대조)<br><button class="status-add-btn" style="background:#14532d; color:#86efac; border-color:#22c55e; padding:4px 8px; margin-top:3px;" onclick="applyCampRecovery(this)">👉 [성공 시: 파티 HP +6 회복 & 자연 냉각]</button>`);
      recordActionBriefing(`▶ [응급 야영 판정] ➔ ${formulaStr} | 특기(+3): ${raw + 3} / 일반(+0): ${raw} / 동료 단독(+2): ${raw + 2} (DC 10➔13➔16)`);
    });
  }

  function applyCampRecovery(btn) {
    if (btn) { btn.disabled = true; btn.innerText = '✓ [야영 휴식 완료]'; }
    hp = Math.min(maxHp, hp + 6);
    if (compHp > 0) compHp = Math.min(compMaxHp, compHp + 6);
    heat = 0; playBeep(620, 'sine', 0.2);
    log(`✨ <b>[야영 성공]</b> 베어러 및 동료 HP +6 회복 및 과열 자연 냉각(0) 완료!<br>🔥 <b>[막간의 교감]</b> 야영지 모닥불 앞에서 피어난 불꽃을 선택하세요: <button class="status-add-btn" style="border-color:#38bdf8; color:#bae6fd; margin-left:4px;" onclick="acquireCommunionFlame('shine')">🌟 비추는 불꽃</button> <button class="status-add-btn" style="border-color:#f59e0b; color:#fde68a; margin-left:4px;" onclick="acquireCommunionFlame('burn')">🔥 태우는 불꽃</button>`);
    recordActionBriefing(`   ↳ ✨ [야영 성공] 아군 전체 HP +6 회복 & 과열 0 자연 냉각 (베어러 HP: ${hp}/${maxHp}, 동료 HP: ${compHp}/${compMaxHp})`);
    refreshUI(); saveSessionState();
  }

  function rollMiningCheck(e) {
    if (e) e.stopPropagation();
    if (!pickedOrigin || !pickedOrigin.includes('카른')) return;
    demoteOldRoundLogs();
    closeBagPopover();
    let d1 = Math.floor(Math.random() * 20) + 1;
    let isSuccess = (d1 >= 13);
    animateDiceAdvanced(d1, 0, '채취 판정', `순수 1d20(${d1})`, () => {
      if (isSuccess) {
        pyrite++;
        playBeep(750, 'sine', 0.15);
        log(`⛏️ <b>[심토의 안목: 채취 판정]</b> ➔ 순수 1d20(${d1}) = <b>${d1}</b> (DC 13) ➔ <b style="color:#68d391;">성공!</b> 장미 휘석 +1 추가 채취 완료! (보유: <b>${pyrite}개</b>)`);
        recordActionBriefing(`▶ [심토의 안목: 채취 판정] ➔ 순수 1d20(${d1}) ≥ 13 성공! 장미 휘석 +1 추가 채취 (보유: ${pyrite}개)`);
      } else {
        playBeep(240, 'sawtooth', 0.15);
        log(`⛏️ <b>[심토의 안목: 채취 판정]</b> ➔ 순수 1d20(${d1}) = <b>${d1}</b> (DC 13) ➔ <b style="color:#fc8181;">실패</b> (휘석 추가 획득 실패)`);
        recordActionBriefing(`▶ [심토의 안목: 채취 판정] ➔ 순수 1d20(${d1}) < 13 실패`);
      }
      refreshUI();
      saveSessionState();
    });
  }

  function loadNotebook() {
    try {
      const saved = localStorage.getItem('fifth_hand_notebook') || '';
      document.getElementById('adventure-notebook-text').value = saved;
    } catch(e) {}
  }

  let notebookSaveDebounceTimer = null;
  function saveNotebook() {
    const lbl = document.getElementById('notebook-status-lbl');
    if (lbl) lbl.innerText = '저장 중...';

    if (notebookSaveDebounceTimer) clearTimeout(notebookSaveDebounceTimer);
    notebookSaveDebounceTimer = setTimeout(() => {
      const val = document.getElementById('adventure-notebook-text').value;
      try { 
        localStorage.setItem('fifth_hand_notebook', val); 
        if (lbl) lbl.innerText = '자동 저장 완료';
      } catch(e) {
        if (lbl) lbl.innerText = '저장 실패(용량 초과)';
      }
      notebookSaveDebounceTimer = null;
    }, 300);
  }
  let clearNotebookArmed = false;
  function clearNotebook(btn) {
    if (!clearNotebookArmed) {
      clearNotebookArmed = true;
      const targetBtn = btn || document.querySelector("button[onclick*='clearNotebook']");
      if (targetBtn) {
        const orig = targetBtn.innerText;
        targetBtn.innerText = '한번 더 클릭';
        targetBtn.style.color = '#fca5a5';
        setTimeout(() => {
          clearNotebookArmed = false;
          targetBtn.innerText = orig;
          targetBtn.style.color = '';
        }, 2000);
      }
      return;
    }
    clearNotebookArmed = false;
    document.getElementById('adventure-notebook-text').value = '';
    saveNotebook();
    log(`📖 <b>[수첩 정리]</b> 내용을 지웠습니다.`);
  }

  function toggleEnemyVuln() {
    enemyVuln = !enemyVuln;
    enemyVulnCharges = enemyVuln ? (hasBearerPassive('강경 속박') ? 2 : 1) : 0;
    updateEnemyVulnUI();
    playBeep(enemyVuln ? 680 : 320, 'triangle', 0.08);
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  }
  function updateEnemyVulnUI() {
    const btn = document.getElementById('btn-enemy-vuln');
    if (btn) {
      btn.className = enemyVuln ? 'btn-dice-mode active-vuln' : 'btn-dice-mode';
      btn.innerText = (enemyVuln && enemyVulnCharges > 1) ? `⚠️ 방어약화(+3·${enemyVulnCharges}회)` : '⚠️ 방어약화(+3)';
    }
  }

  function applyTargetStatus(target, name, type, desc, acMod = 0) {
    if (target === 'bearer') {
      bearerStatuses = bearerStatuses.filter(s => s.name !== name);
      bearerStatuses.push({ id: 'st_b_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4), name, type, desc, acMod });
    } else {
      compStatuses = compStatuses.filter(s => s.name !== name);
      compStatuses.push({ id: 'st_c_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4), name, type, desc, acMod });
    }
    renderStatuses();
    saveSessionState();
  }

  function addBearerStatus(name, type, desc, acMod = 0) {
    if (type === 'debuff' && (warGodSoulActive || bearerStatuses.some(s => s.name.includes('군신의 혼')))) {
      playBeep(520, 'sine', 0.12);
      log(`🛡️ <b>[군신의 혼 완전 면역]</b> 파이터의 [군신의 혼]이 활성화되어 있어 <b>[${name}]</b> 상태이상에 걸리지 않습니다!`);
      closeAllStatusMenus();
      return;
    }
    if (name.includes('행동 제약') && isBearerImmuneToRestriction()) {
      playBeep(520, 'sine', 0.12);
      log(`🛡️ <b>[행동 제약 면역]</b> 현재 방어막/버프 효과로 인해 베어러는 <b>[행동 제약]</b>에 걸리지 않습니다!`);
      closeAllStatusMenus();
      return;
    }
    const isStackableDot = name.startsWith('지속 피해');
    if (isStackableDot || !bearerStatuses.some(s => s.name === name)) {
      bearerStatuses.push({ id: 'st_b_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4), name, type, desc, acMod });
      playBeep(type === 'debuff' ? 320 : 640, 'triangle', 0.12);
      log(`${type === 'debuff' ? '⚠️ 상태이상' : '🛡 버프'}: <b>[${name}]</b> (${desc})`);
      if (type === 'debuff' && hasBearerPassive('강인함')) {
        grantShield('bearer', 5, '강인함 패시브');
      }
    }
    closeAllStatusMenus(); renderStatuses(); refreshUI(); saveSessionState();
  }
  function removeBearerStatus(id) {
    const target = bearerStatuses.find(s => s.id === id);
    if (target && target.name.includes('군신의 혼')) warGodSoulActive = false;
    bearerStatuses = bearerStatuses.filter(s => s.id !== id);
    playBeep(380, 'sine', 0.08); renderStatuses(); refreshUI(); saveSessionState();
  }
  function clearBearerStatuses() { bearerStatuses = []; warGodSoulActive = false; playBeep(300, 'sine', 0.1); renderStatuses(); refreshUI(); saveSessionState(); }

  function addCompStatus(name, type, desc, acMod = 0) {
    if (name.includes('행동 제약') && isCompImmuneToRestriction()) {
      playBeep(520, 'sine', 0.12);
      log(`🛡️ <b>[행동 제약 면역]</b> ${getCompName()}은(는) [투지 발휘] 효과로 인해 <b>[행동 제약]</b>에 걸리지 않습니다!`);
      closeAllStatusMenus();
      return;
    }
    const isStackableDot = name.startsWith('지속 피해');
    if (isStackableDot || !compStatuses.some(s => s.name === name)) {
      compStatuses.push({ id: 'st_c_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4), name, type, desc, acMod });
      playBeep(type === 'debuff' ? 320 : 640, 'triangle', 0.12);
      log(`🤝 <b>[동료 상태]</b> [${name}] (${desc})`);
    }
    closeAllStatusMenus(); renderStatuses(); refreshUI(); saveSessionState();
  }
  function removeCompStatus(id) {
    const target = compStatuses.find(s => s.id === id);
    if (target && target.name.includes('타오르는 칼날')) blazingBladeActive = false;
    compStatuses = compStatuses.filter(s => s.id !== id);
    playBeep(380, 'sine', 0.08); renderStatuses(); refreshUI(); saveSessionState();
  }
  function clearCompStatuses() { compStatuses = []; blazingBladeActive = false; playBeep(300, 'sine', 0.1); renderStatuses(); refreshUI(); saveSessionState(); }

  function renderStatuses() {
    const createChipHtml = (s, removeFn) => {
      const isBuff = s.type === 'buff';
      const isSystemOverheat = Boolean(s.isOverheatState);
      const badgeText = isSystemOverheat ? '과열 단계' : (isBuff ? '전술 버프' : '상태이상');
      const clickAttr = isSystemOverheat ? '' : `onclick="${removeFn}('${s.id}')"`;
      const closeIconHtml = isSystemOverheat ? '' : `<span style="opacity:0.6; font-size:9px; margin-left:2px;">✕</span>`;
      const footerHtml = isSystemOverheat
        ? `<div class="status-tooltip-footer">과열 70 미만 냉각 시 자동 해제</div>`
        : `<div class="status-tooltip-footer">✕ 클릭 시 상태 해제</div>`;
      return `
        <div class="status-chip ${s.type}" ${clickAttr}>
          <span>${s.name}</span>
          ${closeIconHtml}
          <div class="status-tooltip-card ${s.type}">
            <div class="status-tooltip-header">
              <span class="status-tooltip-title">${s.name}</span>
              <span class="status-tooltip-badge">${badgeText}</span>
            </div>
            <div class="status-tooltip-desc">${s.desc}</div>
            ${footerHtml}
          </div>
        </div>
      `;
    };

    const bearerTray = document.getElementById('bearer-status-tray');
    if (bearerTray) {
      const displayBearerStatuses = [];
      const hasResistance = hasBearerPassive('성염 저항');
      if (heat >= 100) {
        displayBearerStatuses.push({
          id: 'sys_overheat_critical',
          name: `🔥 임계 (피해+2${hasResistance ? '·AC면제' : '·AC-2'})`,
          type: 'debuff',
          isOverheatState: true,
          desc: `과열 임계(100): 베어러 직접 타격 피해 +2 증가 / 방어도(AC) ${hasResistance ? '페널티 면제([성염 저항])' : '-2 감소'}. 100 초과 시 초과량 10당 실제 HP 1 자해 피해(방어막 무시) 발생!`
        });
      } else if (heat >= 70) {
        displayBearerStatuses.push({
          id: 'sys_overheat_warning',
          name: `⚠️ 경고 (피해+1${hasResistance ? '·AC면제' : '·AC-1'})`,
          type: 'debuff',
          isOverheatState: true,
          desc: `과열 경고(70~99): 베어러 직접 타격 피해 +1 증가 / 방어도(AC) ${hasResistance ? '페널티 면제([성염 저항])' : '-1 감소'}. 100 초과 시 초과량 10당 실제 HP 1 자해 피해 발생.`
        });
      }
      displayBearerStatuses.push(...bearerStatuses);

      bearerTray.innerHTML = (displayBearerStatuses.length === 0) 
        ? '<span class="status-empty-text">적용 중인 상태가 없습니다.</span>' 
        : displayBearerStatuses.map(s => createChipHtml(s, 'removeBearerStatus')).join('');
    }
    const compTray = document.getElementById('comp-status-tray');
    if (compTray) {
      compTray.innerHTML = (compStatuses.length === 0) 
        ? '<span class="status-empty-text">적용 중인 상태가 없습니다.</span>' 
        : compStatuses.map(s => createChipHtml(s, 'removeCompStatus')).join('');
    }
  }

  function elevateMenuParentPanel(menuEl) {
    document.querySelectorAll('.menu-open-elevated').forEach(el => el.classList.remove('menu-open-elevated'));
    if (!menuEl) return;
    const panel = menuEl.closest('.panel-box');
    if (panel) panel.classList.add('menu-open-elevated');
    const stack = menuEl.closest('.left-bottom-stack, .right-skills-stack');
    if (stack) stack.classList.add('menu-open-elevated');
    const colStack = menuEl.closest('.left-column-stack, .right-column-stack');
    if (colStack) colStack.classList.add('menu-open-elevated');
  }

  function closeAllStatusMenus() {
    const menus = document.querySelectorAll('.status-modal-menu');
    menus.forEach(m => m.style.display = 'none');
    document.querySelectorAll('.menu-open-elevated').forEach(el => el.classList.remove('menu-open-elevated'));
  }

  function toggleBearerStatusMenu(e) {
    if (e) e.stopPropagation();
    const menu = document.getElementById('bearer-status-menu');
    if (!menu) return;
    const isShown = menu.style.display === 'flex';
    closeAllStatusMenus();
    if (!isShown) {
      menu.style.display = 'flex';
      elevateMenuParentPanel(menu);
    }
  }

  function toggleCompStatusMenu(e) {
    if (e) e.stopPropagation();
    const menu = document.getElementById('comp-status-menu');
    if (!menu) return;
    const isShown = menu.style.display === 'flex';
    closeAllStatusMenus();
    if (!isShown) {
      menu.style.display = 'flex';
      elevateMenuParentPanel(menu);
    }
  }

  function adjSingleCompCd(tag, val, e) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    closeAllStatusMenus();
    ensureValidCompDeck(false);
    const cur = compCds[tag] || 0;
    const next = Math.max(0, cur + val);
    compCds[tag] = next;
    if (next > 0) {
      const qIdx = actionQueue.findIndex(item => item.actor === 'comp' && item.key === tag);
      if (qIdx !== -1) {
        actionQueue.splice(qIdx, 1);
        renderQueueUI();
      }
    }
    compCd = Math.max(compCds.A || 0, compCds.B || 0, compCds.C || 0);
    playBeep(val > 0 ? 420 : 520, 'sine', 0.08);
    refreshUI();
    saveSessionState();
  }
  window.adjSingleCompCd = adjSingleCompCd;

  function adjCompCd(val) {
    ensureValidCompDeck(false);
    ['A', 'B', 'C'].forEach((tag, idx) => {
      const sk = getCompSkillById(compDeck[idx]);
      const cur = compCds[tag] || 0;
      if (val < 0 || cur > 0 || (sk && sk.cd > 0)) {
        compCds[tag] = Math.max(0, cur + val);
      }
    });
    compCd = Math.max(compCds.A || 0, compCds.B || 0, compCds.C || 0);
    playBeep(360, 'sine', 0.08);
    refreshUI();
    saveSessionState();
  }

  function commitCompSlotOption(tag, optPatch, e) {
    if (e) e.stopPropagation();
    compSlotOptions[tag] = Object.assign({}, compSlotOptions[tag] || {}, optPatch);
    if (optPatch && optPatch.enemyUid) {
      selectedCompTargetUid = optPatch.enemyUid;
    }
    closeAllStatusMenus();
    executeCompSkillImmediate(tag);
  }
  window.commitCompSlotOption = commitCompSlotOption;

  function openCompSlotPopup(tag, htmlContent) {
    closeAllStatusMenus();
    const wrapEl = (DOM.compWraps && DOM.compWraps[tag]) || document.getElementById(`wrap-comp-${tag}`);
    triggerSkillSlamImpact(wrapEl, false);
    const pop = (DOM.compPopups && DOM.compPopups[tag]) || document.getElementById(`popup-comp-${tag}`);
    if (!pop) return;
    const slotIdx = (tag === 'A') ? 0 : ((tag === 'B') ? 1 : 2);
    const sk = getCompSkillById(compDeck[slotIdx]);
    const needsEnemyPicker = sk && ((sk.isAttack && !sk.isAoe) || sk.id === 'so_1_2' || sk.id === 'so_1_3' || sk.id === 'so_2_2' || sk.id === 'so_3_2' || sk.id === 'so_4_1' || sk.id === 'r_2_1');
    const pickerHtml = (needsEnemyPicker && typeof buildPopupTargetPickerHtml === 'function') ? buildPopupTargetPickerHtml('comp', tag) : '';
    pop.innerHTML = pickerHtml + htmlContent;
    pop.style.display = 'flex';
    elevateMenuParentPanel(pop);
  }

  function setDiceMode(mode) {
    if (diceMode === mode && mode !== 'auto') {
      diceMode = 'auto';
    } else {
      diceMode = mode;
    }
    updateDiceModeUI();
    playBeep(diceMode === 'adv' ? 620 : (diceMode === 'dis' ? 280 : 440), 'sine', 0.08);
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  }
  function updateDiceModeUI() {
    document.getElementById('btn-mode-auto').className = (diceMode === 'auto') ? 'btn-dice-mode active-auto' : 'btn-dice-mode';
    document.getElementById('btn-mode-adv').className = (diceMode === 'adv') ? 'btn-dice-mode active-adv' : 'btn-dice-mode';
    document.getElementById('btn-mode-dis').className = (diceMode === 'dis') ? 'btn-dice-mode active-dis' : 'btn-dice-mode';
  }

