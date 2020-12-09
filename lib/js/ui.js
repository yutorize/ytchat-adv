"use strict";
// UI
// ------------------------------

// 入力欄拡張 ----------------------------------------
autosize(document.querySelectorAll('.autosize'));
function autosize (elm){
  autosizeSet(elm.length ? elm : [elm]);
}
function autosizeSet (elm){
  elm.forEach(function(obj) {
    obj.addEventListener("input",function(e){ autosizeResize([e.srcElement]); });
  });
}
function autosizeUpdate (elm){
  autosizeResize(elm.length ? elm : [elm]);
}
function autosizeResize (elm){
  elm.forEach(function(obj) {
    if(obj.offsetHeight > obj.scrollHeight){
      obj.style.height = "auto";
    }
    if(obj.offsetHeight < obj.scrollHeight){
      obj.style.height = obj.scrollHeight + "px";
    }
  });
}

// 古いログを削除 ----------------------------------------
let oldLogs = {};
function oldLogHide(tabId){
  const tab = document.getElementById('chat-logs-tab'+tabId);
  const count = tab.childElementCount;
  for (let i = count; i > 40; i--) {
    oldLogs[tabId].push(tab.firstElementChild);
    tab.removeChild(tab.firstElementChild);
  }
}

// チャットログを最下部まで ----------------------------------------
function scrollBottom(tabId){
  const tab = document.getElementById('chat-logs-tab'+tabId);
  tab.scrollTop = tab.scrollHeight;
  document.querySelector('#chat-tab'+tabId+' > h2 .tab-name').dataset.unread = 0;
  document.querySelector('#chat-tab'+tabId+' > .notice-unread').dataset.unread = 0;
  document.querySelector('#tablist-tab'+tabId).dataset.unread = 0;
  
  oldLogHide(tabId)
}

// ログのスクロール位置を確認 ----------------------------------------
function scrollCheck(tabId){
  if(window.matchMedia('(max-width:600px)').matches && tabId != mainTab){
    return 0;
  }
  if(!document.getElementById('chat-tab'+tabId).classList.contains('close')){
    const obj = document.getElementById('chat-logs-tab'+tabId);
    const bottom = obj.scrollHeight - obj.clientHeight;
    if (bottom - 50 <= obj.scrollTop) {
      return 1;
    }
  }
}
// ログを最下部／最上部にスクロールしたか ----------------------------------------
function bottomCheck(tabId,obj) {
  const scrollHeight = obj.scrollHeight;
  const scrollTop = obj.scrollTop;
  const scrollPosition = obj.offsetHeight + scrollTop;
  //最下部までスクロールしたら未読通知を消す
  if (scrollHeight - scrollPosition <= 10) {
    document.querySelector('#chat-tab'+tabId+' > h2 .tab-name').dataset.unread = 0;
    document.querySelector('#chat-tab'+tabId+' > .notice-unread').dataset.unread = 0;
    document.querySelector('#tablist-tab'+tabId).dataset.unread = 0;
  }
  //最上部までスクロールしたら古いログを表示
  else if(scrollTop < 1){
    for (let i = 0; i < 20; i++) {
      const insert = oldLogs[tabId].pop();
      if(!insert) break;
      obj.prepend(insert);
    }
    obj.scrollTop = obj.scrollHeight - scrollHeight;
  }
}


// ミュートボタン ----------------------------------------
let muteOn = 0;
function muteToggle(){
  const elm = document.querySelectorAll('.mute-button');
  if(muteOn){
    elm.forEach(function(obj) { obj.classList.remove('mute-on'); });
    bgmMute(false);
    muteOn = 0;
  }
  else {
    elm.forEach(function(obj) { obj.classList.add('mute-on'); });
    bgmMute(true);
    muteOn = 1;
  }
}

// 背景濃度 ----------------------------------------
const optionBGOpacity = document.getElementById('option-bg-opacity');
optionBGOpacity.oninput = function (){
  document.documentElement.style.setProperty('--bg-opacity', optionBGOpacity.value+'%');
  document.getElementById('option-bg-opacity-view').innerHTML = Math.round(optionBGOpacity.value);
};

// ボックス透過率 ----------------------------------------
const optionBoxOpacity = document.getElementById('option-box-opacity');
optionBoxOpacity.oninput = function (){
  document.documentElement.style.setProperty('--box-bg-opacity', optionBoxOpacity.value);
  document.getElementById('option-box-opacity-view').innerHTML = Math.round(optionBoxOpacity.value * 100);
};

// フォントサイズ ----------------------------------------
let fontSize = {};
$(function($){
  $(document).on("input", '.option-fontsize-tab', function(e) {
    const num = e.target.closest('.chat').dataset.tab;
    const obj = document.getElementById('chat-logs-tab'+num);
    obj.style.fontSize = e.target.value+'%';
    fontSize[num] = e.target.value;
    document.querySelector('#chat-tab'+num+' .option').dataset.value = e.target.value;
    localStorage.setItem(roomId+'-fontSize', JSON.stringify(fontSize));
  });
});

// フォント明暗 ----------------------------------------
let fontLightness = localStorage.getItem('fontLightness') || 100;
if(fontLightness) {
  fontLightnessSet();
  document.getElementById('option-font-lightness').value = fontLightness;
}
document.getElementById('option-font-lightness').oninput = function (e){
  fontLightness = e.target.value;
  fontLightnessSet();
  localStorage.setItem('fontLightness', fontLightness);
};
function fontLightnessSet() {
  document.documentElement.style.setProperty('--logs-font-color-lightness', fontLightness+'%');
  document.getElementById('option-font-lightness-view').innerHTML = fontLightness;
}

//フォントファミリー ----------------------------------------
let fontFamily = localStorage.getItem('fontFamily') || '';
if(fontFamily) {
  fontFamilySet();
  document.getElementById('option-font-family-jp').value = fontFamily;
}
document.getElementById('option-font-family-jp').oninput = function (e){
  fontFamily = e.target.value;
  fontFamilySet();
  localStorage.setItem('fontFamily', fontFamily);
};
function fontFamilySet() {
  document.documentElement.style.setProperty('--logs-font-family-jp', fontFamily);
}

let fontFamilyMin = localStorage.getItem('fontFamilyMin') || '';
if(fontFamilyMin) {
  fontFamilyMinSet();
  document.getElementById('option-font-family-min').value = fontFamilyMin;
}
document.getElementById('option-font-family-min').oninput = function (e){
  fontFamilyMin = e.target.value;
  fontFamilyMinSet();
  localStorage.setItem('fontFamilyMin', fontFamilyMin);
};
function fontFamilyMinSet() {
  document.documentElement.style.setProperty('--logs-font-family-min', fontFamilyMin);
}
//フォーム・パレット設定 ----------------------------------------
let paletteDestinate = 'fall';
document.getElementById('option-palette-destinate').oninput = function (e){
  paletteDestinate = e.target.value;
  localStorage.setItem('paletteDestinate', paletteDestinate);
  document.querySelector(`#sheet-area`).classList.toggle('destinate-main', paletteDestinate === 'main');
}
let subFormBehavior = {};
document.getElementById('option-subform-full-behavior').oninput = function (e){
  subFormBehavior["full"] = e.target.value;
  localStorage.setItem('subFormBehavior', JSON.stringify(subFormBehavior));
}
document.getElementById('option-subform-dice-behavior').oninput = function (e){
  subFormBehavior["dice"] = e.target.value;
  localStorage.setItem('subFormBehavior', JSON.stringify(subFormBehavior));
}
document.getElementById('option-subform-name-behavior').oninput = function (e){
  subFormBehavior["name"] = e.target.value;
  localStorage.setItem('subFormBehavior', JSON.stringify(subFormBehavior));
}
document.getElementById('option-subform-off-behavior').oninput = function (e){
  subFormBehavior["off"] = e.target.value;
  localStorage.setItem('subFormBehavior', JSON.stringify(subFormBehavior));
}
function configFormSet(){
  paletteDestinate = localStorage.getItem('paletteDestinate') || 'fall';
  document.getElementById('option-palette-destinate').value = paletteDestinate;
  subFormBehavior = JSON.parse(localStorage.getItem('subFormBehavior')) || {};
  Object.keys(subFormBehavior).forEach(key => {
    document.getElementById('option-subform-'+key+'-behavior').value = subFormBehavior[key];
  });
}

//レイアウト変更 ----------------------------------------
function layoutChange(){
  const setSheet  = document.getElementById('window-layout-sheet').value;
  const setSide   = document.getElementById('window-layout-sidebar').value;
  const base      = document.getElementById('base');
  const sidebar   = document.getElementById('sidebar');
  const sheet     = document.getElementById('sheet-area');
  const topicEdit = document.getElementById('edit-topic');
  if(setSheet === 'R'){
    sheet.classList.remove('left');
    if(setSide === 'right-top'){
      base.style.gridTemplateColumns = '1fr max-content max-content';
      base.style.gridTemplateAreas   = `
        " menu  menu sheet"
        "topic  side sheet"
        "close  side sheet"
        " chat  side sheet"
        " form  form  form"
        " foot  foot  foot"`;
    }
    else if(setSide === 'right-bottom'){
      base.style.gridTemplateColumns = '1fr max-content max-content';
      base.style.gridTemplateAreas   = `
        " menu  menu sheet"
        "close  side sheet"
        " chat  side sheet"
        "topic  side sheet"
        " form  form  form"
        " foot  foot  foot"`;
    }
    else if(setSide === 'left-top'){
      base.style.gridTemplateColumns = 'max-content 1fr max-content';
      base.style.gridTemplateAreas   = `
        " menu  menu sheet"
        " side topic sheet"
        " side close sheet"
        " side  chat sheet"
        " form  form  form"
        " foot  foot  foot"`;
    }
    else if(setSide === 'left-bottom'){
      base.style.gridTemplateColumns = 'max-content 1fr max-content';
      base.style.gridTemplateAreas   = `
        " menu  menu sheet"
        " side close sheet"
        " side  chat sheet"
        " side topic sheet"
        " form  form  form"
        " foot  foot  foot"`;
    }
    else if(setSide === 'high'){
      base.style.gridTemplateColumns = '1fr max-content';
      base.style.gridTemplateAreas   = `
        " menu  sheet"
        " side  sheet"
        "topic  sheet"
        "close  sheet"
        " chat  sheet"
        " form   form"
        " foot   foot"`;
    }
    else if(setSide === 'shallow'){
      base.style.gridTemplateColumns = '1fr max-content';
      base.style.gridTemplateAreas   = `
        " menu  sheet"
        "close  sheet"
        " chat  sheet"
        "topic  sheet"
        " side   side"
        " form   form"
        " foot   foot"`;
    }
    else if(setSide === 'deep'){
      base.style.gridTemplateColumns = '1fr max-content';
      base.style.gridTemplateAreas   = `
        " menu  sheet"
        "close  sheet"
        " chat  sheet"
        "topic  sheet"
        " form   form"
        " side   side"
        " foot   foot"`;
    }
  }
  else if(setSheet === 'L'){
    sheet.classList.add('left');
    if(setSide === 'right-top'){
      base.style.gridTemplateColumns = 'max-content 1fr max-content';
      base.style.gridTemplateAreas   = `
        "sheet  menu  menu"
        "sheet topic  side"
        "sheet close  side"
        "sheet  chat  side"
        " form  form  form"
        " foot  foot  foot"`;
    }
    else if(setSide === 'right-bottom'){
      base.style.gridTemplateColumns = 'max-content 1fr max-content';
      base.style.gridTemplateAreas   = `
        "sheet  menu  menu"
        "sheet close  side"
        "sheet  chat  side"
        "sheet topic  side"
        " form  form  form"
        " foot  foot  foot"`;
    }
    else if(setSide === 'left-top'){
      base.style.gridTemplateColumns = 'max-content max-content 1fr';
      base.style.gridTemplateAreas   = `
        "sheet  menu  menu"
        "sheet  side topic"
        "sheet  side close"
        "sheet  side  chat"
        " form  form  form"
        " foot  foot  foot"`;
      sheet.classList.add('left');
    }
    else if(setSide === 'left-bottom'){
      base.style.gridTemplateColumns = 'max-content max-content 1fr';
      base.style.gridTemplateAreas   = `
        "sheet  menu  menu"
        "sheet  side close"
        "sheet  side  chat"
        "sheet  side topic"
        " form  form  form"
        " foot  foot  foot"`;
    }
    else if(setSide === 'high'){
      base.style.gridTemplateColumns = 'max-content 1fr';
      base.style.gridTemplateAreas   = `
        "sheet   menu"
        "sheet   side"
        "sheet  topic"
        "sheet  close"
        "sheet   chat"
        " form   form"
        " foot   foot"`;
      }
    else if(setSide === 'shallow'){
      base.style.gridTemplateColumns = 'max-content 1fr';
      base.style.gridTemplateAreas   = `
        "sheet   menu"
        "sheet  close"
        "sheet   chat"
        "sheet  topic"
        " side   side"
        " form   form"
        " foot   foot"`;
    }
    else if(setSide === 'deep'){
      base.style.gridTemplateColumns = 'max-content 1fr';
      base.style.gridTemplateAreas   = `
        "sheet   menu"
        "sheet  close"
        "sheet   chat"
        "sheet  topic"
        " form   form"
        " side   side"
        " foot   foot"`;
    }
  }
  
  if(setSide.match(/top/)){
    base.style.gridTemplateRows = 'max-content max-content max-content 1fr max-content max-content';
    topicEdit.style.top = '5em';
    topicEdit.style.bottom = 'auto';
    sidebar.dataset.layout = "";
  }
  else if(setSide.match(/bottom/)){
    base.style.gridTemplateRows = 'max-content max-content 1fr max-content max-content max-content';
    topicEdit.style.top = 'auto';
    topicEdit.style.bottom = '12em';
    sidebar.dataset.layout = "bottom";
  }
  else if(setSide.match(/high/)){
    base.style.gridTemplateRows = 'max-content max-content max-content max-content 1fr max-content max-content';
    topicEdit.style.top = '5em';
    topicEdit.style.bottom = 'auto';
    sidebar.dataset.layout = "row";
  }
  else if(setSide.match(/shallow|deep/)){
    base.style.gridTemplateRows = 'max-content max-content 1fr max-content max-content max-content max-content';
    topicEdit.style.top = 'auto';
    topicEdit.style.bottom = '12em';
    sidebar.dataset.layout = "row";
  }
  
  localStorage.setItem('layout-sheet', setSheet);
  localStorage.setItem('layout-side' , setSide);
}
function configLayoutSet(){
  const layoutSide  = localStorage.getItem('layout-side') || 'right-top';
  const layoutSheet = localStorage.getItem('layout-sheet') || 'R';
  document.getElementById('window-layout-sidebar').value = layoutSide;
  document.getElementById('window-layout-sheet').value   = layoutSheet;
  layoutChange();
}

// サイドバー開閉 ----------------------------------------
function sidebarToggle(){
  document.getElementById('sidebar').classList.toggle('close');
}
// ボックス開閉 ----------------------------------------
function boxOpen(id){
  document.getElementById(id).classList.toggle('open');
}
function boxClose(id){
  document.getElementById(id).classList.remove('open');
}
// トピックを開く ----------------------------------------
function topicOpen(){
  boxOpen('edit-topic');
  let topicValue = document.getElementById('topic-value').innerHTML;
  topicValue = topicValue.replace(/<br>/g, '\n');
  topicValue = topicValue.replace(/&lt;/g, '<');
  topicValue = topicValue.replace(/&gt;/g, '>');
  document.getElementById('edit-topic-value').value = topicValue;
  autosizeUpdate(document.getElementById('edit-topic-value'));
}
// 名前欄 ----------------------------------------
// 一括編集を開く
function npcOpen(){
  boxOpen('edit-npc');
  let npcValue = '';
  for(let i in nameList){
    if (i == 0) continue;
    npcValue += nameList[i]['name']+(nameList[i]['color']?nameList[i]['color']:'')+"\n";
  }
  document.getElementById('edit-npc-value').value = npcValue;
  autosizeUpdate(document.getElementById('edit-npc-value'));
}
// 保存
function npcSave(){
  const lines = document.getElementById('edit-npc-value').value.split(/\n/g);
  let newList = [
    { 'name': nameList[0]['name'], 'color': nameList[0]['color'] }
  ];
  let num = 1;
  for(let i=0; i<lines.length; i++){
    let color = "#" + randomColor();
    if(!lines[i]){ continue }
    const name = lines[i].replace(/[#＃]([0-9a-zA-Z]{6})$/, () => { color = '#'+RegExp.$1; return '' });
    newList[num] = {};
    newList[num]['name'] = name;
    newList[num]['color'] = color;
    num++;
  }
  nameList = newList;
  npcBoxSet();
  localStorage.setItem(roomId+'-name', JSON.stringify(nameList));
}
// 追加
function npcAdd(){
  nameList.push({ 'name': '', 'color': '#'+randomColor() });
  document.getElementById('main-name1').value = '';
  npcBoxSet();
  localStorage.setItem(roomId+'-name', JSON.stringify(nameList));
  document.getElementById('main-name1').focus();
}
// 削除
function npcDel(){
  if(nameList.length <= 1){ console.log('名前欄:下限'); return false }
  let del = nameList.pop();
  npcBoxSet();
  localStorage.setItem(roomId+'-name', JSON.stringify(nameList));
}
// ランダムカラー
function randomColor(){
  const l = 3;
  const c = ['00','2b','56','81','ab','d5','ff'];
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
  const nowSelectName = document.getElementById('main-name1').value;
  let nowSelectValue = 0;
  while (0 < select.childNodes.length) {
    select.removeChild(select.childNodes[0]);
  }
  let n = 0;
  for(let i in nameList){
    if(!nameList[i]){ continue; }
    let op = document.createElement("option");
    op.text = nameList[i]['name'] == '' ? '(empty)': nameList[i]['name'];
    op.value = i;
    op.style.color = nameList[i]['color'];
    select.appendChild(op);
    if(nowSelectName === nameList[i]['name']) nowSelectValue = i;
    n++;
  }
  $("#form-name").val(nowSelectValue);
  nameChange(nowSelectValue);
  
  //高さ
  if(window.matchMedia('(max-width:600px)').matches){ select.size = 1; }
  else { select.size = (n < 2) ? 2 : (n > 8) ? 8 : n; }
}
// 名前変更
  //書き換え
document.getElementById('main-name1').addEventListener("change",function(e){ 
  const num = document.getElementById('form-name').value;
  if(num == 0){ //入室名は変更しない
    document.getElementById('main-name1').value = nameList[num]['name'];
    return;
  }
  else { 
    nameList[num]['name'] = document.getElementById('main-name1').value;
    npcBoxSet();
    localStorage.setItem(roomId+'-name', JSON.stringify(nameList));
  }
});
  //選択
document.getElementById('form-name').addEventListener("change",function(e){ 
  nameChange(e.target.value);
});
function nameChange(num){
  if(num == 0){ document.getElementById('main-name1').readOnly = true; }
  else        { document.getElementById('main-name1').readOnly = false; }
  document.getElementById('main-name1').value       = nameList[num]['name'];
  document.getElementById('main-name1').style.color = nameList[num]['color'];
  document.getElementById('form-color').value       = nameList[num]['color'];
  document.getElementById('form-color-text').value  = nameList[num]['color'];
  $("#form-color").spectrum("set", nameList[num]['color']);
}
// 色変更 ----------------------------------------
const colorPalette = [
  ["#ffffff","#eeeeee","#cccccc","#aaaaaa","#888888","#666666","#444444","#222222","#000000"],
  
  ["#56002b","#812b56","#81002b","#ab002b","#ab0056","#ab2b56","#ab5681","#d581ab","#d55681","#d52b56","#d52b81","#d5002b","#d50056","#ff002b"],
  ["#ff0056","#ff0081","#ff2b56","#ff2b81","#ff5681","#ff56ab","#ff81ab","#ffabd5","#ffd5d5","#ffabab","#ff8181","#ffab81","#ff5656","#ff8156"],
  ["#ff2b2b","#ff562b","#ff812b","#ff0000","#ff2b00","#ff5600","#d50000","#d52b00","#d55600","#d52b2b","#d5562b","#d55656","#d58156","#d58181"],
  ["#d5abab","#ab8181","#ab5656","#ab2b2b","#ab562b","#ab0000","#ab2b00","#810000","#812b00","#812b2b","#815656","#562b2b","#560000","#2b0000"],
  ["#562b00","#81562b","#815600","#ab8100","#ab5600","#ab812b","#ab8156","#d5ab81","#d5ab56","#d5ab2b","#d5812b","#d5ab00","#d58100","#ffd500"],
  ["#ffab00","#ff8100","#ffd52b","#ffab2b","#ffd556","#ffab56","#ffd581","#ffd5ab","#ffffd5","#ffffab","#ffff81","#d5ff81","#ffff56","#d5ff56"],
  ["#ffff2b","#d5ff2b","#abff2b","#ffff00","#d5ff00","#abff00","#d5d500","#abd500","#81d500","#d5d52b","#abd52b","#d5d556","#abd556","#d5d581"],
  ["#d5d5ab","#abab81","#abab56","#abab2b","#81ab2b","#abab00","#81ab00","#818100","#568100","#81812b","#818156","#56562b","#565600","#2b2b00"],
  ["#2b5600","#56812b","#2b8100","#2bab00","#56ab00","#56ab2b","#81ab56","#abd581","#81d556","#56d52b","#81d52b","#2bd500","#56d500","#2bff00"],
  ["#56ff00","#81ff00","#56ff2b","#81ff2b","#81ff56","#abff56","#abff81","#d5ffab","#d5ffd5","#abffab","#81ff81","#81ffab","#56ff56","#56ff81"],
  ["#2bff2b","#2bff56","#2bff81","#00ff00","#00ff2b","#00ff56","#00d500","#00d52b","#00d556","#2bd52b","#2bd556","#56d556","#56d581","#abd5ab"],
  ["#81ab81","#56ab56","#56ab81","#2bab2b","#2bab56","#00ab00","#00ab2b","#008100","#00812b","#2b812b","#568156","#2b562b","#005600","#002b00"],
  ["#00562b","#2b8156","#008156","#00ab81","#00ab56","#2bab81","#81d5ab","#81d581","#56d5ab","#2bd5ab","#2bd581","#00d5ab","#00d581","#00ffd5"],
  ["#00ffab","#00ff81","#2bffd5","#2bffab","#56ffd5","#56ffab","#81ffd5","#abffd5","#d5ffff","#abffff","#81ffff","#81d5ff","#56ffff","#56d5ff"],
  ["#2bffff","#2bd5ff","#2babff","#00ffff","#00d5ff","#00abff","#00d5d5","#00abd5","#0081d5","#2bd5d5","#2babd5","#56d5d5","#56abd5","#81d5d5"],
  ["#abd5d5","#81abab","#56abab","#2babab","#2b81ab","#00abab","#0081ab","#008181","#005681","#2b8181","#568181","#2b5656","#005656","#002b2b"],
  ["#002b56","#2b5681","#002b81","#002bab","#0056ab","#2b56ab","#5681ab","#81abd5","#5681d5","#2b56d5","#2b81d5","#002bd5","#0056d5","#002bff"],
  ["#0056ff","#0081ff","#2b56ff","#2b81ff","#5681ff","#56abff","#81abff","#abd5ff","#d5d5ff","#ababff","#8181ff","#ab81ff","#5656ff","#8156ff"],
  ["#2b2bff","#562bff","#812bff","#0000ff","#2b00ff","#5600ff","#0000d5","#2b00d5","#5600d5","#2b2bd5","#562bd5","#5656d5","#8156d5","#8181d5"],
  ["#ababd5","#8181ab","#5656ab","#2b2bab","#562bab","#0000ab","#2b00ab","#000081","#2b0081","#2b2b81","#565681","#2b2b56","#000056","#00002b"],
  ["#2b0056","#562b81","#560081","#5600ab","#8100ab","#812bab","#8156ab","#ab81d5","#ab56d5","#812bd5","#ab2bd5","#8100d5","#ab00d5","#8100ff"],
  ["#ab00ff","#d500ff","#ab2bff","#d52bff","#ab56ff","#d556ff","#d581ff","#d5abff","#ffd5ff","#ffabff","#ff81ff","#ff81d5","#ff56ff","#ff56d5"],
  ["#ff2bff","#ff2bd5","#ff2bab","#ff00ff","#ff00d5","#ff00ab","#d500d5","#d500ab","#d50081","#d52bd5","#d52bab","#d556d5","#d556ab","#d581d5"],
  ["#d5abd5","#ab81ab","#ab56ab","#ab2bab","#ab2b81","#ab00ab","#ab0081","#810081","#810056","#812b81","#815681","#562b56","#560056","#2b002b"],
];
$("#form-color").spectrum({
  preferredFormat: "hex",
  chooseText: "OK",
  showInitial: true,
  showPalette: true,
  palette: colorPalette,
  change: function(color){ nameColorChange(color.toHexString()) },
  hide: function(color){ nameColorChange(color.toHexString()) },
});
//
$(".selectcolor-main").change(function(){
  const color = $(this).val();
  nameColorChange(color);
  $("#form-color").spectrum("set", color);
});
function nameColorChange(color){
  const num = document.getElementById('form-name').value;
  nameList[num]['color'] = color;
  $("#form-name option[value="+num+"]").css('color', color);
  localStorage.setItem(roomId+'-name', JSON.stringify(nameList));
  document.getElementById('main-name1').style.color = color;
  document.getElementById('form-color').value = color;
  document.getElementById('form-color-text').value = color;
}
// ユニット作成の色変更
$("#new-unit-color-value").spectrum({
  preferredFormat: "hex",
  chooseText: "OK",
  showInitial: true,
  showPalette: true,
  palette: colorPalette,
  change: function(color){ document.getElementById('new-unit-color-value-text').value = color; },
  hide: function(color){ document.getElementById('new-unit-color-value-text').value = color; },
});
$(".selectcolor-unit").change(function(){
  const color = $(this).val();
  document.getElementById('new-unit-color-value').value = color;
  document.getElementById('new-unit-color-value-text').value = color;
  $("#new-unit-color-value").spectrum("set", color);
});
// 入室時の色変更
$("#in-color").spectrum({
  preferredFormat: "hex",
  chooseText: "OK",
  showInitial: true,
  showPalette: true,
  palette: colorPalette,
  change: function(color){ document.getElementById('in-color-text').value = color; },
  hide: function(color){ document.getElementById('in-color-text').value = color; },
});
$(".selectcolor-in").change(function(){
  const color = $(this).val();
  document.getElementById('in-color').value = color;
  document.getElementById('in-color-text').value = color;
  $("#in-color").spectrum("set", color);
});
// 送信先選択フォーム ----------------------------------------
function addressUpdate(){
  const select = document.getElementById('form-address');
  const nowSelect = select.options[select.selectedIndex].value;
  while (0 < select.childNodes.length) {
    select.removeChild(select.childNodes[0]);
  }
  let op0 = document.createElement("option");
  op0.value = '';  op0.text = '全員';
  select.appendChild(op0);
  let op1 = document.createElement("option");
  op1.value = userId;  op1.text = '自分';
  select.appendChild(op1);
  
  const memberListView = document.getElementById('member-list-view');
  memberListView.innerHTML = '';
  
  let num = 0;
  for(let i in memberList){
    const now = Math.floor(Date.now() / 1000);
    if(!memberList[i]['name']){ continue; }
    if(!memberList[i]['date']){ continue; }
    if(now - memberList[i]['date'] > 60*60){ continue; }
    if(i !== userId){
      let op = document.createElement("option");
      op.value = i;
      op.text = memberList[i]['name'];
      select.appendChild(op);
    }
    
    memberListView.innerHTML += (
        (now - memberList[i]['date'] > 30*60) ? '<div class="mem-signal red">'
      : (now - memberList[i]['date'] > 10*60) ? '<div class="mem-signal yellow">'
      : '<div class="mem-signal green">'
      ) + memberList[i]['name']+'</div>';
    num++;
  }
  $(select).val(nowSelect);
  
  document.getElementById('member-num').innerHTML = num+'人';
}
$("#form-address, #secret-openlater").change(function(){
  const obj = document.querySelector('#main-form > .input-form');
  const address = document.getElementById('form-address').value;
  const logopen = document.getElementById('secret-openlater').checked;
  
  if(address){ obj.classList.add('secret'); }
  else    { obj.classList.remove('secret'); }
  
  if(logopen){ obj.classList.add('openlater'); }
  else    { obj.classList.remove('openlater'); }
});

// メインフォームのダイス追加 ----------------------------------------
let diceForms = [
  [
    {'type':'dice','value':''},
  ],
  [
    {'type':'dice','value':'2d6'},
    {'type':'dice','value':''},
    {'type':'dice','value':''},
    {'type':'dice','value':''},
    {'type':'dice','value':''},
    {'type':'dice','value':''},
  ],
];
function diceAdd(area,re){
  let n = 0;
  while (document.getElementById('dice-button-'+area+'-'+n)){
    n++;
  }
  if(!diceForms[area]){ diceForms[area] = []; }
  if(!diceForms[area][n]){ diceForms[area][n] = {'type':'dice','value':''}; }
  let newOutline = document.createElement('div');
  let newDice = document.createElement('div');
  newDice.classList.add('dice-button');
  newDice.innerHTML = `<textarea class="form-comm" id="dice-button-${area}-${n}" data-lock="${diceForms[area][n]['type']||'dice'}" data-area="${area}" data-num="${n}" rows="1">${diceForms[area][n]['value']||''}</textarea><i onclick="lockTypeChange(${area},${n});"></i><button data-id="dice-button-${area}-${n}"></button></div>`;
  newOutline.appendChild(newDice);
  document.querySelector("#main-form #form-dice-"+area).appendChild(newOutline);
  
  if(toHalfWidth(diceForms[area][n]['value']).match(/^\/\/(.*?)[=＝](.*)$/)){
    const varName = RegExp.$1.toLowerCase();
    const varText = RegExp.$2;
    diceParams[varName] = varText;
  }
  autosize(document.getElementById('dice-button-'+area+'-'+n));
  diceSave();
}
function diceDel(area){
  const mainDiceArea = document.querySelector("#main-form #form-dice-"+area);
  const target = mainDiceArea.lastElementChild;
  if(mainDiceArea.childElementCount <= 3) return;
  mainDiceArea.removeChild(target);
  diceForms[area].pop();
  diceSave();
}
let diceColumn = [1,2];
function diceScale(area, value){
  if     (value === 'shrink'){ diceColumn[area] = diceColumn[area] >= 5 ? 5 : diceColumn[area]+1; }
  else if(value === 'expand'){ diceColumn[area] = diceColumn[area] <= 1 ? 1 : diceColumn[area]-1; }
  else if(Number.isNaN(value)){ diceColumn[area] = value ? value : 1; }
  document.querySelector("#main-form #form-dice-"+area).style.gridTemplateColumns = `repeat(${diceColumn[area]}, 1fr)`;
  autosizeUpdate(document.querySelectorAll('#main-form .dice-button textarea'));
  localStorage.setItem(roomId+'-diceColumn', JSON.stringify(diceColumn));
}
//
function lockTypeChange(area,num){
  const obj = document.getElementById('dice-button-'+area+'-'+num);
  let type = obj.dataset.lock;
  if     (type === 'full'){ type = 'dice'; }
  else if(type === 'dice'){ type = 'name'; }
  else if(type === 'name'){ type = 'off';  }
  else if(type === 'off' ){ type = 'memo'; }
  else                    { type = 'full'; }
  obj.dataset.lock = type;
  diceForms[area][num]['type'] = type;
  diceSave();
}
//
function diceSave(){
  localStorage.setItem(roomId+'-diceForms', JSON.stringify(diceForms));
}
$(function($){
  $(document).on("change", "#main-form .dice-button textarea", function(e) {
    diceForms[e.target.dataset.area][e.target.dataset.num]['value'] = e.target.value;
    if(toHalfWidth(e.target.value).match(/^\/\/(.*?)[=＝](.*)$/)){
      const varName = RegExp.$1.toLowerCase();
      const varText = RegExp.$2;
      diceParams[varName] = varText;
    }
    diceSave();
    diceTriggerPaletteUpdate();
  });
});
function diceTriggerPaletteUpdate(){
  diceParams = {};
  for(let area in [0,1]){
    for(let num in diceForms[area]){
      try {
        if(toHalfWidth(diceForms[area][num]['value']).match(/^\/\/(.*?)[=＝](.*)$/)){
          const varName = RegExp.$1.toLowerCase();
          const varText = RegExp.$2;
          diceParams[varName] = varText;
        }
      } catch (e) {}
    }
  }
  document.querySelectorAll(` .chat-palette.lines span:not(.param)`).forEach(line => {
    let text = line.innerHTML.replace(/<\/?em>/gi, '');
    Object.keys(diceParams).forEach(key => {
      const reg = new RegExp('(?:<i>)?([{｛]' + key + '[｝}])(?:</i>)?', 'gi');
      text = text.replace(reg, '<em>$1</em>');
    });
    line.innerHTML = text;
  });
}
// サブリモコン追加
function unitSubRemoconAdd(unitId){
  const unitName = unitIdToName[unitId];
  const unitNameEscaped = unitName.replace(/'/g, "&#x27;").replace(/"/g, '&quot;');
  let n = 1;
  while (document.getElementById('edit-stt-'+unitId+'-'+n)){ n++; }
  let newUl = document.createElement('ul');
  newUl.setAttribute("id",'edit-stt-'+unitId+'-'+n);
  let statusRemoconArea = `<li><i onclick="unitSubRemoconToggle('${unitId}-${n}')">▼</i><input type="text" id="edit-stt-${unitId}-${n}-name" placeholder="名前"></li>`;
  for (let i in setStatus){
    statusRemoconArea += `
            <li class="dice-button">
              <button onclick="formSubmit('edit-stt-${unitId}-${n}-${setStatus[i]}-value','${unitNameEscaped}');">${setStatus[i]}</button>
              <textarea class="form-comm" name="stt-${setStatus[i]}" id="edit-stt-${unitId}-${n}-${setStatus[i]}-value" data-comm-pre="@${setStatus[i]}" data-part="${unitId}-${n}" data-palette-target='${unitNameEscaped}' rows="1"></textarea>
            </li>`;
  }
  statusRemoconArea += `
            <li class="dice-button">
              <button onclick="unitCommandSubmit('check'  ,'${unitId}',${n});">✔</button>
              <button onclick="unitCommandSubmit('uncheck','${unitId}',${n});">×</button>
              <button onclick="unitCommandSubmit('delete' ,'${unitId}',${n});">削除</button>
            </li>`;
  newUl.innerHTML = statusRemoconArea;
  document.getElementById("status-remocon-sub-area-"+unitId).appendChild(newUl);
}
function unitSubRemoconDel(unitId){
  const obj = document.getElementById("status-remocon-sub-area-"+unitId);
  if(obj.childElementCount <= 0) return;
  const target = obj.lastElementChild;
  obj.removeChild(target);
}
function unitSubRemoconToggle(id){
  document.getElementById('edit-stt-'+id).classList.toggle('close');
}

// リモコン追加 ----------------------------------------
function unitRemoconAdd(unitName,status,value){
  const unitId = unitList[unitName]['id'];
  const unitNameEscaped = unitName.replace(/'/g, "&#x27;").replace(/"/g, '&quot;');
  let i = 0;
  while (document.getElementById(`edit-stt-${unitId}-${i}-name`)) {
    i++;
  }
  if(!unitList[unitName]['sttnames']){ unitList[unitName]['sttnames'] = []; }
  document.querySelector(`#sheet-unit-${unitId} .status-remocon-list`).insertAdjacentHTML('beforeend',`
    <li class="dice-button">
      <input id="edit-stt-${unitId}-${i}-name" value="${status||unitList[unitName]['sttnames'][i]||''}" placeholder="ラベル">
      <textarea class="form-comm" name="stt-${i}" id="edit-stt-${unitId}-${i}-value" data-comm-status="${i}" data-palette-target='${unitNameEscaped}' rows="1" placeholder="値">${value||''}</textarea>
      <button onclick="formSubmit('edit-stt-${unitId}-${i}-value','${unitNameEscaped}');"></button>
    </li>`);
}
function unitRemoconDel(unitName){
  const unitId = unitList[unitName]['id'];
  const target = document.querySelector(`#sheet-unit-${unitId} .status-remocon-list`);
  target.removeChild(target.lastElementChild);
  unitStatusNameUpdate(unitId);
}
// ユニット追加タブ ----------------------------------------
document.getElementById("new-unit-urlload").addEventListener("input",function(e){ 
  document.getElementById("new-unit-stt-value").disabled = (e.target.checked) ? true : false;
});

// ユニット追加 ----------------------------------------
let unitIdToName = {};
function unitAdd(unitName){
  const unitId = randomId(8);
  unitList[unitName]['id'] = unitId;
  unitIdToName[unitId] = unitName;
  let newUnit = document.createElement('dl');
  newUnit.setAttribute("id",'stt-unit-'+unitId);
  newUnit.dataset.name = unitName;
  newUnit.innerHTML = '<dt onclick="sheetSelect(\''+unitId+'\');sheetOpen();" style="color:'+unitList[unitName]['color']+';">'+unitName+'</dt>';
  if(unitList[unitName]['status'] === undefined) { unitList[unitName]['status'] = {}; }
  newUnit.innerHTML += `<dd id="stt-memo-${unitId}"></dd>`;
  newUnit.innerHTML += `<dd id="stt-url-${unitId}"></dd>`;
  document.getElementById("status-body").appendChild(newUnit);
  
  const unitNameEscaped = unitName.replace(/'/g, "&#x27;").replace(/"/g, '&quot;');
  
  let paletteDefault = unitList[unitName]['palette'] || String.raw`チャットパレット入力例：
2d6+{冒険者}+{知力}
r18+{追加D} ダメージ！
### 変数
//冒険者=3
//ファイター=3
//知力=2
//筋力=3
//追加D={ファイター}+{筋力}

※ ###で囲むと折り畳み化
###

クリックで↓の入力欄にコピー
ダブルクリックで即送信`;

  let newSheet = document.createElement('div');
  newSheet.setAttribute("id",'sheet-unit-'+unitId);
  newSheet.classList.add('box','sheet');
  if(!sheetOpenCheck){ newSheet.classList.add('closed'); }
  if(selectedSheet !== unitId){ newSheet.style.display = 'none'; }
  unitList[unitName]['memo'] = unitList[unitName]['memo'] || '';
  newSheet.innerHTML = `
      <h2 style="color:${unitList[unitName]['color']}">${unitName}</h2>
      <div class="sheet-body">
        <div class="status-remocon-area">
          <h3>ステータスリモコン</h3>
          <span class="add button" onclick="unitRemoconAdd('${unitNameEscaped}')">＋</span>
          <span class="del button" onclick="unitRemoconDel('${unitNameEscaped}')">－</span>
          <select>
          <option id="stt-calc-on-${unitId}">入力内容によって計算/部分更新する</option>
          <option>入力内容そのままで更新する</option>
          </select>
          <ul class="status-remocon-list"></ul>
          <ul class="status-remocon-others">
            <li class="dice-button memo">
              <textarea class="form-comm" name="stt-memo" id="edit-stt-${unitId}-memo-value" data-comm-pre="@memo" data-palette-target='${unitNameEscaped}' rows="1" placeholder="メモ">${unitList[unitName]['memo'].replace(/<br>/g,"\n")}</textarea>
              <button onclick="formSubmit('edit-stt-${unitId}-memo-value','${unitNameEscaped}');"></button>
            </li>
            <li class="dice-button checks">
              <button onclick="unitCommandSubmit('check'  ,'${unitId}');">✔</button>
              <button onclick="unitCommandSubmit('uncheck','${unitId}');">×</button>
            </li>
            <li class="dice-button delete"><button onclick="unitCommandSubmit('delete' ,'${unitId}');">削除</button></li>
          </ul>
          <div class="status-remocon-sub" id="status-remocon-sub-area-${unitId}"></div>
        </div>
        <div class="chat-palette-area">
          <h3>チャットパレット</h3>
          <div class="chat-palette-frame">
            <div      class="chat-palette lines" data-name='${unitNameEscaped}'></div>
            <textarea class="chat-palette texts">${paletteDefault}</textarea>
            <span class="edit button" onclick="paletteEditOpen('${unitId}')"></span>
            <span class="save button" onclick="paletteEditSave('${unitId}')"></span>
          </div>
          <div class="comm-area">
            <textarea id="chat-palette-comm-unit-${unitId}" class="form-comm autosize" rows="1" data-palette-target='${unitNameEscaped}'></textarea>
            <button onclick="formSubmit('chat-palette-comm-unit-${unitId}','${unitNameEscaped}');">送信</button>
          </div>
        </div>
      <div class="sheet-footer">
        <textarea id="memo-unit-${unitId}" class="autosize" placeholder="個人メモ" rows="2" onchange="sheetMemoSave(this,'${unitNameEscaped}');">${sheetMemos[unitName]||''}</textarea>
      </div>
      <span class="close button" onclick="sheetClose();">×</span>
    </div>`;
  document.getElementById("sheet-area").appendChild(newSheet);
  
  const status = unitList[unitName]['sttnames'] || setStatus;
  for (let i in status){
    unitRemoconAdd(unitName,status[i]);
  }
  unitStatusNameUpdate(unitName);
  
  paletteSet(unitId, paletteDefault);
  
  autosize(document.getElementById('chat-palette-comm-unit-'+unitId));
  autosize(document.getElementById('memo-unit-'+unitId));
  for (let i in status){
    autosize(document.getElementById(`edit-stt-${unitId}-${i}-value`));
  }
  autosize(document.getElementById(`edit-stt-${unitId}-memo-value`));
}
function unitStatusNameUpdate(unitName){
  if(!unitList[unitName]){ return }
  const unitId = unitList[unitName]['id'];
  unitList[unitName]['sttnames'] = [];
  let i = 0;
  while (document.getElementById(`edit-stt-${unitId}-${i}-name`)) {
    let sttName = document.getElementById(`edit-stt-${unitId}-${i}-name`).value
    .replace('>','＞')
    .replace('<','＜')
    .replace('#','＃');
    if(sttName){ unitList[unitName]['sttnames'].push(sttName); }
    i++;
  }
}
function unitStatusFormUpdate(unitName){
  const unitId = unitList[unitName]['id'];
  let values = {};
  let i = 0;
  while (document.getElementById(`edit-stt-${unitId}-${i}-name`)) {
    const sttName = document.getElementById(`edit-stt-${unitId}-${i}-name`).value;
    values[sttName] = document.getElementById(`edit-stt-${unitId}-${i}-value`).value;
    i++;
  }
  i = 0;
  for (let label of unitList[unitName]['sttnames']){
    const formName  = document.getElementById(`edit-stt-${unitId}-${i}-name`);
    const formValue = document.getElementById(`edit-stt-${unitId}-${i}-value`);
    if(formName){
      formName.value = label;
      formValue.value = (values[label] != null) ? values[label] : '';
    }
    else {
      unitRemoconAdd(unitName, label, values[label]);
    }
    i++;
  }
  while (document.getElementById(`edit-stt-${unitId}-${i}-name`)) {
    unitRemoconDel(unitName);
    i++;
  }
  document.getElementById(`edit-stt-${unitId}-memo-value`).value = unitList[unitName]['memo'];
}
// ステータス伸縮 ----------------------------------------
let statusRowWidth = 8;
function statusScale(value){
  if     (value === 'shrink'){ statusRowWidth = statusRowWidth >= 12 ? 12 : statusRowWidth+1; }
  else if(value === 'expand'){ statusRowWidth = statusRowWidth <=  3 ?  3 : statusRowWidth-1; }
  else if(Number.isNaN(value)){ statusRowWidth = value ? value : 1; }
  document.querySelector("#status #status-body").style.gridTemplateColumns = `repeat(${statusRowWidth}, 1fr)`;
  //localStorage.setItem(roomId+'-statusRowWidth', statusRowWidth);
}
// シート開閉 ----------------------------------------
let sheetOpenCheck = 1;
function sheetOpen(){
  document.getElementById('sheet-area').classList.remove('closed');
  sheetOpenCheck = 1;
}
function sheetClose(){
  document.getElementById('sheet-area').classList.add('closed');
  sheetOpenCheck = 0;
}
function sheetSelect(id){
  const name = unitIdToName[id]
  document.querySelectorAll('.sheet[id^=sheet]').forEach( obj => {
    obj.style.display = 'none';
  });
  document.getElementById('sheet-unit-'+id).style.display = '';
  selectedSheet = id;
  if(id !== 'default' && id !== 'memo'){
    autosizeUpdate(document.getElementById(`edit-stt-${id}-memo-value`));
    autosizeUpdate(document.getElementById('memo-unit-'+id));
  }
  document.querySelectorAll('#status-body > dl').forEach( obj => {
    obj.classList.toggle('selected', obj.dataset.name === name);
  });
}
// チャットパレット編集 ----------------------------------------
function paletteEditOpen(id){ // 編集画面を開く
  document.querySelector(`#sheet-unit-${id} .chat-palette-frame`).classList.add('editing');
}
function paletteEditSave(id){ // 編集画面を閉じて保存
  document.querySelector(`#sheet-unit-${id} .chat-palette-frame`).classList.remove('editing');
  
  let textData = document.querySelector(`#sheet-unit-${id} .chat-palette.texts`).value;
  
  //localStorage.setItem(roomId+'-palette', JSON.stringify(chatPalettes));
  const unitName = unitIdToName[id];
  if(unitList[unitName]['palette'] !== textData){
    unitList[unitName]['palette'] = textData;
    paletteSet(id,textData);
    commSend('/paletteupdate '+textData, 0, unitName, (unitList[unitName]['color']||'') );
  }
}
// チャットパレットセット ----------------------------------------
let paletteParams = {};
let diceParams = {};
function paletteSet(id,textData){ // テキストからセレクトボックスへセット
  const select = document.querySelector(`#sheet-unit-${id} .chat-palette.lines`);
  if(select.style.display === 'none'){ return; } // 編集中は止める
  const lines = textData.split(/\n/g);
  while (0 < select.childNodes.length) {
    select.removeChild(select.childNodes[0]);
  }
  paletteParams[id] = {};
  for(let i=0; i<lines.length; i++){
    if(toHalfWidth(lines[i]).match(/^\/\/(.*?)[=＝](.*)$/)){
      const varName = RegExp.$1.toLowerCase();
      const varText = RegExp.$2;
      paletteParams[id][varName] = varText;
    }
  }
  let detailsOn = 0;
  for(let i=0; i<lines.length; i++){
    if(lines[i].match(/^###(.+)$/)){
      let details = document.createElement("details");
      let summary = document.createElement("summary");
      summary.innerHTML = RegExp.$1;
      details.appendChild(summary);
      select.appendChild(details);
      detailsOn = 1;
    }
    else if(lines[i].match(/^###$/)){
      detailsOn = 0;
    }
    else {
      let op = document.createElement("span");
      const [text, type] = paletteLineParamReplace(id, lines[i]);
      if(type){ op.classList.add(type) }
      op.innerHTML = htmlEscape(text);
      op.dataset.value = lines[i];
      op.tabIndex = '0';
      if(detailsOn){ select.lastElementChild.appendChild(op); }
      else         { select.appendChild(op); }
    }
  }
}
function paletteLineParamReplace(id,text){
  if(text === '') { return ['　'] }
  if(text.match(/^\/\/(.*?)[=＝](.*)$/)){ return [`<b>${RegExp.$1}</b><div><input data-label="${RegExp.$1}" value="${RegExp.$2}" onchange="paletteLineParamChange('${id}',this)"></div>`, 'param']; }
  else {
    return [text.replace(/[{｛](.+?)[｝}]/gi, function(raw, varNameRaw){
      const varName = toHalfWidth(varNameRaw).toLowerCase();
      if     (varName in diceParams)       { return `<em>${raw}</em>` }
      else if(varName in paletteParams[id]){ return `<i>${raw}</i>` }
      else { return raw };
    })]
  }
}
function paletteLineParamChange(id,obj){
  const unitName = unitIdToName[id];
  const label = obj.dataset.label;
  const value = obj.value;
  
  obj.closest("span[data-value]").dataset.value = '//'+label+'='+value;
  
  const reg = new RegExp('^//'+label+'[=＝].*$', 'gm');
  unitList[unitName]['palette'] = document.querySelector(`#sheet-unit-${id} .chat-palette.texts`).value.replace(reg, '//'+label+'='+value);
  document.querySelector(`#sheet-unit-${id} .chat-palette.texts`).value = unitList[unitName]['palette'];
  commSend('/paletteupdate '+unitList[unitName]['palette'], 0, unitName, (unitList[unitName]['color']||'') );
}
// チャットパレット取得 ----------------------------------------
async function paletteGet(unitName){
  const file = './palette/' + encodeURIComponent(unitName) + '.txt';
  let palette;
  fetch(file)
  .then(response => {
    if (response.ok) {
      return response.text();
    } else {
      return '';
    }
  })
  .then(text => {
    return text;
  });
}
// 個人メモ保存 ----------------------------------------
function sheetMemoSave(obj, name){
  sheetMemos[name] = obj.value;
  localStorage.setItem(roomId+'-sheetMemo', JSON.stringify(sheetMemos));
}

// 共有 ----------------------------------------
// 追加
function memoUpdate(){
  //const title = (shareMemo[num].split(/<br>/g))[0];
  //let newMemo = document.createElement('dt');
  //newMemo.innerHTML = title;
  //newMemo.setAttribute("onclick","memoSelect("+num+");");
  //document.getElementById("memo-body").appendChild(newMemo);
  document.getElementById("memo-list").innerHTML = '';
  let memoLength = 0;
  for (let i in shareMemo) {
    let newMemo = document.createElement('li');
    newMemo.innerHTML = (shareMemo[i].split(/\n/g))[0];
    newMemo.setAttribute("onclick","memoSelect("+i+");");
    document.getElementById("memo-list").appendChild(newMemo);
    if(shareMemo[i]){ memoLength++ }
  }
  document.getElementById('memo').dataset.num = memoLength;
}
// 選択
let selectedMemo = '';
function memoSelect(num){
  const memoValue = document.getElementById("sheet-memo-value");
  memoValue.value = shareMemo[num] ? shareMemo[num] : '';
  sheetSelect('memo');
  selectedMemo = num;
  sheetOpen();
  autosizeUpdate(memoValue);
}

// タブ ----------------------------------------
// タブ追加
let tabnameToNum = {};
function tabAdd(tabNum){
  let setFontSize = fontSize[tabNum] ? fontSize[tabNum] : 100;
  let newTab = document.createElement('div');
  newTab.setAttribute("id",'chat-tab'+tabNum);
  newTab.classList.add('box','chat');
  if(mainTab == tabNum){ newTab.classList.add('main'); } else { newTab.classList.add('sub'); }
  newTab.dataset.tab = tabNum;
  newTab.innerHTML = `
    <h2><label><input type="radio" id="check-maintab-tab${tabNum}" name="check-maintab" value="${tabNum}" ${(mainTab == tabNum ? 'checked':'')}><span class="tab-name" data-unread="0">${tabList[tabNum]}</span></label></h2>
    <div class="logs logs-font" id="chat-logs-tab${tabNum}" data-unread="0" style="font-size:${setFontSize}%;" onscroll="bottomCheck(${tabNum},this);"></div>
    <div class="input-form"><div class="comm-area">
    <textarea type="text" class="form-comm autosize" id="form-comm-tab${tabNum}" rows="1" placeholder="Shift+Enterで改行"></textarea>
    <button onclick="formSubmit('form-comm-tab${tabNum}');">送信</button>
    </div></div>
    <div class="option" data-value="${setFontSize}"><input class="option-fontsize-tab" type="range" min="80" max="120" step="1" value="${setFontSize}"></div>
    <div class="notice-unread" onclick="scrollBottom('${tabNum}');" data-unread="0">▼新着発言</div>
    <span class="close button">×</span>`;
  document.getElementById("chat-area").appendChild(newTab);
  autosize(document.getElementById('form-comm-tab'+tabNum));
  
  let newList = document.createElement('li');
  if(mainTab == tabNum){ newList.classList.add('bold'); }
  newList.setAttribute("id",'tablist-tab'+tabNum);
  newList.addEventListener("click",function(e){ mainTabChange(tabNum); });
  newList.dataset.unread = 0;
  newList.innerHTML = tabList[tabNum];
  document.getElementById("tablist").appendChild(newList);
  
  tabnameToNum[tabList[tabNum]] = tabNum;
  oldLogs[tabNum] = [];
  
  //着信SEタブに追加
  let newTr = document.createElement('tr');
  newTr.innerHTML = `
    <th>タブ${tabNum} 着信<br><small>(${tabList[tabNum]})</small></th>
    <td><select id="option-se-chat${tabNum}" oninput="seTypeChange(this,'chat',${tabNum})">${chatTypeOptions}</select></td>`;
  document.getElementById("option-se-tabs").appendChild(newTr);
  document.getElementById('option-se-chat'+tabNum).value = seType['chat'+tabNum] || seType['chat'];
}
// メインタブ切り替え
function mainTabChange(num){
  const thisTab = document.getElementById('chat-tab'+num);
  const tabs = document.querySelectorAll('.box.chat');
  const list = document.querySelectorAll('#tablist li');
  
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
  
  for(let i=0; i<list.length; i++){
    list[i].classList.remove('bold');
  }
  document.getElementById('tablist-tab'+num).classList.add('bold');
  
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
(function(){
  $(document).on("change", 'input[name="check-maintab"]:radio', function(e) {
    const num = e.target.value;
    mainTabChange(num);
  });
  
  $(document).on("click", '.chat .close.button', function(e) {
    const num = e.target.closest('.chat').dataset.tab;
    tabToggle(num);
  });
})();

// 強調ワード編集 ----------------------------------------
function markNameToggle(){
  if(document.getElementById('mark-name-check').checked){ markName = 1; }
  else { markName = 0; }
  localStorage.setItem('markName', markName);
}
function markListChange(){
  const obj = document.getElementById('mark-list-value');
  markList = obj.value.split("\n");
  localStorage.setItem('markList', JSON.stringify(markList));
}
function exceptListChange(){
  const obj = document.getElementById('except-list-value');
  exceptList = obj.value.split("\n");
  localStorage.setItem('exceptList', JSON.stringify(exceptList));
}
function configMarkSet(){
  markName = localStorage.getItem('markName') || 1;   
  if(markName == 1) { document.getElementById('mark-name-check').checked = true; }
  markList = JSON.parse(localStorage.getItem('markList')) || [];
  document.getElementById('mark-list-value').value = markList.join("\n");
  autosizeUpdate(document.getElementById('mark-list-value'));
  exceptList = JSON.parse(localStorage.getItem('exceptList')) || [];
  document.getElementById('except-list-value').value = exceptList.join("\n"); 
  autosizeUpdate(document.getElementById('except-list-value'));
}

// タグ挿入 ----------------------------------------
const formCommMain = document.getElementById('form-comm-main');
$(".insert-ruby").click(function(){
  const selText = $('#form-comm-main').selection();
  $("#form-comm-main")
    .selection("insert", {text: "<ruby>"+selText+"(", mode: "before"})
    .selection('replace', {text: ''})
    .selection("insert", {text: ")</ruby>", mode: "after"});
  autosizeUpdate(formCommMain);
});
$(".insert-em").click(function(){
  $("#form-comm-main")
    .selection("insert", {text: "<em>", mode: "before"})
    .selection("insert", {text: "</em>", mode: "after"});
  autosizeUpdate(formCommMain);
});
$(".insert-serif").click(function(){
  $("#form-comm-main")
    .selection("insert", {text: "<mi>", mode: "before"})
    .selection("insert", {text: "</mi>", mode: "after"});
  autosizeUpdate(formCommMain);
});
$(".insert-hide").click(function(){
  $("#form-comm-main")
    .selection("insert", {text: "<hide>", mode: "before"})
    .selection("insert", {text: "</hide>", mode: "after"});
  autosizeUpdate(formCommMain);
});
$(".insert-bold").click(function(){
  $("#form-comm-main")
    .selection("insert", {text: "<b>", mode: "before"})
    .selection("insert", {text: "</b>", mode: "after"});
  autosizeUpdate(formCommMain);
});
$(".insert-oblique").click(function(){
  $("#form-comm-main")
    .selection("insert", {text: "<i>", mode: "before"})
    .selection("insert", {text: "</i>", mode: "after"});
  autosizeUpdate(formCommMain);
});
$(".insert-strike").click(function(){
  $("#form-comm-main")
    .selection("insert", {text: "<s>", mode: "before"})
    .selection("insert", {text: "</s>", mode: "after"});
  autosizeUpdate(formCommMain);
});
$(".insert-under").click(function(){
  $("#form-comm-main")
    .selection("insert", {text: "<u>", mode: "before"})
    .selection("insert", {text: "</u>", mode: "after"});
  autosizeUpdate(formCommMain);
});
$(".insert-color").click(function(){
  const selText = $('#form-comm-main').selection();
  $("#form-comm-main")
    .selection("insert", {text: "<c:orange", mode: "before"})
    .selection('replace', {text: ''})
    .selection("insert", {text: ">"+selText+"</c>", mode: "after"});
  autosizeUpdate(formCommMain);
});
$(".insert-big").click(function(){
  $("#form-comm-main")
    .selection("insert", {text: "<big>", mode: "before"})
    .selection("insert", {text: "</big>", mode: "after"});
  autosizeUpdate(formCommMain);
});
$(".insert-small").click(function(){
  $("#form-comm-main")
    .selection("insert", {text: "<small>", mode: "before"})
    .selection("insert", {text: "</small>", mode: "after"});
  autosizeUpdate(formCommMain);
});
$(".insert-horizon").click(function(){
  $("#form-comm-main")
    .selection("insert", {text: "<hr>", mode: "before"});
  autosizeUpdate(formCommMain);
});
$(".insert-left").click(function(){
  $("#form-comm-main")
    .selection("insert", {text: "<left>", mode: "before"})
    .selection("insert", {text: "</left>", mode: "after"});
  autosizeUpdate(formCommMain);
});
$(".insert-center").click(function(){
  $("#form-comm-main")
    .selection("insert", {text: "<center>", mode: "before"})
    .selection("insert", {text: "</center>", mode: "after"});
  autosizeUpdate(formCommMain);
});
$(".insert-right").click(function(){
  $("#form-comm-main")
    .selection("insert", {text: "<right>", mode: "before"})
    .selection("insert", {text: "</right>", mode: "after"});
  autosizeUpdate(formCommMain);
});

// 音量調節 ----------------------------------------
let volumes = {};
function configVolumeSet(){
  for (let v of ['bgm','chat','mark','ready']){
    volumes[v] = (localStorage.getItem('volume-'+v) || 100);
    document.getElementById('volume-'+v).value             = volumes[v];
    document.getElementById('volume-'+v+'-view').innerHTML = volumes[v] + '%';
  }
  volumes['master'] = (localStorage.getItem('volume-master') || 80);
  document.getElementById('volume-master').value          = volumes['master'];
  document.getElementById('volume-master-view').innerHTML = volumes['master'] + '%';
}
(function(){
  $(document).on("change", '#config-sound input[type="range"]', function(e) {
    const obj = e.target;
    const type = obj.dataset.type;
    volumes[type] = obj.value;
    document.getElementById(obj.id+'-view').innerHTML = obj.value+'%';
    if(type === 'bgm' || type === 'master') {
      bgmVolumeSet();
    }
    else if(type !== 'master') {
      const se = new Audio( type == 'chat' ? (seType['chat1']||seType['chat']) : seType[type] );
      se.volume = (obj.value / 100) * (volumes['master'] / 100);
      se.currentTime = 0;
      se.play();
    }
    localStorage.setItem(obj.id, obj.value);
  });
})();
function bgmVolumeSet(){
  const vol = (currentBgm['vol'] / 100) * (volumes['bgm'] / 100) * (volumes['master'] / 100);
  bgMusic.volume = vol;
  ytPlayer.setVolume(Math.round(vol*100));
}

// 着信SE ----------------------------------------
function seTypeChange(obj,name,num){
  let se;
  if(name === 'chat'){
    seType[name+num] = obj.value;
    se = new Audio(seType[name+num]);
  }
  else {
    seType[name] = obj.value;
    se = new Audio(seType[name]);
  }
  se.volume = (volumes[name] / 100) * (volumes['master'] / 100);
  se.currentTime = 0;
  se.play();
  localStorage.setItem('seType', JSON.stringify(seType));
}
function configSeTypeSet(){
  let data = localStorage.getItem('seType');
  if(data){ seType = JSON.parse(localStorage.getItem('seType')); }
  Object.keys(seType).forEach(key => {
    if(document.getElementById('option-se-'+key)){
      document.getElementById('option-se-'+key).value = seType[key];
    }
  });
}
// BGM ----------------------------------------
let bgMusic = new Audio(''); 
    bgMusic.loop = true;
let currentBgm = {'url':'','vol':'','title':''};
// Youtubeプレーヤー用意
function setYoutubePlayer(){
  let tag = document.createElement('script');
  tag.src = "https://www.youtube.com/player_api";
  let firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}
let ytPlayer;
let ytPreview;
function onYouTubePlayerAPIReady() {
  ytPlayer = new YT.Player('bgm-yt-player', {
    height: '180',
    width : '100%',
    playerVars: {
      controls: 0,
    },
    events: {
      'onStateChange': ytPlayerLoop,
      'onReady': ytPlayerReady
    }
  });
  ytPreview = new YT.Player('bgm-yt-preview', {
    height: '110',
    width : '100%',
    playerVars: {
      controls: 1,
    },
    events: {
      'onStateChange': ytPreaviewPlaying,
      'onReady': ytPreviewReady
    }
  });
}
function ytPlayerReady() {
  if(currentBgm['url'].match(/^https:\/\/youtu\.be\/(.+)$/)){
    ytPlayer.cueVideoById(RegExp.$1);
    bgmVolumeSet();
  }
}
function ytPlayerLoop(e) {
  var ytStatus = e.target.getPlayerState();
  if (ytStatus == YT.PlayerState.ENDED) {
    ytPlayer.playVideo();
  }
}
function ytPreviewReady() {
  bgmPreviewVol(100);
}
// BGMオープン
function bgmOpen(){
  const ytpl = document.getElementById('bgm-youtube-area');
  if(currentBgm['url'].match(/^https:\/\/youtu\.be\/(.+)$/)){
    ytpl.style.display = '';
  }
  else { ytpl.style.display = 'none'; }
  document.getElementById('bgm-title').innerHTML = currentBgm['url'] ? `<a class="link" onclick="bgmOpen('bgm-confirm')">${currentBgm['title']}</a>` : '－';
  document.getElementById('bgm-title-view').innerHTML = currentBgm['title'];
  document.getElementById('bgm-volume-view').innerHTML = currentBgm['vol'];
  boxOpen('bgm-confirm');
}
// 新規BGMセット
let beforeBGM;
function bgmSet(){
  if(beforeBGM != currentBgm['url']){
    if(currentBgm['url'].match(/^https:\/\/youtu\.be\/(.+)$/)){
      bgMusic.pause();
      ytPlayer.loadVideoById(RegExp.$1);
      bgMusic.src = '';
    }
    else {
      ytPlayer.pauseVideo()
      ytPlayer.loadVideoById('');
      bgMusic.src = currentBgm['url'];
      bgMusic.play();
    }
    beforeBGM = currentBgm['url'];
  }
  else {
    if(currentBgm['url'].match(/^https:\/\/youtu\.be\/(.+)$/)){ ytPlayer.playVideo(); }
    else { bgMusic.play(); }
  }
  bgmVolumeSet();
  document.getElementById('bgm-title').innerHTML = currentBgm['url'] ? `<a class="link" onclick="bgmOpen('bgm-confirm')">${currentBgm['title']}</a>` : '－';
}
// 再生
function bgmPlay(){
  bgmSet();
  if(!muteOn){ bgmMute(false) };
}
// 一時停止
function bgmPause(){
  bgMusic.pause()
  ytPlayer.pauseVideo();
  bgmMute(true)
}
// ミュート
function bgmMute(on){
  if(on) {
    bgMusic.muted = true;
    ytPlayer.mute();
  }
  else {
    bgMusic.muted = false;
    ytPlayer.unMute();
  }
}
// プレビュー
const audioPreview = document.getElementById('bgm-set-preview');
const audioPreviewButton = document.getElementById('bgm-set-preview-play');
// URL入力
function bgmPreview(){
  const url = document.getElementById('bgm-set-url').value;
  bgmPreviewPlay(url);
}
audioPreview.addEventListener('durationchange',function(e) {
  audioPreview.currentTime = 0;
  audioTimeUpdate();
});
audioPreview.addEventListener('play',function(e) {
  bgmMute(true);
});
function ytPreaviewPlaying(e) {
  var ytStatus = e.target.getPlayerState();
  if (ytStatus == YT.PlayerState.PLAYING) {
    bgmMute(true);
  }
}
// プリセット／履歴から再生
function bgmInputSet(url, title, volume){
  document.getElementById('bgm-set-url').value    = url;
  document.getElementById('bgm-set-title').value  = title;
  volume = volume || 100;
  document.getElementById('bgm-set-volume').value = volume;
  bgmPreviewVol(volume);
  bgmPreviewPlay(url);
}
// プレビュー再生
function bgmPreviewPlay(url){
  const playerA = document.getElementById('bgm-set-preview-area');
  const playerY = document.getElementById('bgm-yt-preview-area');
  if(url.match(/^https?:\/\/(?:www\.)?youtube\.com\/watch\?(?:.*?)v=(.+?)(?:&|$)/)){
    playerA.style.display = 'none';
    playerY.style.display = '';
    audioPreview.pause();
    ytPreview.loadVideoById(RegExp.$1);
  }
  else if(url.match(/^https?:\/\/youtu\.be\/(.+)$/)){
    playerA.style.display = 'none';
    playerY.style.display = '';
    audioPreview.pause();
    ytPreview.loadVideoById(RegExp.$1);
    
  }
  else {
    playerA.style.display = '';
    playerY.style.display = 'none';
    ytPreview.pauseVideo();
    audioPreview.src  = url;
    audioPreview.play();
    audioPreviewButton.classList.add('playing');
  }
}
// プレビューボリューム変更
function bgmPreviewVol(v){
  const vol = ((v || 100) / 100) * (volumes['bgm'] / 100) * (volumes['master'] / 100)
  audioPreview.volume = vol;
  document.getElementById('bgm-set-volume-text').innerHTML = v;
  ytPreview.setVolume(Math.round(vol*100));
}
// プレビュー再生ボタン
audioPreviewButton.addEventListener('click', () => {
  audioPreviewButton.classList.toggle('playing');
  if(audioPreviewButton.classList.contains('playing')){
    audioPreview.play();
  }
  else {
    audioPreview.pause();
  }
})
// プレビューシークバー
document.getElementById('bgm-set-preview-seekbar').addEventListener("click", (e) => {
  const duration = Math.round(audioPreview.duration);
  if(!isNaN(duration)){
    const mouse = e.pageX;
    const element = document.getElementById('bgm-set-preview-seekbar');
    const rect = element.getBoundingClientRect();
    const position = rect.left + window.pageXOffset;
    const offset = mouse - position;
    const width = rect.right - rect.left;
    audioPreview.currentTime = Math.round(duration * (offset / width));
  }
});
// プレビュー他
audioPreview.addEventListener("timeupdate", (e) => {
  audioTimeUpdate();
});
function audioTimeUpdate (){
  const current = Math.floor(audioPreview.currentTime);
  const duration = Math.round(audioPreview.duration);
  if(!isNaN(duration)){
    document.getElementById('bgm-set-preview-current').innerHTML = playTime(current);
    document.getElementById('bgm-set-preview-duration').innerHTML = playTime(duration);
    const percent = Math.round((audioPreview.currentTime/audioPreview.duration)*1000)/10;
    document.getElementById('bgm-set-preview-seekbar').style.backgroundSize = percent + '%';
  }
}
function playTime(t) {
  let hms = ''
  const h = t / 3600 | 0
  const m = t % 3600 / 60 | 0
  const s = t % 60
  const z2 = (v) => {
    const s = '00' + v
    return s.substr(s.length - 2, 2)
  }
  if(h != 0){
    hms = h + ':' + z2(m) + ':' + z2(s)
  }else if(m != 0){
    hms = z2(m) + ':' + z2(s)
  }else{
    hms = '00:' + z2(s)
  }
  return hms
}
// プレビューを閉じる
function bgmPreviewEnd(){
  audioPreview.pause();
  ytPreview.pauseVideo();
  if(!muteOn){ bgmMute(false); }
}
// 履歴追加
function bgmHistoryUpdate(){
  const area = document.getElementById('bgm-history');
  area.innerHTML = '';
  let sortHistory = [];
  for (let key in bgmHistory){
    const title = bgmHistory[key][0];
    const volume = bgmHistory[key][1];
    sortHistory.push([ key, title, volume ]);
  }
  sortHistory.sort(function(a,b){
    const A = a[1].toUpperCase();
    const B = b[1].toUpperCase();
    if (A < B) { return -1; }
    else if (A > B) { return 1; }
    return 0;
  });
  for (let i in sortHistory){
    const url    = sortHistory[i][0];
    const title  = sortHistory[i][1];
    const volume = sortHistory[i][2];
    let obj = document.createElement('li');
    obj.innerHTML = `${title}`;
    obj.dataset.vol = volume || 100 ;
    obj.addEventListener('click', () => { bgmInputSet(url, title, volume) });
    area.appendChild(obj);
  }
}
// 背景 ----------------------------------------
function bgPreview(){
  const url = document.getElementById('bg-set-url').value;
  document.getElementById('bg-set-preview').src = url;
}
function bgHistoryUpdate(){
  const area = document.getElementById('bg-history');
  area.innerHTML = '';
  let sortHistory = [];
  for (let key in bgHistory){
    sortHistory.push([key,bgHistory[key]]);
  }
  sortHistory.sort(function(a,b){
    const A = a[1].toUpperCase();
    const B = b[1].toUpperCase();
    if (A < B) { return -1; }
    else if (A > B) { return 1; }
    return 0;
  });
  for (let i in sortHistory){
    const url   = sortHistory[i][0];
    const title = sortHistory[i][1];
    let obj = document.createElement('li');
    obj.innerHTML = title;
    obj.addEventListener('click', () => { bgInputSet(url, title) });
    area.appendChild(obj);
  }
}
function bgInputSet(url, title){
  document.getElementById('bg-set-preview').src = url;
  document.getElementById('bg-set-url').value = url;
  document.getElementById('bg-set-title').value = title;
}

// 挿絵 ----------------------------------------
function imgPreview(){
  const url = document.getElementById('image-insert-url').value;
  document.getElementById('image-insert-preview').src = url;
}
function imgView(url){
  document.getElementById('image-box-image').src = url;
  document.getElementById('image-box').style.display = 'block';
}
(function(){
  document.getElementById('chat-area').addEventListener("click",(e) => {
    if (e.target.closest('dd img.insert')) {
      imgView(e.target.src)
    }
    if (e.target.closest('dd .chara-image')) {
      imgView( e.target.style.backgroundImage.replace(/^url\("?/,'').replace(/"?\)$/,'') );
    }
  });
  document.getElementById('image-box').addEventListener("click",(e) => {
    document.getElementById('image-box').style.display = 'none';
    document.getElementById('image-box-image').src = '';
  });
})();

// キー動作 ----------------------------------------
document.onkeydown = function(e){
  if (e.ctrlKey) {
    // 名前↑
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const obj = document.getElementById("form-name");
      let num = obj.selectedIndex;
      num = (num > 0) ? num-1 : obj.length-1;
      obj.selectedIndex = num;
      nameChange(num);
    }
    // 名前↓
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const obj = document.getElementById("form-name");
      let num = obj.selectedIndex;
      num = (num < obj.length-1) ? num+1 : 0;
      obj.selectedIndex = num;
      nameChange(num);
    }
    // タブ←
    else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if(mainTab){
        const num = (mainTab > 1) ? mainTab-1 : Object.keys(tabList).length;
        mainTabChange(num);
      }
      else { mainTabChange(1); }
    }
    // タブ→
    else if (e.key === 'ArrowRight') {
      e.preventDefault();
      if(mainTab){
        const num = (mainTab < Object.keys(tabList).length) ? mainTab+1 : 1;
        mainTabChange(num);
      }
      else { mainTabChange(1); }
    }
  }
  // フォーム上のキー動作
  if(e.target.classList.contains('form-comm')){
    // Enterで送信
    if (e.keyCode === 13) { //Mac対策にkeyCodeで判断
      if (e.shiftKey || e.target.dataset.lock === 'memo') {
        // 
      }
      else if (e.target.value.replace(/\r?\n/g, "").length <= 0) {
        e.preventDefault();
      }
      else {
        e.preventDefault();
        // ダイス欄
        if(e.target.parentNode.classList.contains('dice-button')){
          const type = e.target.dataset.lock;
          if(subFormBehavior[type] === 'copy'){
            document.getElementById("form-comm-main").value = document.getElementById(e.target.id).value;
            document.getElementById("form-comm-main").focus();
          }
          else if(subFormBehavior[type] === 'add'){
            formSubmit("form-comm-main");
            formSubmit(e.target.id, e.target.dataset.paletteTarget);
          }
          else {
            formSubmit(e.target.id, e.target.dataset.paletteTarget);
          }
        }
        // 他
        else { formSubmit(e.target.id, e.target.dataset.paletteTarget); }
      }
    }
    // 前回送信した発言を取得
    else if (e.key === 'ArrowUp') {
      if(!e.target.value && beforeComm[e.target.id] && !e.ctrlKey) {
        e.preventDefault();
        e.target.value = beforeComm[e.target.id];
        autosizeUpdate(e.target);
      }
    }
  }
}

// 発言欄行増加時スクロール ----------------------------------------
//let boxHeight = {};
//$(document).on("keyup", "#main-form .form-comm, .chat .form-comm", function(e) {
//  let tab = 0;
//  if(e.target.closest('[data-tab]')){ tab = e.target.closest('[data-tab]').dataset.tab; }
//  else { tab = mainTab; }
//  if(boxHeight[e.target.id] !== e.target.style.height) {
//    if(scrollCheck(tab)){
//      scrollBottom(tab);
//      boxHeight[e.target.id] = e.target.style.height;
//    }
//  }
//});

function statusListSave(){
  const statusList = Array.from(document.getElementById('status-body').children).map(obj => obj.dataset.name );
  localStorage.setItem(roomId+'-statusList', JSON.stringify(statusList));
}

// スマホ用 ----------------------------------------
$(window).resize(function(){
  if(window.matchMedia('(max-width:600px)').matches){
    scrollBottom(mainTab);
  }
});

// jquery ui ----------------------------------------
$(function(){
  // ソート
  $('#status-body').sortable({
    handle:'>dt',
    update: function(){ statusListSave(); }
  });
  $('#memo-list').sortable();
  if(window.matchMedia('(min-width:601px)').matches){
    $('#chat-area').sortable({handle:'h2'});
  }
  // ドラッグ移動
  $('.float-box').draggable({handle:'h2',containment:'document'});
});
