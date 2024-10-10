"use strict";
// UI
// ------------------------------

function resolveGoogleDriveAssetUrl(url) {
  if(url.match(/^https?:\/\/drive\.google\.com\/file\/d\/(.+)\/view\?usp=(?:sharing|(?:share|drive)_link)$/)){
    return `https://drive.google.com/uc?id=` + RegExp.$1;
  }

  return url;
}

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
  document.querySelector('#chat-tab'+tabId+' > .notice-unread').dataset.unread = 0;
  document.querySelector('#tablist-tab'+tabId).dataset.unread = 0;
  
  oldLogHide(tabId)
}

// ログのスクロール位置を確認 ----------------------------------------
function scrollCheck(tabId){
  if(window.matchMedia('(max-width:600px)').matches && tabId != mainTab){
    return 0;
  }
  if(!document.getElementById('chat-tab'+tabId)){ return 0; }
  if(document.getElementById('chat-tab'+tabId).classList.contains('view')){
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
function fontSizeChange(obj){
  const tab = obj.closest('.tab-group');
  const num = tab.dataset.group;
  tab.style.setProperty('--log-fontsize', obj.value+'%');
  roomConfig.fontSize[num] = obj.value;
  tab.querySelector('.option i').dataset.value = obj.value;
  saveRoomConfig();
}

// フォント設定セット ----------------------------------------
function configFontSet(){
  if     (config.fontLightness <  50){ config.fontLightness =  50 }
  else if(config.fontLightness > 100){ config.fontLightness = 100 }
  fontLightnessSet();
  document.getElementById('option-font-lightness').value = config.fontLightness;

  fontShadowSet();
  document.getElementById('option-font-shadow').checked = config.fontShadow ? true : false;

  if(config.fontFamily) {
    fontFamilySet();
    document.getElementById('option-font-family-jp').value = config.fontFamily;
  }
  if(config.fontFamilyMin) {
    fontFamilyMinSet();
    document.getElementById('option-font-family-min').value = config.fontFamilyMin;
  }
}
// フォント明暗 ----------------------------------------
document.getElementById('option-font-lightness').addEventListener("input",(e) => {
  config.fontLightness = e.target.value;
  fontLightnessSet();
  saveCommonConfig();
});

function fontLightnessSet() {
  console.log('fontLightnessSet():',config.fontLightness);
  document.documentElement.style.setProperty('--logs-font-color-lightness', config.fontLightness+'%');
  document.getElementById('option-font-lightness-view').innerHTML = config.fontLightness;
}

// フォント縁取り ----------------------------------------
document.getElementById('option-font-shadow').addEventListener("change",(e) => {
  config.fontShadow = e.target.checked ? 1 : 0;
  fontShadowSet();
  saveCommonConfig();
});

function fontShadowSet() {
  console.log('fontShadowSet():',config.fontShadow);
  document.body.classList.toggle('no-text-shadow', !config.fontShadow)
}

// フォントファミリー ----------------------------------------
document.getElementById('option-font-family-jp').oninput = function (e){
  config.fontFamily = e.target.value;
  fontFamilySet();
  saveCommonConfig();
};
function fontFamilySet() {
  document.documentElement.style.setProperty('--logs-font-family-jp', config.fontFamily);
}

document.getElementById('option-font-family-min').oninput = function (e){
  config.fontFamilyMin = e.target.value;
  fontFamilyMinSet();
  saveCommonConfig();
};
function fontFamilyMinSet() {
  document.documentElement.style.setProperty('--logs-font-family-min', config.fontFamilyMin);
}
// フォーム・パレット設定 ----------------------------------------
document.getElementById('option-palette-destinate').oninput = function (e){
  config.paletteDestinate = e.target.value;
  saveCommonConfig();
  document.querySelector(`#sheet-area`).classList.toggle('destinate-main', config.paletteDestinate === 'main');
}
document.getElementById('option-subform-full-behavior').oninput = function (e){
  config.subFormBehavior["full"] = e.target.value;
  saveCommonConfig();
}
document.getElementById('option-subform-dice-behavior').oninput = function (e){
  config.subFormBehavior["dice"] = e.target.value;
  saveCommonConfig();
}
document.getElementById('option-subform-name-behavior').oninput = function (e){
  config.subFormBehavior["name"] = e.target.value;
  saveCommonConfig();
}
document.getElementById('option-subform-off-behavior').oninput = function (e){
  config.subFormBehavior["off"] = e.target.value;
  saveCommonConfig();
}
function configFormSet(){
  document.getElementById('option-palette-destinate').value = config.paletteDestinate;
  document.querySelector(`#sheet-area`).classList.toggle('destinate-main', config.paletteDestinate === 'main');
  Object.keys(config.subFormBehavior).forEach(key => {
    document.getElementById('option-subform-'+key+'-behavior').value = config.subFormBehavior[key];
  });
}

// レイアウト変更 ----------------------------------------
function layoutChange(){
  config.layoutSheet  = document.getElementById('window-layout-sheet').value;
  config.layoutSide   = document.getElementById('window-layout-sidebar').value;
  const base      = document.getElementById('base');
  const sidebar   = document.getElementById('sidebar');
  const sheet     = document.getElementById('sheet-area');
  const topicEdit = document.getElementById('edit-topic');
  if(config.layoutSheet === 'R'){
    sheet.classList.remove('left');
    if(config.layoutSide === 'right-top'){
      base.style.gridTemplateColumns = '1fr max-content max-content';
      base.style.gridTemplateAreas   = `
        " menu  menu sheet"
        "topic  side sheet"
        " chat  side sheet"
        " form  form  form"
        " foot  foot  foot"`;
    }
    else if(config.layoutSide === 'right-bottom'){
      base.style.gridTemplateColumns = '1fr max-content max-content';
      base.style.gridTemplateAreas   = `
        " menu  menu sheet"
        " chat  side sheet"
        "topic  side sheet"
        " form  form  form"
        " foot  foot  foot"`;
    }
    else if(config.layoutSide === 'left-top'){
      base.style.gridTemplateColumns = 'max-content 1fr max-content';
      base.style.gridTemplateAreas   = `
        " menu  menu sheet"
        " side topic sheet"
        " side  chat sheet"
        " form  form  form"
        " foot  foot  foot"`;
    }
    else if(config.layoutSide === 'left-bottom'){
      base.style.gridTemplateColumns = 'max-content 1fr max-content';
      base.style.gridTemplateAreas   = `
        " menu  menu sheet"
        " side  chat sheet"
        " side topic sheet"
        " form  form  form"
        " foot  foot  foot"`;
    }
    else if(config.layoutSide === 'high'){
      base.style.gridTemplateColumns = '1fr max-content';
      base.style.gridTemplateAreas   = `
        " menu  sheet"
        " side  sheet"
        "topic  sheet"
        " chat  sheet"
        " form   form"
        " foot   foot"`;
    }
    else if(config.layoutSide === 'shallow'){
      base.style.gridTemplateColumns = '1fr max-content';
      base.style.gridTemplateAreas   = `
        " menu  sheet"
        " chat  sheet"
        "topic  sheet"
        " side   side"
        " form   form"
        " foot   foot"`;
    }
    else if(config.layoutSide === 'deep'){
      base.style.gridTemplateColumns = '1fr max-content';
      base.style.gridTemplateAreas   = `
        " menu  sheet"
        " chat  sheet"
        "topic  sheet"
        " form   form"
        " side   side"
        " foot   foot"`;
    }
  }
  else if(config.layoutSheet === 'L'){
    sheet.classList.add('left');
    if(config.layoutSide === 'right-top'){
      base.style.gridTemplateColumns = 'max-content 1fr max-content';
      base.style.gridTemplateAreas   = `
        "sheet  menu  menu"
        "sheet topic  side"
        "sheet  chat  side"
        " form  form  form"
        " foot  foot  foot"`;
    }
    else if(config.layoutSide === 'right-bottom'){
      base.style.gridTemplateColumns = 'max-content 1fr max-content';
      base.style.gridTemplateAreas   = `
        "sheet  menu  menu"
        "sheet  chat  side"
        "sheet topic  side"
        " form  form  form"
        " foot  foot  foot"`;
    }
    else if(config.layoutSide === 'left-top'){
      base.style.gridTemplateColumns = 'max-content max-content 1fr';
      base.style.gridTemplateAreas   = `
        "sheet  menu  menu"
        "sheet  side topic"
        "sheet  side  chat"
        " form  form  form"
        " foot  foot  foot"`;
      sheet.classList.add('left');
    }
    else if(config.layoutSide === 'left-bottom'){
      base.style.gridTemplateColumns = 'max-content max-content 1fr';
      base.style.gridTemplateAreas   = `
        "sheet  menu  menu"
        "sheet  side  chat"
        "sheet  side topic"
        " form  form  form"
        " foot  foot  foot"`;
    }
    else if(config.layoutSide === 'high'){
      base.style.gridTemplateColumns = 'max-content 1fr';
      base.style.gridTemplateAreas   = `
        "sheet   menu"
        "sheet   side"
        "sheet  topic"
        "sheet   chat"
        " form   form"
        " foot   foot"`;
      }
    else if(config.layoutSide === 'shallow'){
      base.style.gridTemplateColumns = 'max-content 1fr';
      base.style.gridTemplateAreas   = `
        "sheet   menu"
        "sheet   chat"
        "sheet  topic"
        " side   side"
        " form   form"
        " foot   foot"`;
    }
    else if(config.layoutSide === 'deep'){
      base.style.gridTemplateColumns = 'max-content 1fr';
      base.style.gridTemplateAreas   = `
        "sheet   menu"
        "sheet   chat"
        "sheet  topic"
        " form   form"
        " side   side"
        " foot   foot"`;
    }
  }
  
  if(config.layoutSide.match(/top/)){
    base.style.gridTemplateRows = 'max-content max-content 1fr max-content max-content';
    topicEdit.style.top = '5em';
    topicEdit.style.bottom = 'auto';
    sidebar.dataset.layout = "";
  }
  else if(config.layoutSide.match(/bottom/)){
    base.style.gridTemplateRows = 'max-content 1fr max-content max-content max-content';
    topicEdit.style.top = 'auto';
    topicEdit.style.bottom = '12em';
    sidebar.dataset.layout = "bottom";
  }
  else if(config.layoutSide.match(/high/)){
    base.style.gridTemplateRows = 'max-content max-content max-content 1fr max-content max-content';
    topicEdit.style.top = '5em';
    topicEdit.style.bottom = 'auto';
    sidebar.dataset.layout = "row";
  }
  else if(config.layoutSide.match(/shallow|deep/)){
    base.style.gridTemplateRows = 'max-content 1fr max-content max-content max-content max-content';
    topicEdit.style.top = 'auto';
    topicEdit.style.bottom = '12em';
    sidebar.dataset.layout = "row";
  }
  
  saveCommonConfig()
}
function configLayoutSet(){
  document.getElementById('window-layout-sidebar').value = config.layoutSide;
  document.getElementById('window-layout-sheet').value   = config.layoutSheet;
  layoutChange();
  document.getElementById('layout-tab-bar').value = config.layoutTabBar;
  layoutTabBarChange();
}

// レイアウト変更：チャットタブバー ----------------------------------------
function layoutTabBarChange(){
  config.layoutTabBar = document.getElementById('layout-tab-bar').value;
  document.getElementById('chat-area').dataset.layoutTabBar = config.layoutTabBar;
  saveCommonConfig();
}

// サイドバー開閉 ----------------------------------------
function sidebarToggle(){
  document.getElementById('sidebar').classList.toggle('close');
}
// ボックス開閉 ----------------------------------------
function boxOpen(id,details){
  const boxObj = document.getElementById(id);
  if(details){
    const detailsObj = document.getElementById(details);
    if(boxObj.classList.contains('open') && detailsObj.open){
      boxObj.classList.remove('open');
    }
    else {
      document.querySelectorAll(`#${id} details`).forEach(obj => { obj.open = false; });
      document.getElementById(details).open = true;
      boxObj.classList.add('open');
    }
  }
  else {
    boxObj.classList.toggle('open');
  }
}
function boxClose(id){
  document.getElementById(id).classList.remove('open');
}
// 発言編集を開く ----------------------------------------
function rewriteOpen(num){
  boxOpen('rewrite-form');
  const obj = document.getElementById('rewrite-comm');
  obj.dataset.commPre = `/rewrite:${num} `;
  let setValue = rawLogs[num]
    .replace(/<br>/g, '\n')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
  obj.value = setValue;
  autosizeUpdate(obj);
  obj.focus();
}
function rewriteNameOpen(num,name){
  boxOpen('rewrite-name-form');
  const select = document.getElementById('rewrite-name');
  select.dataset.num = num;
  select.innerHTML = document.getElementById('form-name').innerHTML;
  select.querySelectorAll('option').forEach(obj => {
    if(name == obj.innerHTML){ select.value = obj.value; return }
  })
}
// トピックを開く ----------------------------------------
function topicOpen(){
  boxOpen('edit-topic');
  let topicValue = rawTopic;
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
  console.log('npcSave()');
  const lines = document.getElementById('edit-npc-value').value.split(/\n/g);
  let newList = [
    { 'name': nameList[0]['name'], 'color': nameList[0]['color'] }
  ];
  let num = 1;
  for(let i=0; i<lines.length; i++){
    let color = randomColor();
    if(!lines[i]){ continue }
    const name = lines[i].replace(/[#＃]([0-9a-zA-Z]{6})$/, () => { color = '#'+RegExp.$1; return '' });
    newList[num] = {};
    newList[num]['name'] = name;
    newList[num]['color'] = color;
    num++;
  }
  roomConfig.name = newList;
  nameList = roomConfig.name;
  npcBoxSet();
  saveRoomConfig();
}
// 追加
function npcAdd(){
  console.log('npcAdd()');
  nameList.push({ 'name': '', 'color': randomColor() });
  document.getElementById('main-name1').value = '';
  npcBoxSet();
  saveRoomConfig();
  document.getElementById('main-name1').focus();
}
// 削除
function npcDel(){
  console.log('npcDel()');
  if(nameList.length <= 1){ console.log('名前欄:下限'); return false }
  let del = nameList.pop();
  npcBoxSet();
  saveRoomConfig();
}
// ランダムカラー
function randomColor(){
  return colorPaletteRandom[  Math.floor( Math.random() * colorPaletteRandom.length )  ];
}
// セレクトボックスにセット
function npcBoxSet(){
  console.log('npcBoxSet()');
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
  select.value = nowSelectValue;
  nameChange(nowSelectValue);
  
  for (let key in tabList) {
    const obj = document.getElementById(`form-name-tab${key}`);
    const selected = obj.value || 0;
    obj.innerHTML = document.getElementById(`form-name`).innerHTML;
    obj.value = selected;
  }

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
    saveRoomConfig();
  }
});
  //選択
document.getElementById('form-name').addEventListener("change",function(e){ 
  nameChange(e.target.value);
});
function nameChange(num){
  console.log('nameChange()')
  if(num == 0){ document.getElementById('main-name1').readOnly = true; }
  else        { document.getElementById('main-name1').readOnly = false; }
  document.getElementById('main-name1').value       = nameList[num]['name'];
  document.getElementById('main-name1').style.color = nameList[num]['color'];
  document.getElementById('form-color').value       = nameList[num]['color'];
  pickr['form-color'].setColor(nameList[num]['color']);

  checkButtonMainVisibleToggle();

  roomConfig.selectedName[0] = num||0;
  saveRoomConfig();
}

function nameChangeSub(tabNum){
  console.log(`nameChangeSub(${tabNum})`)
  const obj = document.getElementById(`form-name-tab${tabNum}`);
  obj.style.color = nameList[ obj.value||0 ].color;
  roomConfig.selectedName[tabNum||0] = obj.value||0;
  saveRoomConfig();
}

function checkButtonMainVisibleToggle(){
  const nameNum = document.getElementById('form-name').value || 0;
  const name = nameList[nameNum]['name'];
  document.querySelector('#main-form .check-buttons').style.visibility = unitList[name] ? 'visible' : 'hidden';
  document.querySelector('#main-form .check-buttons button').classList.toggle('checked', unitList[name] && unitList[name]['check'])
}
// 色変更 ----------------------------------------
const colorPalette = [];
const colorCodeToName = {};
const colorPaletteRandom = [];
document.querySelectorAll('#color-list > option').forEach(obj=>{
  colorPalette.push(obj.value);
  colorCodeToName[obj.value.toUpperCase()] = obj.text;
  const brightness = 
      (parseInt(obj.value.substr(1, 2), 16) * 0.299) + // Red
      (parseInt(obj.value.substr(3, 2), 16) * 0.587) + // Green 
      (parseInt(obj.value.substr(5, 2), 16) * 0.114)   // Blue
  if(brightness > 70){ colorPaletteRandom.push(obj.value); }
});
let pickr = {};
document.querySelectorAll('.color-pickr').forEach(obj => {
  const target = obj.dataset.pickr;
  pickr[target] = Pickr.create({
    el: obj,
    theme: 'classic',
    comparison: false,
    swatches: colorPalette,
    default: '#ffffff',
    components: {
      preview: true,
      hue: true,
      interaction: {
        cancel: true,
        save: true,
      },
    },
    i18n: {
      'btn:save': '閉じる',
      'btn:cancel': 'キャンセル',
    }
  })
  .on('show',color => {
    pickrColorNameSet(color.toHEXA().toString().toUpperCase());
  })
  .on('change',color => {
    console.log('pickr:change',target)
    if(target == 'form-color'){ nameColorChange( color.toHEXA().toString() ); }
    document.getElementById(target).value = color.toHEXA().toString();
    pickrColorNameSet(color.toHEXA().toString().toUpperCase());
  })
  .on('cancel',instance => {
    console.log('pickr:cancel',target)
    if(target == 'form-color'){ nameColorChange( instance.getSelectedColor().toHEXA().toString() ); }
    pickrColorNameSet(instance.getSelectedColor().toHEXA().toString().toUpperCase());
    instance.hide();
  })
  .on('save',instance => {
    console.log('pickr:save',target)
    pickr[target].hide();
  })
  .on('hide',instance => {
    console.log('pickr:hide',target)
    instance.applyColor();
    saveRoomConfig();
  })
});
function pickrColorNameSet(colorCode){
  let obj = document.querySelector('.pcr-app.visible .pcr-interaction .color-name');
  if(!obj){
    obj = document.createElement('span');
    obj.classList.add('color-name');
    const parent = document.querySelector('.pcr-app.visible .pcr-interaction');
    if(parent) parent.append(obj);
  }
  obj.innerHTML = colorCodeToName[colorCode];
}

document.getElementById('form-color').addEventListener('change', (e) => {
  pickr['form-color'].setColor(e.target.value);
  saveRoomConfig();
});
function nameColorChange(color){
  console.log(`nameColorChange(${color})`)
  const num = document.getElementById('form-name').value;
  nameList[num]['color'] = color;
  document.querySelector(`#form-name option[value="${num}"]`).style.color = color;
  document.getElementById('main-name1').style.color = color;
}
document.getElementById('in-color').addEventListener('change', (e) => {
  pickr['in-color'].setColor(e.target.value);
});
document.getElementById('new-unit-color-value').addEventListener('change', (e) => {
  pickr['new-unit-color-value'].setColor(e.target.value);
});
// 送信先選択フォーム ----------------------------------------
function addressUpdate(){
  console.log('addressUpdate()')
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
  select.value = nowSelect;

  for (let key in tabList) {
    const obj = document.getElementById(`form-address-tab${key}`);
    const selected = obj.value || '';
    obj.innerHTML = document.getElementById(`form-address`).innerHTML;
    obj.value = selected;
  }
  
  document.getElementById('member-num').innerHTML = num+'人';
}
document.querySelectorAll("#form-address, #secret-openlater").forEach(obj => {
  obj.addEventListener('change', () =>{ changeAddress(0); });
});
function changeAddress(tabNum){
  console.log(`changeAddress(${tabNum})`)
  const obj =  document.querySelector(`${tabNum ? '#chat-tab'+tabNum : '#main-form'} > .input-form`);
  const address = obj.querySelector('.address-area select').value;
  const checkboxOpenLater = obj.querySelector('.address-area input[type="checkbox"]');
  const logopen = checkboxOpenLater.checked;
  
  if(address){
    obj.classList.add('secret');
    checkboxOpenLater.removeAttribute('disabled');
  }
  else{
    obj.classList.remove('secret');
    checkboxOpenLater.setAttribute('disabled', '');
  }
  
  if(logopen){ obj.classList.add('openlater'); }
  else    { obj.classList.remove('openlater'); }
  
  roomConfig.selectedAddress[tabNum||0]  = address;
  roomConfig.checkedOpenLater[tabNum||0] = logopen;
  saveRoomConfig();
}

// メインフォームのダイス追加 ----------------------------------------
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
  newDice.innerHTML = `<textarea class="form-comm" id="dice-button-${area}-${n}" data-lock="${diceForms[area][n]['type']||'dice'}" data-area="${area}" data-num="${n}" rows="1" onchange="diceButtonOnChange(this);">${diceForms[area][n]['value']||''}</textarea><i onclick="lockTypeChange(${area},${n});"></i><button data-id="dice-button-${area}-${n}"></button></div>`;
  newOutline.appendChild(newDice);
  document.querySelector("#main-form #form-dice-"+area).appendChild(newOutline);
  
  if(toHalfWidth(diceForms[area][n]['value']).match(/^\/\/(.*?)[=＝](.*)$/)){
    const varName = RegExp.$1.toLowerCase();
    const varText = RegExp.$2;
    diceParams[varName] = varText;
  }
  autosize(document.getElementById('dice-button-'+area+'-'+n));
  saveRoomConfig();
}
function diceDel(area){
  const mainDiceArea = document.querySelector("#main-form #form-dice-"+area);
  const target = mainDiceArea.lastElementChild;
  if(mainDiceArea.childElementCount <= 4) return;
  mainDiceArea.removeChild(target);
  roomConfig.diceForms[area].pop();
  saveRoomConfig();
}
function diceScale(area, value){
  if     (value === 'shrink'){ diceColumn[area] = diceColumn[area] >= 5 ? 5 : diceColumn[area]+1; }
  else if(value === 'expand'){ diceColumn[area] = diceColumn[area] <= 1 ? 1 : diceColumn[area]-1; }
  else if(Number.isNaN(value)){ diceColumn[area] = value ? value : 1; }
  document.querySelector("#main-form #form-dice-"+area).style.gridTemplateColumns = `repeat(${diceColumn[area]}, 1fr)`;
  autosizeUpdate(document.querySelectorAll('#main-form .dice-button textarea'));
  saveRoomConfig();
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
  roomConfig.diceForms[area][num]['type'] = type;
  saveRoomConfig();
}
//
function diceButtonOnChange(obj){
  diceForms[obj.dataset.area][obj.dataset.num]['value'] = obj.value;
  if(toHalfWidth(obj.value).match(/^\/\/(.*?)[=＝](.*)$/)){
    const varName = RegExp.$1.toLowerCase();
    const varText = RegExp.$2;
    diceParams[varName] = varText;
  }
  saveRoomConfig();
  diceTriggerPaletteUpdate();
}
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
    let text = line.innerHTML.replace(/<i class="dice-param">(.+?)<\/i>/gi, '$1');
    Object.keys(diceParams).forEach(key => {
      const reg = new RegExp('([{｛]' + key + '[｝}])', 'gi');
      text = text.replace(reg, `<i class="dice-param">$1</i>`);
    });
    line.innerHTML = text;
  });
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
  newUnit.innerHTML = '<dt onclick="sheetSelect(\''+unitId+'\');sheetOpen();" class="chara-name" style="color:'+unitList[unitName]['color']+';">'+unitName+'</dt>';
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
      <h2 class="chara-name" style="color:${unitList[unitName]['color']}">${unitName}</h2>
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
              <button onclick="unitCheckSubmit('${unitId}');">行動済</button>
            </li>
            <li class="dice-button delete"><button onclick="unitCommandSubmit('delete' ,'${unitId}');">削除</button></li>
          </ul>
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
        <textarea id="memo-unit-${unitId}" class="autosize" placeholder="個人メモ" rows="2" onchange="sheetMemoSave(this,'${unitNameEscaped}');">${roomConfig.sheetMemo[unitName]||''}</textarea>
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
  document.getElementById(`edit-stt-${unitId}-memo-value`).value
    = unitList[unitName]['memo']
      .replace(/<br>/g,"\n")
      .replace(/&lt;/g,"<")
      .replace(/&gt;/g,">");
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
      summary.innerHTML = tagConvert(RegExp.$1);
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
      op.innerHTML = tagConvert(text);
      op.dataset.value = lines[i];
      op.tabIndex = '0';
      if(detailsOn){ select.lastElementChild.appendChild(op); }
      else         { select.appendChild(op); }
    }
  }
}
function paletteLineParamReplace(id,text){
  if(text === '') { return ['　'] }
  text = htmlEscape(text);
  const unitStatusNames = unitList[unitIdToName[id]]?.sttnames.map(x => x.toLowerCase()) ?? [];
  if(text.match(/^\/\/(.*?)[=＝](.*)$/)){ return [`<b>${RegExp.$1}</b><div><input data-label="${RegExp.$1}" value="${RegExp.$2}" onchange="paletteLineParamChange('${id}',this)"></div>`, 'param']; }
  else {
    return [text.replace(/[{｛](.+?)[｝}]/gi, function(raw, varNameRaw){
      const varName = toHalfWidth(varNameRaw).toLowerCase();
      if     (varName in diceParams)       { return `<i class="dice-param">${raw}</i>` }
      else if(varName in paletteParams[id]){ return `<i class="palette-param">${raw}</i>` }
      else if(unitStatusNames.includes(varName)){ return `<i class="unit-status">${raw}</i>` }
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
  roomConfig.sheetMemo[name] = obj.value;
  saveRoomConfig();
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
    shareMemo[i] ||= '';
    let newMemo = document.createElement('li');
    newMemo.innerHTML = tagConvert( (shareMemo[i].split(/\n/))[0] ).replace(/<.+?>/g,'');
    if (newMemo.innerHTML === '' && shareMemo[i].trim() === '') {
      newMemo.classList.add('removed');
    }
    newMemo.setAttribute("onclick","memoSelect("+i+");");
    newMemo.dataset.num = Number(i)+1;
    document.getElementById("memo-list").appendChild(newMemo);
    if(shareMemo[i]){ memoLength++ }
  }
  document.getElementById('memo').dataset.num = memoLength;
}
// 選択
let selectedMemo = '';
function memoSelect(num){
  const memoValue = document.getElementById("sheet-memo-value");
  const memoView = document.getElementById("memo-view");
  memoValue.value    = shareMemo[num] ? htmlUnEscape(shareMemo[num]) : '';
  memoView.innerHTML = shareMemo[num] ? tagConvert(shareMemo[num]) : '';
  const numText = num === '' ? 'new' : (Number(num)+1).toString();
  document.querySelector('#sheet-unit-memo h2').dataset.num = numText;
  document.getElementById('sheet-unit-memo').dataset.num = numText;
  document.getElementById('sheet-unit-memo').dataset.memoMode = shareMemo[num] ? 'view' : 'edit';
  sheetSelect('memo');
  selectedMemo = num;
  sheetOpen();
  autosizeUpdate(memoValue);
}
function memoModeChange(type){
  document.getElementById('sheet-unit-memo').dataset.memoMode = type;
  autosizeUpdate(document.getElementById("sheet-memo-value"));
}
function memoShowModal(){
  const dialog = document.getElementById('dialog-memo');
  dialog.innerHTML = document.getElementById("memo-view").innerHTML;
  dialog.showModal();

  dialog.addEventListener("click", function memoCloseModal(e) {
    const rect = dialog.getBoundingClientRect();
    const inDialog =
      rect.top <= e.clientY &&
      e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX &&
      e.clientX <= rect.left + rect.width;
    if (!inDialog) {
      dialog.close();
      dialog.innerHTML = '';
      dialog.removeEventListener('click', memoCloseModal);
    }
  });
}

// レディチェック ----------------------------------------
function setReadyCheckMessage(message) {
  document.querySelector('#ready-check > .message').textContent = message ?? '';
}
function openReadyCheckWindow(encodedMessage = null) {
  setReadyCheckMessage(
      encodedMessage != null && encodedMessage !== ''
          ? decodeURI(atob(encodedMessage))
          : null
  );

  boxOpen('ready-check');
}

// タブ ----------------------------------------
// タブグループ追加
function tabGroupAdd(groupNum){
  if(!groupNum){
    groupNum = 1;
    while(document.getElementById('tab-group'+groupNum)){
      groupNum++;
    }
  }
  let newGroup = document.createElement('div');
  newGroup.setAttribute("id",'tab-group'+groupNum);
  newGroup.dataset.group = groupNum;
  newGroup.classList.add('box','tab-group');
  if(groupNum == 1){ newGroup.classList.add('main'); }
  else { newGroup.classList.add('sub'); }
  let setFontSize = roomConfig.fontSize[groupNum] || 100;
  newGroup.style.setProperty('--log-fontsize', setFontSize+'%');
  newGroup.innerHTML = `
  <div class="option">
    <i data-value="${setFontSize}">文字サイズ</i>
    <input class="option-fontsize-tab" type="range" min="80" max="120" step="1" value="${setFontSize}" oninput="fontSizeChange(this);">
    <hr>
    <button onclick="boxOpen('config-user','config-font')">フォントの詳細設定を開く</button>
  </div>`;
  if(document.getElementById('tab-group'+(groupNum-1))){
    document.getElementById('tab-group'+(groupNum-1)).after(newGroup);
  }
  else { document.getElementById("chat-area").appendChild(newGroup); }

  let tabList = document.createElement('ul');
  tabList.classList.add('tablist');
  newGroup.appendChild(tabList);
  new Sortable(tabList, {
    group: 'tablist',
    animation: 200,
    onStart: function(evt){
      document.getElementById('tab-add-area').classList.add('view');
    },
    onEnd: function(evt){
      document.getElementById('tab-add-area').classList.remove('view');
    },
    onAdd: function (evt) {
      const tab = document.getElementById(evt.item.dataset.target);
      evt.to.parentNode.append(tab);
      if(tab.classList.contains('view')){
        if(evt.from.parentNode.querySelector('.chat')){
          viewTabChange(evt.from.parentNode.querySelector('.chat').dataset.tab);
        }
      }
      viewTabChange(tab.dataset.tab);
      roomConfig.tab[tab.dataset.tab-1] = evt.to.parentNode.dataset.group;
      saveRoomConfig();
    },
  });
  let deleteButton = document.createElement('span');
  deleteButton.classList.add('button','delete');
  deleteButton.innerHTML = '× タブグループを削除';
  deleteButton.addEventListener('click', () => tabGroupDel(groupNum));
  newGroup.appendChild(deleteButton);

  if(document.querySelector('#tab-add-area li')){
    document.querySelectorAll('#tab-add-area li').forEach(obj => {
      tabList.appendChild(obj);
      const target = document.getElementById(obj.dataset.target);
      target.classList.add('view');
      newGroup.appendChild(target);
    });
  }

  tabQuantityCheck();
  
  return newGroup;
}
new Sortable(document.getElementById('tab-add-area'), {
  group: 'tablist',
  animation: 200,
  onStart: function(evt){
  },
  onEnd: function(evt){
  },
  onAdd: function (evt) {
    const tab = document.getElementById(evt.item.dataset.target);
    roomConfig.tab[tab.dataset.tab - 1] = tabGroupAdd();
    saveRoomConfig();
  },
});
// タブグループ削除
function tabGroupDel(num){
  if(document.getElementById('tab-group'+num)){
    if(document.querySelector(`#tab-group${num} logs`)){
      alert('タブグループ内にタブが残っています');
    }
    else {
      document.getElementById('tab-group'+num).remove();
    }
  }
  if(!document.querySelector(`.tab-group.main`)){
    if(document.querySelector(`.chat.view`)){
      const obj = document.querySelector(`.chat.view`);
      num = obj.parentNode.dataset.group;
      mainTabChange(num);
    }
  }
  tabQuantityCheck();
}
function tabQuantityCheck(){
  const quantity = document.querySelectorAll('.tab-group').length;
  const chatArea = document.getElementById('chat-area');
  chatArea.dataset.quantity = quantity;
}
// タブ追加
let tabnameToNum = {};
function tabAdd(tabNum){
  if(document.getElementById('chat-tab'+tabNum)){
    console.log(tabList[tabNum])
    document.getElementById('tablist-tab'+tabNum).innerHTML = tabList[tabNum];
    return;
  }
  let newTab = document.createElement('div');
  newTab.setAttribute("id",'chat-tab'+tabNum);
  newTab.classList.add('chat');
  newTab.dataset.tab = tabNum;
  newTab.innerHTML = `
    <div class="logs logs-font" id="chat-logs-tab${tabNum}" data-unread="0" onscroll="bottomCheck(${tabNum},this);"></div>
    <div class="input-form ${roomConfig.selectedAddress[tabNum]?'secret':''}  ${roomConfig.checkedOpenLater[tabNum]?'openlater':''}">
      <div class="comm-config-area">
        <div><select
          id="form-name-tab${tabNum}"
          class="form-name chara-name bold"
          style="color:${nameList[ roomConfig.selectedName[tabNum]||0 ]?.color}"
          onchange="nameChangeSub(${tabNum})">
            <option value="${roomConfig.selectedName[tabNum]||0}"></option>
        </select></div>
        <div class="address-area">
          <select id="form-address-tab${tabNum}" title="発言送信先" onchange="changeAddress(${tabNum})">
          <option value="${roomConfig.selectedAddress[tabNum]}"></option>
          </select>
          <label for="secret-openlater-tab${tabNum}" title="チェックを入れると、過去ログになった時には公開されます。">
            <input
              type="checkbox"
              id="secret-openlater-tab${tabNum}"
              ${roomConfig.checkedOpenLater[tabNum]?'checked':''}
              ${roomConfig.selectedAddress[tabNum]?'':'disabled'}
              onchange="changeAddress(${tabNum})"
            >
            <b>後で公開</b>
          </label>
        </div>
      </div>
      <div class="comm-area">
        <textarea type="text" class="form-comm autosize" id="form-comm-tab${tabNum}" rows="1" placeholder="Shift+Enterで改行"></textarea>
        <button onclick="formSubmit('form-comm-tab${tabNum}');">送信</button>
      </div>
    </div>
    <div class="notice-unread" onclick="scrollBottom('${tabNum}');" data-unread="0">▼新着発言</div>
    `;
  let targetGroup;
  if(window.matchMedia('(min-width:601px)').matches && roomConfig.tab && roomConfig.tab[tabNum-1]){
    targetGroup = roomConfig.tab[tabNum-1];
    if(!document.getElementById("tab-group"+targetGroup)){ targetGroup = tabGroupAdd(targetGroup); }
    else { targetGroup = document.getElementById("tab-group"+targetGroup) }
  }
  else {
    let maxGroup = 3;
    if(window.matchMedia('(max-width:600px)').matches){ maxGroup = 1 }
    let targetGroupNum = 1;
    while (targetGroupNum <= maxGroup) {
      if(!document.getElementById("tab-group"+maxGroup)){ targetGroup = tabGroupAdd(); break; }
      targetGroupNum++;
    }
    targetGroup ||= document.getElementById("tab-group"+maxGroup);
  }
  
  targetGroup.appendChild(newTab);
  autosize(document.getElementById('form-comm-tab'+tabNum));
  
  let newList = document.createElement('li');
  newList.setAttribute("id",'tablist-tab'+tabNum);
  newList.addEventListener("click",(e)=>{ viewTabChange(tabNum) });
  newList.dataset.target = 'chat-tab'+tabNum;
  newList.dataset.unread = 0;
  newList.innerHTML = tabList[tabNum];
  targetGroup.querySelector(".tablist").appendChild(newList);
  
  tabnameToNum[tabList[tabNum]] = tabNum;
  oldLogs[tabNum] = [];

  viewTabChange(tabNum);
  
  //着信SEタブに追加
  let newTr = document.createElement('tr');
  newTr.innerHTML = `
    <th>タブ${tabNum} 着信<br><small>(${tabList[tabNum]})</small></th>
    <td><select id="option-se-chat${tabNum}" oninput="seTypeChange(this,'chat',${tabNum})">${chatTypeOptions}</select></td>`;
  document.getElementById("option-se-tabs").appendChild(newTr);
  document.getElementById('option-se-chat'+tabNum).value = config.seType['chat'+tabNum] || defSeType['chat'];
}
// タブ切り替え
function viewTabChange(num){
  const thisTab = document.getElementById('chat-tab'+num);
  const tabs = thisTab.parentNode.querySelectorAll('.box .chat');
  const list = thisTab.parentNode.querySelectorAll('.tablist li');
  
  tabs.forEach(obj => { obj.classList.remove('view'); });
  thisTab.classList.add('view');
  
  list.forEach(obj => { obj.classList.remove('bold'); });
  document.getElementById('tablist-tab'+num).classList.add('bold');

  if(thisTab.parentNode.classList.contains('main')){
    mainTab = Number(num);
  }
  scrollBottom(num);
}
function mainTabChange(num){
  console.log(`mainTabChange(${num})`);
  const thisGroup = document.getElementById('chat-tab'+num).parentNode;
  document.querySelectorAll('#chat-area .tab-group').forEach(obj => {
    obj.classList.remove('main');
    obj.classList.add('sub');
  });
  thisGroup.classList.remove('sub');
  thisGroup.classList.add('main');
  document.getElementById('chat-area').prepend(thisGroup);
  document.getElementById('chat-area').prepend(document.getElementById('tab-add-area'));
  scrollBottom(mainTab);
  viewTabChange(num);
}
function tabToggle(num){
  const chatTab = document.getElementById('chat-tab'+num);
  chatTab.classList.toggle('close');
}

// ルーム設定のselectにセット
function tabOptionSet(){
  let options = '<option value="" disabled selected>対象のタブ';
  for(const key in tabList){ options += '<option>'+tabList[key]; }

  document.getElementById("tab-rename-list").innerHTML = options;
  document.getElementById("tab-delete-list").innerHTML = options;
}

// 強調ワード編集 ----------------------------------------
function markNameToggle(){
  if(document.getElementById('mark-name-check').checked){ config.markName = 1; }
  else { config.markName = 0; }
  saveCommonConfig();
}
function markListChange(){
  const obj = document.getElementById('mark-list-value');
  config.markList = obj.value.split("\n");
  saveCommonConfig();
}
function exceptListChange(){
  const obj = document.getElementById('except-list-value');
  config.exceptList = obj.value.split("\n");
  saveCommonConfig();
}
function configMarkSet(){ 
  if(config.markName == 1) { document.getElementById('mark-name-check').checked = true; }
  document.getElementById('mark-list-value').value = config.markList.join("\n");
  autosizeUpdate(document.getElementById('mark-list-value'));
  document.getElementById('except-list-value').value = config.exceptList.join("\n"); 
  autosizeUpdate(document.getElementById('except-list-value'));
}

// タグ挿入 ----------------------------------------
const formCommMain = document.getElementById('form-comm-main');
function tagInsert (e, left, right, caret){
  const target = document.getElementById(e.target.dataset.target);
  let selection = {};
  selection.start = target.selectionStart;
  selection.end   = target.selectionEnd;
  let allText = target.value;
  const selected = allText.slice(selection.start, selection.end);
  const before = allText.slice(0, selection.start);
  const after  = allText.slice(selection.end);
  
  target.value = before + left + selected + right + after;
  target.focus();
  caret ||= 0;
  if(caret > 0){
    target.selectionStart = (before + left + selected).length + caret;
    target.selectionEnd   = (before + left + selected).length + caret;
  }
  else if(caret < 0){
    target.selectionStart = (before + left).length + caret;
    target.selectionEnd   = (before + left).length + caret;
  }
  else {
    target.selectionStart = (before + left).length + caret;
    target.selectionEnd   = (before + left + selected).length + caret;
  }
  autosizeUpdate(formCommMain);
}
document.querySelectorAll('.insert-ruby').forEach(obj => { obj.addEventListener('click', (e)=>{
  tagInsert(e, '<ruby>','<rt></ruby>',4)
}); });
document.querySelectorAll('.insert-em').forEach(obj => { obj.addEventListener('click', (e)=>{
  tagInsert(e, '<em>','</em>')
}); });
document.querySelectorAll('.insert-serif').forEach(obj => { obj.addEventListener('click', (e)=>{
  tagInsert(e, '<mi>','</mi>')
}); });
document.querySelectorAll('.insert-hide').forEach(obj => { obj.addEventListener('click', (e)=>{
  tagInsert(e, '<hide>','</hide>')
}); });
document.querySelectorAll('.insert-bold').forEach(obj => { obj.addEventListener('click', (e)=>{
  tagInsert(e, '<b>','</b>')
}); });
document.querySelectorAll('.insert-oblique').forEach(obj => { obj.addEventListener('click', (e)=>{
  tagInsert(e, '<i>','</i>')
}); });
document.querySelectorAll('.insert-strike').forEach(obj => { obj.addEventListener('click', (e)=>{
  tagInsert(e, '<s>','</s>')
}); });
document.querySelectorAll('.insert-under').forEach(obj => { obj.addEventListener('click', (e)=>{
  tagInsert(e, '<u>','</u>')
}); });
document.querySelectorAll('.insert-color').forEach(obj => { obj.addEventListener('click', (e)=>{
  tagInsert(e, '<c:orange>','</c>',-1)
}); });
document.querySelectorAll('.insert-big').forEach(obj => { obj.addEventListener('click', (e)=>{
  tagInsert(e, '<big>','</big>')
}); });
document.querySelectorAll('.insert-small').forEach(obj => { obj.addEventListener('click', (e)=>{
  tagInsert(e, '<small>','</small>')
}); });
document.querySelectorAll('.insert-horizon').forEach(obj => { obj.addEventListener('click', (e)=>{
  tagInsert(e, '<hr>','')
}); });
document.querySelectorAll('.insert-left').forEach(obj => { obj.addEventListener('click', (e)=>{
  tagInsert(e, '<left>','</left>')
}); });
document.querySelectorAll('.insert-center').forEach(obj => { obj.addEventListener('click', (e)=>{
  tagInsert(e, '<center>','</center>')
}); });
document.querySelectorAll('.insert-right').forEach(obj => { obj.addEventListener('click', (e)=>{
  tagInsert(e, '<right>','</right>')
}); });
document.querySelectorAll('.insert-add-line-spacing').forEach(obj => { obj.addEventListener('click', (e)=>{
  tagInsert(e, '<add-line-spacing>','</add-line-spacing>')
}); });
document.querySelectorAll('.insert-headline select').forEach(obj => { obj.addEventListener('input', (e)=>{
  const lv = e.target.value;
  if(!lv){ return; }
  tagInsert(e, `<h${lv}>`,`</h${lv}>`)
  e.target.value = '';
}); });

// 音量調節 ----------------------------------------
function configVolumeSet(){
  for (let v of ['bgm','chat','mark','ready']){
    config.volumes[v] ||= localStorage.getItem('volume-'+v) || 100;
    document.getElementById('volume-'+v).value             = config.volumes[v];
    document.getElementById('volume-'+v+'-view').innerHTML = config.volumes[v] + '%';
  }
  config.volumes['master'] ||= 80;
  document.getElementById('volume-master').value          = config.volumes['master'];
  document.getElementById('volume-master-view').innerHTML = config.volumes['master'] + '%';
}
document.querySelectorAll('#config-sound input[type="range"]').forEach(obj => {
  obj.addEventListener('change', e => {
    const obj = e.target;
    const type = obj.dataset.type;
    config.volumes[type] = obj.value;
    document.getElementById(obj.id+'-view').innerHTML = obj.value+'%';
    if(type === 'bgm' || type === 'master') {
      bgmVolumeSet();
    }
    else if(type !== 'master') {
      const se = new Audio( type == 'chat' ? (config.seType['chat1']||defSeType['chat']) : config.seType[type] );
      se.volume = (obj.value / 100) * (config.volumes['master'] / 100);
      se.currentTime = 0;
      se.play();
    }
    saveCommonConfig();
  });
});

function bgmVolumeSet(){
  const vol = (currentBgm['vol'] / 100) * (config.volumes['bgm'] / 100) * (config.volumes['master'] / 100);
  bgMusic.volume = vol;
  ytPlayer.setVolume(Math.round(vol*100));
}

// 着信SE ----------------------------------------
function seTypeChange(obj,name,num){
  let se;
  if(name === 'chat'){
    config.seType[name+num] = obj.value;
    se = new Audio(config.seType[name+num]);
  }
  else {
    config.seType[name] = obj.value;
    se = new Audio(config.seType[name]);
  }
  se.volume = (config.volumes[name] / 100) * (config.volumes['master'] / 100);
  se.currentTime = 0;
  se.play();
  saveCommonConfig();
}
function configSeTypeSet(){
  Object.keys(config.seType).forEach(key => {
    if(document.getElementById('option-se-'+key)){
      document.getElementById('option-se-'+key).value = config.seType[key] || defSeType[key];
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
  if ( url.match(/^https?:\/\/(?:www\.)?youtube\.com\/watch\?(?:.*?)v=(.+?)(?:&|$)/)
    || url.match(/^https?:\/\/youtu\.be\/(.+)$/)
  ){
    playerA.style.display = 'none';
    playerY.style.display = '';
    audioPreview.pause();
    ytPreview.loadVideoById(RegExp.$1);
  }
  else {
    url = resolveGoogleDriveAssetUrl(url);
    console.log(url);
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
  const vol = ((v || 100) / 100) * (config.volumes['bgm'] / 100) * (config.volumes['master'] / 100)
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
  let url = document.getElementById('bg-set-url').value;
  url = resolveGoogleDriveAssetUrl(url);
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
function bgInputSet(url, title, mode = null){
  document.getElementById('bg-set-preview').src = url;
  document.getElementById('bg-set-url').value = url;
  document.getElementById('bg-set-title').value = title;
  document.getElementsByName('background-fill-mode').forEach(x => x.checked = false);
  const modeButton = document.querySelector(`[name="background-fill-mode"][value="${mode}"]`);
  if (modeButton != null) {
    modeButton.checked = true;
  } else {
    document.querySelector('[name="background-fill-mode"][value="resize"]').checked = true;
  }
}

// 挿絵 ----------------------------------------
function imgPreview(){
  let url = document.getElementById('image-insert-url').value;
  url = resolveGoogleDriveAssetUrl(url);
  document.getElementById('image-insert-preview').src = url;
}
function imgView(url){
  document.getElementById('image-box-image').src = url;
  document.getElementById('image-box').showModal();
}

document.getElementById('chat-area').addEventListener("click",(e) => {
  if (e.target.closest('dd img.insert')) {
    imgView(e.target.src)
  }
  if (e.target.closest('dd .chara-image') || e.target.closest('dd .insert.bg')) {
    imgView( e.target.style.backgroundImage.replace(/^url\("?/,'').replace(/"?\)$/,'') );
  }
});

document.getElementById('image-box').addEventListener("click",(e) => {
  document.getElementById('image-box').close();
  document.getElementById('image-box-image').src = '';
});


// キー動作 ----------------------------------------
document.onkeydown = function(e){
  if ((e.ctrlKey && !e.metaKey) || (!e.ctrlKey && e.metaKey)) {
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
          if(config.subFormBehavior[type] === 'copy'){
            document.getElementById("form-comm-main").value = document.getElementById(e.target.id).value;
            document.getElementById("form-comm-main").focus();
          }
          else if(config.subFormBehavior[type] === 'add'){
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
      if(!e.target.value && beforeComm[e.target.id] && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        e.target.value = beforeComm[e.target.id];
        autosizeUpdate(e.target);
      }
    }
  }
}

function statusListSave(){
  roomConfig.statusList = Array.from(document.getElementById('status-body').children).map(obj => obj.dataset.name );
  saveRoomConfig();
}

//  ----------------------------------------
function gameChange(game){
  document.getElementById('config-room-bcdice-options').style.display = (game == 'bcdice') ? 'block' : 'none';
  const status = document.getElementById('config-room-status');
  if     (game == 'sw2'){ status.value = 'HP　MP　防護'; }
  else if(game == 'dx3'){ status.value = 'HP　侵蝕　行動'; }
  else                  { status.value = 'HP　MP　他'; }
}

// ソート ----------------------------------------
const sortableStatus = new Sortable(document.getElementById('status-body'), {
  handle: "dt[onclick]",
  animation: 200,
  onUpdate: function (evt) { statusListSave(); },
});
const sortableMemo = new Sortable(document.getElementById('memo-list'), {
  animation: 200,
});

// ヘルプ内検索 ----------------------------------------
(function(){
  const helpWindow = document.getElementById('help-window');
  const searchTextField = helpWindow.querySelector('.search-form input[type="text"]');
  const buttonToClear = helpWindow.querySelector('.search-form button.to-clear');

  const normalizeText = (function () {
    const cache = {};
    return function normalizeText(text) {
      if (text in cache) {
        return cache[text];
      }
      const normalized = toHalfWidth(text).toLowerCase();
      cache[text] = normalized;
      return normalized;
    };
  })();

  searchTextField.addEventListener(
    'input',
    function () {
      const searchText = normalizeText(searchTextField.value);
      
      const searchModeClassName = 'search-mode';
      if (searchText === '') {
        helpWindow.classList.remove(searchModeClassName);
        return;
      }
      helpWindow.classList.add(searchModeClassName);

      const searchMatchingClassName = 'search-matched';
      const searchMatchingContainerClassName = 'contains-search-matched';
      
      helpWindow.querySelectorAll(`.box-body .${searchMatchingClassName}`).forEach(obj => {
        obj.classList.remove(searchMatchingClassName);
      });
      helpWindow.querySelectorAll(`.box-body .${searchMatchingContainerClassName}`).forEach(obj => {
        obj.classList.remove(searchMatchingContainerClassName);
      });

      const excludeContainerNodeTypes = ['THEAD', 'TBODY', 'TFOOT', 'TR', 'UL', 'OL', 'DL'];
      helpWindow.querySelectorAll('.box-body details').forEach(details => {
        details.querySelectorAll('summary, p, th, td, dt, dd, h3, h4, h5, h6').forEach(
          function (node) {
            const nodeText = normalizeText(node.textContent);

            if (!nodeText.includes(searchText)) {
              return;
            }

            node.classList.add(searchMatchingClassName);
                
            {
              let current = node.parentNode;
              while (
                  !current.classList.contains('box-body') &&
                  !current.classList.contains(searchMatchingClassName) &&
                  !current.classList.contains(searchMatchingContainerClassName)
              ) {
                if (!excludeContainerNodeTypes.includes(current.nodeName)) {
                  current.classList.add(searchMatchingContainerClassName);
                  if (current.nodeName === 'DETAILS') {
                    current.setAttribute('open', '');
                  }
                }
                current = current.parentNode;
              }
            }
          }
        );
      });
    }
  );

  buttonToClear.addEventListener(
    'click',
    function () {
      searchTextField.value = "";
      searchTextField.dispatchEvent(new Event('input'));
    }
  );
})();

// フロートボックス・ドラッグ移動 ----------------------------------------
document.querySelectorAll('.float-box > h2').forEach(obj => {
  const box = obj.parentNode;
  let initX, initY, firstX, firstY;
  obj.addEventListener('mousedown', function(e) {
    e.preventDefault();
    initX = box.offsetLeft;
    initY = box.offsetTop;
    firstX = e.pageX;
    firstY = e.pageY;
  
    window.addEventListener('mousemove', dragIt, false);
  
    window.addEventListener('mouseup', function() {
      window.removeEventListener('mousemove', dragIt, false);
    }, false);
  
  }, false);

  obj.addEventListener('touchstart', function(e) {
  
    e.preventDefault();
    initX = box.offsetLeft;
    initY = box.offsetTop;
    let touch = e.touches;
    firstX = touch[0].pageX;
    firstY = touch[0].pageY;
  
    window.addEventListener('touchmove', swipeIt, false);
  
    window.addEventListener('touchend', function(e) {
      e.preventDefault();
      window.removeEventListener('touchmove', swipeIt, false);
    }, false);
  
  }, false);
  
  function dragIt(e) {
    box.style.left = initX+e.pageX-firstX + 'px';
    box.style.top = initY+e.pageY-firstY + 'px';
    box.style.bottom = 'auto';
    box.style.right = 'auto';
  }

  function swipeIt(e) {
    const contact = e.touches;
    box.style.left = initX+contact[0].pageX-firstX + 'px';
    box.style.top = initY+contact[0].pageY-firstY + 'px';
    box.style.bottom = 'auto';
    box.style.right = 'auto';
  }
});

// スマホ用 ----------------------------------------
window.addEventListener('resize', () => {
  if(window.matchMedia('(max-width:600px)').matches){
    scrollBottom(mainTab);
  }
});


// ツールチップ ----------------------------------------
function tooltipHover(event){
  const obj = event.target.classList.contains('tooltip') ? event.target : event.target.closest('.tooltip');
  const child = obj.querySelector('.tooltip-text');

  let left = event.clientX - child.offsetWidth / 2;
  if(left < 1){ left = 1 }
  child.style.top = `calc(${event.clientY - child.offsetHeight}px - 1.5em)`;
  child.style.left = (left) + 'px';

  if (child.getBoundingClientRect().right > window.innerWidth) {
    child.style.left = Math.max((left - (child.getBoundingClientRect().right - window.innerWidth)), 1) + 'px';
  }
}
