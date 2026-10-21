/* ==========================================================================
     [Phase 3] 베어러 5스킬 덱 슬롯 클릭 & 인라인 전술 팝업 선택기
     ========================================================================== */
  function commitBearerSlotOption(slotIdx, optPatch, e) {
    if (e) e.stopPropagation();
    slotRunOptions[slotIdx] = Object.assign({}, slotRunOptions[slotIdx] || {}, optPatch);
    if (optPatch && optPatch.enemyUid) {
      selectedBearerTargetUid = optPatch.enemyUid;
    }
    closeAllStatusMenus();
    executeBearerSkillImmediate(slotIdx);
  }
  window.commitBearerSlotOption = commitBearerSlotOption;

  function openSlotPopup(slotIdx, htmlContent) {
    closeAllStatusMenus();
    const cardEl = (DOM.skillCards && DOM.skillCards[slotIdx]) || document.getElementById(`card-bearer-${slotIdx}`);
    triggerSkillSlamImpact(cardEl, false);
    const pop = (DOM.skillPopups && DOM.skillPopups[slotIdx]) || document.getElementById(`popup-bearer-${slotIdx}`);
    if (!pop) return;
    const sk = getBearerSkillById(bearerDeck[slotIdx]);
    const needsEnemyPicker = sk && (sk.isAttack && !sk.isAoe || sk.id === 's_1_4' || sk.id === 'm_3_1' || sk.id === 'l_3_1' || sk.id === 'l_3_2');
    const pickerHtml = (needsEnemyPicker && typeof buildPopupTargetPickerHtml === 'function') ? buildPopupTargetPickerHtml('bearer', slotIdx) : '';
    pop.innerHTML = pickerHtml + htmlContent;
    pop.style.display = 'flex';
    elevateMenuParentPanel(pop);
  }

  function selectBearerSkill(slotIdx, e, fromDrop = false) {
    if (isExecuting) return;
    if (e) e.stopPropagation();
    const myPop = (DOM.skillPopups && DOM.skillPopups[slotIdx]) || document.getElementById(`popup-bearer-${slotIdx}`);
    if (myPop && myPop.style.display === 'flex') {
      closeAllStatusMenus();
      playBeep(320, 'sine', 0.08);
      return;
    }
    closeAllStatusMenus();
    ensureValidBearerDeck(false);

    const skillId = bearerDeck[slotIdx];
    const sk = getBearerSkillById(skillId);
    if (!sk) return;

    if (sk.isPassive) {
      playBeep(520, 'sine', 0.08);
      log(`✨ <b>[4Lv 패시브 상시 적용 중]</b> [${sk.name}]: ${sk.desc}`);
      return;
    }
    if (!fromDrop) {
      playBeep(360, 'sine', 0.06);
      const f = DOM.diceFormula || document.getElementById('dice-formula-display');
      if (f) f.innerText = `🎯 [${sk.name}] 아이콘을 드래그(점선)하여 적 또는 아군 상태창에 놓아야 발동합니다!`;
      return;
    }
    if (bearerActedThisRound) {
      playBeep(220, 'sawtooth', 0.16);
      log(`⏳ <b>[베어러 행동 완료]</b> 이번 라운드 베어러의 행동(1회)을 이미 소모했습니다. (우측 <b>[⏭️ 라운드 종료]</b>를 누르거나 타이틀 우측 <b>[✓ 행동 완료]</b> 배지를 클릭해 재활성화할 수 있습니다.)`);
      return;
    }

    const existingIdx = actionQueue.findIndex(item => item.actor === 'bearer');
    if (existingIdx !== -1 && actionQueue[existingIdx].key === slotIdx) {
      actionQueue.splice(existingIdx, 1);
      closeAllStatusMenus();
      const cardEl = (DOM.skillCards && DOM.skillCards[slotIdx]) || document.getElementById(`card-bearer-${slotIdx}`);
      triggerSkillSlamImpact(cardEl, true);
      renderQueueUI();
      refreshUI();
      return;
    }

    const isRestricted = bearerStatuses.some(s => s.name.includes('행동 제약')) && !isBearerImmuneToRestriction();
    if (isRestricted && sk.circle !== '0' && !sk.ignoreRestriction) {
      playBeep(220, 'sawtooth', 0.2);
      log(`⛓️ <b>[행동 제약 발동 중]</b> 현재 <b>[행동 제약]</b> 상태이므로 서클 기술([${sk.name}])을 시전할 수 없습니다! (오직 <b>캔트립(0서클)</b> 또는 <b>강제 벤트</b>만 선언 가능)`);
      return;
    }

    if (sk.reqHeat && heat < sk.reqHeat) {
      playBeep(220, 'sawtooth', 0.2);
      log(`⚠️ <b>[시전 불가]</b> [${sk.name}] 기술은 현재 [과열 ${sk.reqHeat} 이상] 상태에서만 시전할 수 있습니다! (현재 과열: ${heat}/100)`);
      return;
    }
    if (sk.reqHalfHp && (hp * 2 > maxHp)) {
      playBeep(220, 'sawtooth', 0.2);
      log(`⚠️ <b>[시전 불가]</b> [${sk.name}] 기술은 베어러의 현재 HP가 절반(50%) 이하일 때만 시전할 수 있습니다! (현재 HP: ${hp}/${maxHp})`);
      return;
    }
    if (sk.reqCompAlive && compHp <= 0) {
      playBeep(220, 'sawtooth', 0.2);
      log(`⚠️ <b>[시전 불가]</b> 동료(${getCompName()})가 현재 탈진(HP 0) 상태이므로 [${sk.name}] 기술을 시전할 수 없습니다!`);
      return;
    }

    if (sk.id === 'l_1_1') {
      const btns = [0, 10, 20, 30, 40, 50].map(cVal => {
        if (isRestricted && cVal > 0) {
          return `<button class="status-modal-item" disabled style="opacity:0.4; cursor:not-allowed;">⛓️ 과열 +${cVal} 선언 불가 ([행동 제약] 중에는 과열 0만 가능)</button>`;
        }
        const dmgVal = (cVal === 0) ? 4 : (2 + (cVal / 10) * 2);
        const typeNote = (cVal === 0) ? '일반 캔트립 · 스침 없음' : '서클 기술 · 스침 2 보장';
        return `<button class="status-modal-item" onclick="commitBearerSlotOption(${slotIdx}, { varCost: ${cVal} }, event)">🏮 과열 +${cVal} 선언 (단일 ${dmgVal} 피해 · ${typeNote})</button>`;
      }).join('');
      openSlotPopup(slotIdx, `<div style="font-size:10px; color:#fde68a; font-weight:bold; border-bottom:1px solid #282f44; padding-bottom:3px;">🏮 [인광탄] 가변 과열 선언 (0~50)</div>${btns}`);
      return;
    }

    if (sk.circle === 'var') {
      const title = (sk.id === 'f_3_3') ? '🔥 성염 인챈트 과열 선언 (10~50)' : '☄️ 불꽃의 비 과열 선언 (10~50)';
      const btns = [10, 20, 30, 40, 50].map(cVal => {
        const dmgVal = (cVal / 10) * 2;
        const extra = (sk.id === 'f_3_3') ? ` · 피격 -${cVal / 10}` : ((heat + cVal >= 70) ? ' · 차턴 피해+3' : '');
        return `<button class="status-modal-item" onclick="commitBearerSlotOption(${slotIdx}, { varCost: ${cVal} }, event)">⚡ 과열 +${cVal} 선언 (광역 ${dmgVal} 피해${extra})</button>`;
      }).join('');
      openSlotPopup(slotIdx, `<div style="font-size:10px; color:#67e8f9; font-weight:bold; border-bottom:1px solid #282f44; padding-bottom:3px;">${title}</div>${btns}`);
      return;
    }

    if (sk.id === 'f_1_4') {
      openSlotPopup(slotIdx, `
        <div style="font-size:10px; color:#fbd38d; font-weight:bold; border-bottom:1px solid #282f44; padding-bottom:3px;">🛡️ [백색 철벽] 수호 방식 선언</div>
        <button class="status-modal-item" onclick="commitBearerSlotOption(${slotIdx}, { guardMode: 'normal' }, event)">🛡️ 일반 전개: 방어막 9 + 베어러 피격 -3 (자신만 보호)</button>
        <button class="status-modal-item" onclick="commitBearerSlotOption(${slotIdx}, { guardMode: 'devoted' }, event)">⚔️ 결사의 수호: 동료 단일공격 강제 전환 / 광역 총합 피해 전량 대신 감당</button>
      `);
      return;
    }

    if (sk.id === 'm_1_2' || sk.id === 'm_3_2' || sk.id === 'l_1_2') {
      openSlotPopup(slotIdx, `
        <div style="font-size:10px; color:#93c5fd; font-weight:bold; border-bottom:1px solid #282f44; padding-bottom:3px;">🎯 [${sk.name}] 적용 대상 선택</div>
        <button class="status-modal-item" onclick="commitBearerSlotOption(${slotIdx}, { target: 'bearer' }, event)">🛡️ 베어러 (${bearerName})</button>
        <button class="status-modal-item" onclick="commitBearerSlotOption(${slotIdx}, { target: 'comp' }, event)">🤝 동료 (${getCompName()})</button>
      `);
      return;
    }

    const livingSynced = getLivingSyncedEnemies();
    const hasSyncedEnemyData = (livingSynced.length > 0);

    if (sk.id === 'l_1_4') {
      if (hasSyncedEnemyData && livingSynced.length < 2) {
        playBeep(220, 'sawtooth', 0.2);
        log(`⚠️ <b>[시전 불가]</b> [환체 교란]은 전장에 적이 <b>2개체 이상</b>일 때만 시전할 수 있습니다! (현재 생존 적: ${livingSynced.length}체)`);
        return;
      }
      if (hasSyncedEnemyData && livingSynced.length >= 3) {
        const curTarget = getTargetEnemyForActor('bearer');
        const others = livingSynced.filter(e => !curTarget || e.uid !== curTarget.uid);
        const btns = others.map(o => `<button class="status-modal-item" onclick="commitBearerSlotOption(${slotIdx}, { redirectEnemyUid: '${o.uid}', redirectEnemyName: '${o.name}' }, event)">🎭 공격 목표를 [🎯${o.name}]에게로 강제 전환</button>`).join('');
        openSlotPopup(slotIdx, `<div style="font-size:10px; color:#fde68a; font-weight:bold; border-bottom:1px solid #282f44; padding-bottom:3px;">🎭 [환체 교란] 인텐트를 뒤집어씌울 다른 적 선택</div>${btns}`);
        return;
      }
    }

    if (sk.id === 'f_1_1') {
      if (hasSyncedEnemyData) {
        slotRunOptions[slotIdx] = { prevMissed: Boolean(bearerLastAttackMissed), autoResolved: true };
        commitBearerSkillSelection(slotIdx);
        return;
      }
      const autoHint = bearerLastAttackMissed ? ' (직전 실패 감지됨!)' : '';
      openSlotPopup(slotIdx, `
        <div style="font-size:10px; color:#fbd38d; font-weight:bold; border-bottom:1px solid #282f44; padding-bottom:3px;">🗡️ [쾌속 찌르기] 직전 라운드 명중 실패 여부 선택</div>
        <button class="status-modal-item" onclick="commitBearerSlotOption(${slotIdx}, { prevMissed: false }, event)">⚔️ 기본 쾌속 찌르기 (고정 4 피해)</button>
        <button class="status-modal-item" onclick="commitBearerSlotOption(${slotIdx}, { prevMissed: true }, event)">🔥 직전 라운드 명중 실패/대실패 보정 (고정 6 피해)${autoHint}</button>
      `);
      return;
    }

    if (sk.id === 'f_1_3' || sk.id === 's_2_1') {
      if (hasSyncedEnemyData) {
        slotRunOptions[slotIdx] = { autoResolved: true };
        commitBearerSkillSelection(slotIdx);
        return;
      }
      openSlotPopup(slotIdx, `
        <div style="font-size:10px; color:#93c5fd; font-weight:bold; border-bottom:1px solid #282f44; padding-bottom:3px;">🦅 [${sk.name}] 대상 조건 확인</div>
        <button class="status-modal-item" onclick="commitBearerSlotOption(${slotIdx}, { condAdv: false }, event)">⚔️ 일반 적 대상 (기본 명중 판정 · ${sk.dmg} 피해)</button>
        <button class="status-modal-item" onclick="commitBearerSlotOption(${slotIdx}, { condAdv: true }, event)">✨ 비행·체공 또는 광역/충전 인텐트 적 (명중 [유리함] 적용!)</button>
      `);
      return;
    }

    if (sk.id === 'f_2_2') {
      if (hasSyncedEnemyData) {
        slotRunOptions[slotIdx] = { autoResolved: true };
        commitBearerSkillSelection(slotIdx);
        return;
      }
      openSlotPopup(slotIdx, `
        <div style="font-size:10px; color:#fbd38d; font-weight:bold; border-bottom:1px solid #282f44; padding-bottom:3px;">🛡️ [방패 파괴자] 적 인텐트 조건</div>
        <button class="status-modal-item" onclick="commitBearerSlotOption(${slotIdx}, { bonusHit: false }, event)">⚔️ 일반 대상 (고정 2 피해 + [방어 약화] 부여)</button>
        <button class="status-modal-item" onclick="commitBearerSlotOption(${slotIdx}, { bonusHit: true }, event)">🔥 베어러 포함 인텐트 적 (고정 3 피해 + [방어 약화] 부여)</button>
      `);
      return;
    }

    if (sk.id === 's_1_4') {
      if (hasSyncedEnemyData && livingSynced.length === 1) {
        slotRunOptions[slotIdx] = { twinMode: 'single', autoResolved: true };
        commitBearerSkillSelection(slotIdx);
        return;
      }
      openSlotPopup(slotIdx, `
        <div style="font-size:10px; color:#fbd38d; font-weight:bold; border-bottom:1px solid #282f44; padding-bottom:3px;">⚔️ [쌍영참] 참격 궤적 선택</div>
        <button class="status-modal-item" onclick="commitBearerSlotOption(${slotIdx}, { twinMode: 'aoe' }, event)">🌪️ 광역 참격 (적 전체 고정 6 광역 피해)</button>
        <button class="status-modal-item" onclick="commitBearerSlotOption(${slotIdx}, { twinMode: 'single' }, event)">⚡ 교차 집중 (단일 적 1체 고정 9 집중 피해)</button>
      `);
      return;
    }

    if (sk.id === 's_3_2') {
      if (hasSyncedEnemyData) {
        slotRunOptions[slotIdx] = { autoResolved: true };
        commitBearerSkillSelection(slotIdx);
        return;
      }
      openSlotPopup(slotIdx, `
        <div style="font-size:10px; color:#fbd38d; font-weight:bold; border-bottom:1px solid #282f44; padding-bottom:3px;">🗡️ [비월절명] 사각 포착 / 직전 회피 여부</div>
        <button class="status-modal-item" onclick="commitBearerSlotOption(${slotIdx}, { backstab: true }, event)">✨ 사각 포착(베어러 미포함 인텐트) 또는 직전 회피 (고정 9 피해 + AC +1)</button>
        <button class="status-modal-item" onclick="commitBearerSlotOption(${slotIdx}, { backstab: false }, event)">⚔️ 기본 도약 베기 (고정 5 피해 + AC +1)</button>
      `);
      return;
    }

    if (sk.id === 'm_1_3') {
      if (mageChargedSpells.length >= 2) {
        playBeep(220, 'sawtooth', 0.18);
        log(`🔮 <b>[성염 장전 한도 도달]</b> 지팡이에는 최대 2개의 마법까지만 충전할 수 있습니다! (상단 <b>[⚡ 일괄 개방]</b>으로 먼저 발사하세요)`);
        return;
      }
      const chargeable = bearerDeck
        .map(id => getBearerSkillById(id))
        .filter(s => s && !s.isPassive && s.id !== 'm_1_3' && s.circle !== '4');
      if (chargeable.length === 0) {
        playBeep(220, 'sawtooth', 0.18);
        log(`⚠️ <b>[장전 가능 마법 없음]</b> 현재 덱에 충전 가능한 마법(캔트립~3서클)이 없습니다.`);
        return;
      }
      let itemsHtml = '';
      chargeable.forEach(cs => {
        if (cs.circle === 'var') {
          [10, 20, 30, 40, 50].forEach(vc => {
            itemsHtml += `<button class="status-modal-item" onclick="commitBearerSlotOption(${slotIdx}, { chargeSpellId: '${cs.id}', chargeVarCost: ${vc} }, event)">🔮 [${cs.name} (과열 +${vc})] 충전 (광역 ${(vc / 10) * 2} 피해)</button>`;
          });
        } else if (cs.id === 'm_1_2' || cs.id === 'm_3_2') {
          itemsHtml += `<button class="status-modal-item" onclick="commitBearerSlotOption(${slotIdx}, { chargeSpellId: '${cs.id}', chargeVarCost: ${cs.cost}, chargeTarget: 'bearer' }, event)">🔮 [${cs.circleLabel}] ${cs.name} ➔ 베어러 충전 (과열 +${cs.cost})</button>`;
          itemsHtml += `<button class="status-modal-item" onclick="commitBearerSlotOption(${slotIdx}, { chargeSpellId: '${cs.id}', chargeVarCost: ${cs.cost}, chargeTarget: 'comp' }, event)">🔮 [${cs.circleLabel}] ${cs.name} ➔ ${getCompName()} 충전 (과열 +${cs.cost})</button>`;
        } else {
          itemsHtml += `<button class="status-modal-item" onclick="commitBearerSlotOption(${slotIdx}, { chargeSpellId: '${cs.id}', chargeVarCost: ${cs.cost} }, event)">🔮 [${cs.circleLabel}] ${cs.name} 충전 (과열 +${cs.cost} 지불)</button>`;
        }
      });
      openSlotPopup(slotIdx, `<div style="font-size:10px; color:#7dd3fc; font-weight:bold; border-bottom:1px solid #282f44; padding-bottom:3px;">🔮 지팡이에 충전할 마법 선택 (${mageChargedSpells.length}/2)</div>${itemsHtml}`);
      return;
    }

    if (sk.id === 'l_3_1') {
      if (hasSyncedEnemyData) {
        let tEn = getTargetEnemyForActor('bearer');
        if (!tEn || !tEn.status || !Array.isArray(tEn.status.dots) || tEn.status.dots.length === 0) {
          const altEn = livingSynced.find(e => e.status && Array.isArray(e.status.dots) && e.status.dots.length > 0);
          if (altEn) {
            selectedBearerTargetUid = altEn.uid;
            tEn = altEn;
            renderSyncBridgeUI();
          }
        }
        slotRunOptions[slotIdx] = { autoResolved: true, enemyUid: tEn ? tEn.uid : selectedBearerTargetUid };
        commitBearerSkillSelection(slotIdx);
        return;
      }
      openSlotPopup(slotIdx, `
        <div style="font-size:10px; color:#fde68a; font-weight:bold; border-bottom:1px solid #282f44; padding-bottom:3px;">💥 [빛의 파동] 적 지속피해(+1R 연장 후) 기폭량</div>
        <button class="status-modal-item" onclick="commitBearerSlotOption(${slotIdx}, { dotDetonateDmg: 4 }, event)">🩸 4 피해 (지속 2 × 2R)</button>
        <button class="status-modal-item" onclick="commitBearerSlotOption(${slotIdx}, { dotDetonateDmg: 6 }, event)">🩸 6 피해 (지속 2 × 3R 또는 3 × 2R)</button>
        <button class="status-modal-item" onclick="commitBearerSlotOption(${slotIdx}, { dotDetonateDmg: 8 }, event)">🩸 8 피해 (지속 2 × 4R 또는 복합 중첩)</button>
        <button class="status-modal-item" onclick="commitBearerSlotOption(${slotIdx}, { dotDetonateDmg: 9 }, event)">🩸 9 피해 (지속 3 × 3R)</button>
        <button class="status-modal-item" onclick="commitBearerSlotOption(${slotIdx}, { dotDetonateDmg: 10 }, event)">🩸 10 피해 (지속 2×2R + 3×2R 등)</button>
        <button class="status-modal-item" onclick="commitBearerSlotOption(${slotIdx}, { dotDetonateDmg: 12 }, event)">🩸 12 피해 (지속 3×4R 또는 2×3R+3×2R)</button>
        <button class="status-modal-item" onclick="commitBearerSlotOption(${slotIdx}, { dotDetonateDmg: 15 }, event)">🩸 15 피해 (고중첩 지속피해 기폭)</button>
      `);
      return;
    }

    if (sk.id === 'l_3_2') {
      ensureValidCompDeck(false);
      let btnsHtml = '';
      ['A', 'B', 'C'].forEach((tag, idx) => {
        const cSk = getCompSkillById(compDeck[idx]);
        if (!cSk) return;
        const cdWait = compCds[tag] || 0;
        const chargeLack = Boolean(cSk.reqCharge && senCharge < cSk.reqCharge);
        const isDis = (cdWait > 0) || chargeLack;
        if (isDis) {
          const reason = cdWait > 0 ? `(쿨 ${cdWait}R 불가)` : '(마탄 부족)';
          btnsHtml += `<button class="status-modal-item" disabled style="opacity:0.4; cursor:not-allowed;">🪞 ${tag}: ${cSk.name} ${reason}</button>`;
          return;
        }
        if (cSk.id === 'w_2_2') {
          btnsHtml += `<button class="status-modal-item" onclick="commitBearerSlotOption(${slotIdx}, { projCompKey: '${tag}', projOpt: { bonusHit: true } }, event)">🪞 ${tag}: ${cSk.name} (대상 인텐트 포함: 6 피해 + 방어약화)</button>`;
          btnsHtml += `<button class="status-modal-item" onclick="commitBearerSlotOption(${slotIdx}, { projCompKey: '${tag}', projOpt: { bonusHit: false } }, event)">🪞 ${tag}: ${cSk.name} (일반: 4 피해 + 방어약화)</button>`;
        } else if (cSk.id === 'so_2_2' || cSk.id === 'ms_1_1' || cSk.id === 'r_2_1') {
          btnsHtml += `<button class="status-modal-item" onclick="commitBearerSlotOption(${slotIdx}, { projCompKey: '${tag}', projOpt: { singleEnemy: false } }, event)">🪞 ${tag}: ${cSk.name} (다수 적 대상)</button>`;
          btnsHtml += `<button class="status-modal-item" onclick="commitBearerSlotOption(${slotIdx}, { projCompKey: '${tag}', projOpt: { singleEnemy: true } }, event)">🪞 ${tag}: ${cSk.name} (단독 적 1체 집중)</button>`;
        } else if (cSk.id === 'so_3_2') {
          btnsHtml += `<button class="status-modal-item" onclick="commitBearerSlotOption(${slotIdx}, { projCompKey: '${tag}', projOpt: { resonanceMode: 'amp' } }, event)">🪞 ${tag}: ${cSk.name} (공명 증폭: 베어러 피해 +${heat >= 70 ? 5 : 3})</button>`;
          btnsHtml += `<button class="status-modal-item" onclick="commitBearerSlotOption(${slotIdx}, { projCompKey: '${tag}', projOpt: { resonanceMode: 'vent' } }, event)">🪞 ${tag}: ${cSk.name} (공명 환기: 적 3피해 & 과열 -20)</button>`;
        } else if (cSk.id === 'w_1_2' || cSk.id === 'w_4_2' || cSk.id === 'ms_2_1' || cSk.id === 'r_1_1' || cSk.id === 'r_1_3') {
          btnsHtml += `<button class="status-modal-item" onclick="commitBearerSlotOption(${slotIdx}, { projCompKey: '${tag}', projOpt: { condAdv: true } }, event)">🪞 ${tag}: ${cSk.name} (조건 충족: 명중 [유리함] 적용)</button>`;
          btnsHtml += `<button class="status-modal-item" onclick="commitBearerSlotOption(${slotIdx}, { projCompKey: '${tag}', projOpt: { condAdv: false } }, event)">🪞 ${tag}: ${cSk.name} (일반 명중 판정)</button>`;
        } else if (cSk.id === 'r_4_1') {
          btnsHtml += `<button class="status-modal-item" onclick="commitBearerSlotOption(${slotIdx}, { projCompKey: '${tag}', projOpt: { condAdv: true, dotSum: 3 } }, event)">🪞 ${tag}: ${cSk.name} (지속피해 보유: 유리함 & 방약·행동제약 & 추가피해)</button>`;
          btnsHtml += `<button class="status-modal-item" onclick="commitBearerSlotOption(${slotIdx}, { projCompKey: '${tag}', projOpt: { condAdv: false, dotSum: 0 } }, event)">🪞 ${tag}: ${cSk.name} (지속피해 미보유: 단일 9 피해)</button>`;
        } else {
          btnsHtml += `<button class="status-modal-item" onclick="commitBearerSlotOption(${slotIdx}, { projCompKey: '${tag}', projOpt: {} }, event)">🪞 ${tag}: ${cSk.name} (독립 투영 발동)</button>`;
        }
      });
      openSlotPopup(slotIdx, `
        <div style="font-size:10px; color:#fda4af; font-weight:bold; border-bottom:1px solid #282f44; padding-bottom:3px;">🪞 [원격 투영] 즉시 발동할 ${getCompName()} 스킬 선택</div>
        ${btnsHtml}
      `);
      return;
    }

    commitBearerSkillSelection(slotIdx);
  }

  function commitBearerSkillSelection(slotIdx) {
    ensureValidEnemyTargets();
    if (!slotRunOptions[slotIdx]) slotRunOptions[slotIdx] = {};
    if (!slotRunOptions[slotIdx].enemyUid && selectedBearerTargetUid) {
      slotRunOptions[slotIdx].enemyUid = selectedBearerTargetUid;
    }
    executeBearerSkillImmediate(slotIdx);
  }
  window.commitBearerSkillSelection = commitBearerSkillSelection;

  /* ==========================================================================
     [Phase 5] 막간의 교감 ([비추는 불꽃] / [태우는 불꽃]) & [합격기] 제어 함수
     ========================================================================== */
  function renderCommunionBar() {
    const bar = document.getElementById('communion-bar');
    const selectEl = document.getElementById('communion-select');
    const btns = document.getElementById('communion-action-btns');
    const bagState = document.getElementById('bag-communion-state');

    if (bagState) {
      if (communionActiveThisRound === 'shine') bagState.innerText = '🌟 비추는 불꽃 발동 중!';
      else if (communionActiveThisRound === 'burn') bagState.innerText = '🔥 태우는 불꽃 발동 중!';
      else if (communionFlame === 'shine') bagState.innerText = '🌟 비추는 불꽃 보유';
      else if (communionFlame === 'burn') bagState.innerText = '🔥 태우는 불꽃 보유';
      else bagState.innerText = '미보유';
    }

    if (!bar || !selectEl || !btns) return;
    bar.classList.remove('active-shine', 'active-burn');

    if (communionActiveThisRound === 'shine') {
      bar.classList.add('active-shine');
      selectEl.value = 'shine';
      selectEl.className = 'communion-select shine';
      btns.innerHTML = `<span class="communion-active-pill shine" title="이번 라운드 베어러+동료 동시 직접 타격 시 방어막 무시 [합격기 ${1 + curLevel} 피해] 자동 폭발!">🌟 발동 중! (동시 타격 시 합격기 +${1 + curLevel})</span>`;
    } else if (communionActiveThisRound === 'burn') {
      bar.classList.add('active-burn');
      selectEl.value = 'burn';
      selectEl.className = 'communion-select burn';
      btns.innerHTML = `<span class="communion-active-pill burn" title="이번 라운드 베어러+동료 직접 타격 피해 각각 +3 & 동시 직접 타격 시 방어막 무시 [합격기 ${1 + curLevel} 피해] 자동 폭발!">🔥 발동 중! (피해+3 · 합격기 +${1 + curLevel})</span>`;
    } else if (communionFlame === 'shine') {
      bar.classList.add('active-shine');
      selectEl.value = 'shine';
      selectEl.className = 'communion-select shine';
      btns.innerHTML = `
        <button class="btn-communion-trigger" onclick="activateCommunionFlame('bearer')" title="턴 시작 시 선언: 베어러 과열 -10 냉각 & 이번 라운드 베어러 공격 판정 유리함 (+합격기 대기)">⚡ 베어러 개방</button>
        <button class="btn-communion-trigger" onclick="activateCommunionFlame('comp')" title="턴 시작 시 선언: 베어러 과열 -10 냉각 & 이번 라운드 ${getCompName()} 공격 판정 유리함 (+합격기 대기)">⚡ 동료 개방</button>
      `;
    } else if (communionFlame === 'burn') {
      bar.classList.add('active-burn');
      selectEl.value = 'burn';
      selectEl.className = 'communion-select burn';
      btns.innerHTML = `
        <button class="btn-communion-trigger" style="background:linear-gradient(135deg, #b45309 0%, #dc2626 100%); border-color:#fcd34d;" onclick="activateCommunionFlame('both')" title="턴 시작 시 선언: 이번 라운드 베어러 & ${getCompName()} 직접 타격 피해량 각각 +3 (+합격기 대기)">🔥 불꽃 개방 (아군 피해+3)</button>
      `;
    } else {
      selectEl.value = 'none';
      selectEl.className = 'communion-select none';
      btns.innerHTML = `<span class="communion-hint-text">휴식·교감 시 불꽃 선택</span>`;
    }
  }
  window.renderCommunionBar = renderCommunionBar;

  function acquireCommunionFlame(type) {
    communionFlame = type || 'none';
    communionActiveThisRound = 'none';
    if (type === 'shine') {
      playBeep(640, 'sine', 0.15);
      log(`🌟 <b>[막간의 교감: 비추는 불꽃 준비]</b> ${getCompName()}와(과) 서로의 앞길을 비추며 호흡을 가다듬었습니다. (불꽃 준비 완료: 전투 중 턴 시작 시 [비추는 불꽃]을 선언하여 개방하면 과열 -10 냉각 & 아군 1명 공격 판정 [유리함] 및 [합격기] 발동 가능)`);
    } else if (type === 'burn') {
      playBeep(520, 'sawtooth', 0.15);
      log(`🔥 <b>[막간의 교감: 태우는 불꽃 준비]</b> ${getCompName()}와(과) 감정과 투지를 부딪쳐 불길을 사납게 키웠습니다! (불꽃 준비 완료: 전투 중 턴 시작 시 [태우는 불꽃]을 선언하여 개방하면 이번 라운드 베어러 & 동료 직접 타격 피해 +3 및 [합격기] 발동 가능)`);
    } else {
      playBeep(320, 'sine', 0.08);
      log(`💨 <b>[교감 불꽃 초기화]</b> 보유 중이던 막간의 교감 불꽃을 해제했습니다.`);
    }
    refreshUI();
    saveSessionState();
  }
  window.acquireCommunionFlame = acquireCommunionFlame;

  function activateCommunionFlame(targetActor = 'bearer') {
    if (isExecuting || communionFlame === 'none') return;
    if (shouldDemoteLogsOnNextAction) demoteOldRoundLogs();
    if (!combatStarted && curRound === 1) {
      triggerCombatStartPerks(false);
    }
    if (communionFlame === 'shine') {
      communionFlame = 'none';
      communionActiveThisRound = 'shine';
      const prevHeat = heat;
      heat = Math.max(0, heat - 10);
      if (targetActor === 'comp') {
        applyTargetStatus('comp', '🌟 비추는 불꽃 (유리함)', 'buff', '[막간의 교감] 이번 라운드 동료 공격 명중 판정 1회 [유리함]');
        log(`🌟 <b>[비추는 불꽃 개방!]</b> 베어러의 과열이 즉시 <b>-10 냉각(${prevHeat}➔${heat})</b>되고, 이번 라운드 <b>${getCompName()}의 공격 판정에 [유리함]</b>이 부여됩니다! (이번 라운드 베어러와 동료가 동시에 직접 피해를 입히면 방어막 무시 <b>[합격기: 고정 ${1 + curLevel} 피해]</b>가 폭발합니다!)`);
        recordActionBriefing(`▶ [막간의 교감: 비추는 불꽃 선언] 베어러 과열 -10 냉각(${prevHeat}➔${heat}) & ${getCompName()} 공격 판정 [유리함] (합격기 대기)`);
      } else {
        applyTargetStatus('bearer', '🌟 비추는 불꽃 (유리함)', 'buff', '[막간의 교감] 이번 라운드 베어러 공격 명중 판정 1회 [유리함]');
        log(`🌟 <b>[비추는 불꽃 개방!]</b> 베어러의 과열이 즉시 <b>-10 냉각(${prevHeat}➔${heat})</b>되고, 이번 라운드 <b>베어러의 공격 판정에 [유리함]</b>이 부여됩니다! (이번 라운드 베어러와 동료가 동시에 직접 피해를 입히면 방어막 무시 <b>[합격기: 고정 ${1 + curLevel} 피해]</b>가 폭발합니다!)`);
        recordActionBriefing(`▶ [막간의 교감: 비추는 불꽃 선언] 베어러 과열 -10 냉각(${prevHeat}➔${heat}) & 베어러 공격 판정 [유리함] (합격기 대기)`);
      }
      playBeep(720, 'triangle', 0.2);
    } else if (communionFlame === 'burn') {
      communionFlame = 'none';
      communionActiveThisRound = 'burn';
      applyTargetStatus('bearer', '🔥 태우는 불꽃 (+3 피해)', 'buff', '[막간의 교감] 이번 라운드 베어러 직접 타격 피해량 고정 +3 증가');
      applyTargetStatus('comp', '🔥 태우는 불꽃 (+3 피해)', 'buff', '[막간의 교감] 이번 라운드 동료 직접 타격 피해량 고정 +3 증가');
      playBeep(680, 'sawtooth', 0.2);
      log(`🔥 <b>[태우는 불꽃 개방!]</b> 사납게 타오르는 투지가 공명하여 이번 라운드 동안 <b>베어러와 ${getCompName()}이(가) 가하는 직접 타격 피해량이 각각 고정 +3 증가</b>합니다! (동시에 직접 피해를 입힌 공통의 적에게 방어막 무시 <b>[합격기: 고정 ${1 + curLevel} 피해]</b>가 폭발합니다!)`);
      recordActionBriefing(`▶ [막간의 교감: 태우는 불꽃 선언] 이번 라운드 베어러 & ${getCompName()} 직접 타격 피해 각각 +3 증가 (합격기 대기)`);
    }
    refreshUI();
    saveSessionState();
  }
  window.activateCommunionFlame = activateCommunionFlame;

  function cancelCompBonusAction() {
    senBonusActionReady = false;
    playBeep(320, 'sine', 0.08);
    finishExecution();
  }
  window.cancelCompBonusAction = cancelCompBonusAction;

  function selectCompHeatConduction(e, fromDrop = false) {
    if (isExecuting || compHp <= 0) return;
    if (e) e.stopPropagation();
    closeAllStatusMenus();
    if (!fromDrop) {
      playBeep(360, 'sine', 0.06);
      const f = DOM.diceFormula || document.getElementById('dice-formula-display');
      if (f) f.innerText = `🎯 [열기 전도] 아이콘을 드래그(점선)하여 베어러 또는 동료 상태창에 놓아야 발동합니다!`;
      return;
    }

    const existingIdx = actionQueue.findIndex(item => item.actor === 'comp');
    if (existingIdx !== -1 && actionQueue[existingIdx].key === 'HEAT') {
      actionQueue.splice(existingIdx, 1);
      const wrapEl = (DOM.compWraps && DOM.compWraps['HEAT']) || document.getElementById('wrap-comp-HEAT');
      triggerSkillSlamImpact(wrapEl, true);
      renderQueueUI();
      refreshUI();
      return;
    }

    if (compActedThisRound && !senBonusActionReady) {
      playBeep(220, 'sawtooth', 0.16);
      log(`⏳ <b>[동료 행동 완료]</b> 이번 라운드 ${getCompName()}의 행동(1회)을 이미 소모했습니다. (우측 <b>[⏭️ 라운드 종료]</b>를 누르거나 타이틀 우측 <b>[✓ 행동 완료]</b> 배지를 클릭해 재활성화할 수 있습니다.)`);
      return;
    }
    if (compRevivedThisRound) {
      playBeep(220, 'sawtooth', 0.2);
      log(`🛡️ <b>[재정비 중 (부활 당해 라운드)]</b> ${getCompName()}은(는) 이번 라운드에 부활하여 행동할 수 없습니다! (다음 라운드 시작 전까지 적의 단일 공격 대상에서 제외됨)`);
      return;
    }
    const isCompRestricted = compStatuses.some(s => s.name.includes('행동 제약')) && !isCompImmuneToRestriction();
    if (isCompRestricted) {
      playBeep(220, 'sawtooth', 0.2);
      log(`⛓️ <b>[행동 제약]</b> ${getCompName()}이(가) [행동 제약] 상태이므로 [열기 전도]를 수행할 수 없습니다!`);
      return;
    }
    if (compHp < 1) {
      playBeep(220, 'sawtooth', 0.2);
      log(`⚠️ <b>[열기 전도 불가]</b> ${getCompName()}이(가) 탈진 상태이므로 열기 전도를 수행할 수 없습니다!`);
      return;
    }
    if (pyrite < 1) {
      playBeep(220, 'sawtooth', 0.2);
      log(`⚠️ <b>[장미 휘석 부족]</b> [열기 전도]에는 매개로 <b>장미 휘석 1개</b>가 필요합니다! (현재 보유: ${pyrite}개)`);
      return;
    }
    if (heat <= 0) {
      playBeep(220, 'sawtooth', 0.2);
      log(`❄️ <b>[과열 없음]</b> 베어러의 현재 과열이 0이므로 열기 전도가 필요하지 않습니다.`);
      return;
    }
    commitCompSkillSelection('HEAT');
  }
  window.selectCompHeatConduction = selectCompHeatConduction;

  function selectCompSkill(tag, e, fromDrop = false) {
    if (tag === 'HEAT') {
      selectCompHeatConduction(e, fromDrop);
      return;
    }
    if (isExecuting || compHp <= 0) return;
    if (e) e.stopPropagation();
    const myPop = (DOM.compPopups && DOM.compPopups[tag]) || document.getElementById(`popup-comp-${tag}`);
    if (myPop && myPop.style.display === 'flex') {
      closeAllStatusMenus();
      playBeep(320, 'sine', 0.08);
      return;
    }
    closeAllStatusMenus();
    if (!fromDrop) {
      ensureValidCompDeck(false);
      const sIdx = (tag === 'A') ? 0 : ((tag === 'B') ? 1 : 2);
      const cSk = getCompSkillById(compDeck[sIdx]);
      playBeep(360, 'sine', 0.06);
      const f = DOM.diceFormula || document.getElementById('dice-formula-display');
      if (f) f.innerText = `🎯 [${cSk ? cSk.name : '동료 스킬'}] 아이콘을 드래그(점선)하여 대상에 놓아야 발동합니다!`;
      return;
    }
    if (compActedThisRound && !senBonusActionReady) {
      playBeep(220, 'sawtooth', 0.16);
      log(`⏳ <b>[동료 행동 완료]</b> 이번 라운드 ${getCompName()}의 행동(1회)을 이미 소모했습니다. (우측 <b>[⏭️ 라운드 종료]</b>를 누르거나 타이틀 우측 <b>[✓ 행동 완료]</b> 배지를 클릭해 재활성화할 수 있습니다.)`);
      return;
    }
    if (compRevivedThisRound) {
      playBeep(220, 'sawtooth', 0.2);
      log(`🛡️ <b>[재정비 중 (부활 당해 라운드)]</b> ${getCompName()}은(는) 이번 라운드에 부활하여 행동할 수 없습니다! (다음 라운드 시작 전까지 적의 단일 공격 대상에서 제외됨)`);
      return;
    }
    ensureValidCompDeck(false);

    const existingIdx = actionQueue.findIndex(item => item.actor === 'comp');
    if (!senBonusActionReady && existingIdx !== -1 && actionQueue[existingIdx].key === tag) {
      actionQueue.splice(existingIdx, 1);
      closeAllStatusMenus();
      const wrapEl = (DOM.compWraps && DOM.compWraps[tag]) || document.getElementById(`wrap-comp-${tag}`);
      triggerSkillSlamImpact(wrapEl, true);
      renderQueueUI();
      refreshUI();
      return;
    }

    const slotIdx = (tag === 'A') ? 0 : ((tag === 'B') ? 1 : 2);
    const sk = getCompSkillById(compDeck[slotIdx]);
    if (!sk) return;

    if (senBonusActionReady && sk.id === 'ms_4_2') {
      playBeep(220, 'sawtooth', 0.18);
      log(`⚠️ <b>[동일 기술 선언 불가]</b> [무영의 검무] 추가 행동으로는 <b>보유한 다른 스킬</b>만 선언할 수 있습니다!`);
      return;
    }

    const cdWait = compCds[tag] || 0;
    if (cdWait > 0) {
      playBeep(220, 'sawtooth', 0.18);
      log(`⏳ <b>[쿨다운 대기]</b> [${sk.name}] 기술은 현재 쿨다운 중입니다! (${cdWait}라운드 남음)`);
      return;
    }

    const isCompRestricted = compStatuses.some(s => s.name.includes('행동 제약')) && !isCompImmuneToRestriction();
    if (isCompRestricted && sk.cd > 0) {
      playBeep(220, 'sawtooth', 0.2);
      log(`⛓️ <b>[동료 행동 제약]</b> 현재 ${getCompName()}이(가) <b>[행동 제약]</b> 상태이므로 쿨다운 기술([${sk.name}])을 선언할 수 없습니다! (쿨다운 없는 기술만 사용 가능)`);
      return;
    }

    if (sk.reqCharge && senCharge < sk.reqCharge) {
      playBeep(220, 'sawtooth', 0.15);
      log(`⚠️ <b>[마탄 차징 부족]</b> [${sk.name}] 시전에는 [마탄 차징]이 최소 ${sk.reqCharge}스택 필요합니다! (현재: ${senCharge}/3)`);
      return;
    }

    const livingSynced = getLivingSyncedEnemies();
    const hasSyncedEnemyData = (livingSynced.length > 0);

    // 전술 선택지 팝업이 필요한 컴패니언 스킬들 (적 연동 시 조건부 팝업 자동 생략!)
    if (sk.id === 'w_1_2' || sk.id === 'w_2_2' || sk.id === 'w_4_2') {
      if (hasSyncedEnemyData) {
        compSlotOptions[tag] = { autoResolved: true, enemyUid: selectedCompTargetUid };
        if (senBonusActionReady) {
          senBonusActionReady = false;
          isExecuting = true;
          const wrapEl = (DOM.compWraps && DOM.compWraps[tag]) || document.getElementById(`wrap-comp-${tag}`);
          triggerSkillSlamImpact(wrapEl, false);
          runCompSkillLogic(tag, () => finishExecution());
          return;
        }
        commitCompSkillSelection(tag);
        return;
      }
    }

    if (sk.id === 'w_1_2') {
      openCompSlotPopup(tag, `
        <div style="font-size:10px; color:#d8b4fe; font-weight:bold; border-bottom:1px solid #282f44; padding-bottom:3px;">🛡️ [투지 발휘] 적 인텐트 조건</div>
        <button class="status-modal-item" onclick="commitCompSlotOption('${tag}', { condAdv: true }, event)">✨ 베어러를 노리는 적 공격 (명중 [유리함] + 피격-3 & 도발)</button>
        <button class="status-modal-item" onclick="commitCompSlotOption('${tag}', { condAdv: false }, event)">⚔️ 일반 대상 공격 (기본 명중 + 피격-3 & 도발)</button>
      `);
      return;
    }

    if (sk.id === 'w_2_2') {
      openCompSlotPopup(tag, `
        <div style="font-size:10px; color:#d8b4fe; font-weight:bold; border-bottom:1px solid #282f44; padding-bottom:3px;">🔨 [파쇄의 갑옷치기] 적 인텐트 조건</div>
        <button class="status-modal-item" onclick="commitCompSlotOption('${tag}', { bonusHit: true }, event)">🔥 워리어 포함 인텐트 적 (고정 6 피해 + [방어 약화])</button>
        <button class="status-modal-item" onclick="commitCompSlotOption('${tag}', { bonusHit: false }, event)">⚔️ 일반 대상 공격 (고정 4 피해 + [방어 약화])</button>
      `);
      return;
    }

    if (sk.id === 'w_4_2') {
      const autoCond = (compHp * 2 <= compMaxHp) || enemyVuln;
      openCompSlotPopup(tag, `
        <div style="font-size:10px; color:#d8b4fe; font-weight:bold; border-bottom:1px solid #282f44; padding-bottom:3px;">⚔️ [거신 단두대] 조건 확인 ${autoCond ? '(현재 조건 달성!)' : ''}</div>
        <button class="status-modal-item" onclick="commitCompSlotOption('${tag}', { condAdv: true }, event)">✨ 워리어 반피↓ 또는 적 [방어 약화] (명중 [유리함] + 12 피해 + [행동 제약])</button>
        <button class="status-modal-item" onclick="commitCompSlotOption('${tag}', { condAdv: false }, event)">⚔️ 일반 상태 공격 (기본 명중 + 12 피해)</button>
      `);
      return;
    }

    if (sk.id === 'so_1_2') {
      const canEmergency = (compHp >= 1);
      openCompSlotPopup(tag, `
        <div style="font-size:10px; color:#f472b6; font-weight:bold; border-bottom:1px solid #282f44; padding-bottom:3px;">🩸 [생명 흡수진] 발동 방식 및 회복 대상</div>
        <button class="status-modal-item" onclick="commitCompSlotOption('${tag}', { mode: 'normal', target: 'bearer' }, event)">🔮 생명 흡수(기본): 무판정 적 1 피해 + 베어러 HP +2 회복</button>
        <button class="status-modal-item" onclick="commitCompSlotOption('${tag}', { mode: 'normal', target: 'comp' }, event)">🔮 생명 흡수(기본): 무판정 적 1 피해 + ${getCompName()} HP +2 회복</button>
        <button class="status-modal-item" ${!canEmergency ? 'disabled style="opacity:0.4;"' : `onclick="commitCompSlotOption('${tag}', { mode: 'emergency', target: 'bearer' }, event)"`}>🩸 생명 전이(긴급): ${getCompName()} HP -1 자해 ➔ 베어러 HP +2 회복</button>
      `);
      return;
    }

    if (sk.id === 'so_2_1') {
      const canSacrifice = (compHp >= 2);
      openCompSlotPopup(tag, `
        <div style="font-size:10px; color:#f472b6; font-weight:bold; border-bottom:1px solid #282f44; padding-bottom:3px;">🩸 [피의 서약] 대상 및 자해 강화 선택</div>
        <button class="status-modal-item" onclick="commitCompSlotOption('${tag}', { target: 'bearer', sacrifice: false }, event)">🛡️ 기본: 베어러 HP +2 회복 & [방어막 2]</button>
        <button class="status-modal-item" onclick="commitCompSlotOption('${tag}', { target: 'comp', sacrifice: false }, event)">🤝 기본: ${getCompName()} HP +2 회복 & [방어막 2]</button>
        <button class="status-modal-item" ${!canSacrifice ? 'disabled style="opacity:0.4;"' : `onclick="commitCompSlotOption('${tag}', { target: 'bearer', sacrifice: true }, event)"`}>🔥 자해 강화(릴리 HP-1): 베어러 HP +3 회복 & [방어막 3]</button>
        <button class="status-modal-item" ${!canSacrifice ? 'disabled style="opacity:0.4;"' : `onclick="commitCompSlotOption('${tag}', { target: 'comp', sacrifice: true }, event)"`}>🔥 자해 강화(릴리 HP-1): ${getCompName()} HP +3 회복 & [방어막 3]</button>
      `);
      return;
    }

    if (sk.id === 'so_2_2') {
      if (hasSyncedEnemyData) {
        compSlotOptions[tag] = { singleEnemy: (livingSynced.length === 1), autoResolved: true, enemyUid: selectedCompTargetUid };
        if (senBonusActionReady) {
          senBonusActionReady = false;
          isExecuting = true;
          const wrapEl = (DOM.compWraps && DOM.compWraps[tag]) || document.getElementById(`wrap-comp-${tag}`);
          triggerSkillSlamImpact(wrapEl, false);
          runCompSkillLogic(tag, () => finishExecution());
          return;
        }
        commitCompSkillSelection(tag);
        return;
      }
      openCompSlotPopup(tag, `
        <div style="font-size:10px; color:#d8b4fe; font-weight:bold; border-bottom:1px solid #282f44; padding-bottom:3px;">🕸️ [광역 파동망] 전장 적 개체 수</div>
        <button class="status-modal-item" onclick="commitCompSlotOption('${tag}', { singleEnemy: false }, event)">⚔️ 다수 적 (적 전체 광역 1 피해 & 이번R 공격력 -1)</button>
        <button class="status-modal-item" onclick="commitCompSlotOption('${tag}', { singleEnemy: true }, event)">🎯 단독 적 1체 (응축 고정 3 피해 & 이번R 공격력 -3)</button>
      `);
      return;
    }

    if (sk.id === 'so_3_2') {
      const ampBonus = (heat >= 70) ? 5 : 3;
      openCompSlotPopup(tag, `
        <div style="font-size:10px; color:#f472b6; font-weight:bold; border-bottom:1px solid #282f44; padding-bottom:3px;">🔥 [열기 공명진] 조율 효과 선택</div>
        <button class="status-modal-item" onclick="commitCompSlotOption('${tag}', { resonanceMode: 'amp' }, event)">⚡ 공명 증폭: 이번R 베어러 직접 타격 피해 +${ampBonus} 증가${heat >= 70 ? ' (과열70+ 강화!)' : ''}</button>
        <button class="status-modal-item" onclick="commitCompSlotOption('${tag}', { resonanceMode: 'vent' }, event)">❄️ 공명 환기: 적 1체 무판정 3 피해 & 베어러 과열 즉시 -20 냉각</button>
      `);
      return;
    }

    if (sk.id === 'so_4_2') {
      const canBurnPyrite = (pyrite >= 1);
      openCompSlotPopup(tag, `
        <div style="font-size:10px; color:#d8b4fe; font-weight:bold; border-bottom:1px solid #282f44; padding-bottom:3px;">💎 [휘석 과부하: 허공 붕괴] 휘석 연소 여부</div>
        <button class="status-modal-item" onclick="commitCompSlotOption('${tag}', { burnPyrite: false }, event)">🔮 기본 시전: 광역 8 피해 + [방어 약화] 부여</button>
        <button class="status-modal-item" ${!canBurnPyrite ? 'disabled style="opacity:0.4;"' : `onclick="commitCompSlotOption('${tag}', { burnPyrite: true }, event)"`}>💎 휘석 1개 소모: 명중 [유리함] + 광역 8 피해 + [방어 약화] + 적 공격력 -3</button>
      `);
      return;
    }

    if (sk.id === 'ms_1_1' || sk.id === 'ms_2_1' || sk.id === 'r_1_1' || sk.id === 'r_1_3' || sk.id === 'r_2_1' || sk.id === 'r_4_1') {
      if (hasSyncedEnemyData) {
        compSlotOptions[tag] = { autoResolved: true, singleEnemy: (livingSynced.length === 1), enemyUid: selectedCompTargetUid };
        if (senBonusActionReady) {
          senBonusActionReady = false;
          isExecuting = true;
          const wrapEl = (DOM.compWraps && DOM.compWraps[tag]) || document.getElementById(`wrap-comp-${tag}`);
          triggerSkillSlamImpact(wrapEl, false);
          runCompSkillLogic(tag, () => finishExecution());
          return;
        }
        commitCompSkillSelection(tag);
        return;
      }
    }

    if (sk.id === 'ms_1_1') {
      openCompSlotPopup(tag, `
        <div style="font-size:10px; color:#7dd3fc; font-weight:bold; border-bottom:1px solid #282f44; padding-bottom:3px;">⚡ [섬광 찌르기] 전장 적 개체 수</div>
        <button class="status-modal-item" onclick="commitCompSlotOption('${tag}', { singleEnemy: false }, event)">⚔️ 다수 적 (대상 3 피해 + 대상 외 다른 모든 적에게 파편 1 피해 + 차징+1)</button>
        <button class="status-modal-item" onclick="commitCompSlotOption('${tag}', { singleEnemy: true }, event)">🎯 단독 적 1체 (파편 집중 고정 4 피해 + 차징+1)</button>
      `);
      return;
    }

    if (sk.id === 'ms_2_1') {
      openCompSlotPopup(tag, `
        <div style="font-size:10px; color:#7dd3fc; font-weight:bold; border-bottom:1px solid #282f44; padding-bottom:3px;">⚡ [질풍 연격] 대상 조건 확인</div>
        <button class="status-modal-item" onclick="commitCompSlotOption('${tag}', { condAdv: true }, event)">✨ 사각 포착(마검사 미포함 인텐트) 또는 상태이상 적 (명중 [유리함] + 3 피해 & 차징+1)</button>
        <button class="status-modal-item" onclick="commitCompSlotOption('${tag}', { condAdv: false }, event)">⚔️ 일반 대상 공격 (기본 명중 + 3 피해 & 차징+1)</button>
      `);
      return;
    }

    if (sk.id === 'r_1_1') {
      openCompSlotPopup(tag, `
        <div style="font-size:10px; color:#6ee7b7; font-weight:bold; border-bottom:1px solid #282f44; padding-bottom:3px;">🌙 [사신의 낫질] 대상 지속 피해 보유 여부</div>
        <button class="status-modal-item" onclick="commitCompSlotOption('${tag}', { condAdv: true }, event)">✨ 지속 피해 없는 적 공격 (명중 [유리함] + 2 피해 & 지속피해:2)</button>
        <button class="status-modal-item" onclick="commitCompSlotOption('${tag}', { condAdv: false }, event)">🩸 이미 지속 피해 있는 적 (기본 명중 + 2 피해 & 지속피해:2)</button>
      `);
      return;
    }

    if (sk.id === 'r_1_3') {
      openCompSlotPopup(tag, `
        <div style="font-size:10px; color:#6ee7b7; font-weight:bold; border-bottom:1px solid #282f44; padding-bottom:3px;">🐍 [맹독 주입] 대상 인텐트 조건</div>
        <button class="status-modal-item" onclick="commitCompSlotOption('${tag}', { condAdv: true }, event)">✨ 광역/충전 인텐트 적 공격 (명중 [유리함] + 6 피해 & 행동제약)</button>
        <button class="status-modal-item" onclick="commitCompSlotOption('${tag}', { condAdv: false }, event)">⚔️ 일반 인텐트 적 공격 (기본 명중 + 6 피해 & 행동제약)</button>
      `);
      return;
    }

    if (sk.id === 'r_2_1') {
      openCompSlotPopup(tag, `
        <div style="font-size:10px; color:#6ee7b7; font-weight:bold; border-bottom:1px solid #282f44; padding-bottom:3px;">☠️ [독무의 낫질] 전장 적 개체 수</div>
        <button class="status-modal-item" onclick="commitCompSlotOption('${tag}', { singleEnemy: false }, event)">⚔️ 다수 적 (적 전체 광역 3 피해 + [지속 피해: 2] 2R)</button>
        <button class="status-modal-item" onclick="commitCompSlotOption('${tag}', { singleEnemy: true }, event)">🎯 단독 적 1체 (집중 고정 4 피해 + [지속 피해: 3] 2R)</button>
      `);
      return;
    }

    if (sk.id === 'r_4_1') {
      openCompSlotPopup(tag, `
        <div style="font-size:10px; color:#6ee7b7; font-weight:bold; border-bottom:1px solid #282f44; padding-bottom:3px;">💀 [절명의 수확: 마지막 수의] 대상 지속 피해 합산값</div>
        <button class="status-modal-item" onclick="commitCompSlotOption('${tag}', { condAdv: true, dotSum: 2 }, event)">🩸 지속피해 합 2 보유 (유리함 · 9피해 + 방무 4 추가피해 + 방약·행동제약)</button>
        <button class="status-modal-item" onclick="commitCompSlotOption('${tag}', { condAdv: true, dotSum: 3 }, event)">🩸 지속피해 합 3 보유 (유리함 · 9피해 + 방무 6 추가피해 + 방약·행동제약)</button>
        <button class="status-modal-item" onclick="commitCompSlotOption('${tag}', { condAdv: true, dotSum: 5 }, event)">🩸 지속피해 합 5 보유 (유리함 · 9피해 + 방무 10 추가피해 + 방약·행동제약)</button>
        <button class="status-modal-item" onclick="commitCompSlotOption('${tag}', { condAdv: false, dotSum: 0 }, event)">⚔️ 지속피해 미보유 적 (기본 명중 · 단일 9 피해)</button>
      `);
      return;
    }

    if (senBonusActionReady) {
      senBonusActionReady = false;
      isExecuting = true;
      const wrapEl = (DOM.compWraps && DOM.compWraps[tag]) || document.getElementById(`wrap-comp-${tag}`);
      triggerSkillSlamImpact(wrapEl, false);
      runCompSkillLogic(tag, () => {
        finishExecution();
      });
      return;
    }

    commitCompSkillSelection(tag);
  }

  function commitCompSkillSelection(tag) {
    ensureValidEnemyTargets();
    if (tag !== 'HEAT') {
      if (!compSlotOptions[tag]) compSlotOptions[tag] = {};
      if (!compSlotOptions[tag].enemyUid && selectedCompTargetUid) {
        compSlotOptions[tag].enemyUid = selectedCompTargetUid;
      }
    }
    executeCompSkillImmediate(tag);
  }
  window.commitCompSkillSelection = commitCompSkillSelection;

  function clearActionQueue() {
    if (isExecuting) return;
    clearAllSkillTimers();
    closeAllStatusMenus();
    actionQueue = []; playBeep(280, 'sine', 0.08); renderQueueUI(); refreshUI();
  }

  function renderQueueUI() {
    [0, 1, 2, 3, 4].forEach(idx => {
      const card = (DOM.skillCards && DOM.skillCards[idx]) || document.getElementById(`card-bearer-${idx}`);
      if (card) {
        card.classList.remove('skill-queued-1', 'skill-queued-2');
        const old = card.querySelector('.queue-badge'); if (old) old.remove();
        const oldTag = card.querySelector('.queue-target-tag'); if (oldTag) oldTag.remove();
      }
    });
    ['A', 'B', 'C', 'HEAT'].forEach(tag => {
      const wrap = (DOM.compWraps && DOM.compWraps[tag]) || document.getElementById(`wrap-comp-${tag}`);
      if (wrap) {
        wrap.classList.remove('skill-queued-1', 'skill-queued-2');
        const old = wrap.querySelector('.queue-badge'); if (old) old.remove();
        const oldTag = wrap.querySelector('.queue-target-tag'); if (oldTag) oldTag.remove();
      }
    });

    const living = (typeof getLivingSyncedEnemies === 'function') ? getLivingSyncedEnemies() : [];

    actionQueue.forEach((item, index) => {
      const orderNum = index + 1;
      const targetEl = (item.actor === 'bearer') 
        ? ((DOM.skillCards && DOM.skillCards[item.key]) || document.getElementById(`card-bearer-${item.key}`))
        : ((DOM.compWraps && DOM.compWraps[item.key]) || document.getElementById(`wrap-comp-${item.key}`));
      if (targetEl) {
        targetEl.classList.add(orderNum === 1 ? 'skill-queued-1' : 'skill-queued-2');
        const badge = document.createElement('div');
        badge.className = `queue-badge ${orderNum === 1 ? 'q1' : 'q2'}`;
        badge.innerText = `${orderNum}`;
        targetEl.appendChild(badge);

        if (living.length > 0) {
          let targetLabel = '';
          if (item.actor === 'bearer') {
            const sk = getBearerSkillById(bearerDeck[item.key]);
            const opt = slotRunOptions[item.key] || {};
            if (isBearerSkillSingleEnemyTarget(sk, opt)) {
              const en = getTargetEnemyForActor('bearer', opt.enemyUid);
              if (en) targetLabel = `🎯${en.name}`;
            } else if (isBearerSkillAoeEnemyTarget(sk, opt)) {
              targetLabel = `🎯적 전체(${living.length})`;
            }
          } else if (item.key !== 'HEAT') {
            const sIdx = (item.key === 'A') ? 0 : ((item.key === 'B') ? 1 : 2);
            const sk = getCompSkillById(compDeck[sIdx]);
            const opt = compSlotOptions[item.key] || {};
            if (isCompSkillSingleEnemyTarget(sk, opt)) {
              const en = getTargetEnemyForActor('comp', opt.enemyUid);
              if (en) targetLabel = `🎯${en.name}`;
            } else if (isCompSkillAoeEnemyTarget(sk, opt)) {
              targetLabel = `🎯적 전체(${living.length})`;
            }
          }
          if (targetLabel) {
            const tTag = document.createElement('div');
            tTag.className = 'queue-target-tag';
            tTag.innerText = targetLabel;
            targetEl.appendChild(tTag);
          }
        }
      }
    });

    const execBtn = DOM.btnExecQueue || document.getElementById('btn-execute-queue');
    if (execBtn) {
      execBtn.innerText = `⚔ 전술 행동 실행 (${actionQueue.length} / 2)`;
      execBtn.disabled = (actionQueue.length === 0 || isExecuting);
    }
  }

  function triggerCombatStartPerks(isManual = false) {
    if (combatStarted) {
      if (isManual) {
        playBeep(420, 'sine', 0.08);
        log(`⚔️ <b>[교전 진행 중]</b> 이미 전투가 개시된 상태입니다. (현재 ${curRound}라운드 / 전투 종료 후 다시 개시 가능)`);
      }
      return;
    }
    combatStarted = true;
    curRound = 1;
    bearerDirectDmgThisRound = 0;
    bearerTookHpDmgThisRound = false;
    bearerAttackRollUsedThisRound = false;
    compAttackRollUsedThisRound = false;
    bearerActedThisRound = false;
    compActedThisRound = false;
    bearerDealtDirectHitThisRound = false;
    compDealtDirectHitThisRound = false;
    if (isManual) {
      lastRoundActionSummary = [];
    }

    if (pickedOrigin && pickedOrigin.includes('티손')) {
      const prevHp = hp, prevCompHp = compHp;
      hp = Math.min(maxHp, hp + 1);
      if (compHp > 0) compHp = Math.min(compMaxHp, compHp + 1);
      playBeep(640, 'sine', 0.18);
      log(`🌿 <b>[출신 특전: 바람의 조율]</b> 전투 시작! 대지의 숨결이 감돌며 아군 전체(베어러 및 ${getCompName()})의 HP가 <b>+1</b> 회복되었습니다! (베어러: <b>${prevHp}➔${hp}/${maxHp}</b>, 동료: <b>${prevCompHp}➔${compHp}/${compMaxHp}</b>)`);
      recordActionBriefing(`▶ [출신 특전: 바람의 조율] 전투 시작 시 아군 전체 HP +1 회복 (베어러 ${hp}/${maxHp}, ${getCompName()} ${compHp}/${compMaxHp})`);
    } else if (pickedOrigin && pickedOrigin.includes('르니그')) {
      playBeep(520, 'sawtooth', 0.18);
      const livingNow = (typeof getLivingSyncedEnemies === 'function') ? getLivingSyncedEnemies() : [];
      livingNow.forEach(en => applyLocalSyncedEnemyDamage(en, 1, false));
      if (typeof sendPlayerActionPacketToGm === 'function') {
        sendPlayerActionPacketToGm([{ kind: 'aoe_damage', dmg: 1, ignoreShield: false, label: '출신 특전: 단조된 근골(적 전체 1 피해)' }]);
      }
      log(`⚡ <b>[출신 특전: 단조된 근골]</b> 전투 시작! 강철 같은 투기가 폭발하여 전장의 모든 적에게 판정 없이 <b>고정 1 피해</b>를 입힙니다!`);
      recordActionBriefing(`▶ [출신 특전: 단조된 근골] 전투 시작 시 전장의 모든 적에게 판정 없이 고정 1 피해`);
    } else if (isManual) {
      playBeep(580, 'triangle', 0.15);
      log(`⚔️ <b>[전투 개시 선언]</b> 1라운드 교전을 시작합니다!`);
      recordActionBriefing(`▶ [전투 개시] 1라운드 교전 돌입`);
    }

    if (hasBearerPassive('견뎌내기')) {
      grantShield('bearer', 3, '견뎌내기 패시브(전투 시작)');
      recordActionBriefing(`▶ [패시브: 견뎌내기] 전투 시작 시 베어러 방어막 3 획득`);
    }
    if (hasBearerPassive('주의 집중')) {
      log(`🛡️ <b>[패시브: 주의 집중]</b> 적 인텐트 최소 2개 베어러 강제 지정 & 베어러 상시 피격 피해 -2 감소 적용 중!`);
    }

    refreshUI();
    saveSessionState();
  }

  function startCombat() {
    if (isExecuting) return;
    triggerCombatStartPerks(true);
  }

  function executeQueuedActions() {
    if (actionQueue.length === 0 || isExecuting) return;
    isExecuting = true;
    closeAllStatusMenus();
    demoteOldRoundLogs();
    lastRoundActionSummary = [];
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
    pendingGmActionEffects = [];
    if (!combatStarted && curRound === 1) {
      triggerCombatStartPerks(false);
    }
    document.getElementById('btn-execute-queue').disabled = true;
    const first = actionQueue[0], second = actionQueue[1] || null;

    const watchdogDuration = second ? 16000 : 9500;
    const watchdogTimer = setTimeout(() => {
      if (isExecuting) finishExecution();
    }, watchdogDuration);

    const safeFinish = () => {
      clearTimeout(watchdogTimer);
      finishExecution();
    };

    try {
      executeSingleAction(first, () => {
        if (second) {
          setTimeout(() => {
            try { executeSingleAction(second, safeFinish); }
            catch(e) { safeFinish(); }
          }, 650);
        } else {
          safeFinish();
        }
      });
    } catch(err) {
      safeFinish();
    }
  }

  function finishExecution() {
    clearAllSkillTimers();
    if (senBonusActionReady && compHp > 0) {
      isExecuting = false;
      actionQueue = [];
      renderQueueUI();
      refreshUI();
      log(`⚡ <b>[무영의 검무: 이번 라운드 추가 행동 대기]</b> 아직 <b>${curRound}라운드</b>가 종료되지 않았습니다! 동료 기술 바에서 <b>추가로 발동할 다른 스킬 1개</b>를 클릭하세요. (건너뛰려면 [취소] 클릭)`);
      saveSessionState();
      return;
    }
    isExecuting = false; actionQueue = [];

    const hasEnemySync = (syncedEnemies.length > 0);

    // 1. 등지기 4Lv 패시브 [공명하는 등불] 동일 적 명중 검증 (즉시 실행에서 이미 발동했다면 중복 방지)
    if (hasBearerPassive('공명하는 등불') && resonantLampTriggeredRound !== curRound) {
      const commonRollUids = [...bearerRollHitUidsThisRound].filter(uid => compRollHitUidsThisRound.has(uid));
      if (hasEnemySync && commonRollUids.length > 0) {
        resonantLampTriggeredRound = curRound;
        const hitNames = [];
        commonRollUids.forEach(uid => {
          const resTarget = getEnemyByUid(uid);
          if (resTarget && resTarget.hp > 0) {
            applyLocalSyncedEnemyDamage(resTarget, 3, false);
            queueGmEffect({ kind: 'damage', targetUid: resTarget.uid, dmg: 3, ignoreShield: false, label: '공명하는 등불 +3' });
            hitNames.push(`${resTarget.name}(잔여 HP ${resTarget.hp}/${resTarget.maxHp})`);
          }
        });
        if (hitNames.length > 0) {
          playBeep(740, 'triangle', 0.15);
          log(`🏮 <b>[패시브: 공명하는 등불]</b> 베어러와 ${getCompName()}이(가) 공통 적중시킨 대상(<b>${hitNames.join(', ')}</b>)에게 성염이 공명하여 <b>고정 3 추가 피해</b>!`);
          recordActionBriefing(`   ↳ 🏮 [패시브: 공명하는 등불] 베어러 & 동료 공통 적중(${hitNames.join(', ')}) ➔ 고정 3 추가 피해`);
        }
      } else if (!hasEnemySync && bearerAttackRollUsedThisRound && compAttackRollUsedThisRound) {
        resonantLampTriggeredRound = curRound;
        playBeep(740, 'triangle', 0.15);
        log(`🏮 <b>[패시브: 공명하는 등불]</b> 베어러와 ${getCompName()}의 명중 공격이 교차하며 성염이 공명합니다! 공통으로 적중한 적에게 <b>고정 3 추가 피해</b>!`);
        recordActionBriefing(`   ↳ 🏮 [패시브: 공명하는 등불] 베어러 & 동료 합동 명중 시 공통 타격 적에게 고정 3 추가 피해`);
      }
    }

    // 2. [Phase 5 & 수술 3단계] 막간의 교감 선언 라운드 [합격기] 동일 적 직접 타격 검증
    if (communionActiveThisRound !== 'none') {
      if (jointAttackTriggeredRound !== curRound) {
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
              if (jTarget && jTarget.hp > 0) {
                applyLocalSyncedEnemyDamage(jTarget, jointDmg, true);
                queueGmEffect({ kind: 'damage', targetUid: jTarget.uid, dmg: jointDmg, ignoreShield: true, label: `합격기(${flameName}) +${jointDmg}` });
                jNames.push(`${jTarget.name}(HP ${jTarget.hp}/${jTarget.maxHp})`);
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
        } else {
          log(`💨 <b>[교감 불꽃 종료]</b> 이번 라운드 [${communionActiveThisRound === 'shine' ? '비추는 불꽃' : '태우는 불꽃'}] 효과가 종료되었습니다.${hasEnemySync && bearerDealtDirectHitThisRound && compDealtDirectHitThisRound ? ' (서로 다른 적을 타격하여 합격기 미발동)' : ''}`);
        }
      }
      communionActiveThisRound = 'none';
    }

    // 2.5. 라운드 종료 반격·특수 스킬 정산 ([복수의 칼날], [불굴의 방파제], [빛의 굴절], [사신의 영역])
    const hasRevengeBlade = compStatuses.some(s => s.name.includes('복수의 칼날')) || bearerStatuses.some(s => s.name.includes('복수의 칼날'));
    if (hasRevengeBlade && warriorTargetedByUidsThisRound.size > 0) {
      const revTargets = [];
      warriorTargetedByUidsThisRound.forEach(uid => {
        const en = getEnemyByUid(uid);
        if (en && en.hp > 0) {
          applyLocalSyncedEnemyDamage(en, 3, false);
          queueGmEffect({ kind: 'damage', targetUid: en.uid, dmg: 3, ignoreShield: false, label: '복수의 칼날 반격 3 피해' });
          revTargets.push(`${en.name}(HP ${en.hp}/${en.maxHp})`);
        }
      });
      if (revTargets.length > 0) {
        log(`🗡️ <b>[복수의 칼날 라운드 종료 반격!]</b> 이번 라운드 공격을 시도한 적(<b>${revTargets.join(', ')}</b>)에게 각각 판정 없이 <b>고정 3 피해</b>를 입혔습니다!`);
        recordActionBriefing(`   ↳ 🗡️ [복수의 칼날 종료 반격] ${revTargets.join(', ')}에게 무판정 고정 3 피해`);
      }
    }

    const hasBulwark = compStatuses.some(s => s.name.includes('불굴의 방파제')) || bearerStatuses.some(s => s.name.includes('불굴의 방파제'));
    if (hasBulwark && warriorDirectHitCountThisRound > 0) {
      const bulwarkDmg = warriorDirectHitCountThisRound * 4;
      const livingNow = getLivingSyncedEnemies();
      livingNow.forEach(en => applyLocalSyncedEnemyDamage(en, bulwarkDmg, false));
      queueGmEffect({ kind: 'aoe_damage', dmg: bulwarkDmg, ignoreShield: false, label: `불굴의 방파제(${warriorDirectHitCountThisRound}회 피격 반격 ${bulwarkDmg} 피해)` });
      log(`🏰 <b>[불굴의 방파제 라운드 종료 반격!]</b> 직접 피격당한 횟수(<b>${warriorDirectHitCountThisRound}회</b>)에 비례하여 적 전체에게 판정 없이 <b>고정 ${bulwarkDmg} 광역 피해</b>를 입혔습니다!`);
      recordActionBriefing(`   ↳ 🏰 [불굴의 방파제 종료 반격] 피격 ${warriorDirectHitCountThisRound}회 ➔ 적 전체 무판정 고정 ${bulwarkDmg} 광역 피해`);
    }

    if (reaperDomainActiveThisRound) {
      reaperDomainActiveThisRound = false;
      let totalDot = lastGmRoundEndDotSum;
      if (totalDot <= 0) {
        getLivingSyncedEnemies().forEach(en => {
          if (en.status && Array.isArray(en.status.dots)) {
            en.status.dots.forEach(d => { if (d.turns > 0) totalDot += (Number(d.dmg) || 0); });
          }
        });
      }
      if (totalDot > 0) {
        const healAmt = Math.min(6, Math.ceil(totalDot / 2));
        hp = Math.min(maxHp, hp + healAmt);
        if (compHp > 0) compHp = Math.min(compMaxHp, compHp + healAmt);
        log(`⚰️ <b>[사신의 영역: 백골의 안식처 흡혈]</b> 적들이 입은 지속 피해 총합(<b>${totalDot}</b>)의 절반(올림, 최대 6)만큼 베어러와 ${getCompName()}의 HP를 각각 <b>+${healAmt}</b> 회복했습니다!`);
        recordActionBriefing(`   ↳ ⚰️ [사신의 영역 흡혈] 적 지속피해 총합 ${totalDot} ➔ 아군 전체 HP +${healAmt} 회복`);
      }
      lastGmRoundEndDotSum = 0;
    }

    // 4단계 브릿지용: 이번 라운드 누적된 타격 패킷을 GM 컨트롤러로 일괄 전송
    if (pendingGmActionEffects.length > 0 && typeof sendPlayerActionPacketToGm === 'function') {
      sendPlayerActionPacketToGm(pendingGmActionEffects);
      pendingGmActionEffects = [];
    }

    // 3. 등지기 대성공 [찬란한 백광의 은신] 잔상 유지 체크
    const hadWhiteHide = bearerStatuses.some(s => s.name === '✨ 찬란한 백광의 은신 (피격 0)');
    if (hadWhiteHide && !bearerTookHpDmgThisRound) {
      applyTargetStatus('bearer', '✨ 백광의 잔상 (1회 피격 0)', 'buff', '[등지기 대성공 잔상] 다음 라운드 종료 전까지 받는 첫 피격 1회의 피해를 0으로 무효화');
      log(`✨ <b>[찬란한 백광의 잔상 유지]</b> 이번 라운드 등지기가 피격당하지 않아, 다음 라운드 종료 전까지 받는 첫 피격 1회의 피해를 0으로 무효화합니다!`);
    }

    // 4. 마검사 [마탄 응축] 라운드 종료 시 잔여 방어막 1 이상이면 해제 후 1스택 재회수 (룰북 v2.24 원문)
    if (pickedComp === '센' && senCondenseActive) {
      senCondenseActive = false;
      if (compShield >= 1 && compHp > 0) {
        const prevS = compShield;
        compShield = 0;
        senCharge = Math.min(3, senCharge + 1);
        log(`🔮 <b>[마탄 응축 회수]</b> 라운드 종료 시 ${getCompName()}의 잔여 방어막(<b>${prevS}➔0 해제</b>)을 마탄으로 재회수하여 <b>[마탄 차징 +1스택]</b>을 획득했습니다! (현재: <b>${senCharge}/3</b>)`);
        recordActionBriefing(`   ↳ 🔮 [마탄 응축 회수] 잔여 방어막(${prevS}) 해제 후 마탄 차징 +1스택 회수 (${senCharge}/3)`);
      }
    }

    curRound++;
    bearerActedThisRound = false;
    compActedThisRound = false;
    ['A', 'B', 'C'].forEach(tag => {
      if (compCds[tag] > 0) compCds[tag]--;
    });
    compCd = Math.max(compCds.A || 0, compCds.B || 0, compCds.C || 0);
    const execBtn = document.getElementById('btn-execute-queue');
    if (execBtn) {
      execBtn.innerText = `⚔ 전술 행동 실행 (0 / 2)`;
      execBtn.disabled = true;
    }

    const hadEvasion = bearerStatuses.some(s => s.name === '💨 무형보' || s.name.includes('비연참'));
    bearerEvadedLastRound = Boolean(bearerDodgedAttackThisRound || hadEvasion);
    bearerDodgedAttackThisRound = false;

    // 등지기 3Lv [빛의 굴절] 라운드 종료 판정 (이번 라운드 베어러 최종 직접 피격 피해 합산값 짝수 -> 차턴 아군 전원 유리함 / 홀수 -> 차턴 적 전원 불리함)
    const hadRefraction = bearerStatuses.some(s => s.name === '🌈 빛의 굴절');

    // 5. 이번 라운드 한정 버프/디버프 정리 및 다음 라운드 연쇄 버프 승격
    bearerStatuses = bearerStatuses.filter(s => 
      !s.name.includes('피격 경감') && 
      s.name !== '🛡️ 쳐내고 베기' &&
      s.name !== '🛡️ 백색 철벽' &&
      s.name !== '⚔️ 결사의 수호' &&
      s.name !== '🛡️ 무결점의 방어' &&
      s.name !== '🔥 성염 인챈트' &&
      s.name !== '💨 무형보' &&
      s.name !== '🦅 비연참' &&
      s.name !== '🌪️ 질풍참' &&
      s.name !== '🗡️ 비월절명' &&
      s.name !== '🪞 원격 투영' &&
      s.name !== '☀️ 태양의 부름 (도발·적불리)' &&
      s.name !== '🌈 빛의 굴절' &&
      s.name !== '🛡️ 투지 발휘 (피격-3·면역)' &&
      s.name !== '🛡️ 전열의 고함 (피격 -3)' &&
      s.name !== '🗡️ 복수의 칼날 (피격-2·반격3)' &&
      s.name !== '🏰 불굴의 방파제 (피격-4·반격4)' &&
      s.name !== '⚡ 역장 패링 (회피반격2)' &&
      s.name !== '⚡ 무영의 검무 (피격 -3)' &&
      s.name !== '🌀 회귀일원 (+2 피해)' &&
      s.name !== '🦶 허상의 디딤돌 (무적)' &&
      s.name !== '🪨 융기하는 성염 암벽 (피격 -3)' &&
      s.name !== '✨ 찬란한 백광의 은신 (피격 0)' &&
      s.name !== '⚠️ 꿰뚫린 검 (AC -2)' &&
      s.name !== '🤸 배후 도약 (AC +1)' &&
      s.name !== '⚠️ 노출된 불빛 (AC -2)' &&
      s.name !== '🔥 태우는 불꽃 (+3 피해)' &&
      s.name !== '🔥 공명 증폭 (+3 피해)' &&
      s.name !== '🔥 공명 증폭 (+5 피해)' &&
      s.name !== '☯️ 생사 역전 (피격 -3)' &&
      s.name !== '🌿 약초 연무 (피격 -2)'
    );

    if (hadRefraction) {
      if (bearerTakenDirectDmgSumThisRound % 2 === 0) {
        applyTargetStatus('bearer', '✨ 다음 공격 유리함', 'buff', `[빛의 굴절: 피격 합산 ${bearerTakenDirectDmgSumThisRound}(짝수)] 다음 라운드 공격 명중 판정 [유리함]`);
        applyTargetStatus('comp', '✨ 다음 공격 유리함', 'buff', `[빛의 굴절: 피격 합산 ${bearerTakenDirectDmgSumThisRound}(짝수)] 다음 라운드 공격 명중 판정 [유리함]`);
        log(`🌈 <b>[빛의 굴절 발동 (피격 합산: ${bearerTakenDirectDmgSumThisRound} · 짝수)]</b> 다음 라운드 <b>모든 아군(베어러 및 ${getCompName()})의 공격 명중 판정에 [유리함]</b>이 부여됩니다!`);
      } else {
        getLivingSyncedEnemies().forEach(en => { en.forceDis = true; en.forceDisTurns = 1; });
        if (typeof sendPlayerActionPacketToGm === 'function') {
          sendPlayerActionPacketToGm([{ kind: 'aoe_debuff', forceDis: true, forceDisTurns: 2, label: `빛의 굴절(피격 ${bearerTakenDirectDmgSumThisRound} 홀수 ➔ 차턴 적 전체 불리함)` }]);
        }
        log(`🌈 <b>[빛의 굴절 발동 (피격 합산: ${bearerTakenDirectDmgSumThisRound} · 홀수)]</b> 다음 라운드 <b>모든 적의 공격 명중 판정에 [불리함]</b>을 강제합니다!`);
      }
    }
    bearerHitDamagesThisRound = [];
    bearerTakenDirectDmgSumThisRound = 0;
    warriorTargetedByUidsThisRound.clear();
    warriorDirectHitCountThisRound = 0;
    compRevivedThisRound = false;
    compStatuses = compStatuses.filter(s => 
      s.name !== '🛡️ 육탄 엄호' &&
      s.name !== '🛡️ 스프링보드' &&
      s.name !== '✨ 스프링보드 유리함' &&
      s.name !== '🛡️ 재정비 중 (행동불가·단일타겟면역)' &&
      s.name !== '🪨 융기하는 성염 암벽 (피격 -3)' &&
      s.name !== '🔥 태우는 불꽃 (+3 피해)' &&
      s.name !== '🛡️ 전열의 고함 (피격 -3)' &&
      s.name !== '🗡️ 복수의 칼날 (피격-2·반격3)' &&
      s.name !== '🏰 불굴의 방파제 (피격-4·반격4)' &&
      s.name !== '⚡ 역장 패링 (회피반격2·차징+1)' &&
      s.name !== '⚡ 무영의 검무 (피격 -3)' &&
      s.name !== '🌿 약초 연무 (피격 -2)'
    );

    const nextDmgBuff = bearerStatuses.find(s => s.name === '☄️ 불꽃의 비 (차턴 +3)' || s.name === '🦶 허상의 디딤돌 (차턴 +3)');
    if (nextDmgBuff) {
      bearerStatuses = bearerStatuses.filter(s => s.id !== nextDmgBuff.id);
      applyTargetStatus('bearer', '🔥 성염 증폭 (+3 피해)', 'buff', '이번 라운드 베어러 공격 피해량 고정 +3 증가');
    }

    // 메이지 대실패 차턴 행동 제약 승격
    const nextMageRestr = bearerStatuses.find(s => s.name === '⛓️ 마력 역류 (차턴 행동제약)');
    bearerStatuses = bearerStatuses.filter(s => !s.name.includes('행동 제약') || s.name === '⛓️ 마력 역류 (차턴 행동제약)');
    compStatuses = compStatuses.filter(s => !s.name.includes('행동 제약'));
    if (nextMageRestr) {
      bearerStatuses = bearerStatuses.filter(s => s.id !== nextMageRestr.id);
      applyTargetStatus('bearer', '행동 제약', 'debuff', '[메이지 대실패 연쇄] 이번 라운드 서클 마법 시전 불가 (캔트립 또는 벤트만 가능)');
    }

    // 6. 유지비 정산 (군신의 혼, 성염 장전, 타오르는 칼날, 과부하 조광)
    if (warGodSoulActive || bearerStatuses.some(s => s.name.includes('군신의 혼'))) {
      if (hp <= 0) {
        warGodSoulActive = false;
        bearerStatuses = bearerStatuses.filter(s => !s.name.includes('군신의 혼'));
      } else {
        applyHeatIncrease(10, '군신의 혼 유지비');
        log(`🔥 <b>[군신의 혼 유지비]</b> 상태이상 완전 면역 & 직접 피해 +3 유지를 위해 과열 <b>+10</b> 누적 (현재 과열: <b>${heat}/100</b>) <button class="status-add-btn" style="padding:1px 5px; font-size:10px; margin-left:4px;" onclick="warGodSoulActive=false; bearerStatuses=bearerStatuses.filter(s=>!s.name.includes('군신의 혼')); renderStatuses(); log('🔥 [군신의 혼]을 수동 해제했습니다.'); refreshUI();">✕ 해제</button>`);
      }
    }

    if (mageChargedSpells.length > 0 && hp > 0) {
      applyHeatIncrease(10, '성염 장전 유지비');
      log(`🔮 <b>[성염 장전 유지비]</b> 지팡이에 충전된 마법(${mageChargedSpells.length}개) 유지를 위해 라운드 종료 시 과열 <b>+10</b> 상승! (현재 과열: <b>${heat}/100</b>)`);
      recordActionBriefing(`   ↳ 🔮 [성염 장전 유지비] 라운드 종료 과열 +10 (현재 과열: ${heat}/100)`);
    }

    if (blazingBladeActive || compStatuses.some(s => s.name.includes('타오르는 칼날'))) {
      if (compHp <= 0) {
        blazingBladeActive = false;
        compStatuses = compStatuses.filter(s => !s.name.includes('타오르는 칼날'));
        log(`🔥 <b>[타오르는 칼날 해제]</b> ${getCompName()}이(가) 탈진하여 [타오르는 칼날] 버프가 해제되었습니다.`);
      } else {
        compHp = Math.max(0, compHp - 1);
        if (compHp <= 0) {
          blazingBladeActive = false;
          compStatuses = compStatuses.filter(s => !s.name.includes('타오르는 칼날'));
          log(`🔥 <b>[타오르는 칼날 유지비 ➔ 탈진 해제]</b> ${getCompName()}의 실제 HP 1이 차감되어 탈진(HP 0)함에 따라 [타오르는 칼날]이 해제되었습니다. <button class="status-add-btn" style="padding:1px 5px; font-size:10px; margin-left:4px;" onclick="compHp=Math.min(compMaxHp, compHp+1); renderStatuses(); log('🔥 [타오르는 칼날] 유지비를 지불하지 않고 해제하여 동료 HP +1을 복구했습니다.'); refreshUI(); saveSessionState();">↩ 유지비 미지불(HP+1 복구)</button>`);
          recordActionBriefing(`   ↳ 🔥 [타오르는 칼날] 유지비 HP -1 지불 후 동료 탈진(HP 0)으로 해제`);
        } else {
          log(`🔥 <b>[타오르는 칼날 유지비]</b> 방어막을 무시하고 ${getCompName()}의 실제 HP <b>-1</b> 지불 (잔여 HP: <b>${compHp}/${compMaxHp}</b>, 동료 공격 +6 유지) <button class="status-add-btn" style="padding:1px 5px; font-size:10px; margin-left:4px;" onclick="blazingBladeActive=false; compStatuses=compStatuses.filter(s=>!s.name.includes('타오르는 칼날')); compHp=Math.min(compMaxHp, compHp+1); renderStatuses(); log('🔥 [타오르는 칼날] 유지비를 지불하지 않고 해제했습니다(동료 HP +1 복구).'); refreshUI(); saveSessionState();">✕ 유지 해제(HP+1 복구)</button>`);
          recordActionBriefing(`   ↳ 🔥 [타오르는 칼날 유지비] 방어막 무시 ${getCompName()} 실제 HP -1 (잔여 HP: ${compHp}/${compMaxHp})`);
        }
      }
    }

    const overloadBuff = compStatuses.find(s => s.name.includes('과부하 조광'));
    if (overloadBuff) {
      if (hp <= 0 || compHp <= 0) {
        compStatuses = compStatuses.filter(s => !s.name.includes('과부하 조광'));
        log(`💡 <b>[조광 해제]</b> 아군 탈진으로 인해 [과부하 조광] 버프가 해제되었습니다.`);
      } else if ((curRound - 1) > lampOverloadRound) {
        playBeep(420, 'triangle', 0.1);
        applyHeatIncrease(10, '과부하 조광 유지비');
        log(`💡 <b>[과부하 조광 유지비]</b> 다음 라운드 유지를 위해 과열 <b>+10</b> 누적 정산 (현재 과열: <b>${heat}/100</b>) <button class="status-add-btn" style="padding:1px 5px; font-size:10px; margin-left:4px;" onclick="compStatuses = compStatuses.filter(s => !s.name.includes('과부하 조광')); renderStatuses(); log('💡 [과부하 조광] 버프를 수동 해제했습니다.'); refreshUI();">✕ 조광 해제</button>`);
      }
    }

    if (hasBearerPassive('견뎌내기') && hp > 0) {
      grantShield('bearer', 3, '견뎌내기 패시브(라운드 종료)');
    }

    if (hasBearerPassive('회귀일원') && bearerDirectDmgThisRound >= 8) {
      applyTargetStatus('bearer', '🌀 회귀일원 (+2 피해)', 'buff', '직전 라운드 적 실제 HP에 직접 피해 8 이상 달성 ➔ 이번 라운드 모든 공격 피해 +2');
      log(`🌀 <b>[패시브: 회귀일원 발동]</b> 지난 라운드 직접 타격 피해(${bearerDirectDmgThisRound}) 8 이상! 이번 라운드 베어러 공격 피해량이 <b>+2</b> 증가합니다! <span style="font-size:10px; color:#94a3b8;">(적 빗나감·방어막 상쇄로 실제 HP 피해가 8 미만이었다면 상태 칩 ✕를 눌러 해제하세요)</span>`);
    }
    bearerDirectDmgThisRound = 0;

    // 7. 아군에게 걸려 있는 지속 피해(방어막 무시) 정산 (동일 대상 다중 DoT 합산 1회 단일 로그 처리로 하이라이트 중첩 방어)
    let bearerDotSum = 0;
    let bearerDotLabels = [];
    bearerStatuses.forEach(s => {
      const m = s.name.match(/지속 피해\s*:\s*(\d+)/);
      if (m && hp > 0) {
        bearerDotSum += parseInt(m[1], 10);
        bearerDotLabels.push(s.name);
      }
    });
    if (bearerDotSum > 0 && hp > 0) {
      hp = Math.max(0, hp - bearerDotSum);
      bearerTookHpDmgThisRound = true;
      log(`🩸 <b>[베어러 지속 피해 정산]</b> 라운드 종료! <b>[${bearerDotLabels.join(', ')}]</b> 발동 ➔ 방어막 무시 실제 HP <b>-${bearerDotSum}</b> (잔여 HP: <b>${hp}/${maxHp}</b>)`);
    }

    let compDotSum = 0;
    let compDotLabels = [];
    compStatuses.forEach(s => {
      const m = s.name.match(/지속 피해\s*:\s*(\d+)/);
      if (m && compHp > 0) {
        compDotSum += parseInt(m[1], 10);
        compDotLabels.push(s.name);
      }
    });
    if (compDotSum > 0 && compHp > 0) {
      compHp = Math.max(0, compHp - compDotSum);
      log(`🩸 <b>[동료 지속 피해 정산]</b> 라운드 종료! ${getCompName()} <b>[${compDotLabels.join(', ')}]</b> 발동 ➔ 방어막 무시 실제 HP <b>-${compDotSum}</b> (잔여 HP: <b>${compHp}/${compMaxHp}</b>)`);
    }

    if (hasBearerPassive('홍련지세') && !bearerTookHpDmgThisRound && hp > 0) {
      const livingNow = (typeof getLivingSyncedEnemies === 'function') ? getLivingSyncedEnemies() : [];
      livingNow.forEach(en => applyLocalSyncedEnemyDamage(en, 3, false));
      if (typeof sendPlayerActionPacketToGm === 'function') {
        sendPlayerActionPacketToGm([{ kind: 'aoe_damage', dmg: 3, ignoreShield: false, label: '패시브: 홍련지세(적 전체 3 피해)' }]);
      }
      log(`🌺 <b>[패시브: 홍련지세 만개]</b> 이번 라운드 베어러가 HP 피해를 입지 않아, 검끝에서 잔불이 만개하며 <b>적 전체에게 판정 없이 고정 3 피해</b>를 입힙니다!`);
      recordActionBriefing(`   ↳ 🌺 [패시브: 홍련지세] 무피격 라운드 종료 ➔ 적 전체 판정 없이 고정 3 피해`);
    }
    bearerTookHpDmgThisRound = false;

    renderStatuses();
    renderQueueUI(); refreshUI();
    log(`⏱️ <b>[${curRound}라운드 개시]</b> 전술 행동 큐가 초기화되었습니다. 다음 행동을 선언하십시오.`, 'divider');
    shouldDemoteLogsOnNextAction = true;
    saveSessionState();
  }

  function executeSingleAction(item, callback) {
    resetDicePanelVisuals();
    if (item.actor === 'bearer') runBearerSkillLogic(item.key, callback);
    else runCompSkillLogic(item.key, callback);
  }

  /* ==========================================================================
     [Phase 3 & 5] 베어러 5스킬 덱 실행 엔진 (과열 4단계 원칙 + 대성공/대실패 기믹)
     ========================================================================== */
  function runBearerSkillLogic(slotIdx, cb) {
    ensureValidBearerDeck(false);
    const skillId = bearerDeck[slotIdx];
    const sk = getBearerSkillById(skillId);
    if (!sk || sk.isPassive) {
      if (cb) cb();
      return;
    }

    const opt = slotRunOptions[slotIdx] || {};
    delete slotRunOptions[slotIdx];

    // ① 과열 체크: 시전 선언 시점(과열 증가 전)의 현재 과열 단계 및 공격력 보정 확정
    const preCastHeatStage = getOverheatStage(heat);
    const heatDmgBonus = getOverheatDmgBonus(heat);
    const bonusDmg = curLevel - 1;

    // 등지기 4서클 [원격 투영] 특수 분기
    if (sk.id === 'l_3_2') {
      const projKey = opt.projCompKey || 'A';
      executeProjectedCompSkill(projKey, opt.projOpt || {}, preCastHeatStage, heatDmgBonus, cb);
      return;
    }

    // 메이지 1서클 [성염 장전] 특수 분기
    if (sk.id === 'm_1_3') {
      if (!opt.chargeSpellId) {
        selectBearerSkill(slotIdx, null, true);
        if (cb) cb();
        return;
      }
      const chargeId = opt.chargeSpellId;
      const chargeSk = getBearerSkillById(chargeId) || getBearerSkillById('m_1_1');
      const payCost = (opt.chargeVarCost !== undefined) ? opt.chargeVarCost : (chargeSk.circle === 'var' ? 30 : chargeSk.cost);
      const storedDmg = (chargeSk.circle === 'var') ? ((payCost / 10) * 2) : chargeSk.dmg;
      const cTarget = opt.chargeTarget || 'bearer';
      const targetSuffix = (chargeSk.id === 'm_1_2' || chargeSk.id === 'm_3_2') ? `➔${cTarget === 'comp' ? getCompName() : bearerName}` : '';
      mageChargedSpells.push({
        id: chargeSk.id,
        name: (chargeSk.circle === 'var' ? `${chargeSk.name}(+${payCost})` : chargeSk.name) + targetSuffix,
        dmg: storedDmg,
        varCost: payCost,
        target: cTarget,
        chargedRound: curRound,
        isAoe: chargeSk.isAoe,
        alwaysAdv: Boolean(chargeSk.alwaysAdv)
      });
      document.getElementById('dice-total-display').innerText = '🔮 마법 장전';
      document.getElementById('dice-formula-display').innerText = `[${chargeSk.name}${targetSuffix}] 충전 (${mageChargedSpells.length}/2 · 다음R 개방 가능)`;
      playBeep(620, 'triangle', 0.15);
      log(`🔮 <b>[성염 장전]</b> 지팡이 끝에 <b>[${chargeSk.name}${targetSuffix}]</b> 마법을 응축하여 가두었습니다! (${mageChargedSpells.length}/2 충전 · 시전 과열 <b>+${payCost}</b> 선지불 · <b>다음 라운드부터 무행동 일괄 개방 가능</b>)`);
      recordActionBriefing(`▶ 베어러: [1서클: 성염 장전] ➔ [${chargeSk.name}${targetSuffix}] 충전(${mageChargedSpells.length}/2, 다음R부터 개방 가능) | 과열 +${payCost}`);
      applyHeatIncrease(payCost, `성염 장전(${chargeSk.name})`);
      refreshUI();
      if (cb) cb();
      return;
    }

    // 파이터 대실패 연쇄 [육탄전] 상태 확인
    const brawlChain = bearerStatuses.find(s => s.name.includes('육탄전'));
    let actualCost = (sk.id === 'l_1_1') ? (opt.varCost !== undefined ? opt.varCost : 0) : ((sk.circle === 'var') ? (opt.varCost || 30) : (typeof sk.cost === 'number' ? sk.cost : 0));
    if (brawlChain) {
      actualCost = Math.max(0, actualCost - 10);
    }

    // 비공격/판정 없는 서클 스킬 처리 (백색 철벽, 스프링보드, 무결점의 방어, 군신의 혼, 무형보, 성염 치유, 침묵의 족쇄, 응축된 방벽, 타오르는 칼날, 신기루 장막, 과부하 조광, 태양의 부름, 별빛 유영, 허상의 디딤돌, 빛의 파동, 빛의 굴절)
    if (!sk.isAttack) {
      if (brawlChain) {
        bearerStatuses = bearerStatuses.filter(s => s.id !== brawlChain.id);
      }
      if (sk.id === 'f_1_4') {
        const isDevoted = (opt.guardMode === 'devoted');
        const modeTitle = isDevoted ? '결사의 수호' : '일반 전개';
        grantShield('bearer', 9, `백색 철벽(${modeTitle})`, true);
        if (isDevoted) {
          applyTargetStatus('bearer', '⚔️ 결사의 수호', 'buff', '[백색 철벽] 이번R 베어러 피격 -3 감소 · 동료 단일 공격 강제 전환 / 광역 시 아군 총합 피해를 방어막과 자신의 HP로 전량 흡수');
          queueGmEffect({ kind: 'aoe_taunt', tauntedBy: 'bearer', label: '백색 철벽: 결사의 수호(베어러로 단일공격 전환)' });
          log(`⚔️ <b>[백색 철벽 — 결사의 수호]</b> <b>방어막 9 획득</b> & <span style="color:#93c5fd;">(결사의 수호: 이번 라운드 피격 피해 3 감소 · ${getCompName()} 단일 공격 강제 전환 / 광역 총합 피해 전량 대신 감당)</span>!`);
        } else {
          applyTargetStatus('bearer', '🛡️ 백색 철벽', 'buff', '[백색 철벽: 일반 전개] 이번 라운드 베어러 피격 피해 3 감소 (자신만 보호)');
          log(`🛡️ <b>[백색 철벽 — 일반 전개]</b> <b>방어막 9 획득</b> & <span style="color:#93c5fd;">(백색 철벽: 이번 라운드 자신이 받는 피격 피해 3 감소)</span>!`);
        }
        recordActionBriefing(`▶ 베어러: [백색 철벽 (${modeTitle})] ➔ 방어막 9 획득 & 이번R 피격 -3 감소${isDevoted ? ` (${getCompName()} 단일공격 유도 / 광역 피해 전량 대신 감당)` : ''} | 과열 +${actualCost}`);
      } else if (sk.id === 'f_2_3') {
        applyTargetStatus('comp', '🛡️ 스프링보드', 'buff', '이번 라운드 동료 직접 피격 피해 0 무효화 & 공격 피해 +3');
        applyTargetStatus('comp', '✨ 스프링보드 유리함', 'buff', '[스프링보드] 이번 라운드 동료 공격 명중 판정에 [유리함] 적용');
        log(`🛡️ <b>[스프링보드]</b> 방패를 발판 삼아 ${getCompName()}을(를) 높게 띄워 올렸습니다! 이번 라운드 동료 직접 피격 0 무효화 + 동료 공격 <b>[유리함] 및 피해 +3</b> 부여!`);
        recordActionBriefing(`▶ 베어러: [스프링보드] ➔ 이번R ${getCompName()} 직접 피격 0 무효화 & 공격 [유리함] + 피해 +3 | 과열 +${actualCost}`);
      } else if (sk.id === 'f_3_1') {
        applyTargetStatus('bearer', '🛡️ 무결점의 방어', 'buff', '동료 단일 인텐트 1개 유도 가능 · 이번R 적중 공격 중 [최대-최소] 피해만 적용(1개 적중 시 0)');
        log(`🛡️ <b>[무결점의 방어]</b> 완벽한 방어 태세! 이번 라운드 베어러에게 적중한 공격 중 <b>[최대 피해량 - 최소 피해량]</b>만 받습니다(단 1개만 적중하거나 최대=최소 시 피해 0 무효화)!`);
        recordActionBriefing(`▶ 베어러: [무결점의 방어] ➔ 이번R 적중 공격 [최대-최소] 피해만 적용(단일 적중 시 0 무효화) | 과열 +${actualCost}`);
      } else if (sk.id === 'f_3_2') {
        warGodSoulActive = true;
        bearerStatuses = bearerStatuses.filter(s => s.type !== 'debuff');
        applyTargetStatus('bearer', '🔥 군신의 혼 (+3·면역)', 'buff', '모든 상태이상 완전 면역 & 직접 타격 피해 +3 (라운드당 유지 과열 +10)');
        log(`🔥 <b>[군신의 혼 개방]</b> 모든 상태이상을 즉시 소멸시켰습니다! 유지되는 동안 <b>모든 상태이상에 완전 면역</b>이 되며 파이터의 모든 직접 타격 피해량이 <b>+3</b> 증가합니다!`);
        recordActionBriefing(`▶ 베어러: [군신의 혼] ➔ 모든 상태이상 즉시 소멸 & 상태이상 완전 면역 & 직접 피해 +3 | 과열 +${actualCost}`);
      } else if (sk.id === 's_1_3') {
        applyTargetStatus('bearer', '💨 무형보', 'buff', '이번 라운드 자신을 향한 적 공격 1회 완벽 회피(피해 0)');
        log(`💨 <b>[무형보]</b> 잔상을 남기며 흘려낼 준비를 마쳤습니다! 이번 라운드 자신을 향한 적의 공격 1회를 완벽 회피(피해 0)합니다!`);
        recordActionBriefing(`▶ 베어러: [무형보] ➔ 이번R 자신을 향한 적 공격 1회 완벽 회피(피해 0) | 과열 +${actualCost}`);
      } else if (sk.id === 'm_1_2') {
        const healTarget = opt.target || 'bearer';
        const healAmt = 6 + (hasBearerPassive('치유 증폭') ? 3 : 0);
        if (healTarget === 'bearer') {
          hp = Math.min(maxHp, hp + healAmt);
          log(`✨ <b>[성염 치유]</b> 순백의 성염으로 베어러의 HP를 <b>+${healAmt}</b> 확정 회복했습니다! (현재 HP: <b>${hp}/${maxHp}</b>)`);
          recordActionBriefing(`▶ 베어러: [성염 치유] ➔ 베어러 HP +${healAmt} 확정 회복 (현재 HP: ${hp}/${maxHp}) | 과열 +${actualCost}`);
        } else {
          compHp = Math.min(compMaxHp, compHp + healAmt);
          log(`✨ <b>[성염 치유]</b> 순백의 성염으로 ${getCompName()}의 HP를 <b>+${healAmt}</b> 확정 회복했습니다! (현재 HP: <b>${compHp}/${compMaxHp}</b>)`);
          recordActionBriefing(`▶ 베어러: [성염 치유] ➔ ${getCompName()} HP +${healAmt} 확정 회복 (현재 HP: ${compHp}/${compMaxHp}) | 과열 +${actualCost}`);
        }
      } else if (sk.id === 'm_3_1') {
        const tEn = getTargetEnemyForActor('bearer', opt.enemyUid);
        const tEnName = tEn ? `[🎯${tEn.name}]` : '단일 적 1체';
        if (tEn) {
          applyLocalEnemyBind(tEn, 1);
          queueGmEffect({ kind: 'status', targetUid: tEn.uid, addBindTurns: 1, label: '침묵의 족쇄 [행동 제약]' });
        }
        log(`⛓️ <b>[침묵의 족쇄 ➔ ${tEnName}]</b> 성염의 사슬로 ${tEnName}의 마력과 호흡을 결박하여 이번 라운드 동안 <b>[행동 제약]</b>(충전/광역/상태이상 불가, 기본 단일 공격만 가능)을 확정 부여했습니다!`);
        recordActionBriefing(`▶ 베어러: [침묵의 족쇄 ➔ ${tEnName}] ➔ 판정 없이 이번R [행동 제약] 확정 부여 | 과열 +${actualCost}`);
      } else if (sk.id === 'm_3_2') {
        const sTarget = opt.target || 'bearer';
        grantShield(sTarget, 7, '응축된 방벽');
        const tName = (sTarget === 'bearer') ? bearerName : getCompName();
        recordActionBriefing(`▶ 베어러: [응축된 방벽] ➔ ${tName}에게 [방어막 7] 확정 부여 | 과열 +${actualCost}`);
      } else if (sk.id === 'm_3_3') {
        blazingBladeActive = true;
        applyTargetStatus('comp', '🔥 타오르는 칼날 (+6 피해)', 'buff', '동료가 명중 판정을 굴려 적중시키는 모든 공격 피해 +6 증가 (매 라운드 종료 시 동료 실제 HP 1 소모)');
        log(`🔥 <b>[4서클: 타오르는 칼날]</b> ${getCompName()}의 무기에 순백의 성염을 두릅니다! 유지되는 동안 동료의 모든 명중 공격 피해량이 <b>+6</b> 증가합니다!`);
        recordActionBriefing(`▶ 베어러: [4서클: 타오르는 칼날] ➔ ${getCompName()} 모든 명중 공격 피해 +6 부여 | 과열 +${actualCost}`);
      } else if (sk.id === 'l_1_2') {
        const vTarget = opt.target || 'bearer';
        const vName = (vTarget === 'bearer') ? bearerName : getCompName();
        applyTargetStatus(vTarget, '🌫️ 신기루 장막', 'buff', '5 이하 피해는 1로 경감(최대 2회) / 5 초과 피해는 5 경감 후 즉시 소멸');
        log(`🌫️ <b>[신기루 장막]</b> ${vName} 주변에 빛을 굴절시키는 장막을 전개했습니다! (5 이하 피해➔1로 최대 2회 방어 / 5 초과 피해➔5 경감 후 소멸)`);
        recordActionBriefing(`▶ 베어러: [신기루 장막] ➔ ${vName}에게 장막 전개 | 과열 +${actualCost}`);
      } else if (sk.id === 'l_1_3') {
        lampOverloadRound = curRound;
        applyTargetStatus('comp', '💡 과부하 조광 (+3 기폭)', 'buff', '동료가 명중 판정으로 적중시키는 모든 공격에 [+3 성염 기폭] 추가 (2R부터 유지 과열 +10)');
        log(`💡 <b>[과부하 조광]</b> ${getCompName()}에게 랜턴의 성염을 집중 방출합니다! 동료의 모든 명중 공격마다 <b>[성염 기폭: +3 피해]</b>가 폭발합니다!`);
        recordActionBriefing(`▶ 베어러: [과부하 조광] ➔ ${getCompName()} 공격 적중 시마다 [+3 성염 기폭] 부여 | 과열 +${actualCost}`);
      } else if (sk.id === 'l_2_1') {
        applyTargetStatus('bearer', '🌫️ 신기루 장막', 'buff', '[태양의 부름] 5 이하 피해는 1로 경감(최대 2회) / 5 초과 피해는 5 경감 후 소멸');
        applyTargetStatus('bearer', '☀️ 태양의 부름 (도발·적불리)', 'buff', '모든 적 단일 공격 베어러로 강제 전환 & 베어러 공격하는 적 명중 [불리함]');
        queueGmEffect({ kind: 'aoe_taunt', tauntedBy: 'bearer', forceDis: true, label: '태양의 부름(전체 베어러 도발 & 적 불리함)' });
        log(`☀️ <b>[태양의 부름]</b> 자신에게 즉시 [신기루 장막]을 전개하고, 이번 라운드 모든 적의 단일 공격을 자신에게 강제 전환하며 적들의 명중 판정에 <b>[불리함]</b>을 강제합니다!`);
        recordActionBriefing(`▶ 베어러: [태양의 부름] ➔ 자가 [신기루 장막] 전개 & 모든 단일 공격 유도 & 적 명중 [불리함] 강제 | 과열 +${actualCost}`);
      } else if (sk.id === 'l_2_2') {
        applyTargetStatus('bearer', '✨ 다음 공격 유리함', 'buff', '[별빛 유영] 다음 라운드 공격 명중 판정에 [유리함] 적용');
        applyTargetStatus('comp', '✨ 다음 공격 유리함', 'buff', '[별빛 유영] 다음 라운드 공격 명중 판정에 [유리함] 적용');
        queueGmEffect({ kind: 'aoe_taunt', tauntedBy: 'comp', label: `별빛 유영(전체 ${getCompName()}에게 타겟 전환)` });
        log(`🌟 <b>[별빛 유영]</b> 신체를 일시 무형화하여 이번 라운드 모든 적의 단일 공격 대상을 ${getCompName()}에게 전환하고, 다음 라운드 <b>아군 전체의 공격 명중 판정에 [유리함]</b>을 부여했습니다!`);
        recordActionBriefing(`▶ 베어러: [별빛 유영] ➔ 이번R 적 단일 공격 ${getCompName()}에게 전환 & 다음R 아군 전원 명중 [유리함] | 과열 +${actualCost}`);
      } else if (sk.id === 'l_2_3') {
        applyTargetStatus('bearer', '🦶 허상의 디딤돌 (무적)', 'buff', '이번 라운드 베어러가 받는 모든 직접 피격 피해 0 무효화');
        applyTargetStatus('bearer', '🦶 허상의 디딤돌 (차턴 +3)', 'buff', '다음 라운드 베어러 공격 피해량 고정 +3 증가');
        log(`🦶 <b>[허상의 디딤돌]</b> 환영 바닥을 타고 올라 이번 라운드 베어러가 받는 <b>모든 직접 피격 피해를 0으로 무효화</b>하고, 다음 라운드 공격 피해량이 <b>+3</b> 증가합니다!`);
        recordActionBriefing(`▶ 베어러: [허상의 디딤돌] ➔ 이번R 베어러 직접 피격 0 무효화 & 다음R 공격 피해 +3 | 과열 +${actualCost}`);
      } else if (sk.id === 'l_3_1') {
        const tEn = getTargetEnemyForActor('bearer', opt.enemyUid);
        const tEnName = tEn ? `[🎯${tEn.name}]` : '단일 적';
        let detDmg = opt.dotDetonateDmg || 6;
        let dotFormulaNote = '';
        if (tEn && tEn.status && Array.isArray(tEn.status.dots) && tEn.status.dots.length > 0) {
          const parts = tEn.status.dots.map(d => `${d.dmg}×${d.turns + 1}R`);
          detDmg = tEn.status.dots.reduce((sum, d) => sum + (d.dmg * (d.turns + 1)), 0);
          dotFormulaNote = ` (${parts.join(' + ')} = ${detDmg})`;
          tEn.status.dots = [];
          applyLocalSyncedEnemyDamage(tEn, detDmg, true);
          queueGmEffect({ kind: 'detonate_dots', targetUid: tEn.uid, dmg: detDmg, label: `빛의 파동 기폭 ${detDmg}` });
        }
        bearerDealtDirectHitThisRound = true;
        if (tEn) bearerDirectHitUidsThisRound.add(tEn.uid);
        lastBearerHitTargetUid = tEn ? tEn.uid : null;
        bearerDirectDmgThisRound += detDmg;
        log(`💥 <b>[빛의 파동: 지속 피해 기폭 ➔ ${tEnName}]</b> ${tEnName}의 모든 [지속 피해]를 +1라운드 연장한 뒤 한꺼번에 불태워${dotFormulaNote}, <b>방어막을 무시하고 실제 HP를 즉시 -${detDmg} 차감</b>했습니다!${tEn ? ` (잔여 HP: <b>${tEn.hp}/${tEn.maxHp}</b>)` : ''} (기폭 후 지속 피해 소멸)`);
        recordActionBriefing(`▶ 베어러: [빛의 파동 ➔ ${tEnName}] ➔ 지속 피해 +1R 연장 후 전량 기폭${dotFormulaNote} ➔ 방어막 무시 실제 HP 고정 ${detDmg} 피해${tEn ? ` (잔여 HP: ${tEn.hp}/${tEn.maxHp})` : ''} | 과열 +${actualCost}`);
      } else if (sk.id === 'l_3_3') {
        applyTargetStatus('bearer', '🌈 빛의 굴절', 'buff', '이번R 최종 피격 피해 짝수(0포함) 시 차턴 아군 전체 [유리함] / 홀수 시 차턴 적 전체 [불리함]');
        log(`🌈 <b>[빛의 굴절]</b> 굴절하는 빛의 파장을 펼쳤습니다! 이번 라운드 베어러가 받은 최종 직접 피격 피해 합산값이 <b>짝수(0 포함)면 다음 라운드 아군 전원 [유리함]</b>, <b>홀수면 다음 라운드 적 전원 [불리함]</b>을 부여합니다!`);
        recordActionBriefing(`▶ 베어러: [빛의 굴절] ➔ 이번R 피격량 짝수(0포함) 시 차턴 아군 [유리함] / 홀수 시 차턴 적 [불리함] | 과열 +${actualCost}`);
      }

      document.getElementById('dice-total-display').innerText = '✦ 발동';
      document.getElementById('dice-formula-display').innerText = `[${sk.circleLabel}] ${sk.name} (과열 +${actualCost})`;
      playBeep(580, 'triangle', 0.16);
      applyHeatIncrease(actualCost, sk.name);
      refreshUI();
      if (cb) cb();
      return;
    }

    // ② 공격 스킬 기본 피해량 및 적 데이터 기반 조건부 옵션 자동 산정
    let baseDmg = sk.dmg;
    let isSkillAoe = Boolean(sk.isAoe);
    if (sk.id === 's_1_4') {
      isSkillAoe = (opt.twinMode !== 'single');
    }
    const preTargetEnemy = !isSkillAoe ? getTargetEnemyForActor('bearer', opt.enemyUid) : null;
    let extraSkillNotes = [];
    let autoCondAdv = Boolean(opt.condAdv);

    if (preTargetEnemy && (sk.id === 'f_1_3' || sk.id === 's_2_1')) {
      if (preTargetEnemy.isFlying || preTargetEnemy.isAoeIntent || preTargetEnemy.isChargeIntent) {
        autoCondAdv = true;
        extraSkillNotes.push(`${preTargetEnemy.name} 조건(비행/광역/충전) 감지 ➔ 명중 [유리함] 자동 적용`);
      }
    }

    if (sk.id === 'l_1_1') {
      const lCost = (opt.varCost !== undefined) ? opt.varCost : 0;
      baseDmg = (lCost === 0) ? 4 : (2 + (lCost / 10) * 2);
      if (lCost >= 10) {
        extraSkillNotes.push(`가변 서클(과열 +${lCost} ➔ 기본 ${baseDmg} 피해 · 스침 2 보장)`);
      } else {
        extraSkillNotes.push('일반 캔트립(과열 +0 · 스침 없음)');
      }
    } else if (sk.id === 'f_1_1' && (opt.prevMissed !== undefined ? opt.prevMissed : bearerLastAttackMissed)) {
      baseDmg = 6;
      extraSkillNotes.push('직전 라운드 명중 실패 보정(6 피해)');
    } else if (sk.id === 'f_1_2') {
      applyTargetStatus('bearer', '🛡️ 쳐내고 베기', 'buff', '이번 라운드 자신이 받는 피격 피해 3 감소');
      extraSkillNotes.push('쳐내고 베기: 이번R 피격 피해 -3 감소');
    } else if (sk.id === 'f_2_2') {
      const isTargetingBearer = (opt.bonusHit !== undefined)
        ? opt.bonusHit
        : Boolean(preTargetEnemy && (preTargetEnemy.targetsBearer || preTargetEnemy.isAoeIntent));
      if (isTargetingBearer) {
        baseDmg = 3;
        extraSkillNotes.push('베어러 포함 인텐트 감지(3 피해)');
      }
    } else if (sk.id === 'f_3_3') {
      const vCost = opt.varCost || 30;
      baseDmg = (vCost / 10) * 2;
      const redAmt = vCost / 10;
      applyTargetStatus('bearer', '🔥 성염 인챈트', 'buff', `이번 라운드 자신이 받는 피격 피해 ${redAmt} 감소`);
      extraSkillNotes.push(`성염 인챈트: 이번R 피격 피해 -${redAmt} 감소`);
    } else if (sk.id === 's_1_4') {
      if (opt.twinMode === 'single') {
        baseDmg = 9;
        isSkillAoe = false;
        extraSkillNotes.push('단일 교차 집중(9 피해)');
      } else {
        baseDmg = 6;
        isSkillAoe = true;
        extraSkillNotes.push('적 전체 광역 참격(6 피해)');
      }
    } else if (sk.id === 's_2_2') {
      applyTargetStatus('bearer', '🦅 비연참', 'buff', '이번 라운드 베어러 AC +2 증가 & 적 공격 빗나갈 때마다 공격 주체에게 무판정 4 반격 피해', 2);
      extraSkillNotes.push('비연참: 이번R AC +2 증가 & 회피 시 4 반격');
    } else if (sk.id === 's_3_1') {
      applyTargetStatus('bearer', '🌪️ 질풍참', 'debuff', '이번 라운드 베어러 AC -2 감소', -2);
      extraSkillNotes.push('질풍참: 이번R AC -2 감소');
    } else if (sk.id === 's_3_2') {
      applyTargetStatus('bearer', '🗡️ 비월절명', 'buff', '이번 라운드 베어러 AC +1 증가', 1);
      const isBackstab = (opt.backstab !== undefined)
        ? opt.backstab
        : (bearerEvadedLastRound || Boolean(preTargetEnemy && !preTargetEnemy.targetsBearer && !preTargetEnemy.isAoeIntent));
      if (isBackstab) {
        baseDmg = 9;
        extraSkillNotes.push('비월절명: 이번R AC +1 증가 (사각 포착 9 피해)');
      } else {
        extraSkillNotes.push('비월절명: 이번R AC +1 증가');
      }
    } else if (sk.id === 'm_2_2') {
      const vCost = opt.varCost || 30;
      baseDmg = (vCost / 10) * 2;
      if (heat + vCost >= 70) {
        applyTargetStatus('bearer', '☄️ 불꽃의 비 (차턴 +3)', 'buff', '다음 라운드 베어러 공격 피해량 고정 +3 증가');
        extraSkillNotes.push('불꽃의 비: 과열 70+ 달성 ➔ 다음R 공격 피해 +3');
      }
    }

    // 추가 버프 피해 합산 (릴리 마력 순환, 센 마탄의 잔향, 극광 일섬, 성염 증폭, 군신의 혼, 회귀일원, 맹염, 태우는 불꽃, 열기 공명진)
    let buffDmgBonus = 0;
    let buffTags = [];
    if (warGodSoulActive || bearerStatuses.some(s => s.name.includes('군신의 혼'))) {
      buffDmgBonus += 3;
      buffTags.push('군신의 혼 +3');
    }
    if (hasBearerPassive('회귀일원') && bearerStatuses.some(s => s.name.includes('회귀일원'))) {
      buffDmgBonus += 2;
      buffTags.push('회귀일원 +2');
    }
    if (!isSkillAoe && hasBearerPassive('맹염')) {
      buffDmgBonus += 1;
      buffTags.push('맹염 +1');
    }
    const burnCommunion = bearerStatuses.find(s => s.name === '🔥 태우는 불꽃 (+3 피해)');
    if (burnCommunion) {
      buffDmgBonus += 3;
      buffTags.push('태우는 불꽃 +3');
    }
    const resAmp3 = bearerStatuses.find(s => s.name === '🔥 공명 증폭 (+3 피해)');
    if (resAmp3) {
      buffDmgBonus += 3;
      buffTags.push('공명 증폭 +3');
    }
    const resAmp5 = bearerStatuses.find(s => s.name === '🔥 공명 증폭 (+5 피해)');
    if (resAmp5) {
      buffDmgBonus += 5;
      buffTags.push('공명 증폭 +5');
    }

    const lilyCirc = bearerStatuses.find(s => s.name === '🔮 마력 순환');
    if (lilyCirc) {
      buffDmgBonus += 3;
      buffTags.push('마력 순환 +3');
      bearerStatuses = bearerStatuses.filter(s => s.id !== lilyCirc.id);
    }
    const senEcho = bearerStatuses.find(s => s.name === '⚡ 마탄의 잔향');
    if (senEcho) {
      buffDmgBonus += 4;
      buffTags.push('마탄의 잔향 +4');
      bearerStatuses = bearerStatuses.filter(s => s.id !== senEcho.id);
    }
    const senAurora = bearerStatuses.find(s => s.name === '⚡ 단죄의 잔향 (+5 피해)');
    if (senAurora) {
      buffDmgBonus += 5;
      buffTags.push('단죄의 잔향 +5');
      bearerStatuses = bearerStatuses.filter(s => s.id !== senAurora.id);
    }
    const flameAmp = bearerStatuses.find(s => s.name === '🔥 성염 증폭 (+3 피해)');
    if (flameAmp) {
      buffDmgBonus += 3;
      buffTags.push('성염 증폭 +3');
      bearerStatuses = bearerStatuses.filter(s => s.id !== flameAmp.id);
    }

    // 파이터 대실패 다음 라운드 연쇄 [육탄전] 발동 시: 주사위 판정 없이 즉시 확정 명중! (과열 -10, 피해 -2, 치명타 없음)
    if (brawlChain) {
      bearerStatuses = bearerStatuses.filter(s => s.id !== brawlChain.id);
      renderStatuses();
      bearerLastAttackMissed = false;
      bearerDealtDirectHitThisRound = true;

      const livingBrawl = getLivingSyncedEnemies();
      const brawlTarget = !isSkillAoe ? getTargetEnemyForActor('bearer', opt.enemyUid) : null;
      let vulnBonus = 0;
      let vulnConsumed = false;
      if (brawlTarget && brawlTarget.status && brawlTarget.status.weak) {
        vulnBonus = 3;
        vulnConsumed = true;
        consumeLocalEnemyWeak(brawlTarget);
      } else if (!brawlTarget && enemyVuln) {
        vulnBonus = 3;
        vulnConsumed = true;
        if (enemyVulnCharges > 1) enemyVulnCharges--;
        else { enemyVuln = false; enemyVulnCharges = 0; }
        updateEnemyVulnUI();
      }
      let finalBrawlDmg = Math.max(0, baseDmg + bonusDmg + heatDmgBonus + buffDmgBonus + vulnBonus - 2);
      const firmBindCharges = hasBearerPassive('강경 속박') ? 2 : 1;
      const firmBindAtkTurns = hasBearerPassive('강경 속박') ? 2 : 1;

      if (brawlTarget) {
        bearerDirectHitUidsThisRound.add(brawlTarget.uid);
        const dRes = applyLocalSyncedEnemyDamage(brawlTarget, finalBrawlDmg, Boolean(sk.ignoreShield));
        bearerDirectDmgThisRound += dRes.hpLost;
        queueGmEffect({ kind: 'damage', targetUid: brawlTarget.uid, dmg: finalBrawlDmg, ignoreShield: Boolean(sk.ignoreShield), consumedWeak: vulnConsumed, label: `${sk.name}(육탄전 확정명중)` });
        if (sk.id === 'f_1_5') {
          brawlTarget.atkMod = (brawlTarget.atkMod || 0) - 3;
          queueGmEffect({ kind: 'debuff', targetUid: brawlTarget.uid, atkModDelta: -3, atkModTurns: firmBindAtkTurns, label: '단죄의 연격 난무(공-3)' });
        } else if (sk.id === 'f_2_2') {
          applyLocalEnemyWeak(brawlTarget, firmBindCharges);
          queueGmEffect({ kind: 'status', targetUid: brawlTarget.uid, addWeakCharges: firmBindCharges, label: '방패 파괴자 [방어 약화]' });
        }
      } else if (isSkillAoe && livingBrawl.length > 0) {
        livingBrawl.forEach(en => {
          bearerDirectHitUidsThisRound.add(en.uid);
          const enVuln = (en.status && en.status.weak) ? (consumeLocalEnemyWeak(en), 3) : 0;
          const enDmg = Math.max(0, baseDmg + bonusDmg + heatDmgBonus + buffDmgBonus + enVuln - 2);
          const dRes = applyLocalSyncedEnemyDamage(en, enDmg, Boolean(sk.ignoreShield));
          bearerDirectDmgThisRound += dRes.hpLost;
          queueGmEffect({ kind: 'damage', targetUid: en.uid, dmg: enDmg, ignoreShield: Boolean(sk.ignoreShield), consumedWeak: (enVuln > 0), label: `${sk.name}(육탄전 확정명중)` });
          if (sk.id === 'f_2_1') {
            en.atkMod = (en.atkMod || 0) - 1;
            queueGmEffect({ kind: 'debuff', targetUid: en.uid, atkModDelta: -1, atkModTurns: firmBindAtkTurns, label: '만월베기(공-1)' });
          }
        });
      } else {
        bearerDirectDmgThisRound += finalBrawlDmg;
      }

      document.getElementById('dice-total-display').innerText = '🥊 확정 명중';
      document.getElementById('dice-formula-display').innerText = `[육탄전 연쇄] 무판정 적중 (과열-10·피해-2)`;
      playBeep(520, 'sawtooth', 0.2);

      const tLabel = brawlTarget ? ` ➔ [🎯${brawlTarget.name} 잔여 HP: ${brawlTarget.hp}/${brawlTarget.maxHp}]` : '';
      log(`🥊 <b>[육탄전 확정 명중 (${sk.name})]</b> 초근접 상태에서 방패와 맨주먹으로 기술을 구사하여 주사위 판정 없이 즉시 적중했습니다! ➔ <b>고정 ${finalBrawlDmg} 피해</b>${tLabel} (과열 -10 감면 ➔ +${actualCost} / 타격 후 검 회수 완료)`);
      recordActionBriefing(`▶ 베어러: [${sk.name} (육탄전 확정 명중)] ➔ 주사위 판정 없이 고정 ${finalBrawlDmg} 피해${tLabel} (검 회수 완료) | 과열 +${actualCost}`);

      applyHeatIncrease(actualCost, `${sk.name}(육탄전)`);
      refreshUI();
      if (cb) cb();
      return;
    }

    // 검객 대실패 다음 라운드 연쇄 [배후 강타] 확인 (첫 공격 불리함 강제 + 적중 시 피해 +4)
    const backstabChain = bearerStatuses.find(s => s.name.includes('배후 강타'));
    if (backstabChain) {
      bearerStatuses = bearerStatuses.filter(s => s.id !== backstabChain.id);
      buffDmgBonus += 4;
      buffTags.push('배후 강타 +4');
    }

    // 등지기 대실패 다음 라운드 연쇄 [표적 조명] 및 기타 유리함 버프 확인
    const advStatus = bearerStatuses.find(s => s.name.includes('유리함') || s.name.includes('표적 조명'));
    if (advStatus) {
      bearerStatuses = bearerStatuses.filter(s => s.id !== advStatus.id);
    }
    renderStatuses();

    const isArtisAdv = Boolean(pickedOrigin && pickedOrigin.includes('아티스') && (hp * 2 <= maxHp));
    let isAdv = (diceMode === 'adv') || Boolean(sk.alwaysAdv) || autoCondAdv || Boolean(advStatus) || (diceMode === 'auto' && isArtisAdv);
    let isDis = (diceMode === 'dis') || Boolean(backstabChain);

    // 유리함과 불리함이 동시에 적용될 경우 서로 상쇄되어 일반 판정(1d20 1회)으로 굴린다 (룰북 v2.24)
    let cancelledOut = false;
    if (isAdv && isDis) {
      isAdv = false;
      isDis = false;
      cancelledOut = true;
    }

    let d1 = Math.floor(Math.random() * 20) + 1;
    let d2 = Math.floor(Math.random() * 20) + 1;
    let raw = isAdv ? Math.max(d1, d2) : (isDis ? Math.min(d1, d2) : d1);
    let formulaStr = `1d20(${d1})`;
    let modeText = '일반 판정';

    if (cancelledOut) {
      formulaStr = `1d20(${d1}) [유리·불리 상쇄]`;
      modeText = '상쇄(일반)';
    } else if (isAdv) {
      const advWhy = advStatus ? ` [${advStatus.name}]` : (sk.alwaysAdv ? ' [상시 유리]' : (autoCondAdv ? ' [조건부 유리]' : (isArtisAdv ? ' [밑바닥의 악바리]' : '')));
      formulaStr = `2d20 High (${d1}, ${d2}) ➔ ${raw}${advWhy}`;
      modeText = '유리함';
    } else if (isDis) {
      const disWhy = backstabChain ? ' [배후 강타 불리함]' : '';
      formulaStr = `2d20 Low (${d1}, ${d2}) ➔ ${raw}${disWhy}`;
      modeText = '불리함';
    }

    if (diceMode !== 'auto') {
      diceMode = 'auto';
      updateDiceModeUI();
    }

    let totalRoll = raw + 3;

    animateDiceAdvanced(raw, 3, modeText, formulaStr, () => {
      bearerAttackRollUsedThisRound = true;

      // ====================================================================
      // [Phase 5] 대실패 (자연 1) 클래스별 고유 기믹 처리
      // ====================================================================
      if (raw === 1) {
        bearerLastAttackMissed = true;
        playBeep(150, 'sawtooth', 0.35);

        if (pickedClass === '파이터') {
          bearerDealtDirectHitThisRound = true;
          const fTarget = getTargetEnemyForActor('bearer', opt.enemyUid);
          if (fTarget) {
            bearerDirectHitUidsThisRound.add(fTarget.uid);
            applyLocalSyncedEnemyDamage(fTarget, 2, false);
            queueGmEffect({ kind: 'damage', targetUid: fTarget.uid, dmg: 2, ignoreShield: false, label: '파이터 대실패(검 박힘 2 피해)' });
          }
          applyTargetStatus('bearer', '⚠️ 꿰뚫린 검 (AC -2)', 'debuff', '[파이터 대실패] 이번 라운드 방어도(AC) 2 감소', -2);
          applyTargetStatus('bearer', '🥊 육탄전 (무판정·과열-10·피해-2)', 'buff', '[파이터 대실패 연쇄] 다음 라운드 기술 과열 -10, 최종 피해 -2, 주사위 판정 없이 확정 명중');
          log(`💥 <b>[대실패 (자연 1) — 꿰뚫린 검과 육탄 격투]</b> 빗나간 검날이 적에게 박혀 빠지지 않습니다! 충격으로 <b>${fTarget ? `🎯${fTarget.name}` : '대상'}에게 고정 2 피해</b>${fTarget ? `(잔여 HP: ${fTarget.hp}/${fTarget.maxHp})` : ''}를 입히지만, <b>이번 라운드 파이터의 AC가 2 감소</b>합니다! (다음 라운드 <b>[육탄전]</b>: 과열 -10, 피해 -2, 판정 없이 확정 명중!)`);
          recordActionBriefing(`▶ 베어러: [${sk.name}] ➔ ${formulaStr} [자연 1 대실패: 꿰뚫린 검과 육탄 격투] ➔ 스침 무효, ${fTarget ? fTarget.name : '대상'} 고정 2 피해 & 이번R 파이터 AC -2 & 다음R [육탄전(무판정 확정명중)] 연쇄 | 과열 +${actualCost}`);
          applyHeatIncrease(actualCost, sk.name);
        } else if (pickedClass === '검객') {
          applyTargetStatus('bearer', '🤸 배후 도약 (AC +1)', 'buff', '[검객 대실패] 적의 머리 위를 뛰어넘어 착지하며 이번 라운드 방어도(AC) +1 증가', 1);
          applyTargetStatus('bearer', '🗡️ 배후 강타 (불리함·적중시 +4)', 'buff', '[검객 대실패 연쇄] 다음 라운드 첫 공격 명중 판정 [불리함] 강제, 적중 시 최종 피해 +4 증가');
          log(`💥 <b>[대실패 (자연 1) — 배후 도약과 흐트러진 발도]</b> 스침 피해 없이 빗나갔으나(피해 0), 적의 머리 위를 뛰어넘어 등 뒤로 착지하며 <b>이번 라운드 AC가 +1 증가</b>합니다! (다음 라운드 <b>[배후 강타]</b>: 첫 공격 [불리함] 강제, 적중 시 <b>최종 피해 +4 증가</b>!)`);
          recordActionBriefing(`▶ 베어러: [${sk.name}] ➔ ${formulaStr} [자연 1 대실패: 배후 도약과 흐트러진 발도] ➔ 피해 0(스침 없음) & 이번R 검객 AC +1 & 다음R [배후 강타(불리함·적중시 +4)] 연쇄 | 과열 +${actualCost}`);
          applyHeatIncrease(actualCost, sk.name);
        } else if (pickedClass === '메이지') {
          const totalFailHeat = actualCost + 20;
          applyTargetStatus('bearer', '⛓️ 마력 역류 (차턴 행동제약)', 'debuff', '[메이지 대실패] 다음 라운드 1턴간 서클 마법 시전 불가(캔트립/벤트만 가능)');
          if (hasBearerPassive('강인함')) {
            grantShield('bearer', 5, '강인함 패시브(대실패 상태이상)');
          }
          if (isSkillAoe) {
            getLivingSyncedEnemies().forEach(en => {
              applyLocalEnemyBind(en, 1);
              queueGmEffect({ kind: 'status', targetUid: en.uid, addBindTurns: 1, label: '과잉 마력 폭주 [행동 제약]' });
            });
          } else {
            const mTarget = getTargetEnemyForActor('bearer', opt.enemyUid);
            if (mTarget) {
              applyLocalEnemyBind(mTarget, 1);
              queueGmEffect({ kind: 'status', targetUid: mTarget.uid, addBindTurns: 1, label: '과잉 마력 폭주 [행동 제약]' });
            }
          }
          const targetScope = isSkillAoe ? '적 전체' : '목표였던 적';
          log(`💥 <b>[대실패 (자연 1) — 과잉 마력 폭주]</b> 주문이 불발(피해 0, 스침 없음)되고 마력 역류로 <b>[과열 +20]이 추가 누적(총 +${totalFailHeat})</b>되며 다음 라운드 메이지에게 <b>[행동 제약]</b>이 걸립니다! 단, 폭주의 여파로 <b>${targetScope}에게도 즉시 이번 라운드 동안 [행동 제약]을 부여</b>합니다!`);
          recordActionBriefing(`▶ 베어러: [${sk.name}] ➔ ${formulaStr} [자연 1 대실패: 과잉 마력 폭주] ➔ 피해 0(스침 없음) & 마력 역류 과열 +20 추가(총 +${totalFailHeat}) & 다음R 메이지 [행동 제약] & 이번R ${targetScope} [행동 제약] 즉시 부여!`);
          applyHeatIncrease(totalFailHeat, `${sk.name}(마력 역류 +20)`);
        } else if (pickedClass === '등지기') {
          let roarHealNote = '';
          if (sk.id === 'l_1_5') {
            hp = Math.min(maxHp, hp + 1);
            const wasCompDown = (compHp <= 0);
            compHp = Math.min(compMaxHp, compHp + 1);
            if (wasCompDown) {
              compRevivedThisRound = true;
              actionQueue = actionQueue.filter(item => item.actor !== 'comp');
              applyTargetStatus('comp', '🛡️ 재정비 중 (행동불가·단일타겟면역)', 'buff', '부활 당해 라운드 행동 불가 · 다음 라운드 시작 전까지 적 단일 공격 대상에서 제외');
              renderQueueUI();
            }
            roarHealNote = wasCompDown ? ` (아군 전체 HP +1 회복 & ${getCompName()} HP 1 부활 정상 발동!)` : ' (아군 전체 HP +1 회복 정상 발동!)';
          }
          applyTargetStatus('bearer', '⚠️ 노출된 불빛 (AC -2)', 'debuff', '[등지기 대실패] 섬광으로 위치가 노출되어 이번 라운드 방어도(AC) 2 감소', -2);
          applyTargetStatus('bearer', '🔦 표적 조명 (아군 유리함)', 'buff', '[등지기 대실패 연쇄] 다음 라운드 아군 전체 공격 명중 판정에 [유리함] 적용');
          applyTargetStatus('comp', '✨ 다음 공격 유리함', 'buff', '[표적 조명] 다음 라운드 동료 공격 명중 판정에 [유리함] 적용');
          log(`💥 <b>[대실패 (자연 1) — 노출된 불빛과 표적 조명]</b> 공격이 불발(피해 0, 스침 없음)되고 섬광으로 위치가 드러나 <b>이번 라운드 등지기의 AC가 2 감소</b>합니다! 대신 흩어진 불빛이 적들의 윤곽을 밝혀 <b>다음 라운드 모든 아군(베어러 및 ${getCompName()})의 공격 명중 판정에 [유리함]</b>을 적용합니다!${roarHealNote}`);
          recordActionBriefing(`▶ 베어러: [${sk.name}] ➔ ${formulaStr} [자연 1 대실패: 노출된 불빛과 표적 조명] ➔ 피해 0(스침 없음) & 이번R 등지기 AC -2 & 다음R 아군 전원 명중 [유리함]${roarHealNote} | 과열 +${actualCost}`);
          applyHeatIncrease(actualCost, sk.name);
        }

        refreshUI();
        saveSessionState();
        if (cb) cb();
        return;
      }

      // ====================================================================
      // [수술 3단계] 적 AC 실시간 대조 (명중 / 스침 2 / 빗나감) & 대성공(자연 20) 처리
      // ====================================================================
      const isCrit = (raw === 20);
      const critBonus = isCrit ? (hasBearerPassive('맹염') ? 7 : 5) : 0;
      const hasGraze = (sk.circle !== '0') || (sk.id === 'l_1_1' && actualCost >= 10);

      if (sk.id === 's_3_3' && raw >= 15) {
        baseDmg = 8;
        extraSkillNotes.push(`순수 ${raw}(15+) 달성 ➔ 2연격 모두 적중(기본 8 피해)!`);
      }

      // 파이터 대성공 시 다수전이면 단일 공격이 적 전체 광역 공격으로 전환!
      const livingEnemiesList = getLivingSyncedEnemies();
      let fighterCritConvertedAoe = false;
      if (isCrit && pickedClass === '파이터' && !isSkillAoe && livingEnemiesList.length > 1) {
        isSkillAoe = true;
        fighterCritConvertedAoe = true;
        extraSkillNotes.push('파이터 대성공: 다수전 적 전체 광역 전환!');
      }

      const targetEnemyObj = !isSkillAoe ? getTargetEnemyForActor('bearer', opt.enemyUid) : null;
      lastBearerHitTargetUid = targetEnemyObj ? targetEnemyObj.uid : (isSkillAoe && livingEnemiesList.length > 0 ? 'AOE_ALL' : null);

      // 단일 타겟 빗나감 여부 판정 (연동된 적이 있을 때)
      const isSingleMiss = Boolean(targetEnemyObj && !isCrit && totalRoll < targetEnemyObj.ac);

      if (isSingleMiss) {
        bearerLastAttackMissed = true;
        const grazeDmg = hasGraze ? 2 : 0;
        let hpNote = '';
        if (grazeDmg > 0 && targetEnemyObj) {
          bearerDealtDirectHitThisRound = true;
          bearerDirectHitUidsThisRound.add(targetEnemyObj.uid);
          const res = applyLocalSyncedEnemyDamage(targetEnemyObj, grazeDmg, Boolean(sk.ignoreShield));
          hpNote = ` ➔ ${targetEnemyObj.name} 잔여 HP: <b>${targetEnemyObj.hp}/${targetEnemyObj.maxHp}</b>${res.killed ? ' <b style="color:#f87171;">[처치!]</b>' : ''}`;
          queueGmEffect({ kind: 'damage', targetUid: targetEnemyObj.uid, dmg: grazeDmg, ignoreShield: Boolean(sk.ignoreShield), label: `${sk.name} (스침 2)` });
        }
        // 환룡의 포효 등 비타격 아군 회복은 빗나가도 발동
        if (sk.id === 'l_1_5') {
          hp = Math.min(maxHp, hp + 1);
          const wasCompDown = (compHp <= 0);
          compHp = Math.min(compMaxHp, compHp + 1);
          if (wasCompDown) {
            compRevivedThisRound = true;
            actionQueue = actionQueue.filter(item => item.actor !== 'comp');
            applyTargetStatus('comp', '🛡️ 재정비 중 (행동불가·단일타겟면역)', 'buff', '부활 당해 라운드 행동 불가 · 다음 라운드 시작 전까지 적 단일 공격 대상에서 제외');
            renderQueueUI();
          }
          extraSkillNotes.push('아군 전체 HP +1 회복');
        }
        const extraNoteStr = extraSkillNotes.length > 0 ? ' ' + extraSkillNotes.map(n => `<span style="color:#93c5fd;">(${n})</span>`).join(' ') : '';
        const grazeLogToken = (grazeDmg > 0 && targetEnemyObj)
          ? `<b style="color:#fca5a5;">스침 2 피해 ➔ ${targetEnemyObj.name} 잔여 HP: ${targetEnemyObj.hp}/${targetEnemyObj.maxHp}${hpNote.includes('처치') ? ' [💀처치!]' : ''}</b>`
          : (hasGraze ? `<b>스침 2 피해</b>` : `<span class="log-miss-token" style="color:#94a3b8; font-weight:800;">피해 0 (완전 회피됨)</span>`);
        log(`💨 <b>[베어러 공격]</b> [${sk.circleLabel}: ${sk.name}] ➔ <span style="color:#fde68a; font-weight:800;">[🎯${targetEnemyObj.name} (AC ${targetEnemyObj.ac})]</span> | ${formulaStr} + 3 = <span style="color:#cbd5e1; font-weight:800;">${totalRoll} &lt; AC ${targetEnemyObj.ac}</span> ➔ ${grazeLogToken}${extraNoteStr}`);
        recordActionBriefing(`▶ 베어러: [${sk.circleLabel}: ${sk.name} ➔ 🎯${targetEnemyObj.name}(AC ${targetEnemyObj.ac})] ➔ ${formulaStr} + 3 = ${totalRoll} < AC ${targetEnemyObj.ac} [빗나감: ${hasGraze ? '스침 2 피해' : '피해 0 (완전 회피됨)'}]${targetEnemyObj && grazeDmg > 0 ? ` (잔여 HP: ${targetEnemyObj.hp}/${targetEnemyObj.maxHp})` : ''} | 과열 +${actualCost}`);
        applyHeatIncrease(actualCost, sk.name);
        refreshUI();
        saveSessionState();
        if (cb) cb();
        return;
      }

      // 명중(또는 연동 적 없음 / 광역 판정) 처리
      bearerLastAttackMissed = false;
      bearerDealtDirectHitThisRound = true;

      let vulnUsed = false;
      let vulnDmg = 0;
      if (targetEnemyObj && targetEnemyObj.status && targetEnemyObj.status.weak) {
        vulnDmg = 3;
        vulnUsed = true;
        consumeLocalEnemyWeak(targetEnemyObj);
      } else if (!targetEnemyObj && enemyVuln) {
        vulnDmg = 3;
        vulnUsed = true;
        if (enemyVulnCharges > 1) enemyVulnCharges--;
        else { enemyVuln = false; enemyVulnCharges = 0; }
        updateEnemyVulnUI();
      }

      let finalDmg = baseDmg + bonusDmg + heatDmgBonus + buffDmgBonus + critBonus + vulnDmg;

      const firmBindCharges = hasBearerPassive('강경 속박') ? 2 : 1;
      const firmBindAtkTurns = hasBearerPassive('강경 속박') ? 2 : 1;

      if (sk.id === 'f_1_5') {
        extraSkillNotes.push(`동료 포함 인텐트 적 공격력 -3 감소${firmBindAtkTurns > 1 ? '(2R)' : ''}`);
      } else if (sk.id === 'f_2_1') {
        extraSkillNotes.push(`적중한 모든 적 공격력 -1 감소${firmBindAtkTurns > 1 ? '(2R)' : ''}`);
      } else if (sk.id === 'f_2_2') {
        extraSkillNotes.push('대상에게 [방어 약화(+3)] 부여');
      } else if (sk.id === 's_2_1' || sk.id === 's_3_1' || sk.id === 'm_2_1') {
        extraSkillNotes.push('적중 대상 [지속 피해: 2] 2R 부여');
        if (sk.id === 'm_2_1') extraSkillNotes.push('방어막 무시');
      } else if (sk.id === 'l_1_5') {
        hp = Math.min(maxHp, hp + 1);
        const wasCompDown = (compHp <= 0);
        compHp = Math.min(compMaxHp, compHp + 1);
        if (wasCompDown) {
          compRevivedThisRound = true;
          actionQueue = actionQueue.filter(item => item.actor !== 'comp');
          applyTargetStatus('comp', '🛡️ 재정비 중 (행동불가·단일타겟면역)', 'buff', '부활 당해 라운드 행동 불가 · 다음 라운드 시작 전까지 적 단일 공격 대상에서 제외');
          renderQueueUI();
        }
        extraSkillNotes.push(wasCompDown ? `아군 전체 HP +1 회복(${getCompName()} HP 1 부활 · 이번R 행동불가 & 단일타겟 보호!)` : '아군 전체 HP +1 회복');
      }

      // 적 개체별 실제 피해 먼저 정산 후, 적중 시 부가 상태이상([방어 약화], 공격력 감소 등) 부여 (동일 타격에서 방어약화가 즉시 소모되는 버그 원천 차단)
      let perEnemyOutcomeHtml = '';
      let perEnemyOutcomePlain = '';
      let anyHitInAoe = false;
      if (targetEnemyObj) {
        bearerRollHitUidsThisRound.add(targetEnemyObj.uid);
        bearerDirectHitUidsThisRound.add(targetEnemyObj.uid);
        const dmgRes = applyLocalSyncedEnemyDamage(targetEnemyObj, finalDmg, Boolean(sk.ignoreShield));
        bearerDirectDmgThisRound += dmgRes.hpLost;
        queueGmEffect({ kind: 'damage', targetUid: targetEnemyObj.uid, dmg: finalDmg, ignoreShield: Boolean(sk.ignoreShield), consumedWeak: vulnUsed, label: sk.name });

        if (sk.id === 'f_1_5') {
          targetEnemyObj.atkMod = (targetEnemyObj.atkMod || 0) - 3;
          targetEnemyObj.atkModTurns = firmBindAtkTurns;
          queueGmEffect({ kind: 'debuff', targetUid: targetEnemyObj.uid, atkModDelta: -3, atkModTurns: firmBindAtkTurns, label: '단죄의 연격 난무(공-3)' });
        } else if (sk.id === 'f_2_2') {
          applyLocalEnemyWeak(targetEnemyObj, firmBindCharges);
          queueGmEffect({ kind: 'status', targetUid: targetEnemyObj.uid, addWeakCharges: firmBindCharges, label: '방패 파괴자 [방어 약화]' });
        } else if (sk.id === 'l_1_4') {
          let redirName = opt.redirectEnemyName || '다른 적 1체';
          let redirUid = opt.redirectEnemyUid || null;
          if (!redirUid && livingEnemiesList.length >= 2) {
            const otherEn = livingEnemiesList.find(e => e.uid !== targetEnemyObj.uid);
            if (otherEn) {
              redirUid = otherEn.uid;
              redirName = otherEn.name;
            }
          }
          if (redirUid) {
            targetEnemyObj.confusedToUid = redirUid;
            targetEnemyObj.confusedToName = redirName;
            targetEnemyObj.isAoeIntent = false;
            targetEnemyObj.targetsBearer = false;
            targetEnemyObj.targetsComp = false;
            if (targetEnemyObj.intent) {
              if (targetEnemyObj.intent.includes('➔')) {
                targetEnemyObj.intent = targetEnemyObj.intent.replace(
                  /➔\s*(아군 전체|파티 전체|모든 아군|단일 아군 1체|베어러(?:\([^)]*\))?(?:\s*·\s*단일)?|동료(?:\([^)]*\))?(?:\s*·\s*단일)?|단일)/,
                  `➔ [🎭환체 교란: 🎯${redirName}]`
                );
              } else {
                targetEnemyObj.intent += ` ➔ [🎭환체 교란: 🎯${redirName}]`;
              }
            }
            saveSyncedEnemiesToStorage();
            renderSyncBridgeUI();
            queueGmEffect({ kind: 'confuse', targetUid: targetEnemyObj.uid, redirectToUid: redirUid, redirectToName: redirName, label: `환체 교란 ➔ ${redirName}` });
          }
          extraSkillNotes.push(`대상 공격 목표를 [🎯${redirName}]에게로 강제 전환(무판정 적중)`);
        }
        if (sk.id === 's_2_1') {
          addLocalEnemyDot(targetEnemyObj, 2, 2);
          queueGmEffect({ kind: 'dot', targetUid: targetEnemyObj.uid, dotDmg: 2, dotTurns: 2, label: '천공일점 DoT 2' });
        }
        if (isCrit && pickedClass === '검객') {
          addLocalEnemyDot(targetEnemyObj, 2, 2);
          queueGmEffect({ kind: 'dot', targetUid: targetEnemyObj.uid, dotDmg: 2, dotTurns: 2, label: '작열하는 검흔 DoT 2' });
        }
        perEnemyOutcomeHtml = ` ➔ <b style="color:#6ee7b7;">[명중! 잔여 HP: ${targetEnemyObj.hp}/${targetEnemyObj.maxHp}${dmgRes.killed ? ' · 💀처치!' : ''}]</b>`;
        perEnemyOutcomePlain = ` ➔ [명중! 잔여 HP: ${targetEnemyObj.hp}/${targetEnemyObj.maxHp}${dmgRes.killed ? ' · 처치!' : ''}]`;
      } else if (isSkillAoe && livingEnemiesList.length > 0) {
        const aoeOutcomesHtml = [];
        const aoeOutcomesPlain = [];
        anyHitInAoe = false;
        livingEnemiesList.forEach(en => {
          const hitThis = isCrit || (totalRoll >= en.ac);
          if (hitThis) {
            anyHitInAoe = true;
            bearerRollHitUidsThisRound.add(en.uid);
            bearerDirectHitUidsThisRound.add(en.uid);
            let enVuln = 0;
            if (en.status && en.status.weak) {
              enVuln = 3;
              consumeLocalEnemyWeak(en);
            }
            const enDmg = baseDmg + bonusDmg + heatDmgBonus + buffDmgBonus + critBonus + enVuln;
            const dRes = applyLocalSyncedEnemyDamage(en, enDmg, Boolean(sk.ignoreShield));
            bearerDirectDmgThisRound += dRes.hpLost;
            queueGmEffect({ kind: 'damage', targetUid: en.uid, dmg: enDmg, ignoreShield: Boolean(sk.ignoreShield), consumedWeak: (enVuln > 0), label: sk.name });
            if (sk.id === 'f_2_1') {
              en.atkMod = (en.atkMod || 0) - 1;
              en.atkModTurns = firmBindAtkTurns;
              queueGmEffect({ kind: 'debuff', targetUid: en.uid, atkModDelta: -1, atkModTurns: firmBindAtkTurns, label: '만월베기(공-1)' });
            } else if (sk.id === 'f_1_5') {
              en.atkMod = (en.atkMod || 0) - 3;
              en.atkModTurns = firmBindAtkTurns;
              queueGmEffect({ kind: 'debuff', targetUid: en.uid, atkModDelta: -3, atkModTurns: firmBindAtkTurns, label: '단죄의 연격 난무(공-3)' });
            } else if (sk.id === 'f_2_2') {
              applyLocalEnemyWeak(en, firmBindCharges);
              queueGmEffect({ kind: 'status', targetUid: en.uid, addWeakCharges: firmBindCharges, label: '방패 파괴자 [방어 약화]' });
            }
            if (sk.id === 's_3_1' || sk.id === 'm_2_1' || (fighterCritConvertedAoe && sk.id === 's_2_1')) {
              addLocalEnemyDot(en, 2, 2);
              queueGmEffect({ kind: 'dot', targetUid: en.uid, dotDmg: 2, dotTurns: 2, label: `${sk.name} DoT 2` });
            }
            if (isCrit && pickedClass === '검객') {
              addLocalEnemyDot(en, 2, 2);
              queueGmEffect({ kind: 'dot', targetUid: en.uid, dotDmg: 2, dotTurns: 2, label: '작열하는 검흔 DoT 2' });
            }
            aoeOutcomesHtml.push(`<span style="color:#6ee7b7;">${en.name}: 명중(-${enDmg} ➔ HP ${en.hp}/${en.maxHp}${dRes.killed ? ' 💀' : ''})</span>`);
            aoeOutcomesPlain.push(`${en.name}: 명중(-${enDmg}➔HP ${en.hp}/${en.maxHp})`);
          } else {
            const gDmg = hasGraze ? 2 : 0;
            if (gDmg > 0) {
              bearerDirectHitUidsThisRound.add(en.uid);
              applyLocalSyncedEnemyDamage(en, gDmg, Boolean(sk.ignoreShield));
              queueGmEffect({ kind: 'damage', targetUid: en.uid, dmg: gDmg, ignoreShield: Boolean(sk.ignoreShield), label: `${sk.name}(스침2)` });
            }
            aoeOutcomesHtml.push(`<span style="color:#fca5a5;">${en.name}: 빗나감(${gDmg > 0 ? `스침2 ➔ HP ${en.hp}/${en.maxHp}` : '피해0'})</span>`);
            aoeOutcomesPlain.push(`${en.name}: 빗나감(${gDmg > 0 ? `스침2➔HP ${en.hp}/${en.maxHp}` : '피해0'})`);
          }
        });
        if (!anyHitInAoe && !hasGraze) bearerLastAttackMissed = true;
        perEnemyOutcomeHtml = `<br>🎯 <b>[개체별 판정]</b> ${aoeOutcomesHtml.join(' | ')}`;
        perEnemyOutcomePlain = ` [판정: ${aoeOutcomesPlain.join(', ')}]`;
      } else {
        bearerDirectDmgThisRound += finalDmg;
        if (sk.id === 'f_2_2') {
          enemyVuln = true;
          enemyVulnCharges = firmBindCharges;
          updateEnemyVulnUI();
        }
      }

      // [Phase 5] 클래스별 대성공 (자연 20) 고유 기믹 처리
      let critGimmickLog = '';
      let critGimmickBrief = '';
      if (isCrit) {
        if (pickedClass === '파이터') {
          if (fighterCritConvertedAoe) {
            critGimmickLog = `<br>🌟 <b>[파이터 대성공 — 백색 성염의 여파 (광역 전환!)]</b> 다수전 대성공 효과로 단일 공격이 거대한 성염 충격파를 일으켜 <b>적 전체 광역 공격</b>으로 전환되었습니다!`;
            critGimmickBrief = ` [대성공: 다수전 적 전체 광역 공격 전환]`;
          } else {
            grantShield('bearer', 4, '대성공: 백색 성염의 여파');
            if (targetEnemyObj) {
              applyLocalEnemyWeak(targetEnemyObj, firmBindCharges);
              queueGmEffect({ kind: 'status', targetUid: targetEnemyObj.uid, addWeakCharges: firmBindCharges, label: '파이터 대성공 [방어 약화]' });
            } else if (isSkillAoe && livingEnemiesList.length > 0) {
              livingEnemiesList.forEach(en => {
                applyLocalEnemyWeak(en, firmBindCharges);
                queueGmEffect({ kind: 'status', targetUid: en.uid, addWeakCharges: firmBindCharges, label: '파이터 대성공 [방어 약화]' });
              });
            } else {
              enemyVuln = true;
              enemyVulnCharges = firmBindCharges;
              updateEnemyVulnUI();
            }
            critGimmickLog = `<br>🌟 <b>[파이터 대성공 — 백색 성염의 여파]</b> 충격파가 한 점으로 응축되어 대상에게 <b>[방어 약화]를 즉시 부여</b>하고 파이터 본인은 반동으로 <b>[방어막 4]</b>를 획득합니다!`;
            critGimmickBrief = ` [대성공: 대상 방어약화 부여 & 파이터 방어막 4 획득]`;
          }
        } else if (pickedClass === '검객') {
          critGimmickLog = `<br>🌟 <b>[검객 대성공 — 작열하는 검흔]</b> 베인 상처 깊숙이 성염의 열기가 스며들어 적중한 모든 대상에게 <b>[지속 피해: 2]를 2라운드간 부여</b>합니다!`;
          critGimmickBrief = ` [대성공: 적중 대상 전체 [지속 피해: 2] 2R 부여]`;
        } else if (pickedClass === '메이지') {
          applyTargetStatus('bearer', '🪨 융기하는 성염 암벽 (피격 -3)', 'buff', '[메이지 대성공] 이번 라운드 아군 전체가 받는 모든 피격 피해 3 경감');
          applyTargetStatus('comp', '🪨 융기하는 성염 암벽 (피격 -3)', 'buff', '[메이지 대성공] 이번 라운드 아군 전체가 받는 모든 피격 피해 3 경감');
          critGimmickLog = `<br>🌟 <b>[메이지 대성공 — 융기하는 성염 암벽]</b> 폭발적인 마법의 여파로 지표면이 솟구쳐 올라, <b>이번 라운드 동안 아군 전체(베어러 및 ${getCompName()})가 받는 모든 피격 피해를 고정 3 경감</b>합니다!`;
          critGimmickBrief = ` [대성공: 이번R 아군 전체 피격 피해 -3 경감]`;
        } else if (pickedClass === '등지기') {
          applyTargetStatus('bearer', '✨ 찬란한 백광의 은신 (피격 0)', 'buff', '[등지기 대성공] 이번 라운드 등지기를 향한 모든 피격 피해 0 무효화 (미피격 시 다음R 첫 피격 1회 0 무효화)');
          critGimmickLog = `<br>🌟 <b>[등지기 대성공 — 찬란한 백광의 은신]</b> 찬란한 빛과 수증기가 기척을 지워 <b>이번 라운드 등지기를 향한 모든 피격 피해를 0으로 무효화</b>합니다! (이번 라운드 미피격 시 다음 라운드 첫 피격 1회 0 무효화 유지)`;
          critGimmickBrief = ` [대성공: 이번R 등지기 피격 피해 0 무효화 (미피격 시 차턴 1회 유지)]`;
        }
      }

      const heatStageStr = (heatDmgBonus > 0) ? ` [과열 ${preCastHeatStage === 'critical' ? '임계+2' : '경고+1'}]` : '';
      const critStr = isCrit ? ` <b style="color:#feb2b2;">[자연 20 치명타 +${critBonus}!]</b>` : '';
      const vulnStr = vulnUsed ? ' <b style="color:#fde68a;">[방어 약화 +3!]</b>' : '';
      const buffStr = buffTags.length > 0 ? ` <b style="color:#a78bfa;">[${buffTags.join(', ')}]</b>` : '';
      const grazeNote = (!targetEnemyObj && livingEnemiesList.length === 0) ? (hasGraze ? ' / 빗나감 시 스침 2' : ' / 빗나감 시 피해 0') : '';
      const extraNoteStr = extraSkillNotes.length > 0 ? ' ' + extraSkillNotes.map(n => `<span style="color:#93c5fd;">(${n})</span>`).join(' ') : '';

      const targetTagHtml = targetEnemyObj
        ? ` ➔ <span style="color:#fde68a; font-weight:800;">[🎯${targetEnemyObj.name} (AC ${targetEnemyObj.ac})]</span>`
        : (isSkillAoe && livingEnemiesList.length > 0 ? ` ➔ <span style="color:#fde68a; font-weight:800;">[🎯적 전체 (${livingEnemiesList.length}체)]</span>` : '');
      const targetTagPlain = targetEnemyObj
        ? ` ➔ 🎯${targetEnemyObj.name}(AC ${targetEnemyObj.ac})`
        : (isSkillAoe && livingEnemiesList.length > 0 ? ` ➔ 🎯적 전체(${livingEnemiesList.length}체)` : '');

      const aoeAllMissed = (isSkillAoe && livingEnemiesList.length > 0 && !anyHitInAoe && !hasGraze);
      const dmgAndOutcomeHtml = targetEnemyObj
        ? `(<b style="color:#fca5a5;">피해량: ${finalDmg}${perEnemyOutcomePlain}</b>${heatStageStr}${critStr}${vulnStr}${buffStr}${grazeNote})`
        : (aoeAllMissed
            ? `(<span class="log-miss-token" style="color:#94a3b8; font-weight:800;">광역 빗나감 (피해 0)</span>)${perEnemyOutcomeHtml}`
            : `(<b style="color:#fca5a5;">광역 피해량: ${finalDmg}</b>${heatStageStr}${critStr}${vulnStr}${buffStr}${grazeNote})${perEnemyOutcomeHtml}`);

      log(`⚔️ <b>[베어러 공격]</b> [${sk.circleLabel}: ${sk.name}]${targetTagHtml} ➔ ${formulaStr} + 3 = <span style="color:#f8fafc; font-weight:800;">${totalRoll}</span> ${dmgAndOutcomeHtml}${extraNoteStr}${critGimmickLog}`);

      const cleanCrit = isCrit ? ` [자연 20 치명타 +${critBonus}!]` : '';
      const cleanVuln = vulnUsed ? ' [방어 약화 +3!]' : '';
      const cleanBuff = buffTags.length > 0 ? ` [${buffTags.join(', ')}]` : '';
      const cleanExtra = extraSkillNotes.length > 0 ? ` (${extraSkillNotes.join(', ')})` : '';
      recordActionBriefing(`▶ 베어러: [${sk.circleLabel}: ${sk.name}${targetTagPlain}] ➔ ${formulaStr} + 3 = ${totalRoll} (${aoeAllMissed ? '광역 빗나감: 피해 0' : `고정 ${finalDmg} ${isSkillAoe ? '광역 ' : ''}피해`}${heatStageStr}${cleanCrit}${cleanVuln}${cleanBuff}${grazeNote})${perEnemyOutcomePlain}${cleanExtra}${critGimmickBrief} | 과열 +${actualCost}`);

      // 등지기 4Lv 패시브 [거울상 연성]: 순수 주사위 17 이상 시 무과열 1회 연속 발동 (치명타/대성공은 첫 타격에만 적용)
      if (hasBearerPassive('거울상 연성') && raw >= 17) {
        const mirrorDmg = baseDmg + bonusDmg + heatDmgBonus + buffDmgBonus;
        bearerDirectDmgThisRound += mirrorDmg;
        if (targetEnemyObj) {
          applyLocalSyncedEnemyDamage(targetEnemyObj, mirrorDmg, Boolean(sk.ignoreShield));
          queueGmEffect({ kind: 'damage', targetUid: targetEnemyObj.uid, dmg: mirrorDmg, ignoreShield: Boolean(sk.ignoreShield), label: `거울상 연성: ${sk.name}` });
        } else if (isSkillAoe && livingEnemiesList.length > 0) {
          livingEnemiesList.forEach(en => {
            if (isCrit || totalRoll >= en.ac) {
              applyLocalSyncedEnemyDamage(en, mirrorDmg, Boolean(sk.ignoreShield));
              queueGmEffect({ kind: 'damage', targetUid: en.uid, dmg: mirrorDmg, ignoreShield: Boolean(sk.ignoreShield), label: `거울상 연성: ${sk.name}` });
            }
          });
        }
        log(`🪞 <b>[패시브: 거울상 연성 발동!]</b> 순수 주사위 <b>${raw}</b>(17 이상) 달성! 빛의 거울상이 연성되어 추가 과열 없이 <b>[${sk.name}]</b>을(를) 즉시 1회 더 연속 발동합니다! (추가 <b>고정 ${mirrorDmg} 피해</b>!)`);
        recordActionBriefing(`   ↳ 🪞 [패시브: 거울상 연성] 순수 ${raw}(17+) ➔ [${sk.name}] 무과열 1회 연속 발동 (추가 고정 ${mirrorDmg} 피해)`);
      }

      // ③ 과열 증가 & ④ 100 초과 자해 피해 정산
      applyHeatIncrease(actualCost, sk.name);
      refreshUI();
      saveSessionState();
      if (cb) cb();
    });
  }
  window.runBearerSkillLogic = runBearerSkillLogic;

  /* ==========================================================================
     [Phase 3] 메이지 [성염 장전] 무행동 일괄 개방 (Single Roll Rule & 버프 복사) & 전용 카타르시스 연출
     ========================================================================== */
  function ensureMageBurstStyles() {
    if (typeof document === 'undefined' || document.getElementById('mage-release-burst-styles')) return;
    const style = document.createElement('style');
    style.id = 'mage-release-burst-styles';
    style.textContent = `
      .screen-mage-burst-overlay {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 999997;
        opacity: 0;
        background: radial-gradient(circle at center, rgba(56, 189, 248, 0.45) 0%, rgba(253, 224, 71, 0.35) 45%, rgba(239, 68, 68, 0.18) 75%, transparent 100%);
        box-shadow: inset 0 0 100px rgba(56, 189, 248, 0.7), inset 0 0 50px rgba(253, 224, 71, 0.5);
      }
      .screen-mage-burst-overlay.active {
        animation: mageScreenFlash 0.65s cubic-bezier(0.1, 0.9, 0.2, 1) forwards;
      }
      @keyframes mageScreenFlash {
        0%   { opacity: 1; transform: scale(1.02); }
        45%  { opacity: 0.75; }
        100% { opacity: 0; transform: scale(1.0); }
      }
      .mage-bar-discharge {
        animation: mageBarDischargePulse 0.65s ease-out !important;
      }
      @keyframes mageBarDischargePulse {
        0%   { box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.95), inset 0 0 25px rgba(56, 189, 248, 0.85); }
        40%  { box-shadow: 0 0 30px 8px rgba(56, 189, 248, 0.9), inset 0 0 40px rgba(253, 224, 71, 0.75); border-color: #fde047 !important; }
        100% { box-shadow: none; border-color: #38bdf8; }
      }
      @keyframes mageFlameBurstShake {
        0%   { transform: translate3d(0, 0, 0) scale(1); filter: brightness(1); }
        12%  { transform: translate3d(-10px, 3px, 0) scale(1.09) rotate(-2deg); filter: brightness(2.4) saturate(2.4); }
        25%  { transform: translate3d(10px, -3px, 0) scale(1.05) rotate(2deg); filter: brightness(1.9) saturate(2.0); }
        45%  { transform: translate3d(-6px, 2px, 0) scale(1.03); filter: brightness(1.5); }
        65%  { transform: translate3d(4px, -1px, 0) scale(1.01); filter: brightness(1.2); }
        85%  { transform: translate3d(-2px, 1px, 0) scale(1.0); }
        100% { transform: translate3d(0, 0, 0) scale(1); filter: brightness(1); }
      }
      .mage-holy-flame-burst {
        animation: mageFlameBurstShake 0.65s cubic-bezier(0.36, 0.07, 0.19, 0.97) !important;
        box-shadow: 0 0 0 3px #38bdf8, 0 0 38px rgba(56, 189, 248, 0.95), 0 0 70px rgba(250, 204, 21, 0.85), inset 0 0 28px rgba(56, 189, 248, 0.7) !important;
        border-color: #fde047 !important;
        z-index: 45 !important;
      }
      .mage-flame-particle {
        position: fixed;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        pointer-events: none;
        z-index: 999999;
        animation: mageParticleFly var(--dur, 0.6s) cubic-bezier(0.12, 0.8, 0.32, 1) forwards;
      }
      @keyframes mageParticleFly {
        0% {
          transform: translate(-50%, -50%) translate3d(0, 0, 0) scale(1.5);
          opacity: 1;
        }
        100% {
          transform: translate(-50%, -50%) translate3d(var(--tx, 0px), var(--ty, 0px), 0) scale(0.1) rotate(var(--rot, 0deg));
          opacity: 0;
        }
      }
      .mage-burst-badge {
        position: absolute;
        top: -16px;
        left: 50%;
        transform: translateX(-50%) translateY(0);
        background: linear-gradient(135deg, #0284c7 0%, #ca8a04 100%);
        color: #ffffff;
        font-size: 11px;
        font-weight: 900;
        padding: 3px 9px;
        border-radius: 999px;
        border: 1.5px solid #fde047;
        box-shadow: 0 0 18px rgba(250, 204, 21, 0.9);
        pointer-events: none;
        z-index: 100;
        white-space: nowrap;
        animation: mageBadgeRise 0.85s ease-out forwards;
      }
      @keyframes mageBadgeRise {
        0%   { opacity: 0; transform: translateX(-50%) translateY(8px) scale(0.7); }
        22%  { opacity: 1; transform: translateX(-50%) translateY(-6px) scale(1.18); }
        60%  { opacity: 1; transform: translateX(-50%) translateY(-14px) scale(1.0); }
        100% { opacity: 0; transform: translateX(-50%) translateY(-26px) scale(0.85); }
      }
    `;
    document.head.appendChild(style);
  }

  function playHolyFlameBurstSound(isCrit = false) {
    if (typeof window === 'undefined') return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!window._burstAudioCtx) window._burstAudioCtx = new Ctx();
      const ctx = window._burstAudioCtx;
      if (ctx.state === 'suspended') ctx.resume();
      const now = ctx.currentTime;
      const masterDest = (typeof getMasterGainNode === 'function' && getMasterGainNode()) || ctx.destination;

      // 마스터 볼륨 감쇠 게인 노드 (사용자가 깜짝 놀라지 않도록 온화하고 기분 좋은 적정 볼륨 유지)
      const burstMasterGain = ctx.createGain();
      burstMasterGain.gain.setValueAtTime(0.35, now);
      burstMasterGain.connect(masterDest);

      // 1) 묵직하면서도 부드러운 저음 서브베이스 슬램 (220Hz -> 32Hz, triangle 파형)
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'triangle';
      subOsc.frequency.setValueAtTime(220, now);
      subOsc.frequency.exponentialRampToValueAtTime(32, now + 0.32);
      subGain.gain.setValueAtTime(isCrit ? 0.28 : 0.20, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.33);
      subOsc.connect(subGain);
      subGain.connect(burstMasterGain);
      subOsc.start(now);
      subOsc.stop(now + 0.34);

      // 2) 신성한 마력 공명 상승 아르페지오 (C5, E5, G5, C6)
      const freqs = isCrit
        ? [523.25, 659.25, 783.99, 1046.50, 1318.51]
        : [523.25, 659.25, 783.99, 1046.50];
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = i % 2 === 0 ? 'triangle' : 'sine';
        const t0 = now + (i * 0.038);
        osc.frequency.setValueAtTime(f, t0);
        gain.gain.setValueAtTime(isCrit ? 0.08 : 0.06, t0);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.38);
        osc.connect(gain);
        gain.connect(burstMasterGain);
        osc.start(t0);
        osc.stop(t0 + 0.39);
      });

      // 3) 성염 파열 소프트 노이즈 버스트
      const bufferSize = Math.floor(ctx.sampleRate * 0.15);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.04));
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(700, now);
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.12, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(burstMasterGain);
      noise.start(now);
      noise.stop(now + 0.16);
    } catch (err) {}
  }

  function spawnMageFlameParticles(cx, cy, count = 16) {
    if (typeof document === 'undefined') return;
    const colors = ['#38bdf8', '#7dd3fc', '#fde047', '#facc15', '#ffffff', '#fb7185', '#c084fc'];
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'mage-flame-particle';
      p.style.left = `${cx}px`;
      p.style.top = `${cy}px`;
      const angle = (Math.PI * 2 * i) / count + (Math.random() * 0.4 - 0.2);
      const dist = 45 + Math.random() * 65;
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist;
      const col = colors[i % colors.length];
      p.style.setProperty('--tx', `${tx.toFixed(1)}px`);
      p.style.setProperty('--ty', `${ty.toFixed(1)}px`);
      p.style.setProperty('--rot', `${Math.round(Math.random() * 360)}deg`);
      p.style.setProperty('--dur', `${(0.45 + Math.random() * 0.25).toFixed(2)}s`);
      p.style.background = col;
      p.style.boxShadow = `0 0 10px ${col}, 0 0 20px ${col}`;
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 750);
    }
  }

  function spawnMageFloatingBadge(cardEl, text) {
    if (!cardEl || typeof document === 'undefined') return;
    const badge = document.createElement('div');
    badge.className = 'mage-burst-badge';
    badge.innerText = text;
    cardEl.style.position = 'relative';
    cardEl.appendChild(badge);
    setTimeout(() => badge.remove(), 880);
  }

  function triggerMageHolyFlameBurstFx(targetEnemies, isCrit = false) {
    ensureMageBurstStyles();
    playHolyFlameBurstSound(isCrit);

    // 1) 전체 화면 성염 방출 플래시 오버레이
    let overlay = document.getElementById('screen-mage-burst-overlay');
    if (!overlay && typeof document !== 'undefined') {
      overlay = document.createElement('div');
      overlay.id = 'screen-mage-burst-overlay';
      overlay.className = 'screen-mage-burst-overlay';
      document.body.appendChild(overlay);
    }
    if (overlay) {
      overlay.classList.remove('active');
      void overlay.offsetWidth;
      overlay.classList.add('active');
      setTimeout(() => overlay.classList.remove('active'), 700);
    }

    // 2) 메이지 성염 장전 슬롯 바 방출 파동
    const bar = document.getElementById('mage-charge-bar');
    if (bar) {
      bar.classList.remove('mage-bar-discharge');
      void bar.offsetWidth;
      bar.classList.add('mage-bar-discharge');
      setTimeout(() => bar.classList.remove('mage-bar-discharge'), 650);
    }

    // 3) 피격된 각 적 카드별 타격 임팩트, 불꽃 쉐이크, 파편 파티클 및 팝업 배지
    const enemies = Array.isArray(targetEnemies) ? targetEnemies : (targetEnemies ? [targetEnemies] : []);
    enemies.forEach(en => {
      if (!en || !en.uid || typeof document === 'undefined') return;
      const cardEl = document.querySelector(`[data-enemy-uid="${en.uid}"]`);
      if (!cardEl) return;

      cardEl.classList.remove('mage-holy-flame-burst', 'chain-hit-impact');
      void cardEl.offsetWidth;
      cardEl.classList.add('mage-holy-flame-burst');
      setTimeout(() => cardEl.classList.remove('mage-holy-flame-burst'), 750);

      const r = cardEl.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      spawnMageFlameParticles(cx, cy, isCrit ? 22 : 16);

      const badgeText = isCrit ? '💥 치명적 성염 대폭발!!' : '⚡ 성염 일괄 방출!';
      spawnMageFloatingBadge(cardEl, badgeText);
    });
  }
  window.triggerMageHolyFlameBurstFx = triggerMageHolyFlameBurstFx;
  window.playHolyFlameBurstSound = playHolyFlameBurstSound;
  function openMageReleaseTargetPopup(livingEnemies) {
    closeAllStatusMenus();
    const bar = document.getElementById('mage-charge-bar');
    const relBtn = document.getElementById('btn-mage-release');
    if (!bar || !relBtn) return;

    let pop = document.getElementById('popup-mage-release');
    if (!pop) {
      pop = document.createElement('div');
      pop.id = 'popup-mage-release';
      pop.className = 'status-modal-menu bearer-skill-popup';
      pop.style.right = '0';
      pop.style.left = 'auto';
      pop.style.minWidth = '230px';
      pop.style.maxWidth = '320px';
      pop.onclick = (e) => e.stopPropagation();
      bar.style.position = 'relative';
      bar.appendChild(pop);
    }

    const curUid = selectedBearerTargetUid;
    const chips = livingEnemies.map((e, idx) => {
      const isAct = (e.uid === curUid);
      return `
        <button type="button" class="status-modal-item" style="display:flex; justify-content:space-between; align-items:center; gap:8px; padding:6px 9px; cursor:pointer; ${isAct ? 'border-color:#38bdf8; background:rgba(56,189,248,0.15); font-weight:800;' : ''}" onclick="commitMageReleaseTarget('${e.uid}', event)">
          <span>🎯 ${idx + 1}. <b style="color:${isAct ? '#7dd3fc' : '#e2e8f0'};">${e.name}</b> (AC ${e.ac})</span>
          <span style="color:#6ee7b7; font-weight:800; font-size:10.5px;">HP ${e.hp}/${e.maxHp}</span>
        </button>
      `;
    }).join('');

    pop.innerHTML = `
      <div style="font-size:11px; color:#7dd3fc; font-weight:800; border-bottom:1px solid #283248; padding-bottom:4px; margin-bottom:4px; display:flex; justify-content:space-between; align-items:center;">
        <span>⚡ [성염 장전 개방] 타겟 적 선택</span>
        <span style="font-size:11px; color:#94a3b8; cursor:pointer; padding:0 3px;" onclick="closeAllStatusMenus()">✕</span>
      </div>
      <div style="font-size:10px; color:#94a3b8; margin-bottom:4px;">개방 시 단일 마법이 타격할 대상을 선택하세요:</div>
      <div style="display:flex; flex-direction:column; gap:4px;">
        ${chips}
      </div>
    `;

    pop.style.display = 'flex';
    if (typeof elevateMenuParentPanel === 'function') elevateMenuParentPanel(pop);
    playBeep(480, 'triangle', 0.1);
  }
  window.openMageReleaseTargetPopup = openMageReleaseTargetPopup;

  function commitMageReleaseTarget(uid, e) {
    if (e) e.stopPropagation();
    closeAllStatusMenus();
    selectedBearerTargetUid = uid;
    if (typeof renderSyncBridgeUI === 'function') renderSyncBridgeUI();
    releaseChargedSpells(uid);
  }
  window.commitMageReleaseTarget = commitMageReleaseTarget;

  function releaseChargedSpells(targetEnemyUid = null) {
    if (isExecuting || mageChargedSpells.length === 0) return;
    const isBearerRestr = bearerStatuses.some(s => s.name.includes('행동 제약')) && !isBearerImmuneToRestriction();
    if (isBearerRestr) {
      playBeep(220, 'sawtooth', 0.2);
      log(`⛓️ <b>[성염 장전 개방 불가]</b> [행동 제약]에 걸린 라운드에는 충전된 마법을 개방할 수 없습니다!`);
      return;
    }
    if (mageChargedSpells.some(sp => (sp.chargedRound || 0) >= curRound)) {
      playBeep(220, 'sawtooth', 0.2);
      log(`⏳ <b>[당해 라운드 개방 불가]</b> [성염 장전]으로 충전한 마법은 <b>다음 라운드부터</b> 일괄 개방할 수 있습니다!`);
      return;
    }

    const livingForRelease = getLivingSyncedEnemies();
    const hasSingleTargetEnemySpell = mageChargedSpells.some(sp => {
      const s = getBearerSkillById(sp.id);
      return s && ((s.isAttack && !s.isAoe) || sp.id === 'm_3_1');
    });

    if (hasSingleTargetEnemySpell && livingForRelease.length > 1 && !targetEnemyUid) {
      const pop = document.getElementById('popup-mage-release');
      if (pop && pop.style.display === 'flex') {
        closeAllStatusMenus();
        playBeep(320, 'sine', 0.08);
        return;
      }
      openMageReleaseTargetPopup(livingForRelease);
      return;
    }

    closeAllStatusMenus();

    if (targetEnemyUid) {
      selectedBearerTargetUid = targetEnemyUid;
      if (typeof renderSyncBridgeUI === 'function') renderSyncBridgeUI();
    } else if (hasSingleTargetEnemySpell && livingForRelease.length === 1) {
      targetEnemyUid = livingForRelease[0].uid;
      selectedBearerTargetUid = targetEnemyUid;
      if (typeof renderSyncBridgeUI === 'function') renderSyncBridgeUI();
    }

    if (shouldDemoteLogsOnNextAction) demoteOldRoundLogs();
    isExecuting = true;
    if (!combatStarted && curRound === 1) {
      triggerCombatStartPerks(false);
    }

    const spellsToFire = [...mageChargedSpells];
    mageChargedSpells = [];
    renderMageChargeBar();

    const hasAttackSpell = spellsToFire.some(sp => {
      const s = getBearerSkillById(sp.id);
      return s && (s.isAttack || sp.dmg > 0);
    });

    // 비공격 마법만 충전되어 있는 경우 주사위 굴림 없이 즉시 발동
    if (!hasAttackSpell) {
      let summaryParts = [];
      spellsToFire.forEach((sp, idx) => {
        const skObj = getBearerSkillById(sp.id);
        if (!skObj) return;
        const tActor = sp.target || 'bearer';
        const tName = (tActor === 'comp') ? getCompName() : bearerName;
        if (skObj.id === 'm_1_2') {
          const healAmt = 6 + (hasBearerPassive('치유 증폭') ? 3 : 0);
          if (tActor === 'comp') compHp = Math.min(compMaxHp, compHp + healAmt);
          else hp = Math.min(maxHp, hp + healAmt);
          summaryParts.push(`<b style="color:#6ee7b7;">[${idx + 1}: 성염 치유 ➔ ${tName} HP +${healAmt} 회복]</b>`);
        } else if (skObj.id === 'm_3_2') {
          grantShield(tActor, 7, '장전 개방: 응축된 방벽');
          summaryParts.push(`<b style="color:#93c5fd;">[${idx + 1}: 응축된 방벽 ➔ ${tName} 방어막 7]</b>`);
        } else if (skObj.id === 'm_3_1') {
          const singleT = getTargetEnemyForActor('bearer', targetEnemyUid);
          if (singleT) {
            applyLocalEnemyBind(singleT, 1);
            if (typeof sendPlayerActionPacketToGm === 'function') {
              sendPlayerActionPacketToGm([{ kind: 'status', targetUid: singleT.uid, addBindTurns: 1, label: '장전개방: 침묵의 족쇄' }]);
            }
            triggerMageHolyFlameBurstFx([singleT], false);
          }
          summaryParts.push(`<b style="color:#fde68a;">[${idx + 1}: 침묵의 족쇄 ➔ ${singleT ? `🎯${singleT.name}` : '단일 적'} 행동 제약 확정]</b>`);
        }
      });
      document.getElementById('dice-total-display').innerText = '⚡ 장전 개방';
      document.getElementById('dice-formula-display').innerText = summaryParts.map(s => s.replace(/<[^>]+>/g, '')).join(' + ');
      playBeep(640, 'triangle', 0.18);
      log(`⚡ <b>[성염 장전 일괄 개방 (비공격 · 무행동)]</b> ${summaryParts.join(' + ')} (개방 추가 과열 +0)`);
      recordActionBriefing(`▶ 베어러(무행동 개방): [성염 장전 일괄 개방] ➔ ${summaryParts.join(' + ')}`);
      isExecuting = false;
      refreshUI();
      saveSessionState();
      return;
    }

    const curStage = getOverheatStage(heat);
    const heatDmgBonus = getOverheatDmgBonus(heat);
    const bonusDmg = curLevel - 1;

    const advBuff = bearerStatuses.find(s => s.name.includes('유리함') || s.name.includes('표적 조명'));
    let isAdv = (diceMode === 'adv') ||
                (diceMode === 'auto' && Boolean(pickedOrigin && pickedOrigin.includes('아티스') && (hp * 2 <= maxHp))) ||
                spellsToFire.some(sp => sp.alwaysAdv) ||
                Boolean(advBuff);
    let isDis = (diceMode === 'dis');
    if (isAdv && isDis) { isAdv = false; isDis = false; }

    let d1 = Math.floor(Math.random() * 20) + 1, d2 = Math.floor(Math.random() * 20) + 1;
    let raw = isAdv ? Math.max(d1, d2) : (isDis ? Math.min(d1, d2) : d1);
    let formulaStr = isAdv ? `2d20 High (${d1}, ${d2}) ➔ ${raw}` : (isDis ? `2d20 Low (${d1}, ${d2}) ➔ ${raw}` : `1d20(${d1})`);
    let modeText = isAdv ? '장전 개방(유리함)' : (isDis ? '장전 개방(불리함)' : '장전 일괄 개방');

    if (diceMode !== 'auto') { diceMode = 'auto'; updateDiceModeUI(); }

    let copiedBuffDmg = 0;
    let copiedBuffTags = [];
    const dmgBuffLily = bearerStatuses.find(s => s.name === '🔮 마력 순환');
    const dmgBuffSen = bearerStatuses.find(s => s.name === '⚡ 마탄의 잔향');
    const dmgBuffAurora = bearerStatuses.find(s => s.name === '⚡ 단죄의 잔향 (+5 피해)');
    const dmgBuffAmp = bearerStatuses.find(s => s.name === '🔥 성염 증폭 (+3 피해)');
    const dmgBuffBurn = bearerStatuses.find(s => s.name === '🔥 태우는 불꽃 (+3 피해)');
    const dmgBuffRes3 = bearerStatuses.find(s => s.name === '🔥 공명 증폭 (+3 피해)');
    const dmgBuffRes5 = bearerStatuses.find(s => s.name === '🔥 공명 증폭 (+5 피해)');
    if (dmgBuffLily) { copiedBuffDmg += 3; copiedBuffTags.push('마력 순환 +3'); bearerStatuses = bearerStatuses.filter(s => s.id !== dmgBuffLily.id); }
    if (dmgBuffSen) { copiedBuffDmg += 4; copiedBuffTags.push('마탄의 잔향 +4'); bearerStatuses = bearerStatuses.filter(s => s.id !== dmgBuffSen.id); }
    if (dmgBuffAurora) { copiedBuffDmg += 5; copiedBuffTags.push('단죄의 잔향 +5'); bearerStatuses = bearerStatuses.filter(s => s.id !== dmgBuffAurora.id); }
    if (dmgBuffAmp) { copiedBuffDmg += 3; copiedBuffTags.push('성염 증폭 +3'); bearerStatuses = bearerStatuses.filter(s => s.id !== dmgBuffAmp.id); }
    if (dmgBuffBurn) { copiedBuffDmg += 3; copiedBuffTags.push('태우는 불꽃 +3'); }
    if (dmgBuffRes3) { copiedBuffDmg += 3; copiedBuffTags.push('공명 증폭 +3'); }
    if (dmgBuffRes5) { copiedBuffDmg += 5; copiedBuffTags.push('공명 증폭 +5'); }
    if (advBuff) { bearerStatuses = bearerStatuses.filter(s => s.id !== advBuff.id); }
    if (heatDmgBonus > 0) { copiedBuffTags.push(`과열 ${curStage === 'critical' ? '임계' : '경고'} +${heatDmgBonus}`); }
    renderStatuses();

    const totalRoll = raw + 3;
    animateDiceAdvanced(raw, 3, modeText, formulaStr, () => {
      bearerAttackRollUsedThisRound = true;

      // 자연 1 (대실패) 발생 시: 공격 마법 불발 및 메이지 [과잉 마력 폭주] 기믹 발동
      if (raw === 1) {
        bearerLastAttackMissed = true;
        playBeep(150, 'sawtooth', 0.35);
        let nonAttackSummary = [];
        let hasAoeAttack = false;
        spellsToFire.forEach((sp, idx) => {
          const skObj = getBearerSkillById(sp.id);
          if (!skObj) return;
          if (skObj.isAttack || sp.dmg > 0) {
            if (skObj.isAoe) hasAoeAttack = true;
            nonAttackSummary.push(`[${idx + 1}: ${sp.name} ➔ 대실패 불발(피해 0)]`);
          } else if (skObj.id === 'm_1_2') {
            const tActor = sp.target || 'bearer';
            const tName = (tActor === 'comp') ? getCompName() : bearerName;
            const healAmt = 6 + (hasBearerPassive('치유 증폭') ? 3 : 0);
            if (tActor === 'comp') compHp = Math.min(compMaxHp, compHp + healAmt);
            else hp = Math.min(maxHp, hp + healAmt);
            nonAttackSummary.push(`[${idx + 1}: 성염 치유 ➔ ${tName} HP +${healAmt} 회복]`);
          } else if (skObj.id === 'm_3_2') {
            const tActor = sp.target || 'bearer';
            const tName = (tActor === 'comp') ? getCompName() : bearerName;
            grantShield(tActor, 7, '장전 개방: 응축된 방벽');
            nonAttackSummary.push(`[${idx + 1}: 응축된 방벽 ➔ ${tName} 방어막 7]`);
          } else if (skObj.id === 'm_3_1') {
            nonAttackSummary.push(`[${idx + 1}: 침묵의 족쇄 ➔ 적 행동 제약 확정]`);
          }
        });
        applyTargetStatus('bearer', '⛓️ 마력 역류 (차턴 행동제약)', 'debuff', '[메이지 대실패] 다음 라운드 1턴간 서클 마법 시전 불가(캔트립/벤트만 가능)');
        if (hasBearerPassive('강인함')) {
          grantShield('bearer', 5, '강인함 패시브(대실패 상태이상)');
        }
        const nat1GmEffects = [];
        if (hasAoeAttack) {
          getLivingSyncedEnemies().forEach(en => {
            applyLocalEnemyBind(en, 1);
            nat1GmEffects.push({ kind: 'status', targetUid: en.uid, addBindTurns: 1, label: '과잉 마력 폭주 [행동 제약]' });
          });
        } else {
          const singleT = getTargetEnemyForActor('bearer', targetEnemyUid);
          if (singleT) {
            applyLocalEnemyBind(singleT, 1);
            nat1GmEffects.push({ kind: 'status', targetUid: singleT.uid, addBindTurns: 1, label: '과잉 마력 폭주 [행동 제약]' });
          }
        }
        if (nat1GmEffects.length > 0 && typeof sendPlayerActionPacketToGm === 'function') {
          sendPlayerActionPacketToGm(nat1GmEffects);
        }
        const targetScope = hasAoeAttack ? '적 전체' : '목표였던 적';
        log(`💥 <b>[성염 장전 개방 대실패 (자연 1) — 과잉 마력 폭주]</b> ${nonAttackSummary.join(' + ')} | 마력 역류로 <b>[과열 +20]이 추가 누적</b>되며 다음 라운드 메이지에게 <b>[행동 제약]</b>이 걸립니다! 폭주의 여파로 <b>${targetScope}에게도 즉시 이번 라운드 [행동 제약]</b>을 부여합니다!`);
        recordActionBriefing(`▶ 베어러(무행동 개방): [성염 장전 개방 ➔ 자연 1 대실패: 과잉 마력 폭주] ${nonAttackSummary.join(' + ')} & 마력 역류 과열 +20 & 다음R 메이지 [행동 제약] & 이번R ${targetScope} [행동 제약] 부여!`);
        applyHeatIncrease(20, '성염 장전 대실패(마력 역류 +20)');
        isExecuting = false;
        refreshUI();
        saveSessionState();
        return;
      }

      bearerLastAttackMissed = false;
      const isCrit = (raw === 20);
      const critBonus = isCrit ? (hasBearerPassive('맹염') ? 7 : 5) : 0;

      let summaryParts = [];
      let releaseGmEffects = [];
      const livingForRelease = getLivingSyncedEnemies();
      const singleTargetForRelease = getTargetEnemyForActor('bearer', targetEnemyUid);

      spellsToFire.forEach((sp, idx) => {
        const skObj = getBearerSkillById(sp.id);
        if (!skObj) return;
        const tActor = sp.target || 'bearer';
        const tName = (tActor === 'comp') ? getCompName() : bearerName;
        if (skObj.isAttack || sp.dmg > 0) {
          bearerDealtDirectHitThisRound = true;
          const singleBonus = (!skObj.isAoe && hasBearerPassive('맹염')) ? 1 : 0;
          if (!skObj.isAoe && singleTargetForRelease) {
            const hitSingle = isCrit || (totalRoll >= singleTargetForRelease.ac);
            if (!hitSingle && skObj.circle === '0') {
              summaryParts.push(`<span class="log-miss-token" style="color:#94a3b8;">[${idx + 1}: ${sp.name} ➔ 🎯${singleTargetForRelease.name} 빗나감(피해0)]</span>`);
            } else {
              let singleSpellVuln = 0;
              if (hitSingle && singleTargetForRelease.status && singleTargetForRelease.status.weak) {
                singleSpellVuln = 3;
                consumeLocalEnemyWeak(singleTargetForRelease);
              }
              const finalDmg = hitSingle ? (sp.dmg + bonusDmg + heatDmgBonus + copiedBuffDmg + singleBonus + critBonus + singleSpellVuln) : 2;
              bearerDirectDmgThisRound += finalDmg;
              bearerDirectHitUidsThisRound.add(singleTargetForRelease.uid);
              if (hitSingle) bearerRollHitUidsThisRound.add(singleTargetForRelease.uid);
              applyLocalSyncedEnemyDamage(singleTargetForRelease, finalDmg, Boolean(skObj.ignoreShield));
              releaseGmEffects.push({ kind: 'damage', targetUid: singleTargetForRelease.uid, dmg: finalDmg, ignoreShield: Boolean(skObj.ignoreShield), label: `장전개방: ${sp.name}` });
              summaryParts.push(`<b style="color:#fca5a5;">[${idx + 1}: ${sp.name} ➔ 🎯${singleTargetForRelease.name} ${hitSingle ? `${finalDmg} 피해` : '스침 2 피해'}]</b>`);
            }
          } else if (skObj.isAoe && livingForRelease.length > 0) {
            const baseAoeDmg = sp.dmg + bonusDmg + heatDmgBonus + copiedBuffDmg + critBonus;
            livingForRelease.forEach(en => {
              const hitEn = isCrit || (totalRoll >= en.ac);
              const enVuln = (hitEn && en.status && en.status.weak) ? (consumeLocalEnemyWeak(en), 3) : 0;
              const dmgToApply = hitEn ? (baseAoeDmg + enVuln) : 2;
              bearerDirectHitUidsThisRound.add(en.uid);
              if (hitEn) bearerRollHitUidsThisRound.add(en.uid);
              applyLocalSyncedEnemyDamage(en, dmgToApply, Boolean(skObj.ignoreShield));
              releaseGmEffects.push({ kind: 'damage', targetUid: en.uid, dmg: dmgToApply, ignoreShield: Boolean(skObj.ignoreShield), label: `장전개방: ${sp.name}` });
              if (hitEn && skObj.id === 'm_2_1') {
                addLocalEnemyDot(en, 2, 2);
                releaseGmEffects.push({ kind: 'dot', targetUid: en.uid, dotDmg: 2, dotTurns: 2, label: '성염의 소용돌이 DoT 2' });
              }
            });
            summaryParts.push(`<b style="color:#fca5a5;">[${idx + 1}: ${sp.name} ➔ 🎯적 전체 광역 ${baseAoeDmg} 피해]</b>`);
          } else {
            let singleSpellVuln = 0;
            if (enemyVuln) {
              singleSpellVuln = 3;
              if (enemyVulnCharges > 1) enemyVulnCharges--;
              else { enemyVuln = false; enemyVulnCharges = 0; }
              updateEnemyVulnUI();
            }
            const finalDmg = sp.dmg + bonusDmg + heatDmgBonus + copiedBuffDmg + singleBonus + critBonus + singleSpellVuln;
            bearerDirectDmgThisRound += finalDmg;
            const vulnTag = singleSpellVuln > 0 ? ' [방어약화+3]' : '';
            const extraNote = (skObj.id === 'm_2_1') ? ' (방어막 무시 + [지속 피해: 2] 2R)' : '';
            summaryParts.push(`<b style="color:#fca5a5;">[${idx + 1}: ${sp.name} ➔ ${finalDmg} 피해${vulnTag}${extraNote}]</b>`);
          }
        } else if (skObj.id === 'm_1_2') {
          const healAmt = 6 + (hasBearerPassive('치유 증폭') ? 3 : 0);
          if (tActor === 'comp') compHp = Math.min(compMaxHp, compHp + healAmt);
          else hp = Math.min(maxHp, hp + healAmt);
          summaryParts.push(`<b style="color:#6ee7b7;">[${idx + 1}: 성염 치유 ➔ ${tName} HP +${healAmt} 회복]</b>`);
        } else if (skObj.id === 'm_3_2') {
          grantShield(tActor, 7, '장전 개방: 응축된 방벽');
          summaryParts.push(`<b style="color:#93c5fd;">[${idx + 1}: 응축된 방벽 ➔ ${tName} 방어막 7]</b>`);
        } else if (skObj.id === 'm_3_1') {
          if (singleTargetForRelease) {
            applyLocalEnemyBind(singleTargetForRelease, 1);
            releaseGmEffects.push({ kind: 'status', targetUid: singleTargetForRelease.uid, addBindTurns: 1, label: '장전개방: 침묵의 족쇄' });
          }
          summaryParts.push(`<b style="color:#fde68a;">[${idx + 1}: 침묵의 족쇄 ➔ ${singleTargetForRelease ? `🎯${singleTargetForRelease.name}` : '적'} 행동 제약 확정]</b>`);
        }
      });
      if (releaseGmEffects.length > 0 && typeof sendPlayerActionPacketToGm === 'function') {
        sendPlayerActionPacketToGm(releaseGmEffects);
      }

      // 메이지 성염 장전 개방 카타르시스 특수 연출 (스크린 플래시 + 적 카드 성염 폭발 쉐이크 + 파티클 + 전용 폭발음)
      const hitEnemiesForFx = [];
      const hasAoeSpell = spellsToFire.some(sp => { const s = getBearerSkillById(sp.id); return s && s.isAoe; });
      if (hasAoeSpell && livingForRelease.length > 0) {
        hitEnemiesForFx.push(...livingForRelease);
      } else if (singleTargetForRelease) {
        hitEnemiesForFx.push(singleTargetForRelease);
      }
      if (hitEnemiesForFx.length > 0) {
        triggerMageHolyFlameBurstFx(hitEnemiesForFx, isCrit);
      }

      if (isCrit && pickedClass === '메이지') {
        applyTargetStatus('bearer', '🪨 융기하는 성염 암벽 (피격 -3)', 'buff', '[메이지 대성공] 이번 라운드 아군 전체가 받는 모든 피격 피해 3 경감');
        applyTargetStatus('comp', '🪨 융기하는 성염 암벽 (피격 -3)', 'buff', '[메이지 대성공] 이번 라운드 아군 전체가 받는 모든 피격 피해 3 경감');
        summaryParts.push('[대성공: 융기하는 성염 암벽(아군 전체 피격 -3)]');
      }

      if (hasBearerPassive('거울상 연성') && raw >= 17) {
        summaryParts.push('[거울상 연성(순수17+): 공격 마법 무과열 1회 연속 발동!]');
      }

      const buffNote = copiedBuffTags.length > 0 ? ` [${copiedBuffTags.join(', ')} 일괄 복사!]` : '';
      const critNote = isCrit ? ` <b style="color:#feb2b2;">[치명타 +${critBonus}!]</b>` : '';
      log(`⚡ <b>[성염 장전 일괄 개방 (행동 미소모)]</b> 단일 명중 판정: ${formulaStr} + 3 = <b>${totalRoll}</b> ➔ ${summaryParts.join(' + ')}${critNote}${buffNote} (개방 추가 과열 +0)`);
      const cleanSummary = summaryParts.map(s => s.replace(/<[^>]+>/g, '')).join(' + ');
      recordActionBriefing(`▶ 베어러(무행동 개방): [성염 장전 일괄 개방] ➔ ${formulaStr} + 3 = ${totalRoll} ➔ ${cleanSummary}${buffNote}`);

      isExecuting = false;
      refreshUI();
      saveSessionState();
    });
  }
  window.releaseChargedSpells = releaseChargedSpells;

  /* ==========================================================================
     [Phase 3 & 4 & 5] 등지기 4서클 [원격 투영] 동료 스킬 독립 복사본 발동 헬퍼
     ========================================================================== */
  function executeProjectedCompSkill(compTag, projOpt, preCastHeatStage, heatDmgBonus, cb) {
    ensureValidCompDeck(false);
    const c = COMPS[pickedComp];
    const slotIdx = (compTag === 'A') ? 0 : ((compTag === 'B') ? 1 : 2);
    const sk = getCompSkillById(compDeck[slotIdx]);
    if (!sk) { if (cb) cb(); return; }
    const opt = projOpt || {};

    const bonusDmg = curLevel - 1;
    applyTargetStatus('bearer', '🪞 원격 투영', 'buff', `이번 라운드 ${getCompName()}의 데이터(AC ${c.ac}, 판정 +2) 투영 중`, c.ac - BEARERS[pickedClass].ac);

    if (!sk.isAttack) {
      const pTargetEn = getTargetEnemyForActor('bearer', opt.enemyUid);
      if (sk.isDirectHitNoRoll) {
        bearerDealtDirectHitThisRound = true;
        if (pTargetEn && !sk.isAoe) bearerDirectHitUidsThisRound.add(pTargetEn.uid);
      }
      if (sk.id === 'so_1_2') {
        if (pTargetEn) {
          applyLocalSyncedEnemyDamage(pTargetEn, 1, false);
          queueGmEffect({ kind: 'damage', targetUid: pTargetEn.uid, dmg: 1, ignoreShield: false, label: '원격 투영: 생명 흡수진 1 피해' });
        }
        hp = Math.min(maxHp, hp + 2);
        log(`🪞 <b>[원격 투영: ${sk.name}]</b> ${bearerName}이(가) ${getCompName()}의 술식을 투영하여 판정 없이 ${pTargetEn ? `🎯${pTargetEn.name}` : '적'} 1 피해 + 베어러 HP +2 회복!`);
        recordActionBriefing(`▶ 베어러: [원격 투영 ➔ ${sk.name}] ➔ 확정 적 1 피해 & 베어러 HP +2 회복 | 과열 +70`);
      } else if (sk.id === 'so_1_3') {
        if (pTargetEn) {
          applyLocalSyncedEnemyDamage(pTargetEn, 5, false);
          queueGmEffect({ kind: 'damage', targetUid: pTargetEn.uid, dmg: 5, ignoreShield: false, label: '원격 투영: 마력 흡수진 5 피해' });
        }
        heat = Math.max(0, heat - 10);
        applyTargetStatus('bearer', '🔮 마력 순환', 'buff', '다음 1회 직접 공격 적중 시 +3 피해 추가');
        log(`🪞 <b>[원격 투영: ${sk.name}]</b> 판정 없이 ${pTargetEn ? `🎯${pTargetEn.name}` : '적'} 5 피해 + 베어러 과열 -10 냉각 + 다음 공격 +3 버프!`);
        recordActionBriefing(`▶ 베어러: [원격 투영 ➔ ${sk.name}] ➔ 확정 적 5 피해 & 과열 -10 냉각 & 다음 공격 +3 | 과열 +70`);
      } else if (sk.id === 'so_2_1') {
        hp = Math.min(maxHp, hp + 2);
        grantShield('bearer', 2, '원격 투영: 피의 서약');
        log(`🪞 <b>[원격 투영: ${sk.name}]</b> 베어러 HP +2 회복 & [방어막 2] 획득!`);
        recordActionBriefing(`▶ 베어러: [원격 투영 ➔ ${sk.name}] ➔ 베어러 HP +2 회복 & [방어막 2] 획득 | 과열 +70`);
      } else if (sk.id === 'so_3_1') {
        hp = Math.min(maxHp, hp + 3);
        compHp = Math.min(compMaxHp, compHp + 3);
        const hadDebuff = bearerStatuses.some(s => s.type === 'debuff');
        bearerStatuses = bearerStatuses.filter(s => s.type !== 'debuff');
        renderStatuses();
        if (hadDebuff) {
          bearerDealtDirectHitThisRound = true;
          if (pTargetEn) {
            bearerDirectHitUidsThisRound.add(pTargetEn.uid);
            applyLocalSyncedEnemyDamage(pTargetEn, 4, false);
            applyLocalEnemyWeak(pTargetEn, 1);
            queueGmEffect({ kind: 'damage', targetUid: pTargetEn.uid, dmg: 4, ignoreShield: false, label: '원격 투영: 순환의 정화술 4 피해' });
            queueGmEffect({ kind: 'status', targetUid: pTargetEn.uid, addWeakCharges: 1, label: '원격 투영: 순환의 정화술 [방어 약화]' });
          } else {
            enemyVuln = true;
            enemyVulnCharges = hasBearerPassive('강경 속박') ? 2 : 1;
            updateEnemyVulnUI();
          }
        }
        log(`🪞 <b>[원격 투영: ${sk.name}]</b> 아군 전체 HP +3 회복 & 베어러 상태이상 정화${hadDebuff ? ' (+적 1체 무판정 4 피해 & 방어 약화 부여!)' : ''}!`);
        recordActionBriefing(`▶ 베어러: [원격 투영 ➔ ${sk.name}] ➔ 아군 전체 HP +3 & 정화${hadDebuff ? ' & 적 4 피해·방어약화' : ''} | 과열 +70`);
      } else if (sk.id === 'so_3_2') {
        if (opt.resonanceMode === 'vent') {
          bearerDealtDirectHitThisRound = true;
          if (pTargetEn) {
            bearerDirectHitUidsThisRound.add(pTargetEn.uid);
            applyLocalSyncedEnemyDamage(pTargetEn, 3, false);
            queueGmEffect({ kind: 'damage', targetUid: pTargetEn.uid, dmg: 3, ignoreShield: false, label: '원격 투영: 열기 공명진 3 피해' });
          }
          heat = Math.max(0, heat - 20);
          log(`🪞 <b>[원격 투영: ${sk.name}(공명 환기)]</b> 적 1체 무판정 고정 3 피해 & 베어러 과열 즉시 -20 냉각!`);
          recordActionBriefing(`▶ 베어러: [원격 투영 ➔ ${sk.name}(공명 환기)] ➔ 적 1체 무판정 3 피해 & 베어러 과열 -20 냉각 | 과열 +70`);
        } else {
          const isHigh = (heat >= 70);
          const dmgBoost = isHigh ? 5 : 3;
          applyTargetStatus('bearer', `🔥 공명 증폭 (+${dmgBoost} 피해)`, 'buff', `[원격 투영: 열기 공명진] 이번 라운드 베어러 직접 타격 피해 +${dmgBoost}`);
          log(`🪞 <b>[원격 투영: ${sk.name}(공명 증폭)]</b> 이번 라운드 베어러 직접 타격 피해량 +${dmgBoost} 증가!`);
          recordActionBriefing(`▶ 베어러: [원격 투영 ➔ ${sk.name}(공명 증폭)] ➔ 이번R 베어러 직접 피해 +${dmgBoost} | 과열 +70`);
        }
      } else if (sk.id === 'so_4_1') {
        if (pTargetEn) {
          applyLocalSyncedEnemyDamage(pTargetEn, 5, false);
          queueGmEffect({ kind: 'damage', targetUid: pTargetEn.uid, dmg: 5, ignoreShield: false, label: '원격 투영: 생사 역전 5 피해' });
        }
        const wasHalf = (hp * 2 <= maxHp);
        hp = Math.min(maxHp, hp + 6);
        compHp = Math.min(compMaxHp, compHp + 6);
        if (wasHalf) {
          heat = Math.max(0, heat - 30);
          applyTargetStatus('bearer', '☯️ 생사 역전 (피격 -3)', 'buff', '[생사 역전] 이번 라운드 베어러 피격 피해 3 경감');
        }
        log(`🪞 <b>[원격 투영: ${sk.name}]</b> 단일 적 무판정 5 피해 + 아군 전체 HP +6 회복${wasHalf ? ' + 과열 -30 냉각 & 피격 -3 경감' : ''}!`);
        recordActionBriefing(`▶ 베어러: [원격 투영 ➔ ${sk.name}] ➔ 적 5 피해 & 아군 전체 HP +6 회복${wasHalf ? ' & 과열-30·피격-3' : ''} | 과열 +70`);
      } else if (sk.id === 'w_2_1') {
        applyTargetStatus('bearer', '🛡️ 전열의 고함 (피격 -3)', 'buff', '[원격 투영] 모든 적 단일 공격 베어러로 유도 & 피격 -3 & 적 전체 공격력 -1');
        getLivingSyncedEnemies().forEach(en => { en.tauntedBy = 'bearer'; en.atkMod = (en.atkMod || 0) - 1; });
        queueGmEffect({ kind: 'aoe_taunt', tauntedBy: 'bearer', atkModDelta: -1, label: '원격 투영: 전열의 고함(전체 베어러 도발 & 적 공-1)' });
        log(`🪞 <b>[원격 투영: ${sk.name}]</b> 모든 단일 공격 베어러 유도 & 베어러 피격 -3 감소 & 적 전체 공격력 -1 감소!`);
        recordActionBriefing(`▶ 베어러: [원격 투영 ➔ ${sk.name}] ➔ 단일 공격 유도 & 피격 -3 & 적 전체 공 -1 | 과열 +70`);
      } else if (sk.id === 'w_4_1') {
        applyTargetStatus('bearer', '🏰 불굴의 방파제 (피격-4·반격4)', 'buff', '[원격 투영] 모든 단일 공격 유도 & 피격 -4 & 종료 시 피격당 적 전체 4 피해');
        getLivingSyncedEnemies().forEach(en => { en.tauntedBy = 'bearer'; });
        queueGmEffect({ kind: 'aoe_taunt', tauntedBy: 'bearer', label: '원격 투영: 불굴의 방파제(전체 베어러 도발)' });
        log(`🪞 <b>[원격 투영: ${sk.name}]</b> 모든 단일 공격 유도 & 베어러 피격 -4 감소 & 종료 시 직접 피격 1회당 적 전체 무판정 4 피해!`);
        recordActionBriefing(`▶ 베어러: [원격 투영 ➔ ${sk.name}] ➔ 단일 공격 유도 & 피격 -4 & 피격당 적 전체 4 반격 | 과열 +70`);
      } else if (sk.id === 'ms_1_2') {
        grantShield('bearer', 3, '원격 투영: 마탄 응축');
        recordActionBriefing(`▶ 베어러: [원격 투영 ➔ 마탄 응축] ➔ 베어러 방어막 3 획득 | 과열 +70`);
      } else if (sk.id === 'ms_2_2') {
        applyTargetStatus('bearer', '⚡ 역장 패링 (회피반격2)', 'buff', '[원격 투영] 이번 라운드 적 공격 회피 시 해당 적에게 무판정 2 피해');
        log(`🪞 <b>[원격 투영: ${sk.name}]</b> 이번 라운드 적 공격 회피 시 해당 적에게 무판정 고정 2 피해!`);
        recordActionBriefing(`▶ 베어러: [원격 투영 ➔ ${sk.name}] ➔ 회피 시 적 무판정 2 피해 | 과열 +70`);
      } else if (sk.id === 'ms_4_2') {
        getLivingSyncedEnemies().forEach(en => {
          bearerDirectHitUidsThisRound.add(en.uid);
          applyLocalSyncedEnemyDamage(en, 3, false);
        });
        queueGmEffect({ kind: 'aoe_damage', dmg: 3, ignoreShield: false, label: '원격 투영: 무영의 검무(적 전체 3 피해)' });
        applyTargetStatus('bearer', '⚡ 무영의 검무 (피격 -3)', 'buff', '[원격 투영] 이번 라운드 베어러 피격 피해 3 경감');
        log(`🪞 <b>[원격 투영: ${sk.name}]</b> 적 전체에게 판정 없이 고정 3 피해 & 이번 라운드 베어러 피격 피해 -3 경감!`);
        recordActionBriefing(`▶ 베어러: [원격 투영 ➔ ${sk.name}] ➔ 적 전체 무판정 3 피해 & 베어러 피격 -3 경감 | 과열 +70`);
      } else if (sk.id === 'r_3_1') {
        getLivingSyncedEnemies().forEach(en => extendLocalEnemyDots(en, 1));
        queueGmEffect({ kind: 'aoe_extend_dots', addTurns: 1, label: '진혼의 약초 연무(적 전체 DoT +1R 연장)' });
        const coolAmt = (heat >= 70) ? 20 : 10;
        heat = Math.max(0, heat - coolAmt);
        applyTargetStatus('bearer', '🌿 약초 연무 (피격 -2)', 'buff', '[진혼의 약초 연무] 이번 라운드 받는 모든 피격 피해 2 경감');
        applyTargetStatus('comp', '🌿 약초 연무 (피격 -2)', 'buff', '[진혼의 약초 연무] 이번 라운드 받는 모든 피격 피해 2 경감');
        log(`🪞 <b>[원격 투영: ${sk.name}]</b> 과열 -${coolAmt} 냉각 & 아군 전체 피격 -2 경감 & 전장 모든 적 [지속 피해] +1R 연장!`);
        recordActionBriefing(`▶ 베어러: [원격 투영 ➔ ${sk.name}] ➔ 과열 -${coolAmt} 냉각 & 아군 피격 -2 & 적 지속피해 +1R 연장 | 과열 +70`);
      } else {
        log(`🪞 <b>[원격 투영: ${sk.name}]</b> ${getCompName()}의 기술을 투영하여 즉시 발동했습니다!`);
        recordActionBriefing(`▶ 베어러: [원격 투영 ➔ ${sk.name}] 발동 | 과열 +70`);
      }
      applyHeatIncrease(70, '원격 투영');
      refreshUI();
      if (cb) cb();
      return;
    }

    let isDedroCombo = (pickedComp === '데드로' && sk.id === 'w_1_1' && dedroComboReady === curRound - 1);
    let baseDmg = isDedroCombo ? 7 : sk.dmg;
    let isSkillAoe = Boolean(sk.isAoe);
    let projNote = '';
    let extraNotes = [];
    let forceAdvFromSkill = false;
    const copiedStacks = senCharge;

    if (sk.id === 'w_2_2' && opt.bonusHit) {
      baseDmg = 6;
      extraNotes.push('타겟 인텐트 보정(6 피해)');
    } else if (sk.id === 'w_3_1') {
      applyTargetStatus('bearer', '🗡️ 복수의 칼날 (피격-2·반격3)', 'buff', '[원격 투영] 이번R 피격 -2 감소 & 종료 시 공격 시도 적에게 무판정 3 피해');
      extraNotes.push('피격 -2 & 종료 시 반격 3');
    } else if (sk.id === 'w_3_2') {
      heat = Math.max(0, heat - 10);
      extraNotes.push('시전 즉시 과열 -10 냉각');
    } else if (sk.id === 'w_4_2' && (opt.condAdv || (hp * 2 <= maxHp) || enemyVuln)) {
      forceAdvFromSkill = true;
    } else if (sk.id === 'so_2_2') {
      if (opt.singleEnemy) {
        baseDmg = 3;
        isSkillAoe = false;
        extraNotes.push('단독 적 응축(3 피해 & 이번R 공-3)');
      } else {
        extraNotes.push('적 전체 이번R 공-1');
      }
    } else if (sk.id === 'ms_1_1') {
      if (opt.singleEnemy) {
        baseDmg = 4;
      }
    } else if (sk.id === 'ms_1_3') {
      const s = Math.max(1, copiedStacks);
      baseDmg = ({ 1: 7, 2: 13, 3: 20 }[s] || 7);
      projNote = ` [복사된 마탄 ${s}스택 방출 · 본체 스택 유지]`;
    } else if (sk.id === 'ms_3_1') {
      baseDmg = 4 + (copiedStacks * 3);
      projNote = ` [복사된 마탄 ${copiedStacks}스택 산탄 · 본체 스택 유지]`;
    } else if (sk.id === 'ms_3_2') {
      const wasHigh = (heat >= 70);
      const coolAmt = wasHigh ? 20 : 10;
      heat = Math.max(0, heat - coolAmt);
      extraNotes.push(`시전 즉시 과열 -${coolAmt} 냉각`);
      if (wasHigh) forceAdvFromSkill = true;
    } else if (sk.id === 'ms_4_1') {
      baseDmg = ({ 0: 8, 1: 12, 2: 18, 3: 25 }[copiedStacks] || 8);
      projNote = ` [복사된 마탄 ${copiedStacks}스택 극광 일섬 · 본체 스택 유지]`;
      if (copiedStacks >= 2) extraNotes.push('방어막 무시');
    } else if (sk.id === 'r_2_1') {
      if (opt.singleEnemy) {
        baseDmg = 4;
        isSkillAoe = false;
        extraNotes.push('단독 적 집중(4 피해 + [지속 피해: 3] 2R)');
      } else {
        extraNotes.push('적 전체 [지속 피해: 2] 2R 부여');
      }
    }

    // 동료에게 적용 중인 공격 버프 및 베어러 자신의 공격 버프 합산 (복사본 독립 연산)
    let projBuffDmg = 0;
    let projBuffTags = [];
    if (compStatuses.some(s => s.name.includes('과부하 조광'))) { projBuffDmg += 3; projBuffTags.push('과부하 조광 +3'); }
    if (compStatuses.some(s => s.name === '🛡️ 스프링보드')) { projBuffDmg += 3; projBuffTags.push('스프링보드 +3'); }
    if (blazingBladeActive || compStatuses.some(s => s.name.includes('타오르는 칼날'))) { projBuffDmg += 6; projBuffTags.push('타오르는 칼날 +6'); }
    if (bearerStatuses.some(s => s.name === '🔥 태우는 불꽃 (+3 피해)') || compStatuses.some(s => s.name === '🔥 태우는 불꽃 (+3 피해)')) {
      projBuffDmg += 3; projBuffTags.push('태우는 불꽃 +3');
    }
    const hasCompAdv = compStatuses.some(s => s.name.includes('유리함') || s.name.includes('비추는 불꽃'));
    const hasBearerAdv = bearerStatuses.some(s => s.name.includes('유리함') || s.name.includes('표적 조명'));

    let d1 = Math.floor(Math.random() * 20) + 1, d2 = Math.floor(Math.random() * 20) + 1;
    let isAdv = (diceMode === 'adv') || Boolean(sk.alwaysAdv) || Boolean(opt.condAdv) || forceAdvFromSkill || isDedroCombo || hasCompAdv || hasBearerAdv ||
                (diceMode === 'auto' && Boolean(pickedOrigin && pickedOrigin.includes('아티스') && (hp * 2 <= maxHp)));
    let isDis = (diceMode === 'dis');
    if (isAdv && isDis) { isAdv = false; isDis = false; }
    let raw = isAdv ? Math.max(d1, d2) : (isDis ? Math.min(d1, d2) : d1);
    let formulaStr = isAdv ? `2d20 High (${d1}, ${d2}) ➔ ${raw}` : (isDis ? `2d20 Low (${d1}, ${d2}) ➔ ${raw}` : `1d20(${d1})`);
    if (diceMode !== 'auto') { diceMode = 'auto'; updateDiceModeUI(); }

    let total = raw + 2;
    const isCrit = (raw === 20) || (sk.id === 'ms_4_1' && raw >= 18);
    // 룰북: 원격 투영의 대성공/대실패 규칙은 컴패니언 기준을 따름 (+5 치명타)
    const critBonus = isCrit ? 5 : 0;
    let vulnDmg = 0;
    if (enemyVuln && baseDmg > 0) {
      vulnDmg = 3;
      if (enemyVulnCharges > 1) enemyVulnCharges--;
      else { enemyVuln = false; enemyVulnCharges = 0; }
      updateEnemyVulnUI();
    }
    let finalDmg = (baseDmg > 0) ? (baseDmg + bonusDmg + heatDmgBonus + projBuffDmg + critBonus + vulnDmg) : 0;

    animateDiceAdvanced(raw, 2, '원격 투영 판정', formulaStr, () => {
      bearerAttackRollUsedThisRound = true;
      const pTargetObj = !isSkillAoe ? getTargetEnemyForActor('bearer', opt.enemyUid) : null;
      const pLivingList = getLivingSyncedEnemies();
      const projIgnoreShield = Boolean(sk.id === 'ms_4_1' && copiedStacks >= 2);
      const isProjSingleMiss = Boolean(pTargetObj && (raw === 1 || (!isCrit && total < pTargetObj.ac)));

      if (isProjSingleMiss) {
        bearerLastAttackMissed = true;
        const extraNoteStr = extraNotes.length > 0 ? ' ' + extraNotes.map(n => `<span style="color:#d8b4fe;">(${n})</span>`).join(' ') : '';
        log(`🪞 <b>[원격 투영: ${sk.name}]</b> ${getCompName()}의 기예를 투영!${projNote} ➔ <span style="color:#fde68a; font-weight:800;">[🎯${pTargetObj.name} (AC ${pTargetObj.ac})]</span> | ${formulaStr} + 2 = <span style="color:#cbd5e1; font-weight:800;">${total} &lt; AC ${pTargetObj.ac}</span> ➔ <span class="log-miss-token" style="color:#94a3b8; font-weight:700;">피해 0 (빗나감)</span>${extraNoteStr}`);
        recordActionBriefing(`▶ 베어러: [원격 투영 ➔ ${sk.name} ➔ 🎯${pTargetObj.name}(AC ${pTargetObj.ac})] ➔ ${formulaStr} + 2 = ${total} [빗나감: 피해 0] | 과열 +70`);
        applyHeatIncrease(70, '원격 투영');
        refreshUI();
        if (cb) cb();
        return;
      }

      bearerDealtDirectHitThisRound = true;
      bearerDirectDmgThisRound += finalDmg;

      // 적중 후속 효과 (컴패니언 본체 스택/쿨다운에 영향 없이 적 디버프 및 베어러 버프 적용)
      if (sk.id === 'w_1_1' && isDedroCombo) {
        extraNotes.push('대상 이번R 공격 [불리함] 강제');
      } else if (sk.id === 'w_1_2') {
        applyTargetStatus('bearer', '🛡️ 투지 발휘 (피격-3·면역)', 'buff', '[원격 투영] 이번R 피격 3 경감, 행동 제약 면역 & 단일 공격 유도');
        extraNotes.push('피격 -3 & 행동제약 면역 & 단일공격 유도');
      } else if (sk.id === 'w_2_2' || sk.id === 'so_4_2' || sk.id === 'r_2_2' || (sk.id === 'ms_3_1' && copiedStacks >= 2)) {
        enemyVuln = true;
        enemyVulnCharges = hasBearerPassive('강경 속박') ? 2 : 1;
        updateEnemyVulnUI();
        extraNotes.push('대상 [방어 약화(+3)] 부여');
      } else if (sk.id === 'w_3_2') {
        extraNotes.push('적중한 모든 대상 이번R 공격 [불리함] 강제');
      } else if (sk.id === 'w_4_2' && (opt.condAdv || forceAdvFromSkill)) {
        extraNotes.push('대상 이번R [행동 제약] 부여');
      } else if (sk.id === 'so_1_1') {
        extraNotes.push('대상 다음 1회 공격 피해량 -2 경감');
      } else if (sk.id === 'ms_1_3' && copiedStacks >= 3) {
        applyTargetStatus('bearer', '⚡ 마탄의 잔향', 'buff', '다음 1회 직접 공격 적중 시 +4 피해 추가');
        extraNotes.push('3스택: 베어러 다음 공격 +4');
      } else if (sk.id === 'ms_3_2' && forceAdvFromSkill) {
        extraNotes.push('과열70+ 보정: 대상 이번R [행동 제약] 부여');
      } else if (sk.id === 'ms_1_1') {
        if (pLivingList.length > 1) {
          extraNotes.push('대상 외 다른 모든 적에게 파편 1 피해');
        } else {
          extraNotes.push('단독 적 파편 집중(4 피해)');
        }
      } else if (sk.id === 'ms_4_1') {
        extraNotes.push('적중 시 다른 모든 적에게 무판정 파편 고정 3 피해');
        if (copiedStacks >= 3) {
          applyTargetStatus('bearer', '⚡ 단죄의 잔향 (+5 피해)', 'buff', '[극광 일섬 3스택] 베어러의 다음 1회 직접 공격 피해 +5 추가');
          enemyVuln = true;
          enemyVulnCharges = hasBearerPassive('강경 속박') ? 2 : 1;
          updateEnemyVulnUI();
          extraNotes.push('3스택: 베어러 다음 공격 +5 & 대상 [방어 약화(+3)] 부여');
        }
      } else if (sk.id === 'r_1_1') {
        extraNotes.push('[지속 피해: 2] 2R 부여');
      } else if (sk.id === 'r_1_2') {
        extraNotes.push('대상 모든 [지속 피해] +1R 연장');
      } else if (sk.id === 'r_1_3') {
        extraNotes.push('지속 피해 보유 대상 [행동 제약] 부여');
      } else if (sk.id === 'r_3_2') {
        extraNotes.push('기존 지속피해 +1R 연장 후 [지속 피해: 3] 2R 추가 & 전염');
      } else if (sk.id === 'r_4_1' && opt.condAdv) {
        enemyVuln = true;
        enemyVulnCharges = hasBearerPassive('강경 속박') ? 2 : 1;
        updateEnemyVulnUI();
        const bonusTrueDmg = (opt.dotSum || 0) * 2;
        extraNotes.push(`대상 [방어 약화] & [행동 제약] 부여 + 방어막 무시 고정 +${bonusTrueDmg} 추가 피해`);
      } else if (sk.id === 'r_4_2') {
        extraNotes.push('적 전체 [지속 피해: 3] 2R & 이번R 적 공격 [불리함] & 종료 시 지속피해 절반 흡혈');
      }

      let anyProjAoeHit = false;
      if (raw !== 1) {
        if (pTargetObj && (isCrit || total >= pTargetObj.ac)) {
          bearerRollHitUidsThisRound.add(pTargetObj.uid);
          bearerDirectHitUidsThisRound.add(pTargetObj.uid);
          applyLocalSyncedEnemyDamage(pTargetObj, finalDmg, projIgnoreShield);
          queueGmEffect({ kind: 'damage', targetUid: pTargetObj.uid, dmg: finalDmg, ignoreShield: projIgnoreShield, consumedWeak: (vulnDmg > 0), label: `원격 투영: ${sk.name}` });
        } else if (isSkillAoe && pLivingList.length > 0) {
          anyProjAoeHit = false;
          pLivingList.forEach(en => {
            if (isCrit || total >= en.ac) {
              anyProjAoeHit = true;
              bearerRollHitUidsThisRound.add(en.uid);
              bearerDirectHitUidsThisRound.add(en.uid);
              applyLocalSyncedEnemyDamage(en, finalDmg, projIgnoreShield);
              queueGmEffect({ kind: 'damage', targetUid: en.uid, dmg: finalDmg, ignoreShield: projIgnoreShield, label: `원격 투영: ${sk.name}` });
            }
          });
          if (!anyProjAoeHit) bearerLastAttackMissed = true;
        }
      }
      if (sk.id === 'r_4_2' && raw !== 1) reaperDomainActiveThisRound = true;
      const buffNote = projBuffTags.length > 0 ? ` [${projBuffTags.join(', ')}]` : '';
      const extraNoteStr = extraNotes.length > 0 ? ` (${extraNotes.join(' / ')})` : '';
      log(`🪞 <b>[원격 투영: ${sk.name}]</b> ${getCompName()}의 기예를 완벽히 투영!${projNote} ➔ ${formulaStr} + 2 = <b>${total}</b> ${finalDmg > 0 ? `(명중 시: <b>${finalDmg}</b> ${isSkillAoe ? '광역 ' : ''}피해${isCrit ? ' [치명타 +5!]' : ''}${vulnDmg > 0 ? ' [방어약화 +3!]' : ''}${buffNote})` : ''}${extraNoteStr}`);
      recordActionBriefing(`▶ 베어러: [원격 투영 ➔ ${sk.name}]${projNote} ➔ ${formulaStr} + 2 = ${total} ${finalDmg > 0 ? `(고정 ${finalDmg} ${isSkillAoe ? '광역 ' : ''}피해${isCrit ? ' [치명타 +5!]' : ''}${vulnDmg > 0 ? ' [방어약화 +3!]' : ''}${buffNote})` : ''}${extraNoteStr} | 과열 +70`);

      if (hasBearerPassive('거울상 연성') && raw >= 17 && finalDmg > 0) {
        const mirrorDmg = baseDmg + bonusDmg + heatDmgBonus + projBuffDmg;
        bearerDirectDmgThisRound += mirrorDmg;
        log(`🪞 <b>[패시브: 거울상 연성 발동!]</b> 순수 주사위 <b>${raw}</b>(17 이상) 달성! 빛의 거울상이 연성되어 추가 과열 없이 <b>[${sk.name}]</b>을(를) 즉시 1회 더 연속 발동합니다! (추가 <b>${mirrorDmg}</b> 피해!)`);
        recordActionBriefing(`   ↳ 🪞 [거울상 연성] 순수 ${raw}(17+) ➔ [${sk.name}] 무과열 연속 발동 (추가 고정 ${mirrorDmg} 피해)`);
      }

      applyHeatIncrease(70, '원격 투영');
      refreshUI();
      if (cb) cb();
    });
  }

  /* ==========================================================================
     [Phase 4 & 5] 컴패니언 36종 전체 스킬(룰북 v2.24 원문) & [열기 전도] 통합 실행 엔진
     ========================================================================== */
  function runCompSkillLogic(tag, cb) {
    ensureValidCompDeck(false);

    // 1. [열기 전도 (성염 분담)] 처리 (룰북 v2.24: 컴패니언 HP 1에서도 선언 후 탈진 가능, [태우는 불꽃] 시 거친 교감 연출)
    if (tag === 'HEAT') {
      if (pyrite < 1 || compHp < 1) {
        log(`⚠️ <b>[열기 전도 취소]</b> 장미 휘석(보유:${pyrite}) 또는 동료 HP(현재:${compHp}) 조건이 충족되지 않았습니다.`);
        if (cb) cb();
        return;
      }
      pyrite -= 1;
      compHp = Math.max(0, compHp - 1);
      const prevHeat = heat;
      const cooled = Math.min(30, heat);
      heat = Math.max(0, heat - 30);

      document.getElementById('dice-total-display').innerText = `-${cooled} 냉각`;
      document.getElementById('dice-formula-display').innerText = `열기 전도 (휘석-1 · ${getCompName()} HP-1)`;
      playBeep(480, 'sine', 0.2);

      const isBurnFlavor = (communionFlame === 'burn' || communionActiveThisRound === 'burn');
      const flavorLine = isBurnFlavor
        ? `<br><i style="color:#fde68a;">"${getCompName()}이(가) 베어러의 멱살과 어깨를 거칠게 움켜쥐며 성염을 강제로 빨아들입니다 — 내 손으로 끝장내기 전엔 멋대로 타 죽지 마라!"</i>`
        : '';
      const exhaustedNote = (compHp === 0) ? ` <b style="color:#f87171;">(${getCompName()} HP 0 탈진!)</b>` : '';

      log(`🔥 <b>[열기 전도 (성염 분담)]</b> ${getCompName()}이(가) 장미 휘석 1개를 매개로 베어러의 끓어오르는 성염 열기를 자신의 육신으로 끌어안았습니다! ➔ 동료 실제 HP -1 차감(잔여: <b>${compHp}/${compMaxHp}</b>)${exhaustedNote}, 베어러 과열 <b>${prevHeat} ➔ ${heat} (-${cooled} 즉시 냉각)</b>!${flavorLine}`);
      recordActionBriefing(`▶ ${getCompName()}: [열기 전도(성염 분담)] ➔ 장미 휘석 1개 & 동료 실제 HP 1 소모 ➔ 베어러 과열 -${cooled} 냉각 (현재 과열: ${heat}/100, 동료 HP: ${compHp}/${compMaxHp})`);
      refreshUI();
      saveSessionState();
      if (cb) cb();
      return;
    }

    const slotIdx = (tag === 'A') ? 0 : ((tag === 'B') ? 1 : 2);
    const sk = getCompSkillById(compDeck[slotIdx]);
    if (!sk) { if (cb) cb(); return; }

    const opt = compSlotOptions[tag] || {};
    delete compSlotOptions[tag];

    // 슬롯 쿨다운 적용
    if (sk.cd > 0) {
      compCds[tag] = sk.cd;
      compCd = Math.max(compCds.A || 0, compCds.B || 0, compCds.C || 0);
      if (pickedComp === '데드로') {
        dedroComboReady = curRound;
      }
    }

    const bonusDmg = curLevel - 1;

    // 2. 무판정 스킬 처리 (전열의 고함, 불굴의 방파제, 생명 흡수진, 마력 흡수진, 피의 서약, 순환의 정화술, 열기 공명진, 생사 역전, 마탄 응축, 역장 패링, 무영의 검무, 진혼의 약초 연무)
    if (!sk.isAttack) {
      if (sk.id === 'w_2_1') {
        applyTargetStatus('comp', '🛡️ 전열의 고함 (피격 -3)', 'buff', '이번 라운드 모든 적 단일 공격 워리어로 강제 전환 & 워리어 피격 피해 3 감소 & 적 전체 공격력 -1');
        getLivingSyncedEnemies().forEach(en => { en.tauntedBy = 'comp'; en.atkMod = (en.atkMod || 0) - 1; });
        queueGmEffect({ kind: 'aoe_taunt', tauntedBy: 'comp', atkModDelta: -1, label: '전열의 고함(전체 워리어 도발 & 적 공-1)' });
        document.getElementById('dice-total-display').innerText = '📢 전열의 고함';
        document.getElementById('dice-formula-display').innerText = '전체 도발 · 워리어 피격-3 · 적 전체 공-1';
        playBeep(640, 'triangle', 0.18);
        log(`📢 <b>[전열의 고함]</b> ${getCompName()}이(가) 전장이 떠나가라 포효합니다! 이번 라운드 모든 적의 단일 공격을 자신에게 강제 전환하며, <b>워리어 피격 피해 -3 감소 & 전장의 모든 적 공격 피해량 -1 감소</b>! [쿨 2R]`);
        recordActionBriefing(`▶ ${getCompName()}: [전열의 고함] ➔ 이번R 모든 적 단일 공격 워리어로 강제 전환 & 워리어 피격 -3 감소 & 적 전체 공격 피해량 -1 감소 [쿨 2R]`);
      } else if (sk.id === 'w_4_1') {
        applyTargetStatus('comp', '🏰 불굴의 방파제 (피격-4·반격4)', 'buff', '모든 적 단일 공격 강제 전환 & 워리어 피격 -4 감소 & 라운드 종료 시 피격 횟수당 적 전체 무판정 4 피해');
        getLivingSyncedEnemies().forEach(en => { en.tauntedBy = 'comp'; });
        queueGmEffect({ kind: 'aoe_taunt', tauntedBy: 'comp', label: '불굴의 방파제(전체 워리어 도발)' });
        document.getElementById('dice-total-display').innerText = '🏰 불굴의 방파제';
        document.getElementById('dice-formula-display').innerText = '전체 도발 · 피격-4 · 피격당 적 전체 4 피해';
        playBeep(660, 'triangle', 0.2);
        log(`🏰 <b>[불굴의 방파제]</b> ${getCompName()}이(가) 대검을 땅에 박아 성벽이 됩니다! 이번 라운드 모든 단일 공격 강제 전환 & <b>워리어 피격 피해 -4 감소</b>! 라운드 종료 시 <b>워리어가 직접 피격당한 횟수(피해 0 포함) 1회당 적 전체에게 판정 없이 고정 4 피해</b>를 입힙니다! [쿨 3R]`);
        recordActionBriefing(`▶ ${getCompName()}: [불굴의 방파제] ➔ 모든 단일 공격 유도 & 워리어 피격 -4 감소 & 라운드 종료 시 직접 피격 1회당 적 전체 무판정 고정 4 피해 [쿨 3R]`);
      } else if (sk.id === 'so_1_2') {
        const isEmergency = (opt.mode === 'emergency') && (compHp >= 1);
        const target = opt.target || 'bearer';
        const targetName = (target === 'bearer') ? bearerName : getCompName();
        if (isEmergency) {
          compHp = Math.max(0, compHp - 1);
          hp = Math.min(maxHp, hp + 2);
          document.getElementById('dice-total-display').innerText = '🩸 생명 전이';
          document.getElementById('dice-formula-display').innerText = `${getCompName()} HP-1 ➔ ${bearerName} HP+2`;
          log(`🩸 <b>[생명 흡수진: 생명 전이(긴급)]</b> ${getCompName()}이(가) 자신의 HP 1(자해)을 감수하여 ${bearerName}의 HP를 즉시 <b>+2</b> 회복시켰습니다! (베어러 HP: ${hp}/${maxHp}, 동료 HP: ${compHp}/${compMaxHp})`);
          recordActionBriefing(`▶ ${getCompName()}: [생명 흡수진(긴급 전이)] ➔ ${getCompName()} HP -1 자해 ➔ ${bearerName} HP +2 회복`);
        } else {
          compDealtDirectHitThisRound = true;
          const bTargetEn = getTargetEnemyForActor('comp', opt.enemyUid || lastBearerHitTargetUid || selectedBearerTargetUid);
          lastCompHitTargetUid = bTargetEn ? bTargetEn.uid : null;
          if (bTargetEn) {
            compDirectHitUidsThisRound.add(bTargetEn.uid);
            applyLocalSyncedEnemyDamage(bTargetEn, 1, false);
            queueGmEffect({ kind: 'damage', targetUid: bTargetEn.uid, dmg: 1, ignoreShield: false, label: '생명 흡수진 1 피해' });
          }
          const bTargetName = bTargetEn ? `[🎯${bTargetEn.name}]` : '베어러 공격 대상 적';
          if (target === 'bearer') hp = Math.min(maxHp, hp + 2);
          else compHp = Math.min(compMaxHp, compHp + 2);
          document.getElementById('dice-total-display').innerText = '🔮 생명 흡수';
          document.getElementById('dice-formula-display').innerText = `무판정 ${bTargetName} 1 피해 & ${targetName} HP+2`;
          log(`🔮 <b>[생명 흡수진: 생명 흡수(기본) ➔ ${bTargetName}]</b> ${bTargetName}에게 판정 없이 <b>고정 1 피해</b>를 입히고 ${targetName}의 HP를 <b>+2</b> 회복했습니다!`);
          recordActionBriefing(`▶ ${getCompName()}: [생명 흡수진 ➔ ${bTargetName}] ➔ 무판정 고정 1 피해 & ${targetName} HP +2 회복`);
        }
        playBeep(640, 'triangle', 0.15);
      } else if (sk.id === 'so_1_3') {
        compDealtDirectHitThisRound = true;
        const bTargetEn = getTargetEnemyForActor('comp', opt.enemyUid || lastBearerHitTargetUid || selectedBearerTargetUid);
        lastCompHitTargetUid = bTargetEn ? bTargetEn.uid : null;
        if (bTargetEn) {
          compDirectHitUidsThisRound.add(bTargetEn.uid);
          applyLocalSyncedEnemyDamage(bTargetEn, 5, false);
          queueGmEffect({ kind: 'damage', targetUid: bTargetEn.uid, dmg: 5, ignoreShield: false, label: '마력 흡수진 5 피해' });
        }
        const bTargetName = bTargetEn ? `[🎯${bTargetEn.name}]` : '베어러 공격 대상 적';
        heat = Math.max(0, heat - 10);
        applyTargetStatus('bearer', '🔮 마력 순환', 'buff', '다음 1회 직접 공격 적중 시 +3 피해 추가');
        document.getElementById('dice-total-display').innerText = '🔮 마력 흡수';
        document.getElementById('dice-formula-display').innerText = `무판정 ${bTargetName} 5 피해 · 과열 -10 · 차공격 +3`;
        playBeep(660, 'triangle', 0.18);
        log(`🔮 <b>[마력 흡수진 ➔ ${bTargetName}]</b> ${bTargetName}에게 판정 없이 <b>고정 5 피해</b>를 입히고, 베어러 과열 <b>-10</b> 냉각 + 베어러 다음 공격 <b>+3</b> 버프 부여! [쿨 4R]`);
        recordActionBriefing(`▶ ${getCompName()}: [마력 흡수진 ➔ ${bTargetName}] ➔ 무판정 고정 5 피해 & 베어러 과열 -10 냉각 & 베어러 다음 공격 +3 [쿨 4R]`);
      } else if (sk.id === 'so_2_1') {
        const target = opt.target || 'bearer';
        const isSac = Boolean(opt.sacrifice && compHp >= 2);
        const tName = (target === 'bearer') ? bearerName : getCompName();
        if (isSac) {
          compHp = Math.max(1, compHp - 1);
        }
        const healAmt = isSac ? 3 : 2;
        const shieldAmt = isSac ? 3 : 2;
        if (target === 'bearer') hp = Math.min(maxHp, hp + healAmt);
        else compHp = Math.min(compMaxHp, compHp + healAmt);
        grantShield(target, shieldAmt, '피의 서약');
        document.getElementById('dice-total-display').innerText = `🩸 피의 서약`;
        document.getElementById('dice-formula-display').innerText = `${tName} HP+${healAmt} & 방어막 ${shieldAmt}`;
        playBeep(580, 'sine', 0.15);
        log(`🩸 <b>[피의 서약${isSac ? ' (자해 강화)' : ''}]</b> ${isSac ? `${getCompName()} 실제 HP 1 소모 ➔ ` : ''}${tName}의 HP를 <b>+${healAmt}</b> 회복하고 <b>[방어막 ${shieldAmt}]</b>을 부여했습니다!`);
        recordActionBriefing(`▶ ${getCompName()}: [피의 서약${isSac ? '(자해 강화)' : ''}] ➔ ${tName} HP +${healAmt} 회복 & [방어막 ${shieldAmt}] 부여`);
      } else if (sk.id === 'so_3_1') {
        hp = Math.min(maxHp, hp + 3);
        compHp = Math.min(compMaxHp, compHp + 3);
        const removedDebuffs = bearerStatuses.filter(s => s.type === 'debuff');
        bearerStatuses = bearerStatuses.filter(s => s.type !== 'debuff');
        renderStatuses();
        let backlashStr = '';
        if (removedDebuffs.length > 0) {
          compDealtDirectHitThisRound = true;
          const bTargetEn = getTargetEnemyForActor('comp', opt.enemyUid);
          if (bTargetEn) {
            compDirectHitUidsThisRound.add(bTargetEn.uid);
            applyLocalSyncedEnemyDamage(bTargetEn, 4, false);
            applyLocalEnemyWeak(bTargetEn, 1);
            queueGmEffect({ kind: 'damage', targetUid: bTargetEn.uid, dmg: 4, ignoreShield: false, label: '순환의 정화술 역류 4 피해' });
            queueGmEffect({ kind: 'status', targetUid: bTargetEn.uid, addWeakCharges: 1, label: '순환의 정화술 [방어 약화]' });
          } else {
            enemyVuln = true;
            enemyVulnCharges = hasBearerPassive('강경 속박') ? 2 : 1;
            updateEnemyVulnUI();
          }
          backlashStr = ` + 상태이상(${removedDebuffs.length}개) 정화 역류로 <b>${bTargetEn ? `[🎯${bTargetEn.name}]` : '적 1체'}에게 판정 없이 고정 4 피해 & [방어 약화] 부여</b>!`;
        }
        document.getElementById('dice-total-display').innerText = '✨ 순환의 정화술';
        document.getElementById('dice-formula-display').innerText = `아군 전체 HP+3 & 베어러 정화${removedDebuffs.length > 0 ? ' (적 4피해·방약)' : ''}`;
        playBeep(680, 'triangle', 0.18);
        log(`✨ <b>[순환의 정화술]</b> 아군 전체 HP를 각각 <b>+3</b> 회복하고 베어러의 모든 상태이상을 정화했습니다!${backlashStr} [쿨 2R]`);
        recordActionBriefing(`▶ ${getCompName()}: [순환의 정화술] ➔ 아군 전체 HP +3 회복 & 베어러 모든 상태이상 정화${removedDebuffs.length > 0 ? ' ➔ 적 1체 무판정 고정 4 피해 & [방어 약화] 부여' : ''} [쿨 2R]`);
      } else if (sk.id === 'so_3_2') {
        if (opt.resonanceMode === 'vent') {
          compDealtDirectHitThisRound = true;
          const bTargetEn = getTargetEnemyForActor('comp', opt.enemyUid);
          if (bTargetEn) {
            compDirectHitUidsThisRound.add(bTargetEn.uid);
            applyLocalSyncedEnemyDamage(bTargetEn, 3, false);
            queueGmEffect({ kind: 'damage', targetUid: bTargetEn.uid, dmg: 3, ignoreShield: false, label: '열기 공명진(환기) 3 피해' });
          }
          const prevH = heat;
          heat = Math.max(0, heat - 20);
          document.getElementById('dice-total-display').innerText = '❄️ 공명 환기';
          document.getElementById('dice-formula-display').innerText = `무판정 적 3 피해 & 베어러 과열 -20 냉각`;
          playBeep(620, 'sine', 0.18);
          log(`❄️ <b>[열기 공명진: 공명 환기]</b> 적 1체에게 판정 없이 <b>고정 3 피해</b>를 입히고, 베어러의 과열을 즉시 <b>-20 냉각(${prevH}➔${heat})</b>했습니다! [쿨 4R]`);
          recordActionBriefing(`▶ ${getCompName()}: [열기 공명진(공명 환기)] ➔ 적 1체 무판정 고정 3 피해 & 베어러 과열 -20 냉각(현재 ${heat}/100) [쿨 4R]`);
        } else {
          const isHigh = (heat >= 70);
          const dmgBoost = isHigh ? 5 : 3;
          applyTargetStatus('bearer', `🔥 공명 증폭 (+${dmgBoost} 피해)`, 'buff', `[열기 공명진] 이번 라운드 베어러의 모든 직접 타격 피해량 고정 +${dmgBoost} 증가`);
          document.getElementById('dice-total-display').innerText = `🔥 공명 증폭 +${dmgBoost}`;
          document.getElementById('dice-formula-display').innerText = `이번R 베어러 직접 타격 피해 +${dmgBoost}`;
          playBeep(680, 'triangle', 0.18);
          log(`🔥 <b>[열기 공명진: 공명 증폭]</b> 이번 라운드 동안 베어러가 가하는 모든 직접 타격 피해량이 <b>고정 +${dmgBoost}</b> 증가합니다! [쿨 4R]`);
          recordActionBriefing(`▶ ${getCompName()}: [열기 공명진(공명 증폭)] ➔ 이번R 베어러 모든 직접 타격 피해량 +${dmgBoost} 증가 [쿨 4R]`);
        }
      } else if (sk.id === 'so_4_1') {
        compDealtDirectHitThisRound = true;
        const bTargetEn = getTargetEnemyForActor('comp', opt.enemyUid);
        if (bTargetEn) {
          compDirectHitUidsThisRound.add(bTargetEn.uid);
          applyLocalSyncedEnemyDamage(bTargetEn, 5, false);
          queueGmEffect({ kind: 'damage', targetUid: bTargetEn.uid, dmg: 5, ignoreShield: false, label: '생사 역전 5 피해' });
        }
        const wasHalfOrLess = (hp * 2 <= maxHp);
        hp = Math.min(maxHp, hp + 6);
        compHp = Math.min(compMaxHp, compHp + 6);
        let extraCrisis = '';
        if (wasHalfOrLess) {
          const prevH = heat;
          heat = Math.max(0, heat - 30);
          applyTargetStatus('bearer', '☯️ 생사 역전 (피격 -3)', 'buff', '[생사 역전] 이번 라운드 베어러가 받는 모든 피격 피해 3 경감');
          extraCrisis = ` + 시전 시점 베어러 반피 이하 보정으로 <b>과열 -30 냉각(${prevH}➔${heat}) & 이번 라운드 베어러 피격 피해 -3 경감</b>!`;
        }
        document.getElementById('dice-total-display').innerText = '☯️ 생사 역전';
        document.getElementById('dice-formula-display').innerText = `적 5 피해 & 아군 전체 HP +6${wasHalfOrLess ? ' & 과열-30·피격-3' : ''}`;
        playBeep(740, 'sine', 0.22);
        log(`☯️ <b>[생사 역전: 인과율 개입]</b> 단일 적 1체에게 판정 없이 <b>고정 5 피해</b>를 입히고, 아군 전체의 HP를 각각 <b>+6</b> 회복했습니다!${extraCrisis} [쿨 4R]`);
        recordActionBriefing(`▶ ${getCompName()}: [생사 역전: 인과율 개입] ➔ 단일 적 무판정 고정 5 피해 & 아군 전체 HP +6 회복${wasHalfOrLess ? ' & 베어러 과열 -30 냉각 & 이번R 베어러 피격 -3 경감' : ''} [쿨 4R]`);
      } else if (sk.id === 'ms_1_2') {
        senCharge = Math.max(0, senCharge - 1);
        senCondenseActive = true;
        grantShield('comp', 3, '마탄 응축');
        document.getElementById('dice-total-display').innerText = '🛡️ 마탄 응축';
        document.getElementById('dice-formula-display').innerText = `차징 1 소모 ➔ 방어막 3 (종료시 잔여 방어막 해제 후 1스택 회수)`;
        playBeep(580, 'triangle', 0.15);
        log(`🔮 <b>[마탄 응축]</b> 마탄 차징 1스택을 소모하여 ${getCompName()}에게 <b>[방어막 3]</b>을 부여했습니다! (라운드 종료 시 잔여 방어막이 1 이상 남으면 방어막을 해제하고 1스택 재회수)`);
        recordActionBriefing(`▶ ${getCompName()}: [마탄 응축] ➔ 차징 1스택 소모(잔여 ${senCharge}/3) ➔ 동료 [방어막 3] 획득 (종료 시 잔여 방어막 1+ 남으면 해제 후 1스택 회수)`);
      } else if (sk.id === 'ms_2_2') {
        applyTargetStatus('comp', '⚡ 역장 패링 (회피반격2·차징+1)', 'buff', '이번 라운드 마검사를 노린 적 공격 회피 시 즉시 해당 적에게 무판정 2 피해 & 차징 +1스택 획득');
        document.getElementById('dice-total-display').innerText = '⚡ 역장 패링';
        document.getElementById('dice-formula-display').innerText = '회피 시 적에게 무판정 2 피해 & 차징 +1';
        playBeep(600, 'triangle', 0.15);
        log(`⚡ <b>[역장 패링]</b> 검에 역장을 둘러 적의 공격을 흘려낼 준비를 마쳤습니다! 이번 라운드 마검사를 노린 적의 공격을 회피하면 즉시 <b>해당 적에게 판정 없이 고정 2 피해 & [차징 1스택] 획득</b>!`);
        recordActionBriefing(`▶ ${getCompName()}: [역장 패링] ➔ 이번R 마검사 향한 적 공격 회피 시 해당 적에게 무판정 고정 2 피해 & 차징 +1스택 획득`);
      } else if (sk.id === 'ms_4_2') {
        compDealtDirectHitThisRound = true;
        getLivingSyncedEnemies().forEach(en => {
          compDirectHitUidsThisRound.add(en.uid);
          applyLocalSyncedEnemyDamage(en, 3, false);
        });
        queueGmEffect({ kind: 'aoe_damage', dmg: 3, ignoreShield: false, label: '무영의 검무(적 전체 3 피해)' });
        senCharge = Math.min(3, senCharge + 1);
        senBonusActionReady = true;
        applyTargetStatus('comp', '⚡ 무영의 검무 (피격 -3)', 'buff', '이번 라운드 마검사가 받는 모든 피격 피해 3 경감');
        document.getElementById('dice-total-display').innerText = '⚡ 무영의 검무';
        document.getElementById('dice-formula-display').innerText = '차징+1 · 적 전체 3피해 · 피격-3 · 추가 행동 1회!';
        playBeep(760, 'triangle', 0.22);
        log(`⚡ <b>[무영의 검무: 왕실 비전]</b> 시전 즉시 <b>[차징 +1스택](현재: ${senCharge}/3)</b>을 획득하고, 검풍과 마탄 파편으로 <b>적 전체에게 판정 없이 고정 3 피해</b>를 입혔습니다! 이번 라운드 마검사 피격 -3 경감 및 <b>즉시 추가 행동 1회 획득(동료 스킬 버튼을 한 번 더 클릭하세요)!</b> [쿨 5R]`);
        recordActionBriefing(`▶ ${getCompName()}: [무영의 검무: 왕실 비전] ➔ 차징 +1스택(${senCharge}/3) & 적 전체 무판정 고정 3 피해 & 마검사 피격 -3 경감 & 추가 행동 1회 개방 [쿨 5R]`);
      } else if (sk.id === 'r_3_1') {
        getLivingSyncedEnemies().forEach(en => extendLocalEnemyDots(en, 1));
        queueGmEffect({ kind: 'aoe_extend_dots', addTurns: 1, label: '진혼의 약초 연무(적 전체 DoT +1R 연장)' });
        const coolAmt = (heat >= 70) ? 20 : 10;
        const prevH = heat;
        heat = Math.max(0, heat - coolAmt);
        applyTargetStatus('bearer', '🌿 약초 연무 (피격 -2)', 'buff', '[진혼의 약초 연무] 이번 라운드 받는 모든 피격 피해 2 경감');
        applyTargetStatus('comp', '🌿 약초 연무 (피격 -2)', 'buff', '[진혼의 약초 연무] 이번 라운드 받는 모든 피격 피해 2 경감');
        document.getElementById('dice-total-display').innerText = `🌿 약초 연무`;
        document.getElementById('dice-formula-display').innerText = `과열 -${coolAmt} 냉각 · 아군 피격-2 · 적 지속피해 +1R`;
        playBeep(620, 'sine', 0.18);
        log(`🌿 <b>[진혼의 약초 연무]</b> 차가운 약초 연무로 베어러의 과열을 즉시 <b>-${coolAmt} 냉각(${prevH}➔${heat})</b>하고, 이번 라운드 <b>아군 전체 피격 피해 -2 경감</b>! 동시에 전장의 적들에게 걸려 있는 <b>모든 [지속 피해]의 남은 지속 시간을 일괄 +1라운드 연장</b>합니다! [쿨 4R]`);
        recordActionBriefing(`▶ ${getCompName()}: [진혼의 약초 연무] ➔ 베어러 과열 -${coolAmt} 냉각(현재 ${heat}/100) & 이번R 아군 전체 피격 -2 경감 & 전장 모든 적 [지속 피해] 잔여 시간 +1R 연장 [쿨 4R]`);
      }
      refreshUI();
      saveSessionState();
      if (cb) cb();
      return;
    }

    // 3. 공격 판정 스킬 처리 (적 데이터 기반 조건부 효과 실시간 자동 감지!)
    const livingEnemiesNow = getLivingSyncedEnemies();
    const isSingleEnemyOnField = (livingEnemiesNow.length === 1);
    let isDedroCombo = (pickedComp === '데드로' && sk.id === 'w_1_1' && dedroComboReady === curRound - 1);
    let baseDmg = isDedroCombo ? 7 : sk.dmg;
    let isSkillAoe = Boolean(sk.isAoe);
    if (sk.id === 'so_2_2' || sk.id === 'r_2_1') {
      const useSingle = (opt.singleEnemy !== undefined) ? opt.singleEnemy : isSingleEnemyOnField;
      isSkillAoe = !useSingle;
    }
    const preCompTarget = !isSkillAoe ? getTargetEnemyForActor('comp', opt.enemyUid) : null;
    let senUsedStacks = 0;
    let extraNotes = [];
    let forceAdvFromSkill = false;

    if (sk.id === 'w_1_2' && preCompTarget) {
      if (preCompTarget.targetsBearer || preCompTarget.isAoeIntent) {
        forceAdvFromSkill = true;
        extraNotes.push(`${preCompTarget.name}(베어러 위협) 감지 ➔ 명중 [유리함] 자동 적용`);
      }
    } else if (sk.id === 'w_2_2') {
      const isTargetingComp = (opt.bonusHit !== undefined)
        ? opt.bonusHit
        : Boolean(preCompTarget && (preCompTarget.targetsComp || preCompTarget.isAoeIntent));
      if (isTargetingComp) {
        baseDmg = 6;
        extraNotes.push('워리어 포함 인텐트 감지(6 피해)');
      }
    } else if (sk.id === 'w_3_1') {
      applyTargetStatus('comp', '🗡️ 복수의 칼날 (피격-2·반격3)', 'buff', '이번R 워리어 피격 -2 감소 & 라운드 종료 시 워리어 공격 시도한 모든 적에게 무판정 3 피해');
      extraNotes.push('복수의 칼날: 이번R 워리어 피격 피해 -2 감소 & 종료 시 반격 3');
    } else if (sk.id === 'w_3_2') {
      const prevH = heat;
      heat = Math.max(0, heat - 10);
      extraNotes.push(`시전 즉시 베어러 과열 -10 냉각(${prevH}➔${heat})`);
    } else if (sk.id === 'w_4_2') {
      if (opt.condAdv || (compHp * 2 <= compMaxHp) || enemyVuln || (preCompTarget && preCompTarget.status && preCompTarget.status.weak)) {
        forceAdvFromSkill = true;
      }
    } else if (sk.id === 'so_2_2') {
      if (!isSkillAoe) {
        baseDmg = 3;
        extraNotes.push('대상 이번R 공격력 -3 감소');
      } else {
        baseDmg = 1;
        extraNotes.push('적 전체 이번R 공격력 -1 감소');
      }
    } else if (sk.id === 'so_4_2') {
      if (opt.burnPyrite && pyrite >= 1) {
        pyrite -= 1;
        forceAdvFromSkill = true;
        extraNotes.push(`장미 휘석 1개 연소(잔여 ${pyrite}개)`);
        extraNotes.push('적 전체 이번R 공격력 -3 감소');
      }
    } else if (sk.id === 'ms_1_1') {
      const useSingle = (opt.singleEnemy !== undefined) ? opt.singleEnemy : isSingleEnemyOnField;
      if (useSingle) {
        baseDmg = 4;
      }
    } else if (sk.id === 'ms_2_1' && preCompTarget) {
      const hasAnyDebuff = Boolean(preCompTarget.status && (preCompTarget.status.weak || preCompTarget.status.bindTurns > 0 || (preCompTarget.status.dots && preCompTarget.status.dots.length > 0)));
      const isBlindSpot = (!preCompTarget.targetsComp && !preCompTarget.isAoeIntent);
      if (isBlindSpot || hasAnyDebuff) {
        forceAdvFromSkill = true;
        extraNotes.push(`${isBlindSpot ? '사각 포착' : '상태이상 적'} 감지 ➔ 명중 [유리함] 자동 적용`);
      }
    } else if (sk.id === 'ms_1_3') {
      senUsedStacks = Math.max(1, senCharge);
      baseDmg = ({ 1: 7, 2: 13, 3: 20 }[senUsedStacks] || 7);
      extraNotes.push(`마탄 ${senUsedStacks}스택 방출`);
    } else if (sk.id === 'ms_3_1') {
      senUsedStacks = senCharge;
      baseDmg = 4 + (senUsedStacks * 3);
      extraNotes.push(`마탄 ${senUsedStacks}스택 산탄(광역 ${baseDmg} 피해)`);
    } else if (sk.id === 'ms_3_2') {
      const wasHighHeat = (heat >= 70);
      const coolAmt = wasHighHeat ? 20 : 10;
      const prevH = heat;
      heat = Math.max(0, heat - coolAmt);
      senCharge = Math.min(3, senCharge + 1);
      extraNotes.push(`시전 즉시 베어러 과열 -${coolAmt} 냉각(${prevH}➔${heat})`);
      extraNotes.push(`마탄 차징 +1스택(현재 ${senCharge}/3)`);
      if (wasHighHeat) {
        forceAdvFromSkill = true;
      }
    } else if (sk.id === 'ms_4_1') {
      senUsedStacks = senCharge;
      baseDmg = ({ 0: 8, 1: 12, 2: 18, 3: 25 }[senUsedStacks] || 8);
      extraNotes.push(`마탄 ${senUsedStacks}스택 압축(${baseDmg} 피해)`);
      if (senUsedStacks >= 2) extraNotes.push('방어막 무시');
    } else if (sk.id === 'r_1_1' && preCompTarget) {
      const noDots = !preCompTarget.status || !Array.isArray(preCompTarget.status.dots) || preCompTarget.status.dots.length === 0;
      if (noDots) {
        forceAdvFromSkill = true;
        extraNotes.push('지속 피해 미보유 적 감지 ➔ 명중 [유리함] 자동 적용');
      }
    } else if (sk.id === 'r_1_3' && preCompTarget) {
      if (preCompTarget.isAoeIntent || preCompTarget.isChargeIntent) {
        forceAdvFromSkill = true;
        extraNotes.push('광역/충전 인텐트 감지 ➔ 명중 [유리함] 자동 적용');
      }
    } else if (sk.id === 'r_2_1') {
      if (!isSkillAoe) {
        baseDmg = 4;
        extraNotes.push('대상 [지속 피해: 3] 2R 부여');
      } else {
        baseDmg = 3;
        extraNotes.push('적 전체 [지속 피해: 2] 2R 부여');
      }
    } else if (sk.id === 'r_4_1' && preCompTarget) {
      const curDotSum = (preCompTarget.status && Array.isArray(preCompTarget.status.dots))
        ? preCompTarget.status.dots.reduce((s, d) => s + d.dmg, 0)
        : 0;
      if (curDotSum > 0) {
        forceAdvFromSkill = true;
        opt.condAdv = true;
        opt.dotSum = curDotSum;
        extraNotes.push(`대상 지속피해 합(${curDotSum}) 감지 ➔ 명중 [유리함] 자동 적용`);
      }
    }

    let compAdvBuff = compStatuses.find(s => s.name.includes('유리함') || s.name.includes('비추는 불꽃'));
    let overloadBuff = compStatuses.find(s => s.name.includes('과부하 조광'));
    let springboardBuff = compStatuses.find(s => s.name === '🛡️ 스프링보드');
    let burnCommBuff = compStatuses.find(s => s.name === '🔥 태우는 불꽃 (+3 피해)');

    let compExtraBuffDmg = 0;
    let compExtraTags = [];
    if (overloadBuff) { compExtraBuffDmg += 3; compExtraTags.push('성염 기폭 +3'); }
    if (springboardBuff) { compExtraBuffDmg += 3; compExtraTags.push('스프링보드 +3'); }
    if (burnCommBuff) { compExtraBuffDmg += 3; compExtraTags.push('태우는 불꽃 +3'); }
    if (blazingBladeActive || compStatuses.some(s => s.name.includes('타오르는 칼날'))) {
      compExtraBuffDmg += 6;
      compExtraTags.push('타오르는 칼날 +6');
    }

    let d1 = Math.floor(Math.random() * 20) + 1;
    let d2 = Math.floor(Math.random() * 20) + 1;
    let isAdv = (diceMode === 'adv') || Boolean(sk.alwaysAdv) || Boolean(opt.condAdv) || forceAdvFromSkill || isDedroCombo || Boolean(compAdvBuff);
    let isDis = (diceMode === 'dis');
    if (isAdv && isDis) { isAdv = false; isDis = false; }

    let raw = isAdv ? Math.max(d1, d2) : (isDis ? Math.min(d1, d2) : d1);
    let formulaStr = `1d20(${d1})`;
    if (isAdv) {
      const advReason = isDedroCombo ? ' [쿨기술 연계]' : (sk.alwaysAdv ? ' [상시 유리]' : ((opt.condAdv || forceAdvFromSkill) ? ' [조건부 유리]' : (compAdvBuff ? ` [${compAdvBuff.name}]` : '')));
      formulaStr = `2d20 High (${d1}, ${d2}) ➔ ${raw}${advReason}`;
      if (compAdvBuff) {
        compStatuses = compStatuses.filter(s => s.id !== compAdvBuff.id);
        renderStatuses();
      }
    } else if (isDis) {
      formulaStr = `2d20 Low (${d1}, ${d2}) ➔ ${raw}`;
    }

    if (diceMode !== 'auto') {
      diceMode = 'auto';
      updateDiceModeUI();
    }

    let total = raw + 2;
    let isCrit = (raw === 20) || (sk.id === 'ms_4_1' && raw >= 18);

    animateDiceAdvanced(raw, 2, '동료 판정', formulaStr, () => {
      if (senUsedStacks > 0 || sk.id === 'ms_1_3' || sk.id === 'ms_3_1' || sk.id === 'ms_4_1') {
        senCharge = 0;
        refreshUI();
      }
      compAttackRollUsedThisRound = true;
      const targetEnemyObj = !isSkillAoe ? getTargetEnemyForActor('comp', opt.enemyUid) : null;
      const livingEnemiesList = getLivingSyncedEnemies();
      lastCompHitTargetUid = targetEnemyObj ? targetEnemyObj.uid : (isSkillAoe && livingEnemiesList.length > 0 ? 'AOE_ALL' : null);

      const isSingleMiss = (raw === 1) || Boolean(targetEnemyObj && !isCrit && total < targetEnemyObj.ac);
      const cdStr = sk.cd > 0 ? ` [쿨 ${sk.cd}R]` : '';

      if (isSingleMiss) {
        if (sk.id === 'w_1_1' && isDedroCombo) dedroComboReady = -999;
        const noteStr = extraNotes.length > 0 ? ' ' + extraNotes.map(n => `<span style="color:#d8b4fe;">(${n})</span>`).join(' ') : '';
        const tNameStr = targetEnemyObj ? ` ➔ <span style="color:#fde68a; font-weight:800;">[🎯${targetEnemyObj.name} (AC ${targetEnemyObj.ac})]</span>` : '';
        const tPlainStr = targetEnemyObj ? ` ➔ 🎯${targetEnemyObj.name}(AC ${targetEnemyObj.ac})` : '';
        log(`💨 <b>[동료 공격]</b> ${getCompName()}의 [${sk.name}]${tNameStr} ➔ ${formulaStr} + 2 = <span style="color:#cbd5e1; font-weight:800;">${total}${targetEnemyObj ? ` &lt; AC ${targetEnemyObj.ac}` : ' (자연 1)'}</span> ➔ <span class="log-miss-token" style="color:#94a3b8; font-weight:700;">피해 0 (빗나감)</span>${noteStr}${cdStr}`);
        recordActionBriefing(`▶ ${getCompName()}: [${sk.name}${tPlainStr}] ➔ ${formulaStr} + 2 = ${total} [빗나감: 피해 0]${cdStr}`);
        refreshUI();
        saveSessionState();
        if (cb) cb();
        return;
      }

      compDealtDirectHitThisRound = true;
      let vulnUsed = false;
      let vulnDmg = 0;
      if (targetEnemyObj && targetEnemyObj.status && targetEnemyObj.status.weak) {
        vulnDmg = 3;
        vulnUsed = true;
        consumeLocalEnemyWeak(targetEnemyObj);
      } else if (!targetEnemyObj && enemyVuln) {
        vulnDmg = 3;
        vulnUsed = true;
        if (enemyVulnCharges > 1) enemyVulnCharges--;
        else { enemyVuln = false; enemyVulnCharges = 0; }
        updateEnemyVulnUI();
      }

      let estDmg = baseDmg + bonusDmg + compExtraBuffDmg + (isCrit ? 5 : 0) + vulnDmg;
      const ignoreShieldComp = Boolean(sk.id === 'ms_4_1' && senUsedStacks >= 2);

      // 적 개체별 실제 피해를 먼저 큐에 넣은 뒤, 적중 후속 상태이상([방어 약화] 등)을 부여하여 동일 타격에서 방어약화가 소모되지 않도록 보장
      let perCompOutcomeHtml = '';
      let perCompOutcomePlain = '';
      let anyCompHitInAoe = false;
      if (targetEnemyObj) {
        compRollHitUidsThisRound.add(targetEnemyObj.uid);
        compDirectHitUidsThisRound.add(targetEnemyObj.uid);
        const dRes = applyLocalSyncedEnemyDamage(targetEnemyObj, estDmg, ignoreShieldComp);
        queueGmEffect({ kind: 'damage', targetUid: targetEnemyObj.uid, dmg: estDmg, ignoreShield: ignoreShieldComp, consumedWeak: vulnUsed, label: sk.name });

        if (sk.id === 'r_1_1') {
          if (dRes.killed) {
            livingEnemiesList.forEach(en => { en.atkMod = (en.atkMod || 0) - 1; });
            queueGmEffect({ kind: 'aoe_debuff', atkModDelta: -1, label: '사신의 낫질 처치 유독가스(적 전체 공-1)' });
          } else {
            addLocalEnemyDot(targetEnemyObj, 2, 2);
            queueGmEffect({ kind: 'dot', targetUid: targetEnemyObj.uid, dotDmg: 2, dotTurns: 2, label: '사신의 낫질 DoT 2' });
          }
        } else if (sk.id === 'r_2_1' && !isSkillAoe) {
          addLocalEnemyDot(targetEnemyObj, 3, 2);
          queueGmEffect({ kind: 'dot', targetUid: targetEnemyObj.uid, dotDmg: 3, dotTurns: 2, label: '독무의 낫질(단독) DoT 3' });
        } else if (sk.id === 'r_4_1' && opt.condAdv && (opt.dotSum || 0) > 0) {
          const bonusTrueDmg = (opt.dotSum || 0) * 2;
          applyLocalSyncedEnemyDamage(targetEnemyObj, bonusTrueDmg, true);
          queueGmEffect({ kind: 'damage', targetUid: targetEnemyObj.uid, dmg: bonusTrueDmg, ignoreShield: true, label: `절명의 수확 추가피해(${bonusTrueDmg})` });
        } else if (sk.id === 'ms_1_1' && livingEnemiesList.length > 1) {
          livingEnemiesList.forEach(otherEn => {
            if (otherEn.uid !== targetEnemyObj.uid && otherEn.hp > 0) {
              compDirectHitUidsThisRound.add(otherEn.uid);
              applyLocalSyncedEnemyDamage(otherEn, 1, false);
              queueGmEffect({ kind: 'damage', targetUid: otherEn.uid, dmg: 1, ignoreShield: false, label: '섬광 찌르기 파편 1' });
            }
          });
        } else if (sk.id === 'ms_4_1' && livingEnemiesList.length > 1) {
          livingEnemiesList.forEach(otherEn => {
            if (otherEn.uid !== targetEnemyObj.uid && otherEn.hp > 0) {
              compDirectHitUidsThisRound.add(otherEn.uid);
              applyLocalSyncedEnemyDamage(otherEn, 3, false);
              queueGmEffect({ kind: 'damage', targetUid: otherEn.uid, dmg: 3, ignoreShield: false, label: '극광 일섬 파편 3' });
            }
          });
        }
        perCompOutcomeHtml = ` ➔ <b style="color:#6ee7b7;">[명중! 잔여 HP: ${targetEnemyObj.hp}/${targetEnemyObj.maxHp}${dRes.killed ? ' · 💀처치!' : ''}]</b>`;
        perCompOutcomePlain = ` ➔ [명중! 잔여 HP: ${targetEnemyObj.hp}/${targetEnemyObj.maxHp}${dRes.killed ? ' · 처치!' : ''}]`;
      } else if (isSkillAoe && livingEnemiesList.length > 0) {
        const aoeHtml = [];
        const aoePlain = [];
        anyCompHitInAoe = false;
        livingEnemiesList.forEach(en => {
          const hitThis = isCrit || (total >= en.ac);
          if (hitThis) {
            anyCompHitInAoe = true;
            compRollHitUidsThisRound.add(en.uid);
            compDirectHitUidsThisRound.add(en.uid);
            let enVuln = 0;
            if (en.status && en.status.weak) {
              enVuln = 3;
              consumeLocalEnemyWeak(en);
            }
            const enDmg = baseDmg + bonusDmg + compExtraBuffDmg + (isCrit ? 5 : 0) + enVuln;
            const dRes = applyLocalSyncedEnemyDamage(en, enDmg, false);
            queueGmEffect({ kind: 'damage', targetUid: en.uid, dmg: enDmg, ignoreShield: false, consumedWeak: (enVuln > 0), label: sk.name });
            if (sk.id === 'w_3_2' || sk.id === 'r_4_2') {
              en.forceDis = true;
              queueGmEffect({ kind: 'debuff', targetUid: en.uid, forceDis: true, label: `${sk.name}(적 불리함)` });
            }
            if (sk.id === 'so_2_2') {
              en.atkMod = (en.atkMod || 0) - 1;
              queueGmEffect({ kind: 'debuff', targetUid: en.uid, atkModDelta: -1, label: '광역 파동망(공-1)' });
            }
            if (sk.id === 'so_4_2' || (sk.id === 'ms_3_1' && senUsedStacks >= 2)) {
              applyLocalEnemyWeak(en, 1);
              queueGmEffect({ kind: 'status', targetUid: en.uid, addWeakCharges: 1, atkModDelta: (sk.id === 'so_4_2' && opt.burnPyrite) ? -3 : 0, label: `${sk.name} [방어 약화]` });
            }
            if (sk.id === 'r_2_1') {
              addLocalEnemyDot(en, 2, 2);
              queueGmEffect({ kind: 'dot', targetUid: en.uid, dotDmg: 2, dotTurns: 2, label: '독무의 낫질 DoT 2' });
            }
            if (sk.id === 'r_4_2') {
              addLocalEnemyDot(en, 3, 2);
              queueGmEffect({ kind: 'dot', targetUid: en.uid, dotDmg: 3, dotTurns: 2, label: '사신의 영역 DoT 3' });
            }
            aoeHtml.push(`<span style="color:#6ee7b7;">${en.name}: 명중(-${enDmg} ➔ HP ${en.hp}/${en.maxHp}${dRes.killed ? ' 💀' : ''})</span>`);
            aoePlain.push(`${en.name}: 명중(-${enDmg}➔HP ${en.hp}/${en.maxHp})`);
          } else {
            aoeHtml.push(`<span style="color:#fca5a5;">${en.name}: 빗나감(피해0)</span>`);
            aoePlain.push(`${en.name}: 빗나감(피해0)`);
          }
        });
        perCompOutcomeHtml = `<br>🎯 <b>[개체별 판정]</b> ${aoeHtml.join(' | ')}`;
        perCompOutcomePlain = ` [판정: ${aoePlain.join(', ')}]`;
      }

      // 적중 후속 효과 처리 (룰북 v2.24 원문 기준 — 피해 정산 직후 상태이상/디버프 부여)
      if (sk.id === 'w_1_1' && isDedroCombo) {
        dedroComboReady = -999;
        extraNotes.push('대상 이번R 공격 [불리함] 강제');
        if (targetEnemyObj) {
          targetEnemyObj.forceDis = true;
          queueGmEffect({ kind: 'debuff', targetUid: targetEnemyObj.uid, forceDis: true, label: '승룡 올려베기(적 불리함)' });
        }
      } else if (sk.id === 'w_1_2') {
        applyTargetStatus('comp', '🛡️ 육탄 엄호', 'buff', '이번 라운드 피격 3 경감, [행동 제약] 면역 & 단일 공격 워리어로 강제 전환');
        extraNotes.push('육탄 엄호: 이번R 워리어 피격 피해 -3 경감 & 행동제약 면역');
        if (targetEnemyObj) {
          targetEnemyObj.tauntedBy = 'comp';
          extraNotes.push('대상 단일 공격 워리어로 도발 유도');
          queueGmEffect({ kind: 'taunt', targetUid: targetEnemyObj.uid, tauntedBy: 'comp', label: '투지 발휘(워리어 도발)' });
        }
      } else if (sk.id === 'w_2_2') {
        if (targetEnemyObj) {
          applyLocalEnemyWeak(targetEnemyObj, 1);
          queueGmEffect({ kind: 'status', targetUid: targetEnemyObj.uid, addWeakCharges: 1, label: '파쇄의 갑옷치기 [방어 약화]' });
        } else {
          enemyVuln = true;
          enemyVulnCharges = 1;
          updateEnemyVulnUI();
        }
        extraNotes.push('대상 [방어 약화(+3)] 부여');
      } else if (sk.id === 'w_3_2') {
        extraNotes.push('적중한 모든 대상 이번R 공격 명중 판정 [불리함] 강제');
      } else if (sk.id === 'w_4_2' && (opt.condAdv || forceAdvFromSkill)) {
        if (targetEnemyObj) {
          applyLocalEnemyBind(targetEnemyObj, 1);
          queueGmEffect({ kind: 'status', targetUid: targetEnemyObj.uid, addBindTurns: 1, label: '거신 단두대 [행동 제약]' });
        }
        extraNotes.push('대상 이번R [행동 제약] 부여');
      } else if (sk.id === 'so_1_1') {
        extraNotes.push('대상 다음 1회 공격 피해량 -2 경감');
        if (targetEnemyObj) {
          targetEnemyObj.atkMod = (targetEnemyObj.atkMod || 0) - 2;
          queueGmEffect({ kind: 'debuff', targetUid: targetEnemyObj.uid, atkModDelta: -2, label: '마력 파동(공-2)' });
        }
      } else if (sk.id === 'so_4_2') {
        extraNotes.push('적중한 모든 대상 [방어 약화(+3)] 부여');
      } else if (sk.id === 'ms_1_3' && senUsedStacks === 3) {
        applyTargetStatus('bearer', '⚡ 마탄의 잔향', 'buff', '다음 1회 직접 공격 적중 시 +4 피해 추가');
        extraNotes.push('3스택 적중: 베어러 다음 공격 +4');
      } else if (sk.id === 'ms_1_1') {
        senCharge = Math.min(3, senCharge + 1);
        if (livingEnemiesList.length > 1) {
          extraNotes.push('대상 외 다른 모든 적에게 파편 1 피해');
        } else {
          extraNotes.push('단독 적 파편 집중(4 피해)');
        }
        extraNotes.push(`마탄 차징 +1스택(현재 ${senCharge}/3)`);
      } else if (sk.id === 'ms_2_1') {
        senCharge = Math.min(3, senCharge + 1);
        extraNotes.push(`마탄 차징 +1스택(현재 ${senCharge}/3)`);
      } else if (sk.id === 'ms_3_1' && senUsedStacks >= 2) {
        extraNotes.push('2스택+ 소모: 적중한 모든 대상 [방어 약화(+3)] 부여');
      } else if (sk.id === 'ms_3_2' && forceAdvFromSkill) {
        if (targetEnemyObj) {
          applyLocalEnemyBind(targetEnemyObj, 1);
          queueGmEffect({ kind: 'status', targetUid: targetEnemyObj.uid, addBindTurns: 1, label: '열기 절단 [행동 제약]' });
        }
        extraNotes.push('과열70+ 보정: 대상 이번R [행동 제약] 부여');
      } else if (sk.id === 'ms_4_1') {
        if (livingEnemiesList.length > 1) {
          extraNotes.push('대상 외 다른 모든 적에게 무판정 파편 고정 3 피해');
        }
        if (senUsedStacks === 3) {
          applyTargetStatus('bearer', '⚡ 단죄의 잔향 (+5 피해)', 'buff', '[극광 일섬 3스택] 베어러의 다음 1회 직접 공격 피해 +5 추가');
          if (targetEnemyObj) {
            applyLocalEnemyWeak(targetEnemyObj, 1);
            queueGmEffect({ kind: 'status', targetUid: targetEnemyObj.uid, addWeakCharges: 1, label: '극광 일섬 [방어 약화]' });
          } else {
            enemyVuln = true;
            enemyVulnCharges = 1;
            updateEnemyVulnUI();
          }
          extraNotes.push('3스택: 베어러 단죄의 잔향 다음 공격 +5');
          extraNotes.push('대상 [방어 약화(+3)] 부여');
        }
      } else if (sk.id === 'r_1_1') {
        const rKillNote = (targetEnemyObj && targetEnemyObj.hp <= 0) ? ' (처치: 적 전체 공-1)' : '';
        extraNotes.push(`[지속 피해: 2] 2R 부여${rKillNote}`);
      } else if (sk.id === 'r_1_2') {
        if (targetEnemyObj) {
          extendLocalEnemyDots(targetEnemyObj, 1);
          queueGmEffect({ kind: 'extend_dots', targetUid: targetEnemyObj.uid, addTurns: 1, label: '혈맥 절단(DoT +1R)' });
        }
        extraNotes.push('대상 모든 [지속 피해] 지속시간 +1R 연장');
      } else if (sk.id === 'r_1_3') {
        if (targetEnemyObj && targetEnemyObj.status && targetEnemyObj.status.dots && targetEnemyObj.status.dots.length > 0) {
          applyLocalEnemyBind(targetEnemyObj, 1);
          queueGmEffect({ kind: 'status', targetUid: targetEnemyObj.uid, addBindTurns: 1, label: '맹독 주입 [행동 제약]' });
        }
        extraNotes.push('지속 피해 보유 대상에게 이번R [행동 제약] 부여');
      } else if (sk.id === 'r_2_2') {
        let hadDot = false;
        if (targetEnemyObj) {
          hadDot = Boolean(targetEnemyObj.status && targetEnemyObj.status.dots && targetEnemyObj.status.dots.length > 0);
          applyLocalEnemyWeak(targetEnemyObj, 1);
          queueGmEffect({ kind: 'status', targetUid: targetEnemyObj.uid, addWeakCharges: 1, atkModDelta: hadDot ? -2 : 0, label: '수의 재단 [방어 약화]' });
          if (hadDot) targetEnemyObj.atkMod = (targetEnemyObj.atkMod || 0) - 2;
        } else {
          enemyVuln = true;
          enemyVulnCharges = 1;
          updateEnemyVulnUI();
        }
        extraNotes.push('대상 [방어 약화(+3)] 부여');
        if (hadDot) extraNotes.push('지속 피해 보유 적: 이번R 공격력 -2 감소');
      } else if (sk.id === 'r_3_2') {
        if (targetEnemyObj) {
          extendLocalEnemyDots(targetEnemyObj, 1);
          addLocalEnemyDot(targetEnemyObj, 3, 2);
          const clonedDots = (targetEnemyObj.status && Array.isArray(targetEnemyObj.status.dots)) ? targetEnemyObj.status.dots : [];
          livingEnemiesList.forEach(otherEn => {
            if (otherEn.uid !== targetEnemyObj.uid) {
              clonedDots.forEach(cd => addLocalEnemyDot(otherEn, cd.dmg, cd.turns));
            }
          });
          queueGmEffect({ kind: 'plague_spread', targetUid: targetEnemyObj.uid, label: '전염되는 사독(연장+DoT3+전체전염)' });
        }
        extraNotes.push('대상 기존 지속피해 +1R 연장 & [지속 피해: 3] 2R 추가');
        if (livingEnemiesList.length > 1) extraNotes.push('다른 모든 적에게 지속 피해 전염(복제)');
      } else if (sk.id === 'r_4_1') {
        if (opt.condAdv) {
          const bonusTrueDmg = (opt.dotSum || 0) * 2;
          if (targetEnemyObj) {
            applyLocalEnemyWeak(targetEnemyObj, 1);
            applyLocalEnemyBind(targetEnemyObj, 1);
            queueGmEffect({ kind: 'status', targetUid: targetEnemyObj.uid, addWeakCharges: 1, addBindTurns: 1, label: '절명의 수확 [방약+행동제약]' });
          } else {
            enemyVuln = true;
            enemyVulnCharges = 1;
            updateEnemyVulnUI();
          }
          extraNotes.push('대상 [방어 약화] & [행동 제약] 동시 부여');
          if (bonusTrueDmg > 0) extraNotes.push(`지속피해 비례 방어막 무시 고정 +${bonusTrueDmg} 추가 피해!`);
        }
      } else if (sk.id === 'r_4_2') {
        reaperDomainActiveThisRound = true;
        extraNotes.push('적 전체 [지속 피해: 3] 2R 부여 & 이번R 적 공격 명중 [불리함] 강제');
      }

      const targetTagHtml = targetEnemyObj
        ? ` ➔ <span style="color:#fde68a; font-weight:800;">[🎯${targetEnemyObj.name} (AC ${targetEnemyObj.ac})]</span>`
        : (isSkillAoe && livingEnemiesList.length > 0 ? ` ➔ <span style="color:#fde68a; font-weight:800;">[🎯적 전체 (${livingEnemiesList.length}체)]</span>` : '');
      const targetTagPlain = targetEnemyObj
        ? ` ➔ 🎯${targetEnemyObj.name}(AC ${targetEnemyObj.ac})`
        : (isSkillAoe && livingEnemiesList.length > 0 ? ` ➔ 🎯적 전체(${livingEnemiesList.length}체)` : '');

      const critStr = isCrit ? ` <b style="color:#feb2b2;">[${sk.id === 'ms_4_1' && raw < 20 ? `자연 ${raw} 극광 치명타` : '치명타'} +5!]</b>` : '';
      const vulnStr = vulnUsed ? ' <b style="color:#fde68a;">[방어 약화 +3!]</b>' : '';
      const buffStr = compExtraTags.length > 0 ? ` <b style="color:#a78bfa;">[${compExtraTags.join(', ')}]</b>` : '';
      const noteStr = extraNotes.length > 0 ? ' ' + extraNotes.map(n => `<span style="color:#d8b4fe;">(${n})</span>`).join(' ') : '';

      const compAoeAllMissed = (isSkillAoe && livingEnemiesList.length > 0 && !anyCompHitInAoe);
      const compDmgAndOutcomeHtml = targetEnemyObj
        ? `(<b style="color:#fca5a5;">피해량: ${estDmg}${perCompOutcomePlain}</b>${critStr}${vulnStr}${buffStr})`
        : (compAoeAllMissed
            ? `(<span class="log-miss-token" style="color:#94a3b8; font-weight:800;">광역 빗나감 (피해 0)</span>)${perCompOutcomeHtml}`
            : `(<b style="color:#fca5a5;">광역 피해량: ${estDmg}</b>${critStr}${vulnStr}${buffStr})${perCompOutcomeHtml}`);

      log(`🤝 <b>[동료 공격]</b> ${getCompName()}의 [${sk.name}]${targetTagHtml} ➔ ${formulaStr} + 2 = <span style="color:#f8fafc; font-weight:800;">${total}</span> ${compDmgAndOutcomeHtml}${noteStr}${cdStr}`);

      const cleanCrit = isCrit ? ' [치명타 +5!]' : '';
      const cleanVuln = vulnUsed ? ' [방어 약화 +3!]' : '';
      const cleanBuff = compExtraTags.length > 0 ? ` [${compExtraTags.join(', ')}]` : '';
      const cleanNotes = extraNotes.length > 0 ? ` (${extraNotes.join(', ')})` : '';
      recordActionBriefing(`▶ ${getCompName()}: [${sk.name}${targetTagPlain}] ➔ ${formulaStr} + 2 = ${total} (${compAoeAllMissed ? '광역 빗나감: 피해 0' : `고정 ${estDmg} ${isSkillAoe ? '광역 ' : ''}피해`}${cleanCrit}${cleanVuln}${cleanBuff})${perCompOutcomePlain}${cleanNotes}${cdStr}`);

      refreshUI();
      saveSessionState();
      if (cb) cb();
    });
  }

  function endCombat(fromGm = false) {
    if (isExecuting) return;
    if (!fromGm && typeof isPlayerOnlineConnected === 'function' && isPlayerOnlineConnected()) {
      playBeep(220, 'sawtooth', 0.15);
      log('⚠️ <b>[온라인 연결 중]</b> 마스터와 연결된 상태에서는 마스터 컨트롤러에서 전투를 종료합니다.');
      return;
    }
    clearAllSkillTimers();
    closeAllStatusMenus();
    actionQueue = [];
    lastRoundActionSummary = [];
    curRound = 1;
    combatStarted = false;
    compCds = { A: 0, B: 0, C: 0 };
    compCd = 0;
    senCondenseActive = false;
    senBonusActionReady = false;
    compRevivedThisRound = false;
    dedroComboReady = -999;
    lampOverloadRound = -999;
    mageChargedSpells = [];
    warGodSoulActive = false;
    blazingBladeActive = false;
    communionFlame = 'none';
    communionActiveThisRound = 'none';
    bearerLastAttackMissed = false;
    bearerEvadedLastRound = false;
    bearerDirectDmgThisRound = 0;
    bearerTookHpDmgThisRound = false;
    bearerAttackRollUsedThisRound = false;
    compAttackRollUsedThisRound = false;
    bearerActedThisRound = false;
    compActedThisRound = false;
    bearerDealtDirectHitThisRound = false;
    compDealtDirectHitThisRound = false;
    bearerDodgedAttackThisRound = false;
    bearerHitDamagesThisRound = [];
    bearerTakenDirectDmgSumThisRound = 0;
    warriorTargetedByUidsThisRound.clear();
    warriorDirectHitCountThisRound = 0;
    reaperDomainActiveThisRound = false;
    lastGmRoundEndDotSum = 0;
    enemyVuln = false;
    enemyVulnCharges = 0;
    updateEnemyVulnUI();
    diceMode = 'auto';
    updateDiceModeUI();

    heat = 0;
    shield = 0;
    compShield = 0;
    senCharge = 0;
    slotRunOptions = {};
    compSlotOptions = {};
    incomingGmAttackQueue.length = 0;
    isProcessingGmAttack = false;

    let compRevivedMsg = '';
    if (compHp <= 0) {
      compHp = Math.ceil(compMaxHp / 2);
      compRevivedMsg = `<br>🤝 <b>[동료 의식 회복]</b> 탈진했던 ${getCompName()}이(가) 베어러의 부축을 받아 HP <b>${compHp}</b> (최대 HP의 절반) 상태로 일어났습니다.`;
    }
    
    bearerStatuses = bearerStatuses.filter(s => 
      s.type !== 'buff' && 
      !s.name.includes('행동 제약') &&
      !s.name.includes('꿰뚫린 검') &&
      !s.name.includes('노출된 불빛')
    );
    compStatuses = compStatuses.filter(s => 
      s.type !== 'buff' && 
      !s.name.includes('행동 제약')
    );
    
    renderStatuses();
    renderQueueUI();
    refreshUI();
    demoteOldRoundLogs();
    playBeep(480, 'sine', 0.18);
    shouldDemoteLogsOnNextAction = true;
    log(`❄ <b>[전투 종료]</b> 교전이 종결되었습니다. 룰북 규정에 따라 <b>과열이 자연 냉각(0)</b>되고 <b>방어막 및 모든 전투 전술 버프/교감 불꽃이 소멸</b>했습니다.${compRevivedMsg}`);
    saveSessionState();
  }

  function rollNonCombatDice() {
    demoteOldRoundLogs();
    let d1 = Math.floor(Math.random() * 20) + 1;
    let d2 = Math.floor(Math.random() * 20) + 1;
    let isAdv = (diceMode === 'adv');
    let isDis = (diceMode === 'dis');

    let raw = d1, formulaStr = `1d20(${d1})`;
    let modeText = '일반';
    if (isAdv) {
      raw = Math.max(d1, d2);
      formulaStr = `2d20 High (${d1}, ${d2}) ➔ ${raw}`;
      modeText = '유리함';
    } else if (isDis) {
      raw = Math.min(d1, d2);
      formulaStr = `2d20 Low (${d1}, ${d2}) ➔ ${raw}`;
      modeText = '불리함';
    }

    // 수동 유리/불리 모드 1회 판정 후 자동(auto)으로 즉시 복귀
    if (diceMode !== 'auto') {
      diceMode = 'auto';
      updateDiceModeUI();
      saveSessionState();
    }

    animateDiceAdvanced(raw, 3, `비전투 ${modeText}`, formulaStr, () => {
      log(`🎲 <b>[비전투 판정 (${modeText})]</b> ➔ ${formulaStr} | 특기 부합(+3): <b>${raw + 3}</b> · 일반 행동(+0): <b>${raw}</b> · 동료 단독(+2): <b>${raw + 2}</b>`);
      recordActionBriefing(`▶ [비전투 판정 (${modeText})] ➔ ${formulaStr} | 특기(+3): ${raw + 3} / 일반(+0): ${raw} / 동료 단독(+2): ${raw + 2}`);
      shouldDemoteLogsOnNextAction = true;
    });
  }

  function resetDicePanelVisuals() {
    const panel = DOM.dicePanel || document.getElementById('dice-panel');
    const t = DOM.diceTotal || document.getElementById('dice-total-display');
    const fx = document.getElementById('dice-fx-layer');
    const badge = document.getElementById('dice-tier-badge');
    const emblem = document.getElementById('dice-d20-emblem');
    if (panel) {
      panel.classList.remove(
        'rolling-active',
        'tier-normal', 'tier-high', 'tier-low', 'tier-nat20', 'tier-nat1',
        'shake-normal', 'shake-high', 'shake-low', 'shake-nat20', 'shake-nat1'
      );
    }
    if (t) {
      t.className = 'dice-total';
      t.style.transform = '';
      t.style.filter = '';
    }
    if (fx) fx.innerHTML = '';
    if (badge) {
      badge.className = 'dice-tier-badge';
      badge.innerText = '';
    }
    if (emblem) {
      emblem.style.transform = '';
    }
  }

  function spawnDiceImpactFX(tier, raw) {
    const fx = document.getElementById('dice-fx-layer');
    const badge = document.getElementById('dice-tier-badge');
    const panel = DOM.dicePanel || document.getElementById('dice-panel');
    if (!fx || !panel) return;
    fx.innerHTML = '';

    // 1) 방사형 플래시
    const flash = document.createElement('div');
    flash.className = `dice-impact-flash flash-${tier}`;
    fx.appendChild(flash);

    // 2) 충격파 링 (일반 1개, 고점/저점 2개, 대성공/대실패 3개)
    const ringCount = (tier === 'nat20' || tier === 'nat1') ? 3 : ((tier === 'high' || tier === 'low') ? 2 : 1);
    for (let i = 0; i < ringCount; i++) {
      const ring = document.createElement('div');
      ring.className = `dice-shockwave-ring ring-${tier}`;
      ring.style.animationDelay = `${i * 0.065}s`;
      fx.appendChild(ring);
    }

    // 3) 스파크 / 파편 파티클
    const particleCount = (tier === 'nat20') ? 20 : (tier === 'nat1' ? 16 : (tier === 'high' ? 10 : (tier === 'low' ? 8 : 0)));
    const colors = {
      nat20: ['#fde047', '#facc15', '#f87171', '#38bdf8', '#ffffff'],
      nat1:  ['#ef4444', '#991b1b', '#a855f7', '#450a0a'],
      high:  ['#38bdf8', '#7dd3fc', '#fde047', '#e0f2fe'],
      low:   ['#fb923c', '#ef4444', '#b45309']
    }[tier] || [];

    for (let i = 0; i < particleCount; i++) {
      const p = document.createElement('div');
      p.className = `dice-spark-particle ${(tier === 'nat1' || tier === 'low') ? 'shard' : ''}`;
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() * 0.35 - 0.175);
      const dist = (tier === 'nat20' || tier === 'nat1') ? (48 + Math.random() * 75) : (34 + Math.random() * 48);
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * (dist * 0.62) + (tier === 'nat1' ? 14 : 0);
      p.style.setProperty('--tx', `${tx.toFixed(1)}px`);
      p.style.setProperty('--ty', `${ty.toFixed(1)}px`);
      p.style.setProperty('--rot', `${Math.round(Math.random() * 360 - 180)}deg`);
      p.style.setProperty('--dur', `${(0.42 + Math.random() * 0.25).toFixed(2)}s`);
      const col = colors[i % colors.length];
      p.style.background = col;
      p.style.boxShadow = `0 0 8px ${col}`;
      fx.appendChild(p);
    }

    // 4) 자연 1 전용 파열 크랙 SVG
    if (tier === 'nat1') {
      const crackWrap = document.createElement('div');
      crackWrap.innerHTML = `
        <svg viewBox="0 0 300 90" preserveAspectRatio="none" class="dice-crack-svg">
          <path d="M150,45 L118,18 L82,25 L42,6 M150,45 L192,14 L235,28 L272,8 M150,45 L125,74 L78,84 M150,45 L178,76 L228,85 M118,18 L132,4 M192,14 L176,3" />
        </svg>
      `;
      fx.appendChild(crackWrap.firstElementChild);
    }

    // 5) 오직 자연 20(대성공)과 자연 1(대실패)일 때만 상단 임팩트 배지 표시 (고점/저점/일반은 생략)
    if (badge) {
      if (tier === "nat20") {
        badge.innerText = "👑 CRITICAL · 대성공!";
        badge.className = "dice-tier-badge tier-nat20 show";
      } else if (tier === "nat1") {
        badge.innerText = "💀 FUMBLE · 대실패!";
        badge.className = "dice-tier-badge tier-nat1 show";
      } else {
        badge.innerText = "";
        badge.className = "dice-tier-badge";
      }
    }

    // (대성공/대실패 시 대시보드 전체 암전/진동 FX는 제거됨)
  }

  function animateDiceAdvanced(raw, mod, modeText, formulaStr, cb, onSettle, finishDelay = 600) {
    const panel = DOM.dicePanel || document.getElementById('dice-panel');
    const t = DOM.diceTotal || document.getElementById('dice-total-display');
    const f = DOM.diceFormula || document.getElementById('dice-formula-display');
    const emblem = document.getElementById('dice-d20-emblem');

    if (currentDiceInterval) {
      clearInterval(currentDiceInterval);
      currentDiceInterval = null;
    }
    if (currentDiceStepTimeout) {
      clearTimeout(currentDiceStepTimeout);
      currentDiceStepTimeout = null;
    }

    resetDicePanelVisuals();
    if (panel) panel.classList.add('rolling-active');
    t.className = 'dice-total rolling-zoom';
    f.innerHTML = '&nbsp;';

    // 정속(55ms 간격)으로 경쾌하게 회전하는 12단계 주사위 연출
    const stepDelays = [55, 55, 55, 55, 55, 55, 55, 55, 55, 55, 55, 55];
    const totalTicks = stepDelays.length;
    let count = 0;

    const runStep = () => {
      const progress = (count + 1) / totalTicks;
      // 화면과 가까워지듯 점점 커지는 스케일 (0.76x ➔ 1.94x) + 좌우 틸트
      const zoomScale = 0.76 + Math.pow(progress, 1.35) * 1.18;
      const tiltDeg = (count % 2 === 0 ? 1 : -1) * (3 + progress * 7);
      t.innerText = Math.floor(Math.random() * 20) + 1;
      t.style.transform = `scale(${zoomScale.toFixed(3)}) rotate(${tiltDeg.toFixed(1)}deg)`;
      t.style.filter = `brightness(${(1 + progress * 0.45).toFixed(2)}) drop-shadow(0 ${Math.round(3 + progress * 10)}px ${Math.round(6 + progress * 12)}px rgba(0,0,0,0.88))`;

      if (emblem) {
        const embScale = 0.75 + progress * 0.95;
        const embRot = (count + 1) * 32;
        emblem.style.transform = `translate(-50%, -54%) scale(${embScale.toFixed(2)}) rotate(${embRot}deg)`;
      }

      playDiceRollTick(count, totalTicks);
      count++;

      if (count < totalTicks) {
        currentDiceStepTimeout = setTimeout(runStep, stepDelays[count]);
      } else {
        currentDiceStepTimeout = setTimeout(() => {
          currentDiceStepTimeout = null;

          // 인라인 스타일 초기화 후 티어별 슬램(Slam-Down) 애니메이션으로 정상 크기(1.0) 복귀!
          t.style.transform = '';
          t.style.filter = '';
          if (emblem) emblem.style.transform = '';

          const tier = (raw === 20) ? 'nat20' : ((raw === 1) ? 'nat1' : ((raw >= 16) ? 'high' : ((raw <= 5) ? 'low' : 'normal')));

          t.innerText = (mod !== 0) ? (raw + mod) : raw;
          const modLabel = (mod > 0) ? ` + ${mod}` : ((mod < 0) ? ` - ${Math.abs(mod)}` : '');
          f.innerText = `${formulaStr}${modLabel} [${modeText}]`;

          if (panel) {
            panel.classList.remove('rolling-active');
            void panel.offsetWidth;
            panel.classList.add(`tier-${tier}`, `shake-${tier}`);
          }

          t.className = 'dice-total';
          void t.offsetWidth;
          t.className = `dice-total tier-${tier}`;

          spawnDiceImpactFX(tier, raw);
          playDiceLandSound(raw);

          if (onSettle) onSettle();

          setTimeout(() => {
            if (cb) {
              try { cb(); } catch(e) { console.error(e); }
            }
          }, finishDelay);
        }, 55);
      }
    };

    runStep();
  }

  function copyStatusToClipboard(triggerBtn) {
    const b = BEARERS[pickedClass], c = COMPS[pickedComp];
    const overheatChipForBrief = (heat >= 100) ? ['[임계(+2/-2)]'] : ((heat >= 70) ? ['[경고(+1/-1)]'] : []);
    const allBStatusNames = [...overheatChipForBrief, ...bearerStatuses.map(s => `[${s.name}]`)];
    const bStatusStr = allBStatusNames.length > 0 ? allBStatusNames.join(' ') : '정상';
    const cStatusStr = compStatuses.length > 0 ? compStatuses.map(s => `[${s.name}]`).join(' ') : '정상';
    const activeCds = ['A', 'B', 'C'].filter(k => (compCds[k] || 0) > 0).map(k => `${k}:${compCds[k]}R`);
    const cdStr = activeCds.length > 0 ? activeCds.join(' ') : '전원 준비';

    let actionBriefingSection = '【 이번 라운드 행동 결과 】\n';
    if (lastRoundActionSummary && lastRoundActionSummary.length > 0) {
      actionBriefingSection += lastRoundActionSummary.join('\n');
    } else {
      actionBriefingSection += '(행동 선언 대기 중)';
    }

    const turnBriefingText = 
`${actionBriefingSection}

【 파티 상태 현황 】
▶ 베어러: ${bearerName} (${pickedClass} Lv.${curLevel}) | HP: ${hp}/${maxHp} | 방어막: ${shield} | AC: ${getBearerEffectiveAc()} | 과열: ${heat}/100 | 상태: ${bStatusStr}
▶ 동료: ${getCompName()} (${c.class}) | HP: ${compHp}/${compMaxHp} | 방어막: ${compShield} | AC: ${getCompEffectiveAc()} | C쿨: ${cdStr} | 상태: ${cStatusStr}
▶ 물자: 휘석 ${pyrite}개 | 영약 ${potion}병 | 생환 스택: ${deathStack} | 교감: ${communionActiveThisRound !== 'none' ? (communionActiveThisRound === 'shine' ? '비추는 불꽃 발동중' : '태우는 불꽃 발동중') : (communionFlame !== 'none' ? (communionFlame === 'shine' ? '비추는 불꽃 보유' : '태우는 불꽃 보유') : '없음')}`;

    const tempTextarea = document.createElement('textarea');
    tempTextarea.value = turnBriefingText;
    tempTextarea.style.position = 'fixed';
    tempTextarea.style.left = '-9999px';
    tempTextarea.style.top = '-9999px';
    document.body.appendChild(tempTextarea);
    tempTextarea.focus();
    tempTextarea.select();

    try { document.execCommand('copy'); } catch (err) {}
    document.body.removeChild(tempTextarea);

    const copyBtn = triggerBtn || document.querySelector("button[onclick*='copyStatusToClipboard']");
    if (copyBtn) {
      const origText = copyBtn.innerHTML;
      copyBtn.innerHTML = '✓ 복사됨!';
      copyBtn.style.color = '#86efac';
      copyBtn.style.borderColor = '#22c55e';
      setTimeout(() => {
        copyBtn.innerHTML = origText;
        copyBtn.style.color = '';
        copyBtn.style.borderColor = '';
      }, 1500);
    }

    playBeep(640, 'triangle', 0.12);
    log(`📋 <b>[턴 복사 완료]</b> 마스터 공유용 상태 브리핑이 클립보드에 복사되었습니다. (채팅창에 붙여넣기하세요)`);
  }

  function loadSpriteAsset(candidates, onSuccess) {
    if (!Array.isArray(candidates) || candidates.length === 0) return;
    let idx = 0;
    const tryNext = () => {
      if (idx >= candidates.length) return;
      const url = candidates[idx++];
      const img = new Image();
      img.onload = () => { if (onSuccess) onSuccess(img, url); };
      img.onerror = tryNext;
      img.src = url;
    };
    tryNext();
  }

  (function initSteamSpriteAsset() {
    loadSpriteAsset([
      'assets/effects/Effect  (3)-Sheet.png',
      'assets/effects/Effect (3)-Sheet.png',
      'assets/Effect  (3)-Sheet.png',
      'Effect  (3)-Sheet.png'
    ], (img, resolvedUrl) => {
      document.querySelectorAll('.steam-puff').forEach(el => {
        el.style.backgroundImage = `url("${resolvedUrl}")`;
      });
    });
  })();

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllStatusMenus();
      if (typeof closeIntentPasteModal === 'function') closeIntentPasteModal();
      closeRadialTreeModal();
      closeSettingsModal();
      closeMapModal();
      closeBagPopover();
    }
    if (e.key === 'Enter') {
      const nameScreen = document.getElementById('name-screen');
      if (nameScreen && nameScreen.style.display === 'flex') {
        confirmNameAndProceed();
      }
    }
  });

  // 배낭 팝오버 및 스킬 선택지/상태 팝업 바깥 클릭 시 자동 닫힘(취소) 처리
  window.addEventListener('click', (e) => {
    if (typeof suppressNextSkillClickUntil !== 'undefined' && Date.now() < suppressNextSkillClickUntil) {
      return;
    }
    const pop = document.getElementById('bag-popover');
    const btn = document.getElementById('btn-open-bag');
    if (pop && pop.style.display === 'flex') {
      if (!pop.contains(e.target) && btn && !btn.contains(e.target)) {
        closeBagPopover();
      }
    }

    const openMenus = document.querySelectorAll('.status-modal-menu');
    let closedSkillPopup = false;
    openMenus.forEach(menu => {
      if (menu.style.display === 'flex' && !menu.contains(e.target)) {
        if (menu.classList.contains('bearer-skill-popup') || menu.classList.contains('comp-skill-popup')) {
          closedSkillPopup = true;
        }
        menu.style.display = 'none';
        document.querySelectorAll('.menu-open-elevated').forEach(el => el.classList.remove('menu-open-elevated'));
      }
    });
    if (closedSkillPopup) {
      playBeep(320, 'sine', 0.08);
    }
  });

  cacheDOMElements();
  loadSettings();
  checkResumeButtonVisibility();