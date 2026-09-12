# mini-games — 설계 노트

2026-09-12 에 만들었다. 광고 없는 폰용 퍼즐 모음.
**파일 하나(`index.html`)가 전부다.** 빌드도, 서버도, 외부 라이브러리도 없다.
깃허브 저장소 `leixlix-pixel/mini-games` → GitHub Pages 로 그대로 나간다.

원드라이브의 이 폴더가 원본이고, 고친 뒤 `git push` 하면 링크에 반영된다.
(`squat-coach` 와 같은 구조다. `stock-briefing` 처럼 「로컬만 고치고 반영 안 되는」 구조가 아니다.)

## 왜 만들었나

앱스토어의 「머리 비우기용」 퍼즐들이 **광고 때문에 못 쓸 지경**이라서다. 한 판 끝날 때마다
전면 광고가 뜨고, 되돌리기 한 번에 30초짜리 영상을 보라고 한다. 이 앱의 존재 이유가 그것이므로
**광고·과금·계정·수집을 들이지 말 것.** 되돌리기도 그냥 버튼이어야 한다.

## 하지 말 것

- **크기 재는 일을 `requestAnimationFrame` 으로 미루지 말 것.** 처음에 각 게임의 `mount()` 가
  rAF 안에서 보드를 그렸는데, **탭이 뒤에 있으면 rAF 가 아예 안 돌아 화면이 빈 채로 남았다**
  (2026-09-12, 실제로 그렇게 터졌다). 지금은 `stageBox()` 가 `#app` 의 `offsetHeight` 를 한 번
  읽어 배치를 강제로 확정시키고 그 자리에서 바로 잰다.
- **보드 크기를 재기 전에 위아래 칸(`#hud`·`#tray`)을 먼저 채울 것.** `#stage` 는 `flex:1` 이라
  위아래가 비어 있으면 실제보다 크게 나오고, 나중에 칸이 생기면서 보드가 화면을 넘친다.
  각 게임의 `mount()` 가 `hud()` → `layout()` 순인 것은 이 때문이다.
- **`localStorage` 접근을 `try/catch` 밖으로 꺼내지 말 것.** 사파리 프라이빗 모드와 `data:` URL
  에서는 **읽기만 해도 예외가 난다**(검증 중에 실제로 걸렸다). 기록 하나 때문에 앱 전체가 안 뜨면
  안 된다. `save`/`load`/`drop` 셋 다 감싸져 있다.
- **물병 판을 `solvable()` 없이 내보내지 말 것.** 무작위로 나눠 담으면 못 푸는 판이 섞인다.
  **못 푸는 판이 광고보다 짜증난다.** 지금은 판을 만들 때마다 깊이우선으로 해답을 찾아 보고
  (노드 25000 개 상한, 40번까지 다시 만든다) 통과한 것만 내보낸다. 21단계(12색)까지
  판당 13ms 안에 끝난다.
- **스도쿠에서 유일해 검사(`count(...,2) !== 1`)를 빼지 말 것.** 답이 둘인 판은 「맞게 뒀는데
  틀렸다」가 된다. 어려움(단서 29개)도 판당 13ms 다.
- **2048 타일 위치 계산에서 `gap` 을 빼지 말 것.** 타일은 `position:absolute` 라 판의
  `padding` 을 무시한다. `px(i) = gap + i*(cell+gap)` 의 앞 `gap` 이 그 padding 몫이다.
  빼면 타일이 판 왼쪽 위로 한 칸씩 밀려 나간다.
- **블록 퍼즐에서 조각을 손가락 위로 띄우는 offset 을 없애지 말 것**
  (`moveDrag` 의 `- drag.h - cellPx*.9`). 없으면 손가락이 조각을 통째로 가려서 어디에 놓이는지
  안 보인다. 폰에서 이게 제일 크게 티가 난다.
- **되돌리기를 빼거나 횟수를 걸지 말 것.** 블록 퍼즐은 **끝난 판도** 한 수 되살린다. 광고 앱들이
  여기서 영상을 물리는데, 그걸 안 하려고 만든 앱이다.
- **파일을 여러 개로 쪼개지 말 것.** 단일 HTML 이라서 링크 하나로 끝나고, 오프라인에서도
  (글꼴만 빼고) 그대로 돈다. 외부 CDN 라이브러리를 들이지 말 것.
- **기록을 서버로 보내지 말 것.** 서버가 없다는 것이 이 앱의 약속이다(README 에 적어 두었다).
  친구들끼리 점수를 겨루자는 말이 나와도, 그건 별개 저장소에서 따로 만들 것.
- **소리를 음원 파일로 바꾸지 말 것.** `snd()` 는 오실레이터 하나로 만든다. 파일을 들이면
  오프라인·용량·자동재생 차단이 한꺼번에 딸려 온다.
- **새로고침 때 `#게임` 해시로 바로 들어가게 만들지 말 것.** 주소를 지우고 홈에서 시작한다
  (`history.replaceState`). 해시로 들어가면 그 상태에서 뒤로가기가 페이지를 떠난다.

## 구조 한눈에

- 화면 둘: `#home` 과 `#play`. `openGame(key)` / `closeGame()` 하나로 갈아 끼운다.
  안드로이드 뒤로가기 버튼은 `history.pushState` + `popstate` 로 받는다.
- 게임 넷은 각자 IIFE 안에 갇혀 있고 `GAMES[key] = {name, desc, tint, icon, rec, mount, relayout, unmount}`
  하나만 밖으로 내놓는다. 서로의 변수를 못 본다(같은 이름의 `place`·`prev`·`over` 가 겹쳐 있다).
- 위 칸(`setHud`)·상단 버튼 둘(`setAct`)·아래 칸(`#tray`)은 게임이 빌려 쓴다.
- 저장은 `qp.<키>` 하나씩: `qp.ws`(물병) `qp.tg`(2048) `qp.sd`(스도쿠) `qp.bp`(블록),
  최고 기록은 `qp.wsBest` `qp.tgBest` `qp.sdBest_<난이도>` `qp.sdDone` `qp.bpBest`.
  판을 끝내면 진행 상태는 지우고 기록만 남긴다.
- 소리는 Web Audio 오실레이터 하나(`snd`), 진동은 `navigator.vibrate`(아이폰은 무시한다).

## 손볼 때 확인할 것

브라우저로 열어 콘솔에 붙여 넣으면 **사람 손 없이 한 판을 끝까지 돌려 볼 수 있다.**
게임을 고쳤으면 해당하는 것을 돌릴 것.

**2048 — 무작위로 두어 게임오버까지**

```js
const K=['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'];
openGame('tg');
for(let i=0;i<300;i++){ window.dispatchEvent(new KeyboardEvent('keydown',{key:K[Math.floor(Math.random()*4)]}));
  await new Promise(r=>setTimeout(r,125)); if(document.querySelector('.veil')) break; }
document.querySelector('.veil h3').textContent;   // → "더 움직일 수 없어요"
```

**스도쿠 — 힌트로 끝까지 채우기**

```js
openGame('sd');            // 난이도 하나 고른 뒤
for(let i=0;i<90 && !document.querySelector('.veil');i++){ document.querySelector('#sdHint').click(); await new Promise(r=>setTimeout(r,5)); }
document.querySelector('.veil h3').textContent;   // → "○○ 완성"
```

**물병 — 판을 읽어 스스로 풀기** (긴 스크립트라 `자동풀이.js` 로 따로 두지 않았다.
아래 요령만 적어 둔다: `.bottle` 의 `.lq` 배경색으로 판을 읽고, 같은 규칙의 깊이우선 탐색으로
해답을 구한 뒤 병 두 개를 차례로 `click()` 한다. 23단계까지 넘침 없이 통과하는 것을 확인했다.)

**블록 퍼즐 — 조각을 놓을 수 있는 첫 자리에 계속 놓기**
(`.bc.f` 로 판을 읽고 `.piece` 의 `i.o` 아닌 칸으로 조각 모양을 읽어, `pointerdown` →
`pointermove` → `pointerup` 을 합성한다. 손가락 좌표는 조각 좌상단 + 폭/2, 높이 + 셀×0.9.)

**판 만드는 속도는 Node 로** — `index.html` 에서 `<script>` 를 떼어 내 물병의 `make`/`solvable`,
스도쿠의 `build`/`count` 만 꺼내 돌린다. 둘 다 **판당 15ms 를 넘으면 안 된다**(넘으면 폰에서
「새 판」 누를 때 멈칫한다).

## 남은 것 (하고 싶으면)

- **색약 배려.** 물병 12색은 색으로만 구분한다. 액체에 작은 무늬나 기호를 넣는 선택지가 있으면
  좋겠는데, 화면이 지저분해지는 것과 맞바꿔야 한다. 아직 안 넣었다.
- 게임 추가는 `GAMES.<키> = {...}` 하나 늘리면 된다. 홈 메뉴는 `GAMES` 를 그대로 훑는다.
