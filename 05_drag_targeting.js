/* ==========================================================================
     13. [v2.24 핵심] 점선(Dashed-Line) 드래그 앤 드롭 타겟팅 & 2단계 연쇄(Chain) 시스템
     - 베어러 스킬(0~4) 및 동료 스킬(A, B, C, HEAT)에서 마우스/터치 드래그 시
       네온 점선이 커서를 따라가며 적 카드 / 베어러 상태창 / 동료 상태창에 드롭 즉시 발동!
     - 릴리의 [생명 흡수진(so_1_2)] & 등지기의 [환체 교란(l_1_4)]은
       1차 대상 드롭 후 2차 대상까지 점선이 이어지는 2단계 연쇄(Chain) 타겟팅 지원!
     ========================================================================== */
  let activeSkillDrag = null;
  let activeSkillChain = null;
  let suppressNextSkillClickUntil = 0;

  function getElementCenterPoint(el) {
    if (!el) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  function showDragSvgLine(x1, y1, x2, y2, modeClass = 'drag-bearer') {
    const svg = document.getElementById('skill-drag-svg-overlay');
    const lineBg = document.getElementById('skill-drag-line-bg');
    const line = document.getElementById('skill-drag-line');
    const dot = document.getElementById('skill-drag-origin-dot');
    const reticle = document.getElementById('skill-drag-reticle');
    if (!svg || !line || !lineBg || !dot || !reticle) return;

    svg.className = `active ${modeClass}`;
    lineBg.setAttribute('x1', x1);
    lineBg.setAttribute('y1', y1);
    lineBg.setAttribute('x2', x2);
    lineBg.setAttribute('y2', y2);

    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);

    dot.setAttribute('cx', x1);
    dot.setAttribute('cy', y1);
    reticle.setAttribute('transform', `translate(${x2}, ${y2})`);
  }

  function hideDragSvgLine() {
    const svg = document.getElementById('skill-drag-svg-overlay');
    if (svg) {
      svg.className = '';
      svg.style.display = 'none';
    }
    document.querySelectorAll('.drop-valid-highlight, .drop-hover-active').forEach(el => {
      el.classList.remove('drop-valid-highlight', 'drop-hover-active');
    });
  }

  function cancelSkillChainMode(e) {
    if (e) e.stopPropagation();
    activeSkillChain = null;
    const banner = document.getElementById('skill-chain-banner');
    if (banner) {
      banner.classList.remove('active');
      banner.style.display = 'none';
    }
    hideDragSvgLine();
    playBeep(300, 'sine', 0.08);
  }
  window.cancelSkillChainMode = cancelSkillChainMode;

  function startSkillChainMode(chainConfig) {
    activeSkillChain = chainConfig;
    const banner = document.getElementById('skill-chain-banner');
    const bannerTxt = document.getElementById('skill-chain-banner-text');
    if (banner && bannerTxt) {
      bannerTxt.innerText = chainConfig.bannerText || '🎯 2단계 대상을 클릭하세요';
      banner.classList.add('active');
      banner.style.display = 'flex';
    }
    const svg = document.getElementById('skill-drag-svg-overlay');
    if (svg) svg.style.display = 'block';

    // 하이라이트 표시
    document.querySelectorAll('.drop-valid-highlight, .drop-hover-active').forEach(el => {
      el.classList.remove('drop-valid-highlight', 'drop-hover-active');
    });
    if (chainConfig.validTargetType === 'ally') {
      const bPanel = document.getElementById('bearer-resource-panel');
      const cPanel = document.getElementById('comp-resource-panel');
      if (bPanel) bPanel.classList.add('drop-valid-highlight');
      if (cPanel && !chainConfig.onlyBearer) cPanel.classList.add('drop-valid-highlight');
    } else if (chainConfig.validTargetType === 'other_enemy') {
      document.querySelectorAll('[data-drop-target="enemy"]').forEach(el => {
        if (el.getAttribute('data-enemy-uid') !== chainConfig.fromEnemyUid) {
          el.classList.add('drop-valid-highlight');
        }
      });
    }

    const pt = getElementCenterPoint(chainConfig.anchorEl);
    showDragSvgLine(pt.x, pt.y, pt.x + 20, pt.y - 20, 'drag-chain');
    playBeep(660, 'triangle', 0.12);
  }

  /* 에너미 카드 클릭 핸들러 (2단계 체인 중이면 체인 완료, 평소에는 포커스 타겟 변경) */
  function onEnemyCardClick(uid, e) {
    if (activeSkillChain && activeSkillChain.validTargetType === 'other_enemy') {
      if (e) e.stopPropagation();
      if (uid === activeSkillChain.fromEnemyUid) {
        playBeep(220, 'sawtooth', 0.15);
        log(`⚠️ <b>[환체 교란]</b> 공격 목표를 전환할 <b>다른 적 카드</b>를 클릭해 주세요!`);
        return;
      }
      const targetEn = getEnemyByUid(uid);
      const slotIdx = activeSkillChain.slotIdx;
      const firstUid = activeSkillChain.fromEnemyUid;
      cancelSkillChainMode();
      selectedBearerTargetUid = firstUid;
      slotRunOptions[slotIdx] = {
        enemyUid: firstUid,
        redirectEnemyUid: uid,
        redirectEnemyName: targetEn ? targetEn.name : '다른 적'
      };
      executeBearerSkillImmediate(slotIdx);
      return;
    }
    selectFocusTargetForBoth(uid, e);
  }
  window.onEnemyCardClick = onEnemyCardClick;

  /* 스킬별 유효 드롭 타겟 하이라이트 표시 */
  function highlightValidDropTargets(actor, key) {
    document.querySelectorAll('.drop-valid-highlight').forEach(el => el.classList.remove('drop-valid-highlight'));
    const bPanel = document.getElementById('bearer-resource-panel');
    const cPanel = document.getElementById('comp-resource-panel');
    const enemyCards = document.querySelectorAll('[data-drop-target="enemy"]');
    const bridgeBar = document.getElementById('battle-sync-bridge');

    if (actor === 'mage_release') {
      const hasAttack = mageChargedSpells.some(sp => {
        const s = getBearerSkillById(sp.id);
        return s && (s.isAttack || sp.dmg > 0 || sp.id === 'm_3_1');
      });
      if (hasAttack) {
        enemyCards.forEach(el => el.classList.add('drop-valid-highlight'));
        if (bridgeBar) bridgeBar.classList.add('drop-valid-highlight');
      } else {
        if (bPanel) bPanel.classList.add('drop-valid-highlight');
        if (cPanel) cPanel.classList.add('drop-valid-highlight');
      }
      return;
    }

    if (actor === 'bearer') {
      const sk = getBearerSkillById(bearerDeck[key]);
      if (!sk || sk.isPassive) return;
      if (sk.id === 'f_1_4') {
        if (bPanel) bPanel.classList.add('drop-valid-highlight');
        if (cPanel) cPanel.classList.add('drop-valid-highlight');
        if (bridgeBar) bridgeBar.classList.add('drop-valid-highlight');
        enemyCards.forEach(el => el.classList.add('drop-valid-highlight'));
      } else if (sk.id === 'm_1_2' || sk.id === 'm_3_2' || sk.id === 'l_1_2') {
        if (bPanel) bPanel.classList.add('drop-valid-highlight');
        if (cPanel) cPanel.classList.add('drop-valid-highlight');
      } else if (sk.id === 'f_2_3' || sk.id === 'm_3_3' || sk.id === 'l_1_3' || sk.id === 'l_2_2') {
        if (cPanel) cPanel.classList.add('drop-valid-highlight');
      } else if (!sk.isAttack && sk.id !== 'm_3_1' && sk.id !== 'l_3_1' && sk.id !== 'l_3_2') {
        if (bPanel) bPanel.classList.add('drop-valid-highlight');
      } else {
        enemyCards.forEach(el => el.classList.add('drop-valid-highlight'));
        const livingEnemies = getLivingSyncedEnemies();
        const canDropBridge = (livingEnemies.length === 0 || isBearerSkillAoeEnemyTarget(sk));
        if (canDropBridge && bridgeBar) bridgeBar.classList.add('drop-valid-highlight');
      }
    } else {
      if (key === 'HEAT') {
        if (bPanel) bPanel.classList.add('drop-valid-highlight');
        if (cPanel) cPanel.classList.add('drop-valid-highlight');
        return;
      }
      const sIdx = (key === 'A') ? 0 : ((key === 'B') ? 1 : 2);
      const sk = getCompSkillById(compDeck[sIdx]);
      if (!sk) return;
      if (sk.id === 'so_1_2') {
        enemyCards.forEach(el => el.classList.add('drop-valid-highlight'));
        if (cPanel) cPanel.classList.add('drop-valid-highlight');
      } else if (sk.id === 'so_2_1') {
        if (bPanel) bPanel.classList.add('drop-valid-highlight');
        if (cPanel) cPanel.classList.add('drop-valid-highlight');
      } else if (sk.id === 'so_3_2') {
        if (bPanel) bPanel.classList.add('drop-valid-highlight');
        enemyCards.forEach(el => el.classList.add('drop-valid-highlight'));
      } else if (!sk.isAttack && !sk.isDirectHitNoRoll) {
        if (cPanel) cPanel.classList.add('drop-valid-highlight');
      } else {
        enemyCards.forEach(el => el.classList.add('drop-valid-highlight'));
        const livingEnemies = getLivingSyncedEnemies();
        const canDropBridge = (livingEnemies.length === 0 || isCompSkillAoeEnemyTarget(sk));
        if (canDropBridge && bridgeBar) bridgeBar.classList.add('drop-valid-highlight');
      }
    }
  }

  function detectDropZoneAtPoint(clientX, clientY) {
    const el = document.elementFromPoint(clientX, clientY);
    if (!el) return null;
    const enemyCard = el.closest('[data-drop-target="enemy"]');
    if (enemyCard) {
      return { type: 'enemy', uid: enemyCard.getAttribute('data-enemy-uid'), el: enemyCard };
    }
    const bearerPanel = el.closest('[data-drop-target="bearer"]');
    if (bearerPanel) {
      return { type: 'bearer', el: bearerPanel };
    }
    const compPanel = el.closest('[data-drop-target="comp"]');
    if (compPanel) {
      return { type: 'comp', el: compPanel };
    }
    const bridgeBar = el.closest('#battle-sync-bridge');
    if (bridgeBar) {
      return { type: 'battlefield', el: bridgeBar };
    }
    return null;
  }

  /* 드롭 완료 시 스킬별 맞춤 실행 / 팝업 / 2단계 체인 트리거 */
  function handleSkillDropAction(actor, key, dropZone) {
    if (isExecuting) return;

    if (actor === 'mage_release') {
      if (dropZone.type === 'enemy' && dropZone.uid) {
        selectedBearerTargetUid = dropZone.uid;
        if (typeof renderSyncBridgeUI === 'function') renderSyncBridgeUI();
        releaseChargedSpells(dropZone.uid);
        return;
      }
      // 전장 빈 공간 또는 기본 드롭
      releaseChargedSpells();
      return;
    }

    if (actor === 'bearer') {
      if (bearerActedThisRound) {
        playBeep(220, 'sawtooth', 0.16);
        log(`⏳ <b>[베어러 행동 완료]</b> 이번 라운드 베어러의 행동(1회)을 이미 소모했습니다.`);
        return;
      }
      const slotIdx = Number(key);
      const sk = getBearerSkillById(bearerDeck[slotIdx]);
      if (!sk || sk.isPassive) return;

      // 사전 시전 제약 검증 (행동 제약, 과열 조건, 반피 조건, 동료 생존 조건)
      const isRestricted = bearerStatuses.some(s => s.name.includes('행동 제약')) && !isBearerImmuneToRestriction();
      if (isRestricted && sk.circle !== '0' && !sk.ignoreRestriction) {
        playBeep(220, 'sawtooth', 0.2);
        log(`⛓️ <b>[행동 제약 발동 중]</b> 현재 <b>[행동 제약]</b> 상태이므로 서클 기술([${sk.name}])을 시전할 수 없습니다!`);
        return;
      }
      if (sk.reqHeat && heat < sk.reqHeat) {
        playBeep(220, 'sawtooth', 0.2);
        log(`⚠️ <b>[시전 불가]</b> [${sk.name}] 기술은 현재 [과열 ${sk.reqHeat} 이상] 상태에서만 시전할 수 있습니다! (현재: ${heat}/100)`);
        return;
      }
      if (sk.reqHalfHp && (hp * 2 > maxHp)) {
        playBeep(220, 'sawtooth', 0.2);
        log(`⚠️ <b>[시전 불가]</b> [${sk.name}] 기술은 베어러 현재 HP가 절반 이하일 때만 시전 가능합니다!`);
        return;
      }
      if (sk.reqCompAlive && compHp <= 0) {
        playBeep(220, 'sawtooth', 0.2);
        log(`⚠️ <b>[시전 불가]</b> 동료가 탈진 상태이므로 [${sk.name}] 기술을 시전할 수 없습니다!`);
        return;
      }

      // 0) 파이터 [백색 철벽 (f_1_4)]: 베어러 상태창 드롭 시 일반 전개, 동료 상태창 드롭 시 결사의 수호, 전장/적 드롭 시 팝업
      if (sk.id === 'f_1_4') {
        if (dropZone.type === 'bearer') {
          slotRunOptions[slotIdx] = { guardMode: 'normal' };
          executeBearerSkillImmediate(slotIdx);
          return;
        } else if (dropZone.type === 'comp') {
          slotRunOptions[slotIdx] = { guardMode: 'devoted' };
          executeBearerSkillImmediate(slotIdx);
          return;
        }
        selectBearerSkill(slotIdx, null, true);
        return;
      }

      // 1) 아군 대상 보조/치유 스킬 (성염 치유 m_1_2, 응축된 방벽 m_3_2, 신기루 장막 l_1_2)
      if (sk.id === 'm_1_2' || sk.id === 'm_3_2' || sk.id === 'l_1_2') {
        if (dropZone.type === 'enemy' || dropZone.type === 'battlefield') {
          playBeep(240, 'sawtooth', 0.15);
          log(`⚠️ <b>[대상 불일치]</b> [${sk.name}]은(는) 아군 보호/치유 기술입니다. 베어러 또는 동료 상태창에 드롭해 주세요.`);
          return;
        }
        if (dropZone.type === 'bearer' || dropZone.type === 'comp') {
          slotRunOptions[slotIdx] = { target: dropZone.type };
          executeBearerSkillImmediate(slotIdx);
          return;
        }
        selectBearerSkill(slotIdx, null, true);
        return;
      }

      // 2) 동료 전용 버프 스킬 (스프링보드 f_2_3, 타오르는 칼날 m_3_3, 과부하 조광 l_1_3, 별빛 유영 l_2_2)
      if (sk.id === 'f_2_3' || sk.id === 'm_3_3' || sk.id === 'l_1_3' || sk.id === 'l_2_2') {
        if (dropZone.type === 'enemy' || dropZone.type === 'battlefield') {
          playBeep(240, 'sawtooth', 0.15);
          log(`⚠️ <b>[대상 불일치]</b> [${sk.name}]은(는) 동료 지원 기술입니다. 동료 상태창에 드롭해 주세요.`);
          return;
        }
        if (dropZone.type === 'comp' || dropZone.type === 'bearer') {
          executeBearerSkillImmediate(slotIdx);
          return;
        }
        selectBearerSkill(slotIdx, null, true);
        return;
      }

      // 2.5) 메이지 [성염 장전 (m_1_3)]: 베어러 상태창 드롭 시 장전할 마법 선택 인라인 팝업 오픈
      if (sk.id === 'm_1_3') {
        if (dropZone.type === 'enemy' || dropZone.type === 'battlefield') {
          playBeep(240, 'sawtooth', 0.15);
          log(`⚠️ <b>[대상 불일치]</b> [성염 장전]은 지팡이에 마법을 충전하는 기술입니다. 베어러 상태창에 드롭해 주세요.`);
          return;
        }
        if (dropZone.type === 'comp') {
          playBeep(240, 'sawtooth', 0.15);
          log(`⚠️ <b>[대상 불일치]</b> [성염 장전]은 베어러의 지팡이에 마법을 충전하는 기술입니다. 베어러 상태창에 드롭해 주세요.`);
          return;
        }
        selectBearerSkill(slotIdx, null, true);
        return;
      }

      // 3) 베어러 자신 전용 버프 스킬 (무형보 s_1_3, 무결점의 방어 f_3_1, 군신의 혼 f_3_2, 태양의 부름 l_2_1, 허상의 디딤돌 l_2_3, 빛의 굴절 l_3_3)
      if (!sk.isAttack && sk.id !== 'm_1_3' && sk.id !== 'm_3_1' && sk.id !== 'l_3_1' && sk.id !== 'l_3_2') {
        if (dropZone.type === 'enemy' || dropZone.type === 'battlefield') {
          playBeep(240, 'sawtooth', 0.15);
          log(`⚠️ <b>[대상 불일치]</b> [${sk.name}]은(는) 베어러 자신에게 전개하는 전술 기술입니다. 베어러 상태창에 드롭해 주세요.`);
          return;
        }
        if (dropZone.type === 'comp') {
          playBeep(240, 'sawtooth', 0.15);
          log(`⚠️ <b>[대상 불일치]</b> [${sk.name}]은(는) 베어러 자신 전용 기술입니다. 베어러 상태창에 드롭해 주세요.`);
          return;
        }
        executeBearerSkillImmediate(slotIdx);
        return;
      }

      // 4) 등지기 [원격 투영 (l_3_2)]: 적, 아군, 전장 어디든 드롭 시 스킬 선택 팝업 오픈
      if (sk.id === 'l_3_2') {
        selectBearerSkill(slotIdx, null, true);
        return;
      }

      // 5) 등지기 [환체 교란 (l_1_4)] 2단계 점선 체인 타겟팅 (적 A 드롭 ➔ 적 B 클릭)
      if (sk.id === 'l_1_4') {
        if (dropZone.type === 'bearer' || dropZone.type === 'comp') {
          playBeep(240, 'sawtooth', 0.15);
          log(`⚠️ <b>[대상 불일치]</b> [환체 교란]은 적을 조준하는 기술입니다. 교란할 적 카드에 드롭해 주세요.`);
          return;
        }
        if (dropZone.type === 'battlefield') {
          playBeep(240, 'sawtooth', 0.15);
          log(`⚠️ <b>[대상 미지정]</b> [환체 교란]은 단일 대상을 조준하는 기술입니다. 전장의 빈 공간이 아닌 <b>공격 목표를 전환할 특정 적 카드</b>에 드롭해 주세요.`);
          return;
        }
        const living = getLivingSyncedEnemies();
        if (living.length > 0 && living.length < 2) {
          playBeep(220, 'sawtooth', 0.2);
          log(`⚠️ <b>[시전 불가]</b> [환체 교란]은 전장에 적이 <b>2개체 이상</b>일 때만 시전할 수 있습니다!`);
          return;
        }
        if (dropZone.type === 'enemy' && dropZone.uid) {
          selectedBearerTargetUid = dropZone.uid;
          if (living.length === 2) {
            const otherEn = living.find(e => e.uid !== dropZone.uid);
            slotRunOptions[slotIdx] = {
              enemyUid: dropZone.uid,
              redirectEnemyUid: otherEn ? otherEn.uid : null,
              redirectEnemyName: otherEn ? otherEn.name : '다른 적'
            };
            executeBearerSkillImmediate(slotIdx);
            return;
          } else if (living.length >= 3) {
            const firstEn = getEnemyByUid(dropZone.uid);
            startSkillChainMode({
              skillId: 'l_1_4',
              slotIdx: slotIdx,
              fromEnemyUid: dropZone.uid,
              anchorEl: dropZone.el,
              validTargetType: 'other_enemy',
              bannerText: `🎭 [환체 교란 2단계] ${firstEn ? firstEn.name : '대상'}의 공격을 뒤집어씌울 다른 적 카드를 클릭하세요!`
            });
            return;
          }
        }
        selectBearerSkill(slotIdx, null, true);
        return;
      }

      // 6) 공격 스킬 및 적 지정 스킬 (m_3_1 침묵의 족쇄, l_3_1 빛의 파동 포함) -> 아군 드롭 차단
      if (sk.isAttack || sk.id === 'm_3_1' || sk.id === 'l_3_1') {
        if (dropZone.type === 'bearer' || dropZone.type === 'comp') {
          playBeep(240, 'sawtooth', 0.15);
          log(`⚠️ <b>[대상 불일치]</b> [${sk.name}]은(는) 적을 공격하는 기술입니다. 아군에게는 사용할 수 없습니다.`);
          return;
        }
      }

      // 6-1) 단일 대상 공격/적 지정 기술을 전장 빈 공간(battlefield)에 드롭했을 때 오발 차단
      const livingForDrop = getLivingSyncedEnemies();
      if (dropZone.type === 'battlefield') {
        const isSingleTarget = isBearerSkillSingleEnemyTarget(sk);
        if (isSingleTarget && livingForDrop.length > 0) {
          playBeep(240, 'sawtooth', 0.15);
          log(`⚠️ <b>[대상 미지정]</b> [${sk.name}]은(는) 단일 대상을 조준하는 기술입니다. 전장의 빈 공간이 아닌 <b>공격하려는 특정 적 카드</b> 위에 드롭해 주세요.`);
          return;
        }
      }

      // 7) 적 카드에 드롭한 경우 해당 적을 조준 타겟으로 고정
      if (dropZone.type === 'enemy' && dropZone.uid) {
        selectedBearerTargetUid = dropZone.uid;
        slotRunOptions[slotIdx] = Object.assign({}, slotRunOptions[slotIdx] || {}, { enemyUid: dropZone.uid });
        renderSyncBridgeUI();
      }

      // 8) 가변 과열 / 분기 선택이 필요한 공격 스킬은 인라인 팝업 오픈
      if (sk.id === 'l_1_1' || sk.circle === 'var' || sk.id === 's_1_4') {
        selectBearerSkill(slotIdx, null, true);
        return;
      }

      // 9) 그 외 단일/광역 스킬 (비연동 시 조건 질문 필요한 스킬은 selectBearerSkill 경유)
      const hasSynced = (livingForDrop.length > 0);
      if (!hasSynced && (sk.id === 'f_1_1' || sk.id === 'f_1_3' || sk.id === 'f_2_2' || sk.id === 's_2_1' || sk.id === 's_3_2' || sk.id === 'l_3_1')) {
        selectBearerSkill(slotIdx, null, true);
        return;
      }

      executeBearerSkillImmediate(slotIdx);
      return;
    }

    // ==================== 컴패니언 스킬 드롭 처리 ====================
    if (key === 'HEAT') {
      if (dropZone.type === 'enemy' || dropZone.type === 'battlefield') {
        playBeep(240, 'sawtooth', 0.15);
        log(`⚠️ <b>[대상 불일치]</b> [열기 전도]는 베어러의 과열을 동료가 분담하는 기술입니다. 베어러 또는 동료 상태창에 드롭해 주세요.`);
        return;
      }
      selectCompHeatConduction(null, true);
      return;
    }

    const tag = String(key);
    const slotIdx = (tag === 'A') ? 0 : ((tag === 'B') ? 1 : 2);
    const sk = getCompSkillById(compDeck[slotIdx]);
    if (!sk || compHp <= 0) return;

    if (compActedThisRound && !senBonusActionReady) {
      playBeep(220, 'sawtooth', 0.16);
      log(`⏳ <b>[동료 행동 완료]</b> 이번 라운드 ${getCompName()}의 행동(1회)을 이미 소모했습니다.`);
      return;
    }
    if (compRevivedThisRound) {
      playBeep(220, 'sawtooth', 0.2);
      log(`🛡️ <b>[재정비 중]</b> ${getCompName()}은(는) 이번 라운드에 부활하여 행동할 수 없습니다!`);
      return;
    }
    if ((compCds[tag] || 0) > 0) {
      playBeep(220, 'sawtooth', 0.18);
      log(`⏳ <b>[쿨다운 대기]</b> [${sk.name}] 기술은 현재 쿨다운(${compCds[tag]}R) 중입니다!`);
      return;
    }
    const isCompRestricted = compStatuses.some(s => s.name.includes('행동 제약')) && !isCompImmuneToRestriction();
    if (isCompRestricted && sk.cd > 0) {
      playBeep(220, 'sawtooth', 0.2);
      log(`⛓️ <b>[동료 행동 제약]</b> 현재 쿨다운 기술([${sk.name}])을 선언할 수 없습니다!`);
      return;
    }
    if (sk.reqCharge && senCharge < sk.reqCharge) {
      playBeep(220, 'sawtooth', 0.15);
      log(`⚠️ <b>[마탄 차징 부족]</b> [${sk.name}] 시전에는 마탄 차징이 최소 ${sk.reqCharge}스택 필요합니다!`);
      return;
    }

    // 1) 릴리 [생명 흡수진 (so_1_2)] 2단계 점선 체인 타겟팅
    if (sk.id === 'so_1_2') {
      if (dropZone.type === 'enemy' && dropZone.uid) {
        selectedCompTargetUid = dropZone.uid;
        const firstEn = getEnemyByUid(dropZone.uid);
        startSkillChainMode({
          skillId: 'so_1_2',
          compTag: tag,
          mode: 'normal',
          fromEnemyUid: dropZone.uid,
          anchorEl: dropZone.el,
          validTargetType: 'ally',
          onlyBearer: false,
          bannerText: `🩸 [생명 흡수진 2단계] ${firstEn ? firstEn.name : '적'}에게서 흡수한 생명력(+2 HP)을 받을 아군(베어러/동료) 상태창을 클릭하세요!`
        });
        return;
      } else if (dropZone.type === 'comp') {
        startSkillChainMode({
          skillId: 'so_1_2',
          compTag: tag,
          mode: 'emergency',
          fromEnemyUid: null,
          anchorEl: dropZone.el,
          validTargetType: 'ally',
          onlyBearer: true,
          bannerText: `🩸 [생명 전이(긴급) 2단계] ${getCompName()} HP -1 자해로 회복(+2 HP)시킬 베어러 상태창을 클릭하세요!`
        });
        return;
      } else if (dropZone.type === 'bearer') {
        playBeep(240, 'sawtooth', 0.15);
        log(`⚠️ <b>[생명 흡수진 사용 안내]</b> 적에게서 생명을 흡수하려면 적 카드에 드롭하고, 동료 HP를 깎아 베어러를 회복하려면 동료 상태창에 드롭해 주세요.`);
        return;
      } else if (dropZone.type === 'battlefield') {
        playBeep(240, 'sawtooth', 0.15);
        log(`⚠️ <b>[대상 미지정]</b> [생명 흡수진]으로 생명을 흡수하려면 전장 빈 공간이 아닌 <b>흡수할 적 카드</b>에 드롭해 주세요.`);
        return;
      }
      selectCompSkill(tag, null, true);
      return;
    }

    // 2) 릴리 [피의 서약 (so_2_1)]: 아군 드롭 시 팝업, 적/전장 드롭 시 차단
    if (sk.id === 'so_2_1') {
      if (dropZone.type === 'enemy' || dropZone.type === 'battlefield') {
        playBeep(240, 'sawtooth', 0.15);
        log(`⚠️ <b>[대상 불일치]</b> [피의 서약]은 아군 치유/보호 기술입니다. 베어러 또는 동료 상태창에 드롭해 주세요.`);
        return;
      }
      if (dropZone.type === 'bearer' || dropZone.type === 'comp') {
        const tActor = dropZone.type;
        const tName = (tActor === 'bearer') ? bearerName : getCompName();
        const canSac = (compHp >= 2);
        openCompSlotPopup(tag, `
          <div style="font-size:10px; color:#f472b6; font-weight:bold; border-bottom:1px solid #282f44; padding-bottom:3px;">🩸 [피의 서약 ➔ ${tName}] 발동 방식 선택</div>
          <button class="status-modal-item" onclick="commitCompSlotOption('${tag}', { target: '${tActor}', sacrifice: false }, event)">🛡️ 기본 시전: ${tName} HP +2 회복 & [방어막 2]</button>
          <button class="status-modal-item" ${!canSac ? 'disabled style="opacity:0.4;"' : `onclick="commitCompSlotOption('${tag}', { target: '${tActor}', sacrifice: true }, event)"`}>🔥 자해 강화(${getCompName()} HP-1): ${tName} HP +3 회복 & [방어막 3]</button>
        `);
        return;
      }
      selectCompSkill(tag, null, true);
      return;
    }

    // 3) 릴리 [열기 공명진 (so_3_2)]: 베어러 드롭 시 공명 증폭, 적 드롭 시 공명 환기
    if (sk.id === 'so_3_2') {
      if (dropZone.type === 'bearer') {
        compSlotOptions[tag] = { resonanceMode: 'amp' };
        executeCompSkillImmediate(tag);
        return;
      } else if (dropZone.type === 'enemy' && dropZone.uid) {
        selectedCompTargetUid = dropZone.uid;
        compSlotOptions[tag] = { resonanceMode: 'vent', enemyUid: dropZone.uid };
        executeCompSkillImmediate(tag);
        return;
      } else if (dropZone.type === 'comp') {
        playBeep(240, 'sawtooth', 0.15);
        log(`⚠️ <b>[열기 공명진 안내]</b> 베어러 피해를 증폭하려면 베어러 상태창에, 적 3피해 & 냉각을 발동하려면 적 카드에 드롭해 주세요.`);
        return;
      } else if (dropZone.type === 'battlefield') {
        playBeep(240, 'sawtooth', 0.15);
        log(`⚠️ <b>[대상 미지정]</b> [열기 공명진]으로 적을 공격/냉각하려면 전장 빈 공간이 아닌 <b>대상 적 카드</b>에 드롭해 주세요.`);
        return;
      }
      selectCompSkill(tag, null, true);
      return;
    }

    // 4) 동료 버프/방어/유틸 기술 (w_2_1, w_4_1, ms_1_2, ms_2_2, r_3_1, so_3_1) -> 적/전장 드롭 차단
    if (!sk.isAttack && !sk.isDirectHitNoRoll) {
      if (dropZone.type === 'enemy' || dropZone.type === 'battlefield') {
        playBeep(240, 'sawtooth', 0.15);
        log(`⚠️ <b>[대상 불일치]</b> [${sk.name}]은(는) 전술 방어/지원 기술입니다. 동료 상태창에 드롭해 주세요.`);
        return;
      }
      executeCompSkillImmediate(tag);
      return;
    }

    // 5) 동료 공격 기술 및 직접 타격 기술 (so_1_3 마력 흡수진, so_4_1 생사 역전, ms_4_2 무영의 검무 포함) -> 아군 드롭 차단
    if (sk.isAttack || sk.isDirectHitNoRoll) {
      if (dropZone.type === 'bearer' || dropZone.type === 'comp') {
        playBeep(240, 'sawtooth', 0.15);
        log(`⚠️ <b>[대상 불일치]</b> [${sk.name}]은(는) 적을 공격하는 기술입니다. 아군에게는 사용할 수 없습니다.`);
        return;
      }
    }

    // 5-1) 단일 대상 동료 공격/타격 기술을 전장 빈 공간(battlefield)에 드롭했을 때 오발 차단
    const livingSynced = getLivingSyncedEnemies();
    if (dropZone.type === 'battlefield') {
      const isSingleTarget = isCompSkillSingleEnemyTarget(sk);
      if (isSingleTarget && livingSynced.length > 0) {
        playBeep(240, 'sawtooth', 0.15);
        log(`⚠️ <b>[대상 미지정]</b> [${sk.name}]은(는) 단일 대상을 조준하는 기술입니다. 전장의 빈 공간이 아닌 <b>공격하려는 특정 적 카드</b> 위에 드롭해 주세요.`);
        return;
      }
    }

    // 6) 적 카드에 드롭 시 동료 타겟 즉시 고정
    if (dropZone.type === 'enemy' && dropZone.uid) {
      selectedCompTargetUid = dropZone.uid;
      compSlotOptions[tag] = Object.assign({}, compSlotOptions[tag] || {}, { enemyUid: dropZone.uid });
      renderSyncBridgeUI();
    }

    // 7) 휘석 과부하(so_4_2) 또는 비연동 시 조건 질문 필요한 스킬
    if (sk.id === 'so_4_2') {
      selectCompSkill(tag, null, true);
      return;
    }
    if (livingSynced.length === 0 && (sk.id === 'w_1_2' || sk.id === 'w_2_2' || sk.id === 'w_4_2' || sk.id === 'so_2_2' || sk.id === 'ms_1_1' || sk.id === 'ms_2_1' || sk.id === 'r_1_1' || sk.id === 'r_1_3' || sk.id === 'r_2_1' || sk.id === 'r_4_1')) {
      selectCompSkill(tag, null, true);
      return;
    }

    compSlotOptions[tag] = Object.assign({}, compSlotOptions[tag] || {}, {
      singleEnemy: (livingSynced.length === 1),
      enemyUid: selectedCompTargetUid
    });
    executeCompSkillImmediate(tag);
  }

  function bindMageReleaseDrag() {
    const mageRelBtn = document.getElementById('btn-mage-release');
    if (!mageRelBtn || mageRelBtn.dataset.dragBound === '1') return;
    mageRelBtn.dataset.dragBound = '1';
    mageRelBtn.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      if (isExecuting || mageRelBtn.disabled || mageChargedSpells.length === 0) return;
      const pt = getElementCenterPoint(mageRelBtn);
      activeSkillDrag = {
        actor: 'mage_release',
        key: 'RELEASE',
        cardEl: mageRelBtn,
        startX: e.clientX,
        startY: e.clientY,
        originX: pt.x,
        originY: pt.y,
        isDragging: false
      };
    });
    mageRelBtn.addEventListener('click', (e) => {
      if (Date.now() < suppressNextSkillClickUntil) {
        e.stopPropagation();
        e.preventDefault();
      }
    }, true);
  }
  window.bindMageReleaseDrag = bindMageReleaseDrag;

  function initSkillDragAndDropSystem() {
    bindMageReleaseDrag();
    // 1) 베어러 5스킬 카드 및 컴패니언 4스킬 카드에 Pointer Drag 바인딩
    [0, 1, 2, 3, 4].forEach(slotIdx => {
      const cardEl = document.getElementById(`card-bearer-${slotIdx}`);
      if (!cardEl || cardEl.dataset.dragBound === '1') return;
      cardEl.dataset.dragBound = '1';
      const btnEl = cardEl.querySelector('.skill-header-btn') || cardEl;
      btnEl.addEventListener('pointerdown', (e) => {
        if (e.button !== 0 && e.pointerType === 'mouse') return;
        if (isExecuting) return;
        const sk = getBearerSkillById(bearerDeck[slotIdx]);
        if (bearerActedThisRound || !sk || sk.isPassive || cardEl.classList.contains('heat-locked')) return;
        const pt = getElementCenterPoint(cardEl);
        activeSkillDrag = {
          actor: 'bearer',
          key: slotIdx,
          cardEl: cardEl,
          startX: e.clientX,
          startY: e.clientY,
          originX: pt.x,
          originY: pt.y,
          isDragging: false
        };
      });
      btnEl.addEventListener('click', (e) => {
        if (Date.now() < suppressNextSkillClickUntil) {
          e.stopPropagation();
          e.preventDefault();
        }
      }, true);
    });

    ['A', 'B', 'C', 'HEAT'].forEach(tag => {
      const wrapEl = document.getElementById(`wrap-comp-${tag}`);
      if (!wrapEl || wrapEl.dataset.dragBound === '1') return;
      wrapEl.dataset.dragBound = '1';
      const btnEl = wrapEl.querySelector('button') || wrapEl;
      btnEl.addEventListener('pointerdown', (e) => {
        if (e.button !== 0 && e.pointerType === 'mouse') return;
        if (isExecuting || (compActedThisRound && !senBonusActionReady) || btnEl.disabled) return;
        const pt = getElementCenterPoint(wrapEl);
        activeSkillDrag = {
          actor: 'comp',
          key: tag,
          cardEl: wrapEl,
          startX: e.clientX,
          startY: e.clientY,
          originX: pt.x,
          originY: pt.y,
          isDragging: false
        };
      });
      btnEl.addEventListener('click', (e) => {
        if (Date.now() < suppressNextSkillClickUntil) {
          e.stopPropagation();
          e.preventDefault();
        }
      }, true);
    });

    // 2) 전역 PointerMove: 드래그 점선 및 2단계 체인 점선 실시간 추적
    window.addEventListener('pointermove', (e) => {
      if (activeSkillDrag) {
        const dist = Math.hypot(e.clientX - activeSkillDrag.startX, e.clientY - activeSkillDrag.startY);
        if (!activeSkillDrag.isDragging && dist > 7) {
          activeSkillDrag.isDragging = true;
          closeAllStatusMenus();
          const svg = document.getElementById('skill-drag-svg-overlay');
          if (svg) svg.style.display = 'block';
          highlightValidDropTargets(activeSkillDrag.actor, activeSkillDrag.key);
        }
        if (activeSkillDrag.isDragging) {
          const modeCls = (activeSkillDrag.actor === 'comp') ? 'drag-comp' : 'drag-bearer';
          showDragSvgLine(activeSkillDrag.originX, activeSkillDrag.originY, e.clientX, e.clientY, modeCls);

          document.querySelectorAll('.drop-hover-active').forEach(el => el.classList.remove('drop-hover-active'));
          const zone = detectDropZoneAtPoint(e.clientX, e.clientY);
          if (zone && zone.el) {
            zone.el.classList.add('drop-hover-active');
          }
        }
        return;
      }

      if (activeSkillChain && activeSkillChain.anchorEl) {
        const pt = getElementCenterPoint(activeSkillChain.anchorEl);
        showDragSvgLine(pt.x, pt.y, e.clientX, e.clientY, 'drag-chain');
        document.querySelectorAll('.drop-hover-active').forEach(el => el.classList.remove('drop-hover-active'));
        const zone = detectDropZoneAtPoint(e.clientX, e.clientY);
        if (zone && zone.el && zone.el.classList.contains('drop-valid-highlight')) {
          zone.el.classList.add('drop-hover-active');
        }
      }
    });

    // 3) 전역 PointerUp: 드롭 판정 및 스킬 즉시 실행
    window.addEventListener('pointerup', (e) => {
      if (!activeSkillDrag) return;
      const dragState = activeSkillDrag;
      activeSkillDrag = null;

      if (!dragState.isDragging) {
        return;
      }

      suppressNextSkillClickUntil = Date.now() + 260;
      const dropZone = detectDropZoneAtPoint(e.clientX, e.clientY);
      hideDragSvgLine();

      // 원래 스킬 카드 자기 자신 위에 그대로 놓은 경우는 취소
      if (dragState.cardEl && dragState.cardEl.contains(document.elementFromPoint(e.clientX, e.clientY))) {
        playBeep(300, 'sine', 0.06);
        return;
      }

      if (dropZone) {
        handleSkillDropAction(dragState.actor, dragState.key, dropZone);
      } else {
        playBeep(300, 'sine', 0.06);
      }
    });

    // 4) 베어러 & 동료 상태창 클릭 시 2단계 체인([생명 흡수진]) 완료 처리
    ['bearer-resource-panel', 'comp-resource-panel'].forEach(panelId => {
      const panelEl = document.getElementById(panelId);
      if (!panelEl) return;
      panelEl.addEventListener('click', (e) => {
        if (!activeSkillChain || activeSkillChain.validTargetType !== 'ally') return;
        const clickedActor = (panelId === 'bearer-resource-panel') ? 'bearer' : 'comp';
        if (activeSkillChain.onlyBearer && clickedActor !== 'bearer') {
          playBeep(220, 'sawtooth', 0.15);
          log(`⚠️ <b>[생명 전이]</b> 자해 전이는 <b>베어러 상태창</b>을 클릭해야 합니다!`);
          return;
        }
        e.stopPropagation();
        const tag = activeSkillChain.compTag;
        const mode = activeSkillChain.mode || 'normal';
        const enemyUid = activeSkillChain.fromEnemyUid || selectedCompTargetUid;
        cancelSkillChainMode();
        compSlotOptions[tag] = {
          mode: mode,
          target: clickedActor,
          enemyUid: enemyUid
        };
        executeCompSkillImmediate(tag);
      });
    });

    // ESC 키로 체인/드래그 즉시 취소
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (activeSkillChain) cancelSkillChainMode();
        if (activeSkillDrag) {
          activeSkillDrag = null;
          hideDragSvgLine();
        }
      }
    });
  }

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initSkillDragAndDropSystem);
  } else {
    initSkillDragAndDropSystem();
  }

  function onSkillTilePlainClick(actor, key, e) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    closeAllStatusMenus();
    if (actor === 'bearer') {
      ensureValidBearerDeck(false);
      const sk = getBearerSkillById(bearerDeck[key]);
      if (sk && sk.isPassive) {
        playBeep(520, 'sine', 0.08);
        log(`✨ <b>[4Lv 패시브 상시 적용 중]</b> [${sk.name}]: ${sk.desc}`);
        return false;
      }
      playBeep(360, 'sine', 0.06);
      const f = DOM.diceFormula || document.getElementById('dice-formula-display');
      if (f) f.innerText = `🎯 [${sk ? sk.name : '베어러 스킬'}] 단순 클릭으로는 발동하지 않습니다! 아이콘을 드래그(점선)하여 타겟에 놓으세요.`;
      return false;
    } else {
      ensureValidCompDeck(false);
      let skName = '열기 전도';
      if (key !== 'HEAT') {
        const sIdx = (key === 'A') ? 0 : ((key === 'B') ? 1 : 2);
        const cSk = getCompSkillById(compDeck[sIdx]);
        if (cSk) skName = cSk.name;
      }
      playBeep(360, 'sine', 0.06);
      const f = DOM.diceFormula || document.getElementById('dice-formula-display');
      if (f) f.innerText = `🎯 [${skName}] 단순 클릭으로는 발동하지 않습니다! 아이콘을 드래그(점선)하여 타겟에 놓으세요.`;
      return false;
    }
  }
  window.onSkillTilePlainClick = onSkillTilePlainClick;

  /* ==========================================================================
     14. [v2.24 핀셋 패치] 회복 영약/HP 회복 하이라이트 정상화 & 다이스 오발 차단 패치
     - 회복 영약 복용, 동료 치료/부활, 성염 치유 등 HP 회복 시 HP바가 정상적으로 초록색 하이라이트 되도록 보장
     - 부호 없는 순수 주사위 수치 및 미지정 토큰이 뜬금없이 다이스(#dice-panel)를 하이라이트하는 문제 원천 차단
     - 배낭/소지품 자원(휘석, 영약 획득/구매, 생환 스택 등) 및 빗나감/0피해 하이라이트 방어 유지
     ========================================================================== */
  (function installChainHighlightGuards() {
    const patchHighlightEngine = () => {
      // 1) 로그 순차 하이라이트 엔진 가드: 배낭 및 소지품 자원 획득/차감/구매/채취 로그는 하이라이트 완전 스킵 (영약 복용/치료/부활은 정상 통과)
      if (typeof runSequentialChainHighlightOnLogItem === 'function') {
        const origRunSequential = runSequentialChainHighlightOnLogItem;
        window.runSequentialChainHighlightOnLogItem = function(itemEl) {
          if (!itemEl) return;
          const plainText = itemEl.textContent || '';
          const isResourceOrInventoryLog = (
            /장미\s*휘석|회복\s*영약\s*(?:구매|\+\d+|-\d+|차감|획득|부족|\d+병)|생환\s*스택|생환\s*발동|채취\s*판정|수첩\s*정리|여관\s*숙박|수동|설정|레벨\s*조정|초기화|차징\s*리셋|수동\s*해제|막간의\s*교감.*(?:획득|준비|초기화|종료)|교감.*(?:획득|준비|초기화)|시전\s*불가|사용\s*안내|공명진\s*안내|대상\s*미지정|패시브.*상시\s*적용|주의\s*집중.*적용\s*중|방어막\s*(?:조정|설정|수동)|동료\s*방어막\s*(?:조정|설정)|수동\s*방어막/.test(plainText)
            && !/회복\s*영약\s*복용|영약\s*(?:투여|치료)|부활|비추는\s*불꽃\s*개방|태우는\s*불꽃\s*개방/.test(plainText)
          );
          if (isResourceOrInventoryLog) return;
          return origRunSequential(itemEl);
        };
      }

      const isZeroDamageToken = (text) => {
        const str = String(text || '').trim();
        if (/(?:스침\s*[1-9]|(?<!\d)[1-9]\d*\s*피해|명중!\s*잔여\s*HP)/.test(str)) {
          return false;
        }
        return /(?:(?<!\d)0\s*피해|피해\s*:?\s*0|피격\s*:?\s*0\s*피해|대리\s*흡수\s*:?\s*0\s*피해|피해0|빗나감|완전\s*회피|회피됨|스침\s*없음|피해\s*없음|불발)/.test(str);
      };

      // 2) 토큰 제외 가드: 회복량(+5, +6) 및 실제 피해(-1, -2)는 살리고, 상태 비율(12/12) 및 주사위 순수 숫자는 제외
      if (typeof isExcludedDiceOrAcToken === 'function') {
        const origIsExcluded = isExcludedDiceOrAcToken;
        window.isExcludedDiceOrAcToken = function(cleanText) {
          const t = String(cleanText || '').trim();
          // 배낭 및 소지품 자원 명칭/수량 토큰 제외 (전투 복용 제외)
          if (/장미\s*휘석|회복\s*영약|생환\s*스택|휘석|생환/.test(t) && !/회복\s*영약\s*복용/.test(t)) {
            return true;
          }
          if (/방어막\s*(?:조정|설정|수동)|동료\s*방어막\s*(?:조정|설정)|수동\s*방어막/.test(t)) {
            return true;
          }
          if (/^\d+\s*(?:병|개|점)$/.test(t)) {
            return true;
          }
          // 상태 정보용 분수 표기 (예: "12/12", "13/13", "80/100", "11➔12/12")는 단독 액션 토큰이 아니므로 제외 (마탄 1/3 충전 제외)
          if (/^\d+\s*[\/➔]\s*\d+(?:\/\d+)?$/.test(t) && !/^\d+\s*[\/]\s*3$/.test(t)) {
            return true;
          }
          // 순수 양수 회복량 (+5, +1, +6) 및 순수 음수 피해량 (-1, -2)은 유효 토큰으로 보존! (절대 제외하지 않음)
          if (/^[+-]\d+$/.test(t)) {
            return false;
          }
          // 부호 없는 순수 정수 (주사위 합산값 등: 예 "18", "14") 제외
          if (/^\d+$/.test(t)) {
            return true;
          }
          // 피해 0 / 0 피해 / 빗나감 / 완전 회피 등 무효·실패 토큰 제외 (버프 경감 0 피해 포함)
          if (isZeroDamageToken(t)) {
            return true;
          }
          return origIsExcluded(cleanText);
        };
      }

      // 3) 타겟 셀렉터 가드: HP 회복 시 베어러/동료 HP바를 초록색으로 정확히 타겟팅하고, 다이스 오발 원천 차단
      if (typeof resolveChainTargetSelector === 'function') {
        const origResolve = resolveChainTargetSelector;
        window.resolveChainTargetSelector = function(tokenText, fullPlainText) {
          const t = String(tokenText || '').trim();
          const full = String(fullPlainText || '');

          const compNameStr = (typeof getCompName === 'function') ? getCompName() : '동료';
          const currentBearerName = (typeof bearerName !== 'undefined' && bearerName) ? bearerName : '베어러';

          const hasCompInToken = t.includes(compNameStr) || /동료|워리어|소서러|마검사|리퍼|데드로|릴리|센|마윤겸/.test(t);
          const hasBearerInToken = t.includes(currentBearerName) || /베어러|파이터|검객|메이지|등지기/.test(t);

          const hasCompInFull = hasCompInToken || full.includes(compNameStr) || /동료|워리어|소서러|마검사|리퍼|데드로|릴리|센|마윤겸/.test(full);
          const hasBearerInFull = hasBearerInToken || full.includes(currentBearerName) || /베어러|파이터|검객|메이지|등지기/.test(full);

          const isPartyWide = /아군\s*전체|파티\s*(?:전원|전체)|베어러\s*(?:및|와)\s*(?:동료|${compNameStr})/.test(full);

          // 배낭/자원/수동 조정 토큰은 대시보드 하이라이트 제외 (전투 중 영약 복용/치료/부활은 HP바로 연결)
          if (/휘석|영약|생환/.test(t) && !/회복\s*영약\s*복용|영약\s*(?:투여|치료)|부활/.test(full)) {
            return { selector: null, color: 'gray', isHitImpact: false };
          }
          if (/방어막\s*(?:조정|설정|수동)|동료\s*방어막\s*(?:조정|설정)|수동\s*방어막/.test(full) || /방어막\s*(?:조정|설정|수동)|수동\s*방어막/.test(t)) {
            return { selector: null, color: 'gray', isHitImpact: false };
          }

          // 0) 회피 / 빗나감 / 0 피해 토큰 감지: 타격 임팩트 및 하이라이트 원천 차단 (버프 경감 0 피해 포함)
          const isMissOrZeroDamage = isZeroDamageToken(t);
          if (isMissOrZeroDamage) {
            return { selector: null, color: 'gray', isHitImpact: false };
          }

          // 0.4) 방어/피격 경감 버프 토큰 (쳐내고 베기, 피격 피해 감소 등): 상태 트레이에 버프(보라색)로 하이라이트하고 피격 임팩트 원천 차단
          const isDefensiveReductionToken = /(?:피격\s*(?:피해\s*)?-?\d+\s*(?:감소|경감)|피격.*(?:감소|경감|무효|면역)|(?:감소|경감|무효화?).*피격|쳐내고\s*베기|성염\s*인챈트|백색\s*철벽|결사의\s*수호|육탄\s*엄호|투지\s*발휘|전열의\s*고함|복수의\s*칼날|불굴의\s*방파제|무영의\s*검무|약초\s*연무|생사\s*역전)/.test(t);
          if (isDefensiveReductionToken) {
            if (hasCompInToken || (hasCompInFull && !hasBearerInToken)) {
              return { selector: '#comp-status-tray, #comp-resource-panel', color: 'purple', isStatusChip: true, isCompContext: true, isHitImpact: false };
            }
            return { selector: '#bearer-status-tray, #bearer-resource-panel', color: 'purple', isStatusChip: true, isCompContext: false, isHitImpact: false };
          }

          // 0.5) 적 공격 피격 토큰 직접 처리 (피격 하이라이트 누락 방지 - 실제 1 이상 피해 피격 컨텍스트에서만 발동, 0 피해 제외)
          const isEnemyAttackContext = /적\s*(?:단일|광역)\s*공격|👹|대리\s*흡수/.test(full) && !/\[베어러\s*공격\]|\[동료\s*공격\]|\[원격\s*투영/.test(full);
          const isActualHitToken = !isMissOrZeroDamage && (
            /피격\s*:\s*[1-9]\d*\s*피해|대리\s*흡수\s*:\s*[1-9]\d*\s*피해/.test(t) ||
            (/피격/.test(t) && /(?<!\d)[1-9]\d*\s*피해/.test(t))
          );
          if (!isDefensiveReductionToken && isEnemyAttackContext && isActualHitToken) {
            if (hasCompInToken || (hasCompInFull && !hasBearerInToken)) {
              return { selector: '#comp-hp-bar, #comp-resource-panel', color: 'red', isHitImpact: true, isCompContext: true };
            }
            return { selector: '#hp-bar, #bearer-resource-panel', color: 'red', isHitImpact: true, isCompContext: false };
          }

          // 1) HP 회복 / 치유 / 부활 (최우선 판정: 영약 복용 시 HP바 초록색 점등!)
          const isHealingToken = /회복|치유|부활|^\+\d+$/.test(t) || (/^\d+$/.test(t) && /부활|전선\s*복귀/.test(full));
          const isHealingContext = /회복|치유|부활|영약|생명\s*전이/.test(full) || (/HP\s*\+\d+/.test(full) && !/피해/.test(t));
          if (isHealingToken && isHealingContext && !/피해|과열|냉각|벤트/.test(t)) {
            if (isPartyWide) {
              return { selector: '#hp-bar, #comp-hp-bar, #bearer-resource-panel, #comp-resource-panel', color: 'green' };
            }
            if (hasCompInToken || (hasCompInFull && !hasBearerInFull) || /\[동료|동료.*(?:치료|복귀|HP)|${compNameStr}.*(?:HP|회복|부활)/.test(full)) {
              return { selector: '#comp-hp-bar, #comp-resource-panel', color: 'green', isCompContext: true };
            }
            return { selector: '#hp-bar, #bearer-resource-panel', color: 'green', isCompContext: false };
          }

          // 2) 실제 HP 직접 차감 / 자해 / 반동 / 유지비 / 지속피해 (빨간색 HP바 타격 임팩트)
          const isHpLossToken = /^-\d+$/.test(t) || /차감|지불/.test(t);
          const isHpLossContext = /자해|반동|유지비|지속\s*피해|지속피해|실제\s*HP\s*-\d+|차감|지불/.test(full);
          if (isHpLossToken && isHpLossContext) {
            if (hasCompInToken || (hasCompInFull && !hasBearerInFull) || /타오르는\s*칼날|동료\s*지속\s*피해|${compNameStr}/.test(full)) {
              return { selector: '#comp-hp-bar, #comp-resource-panel', color: 'red', isHitImpact: true, isCompContext: true };
            }
            return { selector: '#hp-bar, #bearer-resource-panel', color: 'red', isHitImpact: true, isCompContext: false };
          }

          // 3) 과열 / 냉각 / 벤트
          if (/과열|냉각|벤트/.test(t) || (/과열|냉각|벤트/.test(full) && (/^[+-]\d+$/.test(t) || /^\d+\s*\/\s*100$/.test(t)))) {
            const isCooling = /-\d+|냉각|벤트/.test(t) || /-\d+|냉각|벤트/.test(full);
            return { selector: '#heat-bar, #bearer-resource-panel', color: isCooling ? 'blue' : 'red' };
          }

          // 4) 방어막 획득 / 차감 (단, 방어막 무시 피해는 제외)
          const isShieldBypassDmg = /방어막.*무시|무시하고.*피해/.test(t);
          if (!isShieldBypassDmg && (/방어막/.test(t) || (/방어막/.test(full) && /방어막\s*\d+\s*획득|방어막\s*(?:[+-]?\d+|유지|갱신)/.test(full) && !/방어막.*무시|무시하고.*피해/.test(full)))) {
            if (/수동|조정|설정/.test(full)) {
              return { selector: null, color: 'gray', isHitImpact: false };
            }
            if (hasCompInToken || (hasCompInFull && !hasBearerInFull)) {
              return { selector: '#comp-shield-bar, #comp-resource-panel', color: 'blue', isCompContext: true };
            }
            return { selector: '#shield-bar, #bearer-resource-panel', color: 'blue', isCompContext: false };
          }

          // 5) 마탄 차징
          if (/마탄|차징/.test(t) || (/차징|마탄/.test(full) && (/^\d+\s*[\/]\s*3$/.test(t) || /차징\s*\+\d+/.test(t)))) {
            return { selector: '#sen-charge-tray, #comp-resource-panel', color: 'purple', isCompContext: true };
          }

          // 5.5) 단일 타겟 지정 공격의 적 개체 하이라이트 정밀 판정 (사신의 낫질 등 단일기 시 전체 하이라이트 오발 원천 차단)
          let headerTargetEnemy = null;
          if (typeof syncedEnemies !== 'undefined' && Array.isArray(syncedEnemies)) {
            const isExplicitAoeScope = /🎯\s*적\s*전체|적\s*전체\s*광역|광역\s*피해량/.test(full) || /적\s*전체|광역/.test(t);
            if (!isExplicitAoeScope) {
              for (const en of syncedEnemies) {
                if (en && en.name && full.includes(`🎯${en.name}`)) {
                  headerTargetEnemy = en;
                  break;
                }
              }
            }
          }

          if (headerTargetEnemy) {
            const isDamageToken = !isMissOrZeroDamage && /피해|명중|스침|처치|잔여 HP|타격|치명타|기폭|-\d+\s*➔\s*HP/.test(t);
            if (isDamageToken) {
              return {
                selector: `[data-enemy-uid="${headerTargetEnemy.uid}"], [data-enemy-uid="${headerTargetEnemy.uid}"] .enemy-card-row1`,
                color: 'red',
                isHitImpact: true,
                enemyUid: headerTargetEnemy.uid
              };
            }
            const isEnemyDebuffToken = /방어\s*약화|방약|행동\s*제약|지속\s*피해|지속피해|DoT|도발|공격력\s*-\d+|공\s*-\d+/.test(t);
            if (isEnemyDebuffToken) {
              return {
                selector: `[data-enemy-uid="${headerTargetEnemy.uid}"] .enemy-card-row-status, [data-enemy-uid="${headerTargetEnemy.uid}"]`,
                color: 'purple',
                isStatusChip: true,
                enemyUid: headerTargetEnemy.uid
              };
            }
          }

          // 6) 그 외 타격/버프/디버프는 origResolve에 위임하되, #btn-open-bag 및 오발된 #dice-panel 방어
          const res = origResolve(tokenText, fullPlainText);
          if (res) {
            // 배낭 버튼(#btn-open-bag) 하이라이트 원천 차단
            if (res.selector === '#btn-open-bag') {
              return { selector: null, color: 'gray', isHitImpact: false };
            }
            // 뜬금없는 다이스 패널(#dice-panel) 하이라이트 오발 차단: 오직 실제 주사위 판정 토큰만 허용!
            if (res.selector === '#dice-panel') {
              const isActualDice = /1d20|2d20|\b[12]d20\b/.test(t) || (/주사위|판정|굴림/.test(full) && /^\d+$/.test(t) && !/HP|피해|과열|냉각|방어막|차징/.test(full));
              if (!isActualDice) {
                return { selector: null, color: 'gray', isHitImpact: false };
              }
            }
            if (res.isHitImpact) {
              if (isMissOrZeroDamage || isZeroDamageToken(t)) {
                res.selector = null;
                res.isHitImpact = false;
                res.color = 'gray';
              }
            }
            return res;
          }
          return { selector: null, color: 'gray', isHitImpact: false };
        };
      }
    };
    if (typeof window !== 'undefined') {
      patchHighlightEngine();
      if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', patchHighlightEngine);
      }
    }
  })();