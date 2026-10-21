/* [Phase 3] 룰북 v2.24 베어러 전체 스킬 데이터베이스 (4클래스 × 14종 = 총 56종) */
  const BEARER_SKILL_DB = {
    // ==================== 1. 파이터 (14종) ====================
    'f_1_1': {
      id: 'f_1_1', cls: '파이터', reqLv: 1, circle: '0', circleLabel: '캔트립',
      name: '쾌속 찌르기', cost: 0, dmg: 4, isAoe: false, isAttack: true, isPassive: false,
      subText: '단일 4(직전실패 6) 피해',
      desc: '고정 4 피해. 직전 라운드에 자신의 공격 명중 판정이 실패(대실패 포함)했다면 고정 6 피해를 입힌다. [과열 +0]'
    },
    'f_1_2': {
      id: 'f_1_2', cls: '파이터', reqLv: 1, circle: '1', circleLabel: '1서클',
      name: '쳐내고 베기', cost: 10, dmg: 6, isAoe: false, isAttack: true, isPassive: false,
      subText: '단일 6 피해 · 피격 -3',
      desc: '단일 적에게 고정 6 피해를 입히고, 이번 라운드 동안 자신이 받는 피격 피해가 고정 3 감소한다. [과열 +10]'
    },
    'f_1_3': {
      id: 'f_1_3', cls: '파이터', reqLv: 1, circle: '1', circleLabel: '1서클',
      name: '비승참', cost: 10, dmg: 7, isAoe: false, isAttack: true, isPassive: false,
      subText: '단일 7 피해 · 비행/광역 유리',
      desc: '수직으로 높게 도약해 대각선 위쪽으로 백색 검기를 베어 올린다. 단일 적에게 고정 7 피해를 입힌다. 대상이 비행·체공 형태의 적이거나, 이번 라운드에 광역 공격 또는 충전 인텐트를 선언한 상태라면 명중 판정에 [유리함]을 적용한다. [과열 +10]'
    },
    'f_1_4': {
      id: 'f_1_4', cls: '파이터', reqLv: 1, circle: '2', circleLabel: '2서클',
      name: '백색 철벽', cost: 30, dmg: 0, isAoe: false, isAttack: false, isPassive: false,
      subText: '방어막 9 · 피격 -3 · 수호선택',
      desc: '방어막 9를 획득하고, 이번 라운드 동안 자신이 받는 모든 피격 피해가 3 감소한다. 시전 시 [일반 전개(자신만 보호)] 또는 [결사의 수호(동료 단일 공격 강제 전환 / 광역 시 아군 총합 피해를 방어막과 자신의 HP로 전량 흡수)] 중 하나를 선언한다. [과열 +30]'
    },
    'f_1_5': {
      id: 'f_1_5', cls: '파이터', reqLv: 1, circle: '3', circleLabel: '3서클', reqHeat: 40,
      name: '단죄의 연격 난무', cost: 50, dmg: 16, isAoe: false, isAttack: true, isPassive: false,
      subText: '단일 16 피해 · 적공격 -3',
      desc: '[조건: 현재 과열 40 이상 시전 가능] 단일 적에게 고정 16 피해. 적의 인텐트에 동료가 포함되어 있을 때(동료 단일 또는 광역 공격), 적중 시 대상의 이번 라운드 공격 피해량을 고정 3 감소시킨다(광역 시 아군 각각 -3). [과열 +50]'
    },
    'f_2_1': {
      id: 'f_2_1', cls: '파이터', reqLv: 2, circle: '1', circleLabel: '1서클',
      name: '만월베기', cost: 10, dmg: 4, isAoe: true, isAttack: true, isPassive: false,
      subText: '광역 4 피해 · 적공격 -1',
      desc: '적 전체에게 각각 고정 4 광역 피해를 입히고, 적중한 적이 이번 라운드에 가하는 공격 피해량을 고정 -1 감소시킨다. [과열 +10]'
    },
    'f_2_2': {
      id: 'f_2_2', cls: '파이터', reqLv: 2, circle: '0', circleLabel: '캔트립',
      name: '방패 파괴자', cost: 0, dmg: 2, isAoe: false, isAttack: true, isPassive: false,
      subText: '2(3) 피해 · 방어약화 부여',
      desc: '단일 적에게 고정 2 피해를 입히고, 적중 시 대상에게 [방어 약화](다음 피격 +3)를 부여한다. 대상의 인텐트에 자신(베어러)이 포함되어 있을 때(베어러 단일 또는 광역 공격)는 고정 3 피해를 입힌다. [과열 +0]'
    },
    'f_2_3': {
      id: 'f_2_3', cls: '파이터', reqLv: 2, circle: '2', circleLabel: '2서클',
      name: '스프링보드', cost: 30, dmg: 0, isAoe: false, isAttack: false, isPassive: false,
      subText: '동료 피격 무효 · 유리함 & +3',
      desc: '별도의 판정 없이 발동한다. 방패를 발판 삼아 컴패니언을 높게 띄워 올려, 이번 라운드 동안 컴패니언이 받는 모든 직접 피격 피해를 0으로 무효화하고, 컴패니언의 이번 라운드 공격에 [유리함] 및 고정 피해 +3을 부여한다. [과열 +30]'
    },
    'f_3_1': {
      id: 'f_3_1', cls: '파이터', reqLv: 3, circle: '2', circleLabel: '2서클',
      name: '무결점의 방어', cost: 30, dmg: 0, isAoe: false, isAttack: false, isPassive: false,
      subText: '다중 인텐트 [최대-최소] 피격',
      desc: '시전 시 원한다면 컴패니언을 향한 적의 단일 공격 인텐트 1개를 베어러 자신에게로 강제 전환할 수 있다. 이번 라운드 베어러에게 적중한 공격들 중 [가장 큰 피해량 - 가장 작은 피해량]만큼만 최종 피해를 받는다(최대=최소이거나 1개만 적중 시 피해 0 무효화). [과열 +30]'
    },
    'f_3_2': {
      id: 'f_3_2', cls: '파이터', reqLv: 3, circle: '1', circleLabel: '1서클', ignoreRestriction: true,
      name: '군신의 혼', cost: 10, dmg: 0, isAoe: false, isAttack: false, isPassive: false,
      subText: '상태이상 정화·면역 · 피해 +3',
      desc: '[행동 제약] 상태에서도 선언 가능. 판정 없이 자신의 모든 상태이상을 즉시 소멸시키고, 유지되는 동안 모든 상태이상에 완전 면역이 되며 파이터의 모든 직접 타격 피해량이 고정 +3 증가한다. (매 라운드 종료 시 유지비 [과열 +10], 벤트 선언 시 해제) [과열 +10]'
    },
    'f_3_3': {
      id: 'f_3_3', cls: '파이터', reqLv: 3, circle: 'var', circleLabel: '가변 서클',
      name: '성염 인챈트', cost: '10~50', dmg: 2, isAoe: true, isAttack: true, isPassive: false,
      subText: '과열 10당 광역 2피해 & 피격 -1',
      desc: '시전 시 지불할 과열을 10 단위로 직접 선언(10/20/30/40/50)하고 적 전체에게 광역 공격 판정을 굴린다. 지불한 과열 10당 이번 라운드 자신이 받는 피격 피해가 고정 1 감소(최대 5 경감)하며, 적중 시 지불한 과열 10당 고정 2의 광역 피해(최대 10 피해)를 입힌다. [과열 10~50]'
    },
    'f_4_1': {
      id: 'f_4_1', cls: '파이터', reqLv: 4, circle: 'passive', circleLabel: '패시브',
      name: '견뎌내기', cost: 0, dmg: 0, isAoe: false, isAttack: false, isPassive: true,
      subText: '전투시작·매R 종료 시 방어막 3',
      desc: '[4레벨 패시브] 전투 시작 시 및 매 라운드 종료 시, 파이터는 [방어막 3]을 획득한다(비중첩 갱신 원칙 적용).'
    },
    'f_4_2': {
      id: 'f_4_2', cls: '파이터', reqLv: 4, circle: 'passive', circleLabel: '패시브',
      name: '주의 집중', cost: 0, dmg: 0, isAoe: false, isAttack: false, isPassive: true,
      subText: '인텐트 최소 2개 유도 · 피격 -2',
      desc: '[4레벨 패시브] 적들의 공격 인텐트 중 최소 2개(전장에 적 인텐트가 1개뿐이라면 해당 1개)가 반드시 베어러를 포함하도록 강제한다. 이번 라운드 베어러가 받는 모든 피격 피해가 고정 2 감소한다.'
    },
    'f_4_3': {
      id: 'f_4_3', cls: '파이터', reqLv: 4, circle: 'passive', circleLabel: '패시브',
      name: '강경 속박', cost: 0, dmg: 0, isAoe: false, isAttack: false, isPassive: true,
      subText: '방어약화 2회 유지 · 공깎 +1R',
      desc: '[4레벨 패시브] 파이터가 적에게 부여한 [방어 약화]가 1회 피격으로 소멸하지 않고 2회 피격까지 유지된다. 또한 파이터가 적에게 부여한 공격 피해량 감소 효과가 다음 라운드까지 1라운드 더 연장된다.'
    },

    // ==================== 2. 검객 (14종) ====================
    's_1_1': {
      id: 's_1_1', cls: '검객', reqLv: 1, circle: '0', circleLabel: '캔트립',
      name: '호선참', cost: 0, dmg: 5, isAoe: false, isAttack: true, isPassive: false,
      subText: '단일 고정 5 피해',
      desc: '검집에서 빛의 속도로 칼날을 뽑아 적의 전면을 베어 넘긴다. 단일 적 고정 5 피해. [과열 +0]'
    },
    's_1_2': {
      id: 's_1_2', cls: '검객', reqLv: 1, circle: '1', circleLabel: '1서클',
      name: '윤무', cost: 10, dmg: 4, isAoe: true, isAttack: true, isPassive: false,
      subText: '적 전체 고정 4 광역 피해',
      desc: '전방 적 전체에게 고정 4 광역 피해를 입힌다. [과열 +10]'
    },
    's_1_3': {
      id: 's_1_3', cls: '검객', reqLv: 1, circle: '1', circleLabel: '1서클',
      name: '무형보', cost: 10, dmg: 0, isAoe: false, isAttack: false, isPassive: false,
      subText: '자신 향한 적 공격 1회 완전회피',
      desc: '적의 인텐트에 자신(베어러)이 포함되어 있을 때 선언할 수 있다. 이번 라운드에 자신을 향한 적의 공격 1회를 완벽 회피(피해 0)한다(광역 공격 피격 시 컴패니언은 정상 피격). [과열 +10]'
    },
    's_1_4': {
      id: 's_1_4', cls: '검객', reqLv: 1, circle: '2', circleLabel: '2서클',
      name: '쌍영참', cost: 30, dmg: 6, isAoe: true, isAttack: true, isPassive: false,
      subText: '광역 6 피해 / 단일 9 피해 택1',
      desc: '좌우 대칭을 이루는 두 줄기 참격을 동시에 그어낸다. 1회의 명중 판정을 굴려 [적 전체 고정 6 광역 피해]를 입히거나, [단일 적 1체에게 교차 적중시켜 고정 9 피해]를 입힌다. [과열 +30]'
    },
    's_1_5': {
      id: 's_1_5', cls: '검객', reqLv: 1, circle: '3', circleLabel: '3서클', reqHeat: 40,
      name: '용미섬', cost: 50, dmg: 14, isAoe: true, isAttack: true, isPassive: false,
      subText: '적 전체 고정 14 광역 피해',
      desc: '[조건: 현재 과열 40 이상 시전 가능] 범위 내 모든 적에게 고정 14 광역 피해를 입힌다. [과열 +50]'
    },
    's_2_1': {
      id: 's_2_1', cls: '검객', reqLv: 2, circle: '2', circleLabel: '2서클',
      name: '천공일점', cost: 30, dmg: 6, isAoe: false, isAttack: true, isPassive: false,
      subText: '단일 6 피해 · 지속피해 2(2R)',
      desc: '단일 적에게 고정 6 피해를 입히고, 적중 시 대상에게 [지속 피해: 2]를 2라운드간 부여한다. 대상이 비행·체공 형태의 적이거나 이번 라운드에 광역 공격 또는 충전 인텐트를 선언한 상태라면 명중 판정에 [유리함]을 적용한다. [과열 +30]'
    },
    's_2_2': {
      id: 's_2_2', cls: '검객', reqLv: 2, circle: '1', circleLabel: '1서클',
      name: '비연참', cost: 10, dmg: 3, isAoe: false, isAttack: true, isPassive: false,
      subText: '단일 3 피해 · AC +2 · 회피반격 4',
      desc: '공중제비를 돌며 단일 적에게 고정 3 피해를 입히고, 이번 라운드 동안 베어러의 방어도(AC)를 +2 증가시킨다. 이번 라운드 자신을 향한 적의 공격이 빗나갈 때마다 해당 공격 주체에게 판정 없이 고정 4 피해를 즉시 입힌다. [과열 +10]'
    },
    's_2_3': {
      id: 's_2_3', cls: '검객', reqLv: 2, circle: '0', circleLabel: '캔트립', alwaysAdv: true,
      name: '환영신검', cost: 0, dmg: 3, isAoe: false, isAttack: true, isPassive: false,
      subText: '단일 3 피해 · 상시 [유리함]',
      desc: '공격 범위를 예측하기 어렵게 검을 흔들어 단일 적에게 고정 3 피해를 입힌다. 이 공격의 명중 판정에는 항상 [유리함]을 적용한다. [과열 +0]'
    },
    's_3_1': {
      id: 's_3_1', cls: '검객', reqLv: 3, circle: '2', circleLabel: '2서클',
      name: '질풍참', cost: 30, dmg: 5, isAoe: true, isAttack: true, isPassive: false,
      subText: '광역 5 피해 · 지속 2(2R) · AC -2',
      desc: '이번 라운드 베어러의 방어도(AC)가 2 감소하는 대신, 적 전체에게 고정 5 광역 피해를 입히고 적중한 모든 대상에게 [지속 피해: 2]를 2라운드간 부여한다. [과열 +30]'
    },
    's_3_2': {
      id: 's_3_2', cls: '검객', reqLv: 3, circle: '2', circleLabel: '2서클',
      name: '비월절명', cost: 30, dmg: 5, isAoe: false, isAttack: true, isPassive: false,
      subText: '단일 5(사각/회피시 9) 피해 · AC +1',
      desc: '단일 적에게 고정 5 피해를 입히고 이번 라운드 베어러의 방어도(AC)를 +1 증가시킨다. 직전 라운드에 자신을 향한 적의 공격을 회피([무형보] 또는 적 공격 빗나감)했거나 대상의 이번 라운드 인텐트에 베어러가 포함되어 있지 않다면(사각 포착), 최종 피해량이 고정 +4 증가(총 9 피해)한다. [과열 +30]'
    },
    's_3_3': {
      id: 's_3_3', cls: '검객', reqLv: 3, circle: '1', circleLabel: '1서클', alwaysAdv: true,
      name: '쌍월연참', cost: 10, dmg: 3, isAoe: false, isAttack: true, isPassive: false,
      subText: '단일 3(자연15+ 시 8) 피해 · 유리함',
      desc: '두 번의 베기를 연속으로 사용해 단일 적에게 고정 3 피해를 입힌다. 명중 판정에 항상 [유리함]을 적용하며, 명중 판정의 순수 주사위 결과값이 15 이상일 때 두 번의 베기가 모두 적중하여 고정 8 피해를 입힌다. [과열 +10]'
    },
    's_4_1': {
      id: 's_4_1', cls: '검객', reqLv: 4, circle: 'passive', circleLabel: '패시브',
      name: '회귀일원', cost: 0, dmg: 0, isAoe: false, isAttack: false, isPassive: true,
      subText: '전R 직접타격 8+ 시 이번R 피해 +2',
      desc: '[4레벨 패시브] 지난 라운드에 베어러가 직접 타격(스침 및 지속 피해 제외)으로 적들의 실제 HP에 총합 8 이상의 피해를 주었다면, 이번 라운드 베어러가 가하는 모든 공격의 피해량이 고정 +2 증가한다.'
    },
    's_4_2': {
      id: 's_4_2', cls: '검객', reqLv: 4, circle: 'passive', circleLabel: '패시브',
      name: '홍련지세', cost: 0, dmg: 0, isAoe: false, isAttack: false, isPassive: true,
      subText: '무피격 라운드 종료 시 적 전체 3 피해',
      desc: '[4레벨 패시브] 베어러가 아무런 HP 피해도 입지 않은 라운드 종료 시, 검끝에서 성염의 잔불이 만개하여 적 전체에게 판정 없이 고정 3 피해를 입힌다.'
    },
    's_4_3': {
      id: 's_4_3', cls: '검객', reqLv: 4, circle: 'passive', circleLabel: '패시브',
      name: '맹염', cost: 0, dmg: 0, isAoe: false, isAttack: false, isPassive: true,
      subText: '단일공격 +1 · 치명타 피해 +7로 강화',
      desc: '[4레벨 패시브] 베어러의 모든 단일 대상 공격 피해량이 고정 +1 증가하며, 치명타 발생 시 추가 피해가 +5에서 +7로 강화된다.'
    },

    // ==================== 3. 메이지 (14종) ====================
    'm_1_1': {
      id: 'm_1_1', cls: '메이지', reqLv: 1, circle: '0', circleLabel: '캔트립',
      name: '성염구슬', cost: 0, dmg: 5, isAoe: false, isAttack: true, isPassive: false,
      subText: '단일 고정 5 피해',
      desc: '원거리 단일 적에게 백색 성염 탄환을 투사하여 고정 5 피해를 입힌다. [과열 +0]'
    },
    'm_1_2': {
      id: 'm_1_2', cls: '메이지', reqLv: 1, circle: '1', circleLabel: '1서클',
      name: '성염 치유', cost: 10, dmg: 0, isAoe: false, isAttack: false, isPassive: false,
      subText: '아군 1체 HP 6 확정 회복',
      desc: '판정 없이 아군 1체(자신 또는 컴패니언)의 HP를 고정 6 회복한다. [과열 +10]'
    },
    'm_1_3': {
      id: 'm_1_3', cls: '메이지', reqLv: 1, circle: '1', circleLabel: '1서클',
      name: '성염 장전', cost: 0, dmg: 0, isAoe: false, isAttack: false, isPassive: false,
      subText: '마법 충전(최대2) · 무행동 일괄개방',
      desc: '보유한 다른 마법(캔트립~3서클, 최대 2개) 1개를 선언하여 해당 마법의 과열을 지불하고 지팡이에 [충전]한다(4서클 충전 불가). 충전된 마법이 존재하는 동안 매 라운드 종료 시 과열 +10 상승(벤트 시에도 유지). 다음 라운드부터 자신의 턴에 행동 소모 없이 일괄 개방 가능(1회 명중 굴림 일괄 적용, 추가 과열 없음). [자체 과열 +0]'
    },
    'm_1_4': {
      id: 'm_1_4', cls: '메이지', reqLv: 1, circle: '2', circleLabel: '2서클',
      name: '염화기둥', cost: 30, dmg: 7, isAoe: true, isAttack: true, isPassive: false,
      subText: '적 전체 고정 7 광역 피해',
      desc: '적 전체에게 고정 7 광역 피해를 입힌다. [과열 +30]'
    },
    'm_1_5': {
      id: 'm_1_5', cls: '메이지', reqLv: 1, circle: '3', circleLabel: '3서클', reqHeat: 40,
      name: '성염 낙하', cost: 50, dmg: 18, isAoe: true, isAttack: true, isPassive: false,
      subText: '적 전체 고정 18 광역 피해',
      desc: '[조건: 현재 과열 40 이상 시전 가능] 적 전체에게 고정 18 광역 피해를 입힌다. [과열 +50]'
    },
    'm_2_1': {
      id: 'm_2_1', cls: '메이지', reqLv: 2, circle: '2', circleLabel: '2서클', ignoreShield: true,
      name: '성염의 소용돌이', cost: 30, dmg: 3, isAoe: true, isAttack: true, isPassive: false,
      subText: '방어막 무시 광역 3 · 지속 2(2R)',
      desc: '휘몰아치는 성염의 소용돌이를 일으켜 적 전체에게 방어막(Shield)을 무시하는 고정 3 광역 피해를 입히고, 적중한 모든 대상에게 [지속 피해: 2]를 2라운드간 부여한다. [과열 +30]'
    },
    'm_2_2': {
      id: 'm_2_2', cls: '메이지', reqLv: 2, circle: 'var', circleLabel: '가변 서클',
      name: '불꽃의 비', cost: '10~50', dmg: 2, isAoe: true, isAttack: true, isPassive: false,
      subText: '과열 10당 광역 2피해 · 70+시 차턴+3',
      desc: '시전 시 지불할 과열을 10 단위로 직접 선언(10/20/30/40/50)하고, 지불한 과열 10당 적 전체에게 고정 2 광역 피해를 입힌다. 이 스킬의 과열이 누적된 후 베어러의 현재 과열이 70 이상이라면 다음 라운드 베어러의 공격 피해량이 고정 +3 증가한다. [과열 10~50]'
    },
    'm_2_3': {
      id: 'm_2_3', cls: '메이지', reqLv: 2, circle: '2', circleLabel: '2서클', alwaysAdv: true,
      name: '신성한 폭발', cost: 30, dmg: 5, isAoe: true, isAttack: true, isPassive: false,
      subText: '광역 5 피해 · 상시 [유리함]',
      desc: '성염구슬을 적진 한가운데 바닥에 쏘아 터뜨린다. 적 전체에게 고정 5 광역 피해를 입히며, 이 공격의 명중 판정에는 항상 [유리함]을 적용한다. [과열 +30]'
    },
    'm_3_1': {
      id: 'm_3_1', cls: '메이지', reqLv: 3, circle: '2', circleLabel: '2서클',
      name: '침묵의 족쇄', cost: 30, dmg: 0, isAoe: false, isAttack: false, isPassive: false,
      subText: '무판정 단일 적 [행동 제약] 확정',
      desc: '별도의 명중 판정 없이 단일 적 1체를 지정하여 성염의 사슬로 결박한다. 대상에게 이번 라운드 동안 [행동 제약](충전/광역/상태이상 기술 불가, 기본 단일 공격만 가능)을 확정 부여한다. [과열 +30]'
    },
    'm_3_2': {
      id: 'm_3_2', cls: '메이지', reqLv: 3, circle: '1', circleLabel: '1서클',
      name: '응축된 방벽', cost: 10, dmg: 0, isAoe: false, isAttack: false, isPassive: false,
      subText: '아군 1체 [방어막 7] 확정 부여',
      desc: '별도의 판정 없이 아군 1체(자신 또는 컴패니언)를 지정하여 고밀도의 성염 보호막을 두른다. 대상에게 [방어막 7]을 부여한다(비중첩 갱신 원칙 적용). [과열 +10]'
    },
    'm_3_3': {
      id: 'm_3_3', cls: '메이지', reqLv: 3, circle: '4', circleLabel: '4서클', reqHeat: 10,
      name: '타오르는 칼날', cost: 70, dmg: 0, isAoe: false, isAttack: false, isPassive: false,
      subText: '동료 명중 공격 피해 +6 (유지 HP-1)',
      desc: '[조건: 현재 과열 10 이상 시전 가능] 별도의 판정 없이 컴패니언의 무기에 순백의 성염을 두른다. 유지되는 동안 컴패니언이 명중 판정을 굴려 적중시키는 모든 공격의 피해량이 고정 +6 증가한다. (매 라운드 종료 시 방어막 무시 동료 실제 HP 1 지불로 유지) [과열 +70]'
    },
    'm_4_1': {
      id: 'm_4_1', cls: '메이지', reqLv: 4, circle: 'passive', circleLabel: '패시브',
      name: '성염 저항', cost: 0, dmg: 0, isAoe: false, isAttack: false, isPassive: true,
      subText: '과열 AC 페널티 면제 · 초과자해 -1',
      desc: '[4레벨 패시브] 과열 단계([경고] 및 [임계])로 인한 방어도(AC) 감소 불이익을 받지 않는다. 또한 과열이 100을 초과했을 때 입는 초과 과열 반동 자해 피해량이 고정 1 감소(최소 0)한다.'
    },
    'm_4_2': {
      id: 'm_4_2', cls: '메이지', reqLv: 4, circle: 'passive', circleLabel: '패시브',
      name: '치유 증폭', cost: 0, dmg: 0, isAoe: false, isAttack: false, isPassive: true,
      subText: '영약 및 치유 스킬 회복량 +3 증가',
      desc: '[4레벨 패시브] 베어러가 사용하는 회복 영약 및 치유 스킬로 인한 모든 HP 회복량이 고정 +3 증가한다(성염 치유 HP 9 회복 / 회복 영약 HP 8 회복).'
    },
    'm_4_3': {
      id: 'm_4_3', cls: '메이지', reqLv: 4, circle: 'passive', circleLabel: '패시브',
      name: '강인함', cost: 0, dmg: 0, isAoe: false, isAttack: false, isPassive: true,
      subText: '상태이상 피격 시 즉시 [방어막 5]',
      desc: '[4레벨 패시브] 베어러가 적의 공격에 피격되어 상태이상([행동 제약], [방어 약화], [지속 피해])에 걸리거나 대실패 등으로 상태이상이 부여될 때마다 즉시 자신에게 [방어막 5]를 생성한다(비중첩 갱신 원칙 적용).'
    },

    // ==================== 4. 등지기 (14종) ====================
    'l_1_1': {
      id: 'l_1_1', cls: '등지기', reqLv: 1, circle: '0', circleLabel: '가변 캔트립',
      name: '인광탄', cost: '0~50', dmg: 4, isAoe: false, isAttack: true, isPassive: false,
      subText: '과열 0~50 · 단일 4~12 피해',
      desc: '시전 시 지불할 과열을 직접 선언(0 / 10 / 20 / 30 / 40 / 50)하여 단일 적을 타격한다. 과열 0 선언 시 일반 캔트립으로 발동해 고정 4 피해를 입히며([행동 제약] 시 사용 가능, 스침 없음), 과열 10 이상 선언 시 서클 기술로 발동해 [고정 2 + 지불한 과열 10당 2] 피해(10: 4 피해 / 20: 6 피해 / 30: 8 피해 / 40: 10 피해 / 50: 12 피해, 스침 피해 2 보장)를 입힌다. [과열 0~50]'
    },
    'l_1_2': {
      id: 'l_1_2', cls: '등지기', reqLv: 1, circle: '1', circleLabel: '1서클',
      name: '신기루 장막', cost: 10, dmg: 0, isAoe: false, isAttack: false, isPassive: false,
      subText: '아군 1체 장막 (5이하➔1, 5초과 -5)',
      desc: '아군 1체에게 장막 전개. 적의 공격이 명중할 때까지 유지된다. 5 이하 피해는 1로 줄이며(최대 2회 방어), 5 초과 피해는 5를 경감하고 즉시 소멸한다. [과열 +10]'
    },
    'l_1_3': {
      id: 'l_1_3', cls: '등지기', reqLv: 1, circle: '2', circleLabel: '2서클',
      name: '과부하 조광', cost: 30, dmg: 0, isAoe: false, isAttack: false, isPassive: false,
      subText: '동료 명중 공격마다 [+3 성염 기폭]',
      desc: '동료가 명중 판정을 굴려 적중시키는 모든 공격에 [성염 기폭: +3 피해]를 즉시 터뜨린다(광역 공격은 개별 적용). 2라운드부터 매 라운드 종료 시 [과열 +10]을 누적하여 유지 가능(벤트 선언 또는 탈진 시 해제). [과열 +30]'
    },
    'l_1_4': {
      id: 'l_1_4', cls: '등지기', reqLv: 1, circle: '2', circleLabel: '2서클',
      name: '환체 교란', cost: 30, dmg: 3, isAoe: false, isAttack: true, isPassive: false,
      subText: '[적 2체+] 단일 3 피해 · 인텐트 전환',
      desc: '[조건: 전장에 적이 2개체 이상일 때 시전 가능] 단일 적 1체에게 명중 판정을 굴려 적중 시 고정 3 피해를 입히며, 이번 라운드 대상의 인텐트(공격 목표)를 플레이어가 지정한 다른 적 1체로 강제 전환한다(교란된 적의 공격은 판정 없이 즉시 적중). [과열 +30]'
    },
    'l_1_5': {
      id: 'l_1_5', cls: '등지기', reqLv: 1, circle: '3', circleLabel: '3서클', reqHeat: 40,
      name: '환룡의 포효', cost: 50, dmg: 14, isAoe: true, isAttack: true, isPassive: false,
      subText: '광역 14 피해 · 아군 전체 HP +1(부활)',
      desc: '[조건: 현재 과열 40 이상 시전 가능] 적 전체에게 고정 14 피해를 입히고, 아군 전체(베어러 및 컴패니언)의 HP를 1 회복한다. 컴패니언이 탈진(HP 0) 상태라면 즉시 HP 1 상태로 전선에 복귀시킨다. [과열 +50]'
    },
    'l_2_1': {
      id: 'l_2_1', cls: '등지기', reqLv: 2, circle: '3', circleLabel: '3서클',
      name: '태양의 부름', cost: 50, dmg: 0, isAoe: false, isAttack: false, isPassive: false,
      subText: '자가 장막 · 단일공격 유도 · 적 불리함',
      desc: '별도의 판정 없이 발동한다. 베어러 자신에게 즉시 [신기루 장막]을 전개한다. 이번 라운드 모든 적의 단일 공격 인텐트 대상을 베어러 자신으로 강제 전환하며, 이번 라운드 베어러를 공격하는 모든 적의 명중 판정에 [불리함]을 강제한다. [과열 +50]'
    },
    'l_2_2': {
      id: 'l_2_2', cls: '등지기', reqLv: 2, circle: '1', circleLabel: '1서클', reqCompAlive: true,
      name: '별빛 유영', cost: 10, dmg: 0, isAoe: false, isAttack: false, isPassive: false,
      subText: '동료에게 타겟 전환 · 차턴 전원 유리함',
      desc: '별도의 판정 없이 발동한다(컴패니언 탈진 시 시전 불가). 이번 라운드 모든 적의 단일 공격 인텐트 대상을 컴패니언에게로 강제 전환하고, 다음 라운드 동안 모든 아군(베어러 및 컴패니언)의 공격 명중 판정에 [유리함]을 적용한다. [과열 +10]'
    },
    'l_2_3': {
      id: 'l_2_3', cls: '등지기', reqLv: 2, circle: '2', circleLabel: '2서클',
      name: '허상의 디딤돌', cost: 30, dmg: 0, isAoe: false, isAttack: false, isPassive: false,
      subText: '이번R 직접피격 0 무효 · 차턴 피해 +3',
      desc: '별도의 판정 없이 발동한다. 공중에 환영 바닥을 소환해 타고 올라 이번 라운드 동안 베어러가 받는 모든 직접 피격 피해를 0으로 무효화하고, 다음 라운드 베어러가 가하는 공격의 피해량이 고정 +3 증가한다. [과열 +30]'
    },
    'l_3_1': {
      id: 'l_3_1', cls: '등지기', reqLv: 3, circle: '3', circleLabel: '3서클',
      name: '빛의 파동', cost: 50, dmg: 0, isAoe: false, isAttack: false, isPassive: false,
      subText: '적 지속피해 +1R 연장 후 전량 기폭',
      desc: '[조건: 전장에 지속 피해가 걸린 적이 있을 때 시전 가능] 별도의 판정 없이 발동한다. 단일 적 1체에게 걸려 있는 모든 [지속 피해]의 남은 지속 시간을 일괄 +1라운드 연장한 뒤, [각 지속 피해 수치 × 남은 라운드 수]의 총합만큼 방어막을 무시하고 실제 HP를 즉시 차감한다(기폭 후 지속 피해 소멸). [과열 +50]'
    },
    'l_3_2': {
      id: 'l_3_2', cls: '등지기', reqLv: 3, circle: '4', circleLabel: '4서클', reqHalfHp: true, reqCompAlive: true,
      name: '원격 투영', cost: 70, dmg: 0, isAoe: false, isAttack: false, isPassive: false,
      subText: '[HP 50% 이하] 동료 데이터 투영 & 스킬 발동',
      desc: '[조건: 베어러의 현재 HP가 절반 이하 & 동료 생존 시 시전 가능] 이번 라운드 동안 컴패니언의 데이터(기본 AC, 판정 보너스 +2, 레벨 보너스, 보유 스킬 덱 등)를 베어러에게 투영하고, 현재 사용 가능한 동료 스킬(A/B/C) 중 1개를 선택하여 즉시 발동한다(복사본 독립 연산). [과열 +70]'
    },
    'l_3_3': {
      id: 'l_3_3', cls: '등지기', reqLv: 3, circle: '1', circleLabel: '1서클',
      name: '빛의 굴절', cost: 10, dmg: 0, isAoe: false, isAttack: false, isPassive: false,
      subText: '이번R 피격 합산 짝수➔아군유리 / 홀수➔적불리',
      desc: '별도의 판정 없이 발동한다. 이번 라운드 베어러가 받은 직접 피격 피해 최종 합산값이 짝수(0 포함)라면 다음 라운드 모든 아군의 공격 명중 판정에 [유리함]을 적용하고, 홀수라면 다음 라운드 모든 적의 공격 명중 판정에 [불리함]을 강제한다. [과열 +10]'
    },
    'l_4_1': {
      id: 'l_4_1', cls: '등지기', reqLv: 4, circle: 'passive', circleLabel: '패시브',
      name: '공명하는 등불', cost: 0, dmg: 0, isAoe: false, isAttack: false, isPassive: true,
      subText: '베어러&동료 동시 명중 적에게 +3 추가 피해',
      desc: '[4레벨 패시브] 한 라운드 내에 베어러와 컴패니언이 동일한 적에게 각각 명중 굴림을 굴려 적중 시, 두 사람의 행동이 모두 끝난 직후 성염이 공명하여 해당 적에게 고정 3 추가 피해를 입힌다.'
    },
    'l_4_2': {
      id: 'l_4_2', cls: '등지기', reqLv: 4, circle: 'passive', circleLabel: '패시브',
      name: '거울상 연성', cost: 0, dmg: 0, isAoe: false, isAttack: false, isPassive: true,
      subText: '명중 순수 17+ 시 무과열 1회 연속 발동',
      desc: '[4레벨 패시브] 베어러가 명중 판정을 굴리는 공격 스킬([원격 투영] 포함)을 시전했을 때, 순수 주사위 결과값이 17 이상이라면 추가 과열(및 차징 스택) 소모 없이 해당 스킬을 즉시 한 번 더 연속으로 발동한다(치명타 및 대성공은 첫 타격 1회만).'
    },
    'l_4_3': {
      id: 'l_4_3', cls: '등지기', reqLv: 4, circle: 'passive', circleLabel: '패시브',
      name: '인식 저해', cost: 0, dmg: 0, isAoe: false, isAttack: false, isPassive: true,
      subText: '적 명중 주사위 1~4 나올 시 적 자해 전환',
      desc: '[4레벨 패시브] 적이 공격 명중 판정을 굴렸을 때 최종 채택된 주사위 결과값이 5 미만(1~4)이라면, 공격의 목표가 공격자 본인으로 강제 전환(자해)되어 예고했던 고정 피해와 상태이상을 자기 자신에게 입힌다.'
    }
  };

  const DEFAULT_BEARER_DECKS = {
    '파이터': ['f_1_1', 'f_1_2', 'f_1_3', 'f_1_4', 'f_1_5'],
    '검객':   ['s_1_1', 's_1_2', 's_1_3', 's_1_4', 's_1_5'],
    '메이지': ['m_1_1', 'm_1_2', 'm_1_3', 'm_1_4', 'm_1_5'],
    '등지기': ['l_1_1', 'l_1_2', 'l_1_3', 'l_1_4', 'l_1_5']
  };

  function getBearerSkillById(id) {
    return BEARER_SKILL_DB[id] || null;
  }

  function getClassSkillList(cls = pickedClass) {
    return Object.values(BEARER_SKILL_DB).filter(sk => sk.cls === cls);
  }

  /* [Phase 4 & 5] 룰북 v2.24 컴패니언 전체 스킬 데이터베이스 (4클래스 × 9종 = 총 36종, 룰북 원문 100% 반영) */
  const COMP_SKILL_DB = {
    // ==================== 1. 워리어 - 데드로 펠더 (9종) ====================
    'w_1_1': {
      id: 'w_1_1', comp: '데드로', reqLv: 1, cd: 0,
      name: '승룡 올려베기', dmg: 6, isAoe: false, isAttack: true,
      subText: '단일 6(쿨기술 연격시 7·유리·적불리)',
      desc: '단일 적에게 고정 6 피해. 직전 라운드에 쿨다운이 있는 기술을 사용했다면(명중 여부 무관), 고정 7 피해를 입히고 이번 명중 판정에 [유리함]을 적용하며, 적중 시 대상의 이번 라운드 공격 굴림(광역 포함)에 [불리함]을 강제한다. [쿨다운: 없음]'
    },
    'w_1_2': {
      id: 'w_1_2', comp: '데드로', reqLv: 1, cd: 0,
      name: '투지 발휘', dmg: 3, isAoe: false, isAttack: true,
      subText: '단일 3(베어러타겟 유리) · 피격-3 · 도발',
      desc: '단일 적에게 고정 3 피해를 입힌다(지정한 적의 인텐트에 베어러가 포함되어 있을 때 명중 [유리함]). 적중 시 이번 라운드 동안 워리어는 [피격 피해 3 경감]과 [행동 제약] 면역을 얻고, 베어러를 노리는 적의 단일 공격 대상을 워리어로 강제 전환한다. [쿨다운: 없음]'
    },
    'w_1_3': {
      id: 'w_1_3', comp: '데드로', reqLv: 1, cd: 3,
      name: '폭풍 맹격', dmg: 6, isAoe: true, isAttack: true,
      subText: '적 전체 고정 6 광역 피해',
      desc: '적 전체에게 각각 고정 6 광역 피해를 입힌다. [쿨다운: 3라운드]'
    },
    'w_2_1': {
      id: 'w_2_1', comp: '데드로', reqLv: 2, cd: 2,
      name: '전열의 고함', dmg: 0, isAoe: false, isAttack: false,
      subText: '무판정 전체 도발 · 피격-3 · 적 전체 공-1',
      desc: '별도의 명중 판정 없이 발동한다. 이번 라운드 모든 적의 단일 공격 인텐트 대상을 워리어 자신으로 강제 전환한다. 이번 라운드 동안 워리어가 받는 모든 피격 피해가 고정 3 감소하며, 전장의 모든 적이 이번 라운드에 가하는 공격 피해량을 고정 -1 감소시킨다. [쿨다운: 2라운드]'
    },
    'w_2_2': {
      id: 'w_2_2', comp: '데드로', reqLv: 2, cd: 0,
      name: '파쇄의 갑옷치기', dmg: 4, isAoe: false, isAttack: true,
      subText: '단일 4(워리어타겟 6) 피해 · [방어 약화]',
      desc: '단일 적에게 고정 4 피해를 입히고, 적중 시 대상에게 [방어 약화](다음 피격 +3)를 부여한다. 대상의 이번 라운드 인텐트에 워리어 자신이 포함되어 있을 때(워리어 단일 또는 광역 공격)는 고정 6 피해를 입힌다. [쿨다운: 없음]'
    },
    'w_3_1': {
      id: 'w_3_1', comp: '데드로', reqLv: 3, cd: 2,
      name: '복수의 칼날', dmg: 4, isAoe: false, isAttack: true,
      subText: '단일 4 피해 · 피격-2 · 종료시 공격적에 3피해',
      desc: '단일 적에게 고정 4 피해를 입히고, 이번 라운드 동안 워리어가 받는 피격 피해가 고정 2 감소한다. 라운드 종료 시, 이번 라운드 동안 워리어를 공격 대상으로 지정(명중 여부 무관)한 모든 적에게 각각 판정 없이 고정 3 피해를 입힌다. [쿨다운: 2라운드]'
    },
    'w_3_2': {
      id: 'w_3_2', comp: '데드로', reqLv: 3, cd: 4,
      name: '참호 돌파', dmg: 5, isAoe: true, isAttack: true,
      subText: '광역 5 피해 · 적 명중 불리함 · 과열 -10 냉각',
      desc: '적 전체에게 각각 고정 5 피해를 입히고, 적중한 모든 대상의 이번 라운드 공격 명중 판정에 [불리함]을 강제한다. 대검이 일으킨 맞바람이 시전 즉시 베어러의 과열을 10 냉각한다. [쿨다운: 4라운드]'
    },
    'w_4_1': {
      id: 'w_4_1', comp: '데드로', reqLv: 4, cd: 3,
      name: '불굴의 방파제', dmg: 0, isAoe: false, isAttack: false,
      subText: '무판정 전체 도발 · 피격-4 · 피격당 광역 4반격',
      desc: '별도의 명중 판정 없이 발동한다. 이번 라운드 모든 적의 단일 공격 인텐트 대상을 워리어 자신으로 강제 전환하며, 워리어가 받는 모든 피격 피해가 고정 4 감소한다. 라운드 종료 시 워리어가 직접 피격당한 횟수(피해 0 포함) 1회당 고정 4 피해를 적 전체에게 판정 없이 입힌다. [쿨다운: 3라운드]'
    },
    'w_4_2': {
      id: 'w_4_2', comp: '데드로', reqLv: 4, cd: 3,
      name: '거신 단두대', dmg: 12, isAoe: false, isAttack: true,
      subText: '단일 12 피해 (HP절반↓/방어약화 시 유리 & 행동제약)',
      desc: '단일 적에게 고정 12 피해를 입힌다. 워리어의 현재 HP가 절반 이하이거나 대상에게 [방어 약화]가 걸려 있다면, 이번 명중 판정에 [유리함]을 적용하고 적중 시 대상에게 이번 라운드 동안 [행동 제약]을 부여한다. [쿨다운: 3라운드]'
    },

    // ==================== 2. 소서러 - 릴리 애쉬포드 (9종) ====================
    'so_1_1': {
      id: 'so_1_1', comp: '릴리', reqLv: 1, cd: 0,
      name: '마력 파동', dmg: 5, isAoe: false, isAttack: true,
      subText: '단일 5 피해 · 적 다음 공격력 -2',
      desc: '단일 적에게 고정 5 피해. 적중 시 이번 라운드에 대상이 가하는 다음 1회 공격의 기본 공격력을 고정 -2 경감한다(광역 시 아군 각자 -2). [쿨다운: 없음]'
    },
    'so_1_2': {
      id: 'so_1_2', comp: '릴리', reqLv: 1, cd: 0,
      name: '생명 흡수진', dmg: 1, isAoe: false, isAttack: false, isDirectHitNoRoll: true,
      subText: '무판정 적 1피해 & 아군 HP+2 (또는 자해전이)',
      desc: '별도의 명중 판정 없이 발동. [생명 흡수(기본)]: 베어러가 공격한 적 1체에게 고정 1 피해 + 아군 1체 HP 2 회복. [생명 전이(긴급)]: 베어러가 비공격/벤트 선언 시 소서러 자신이 고정 1 피해(자해)를 감수하고 베어러 HP 2 회복. [쿨다운: 없음]'
    },
    'so_1_3': {
      id: 'so_1_3', comp: '릴리', reqLv: 1, cd: 4,
      name: '마력 흡수진', dmg: 5, isAoe: false, isAttack: false, isDirectHitNoRoll: true,
      subText: '무판정 적 5피해 · 과열 -10 · 차공격 +3',
      desc: '별도의 명중 판정 없이 발동. 이번 라운드에 베어러가 공격한 적 1체에게 고정 5 피해를 입히고, 베어러의 과열을 즉시 10 냉각하며 베어러의 다음 1회 공격에 +3 피해를 더한다. [쿨다운: 4라운드]'
    },
    'so_2_1': {
      id: 'so_2_1', comp: '릴리', reqLv: 2, cd: 0,
      name: '피의 서약', dmg: 0, isAoe: false, isAttack: false,
      subText: '아군 1체 HP+2 & 방어막 2 (자해 시 HP+3 & 방어막 3)',
      desc: '별도의 명중 판정 없이 발동한다. 아군 1체(베어러 또는 소서러)의 HP를 고정 2 회복하고 [방어막 2]를 부여한다. 시전 시 소서러 자신의 실제 HP 1을 추가로 소모(자해)한다면, 대상의 HP를 고정 3 회복하고 [방어막 3]을 부여한다. [쿨다운: 없음]'
    },
    'so_2_2': {
      id: 'so_2_2', comp: '릴리', reqLv: 2, cd: 0,
      name: '광역 파동망', dmg: 1, isAoe: true, isAttack: true,
      subText: '광역 1 피해 & 공-1 (단독 적이면 3 피해 & 공-3)',
      desc: '적 전체에게 각각 고정 1 광역 피해를 입히고, 적중한 모든 적이 이번 라운드에 가하는 공격 피해량을 고정 -1 감소시킨다. 만약 전장에 적이 단 1체뿐이라면 파동이 응축되어 고정 3 피해를 입히고 이번 라운드 공격 피해량을 고정 -3 감소시킨다. [쿨다운: 없음]'
    },
    'so_3_1': {
      id: 'so_3_1', comp: '릴리', reqLv: 3, cd: 2,
      name: '순환의 정화술', dmg: 0, isAoe: false, isAttack: false,
      subText: '아군 전체 HP+3 & 베어러 정화 (해제시 적 4피해·방어약화)',
      desc: '별도의 명중 판정 없이 발동. 아군 전체의 HP를 각각 고정 3 회복하고, 베어러의 모든 상태이상을 즉시 정화한다. 베어러에게서 해제된 상태이상이 1개 이상 존재한다면, 적 1체에게 판정 없이 고정 4 피해를 입히고 [방어 약화]를 부여한다. [쿨다운: 2라운드]'
    },
    'so_3_2': {
      id: 'so_3_2', comp: '릴리', reqLv: 3, cd: 4,
      name: '열기 공명진', dmg: 0, isAoe: false, isAttack: false,
      subText: '[증폭: 베어러 피해 +3(+5)] / [환기: 적 3피해 & 과열 -20]',
      desc: '별도의 명중 판정 없이 발동. 택1: [공명 증폭] 이번 라운드 베어러의 모든 직접 타격 피해량 +3 증가(현재 과열 70+ 시 +5로 강화) / [공명 환기] 적 1체에게 판정 없이 고정 3 피해를 입히고 베어러의 과열을 즉시 20 냉각. [쿨다운: 4라운드]'
    },
    'so_4_1': {
      id: 'so_4_1', comp: '릴리', reqLv: 4, cd: 4,
      name: '생사 역전: 인과율 개입', dmg: 5, isAoe: false, isAttack: false, isDirectHitNoRoll: true,
      subText: '무판정 적 5피해 + 전체 HP+6 (베어러 반피↓시 과열-30·피격-3)',
      desc: '별도의 명중 판정 없이 발동. 단일 적 1체에게 판정 없이 고정 5 피해를 입히고, 아군 전체의 HP를 각각 고정 6 회복한다. 시전 시점에 베어러의 현재 HP가 절반 이하라면, 베어러의 과열을 즉시 30 냉각하고 이번 라운드 베어러 피격 피해를 고정 3 경감한다. [쿨다운: 4라운드]'
    },
    'so_4_2': {
      id: 'so_4_2', comp: '릴리', reqLv: 4, cd: 4,
      name: '휘석 과부하: 허공 붕괴', dmg: 8, isAoe: true, isAttack: true,
      subText: '광역 8 피해 & [방어 약화] (휘석-1 소모 시 유리함 & 적 공-3)',
      desc: '적 전체에게 각각 고정 8 광역 피해를 입히고 적중한 모든 대상에게 [방어 약화]를 부여한다. 시전 시 장미 휘석 1개를 추가로 소모한다면, 이번 명중 판정에 [유리함]을 적용하며 적중한 모든 대상의 이번 라운드 공격 피해량을 고정 -3 감소시킨다. [쿨다운: 4라운드]'
    },

    // ==================== 3. 마검사 - 시모츠키 센 (9종) ====================
    'ms_1_1': {
      id: 'ms_1_1', comp: '센', reqLv: 1, cd: 0,
      name: '섬광 찌르기', dmg: 3, isAoe: false, isAttack: true,
      subText: '단일 3(단독적 4) + 파편 1 · 차징 +1',
      desc: '단일 적에게 고정 3 피해. 적중 시 [차징 1스택]을 얻고, 대상 외의 다른 모든 적에게 각각 고정 1 피해를 입힌다(적이 단 1체라면 파편을 집중시켜 고정 4 피해). [쿨다운: 없음]'
    },
    'ms_1_2': {
      id: 'ms_1_2', comp: '센', reqLv: 1, cd: 0, reqCharge: 1,
      name: '마탄 응축', dmg: 0, isAoe: false, isAttack: false,
      subText: '차징 1 소모 ➔ 방어막 3 (종료시 잔여 방어막 해제 후 1스택 회수)',
      desc: '[조건: 차징 1스택 이상] 별도의 판정 없이 차징 1스택을 소모하여 마검사가 즉시 [방어막 3]을 획득한다. 이번 라운드 종료 시 마검사에게 방어막이 1 이상 남아 있다면, 잔여 방어막을 해제하여 마탄으로 재회수하고 [차징 1스택]을 획득한다. [쿨다운: 없음]'
    },
    'ms_1_3': {
      id: 'ms_1_3', comp: '센', reqLv: 1, cd: 2, reqCharge: 1, alwaysAdv: true,
      name: '마탄 일제 사격', dmg: 7, isAoe: false, isAttack: true,
      subText: '유리함 · 1~3스택: 7/13/20 피해 (3스택 베어러+4)',
      desc: '[조건: 차징 1스택 이상] 명중 판정에 항상 [유리함] 적용. 보유한 모든 차징 스택을 소모하여 단일 적에게 피해(1스택: 7 / 2스택: 13 / 3스택: 20 피해). 3스택 적중 시 베어러가 가하는 다음 1회 직접 공격의 피해량을 고정 +4 추가한다. [쿨다운: 2라운드]'
    },
    'ms_2_1': {
      id: 'ms_2_1', comp: '센', reqLv: 2, cd: 0,
      name: '질풍 연격', dmg: 3, isAoe: false, isAttack: true,
      subText: '단일 3 피해 · 차징+1 (사각 포착/상태이상 적 유리함)',
      desc: '단일 적에게 고정 3 피해를 입히고 적중 시 [차징 1스택]을 획득한다. 대상의 이번 라운드 인텐트에 마검사 자신이 포함되어 있지 않거나(사각 포착), 대상에게 상태이상이 걸려 있다면 이번 명중 판정에 [유리함]을 적용한다. [쿨다운: 없음]'
    },
    'ms_2_2': {
      id: 'ms_2_2', comp: '센', reqLv: 2, cd: 0,
      name: '역장 패링', dmg: 0, isAoe: false, isAttack: false,
      subText: '무판정 패링 태세 (이번R 회피 시 적에게 2피해 & 차징+1)',
      desc: '별도의 판정 없이 발동한다. 이번 라운드 중 마검사를 노린 적의 공격을 회피(적 명중 판정 실패)했다면, 즉시 해당 적에게 판정 없이 고정 2 피해를 입히고 [차징 1스택]을 획득한다. [쿨다운: 없음]'
    },
    'ms_3_1': {
      id: 'ms_3_1', comp: '센', reqLv: 3, cd: 2,
      name: '마탄 산탄검', dmg: 4, isAoe: true, isAttack: true,
      subText: '0~3스택: 광역 4/7/10/13 피해 (2스택+ 시 전체 방어약화)',
      desc: '적 전체에게 고정 4 광역 피해. 보유한 모든 [차징 스택]을 소모하며(0스택 시전 가능), 소모한 차징 1스택당 광역 피해가 +3씩 증가한다(0~3스택: 4/7/10/13 광역 피해). 2스택 이상 소모 적중 시 모든 대상에게 [방어 약화]를 부여한다. [쿨다운: 2라운드]'
    },
    'ms_3_2': {
      id: 'ms_3_2', comp: '센', reqLv: 3, cd: 4,
      name: '열기 절단', dmg: 6, isAoe: false, isAttack: true,
      subText: '단일 6 피해 · 즉시 과열-10(-20) & 차징+1 (과열70+ 유리·행동제약)',
      desc: '단일 적에게 고정 6 피해. 시전 즉시(명중 무관) 베어러의 과열을 10 냉각하고 [차징 1스택] 획득. 베어러 현재 과열이 70 이상이면 명중 [유리함] 적용, 과열 20 냉각으로 강화되며, 적중 시 대상에게 [행동 제약]을 부여한다. [쿨다운: 4라운드]'
    },
    'ms_4_1': {
      id: 'ms_4_1', comp: '센', reqLv: 4, cd: 5, alwaysAdv: true,
      name: '극광 일섬: 단죄의 마탄', dmg: 8, isAoe: false, isAttack: true,
      subText: '유리·18~20치명 · 0~3스택: 8/12/18/25 (2+방무, 3+베어러+5·방약, 파편3)',
      desc: '상시 [유리함] & 자연 18~20 치명타(+5). 모든 차징 소모 단일 타격(0~3스택: 8/12/18/25 피해). 2스택+ 방어막 무시, 3스택 적중 시 베어러 다음 직접 공격 +5 & 대상 [방어 약화]. 적중 시 다른 모든 적에게 판정 없이 파편 고정 3 피해! [쿨다운: 5라운드]'
    },
    'ms_4_2': {
      id: 'ms_4_2', comp: '센', reqLv: 4, cd: 5,
      name: '무영의 검무: 왕실 비전', dmg: 3, isAoe: true, isAttack: false, isDirectHitNoRoll: true,
      subText: '무판정 차징+1 · 적 전체 3피해 · 피격-3 · 즉시 추가 행동 1회!',
      desc: '별도의 명중 판정 없이 발동. 시전 즉시 [차징 1스택]을 획득하고, 적 전체에게 판정 없이 고정 3 피해를 입힌다. 이어서 이번 라운드에 즉시 추가 행동 1회를 획득하여 다른 스킬을 1회 더 선언할 수 있으며, 이번 라운드 마검사 피격 피해가 3 경감된다. [쿨다운: 5라운드]'
    },

    // ==================== 4. 리퍼 - 마윤겸 (9종) ====================
    'r_1_1': {
      id: 'r_1_1', comp: '마윤겸', reqLv: 1, cd: 0,
      name: '사신의 낫질', dmg: 2, isAoe: false, isAttack: true,
      subText: '단일 2 피해 + [지속피해:2] 2R (미보유 적 유리 · 처치시 적 공-1)',
      desc: '단일 적 고정 2 피해 + [지속 피해: 2] 2R 부여. 대상에게 활성화된 지속 피해가 없다면 명중 [유리함]. 이 공격의 직접 타격으로 적 처치 시 유독가스가 퍼져 이번 라운드 모든 적 공격 피해량 -1 경감. [쿨다운: 없음]'
    },
    'r_1_2': {
      id: 'r_1_2', comp: '마윤겸', reqLv: 1, cd: 0,
      name: '혈맥 절단', dmg: 5, isAoe: false, isAttack: true,
      subText: '단일 5 피해 + 모든 지속피해 +1R 연장',
      desc: '단일 적에게 고정 5 피해를 입힌다. 대상에게 [지속 피해]가 걸려 있다면, 대상에게 걸려 있는 모든 [지속 피해]의 남은 지속 시간을 일괄 +1라운드 추가한다. [쿨다운: 없음]'
    },
    'r_1_3': {
      id: 'r_1_3', comp: '마윤겸', reqLv: 1, cd: 3,
      name: '맹독 주입', dmg: 6, isAoe: false, isAttack: true,
      subText: '단일 6 피해(광역/충전 유리) · 지속보유 적 행동제약',
      desc: '단일 적에게 고정 6 피해(대상 인텐트가 광역/충전일 시 명중 [유리함]). 대상이 이미 [지속 피해] 상태이상에 걸려 있다면, 적중 시 이번 라운드 동안 [행동 제약]을 부여한다. [쿨다운: 3라운드]'
    },
    'r_2_1': {
      id: 'r_2_1', comp: '마윤겸', reqLv: 2, cd: 2,
      name: '독무의 낫질', dmg: 3, isAoe: true, isAttack: true,
      subText: '광역 3 피해 + 지속 2(2R) (단독 적이면 4 피해 + 지속 3)',
      desc: '적 전체에게 각각 고정 3 광역 피해를 입히고 적중한 모든 대상에게 [지속 피해: 2]를 2라운드간 부여한다. 전장에 적이 단 1체뿐이라면 고정 4 피해를 입히고 [지속 피해: 3]을 2라운드간 부여한다. [쿨다운: 2라운드]'
    },
    'r_2_2': {
      id: 'r_2_2', comp: '마윤겸', reqLv: 2, cd: 0,
      name: '수의 재단', dmg: 4, isAoe: false, isAttack: true,
      subText: '단일 4 피해 + [방어 약화] (지속보유 적 공-2 감소)',
      desc: '단일 적에게 고정 4 피해를 입히고 적중 시 대상에게 [방어 약화](다음 피격 +3)를 부여한다. 대상에게 이미 [지속 피해]가 걸려 있다면 대상이 이번 라운드에 가하는 공격 피해량을 고정 -2 감소시킨다(광역 시 아군 각자 -2). [쿨다운: 없음]'
    },
    'r_3_1': {
      id: 'r_3_1', comp: '마윤겸', reqLv: 3, cd: 4,
      name: '진혼의 약초 연무', dmg: 0, isAoe: false, isAttack: false,
      subText: '무판정 과열 -10(70+시 -20) · 아군 피격-2 · 모든 적 지속피해 +1R',
      desc: '별도의 명중 판정 없이 발동. 시전 즉시 베어러의 과열을 10 냉각(베어러 과열 70+ 시 20 냉각)하고 이번 라운드 아군 전체가 받는 모든 피격 피해를 고정 2 경감한다. 또한 전장의 적들에게 걸려 있는 모든 [지속 피해]의 남은 시간을 일괄 +1라운드 연장한다. [쿨다운: 4라운드]'
    },
    'r_3_2': {
      id: 'r_3_2', comp: '마윤겸', reqLv: 3, cd: 4,
      name: '전염되는 사독', dmg: 4, isAoe: false, isAttack: true,
      subText: '단일 4 피해 · 기존 지속+1R 후 [지속:3] 2R 추가 & 전체 전염',
      desc: '단일 적에게 고정 4 피해. 적중 시 대상의 기존 모든 [지속 피해]를 +1라운드 연장한 뒤 새롭게 [지속 피해: 3]을 2라운드간 추가 부여하며, 대상에게 걸려 있는 모든 [지속 피해]를 다른 모든 적에게 그대로 전염(복제)시킨다. [쿨다운: 4라운드]'
    },
    'r_4_1': {
      id: 'r_4_1', comp: '마윤겸', reqLv: 4, cd: 5,
      name: '절명의 수확: 마지막 수의', dmg: 9, isAoe: false, isAttack: true,
      subText: '단일 9 피해 · 지속보유 적 유리 & 방약+행동제약 & [지속합×2] 방무 피해',
      desc: '단일 적 고정 9 피해. 대상에게 [지속 피해]가 걸려 있다면 명중 [유리함] 및 적중 시 [방어 약화]와 [행동 제약]을 동시 부여한다. 추가로 지속 피해를 소멸시키지 않고 유지한 채 [모든 지속 피해 수치 합산값 × 2]만큼 방어막 무시 추가 피해를 즉시 입힌다. [쿨다운: 5라운드]'
    },
    'r_4_2': {
      id: 'r_4_2', comp: '마윤겸', reqLv: 4, cd: 5,
      name: '사신의 영역: 백골의 안식처', dmg: 7, isAoe: true, isAttack: true,
      subText: '광역 7 피해 + [지속:3] 2R + 적 공격 불리함 + 종료시 지속피해 절반 흡혈',
      desc: '적 전체에게 고정 7 광역 피해 + [지속 피해: 3] 2R 부여 + 이번 라운드 적중한 모든 적의 공격 명중 판정에 [불리함] 강제. 이번 라운드 종료 시 적들에게 지속 피해가 발동할 때, 지속 피해 총합의 절반(올림, 최대 6)만큼 베어러와 리퍼의 HP를 각각 회복한다. [쿨다운: 5라운드]'
    }
  };

  const DEFAULT_COMP_DECKS = {
    '데드로': ['w_1_1', 'w_1_2', 'w_1_3'],
    '릴리':   ['so_1_1', 'so_1_2', 'so_1_3'],
    '센':     ['ms_1_1', 'ms_1_2', 'ms_1_3'],
    '마윤겸': ['r_1_1', 'r_1_2', 'r_1_3']
  };

  function getCompSkillById(id) {
    return COMP_SKILL_DB[id] || null;
  }

  function getCompSkillList(comp = pickedComp) {
    return Object.values(COMP_SKILL_DB).filter(sk => sk.comp === comp);
  }

  const COMPS = {
    '데드로': {
      name: '데드로 펠더', class: '워리어', hp: 13, ac: 11,
      skills: [
        { name: '승룡 올려베기', baseDmg: 6, desc: '단일 적 고정 6 피해 (직전 라운드 쿨다운 기술 사용 시 7 피해 + 명중 유리함 + 적 이번 라운드 공격 굴림에 불리함 강제)' },
        { name: '투지 발휘', baseDmg: 3, desc: '단일 적 3 피해 (베어러 노릴 시 유리함). 적중 시 워리어 피격 3 경감, [행동 제약] 면역 및 단일 공격 강제 전환' },
        { name: '폭풍 맹격', baseDmg: 6, desc: '전방 적 전체에게 각각 고정 6 피해 (쿨다운: 3라운드)' }
      ]
    },
    '릴리': {
      name: '릴리 애쉬포드', class: '소서러', hp: 10, ac: 10,
      skills: [
        { name: '마력 파동', baseDmg: 5, desc: '원거리 단일 적 고정 5 피해. 적중 시 대상의 다음 1회 공격 기본 피해량 -2 경감' },
        { name: '생명 흡수진', baseDmg: 1, desc: '이번 라운드 베어러가 공격한 적 1체 판정 없이 1 피해 + 아군 HP 2 회복 (또는 릴리 HP 1 소모로 베어러 HP 2 회복)' },
        { name: '마력 흡수진', baseDmg: 5, desc: '이번 라운드 베어러가 공격한 적 1체 판정 없이 5 피해 + 베어러 과열 -10 냉각 + 베어러 다음 공격 피해 +3 (쿨다운: 4라운드)' }
      ]
    },
    '센': {
      name: '시모츠키 센', class: '마검사', hp: 11, ac: 11,
      skills: [
        { name: '섬광 찌르기', baseDmg: 3, desc: '단일 적 고정 3 피해 + 적중 시 [마탄 차징] +1스택 + 다른 적 전체 1 피해 (적 1체면 총 4 피해)' },
        { name: '마탄 응축', baseDmg: 0, desc: '차징 1스택 소모 ➔ 마검사에게 [방어막 3] 부여. 라운드 종료 시 잔여 방어막이 1 이상 남아 있으면 1스택 재회수' },
        { name: '마탄 일제 사격', baseDmg: 7, desc: '명중 유리함. 차징 스택 소모 (1스택: 7 / 2스택: 13 / 3스택: 20 피해, 3스택 시 베어러 다음 공격 +4 / 쿨다운: 2라운드)' }
      ]
    },
    '마윤겸': {
      name: '마윤겸', class: '리퍼', hp: 10, ac: 11,
      skills: [
        { name: '사신의 낫질', baseDmg: 2, desc: '단일 적 고정 2 피해 + 2라운드간 [지속 피해: 2] 부여 (지속 피해가 없는 대상 공격 시 명중 유리함)' },
        { name: '혈맥 절단', baseDmg: 5, desc: '단일 적 고정 5 피해 + 대상에게 걸려 있는 모든 지속 피해 지속 시간 일괄 +1라운드 연장' },
        { name: '맹독 주입', baseDmg: 6, desc: '단일 적 고정 6 피해 (적 인텐트가 광역/충전일 시 명중 유리함). 대상에게 [지속 피해] 있으면 1라운드간 [행동 제약] 부여 (쿨다운: 3라운드)' }
      ]
    }
  };

/* 룰북 v2.24 공식 데이터베이스 (Phase 1 반영) */
  const ORIGIN_DATA = {
    '신성국 아티스': { name: '신성국 아티스', archangel: '화염과 신성의 대천사 아티시엘 (엄지)', realm: '대륙 중앙 (패권·하이 판타지)', image: 'assets/artis.png', desc: '장미 휘석 독점으로 번영한 독보적인 하이 판타지 패권국.', quote: '“아티시엘, 당신이 준다는 ‘평등한 구원’ 때문에 내 이웃들은 징집되어 고기분쇄기에 갈려 나갔다...”', traitName: '밑바닥의 악바리', traitTag: 'HP 50% 이하 시 매 라운드 명중 상시 유리함', traitDesc: '전투 중 베어러의 현재 HP가 최대 HP의 50% 이하일 때, 매 라운드 자신의 모든 명중 주사위 굴림에 상시 [유리함(2d20 High)]이 자동 적용됩니다.' },
    '부족 연합국 티손': { name: '부족 연합국 티손', archangel: '바람과 자연의 대천사 티소니엘 (검지)', realm: '대륙 서쪽 (자연·로우 판타지)', image: 'assets/tison.png', desc: '광활한 초원과 신목의 숲을 누비는 다부족 연합체. 신앙과 유대를 중시하는 로우 판타지.', quote: '“국경 참호선에서 스러져간 청년들의 피와 의회의 착취 사이에서 찢겨나간 신뢰를 회복하겠다.”', traitName: '바람의 조율', traitTag: '전투 시작 시 아군 전체 HP +1 회복', traitDesc: '전투 시작 시, 아군 전체(베어러 및 컴패니언)의 HP를 각각 1 회복합니다.' },
    '왕국 카른': { name: '왕국 카른', archangel: '서리와 지혜의 대천사 카르니엘 (중지)', realm: '대륙 북쪽 (빙원·지적 탐구)', image: 'assets/karn.png', desc: '설원과 빙하의 극지대. 순수한 티크토의 뼛가루(붉은 모래)를 파내어 전쟁의 불씨를 열었다는 원죄 의식을 품은 왕국.', quote: '“우리의 지적 오만이 이 생지옥을 열었다. 죗값을 내 손으로 치르고 천사를 돌려놓겠다.”', traitName: '심토의 안목', traitTag: '채취 판정(순수 1d20 ≥ 13) 성공 시 휘석 +1 추가', traitDesc: '전투 보상이나 탐색으로 장미 휘석을 획득할 때, 채취 판정(순수 1d20 ≥ 13)에 성공하면 휘석 1개를 추가로 채취합니다.' },
    '극지 왕국 카른': { name: '왕국 카른', archangel: '서리와 지혜의 대천사 카르니엘 (중지)', realm: '대륙 북쪽 (빙원·지적 탐구)', image: 'assets/karn.png', desc: '설원과 빙하의 극지대. 순수한 티크토의 뼛가루(붉은 모래)를 파내어 전쟁의 불씨를 열었다는 원죄 의식을 품은 왕국.', quote: '“우리의 지적 오만이 이 생지옥을 열었다. 죗값을 내 손으로 치르고 천사를 돌려놓겠다.”', traitName: '심토의 안목', traitTag: '채취 판정(순수 1d20 ≥ 13) 성공 시 휘석 +1 추가', traitDesc: '전투 보상이나 탐색으로 장미 휘석을 획득할 때, 채취 판정(순수 1d20 ≥ 13)에 성공하면 휘석 1개를 추가로 채취합니다.' },
    '자치령 르니그': { name: '자치령 르니그', archangel: '번개와 힘의 대천사 르니기엘 (약지)', realm: '대륙 동쪽 (협곡·육체미와 단조)', image: 'assets/renig.png', desc: '거친 바위와 협곡 지대. 마법보다 순수한 육체미와 강철 단조를 숭상하는 강인한 국가.', quote: '“신의 기적 따위에 기대지 않아도 필멸자가 얼마나 강한지 천사의 턱을 쳐서 깨우치겠다.”', traitName: '단조된 근골', traitTag: '전투 시작 시 적 전체 판정 없이 고정 1 피해', traitDesc: '전투 시작 시, 전장의 모든 적에게 판정 없이 고정 1 피해를 입힙니다.' },
    '강철 자치령 르니그': { name: '자치령 르니그', archangel: '번개와 힘의 대천사 르니기엘 (약지)', realm: '대륙 동쪽 (협곡·육체미와 단조)', image: 'assets/renig.png', desc: '거친 바위와 협곡 지대. 마법보다 순수한 육체미와 강철 단조를 숭상하는 강인한 국가.', quote: '“신의 기적 따위에 기대지 않아도 필멸자가 얼마나 강한지 천사의 턱을 쳐서 깨우치겠다.”', traitName: '단조된 근골', traitTag: '전투 시작 시 적 전체 판정 없이 고정 1 피해', traitDesc: '전투 시작 시, 전장의 모든 적에게 판정 없이 고정 1 피해를 입힙니다.' }
  };

  const CLASS_DATA = {
    '파이터': { 
      name: '파이터 (Fighter)', 
      role: '검과 방패 · 공방일체 및 과열 조율형 전사 (★☆☆ 입문 추천)', 
      hp: 12, ac: 12, 
      image: 'assets/fighter.png', 
      desc: '“맞으면서 버티고, 묵직하게 반격한다.” 가장 높은 체급(HP 12/AC 12)과 방어막, 피격 경감, 반격 기술로 전선을 유지하는 완성형 딜탱. (추천 동료: 마검사 / 소서러)', 
      feat: '근접 물리 공격, 완력 및 장애물 돌파, 체력적 인내, 방어적 신체 반응 (+3)', 
      skills: [
        { name: '쾌속 찌르기', desc: '단일 적 4 피해. 직전 라운드 자신의 공격이 실패했다면 기본 피해량이 6으로 증가 [캔트립 / 과열 +0]' },
        { name: '쳐내고 베기', desc: '단일 적 6 피해 + 이번 라운드 피격 피해 3 감소 (빗나감 시 스침 2) [1서클 / 과열 +10]' },
        { name: '비승참', desc: '단일 적 7 피해. 비행·체공 또는 광역·충전 인텐트 선언 적 대상 시 명중 유리함 (스침 2) [1서클 / 과열 +10]' },
        { name: '백색 철벽', desc: '방어막 9 획득 + 피격 피해 3 감소. 시전 시 [일반 전개] 또는 [결사의 수호] 선택 [2서클 / 과열 +30]' },
        { name: '단죄의 연격 난무', desc: '[과열 40+] 단일 적 16 피해. 동료 노리는 인텐트 시 대상 공격력 -3 감소 (빗나감 시 스침 2) [3서클 / 과열 +50]' }
      ] 
    },
    '검객': { 
      name: '검객 (Swordsman)', 
      role: '검과 검집 · 회피 기동 및 변칙 궤적의 쾌검사 (★★☆ 중급)', 
      hp: 11, ac: 11, 
      image: 'assets/swordsman.png', 
      desc: '“적의 치명적인 한 방은 흘려내고, 빈틈에 칼날을 쏟아붓는다.” 적의 공격을 [무형보]로 흘려내고 변칙 궤적으로 적 진형을 쓸어 담는 스트라이커. (추천 동료: 워리어 / 리퍼)', 
      feat: '도검 및 기동 공격, 도약 및 곡예, 잠입 및 균형 유지, 전장 이탈 (+3)', 
      skills: [
        { name: '호선참', desc: '검집에서 빛의 속도로 칼날을 뽑아 적의 전면을 베어 넘기는 일섬 [캔트립 / 과열 +0 / 고정 5 피해]' },
        { name: '윤무', desc: '전방 적 전체에게 고정 4 광역 피해 (빗나감 시 스침 2) [1서클 / 과열 +10]' },
        { name: '무형보', desc: '자신을 향한 적 단일/광역 공격 1회 완전 회피 (피해 0 / 광역 시 동료는 정상 피격) [1서클 / 과열 +10]' },
        { name: '쌍영참', desc: '[적 전체 고정 6 광역 피해] 또는 [단일 적 집중 고정 9 피해] 중 선택 시전 (스침 2) [2서클 / 과열 +30]' },
        { name: '용미섬', desc: '범위 내 모든 적에게 고정 14 광역 피해 (빗나감 시 스침 2) [3서클 / 과열 +50]' }
      ] 
    },
    '메이지': { 
      name: '메이지 (Mage)', 
      role: '성염 지팡이 · 원거리 광역 화력 및 아군 생명 회복 (★☆☆ 입문 추천)', 
      hp: 10, ac: 10, 
      image: 'assets/mage.png', 
      desc: '“뒤에서 판을 읽고, 전황을 불꽃과 치유로 지배한다.” 확정 회복(HP 6)과 [성염 장전], 2~3서클 광역 성염으로 전장을 지배하는 후방 캐스터. (추천 동료: 워리어 / 마검사)', 
      feat: '원거리 성염 마법, 휘석 및 붉은 모래 연구, 마법진 해독, 역사 및 종교 지식 식별 (+3)', 
      skills: [
        { name: '성염구슬', desc: '원거리 단일 적에게 백색 성염 탄환 투사 [캔트립 / 과열 +0 / 고정 5 마법 피해]' },
        { name: '성염 치유', desc: '별도 판정 없이 아군 1체(자신 또는 컴패니언)의 HP 고정 6 즉시 회복 [1서클 / 과열 +10]' },
        { name: '성염 장전', desc: '보유 마법 최대 2개 장전 후 원하는 턴에 무행동 일괄 개방 (장전 중 라운드당 유지 과열 +10) [1서클]' },
        { name: '염화기둥', desc: '적 전체에게 고정 7 광역 피해 (빗나감 시 스침 2) [2서클 / 과열 +30]' },
        { name: '성염 낙하', desc: '하늘에서 태초의 순백 유성을 소환해 적 전체 고정 18 광역 피해 (빗나감 시 스침 2) [3서클 / 과열 +50]' }
      ] 
    },
    '등지기': { 
      name: '등지기 (Lamplighter)', 
      role: '룬 랜턴 · 신기루 장막 및 전술 지원 컨트롤러 (★★★ 상급자 지향)', 
      hp: 10, ac: 10, 
      image: 'assets/lamplighter.png', 
      desc: '“빛으로 적의 눈을 속이고, 동료의 칼끝에 폭발을 얹는다.” [신기루 장막], [환체 교란], [과부하 조광]으로 전장을 조율하는 컨트롤러. (추천 동료: 마검사·워리어 / 리퍼)', 
      feat: '원거리 투사 공격, 기만 및 변장, 거짓말 간파, 길 찾기 및 어둠 탐색, 지원 신호 (+3)', 
      skills: [
        { name: '인광탄', desc: '과열 0~50 선언 단일 타격. 0 선언 시 일반 캔트립(4 피해, 스침 없음), 10~50 선언 시 서클 기술(4~12 피해, 스침 2 보장) [가변 캔트립 / 과열 0~50]' },
        { name: '신기루 장막', desc: '아군 1체 장막 전개 (5 이하 피해는 1로 경감 / 최대 2회 / 5 초과 시 5 경감 후 소멸) [1서클 / 과열 +10]' },
        { name: '과부하 조광', desc: '동료 직접 공격 적중 시 [+3 성염 기폭] 추가 (2R부터 라운드 종료 시 과열 +10 지불로 유지) [2서클 / 과열 +30]' },
        { name: '환체 교란', desc: '[적 2체 이상] 단일 적 3 피해 + 적중 시 대상의 이번 라운드 공격 목표를 다른 적 1체로 강제 전환 [2서클 / 과열 +30]' },
        { name: '환룡의 포효', desc: '적 전체 14 피해 + 아군 전체 HP 1 회복 (탈진 동료 HP 1 즉시 복귀, 빗나감 시 스침 2) [3서클 / 과열 +50]' }
      ] 
    }
  };

  const COMP_DATA = {
    '데드로': { name: '데드로 펠더', class: '워리어 (대검) · 중장갑 브루저 & 반격 딜러', hp: 13, ac: 11, image: 'assets/dedro.png', lore: '전 아티스 분대장. 민간인 학살에 항명하고 탈영한 뒤 베어러의 사명에 감화되어 동행합니다.', feat: '근접 공격, 위압, 군사 지식 및 진형 돌파 단독 판정', skills: [
      { name: '승룡 올려베기', desc: '단일 적 고정 6 피해 (직전 라운드 쿨다운 기술 사용 시 7 피해 + 유리함 + 적 공격 불리함 강제)' },
      { name: '투지 발휘', desc: '단일 적 3 피해 (베어러 노릴 시 유리함). 적중 시 워리어 피격 3 경감, [행동 제약] 면역 및 단일 공격 강제 전환' },
      { name: '폭풍 맹격', desc: '적 전체에게 각각 고정 6 피해 (쿨다운: 3라운드)' }
    ]},
    '릴리': { name: '릴리 애쉬포드', class: '소서러 (지팡이) · 마력 조율 학자 & 생명 버퍼', hp: 10, ac: 10, image: 'assets/lily.png', lore: '르니그의 학자. 자신의 생명을 깎아가며 힘을 다루는 베어러의 완결을 지키고자 동행합니다.', feat: '원거리 마력 공격, 생명력 및 마도 의학 연구, 고문서 식별 단독 판정', skills: [
      { name: '마력 파동', desc: '단일 적 고정 5 피해. 적중 시 대상의 다음 1회 공격 피해량 -2 경감' },
      { name: '생명 흡수진', desc: '이번 라운드 베어러가 공격한 적 1체 판정 없이 1 피해 + 아군 HP 2 회복 (또는 소서러 HP 1 소모로 베어러 HP 2 회복)' },
      { name: '마력 흡수진', desc: '이번 라운드 베어러가 공격한 적 1체 판정 없이 5 피해 + 베어러 과열 -10 냉각 + 다음 공격 +3 (쿨다운: 4라운드)' }
    ]},
    '센': { name: '시모츠키 센', class: '마검사 (한손검) · 고속 기동 & 마탄 차징 폭딜러', hp: 11, ac: 11, image: 'assets/sen.png', lore: '카른의 전 대속자이자 왕실 기사단장. 국왕의 명으로 베어러와 함께하며 칼을 맞댑니다.', feat: '고속 검술 공격, 기사단 전술, 귀족 의전 및 전장 정찰 단독 판정', skills: [
      { name: '섬광 찌르기', desc: '단일 적 고정 3 피해 + 적중 시 [마탄 차징] 1스택 획득 + 다른 적 전체 파편 1 피해 (적 1체면 총 4 피해)' },
      { name: '마탄 응축', desc: '차징 1스택 소모 ➔ 마검사에게 [방어막 3] 부여. 라운드 종료 시 잔여 방어막이 1 이상 남아 있으면 1스택 재회수' },
      { name: '마탄 일제 사격', desc: '명중 유리함. 차징 스택 소모 (1스택: 7 / 2스택: 13 / 3스택: 20 피해, 3스택 시 베어러 다음 공격 +4 / 쿨다운: 2라운드)' }
    ]},
    '마윤겸': { name: '마윤겸', class: '리퍼 (대낫) · 원혼의 침묵 장례사 & 상태이상 딜러', hp: 10, ac: 11, image: 'assets/mayungeom.png', lore: '티손 평원의 침묵의 장례사. 시한부의 베어러에게 마지막 수의를 지어줄 때까지 등 뒤를 지키겠다고 맹세합니다.', feat: '중거리 대낫 공격, 시체/유해 감식, 독초/약초 식별 단독 판정', skills: [
      { name: '사신의 낫질', desc: '단일 적 고정 2 피해 + 2라운드간 [지속 피해: 2] 부여 (지속 피해가 없는 대상 공격 시 명중 유리함)' },
      { name: '혈맥 절단', desc: '단일 적 고정 5 피해 + 대상에게 걸려 있는 모든 지속 피해의 남은 지속 시간 +1라운드 연장' },
      { name: '맹독 주입', desc: '단일 적 고정 6 피해 (광역/충전 인텐트 시 유리함). 대상에게 [지속 피해] 있으면 1라운드간 [행동 제약] (쿨다운: 3라운드)' }
    ]}
  };

  const COMP_CRISIS_LINES = {
    '데드로': '"살갗이 타들어가는 냄새가 난다... 뒤로 물러서라, 베어러! 등 뒤는 내가 막겠다!"',
    '릴리': '"숨을 고르세요! 육신이 신성의 무게를 버티지 못하고 바스러지고 있습니다...!"',
    '센': '"칫, 꼴사납게 쓰러지지 마라! 대속의 짐을 혼자 다 짊어진 척 죽을 셈이냐?!"',
    '마윤겸': '"아직 죽을 때가 아니다. 네 마지막 수의는 내가 지어주기로 약속했으니까. 버텨라...!"'
  };

  const BEARERS = {
    '파이터': { hp: 12, ac: 12 },
    '검객': { hp: 11, ac: 11 },
    '메이지': { hp: 10, ac: 10 },
    '등지기': { hp: 10, ac: 10 }
  };