"use strict";
// UI
// ------------------------------

// 入力欄拡張
autosize(document.querySelectorAll('.autosize'));

// チャットログを最下部まで
function scrollBottom(tabId){
  const tab = document.getElementById('chat-logs-tab'+tabId);
  const tabname = document.querySelector('#chat-tab'+tabId+' > h2 .tab-name');
  const notice  = document.querySelector('#chat-tab'+tabId+' > .notice-unread');
  tab.scrollTop = tab.scrollHeight;
  tabname.dataset.unread = 0;
  notice.dataset.unread = 0;
}
// ログのスクロール位置を確認
function scrollCheck(tabId){
  if(window.matchMedia('(max-width:600px)').matches && tabId != mainTab){
    return 0;
  }
  if(!document.getElementById('chat-tab'+tabId).classList.contains('close')){
    const obj = document.getElementById('chat-logs-tab'+tabId);
    const bottom = obj.scrollHeight - obj.clientHeight;
    if (bottom - 100 <= obj.scrollTop) {
      return 1;
    }
  }
}

// フォントサイズ
$(function($){
  $(document).on("input", '.option-fontsize-tab', function(e) {
    const num = e.target.closest('.chat').dataset.tab;
    const lines = document.querySelectorAll('#chat-logs-tab'+num);
    lines.forEach(function(line) {
      line.style.fontSize = e.target.value+'%';
    });
  });
});

// ボックス透過率
const optionBoxOpacity = document.getElementById('option-box-opacity');
optionBoxOpacity.oninput = function (){
  const boxes = document.getElementsByClassName('box');
  for(let i=0; i<boxes.length; i++){
    boxes[i].style.backgroundColor =  'rgba(0,0,0,'+ optionBoxOpacity.value +')';
  }
};

// ボックス開閉
function boxOpen(id){
  document.getElementById(id).style.transform = 'none';
  document.getElementById(id).style.opacity = 1;
}
function boxClose(id){
  document.getElementById(id).style.transform = 'scaleY(0)';
  document.getElementById(id).style.opacity = 0;
}
// トピックを開く
function topicOpen(){
  boxOpen('edit-topic');
  let topicValue = document.getElementById('topic-value').innerHTML;
  topicValue = topicValue.replace(/<br>/g, '\n');
  topicValue = topicValue.replace(/&lt;/g, '<');
  topicValue = topicValue.replace(/&gt;/g, '>');
  document.getElementById('edit-topic-value').value = topicValue;
  autosize.update(document.getElementById('edit-topic-value'));
}
// NPCの開閉・保存
  //開く
function npcOpen(){
  boxOpen('edit-npc');
  let npcValue = '';
  for(let i in nameList){
    if (i == 0) continue;
    npcValue += nameList[i]['name']+(nameList[i]['color']?nameList[i]['color']:'')+"\n";
  }
  document.getElementById('edit-npc-value').value = npcValue;
  autosize.update(document.getElementById('edit-npc-value'));
}
  //保存
function npcSave(){
  const lines = document.getElementById('edit-npc-value').value.split(/\n/g);
  let newList = [
    { 'name': nameList[0]['name'], 'color': nameList[0]['color'] }
  ];
  for(let i=0; i<lines.length; i++){
    let color = "#" + randomColor();
    const name = lines[i].replace(/[#＃]([0-9a-zA-Z]{6})$/, () => { color = '#'+RegExp.$1; return '' });
    if(!name){ continue }
    newList[i+1] = {};
    newList[i+1]['name'] = name;
    newList[i+1]['color'] = color;
  }
  nameList = newList;
  npcBoxSet();
  localStorage.setItem(roomId+'-name', JSON.stringify(nameList));
}
// ランダムカラー
function randomColor(){
  const l = 6;
  const c = "0123456789abcdef";
  const cl = c.length;
  let r = "";
  for(var i=0; i<l; i++){
    r += c[Math.floor(Math.random()*cl)];
  }
  return r;
}
// セレクトボックスにセット
function npcBoxSet(){
  const select = document.getElementById('form-name');
  const nowSelectName = select.options[select.selectedIndex].text;
  let nowSelectValue = 0;
  while (0 < select.childNodes.length) {
    select.removeChild(select.childNodes[0]);
  }
  let n = 0;
  for(let i in nameList){
    let op = document.createElement("option");
    op.text = nameList[i]['name'];
    op.value = i;
    op.style.color = nameList[i]['color'];
    select.appendChild(op);
    if(nowSelectName === nameList[i]['name']) nowSelectValue = i;
    n++;
  }
  $("#form-name").val(nowSelectValue);
  
  select.size = (n < 2) ? 2 : n; //高さ
}
// 名前変更
$("#form-name").change(function(){
  const num = $(this).val();
  document.getElementById('main-name1').innerHTML   = nameList[num]['name'];
  document.getElementById('main-name1').style.color = nameList[num]['color'];
  document.getElementById('form-color').value      = nameList[num]['color'];
  document.getElementById('form-color-text').value = nameList[num]['color'];
});
// 色変更
$(".selectcolor-main").change(function(){
  const color = $(this).val();
  document.getElementById('form-color').value = color;
  document.getElementById('form-color-text').value = color;
  nameColorChange(color);
});
function nameColorChange(color){
  const num = document.getElementById('form-name').value;
  nameList[num]['color'] = color;
  $("#form-name option[value="+num+"]").css('color', color);
  localStorage.setItem(roomId+'-name', JSON.stringify(nameList));
  document.getElementById('main-name1').style.color = color;
}
// ユニット作成の色変更
$(".selectcolor-unit").change(function(){
  const color = $(this).val();
  document.getElementById('new-unit-color-value').value = color;
  document.getElementById('new-unit-color-value-text').value = color;
});
// 入室時の色変更
$(".selectcolor-in").change(function(){
  const color = $(this).val();
  document.getElementById('in-color').value = color;
  document.getElementById('in-color-text').value = color;
});

// メインフォームのダイス追加
function diceAdd(){
  let n = 1;
  while (document.getElementById('dice-button-'+n)){
    n++;
  }
  let newOutline = document.createElement('div');
  let newDice = document.createElement('div');
  newDice.classList.add('dice-button');
  newDice.innerHTML = `<button onclick="formSubmit('dice-button-${n}');"></button><textarea class="form-comm" id="dice-button-${n}" data-lock="full" rows="1"></textarea><i onclick="lockTypeChange(${n});"></i></div>`;
  newOutline.appendChild(newDice);
  document.querySelector("#main-form .form-dice").appendChild(newOutline);
  autosize(document.getElementById('dice-button-'+n));
}
function diceDel(){
  const mainDiceArea = document.querySelector("#main-form .form-dice");
  const target = mainDiceArea.lastElementChild;
  if(mainDiceArea.childElementCount <= 2) return;
  mainDiceArea.removeChild(target);
}
let diceColumn = 3;
function diceScale(){
  diceColumn = diceColumn <= 1 ? 5 : diceColumn-1;
  document.querySelector("#main-form .form-dice").style.gridTemplateColumns =  `repeat(${diceColumn}, 1fr)`;
  autosize.update(document.querySelectorAll("#main-form .dice-button textarea"));
}
function lockTypeChange(num){
  const obj = document.getElementById('dice-button-'+num);
  let type = obj.dataset.lock;
  if     (type === 'full'){ type = 'name'; }
  else if(type === 'name'){ type = 'off'; }
  else if(type === 'off' ){ type = 'memo'; }
  else                    { type = 'full'; }
  obj.dataset.lock = type;
}

let unitIdToName = {};
// ユニット追加
function unitAdd(unitName){
  const unitId = randomId(8);
  unitList[unitName]['id'] = unitId;
  unitIdToName[unitId] = unitName;
  let newUnit = document.createElement('dl');
  newUnit.setAttribute("id",'stt-unit-'+unitId);
  newUnit.innerHTML = '<dt onclick="sheetSelect(\''+unitId+'\');sheetOpen();" style="color:'+unitList[unitName]['color']+';"><b class="check" id="stt-'+unitId+'-check"></b>'+unitName+'</dt>';
  if(unitList[unitName]['status'] === undefined) { unitList[unitName]['status'] = {}; }
  for(let i in setStatus) {
    newUnit.innerHTML += `<dd id="stt-${unitId}-${setStatus[i]}" style="display:${unitList[unitName]['status'][setStatus[i]] ? 'block' : 'none'}">${setStatus[i]}: <span id="stt-${unitId}-${setStatus[i]}-value"></span></dd>`;
  }
  document.getElementById("status-body").appendChild(newUnit);
  
  const unitNameEscaped = unitName.replace(/'/g, "&#x27;").replace(/"/g, '&quot;');
  
  let paletteDefault = String.raw`チャットパレット入力例：
2d6+{冒険者}+{知力}
r18+{追加D} ダメージ！
//冒険者=3
//ファイター=3
//知力=2
//筋力=3
//追加D={ファイター}+{筋力}
クリックで↓の入力欄にコピー
ダブルクリックで即送信`;
  if(chatPalettes[unitName]) { paletteDefault = chatPalettes[unitName]; }
  
  let statusRemoconArea = ``;
  for (let i in setStatus){
    statusRemoconArea += `
            <li class="dice-button">
              <button onclick="formSubmit('edit-stt-${unitId}-${setStatus[i]}-value','${unitNameEscaped}');">${setStatus[i]}</button>
              <input type="text" class="form-comm" id="edit-stt-${unitId}-${setStatus[i]}-value" data-comm-pre="@${setStatus[i]}" data-palette-target='${unitNameEscaped}'>
            </li>`;
  }

  let newSheet = document.createElement('div');
  newSheet.setAttribute("id",'sheet-unit-'+unitId);
  newSheet.classList.add('box','sheet');
  if(!sheetOpenCheck){ newSheet.classList.add('closed'); }
  if(selectedSheet !== unitId){ newSheet.style.visibility = 'hidden'; }
  newSheet.innerHTML = `
      <h2 style="color:${unitList[unitName]['color']}">${unitName}</h2>
      <div class="sheet-body">
        <p class="right">
          <input type="url" placeholder="※まだ機能しません">
          <button>ゆとシート読込</button>
        </p>
        <div class="status-remocon-area">
          <h3>ステータスリモコン</h3>
          <select>
          <option id="stt-calc-on-${unitId}">入力内容によって計算/部分更新する</option>
          <option>入力内容そのままで更新する</option>
          </select>
          <ul>${statusRemoconArea}
            <li class="dice-button half">
              <button onclick="commSend('@check',0,'${unitNameEscaped}',unitList['${unitNameEscaped}']['color']);">✔</button><input type="text" value="@check" readonly>
            </li>
            <li class="dice-button half">
              <button onclick="commSend('@uncheck',0,'${unitNameEscaped}',unitList['${unitNameEscaped}']['color']);">×</button><input type="text" value="@uncheck" readonly>
            </li>
          </ul>
        </div>
        <div class="chat-palette-area">
          <h3>チャットパレット</h3>
          <div class="chat-palette-palette-area">
            <select id="chat-palette-unit-${unitId}" class="chat-palette" data-name='${unitNameEscaped}' size="2"></select>
            <textarea id="chat-palette-edit-unit-${unitId}" class="chat-palette" style="display:none">${paletteDefault}</textarea>
            <span class="edit button" id="chat-palette-button-open-unit-${unitId}" onclick="paletteEditOpen('${unitId}')">🖋編集</span>
            <span class="edit button" id="chat-palette-button-save-unit-${unitId}" onclick="paletteEditSave('${unitId}')" style="display:none">✔確定</span>
          </div>
          <div class="comm-area">
            <textarea id="chat-palette-comm-unit-${unitId}" class="form-comm autosize" rows="1" data-palette-target='${unitNameEscaped}'></textarea>
            <button onclick="formSubmit('chat-palette-comm-unit-${unitId}','${unitNameEscaped}');">送信</button>
          </div>
        </div>
      <div class="sheet-footer">
        <textarea id="memo-unit-${unitId}" class="autosize" placeholder="個人メモ" rows="2" onchange="sheetMemoSave(this,'${unitNameEscaped}');">${sheetMemos[unitName]?sheetMemos[unitName]:''}</textarea>
      </div>
      <span class="close button" onclick="sheetClose();">×</span>
      <div class="close-area" onclick="sheetOpen();"></div>
    </div>`;
  
  document.getElementById("base").appendChild(newSheet);
  paletteEditSave(unitId);
  autosize(document.getElementById('chat-palette-comm-unit-'+unitId));
  autosize(document.getElementById('memo-unit-'+unitId));
}
// シート開閉
let sheetOpenCheck = 1;
function sheetOpen(){
  const sheet = document.querySelectorAll('.sheet');
  for(let i=0; i<sheet.length; i++){
    sheet[i].classList.remove('closed');
  }
  sheetOpenCheck = 1;
}
function sheetClose(){
  const sheet = document.querySelectorAll('.sheet');
  for(let i=0; i<sheet.length; i++){
    sheet[i].classList.add('closed');
  }
  sheetOpenCheck = 0;
}
function sheetSelect(id){
  const sheet = document.querySelectorAll('.sheet[id^=sheet]');
  for(let i=0; i<sheet.length; i++){
    sheet[i].style.visibility = 'hidden';
  }
  document.getElementById('sheet-unit-'+id).style.visibility = 'visible';
  selectedSheet = id;
}
// チャットパレット編集
function paletteEditOpen(id){ // 編集画面を開く
  document.getElementById('chat-palette-unit-'+id).style.display = 'none';
  document.getElementById('chat-palette-edit-unit-'+id).style.display = 'block';
  document.getElementById('chat-palette-button-open-unit-'+id).style.display = 'none';
  document.getElementById('chat-palette-button-save-unit-'+id).style.display = 'block';
  
  const select = document.getElementById('chat-palette-unit-'+id);
  let paletteText = '';
  for(let i=0; i<select.options.length; i++){
    const op = select.options[i].value;
    paletteText += (op === ''?'':op) + "\n";
  }
  paletteText = paletteText.replace(/\n+$/g,'');
  document.getElementById('chat-palette-edit-unit-'+id).value = paletteText;
}
function paletteEditSave(id){ // 編集画面を閉じて保存
  document.getElementById('chat-palette-unit-'+id).style.display = 'block';
  document.getElementById('chat-palette-edit-unit-'+id).style.display = 'none';
  document.getElementById('chat-palette-button-open-unit-'+id).style.display = 'block';
  document.getElementById('chat-palette-button-save-unit-'+id).style.display = 'none';
  
  let textData = document.getElementById('chat-palette-edit-unit-'+id).value;
  chatPalettes[unitIdToName[id]] = textData;
  localStorage.setItem(roomId+'-palette', JSON.stringify(chatPalettes));
  
  const lines = textData.split(/\n/g);
  const select = document.getElementById('chat-palette-unit-'+id);
  while (0 < select.childNodes.length) {
    select.removeChild(select.childNodes[0]);
  }
  for(let i=0; i<lines.length; i++){
    let op = document.createElement("option");
    op.text = lines[i]?lines[i]:'　';
    op.value = lines[i];
    select.appendChild(op);
  }
}
// 個人メモ保存
function sheetMemoSave(obj, name){
  sheetMemos[name] = obj.value;
  localStorage.setItem(roomId+'-sheetMemo', JSON.stringify(sheetMemos));
}

// 共有メモ追加
function memoUpdate(){
  //const title = (shareMemo[num].split(/<br>/g))[0];
  //let newMemo = document.createElement('dt');
  //newMemo.innerHTML = title;
  //newMemo.setAttribute("onclick","memoSelect("+num+");");
  //document.getElementById("memo-body").appendChild(newMemo);
  document.getElementById("memo-list").innerHTML = '';
  for (let i in shareMemo) {
    let newMemo = document.createElement('li');
    newMemo.innerHTML = (shareMemo[i].split(/\n/g))[0];
    newMemo.setAttribute("onclick","memoSelect("+i+");");
    document.getElementById("memo-list").appendChild(newMemo);
  }
}
// 共有メモ選択
let selectedMemo = '';
function memoSelect(num){
  const memoValue = document.getElementById("sheet-memo-value");
  memoValue.value = shareMemo[num] ? shareMemo[num] : '';
  autosize(memoValue);
  autosize.update(memoValue);
  sheetSelect('memo');
  selectedMemo = num;
  sheetOpen();
}

// タブ追加
function tabAdd(tabNum){
  let newTab = document.createElement('div');
  newTab.setAttribute("id",'chat-tab'+tabNum);
  newTab.classList.add('box','chat');
  if(mainTab == tabNum){ newTab.classList.add('main'); } else { newTab.classList.add('sub'); }
  newTab.dataset.tab = tabNum;
  newTab.innerHTML = `
    <h2><label><input type="radio" id="check-maintab-tab${tabNum}" name="check-maintab" value="${tabNum}" ${(mainTab == tabNum ? 'checked':'')}><span class="tab-name" data-unread="0">${tabList[tabNum]}</span></label></h2>
    <div class="logs" id="chat-logs-tab${tabNum}" data-unread="0"></div>
    <div class="input-form"><div class="comm-area">
    <textarea type="text" class="form-comm autosize" id="form-comm-tab${tabNum}" rows="1" placeholder="Shift+Enterで改行"></textarea>
    <button onclick="formSubmit('form-comm-tab${tabNum}');">送信</button>
    </div></div>
    <div class="option"><input class="option-fontsize-tab" type="range" min="80" max="120" step="1" value="100"></div>
    <div class="notice-unread" onclick="scrollBottom('${tabNum}');" data-unread="0">▼新着発言</div>
    <span class="close button">×</span>`;
  document.getElementById("chat-area").appendChild(newTab);
  autosize(document.getElementById('form-comm-tab'+tabNum));
}
// メインタブの切り替え
function mainTabChange(num){
  const thisTab = document.getElementById('chat-tab'+num);
  const tabs = document.querySelectorAll('.box.chat');
  
  if(thisTab.classList.contains('close')) {
    $("#chat-area").append($(thisTab));
      thisTab.classList.remove('close');
      if(mainTab){
        thisTab.classList.add('sub');
        document.getElementById('check-maintab-tab'+num).checked = false;
        document.getElementById('check-maintab-tab'+mainTab).checked = true;
      }
      else {
        thisTab.classList.add('main');
        document.getElementById('check-maintab-tab'+num).checked = true;
        mainTab = num;
      }
    scrollBottom(thisTab.dataset.tab);
  }
  else {
    for(let i=0; i<tabs.length; i++){
      tabs[i].classList.remove('main');
      tabs[i].classList.add('sub');
    }
    thisTab.classList.add('main');
    thisTab.classList.remove('sub','close');
    document.getElementById('check-maintab-tab'+num).checked = true;
    
    mainTab = num;
  }
  
  for(let i=0; i<tabs.length; i++){
    scrollBottom(tabs[i].dataset.tab);
  }
  
}
function tabToggle(num){
  document.getElementById('chat-tab'+num).classList.add('close');
  document.getElementById('chat-tab'+num).classList.remove('main','sub');
  document.getElementById('check-maintab-tab'+num).checked = false;
  $("#chat-closes-area").append($("#chat-tab"+num));

  if(mainTab == num && !document.getElementById('check-maintab-tab'+num).checked){
    const openedTab = document.querySelector('#chat-area .box.chat');
    if(openedTab){ mainTabChange(Number(openedTab.dataset.tab)); }
    else { mainTab = 0; }
  }
}
// タブ開閉
$(function($){
  $(document).on("change", 'input[name="check-maintab"]:radio', function(e) {
    const num = $(e.target).val();
    mainTabChange(num);
  });
  
  $(document).on("click", '.chat .close.button', function(e) {
    const num = e.target.closest('.chat').dataset.tab;
    tabToggle(num);
  });
});

// タグ挿入
$(".insert-ruby").click(function(){
  const selText = $('#form-comm-main').selection();
  $("#form-comm-main")
    .selection("insert", {text: "|"+selText+"《", mode: "before"})
    .selection('replace', {text: ''})
    .selection("insert", {text: "》", mode: "after"});
  autosize.update($('#form-comm-main'));
});
$(".insert-em").click(function(){
  $("#form-comm-main")
    .selection("insert", {text: "《《", mode: "before"})
    .selection("insert", {text: "》》", mode: "after"});
  autosize.update($('#form-comm-main'));
});
$(".insert-hide").click(function(){
  $("#form-comm-main")
    .selection("insert", {text: "{{", mode: "before"})
    .selection("insert", {text: "}}", mode: "after"});
  autosize.update($('#form-comm-main'));
});
$(".insert-bold").click(function(){
  $("#form-comm-main")
    .selection("insert", {text: "<b>", mode: "before"})
    .selection("insert", {text: "</b>", mode: "after"});
  autosize.update($('#form-comm-main'));
});
$(".insert-oblique").click(function(){
  $("#form-comm-main")
    .selection("insert", {text: "<i>", mode: "before"})
    .selection("insert", {text: "</i>", mode: "after"});
  autosize.update($('#form-comm-main'));
});
$(".insert-strike").click(function(){
  $("#form-comm-main")
    .selection("insert", {text: "<s>", mode: "before"})
    .selection("insert", {text: "</s>", mode: "after"});
  autosize.update($('#form-comm-main'));
});
$(".insert-color").click(function(){
  const selText = $('#form-comm-main').selection();
  $("#form-comm-main")
    .selection("insert", {text: "<c:", mode: "before"})
    .selection('replace', {text: ''})
    .selection("insert", {text: ">"+selText+"</c>", mode: "after"});
  autosize.update($('#form-comm-main'));
});
$(".insert-big").click(function(){
  $("#form-comm-main")
    .selection("insert", {text: "<big>", mode: "before"})
    .selection("insert", {text: "</big>", mode: "after"});
  autosize.update($('#form-comm-main'));
});
$(".insert-small").click(function(){
  $("#form-comm-main")
    .selection("insert", {text: "<small>", mode: "before"})
    .selection("insert", {text: "</small>", mode: "after"});
  autosize.update($('#form-comm-main'));
});
$(".insert-left").click(function(){
  $("#form-comm-main")
    .selection("insert", {text: "<left>", mode: "before"})
    .selection("insert", {text: "</left>", mode: "after"});
  autosize.update($('#form-comm-main'));
});
$(".insert-center").click(function(){
  $("#form-comm-main")
    .selection("insert", {text: "<center>", mode: "before"})
    .selection("insert", {text: "</center>", mode: "after"});
  autosize.update($('#form-comm-main'));
});
$(".insert-right").click(function(){
  $("#form-comm-main")
    .selection("insert", {text: "<right>", mode: "before"})
    .selection("insert", {text: "</right>", mode: "after"});
  autosize.update($('#form-comm-main'));
});

// キー動作
document.onkeydown = function(e){
  if (e.ctrlKey) {
    // 名前↑
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const obj = document.getElementById("form-name");
      let num = obj.selectedIndex;
      obj.selectedIndex = (num > 0) ? num-1 : obj.length-1;
    }
    // 名前↓
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const obj = document.getElementById("form-name");
      let num = obj.selectedIndex;
      obj.selectedIndex = (num < obj.length-1) ? num+1 : 0;
    }
    // タブ←
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if(mainTab){
        const num = (mainTab > 1) ? mainTab-1 : Object.keys(tabList).length;
        mainTabChange(num);
      }
      else { mainTabChange(1); }
    }
    // タブ→
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      if(mainTab){
        const num = (mainTab < Object.keys(tabList).length) ? mainTab+1 : 1;
        mainTabChange(num);
      }
      else { mainTabChange(1); }
    }
  }
}

// スマホ用
$(window).resize(function(){
  if(window.matchMedia('(max-width:600px)').matches){ scrollBottom(mainTab); }
});

// jquery ui
$(function(){
  // ソート
  $('#status-body').sortable({handle:'dt'});
  $('#memo-list').sortable();
  $('#chat-area').sortable({handle:'h2'});
  // ドラッグ移動
  //$('.float-box').draggable();
});
