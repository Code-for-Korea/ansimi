// simulation.js - Retro Interactive Evacuation Simulation Game Logic (Enhanced HUD & Outlined Text)

const game = {
    state: {
        persona: null,      // 'wheelchair', 'infant', 'foreign', 'elderly'
        hp: 3.0,            // Max 3.0 hearts (supports half-hearts like 2.5, 1.5)
        timeRemaining: 600, // 10 minutes in seconds (600s)
        currentStep: '',
        timerInterval: null,
        isTyping: false,
        visitedNodes: []    // Track visited nodes for map highlighting
    },

    // Character profiles
    personas: {
        wheelchair: {
            name: "민우 (휠체어 이용자)",
            avatar: "♿",
            startStep: "wc_start"
        },
        infant: {
            name: "현아 (영유아 동반)",
            avatar: "👶",
            startStep: "inf_start"
        },
        foreign: {
            name: "마이클 (외국인 유학생)",
            avatar: "🌎",
            startStep: "for_start"
        },
        elderly: {
            name: "김순임 (독거 노인)",
            avatar: "👵",
            startStep: "eld_start"
        }
    },

    // Minimap Node Coordinates (X, Y) on a 100x100 grid
    nodeCoordinates: {
        // Wheelchair Route
        wc_start: { x: 15, y: 80, label: "출발지" },
        wc_alley: { x: 45, y: 80, label: "골목길" },
        wc_accident: { x: 45, y: 55, label: "계단턱" },
        wc_main_road: { x: 35, y: 40, label: "대로변" },
        wc_roadway: { x: 65, y: 40, label: "차도" },
        wc_crossing: { x: 35, y: 15, label: "횡단보도" },
        wc_entrance: { x: 60, y: 15, label: "학교정문" },
        wc_entrance_wait: { x: 75, y: 15, label: "정문대기" },
        wc_back_door: { x: 50, y: 30, label: "학교후문" },
        wc_underground: { x: 45, y: 10, label: "지하주차장" },
        wc_find_map: { x: 70, y: 30, label: "본관" },
        wc_success: { x: 85, y: 20, label: "대피소" },

        // Infant Route
        inf_start: { x: 15, y: 80, label: "출발지" },
        inf_flood: { x: 45, y: 80, label: "사거리" },
        inf_detour: { x: 30, y: 45, label: "우회골목" },
        inf_convenience: { x: 45, y: 55, label: "편의점" },
        inf_approach: { x: 60, y: 40, label: "학교현관" },
        inf_search: { x: 75, y: 40, label: "복도" },
        inf_call: { x: 60, y: 15, label: "쉼터전화" },
        inf_success: { x: 85, y: 20, label: "수유실" },

        // Foreign Student Route
        for_start: { x: 15, y: 80, label: "원룸" },
        for_translate: { x: 40, y: 80, label: "재난문자" },
        for_follow: { x: 30, y: 50, label: "인파" },
        for_wrong_way: { x: 50, y: 80, label: "아파트지하" },
        for_correct_way: { x: 55, y: 50, label: "중학교입구" },
        for_blocked_door: { x: 75, y: 50, label: "폐쇄철문" },
        for_english_sign: { x: 60, y: 25, label: "영어안내" },
        for_success: { x: 85, y: 20, label: "밀폐대피소" },

        // Elderly Route
        eld_start: { x: 15, y: 80, label: "집" },
        eld_app: { x: 25, y: 55, label: "앱검색" },
        eld_walk: { x: 45, y: 80, label: "도보경로" },
        eld_rest_center: { x: 55, y: 55, label: "경로당" },
        eld_phone_search: { x: 60, y: 30, label: "전화문의" },
        eld_closed_door: { x: 75, y: 55, label: "탈수고립" },
        eld_jumin_center: { x: 75, y: 25, label: "주민센터" },
        eld_success: { x: 85, y: 20, label: "무더위쉼터" }
    },

    // Map Connections (Lines) per persona
    mapConnections: {
        wheelchair: [
            ['wc_start', 'wc_alley'],
            ['wc_alley', 'wc_accident'],
            ['wc_alley', 'wc_main_road'],
            ['wc_accident', 'wc_main_road'],
            ['wc_start', 'wc_main_road'],
            ['wc_main_road', 'wc_roadway'],
            ['wc_main_road', 'wc_crossing'],
            ['wc_roadway', 'wc_entrance'],
            ['wc_crossing', 'wc_back_door'],
            ['wc_entrance', 'wc_entrance_wait'],
            ['wc_entrance', 'wc_back_door'],
            ['wc_entrance_wait', 'wc_success'],
            ['wc_back_door', 'wc_underground'],
            ['wc_back_door', 'wc_find_map'],
            ['wc_underground', 'wc_find_map'],
            ['wc_find_map', 'wc_success']
        ],
        infant: [
            ['inf_start', 'inf_flood'],
            ['inf_start', 'inf_detour'],
            ['inf_flood', 'inf_convenience'],
            ['inf_flood', 'inf_approach'],
            ['inf_detour', 'inf_approach'],
            ['inf_convenience', 'inf_approach'],
            ['inf_approach', 'inf_search'],
            ['inf_approach', 'inf_call'],
            ['inf_search', 'inf_success'],
            ['inf_call', 'inf_success']
        ],
        foreign: [
            ['for_start', 'for_translate'],
            ['for_start', 'for_follow'],
            ['for_translate', 'for_wrong_way'],
            ['for_translate', 'for_correct_way'],
            ['for_follow', 'for_correct_way'],
            ['for_wrong_way', 'for_correct_way'],
            ['for_correct_way', 'for_blocked_door'],
            ['for_correct_way', 'for_english_sign'],
            ['for_blocked_door', 'for_english_sign'],
            ['for_english_sign', 'for_success']
        ],
        elderly: [
            ['eld_start', 'eld_app'],
            ['eld_start', 'eld_walk'],
            ['eld_app', 'eld_walk'],
            ['eld_walk', 'eld_rest_center'],
            ['eld_rest_center', 'eld_phone_search'],
            ['eld_rest_center', 'eld_closed_door'],
            ['eld_closed_door', 'eld_jumin_center'],
            ['eld_phone_search', 'eld_jumin_center'],
            ['eld_jumin_center', 'eld_success']
        ]
    },

    // Branching narrative scenarios
    scenarios: {
        // --- WHEELCHAIR SCENARIO ---
        wc_start: {
            nodeName: "wc_start",
            location: "지하철역 8번 출구 인근",
            avatar: "♿",
            image: "../assets/images/pixel_wheelchair.png",
            text: "갑작스러운 폭우로 동네 일대 침수가 시작되었습니다. 가장 가까운 대피소인 초등학교로 향해야 합니다. 지도를 보니 골목길 지름길과 큰길 우회로가 보입니다.",
            choices: [
                { text: "1. 골목길 지름길로 가기 (지름길 선택)", nextStep: "wc_alley" },
                { text: "2. 큰길 우회 경로로 돌아가기", nextStep: "wc_main_road" }
            ]
        },
        wc_alley: {
            nodeName: "wc_alley",
            location: "동네 골목길 초입",
            avatar: "🚧",
            blocked: [['wc_alley', 'wc_success']],
            text: "골목길 중간쯤 올라가자 가파른 경사 언덕과 함께 바퀴가 걸릴 수밖에 없는 높은 3단 계단 턱이 길을 가로막고 있습니다. 우회해야 할 것 같습니다.",
            choices: [
                { text: "1. 포기하고 큰길로 돌아간다. (시간 -2분)", nextStep: "wc_main_road", timeMod: -120 },
                { text: "2. 무리하게 턱을 휠체어로 넘어가본다. (HP -1.5, 시간 -1분)", nextStep: "wc_accident", hpMod: -1.5, timeMod: -60 }
            ]
        },
        wc_accident: {
            nodeName: "wc_accident",
            location: "계단 턱 앞",
            avatar: "⚠️",
            text: "높은 단차를 넘으려다 휠체어 앞바퀴가 걸려 앞으로 넘어져 어깨를 삐끗했습니다! 다행히 근처 시민이 발견해 넘어진 휠체어를 일으켜 세워 우회하도록 도와줍니다.",
            choices: [
                { text: "1. 아픈 어깨를 이끌고 큰길로 우회한다. (HP -0.5, 시간 -3분)", nextStep: "wc_main_road", hpMod: -0.5, timeMod: -180 }
            ]
        },
        wc_main_road: {
            nodeName: "wc_main_road",
            location: "대로변 인도",
            avatar: "🚘",
            text: "인도를 따라 이동 중 큰 사거리에 다다랐습니다. 그런데 좁은 보도블록 통로를 불법 주차된 오토바이들과 도로 공사 자재들이 꽉 채워 휠체어가 나아갈 수 없습니다.",
            choices: [
                { text: "1. 차도로 내려가서 임시 주행해 통과한다. (위험! HP -0.5, 시간 -30초)", nextStep: "wc_roadway", hpMod: -0.5, timeMod: -30 },
                { text: "2. 반대쪽 차선 횡단보도를 두 번 건너 우회한다. (시간 -2분)", nextStep: "wc_crossing", timeMod: -120 }
            ]
        },
        wc_roadway: {
            nodeName: "wc_roadway",
            location: "대로변 차도 위",
            avatar: "🚗",
            text: "차도로 진입해 휠체어를 모는 동안, 빗길에 질주하는 차량 옆 차도를 질주합니다. 흙탕물이 튀고 경적 소리가 울려 가슴이 철렁했습니다. 식은땀을 흘리며 초등학교 정문 앞에 겨우 당도했습니다.",
            choices: [
                { text: "1. 초등학교 정문 진입로 상황 확인하기", nextStep: "wc_entrance" }
            ]
        },
        wc_crossing: {
            nodeName: "wc_crossing",
            location: "동네 교차로 건너편",
            avatar: "🚶",
            text: "신호등을 두 번 대기하며 휠체어가 갈 수 있는 편평한 인도를 따라 천천히 진입했습니다. 드디어 초등학교 후문 입구에 도착했습니다.",
            choices: [
                { text: "1. 초등학교 후문 보행로 확인하기", nextStep: "wc_back_door" }
            ]
        },
        wc_entrance: {
            nodeName: "wc_entrance",
            location: "초등학교 정문 앞",
            avatar: "🏫",
            blocked: [['wc_entrance', 'wc_success']],
            text: "정문에 도착했으나 철문이 완전히 자물쇠로 잠겨 있습니다. 정문 앞 차량 진입 억제용 무거운 볼라드 때문에 휠체어로 비집고 들어갈 틈이 없습니다.",
            choices: [
                { text: "1. 문이 열릴 때까지 초소 벨을 누르며 대기한다. (시간 -3분)", nextStep: "wc_entrance_wait", timeMod: -180 },
                { text: "2. 휠체어 진입이 가능한 후문으로 급히 돌아간다. (시간 -2분)", nextStep: "wc_back_door", timeMod: -120 }
            ]
        },
        wc_entrance_wait: {
            nodeName: "wc_entrance_wait",
            location: "학교 정문 경비초소 앞",
            avatar: "🔑",
            text: "지속해서 벨을 누른 끝에 우비를 입은 경비원이 뛰어나와 잠금을 풀어 줍니다. '강당 대피소는 지상 1층입니다!' 본관에 휠체어 엘리베이터가 보입니다.",
            choices: [
                { text: "1. 본관 엘리베이터를 타고 1층 대피소로 대피 완료하기", nextStep: "wc_success" }
            ]
        },
        wc_back_door: {
            nodeName: "wc_back_door",
            location: "초등학교 후문 앞",
            avatar: "🧭",
            text: "후문 보행자용 경사 진입로를 통해 운동장 진입에 성공했습니다! 하지만 운동장 내부가 어둡고, 대피소 표지판이 없어 대피층이 지하인지 지상인지 모르겠습니다.",
            choices: [
                { text: "1. 일반적으로 지하에 대피하는 줄 알고 지하주차장으로 향한다. (시간 -2분)", nextStep: "wc_underground", timeMod: -120 },
                { text: "2. 불 켜진 현관 쪽 안내 지도를 확인하러 이동한다. (시간 -1분)", nextStep: "wc_find_map", timeMod: -60 }
            ]
        },
        wc_underground: {
            nodeName: "wc_underground",
            location: "지하 주차장 램프",
            avatar: "☔",
            blocked: [['wc_underground', 'wc_success']],
            text: "지하주차장 경사로를 타고 내려갔지만 차단 셔터가 굳게 닫혀있고, 빗물이 주차장 바닥에 차오르는 중입니다. 경사로를 다시 휠체어로 거슬러 올라가려니 팔에 힘이 빠집니다.",
            choices: [
                { text: "1. 탈진하기 전에 다시 1층으로 올라와 안내 지도를 찾는다. (HP -0.5, 시간 -1분)", nextStep: "wc_find_map", hpMod: -0.5, timeMod: -60 }
            ]
        },
        wc_find_map: {
            nodeName: "wc_find_map",
            location: "본관 로비 현관",
            avatar: "📋",
            text: "본관 로비 안내판을 확인하니 대피소는 지상 1층 다목적 강당입니다. 휠체어 경사로 입구를 무사히 찾아 강당 대피소 안으로 입장합니다.",
            choices: [
                { text: "1. 강당 내부로 진입하여 대피 완료하기", nextStep: "wc_success" }
            ]
        },

        // --- INFANT SCENARIO ---
        inf_start: {
            nodeName: "inf_start",
            location: "지하철역 인근 골목",
            avatar: "📍",
            image: "../assets/images/pixel_infant.png",
            text: "칭얼대는 아이를 아기 띠로 업고, 비상 가방을 멘 채 대피를 준비합니다. 빗줄기가 굵어져 지하철역 사거리 큰길에 물이 고이기 시작했습니다.",
            choices: [
                { text: "1. 아이 손을 꼭 붙잡고 물이 고인 사거리를 건넌다. (HP -0.5, 시간 -1분)", nextStep: "inf_flood", hpMod: -0.5, timeMod: -60 },
                { text: "2. 아이를 단단히 안아 들고 오르막길 골목으로 우회한다. (시간 -2분)", nextStep: "inf_detour", timeMod: -120 }
            ]
        },
        inf_flood: {
            nodeName: "inf_flood",
            location: "지하철역 사거리 교차로",
            avatar: "🌊",
            blocked: [['inf_flood', 'inf_success']],
            text: "물이 발목까지 차오르자 아이가 빗소리와 물살에 놀라 자지러지게 우며 안아달라고 빕니다. 짐과 아기를 동시에 감당하려니 발걸음이 너무 무겁습니다.",
            choices: [
                { text: "1. 길가의 편의점 처마 밑으로 들어가 아이를 달랜다. (시간 -2분, HP +0.5)", nextStep: "inf_convenience", timeMod: -120, hpMod: 0.5 },
                { text: "2. 지체하다 고립될 수 있으니 꿋꿋이 대피소로 전진한다. (HP -0.5, 시간 -1분)", nextStep: "inf_approach", hpMod: -0.5, timeMod: -60 }
            ]
        },
        inf_detour: {
            nodeName: "inf_detour",
            location: "초등학교 부근 오르막 골목",
            avatar: "🤝",
            text: "골목길로 올라오니 빗물 침수는 덜합니다. 가던 도중 유모차 바퀴가 높은 연석 보도블록에 가로막혀 끙끙대는 다른 가구를 만납니다. 함께 유모차를 들어 넘어주고 동행합니다.",
            choices: [
                { text: "1. 이웃 유모차 가구와 보조를 맞춰 초등학교로 전진한다. (시간 -1분)", nextStep: "inf_approach", timeMod: -60 }
            ]
        },
        inf_convenience: {
            nodeName: "inf_convenience",
            location: "골목 안쪽 24시 편의점",
            avatar: "🏪",
            text: "편의점에 들러 아이에게 따뜻한 음료를 물리고 젖은 옷을 정리합니다. 아이가 칭얼거림을 멈췄습니다. 다시 단단히 채비를 마치고 학교 대피소로 나섭니다.",
            choices: [
                { text: "1. 초등학교 대피소 건물로 이동하기", nextStep: "inf_approach" }
            ]
        },
        inf_approach: {
            nodeName: "inf_approach",
            location: "초등학교 강당 현관",
            avatar: "☔",
            text: "폭우를 뚫고 드디어 초등학교 강당 내부 대피소에 무사히 도착했습니다! 땀과 비로 온몸이 젖었습니다. 하지만 아이 기저귀를 갈아야 하는데 내부 안내판이나 도우미가 전혀 보이지 않습니다.",
            choices: [
                { text: "1. 우는 아이를 안고 화장실과 주변 행정실을 찾아 헤맨다. (시간 -3분, HP -0.5)", nextStep: "inf_search", timeMod: -180, hpMod: -0.5 },
                { text: "2. 스마트폰 안전안내문에 기재된 재난공무원 직통 번호로 연락한다. (시간 -1분)", nextStep: "inf_call", timeMod: -60 }
            ]
        },
        inf_search: {
            nodeName: "inf_search",
            location: "강당 건물 내부 복도",
            avatar: "🚪",
            text: "안고 헤맨 끝에 닫혀 있는 방들을 지나 행정실 옆 구석에 간이 가림막으로 설치된 임시 영유아 쉼터를 발견했습니다. 안내가 너무 없어 체력이 다 떨어졌습니다.",
            choices: [
                { text: "1. 쉼터 매트에 아이를 눕히며 대피 완료하기", nextStep: "inf_success" }
            ]
        },
        inf_call: {
            nodeName: "inf_call",
            location: "대피소 내부",
            avatar: "📞",
            text: "재난 담당 공무원과 통화해, 행정실 뒤쪽에 임시 모자 수유 공간이 지정되어 있음을 즉시 안내받아 바로 찾아갔습니다! 휴식 공간과 따뜻한 물을 확보했습니다.",
            choices: [
                { text: "1. 영유아 대피실로 입장해 대피 완료하기", nextStep: "inf_success" }
            ]
        },

        // --- FOREIGNER STUDENT SCENARIO ---
        for_start: {
            nodeName: "for_start",
            location: "동네 주택가 원룸 앞",
            avatar: "📍",
            image: "../assets/images/pixel_foreigner.png",
            text: "갑자기 인근 지역 방향 하늘에서 사이렌 경보음이 크게 울립니다. 스마트폰에 삐- 소리와 함께 재난 긴급 알림 문자가 한글로 수신되었지만, 한글을 읽기 어려워 무슨 상황인지 모릅니다. 매캐한 가스 냄새가 바람을 타고 불어옵니다.",
            choices: [
                { text: "1. 번역 앱을 켜서 문자 이미지를 번역한다. (시간 -1분)", nextStep: "for_translate", timeMod: -60 },
                { text: "2. 다급하게 비명을 지르며 뛰는 사람들을 뒤따라 달린다. (HP -0.5, 시간 -1분)", nextStep: "for_follow", hpMod: -0.5, timeMod: -60 }
            ]
        },
        for_translate: {
            nodeName: "for_translate",
            location: "원룸 건물 1층 로비",
            avatar: "📱",
            text: "번역 결과: '[화학공장] 가스 누출 발생. 즉시 창문을 밀폐하고 실내 대기하거나 안전한 지하 민방위 대피소로 대피 요망.' 가스 유해 물질은 지하로 스며들 수 있어 대피 방향 설정이 매우 시급합니다.",
            choices: [
                { text: "1. 지도 앱에서 지하 대피소(아파트 지하 대피소)를 찾아 내려간다.", nextStep: "for_wrong_way" },
                { text: "2. 가스가 가라앉는 저지대를 피해 고지대인 인근 중학교 대피소로 향한다.", nextStep: "for_correct_way" }
            ]
        },
        for_follow: {
            nodeName: "for_follow",
            location: "동네 골목 시장통",
            avatar: "🏃",
            text: "피난 인파를 무작정 쫓아 달렸습니다. 영문 표지판이나 다국어 지원 대피 안내기가 어디에도 없어 가스 테러인지 누출인지조차 분간이 어렵습니다. 눈이 따갑고 기침이 나기 시작합니다.",
            choices: [
                { text: "1. 가스가 누출된 대로변을 벗어나 지대 높은 학교 언덕길로 대피한다. (HP -0.5, 시간 -2분)", nextStep: "for_correct_way", hpMod: -0.5, timeMod: -120 }
            ]
        },
        for_wrong_way: {
            nodeName: "for_wrong_way",
            location: "인근 아파트 지하 주차장",
            avatar: "☣️",
            blocked: [['for_wrong_way', 'for_success']],
            text: "지하 대피시설로 피신했습니다. 하지만 방송 스피커에서는 한국어로만 긴급 대피 취소 방송이 들립니다. 유출된 화학 가스가 공기보다 무거워 지하 주차장 아래로 고이기 시작합니다! 빨리 탈출해야 합니다.",
            choices: [
                { text: "1. 숨을 참으며 지상 고지대로 다시 올라간다. (HP -1.5, 시간 -2분)", nextStep: "for_correct_way", hpMod: -1.5, timeMod: -120 }
            ]
        },
        for_correct_way: {
            nodeName: "for_correct_way",
            location: "중학교 정문 앞",
            avatar: "🚧",
            blocked: [['for_correct_way', 'for_success']],
            text: "바람을 거슬러 높은 중학교 정문에 간신히 도달했습니다. 하지만 철문이 잠겨 있고, 한국어로 '화학가스 대피 불가, 인근 실내 체육관으로 가세요'라는 수기 안내장만 덜렁 붙어 있습니다.",
            choices: [
                { text: "1. 굳게 닫힌 경비초소 창문을 두드리며 영어로 대피를 호소한다. (시간 -2분)", nextStep: "for_blocked_door", timeMod: -120 },
                { text: "2. 본관 벽면에 작게 적힌 영문 방향 이정표를 찾는다. (시간 -1분)", nextStep: "for_english_sign", timeMod: -60 }
            ]
        },
        for_blocked_door: {
            nodeName: "for_blocked_door",
            location: "학교 경비실 유리창 앞",
            avatar: "🗣️",
            text: "경비원이 영어 질문을 이해하지 못해 손짓발짓으로만 거부합니다. 대피 시설에 외국어 응대 가이드나 소통 카드가 전혀 없어 소중한 골든타임만 낭비됩니다. 가스 냄새가 턱밑까지 번졌습니다.",
            choices: [
                { text: "1. 가스 흡입 위험을 느끼고 영문 이정표가 있는 건물 옆문으로 우회한다. (HP -0.5, 시간 -1분)", nextStep: "for_english_sign", hpMod: -0.5, timeMod: -60 }
            ]
        },
        for_english_sign: {
            nodeName: "for_english_sign",
            location: "학교 본관 옆 비상 계단",
            avatar: "🧭",
            text: "이정표에서 'Chemical Gas Evacuee Area -> Multi-purpose Room (2F)' 영문 문구를 찾아 전용 밀폐 차단문이 설치된 강당 2층으로 안전하게 진입했습니다.",
            choices: [
                { text: "1. 영문 안내 대기소 내부로 들어가 대피 성공하기", nextStep: "for_success" }
            ]
        },

        // --- ELDERLY SCENARIO ---
        eld_start: {
            nodeName: "eld_start",
            location: "독거노인 자택 안방",
            avatar: "👵",
            image: "../assets/images/pixel_elderly.png",
            text: "한낮 폭염 경보 기온이 38도를 돌파했습니다. 오래된 에어컨이 실외기 과열로 멈춰 좁은 방 안이 찜통으로 변했습니다. 머리가 핑 돕니다. 동네 무더위쉼터로 대피해야 합니다.",
            choices: [
                { text: "1. 익숙하지 않은 스마트폰을 켜서 인터넷이나 재난안전 앱으로 무더위쉼터를 검색해본다. (시간 -3분)", nextStep: "eld_app", timeMod: -180 },
                { text: "2. 평소 이웃에게 들었던 언덕 위 동네 경로당 쉼터로 나선다. (시간 -1분)", nextStep: "eld_walk", timeMod: -60 }
            ]
        },
        eld_app: {
            nodeName: "eld_app",
            location: "어두운 자택 거실",
            avatar: "📱",
            text: "앱의 돋보기 메뉴를 켜도 글씨가 너무 작고 복잡해 어디를 눌러야 무더위쉼터가 나오는지 헤맵니다. 화면 밝기가 낮아 눈이 침침하고, 골방 열기 속에서 시간만 계속 흘러갑니다.",
            choices: [
                { text: "1. 스마트폰 검색을 포기하고 실버카에 의지해 밖으로 나간다. (HP -0.5, 시간 -1분)", nextStep: "eld_walk", hpMod: -0.5, timeMod: -60 }
            ]
        },
        eld_walk: {
            nodeName: "eld_walk",
            location: "아스팔트 골목길 언덕",
            avatar: "☀️",
            text: "작열하는 태양 볕 아래 그늘 한 점 없는 가파른 골목 언덕을 실버카를 짚어가며 천천히 올라갑니다. 땅바닥에서 올라오는 열기로 가슴이 두근거리고 호흡이 벅깝니다.",
            choices: [
                { text: "1. 언덕 중턱에 위치한 동네 노인 경로당 쉼터로 들어간다. (시간 -1분)", nextStep: "eld_rest_center", timeMod: -60 }
            ]
        },
        eld_rest_center: {
            nodeName: "eld_rest_center",
            location: "동네 경로당 무더위쉼터 앞",
            avatar: "🚪",
            blocked: [['eld_rest_center', 'eld_success']],
            text: "경로당에 다다랐으나 문이 단단히 잠겨 있습니다. 작은 인쇄지에 '냉방비 지원금 소진 및 주말 미운영으로 인해 휴관합니다'라고 쓰여 있습니다. 주소만 보고 찾아왔는데 헛걸음했습니다.",
            choices: [
                { text: "1. 주민센터 쉼터까지 무작정 다시 한 정거장 더 걸어간다. (위험! HP -1.5, 시간 -2분)", nextStep: "eld_closed_door", hpMod: -1.5, timeMod: -120 },
                { text: "2. 실버카에 붙은 주민센터 대표 전화번호 스티커를 찾아 전화를 건다. (시간 -2분)", nextStep: "eld_phone_search", timeMod: -120 }
            ]
        },
        eld_closed_door: {
            nodeName: "eld_closed_door",
            location: "버스정류장 벤치 골목",
            avatar: "⚠️",
            blocked: [['eld_closed_door', 'eld_success']],
            text: "햇볕을 받으며 무작정 걷던 중 강한 현기증과 탈수 증세로 길가 연석에 털썩 주저앉아 고립되었습니다. 지나가던 요구르트 배달원이 냉수를 건네주며 도와주어 간신히 정신을 수습합니다.",
            choices: [
                { text: "1. 부축을 받으며 바로 옆 동네 행정복지센터 무더위쉼터로 이동한다. (HP -0.5, 시간 -1분)", nextStep: "eld_jumin_center", hpMod: -0.5, timeMod: -60 }
            ]
        },
        eld_phone_search: {
            nodeName: "eld_phone_search",
            location: "경로당 그늘막 아래",
            avatar: "📞",
            text: "주민센터 당직 공무원과 통화가 연결되었습니다. '경로당은 휴관이지만 주민센터 1층 민원실 로비는 상시 무더위 쉼터로 물과 에어컨을 개방하고 있으니 그리로 오세요!' 쉴 곳을 확실히 파악했습니다.",
            choices: [
                { text: "1. 확인한 행정복지센터 대피 구역으로 걸어간다. (시간 -1분)", nextStep: "eld_jumin_center", timeMod: -60 }
            ]
        },
        eld_jumin_center: {
            nodeName: "eld_jumin_center",
            location: "행정복지센터 무더위쉼터 로비",
            avatar: "🏢",
            text: "드디어 에어컨이 시원하게 가동되는 주민센터 무더위 쉼터 로비에 도착했습니다. 시원한 식수를 마시며 대피에 성공합니다.",
            choices: [
                { text: "1. 정수기 물을 들이켜며 대피 완료하기", nextStep: "eld_success" }
            ]
        }
    },

    // Initialize Game
    init() {
        this.changeScreen('screen-title');
    },

    // Screen change handler
    changeScreen(screenId) {
        document.querySelectorAll('.game-section').forEach(sec => {
            sec.classList.remove('active');
        });
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) targetScreen.classList.add('active');
    },

    // Character Selection
    selectCharacter(charId) {
        this.state.persona = charId;
        this.state.hp = 3.0; // Max 3 hearts now
        this.state.timeRemaining = 600; // 10 minutes
        this.state.currentStep = this.personas[charId].startStep;
        this.state.visitedNodes = [this.scenarios[this.state.currentStep].nodeName];
        
        // Start Game Timer
        this.startTimer();

        // Render gameplay screen
        this.changeScreen('screen-gameplay');
        this.renderStep();
    },

    // Timer control
    startTimer() {
        if (this.state.timerInterval) clearInterval(this.state.timerInterval);
        
        this.state.timerInterval = setInterval(() => {
            if (this.state.timeRemaining > 0) {
                this.state.timeRemaining--;
                this.updateHUD();
            } else {
                this.endGame(false, "timeup");
            }
        }, 1000);
    },

    stopTimer() {
        if (this.state.timerInterval) {
            clearInterval(this.state.timerInterval);
            this.state.timerInterval = null;
        }
    },

    // Dynamic Pixel Heart Render Helper (3 hearts maximum, supports half hearts via SVG gradient)
    renderHeartsSVG(hp) {
        let html = `
            <svg width="0" height="0" style="position:absolute; width:0; height:0;">
                <defs>
                    <linearGradient id="half-heart-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="50%" stop-color="#FF0000" />
                        <stop offset="50%" stop-color="#555555" />
                    </linearGradient>
                </defs>
            </svg>
        `;
        for (let i = 0; i < 3; i++) {
            let fillColor = '#555555'; // default empty heart color
            if (hp >= i + 1) {
                fillColor = '#FF0000'; // full heart
            } else if (hp > i && hp < i + 1) {
                fillColor = 'url(#half-heart-grad)'; // half heart
            }
            html += `
                <svg class="pixel-heart" viewBox="0 0 9 8" width="22" height="20" style="margin-right: 3px;">
                    <path d="M2,0 H3 V1 H4 V2 H5 V1 H6 V0 H7 V1 H8 V3 H7 V4 H6 V5 H5 V6 H4 V7 H3 V6 H2 V5 H1 V4 H0 V1 Z" fill="${fillColor}" stroke="#000000" stroke-width="1" />
                </svg>
            `;
        }
        return html;
    },

    // Render HUD with Safe DOM checks
    updateHUD() {
        const char = this.personas[this.state.persona];
        if (!char) return;

        const nameEl = document.getElementById('hud-name');
        if (nameEl) nameEl.textContent = char.name;
        
        const avatarBox = document.getElementById('hud-avatar-box');
        if (avatarBox) avatarBox.textContent = char.avatar;

        const hpHearts = document.getElementById('hud-hp-hearts');
        if (hpHearts) hpHearts.innerHTML = this.renderHeartsSVG(this.state.hp);

        const timeEl = document.getElementById('hud-time');
        if (timeEl) {
            const mins = Math.floor(this.state.timeRemaining / 60);
            const secs = this.state.timeRemaining % 60;
            timeEl.textContent = 
                `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
    },

    // Render Current Step Scenario & Choices & Minimap with Safe DOM checks
    renderStep() {
        this.updateHUD();
        const stepData = this.scenarios[this.state.currentStep];
        if (!stepData) return;

        // Track path history
        if (!this.state.visitedNodes.includes(stepData.nodeName)) {
            this.state.visitedNodes.push(stepData.nodeName);
        }

        // Render Location & Icon (Safe check)
        const avatarEl = document.getElementById('scenario-avatar');
        if (avatarEl) avatarEl.textContent = stepData.avatar || "📍";
        
        const locEl = document.getElementById('scenario-location');
        if (locEl) locEl.textContent = stepData.location || "대피소 가는 길";

        // Render gameplay background bleed dynamically
        const bgContainer = document.getElementById('gameplay-bg');
        if (bgContainer) {
            if (stepData.image) {
                bgContainer.style.backgroundImage = `url(${stepData.image})`;
            } else {
                // Persona-specific fallback ambient gradients instead of duplicating the title screen image!
                let gradient = 'linear-gradient(180deg, #172026 0%, #0b0f12 100%)';
                if (this.state.persona === 'wheelchair' || this.state.persona === 'infant') {
                    gradient = 'linear-gradient(180deg, #12212b 0%, #080e12 100%)'; // Stormy flood blue-grey
                } else if (this.state.persona === 'foreign') {
                    gradient = 'linear-gradient(180deg, #24112c 0%, #0a040e 100%)'; // Hazard chemical purple
                } else if (this.state.persona === 'elderly') {
                    gradient = 'linear-gradient(180deg, #321c0f 0%, #110703 100%)'; // Intense heatwave orange-brown
                }
                bgContainer.style.backgroundImage = gradient;
            }
            bgContainer.style.backgroundSize = 'cover';
            bgContainer.style.backgroundPosition = 'center';
        }

        // Typewriter Effect for Scenario text (Safe check)
        const textContainer = document.getElementById('scenario-text');
        if (textContainer) {
            this.typeWriter(stepData.text, textContainer, () => {
                // Render choices once typing is finished
                this.renderChoices(stepData.choices);
            });
        } else {
            // Fallback if typewriter is disabled or DOM element missing
            this.renderChoices(stepData.choices);
        }

        // Render SVG Minimap
        this.renderMinimap(stepData.nodeName, stepData.blocked || []);
    },

    // Typewriter effect function
    typeWriter(text, element, callback) {
        if (!element) return;
        if (this.state.isTyping) return;
        this.state.isTyping = true;
        element.innerHTML = '';
        
        let i = 0;
        const speed = 20; // Fast speed for gameplay flow
        
        function type() {
            if (i < text.length) {
                element.innerHTML += text.charAt(i);
                i++;
                setTimeout(type, speed);
            } else {
                game.state.isTyping = false;
                if (callback) callback();
            }
        }
        type();
    },

    // Render Choice Buttons with Safe DOM checks
    renderChoices(choices) {
        const container = document.getElementById('choices-container');
        if (!container) return;
        container.innerHTML = '';

        if (!choices || choices.length === 0) return;

        choices.forEach(choice => {
            const btn = document.createElement('button');
            btn.className = 'pixel-btn';
            btn.textContent = choice.text;
            btn.onclick = () => {
                if (this.state.isTyping) return; // Prevent clicking while typing
                this.makeChoice(choice);
            };
            container.appendChild(btn);
        });
    },

    // Handle Choice Click
    makeChoice(choice) {
        // Apply modifications
        if (choice.hpMod) {
            this.state.hp = Math.max(0, Math.min(3.0, this.state.hp + choice.hpMod));
        }
        if (choice.timeMod) {
            this.state.timeRemaining = Math.max(0, this.state.timeRemaining + choice.timeMod);
        }

        this.updateHUD();

        // Check fail conditions
        if (this.state.hp <= 0) {
            this.endGame(false, "hp");
            return;
        }

        if (this.state.timeRemaining <= 0) {
            this.endGame(false, "timeup");
            return;
        }

        // FIXED SUCCESS STEP CHECK: trigger end game if choice nextStep ends with '_success' or is 'success'
        if (choice.nextStep.endsWith('_success') || choice.nextStep === 'success') {
            this.state.currentStep = choice.nextStep;
            this.endGame(true);
        } else {
            this.state.currentStep = choice.nextStep;
            this.renderStep();
        }
    },

    // Interactive SVG Minimap Renderer - Overhauled to look exactly like pixel art blocks
    renderMinimap(currentNode, blocked) {
        const svg = document.getElementById('minimap-svg');
        const legend = document.getElementById('minimap-legend');
        if (!svg) return;

        svg.innerHTML = ''; // Clear previous elements
        const personaId = this.state.persona;
        if (!personaId) return;

        const connections = this.mapConnections[personaId] || [];
        const coords = this.nodeCoordinates;
        
        // 1. Draw Paths (Lines) - Made thicker and blockier
        connections.forEach(([nodeA, nodeB]) => {
            const coordA = coords[nodeA];
            const coordB = coords[nodeB];
            if (!coordA || !coordB) return;

            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", coordA.x);
            line.setAttribute("y1", coordA.y);
            line.setAttribute("x2", coordB.x);
            line.setAttribute("y2", coordB.y);

            // Determine line status
            const isBlocked = blocked.some(
                ([bA, bB]) => (bA === nodeA && bB === nodeB) || (bA === nodeB && bB === nodeA)
            );
            const isTraversed = this.state.visitedNodes.includes(nodeA) && this.state.visitedNodes.includes(nodeB);

            if (isBlocked) {
                line.setAttribute("stroke", "var(--retro-red)");
                line.setAttribute("stroke-width", "5");
                line.setAttribute("stroke-dasharray", "4,3");
                
                // Draw a block X in the middle of the line
                const midX = (coordA.x + coordB.x) / 2;
                const midY = (coordA.y + coordB.y) / 2;
                const xText = document.createElementNS("http://www.w3.org/2000/svg", "text");
                xText.setAttribute("x", midX);
                xText.setAttribute("y", midY + 1);
                xText.setAttribute("fill", "var(--retro-red)");
                xText.setAttribute("font-size", "9px");
                xText.setAttribute("font-weight", "bold");
                xText.setAttribute("text-anchor", "middle");
                xText.setAttribute("dominant-baseline", "middle");
                xText.textContent = "✕";
                svg.appendChild(xText);
            } else if (isTraversed) {
                line.setAttribute("stroke", "var(--retro-yellow)");
                line.setAttribute("stroke-width", "5");
            } else {
                line.setAttribute("stroke", "var(--retro-ink)");
                line.setAttribute("stroke-width", "3");
                line.setAttribute("stroke-dasharray", "4,4");
            }

            svg.appendChild(line);
        });

        // 2. Draw Nodes (Squares instead of Circles for 8-bit retro pixel block aesthetic)
        Object.keys(coords).forEach(nodeKey => {
            // Only draw nodes that belong to the current persona
            const subStr = personaId.substring(0, 3);
            const isMatch = nodeKey.startsWith(subStr);
            if (!isMatch) return;

            const coord = coords[nodeKey];
            const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            // Node size is 9x9 pixels
            rect.setAttribute("x", coord.x - 4.5);
            rect.setAttribute("y", coord.y - 4.5);
            rect.setAttribute("width", "9");
            rect.setAttribute("height", "9");
            rect.setAttribute("rx", "1"); // slightly rounded square for pixel styling

            // Style nodes
            if (nodeKey === currentNode) {
                rect.setAttribute("fill", "var(--retro-yellow)");
                rect.setAttribute("stroke", "var(--retro-ink)");
                rect.setAttribute("stroke-width", "2");
            } else if (nodeKey.includes('success')) {
                rect.setAttribute("fill", "var(--retro-green)");
                rect.setAttribute("stroke", "var(--retro-ink)");
                rect.setAttribute("stroke-width", "2");
            } else if (this.state.visitedNodes.includes(nodeKey)) {
                rect.setAttribute("fill", "var(--retro-blue)");
                rect.setAttribute("stroke", "var(--retro-ink)");
                rect.setAttribute("stroke-width", "1.5");
            } else {
                rect.setAttribute("fill", "var(--retro-soft)");
                rect.setAttribute("stroke", "var(--retro-ink)");
                rect.setAttribute("stroke-width", "1.5");
            }
            svg.appendChild(rect);
        });

        // 3. Draw Player Position Icon over Current Node
        const currentCoord = coords[currentNode];
        if (currentCoord) {
            const playerChar = document.createElementNS("http://www.w3.org/2000/svg", "text");
            playerChar.setAttribute("x", currentCoord.x);
            playerChar.setAttribute("y", currentCoord.y + 0.5);
            playerChar.setAttribute("font-size", "7px");
            playerChar.setAttribute("text-anchor", "middle");
            playerChar.setAttribute("dominant-baseline", "middle");
            
            // Avatar mapping
            playerChar.textContent = this.personas[this.state.persona].avatar;
            svg.appendChild(playerChar);

            // Update Legend Title text
            if (legend) legend.textContent = `현재: ${currentCoord.label}`;
        }
    },

    // Game End Handler with Safe DOM checks
    endGame(isSuccess, reason) {
        this.stopTimer();
        this.changeScreen('screen-result');

        const titleEl = document.getElementById('result-title');
        const badgeEl = document.getElementById('result-badge');
        const descEl = document.getElementById('result-text');
        const insightEl = document.getElementById('insight-text');

        if (isSuccess) {
            if (titleEl) titleEl.textContent = "대피 성공 (SUCCESS)";
            if (badgeEl) {
                badgeEl.className = "result-badge success";
                badgeEl.textContent = "대피 완료!";
            }
            
            if (descEl) {
                if (this.state.persona === 'wheelchair') {
                    descEl.innerHTML = `
                        <p>축하합니다! 휠체어를 타고 무단차 후문 경로를 선택하여 강당 대피소에 도달하셨습니다.</p>
                        <p>현장 검증 결과, 휠체어 단차 정보와 엘리베이터 여부가 데이터로 미리 연계되지 않았다면 대피는 실패했을 것입니다.</p>
                    `;
                } else if (this.state.persona === 'infant') {
                    descEl.innerHTML = `
                        <p>축하합니다! 우는 아기를 비바람으로부터 안전한 아기 쉼터 공간까지 무사히 대피시켰습니다.</p>
                        <p>현장 검증 결과, 대피소 내부에 기저귀를 갈거나 아이를 먹일 쉼터 유무와 긴급 연락처 연동이 대피의 질을 좌우합니다.</p>
                    `;
                } else if (this.state.persona === 'foreign') {
                    descEl.innerHTML = `
                        <p>Congratulations! 화학 가스의 침하 특성을 파악하고 한글 닫힘 문을 영문 가이드를 찾아 우회하여 무사히 2층 강당으로 진입했습니다.</p>
                        <p>밋앤핵 워크숍 피드백 결과, 다국어 문자 지원과 재난유형별(가스 유출 시 지하 대피 위험) 이용 규칙이 누락되면 외국인은 무방비로 고립됩니다.</p>
                    `;
                } else if (this.state.persona === 'elderly') {
                    descEl.innerHTML = `
                        <p>축하합니다! 스마트폰의 한계를 유선(전화) 문의로 해결하고 폭염을 피해 주민센터 쉼터로 안전하게 대피했습니다.</p>
                        <p>밋앤핵 워크숍 피드백 결과, 주소만 보고 찾아간 경로당이 문을 닫았을 때, 전화번호와 실시간 개방 여부 데이터의 공백은 고령층에게 치명적입니다.</p>
                    `;
                }
            }

            if (insightEl) {
                if (this.state.persona === 'wheelchair') {
                    insightEl.textContent = "2026년 탐방 결과: 대피소까지의 경로상 계단/단차 여부, 실제 이용 층수(강당 지상 1층), 휠체어 경사로 위치는 단순 주소보다 중요합니다.";
                } else if (this.state.persona === 'infant') {
                    insightEl.textContent = "2026년 탐방 결과: 영유아 가구는 대피 도중 쉴 수 있는 편의점 같은 '생활 거점'과 도착 후 대피소 내부의 '수유 공간/담당 주체 연락처'가 데이터로 꼭 명시되어야 합니다.";
                } else if (this.state.persona === 'foreign') {
                    insightEl.textContent = "2025년 밋앤핵 결과: 다국어(영문) 재난 전파 채널의 부재, 화학물질 사고 시 대피 원칙(무작정 지하로 가지 말 것)의 가이드는 외국인 생존을 가르는 핵심 공백 데이터입니다.";
                } else if (this.state.persona === 'elderly') {
                    insightEl.textContent = "2025년 밋앤핵 결과: 독거 노인 등 디지털 취약 계층의 대피 경로는 앱 보행 검색보다 직접 전화할 수 있는 유선 채널, 그리고 주민센터 무더위 쉼터 개방 조건/에어컨 가동 조건 등이 연동되어야 안전이 보장됩니다.";
                }
            }
        } else {
            if (titleEl) titleEl.textContent = "대피 실패 (GAME OVER)";
            if (badgeEl) {
                badgeEl.className = "result-badge fail";
                badgeEl.textContent = "대피 실패...";
            }

            if (descEl) {
                if (reason === 'hp') {
                    descEl.innerHTML = `<p>체력이 모두 소진되었습니다! 침수된 도로를 건너다 미끄러지거나, 화학가스를 흡입해 호흡 곤란을 겪거나, 뜨거운 뙤약볕 속 탈수 증세로 길가에서 고립되었습니다.</p>`;
                } else if (reason === 'timeup') {
                    descEl.innerHTML = `<p>대피 제한 시간이 초과되었습니다! 골든타임 내에 대피소 내부로 들어가지 못해 유독가스에 노출되거나 불어난 물길에 가로막혔습니다.</p>`;
                }
            }

            if (insightEl) {
                if (this.state.persona === 'wheelchair') {
                    insightEl.textContent = "2026년 탐방 결과: 휠체어 이용자는 우회로 진입 시 지체 시간이 2~3배로 늘어납니다. 보도상 장애물 데이터가 연동되지 않으면 골든타임을 순식간에 잃어버립니다.";
                } else if (this.state.persona === 'infant') {
                    insightEl.textContent = "2026년 탐방 결과: 영유아를 동반한 대피는 일반 보행속도의 절반 수준입니다. 침수 도로 진입 우회와 편의점 등의 안전 쉼터 데이터 연동이 급선무입니다.";
                } else if (this.state.persona === 'foreign') {
                    insightEl.textContent = "2025년 밋앤핵 결과: 화학 가스 사고 시 한글 텍스트 안내 및 번역 지연은 생존 시간을 직접 갉아먹으며, 무단 지하 대피로 가스 피해를 가중합니다.";
                } else if (this.state.persona === 'elderly') {
                    insightEl.textContent = "2025년 밋앤핵 결과: 앱 중심의 복잡한 지도 안내는 고령층 대피를 더욱 지연시킵니다. 무더위 쉼터 개방 여부가 동기화되지 않는다면 고령자는 뙤약볕 속에서 헛걸음하다 열사병에 노출됩니다.";
                }
            }
        }
    },

    // Restart game
    restart() {
        this.state.visitedNodes = [];
        this.changeScreen('screen-title');
    },

    // Exit simulation (post message to parent window or redirect)
    exitSimulation() {
        this.stopTimer();
        this.state.visitedNodes = [];
        // Check if embedded in iframe
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({ action: 'closeSimulation' }, '*');
        } else {
            // Standalone fallback redirect
            window.location.href = '2026-shelter-data.html';
        }
    }
};

// Start the game on page load
window.onload = () => {
    game.init();
};
