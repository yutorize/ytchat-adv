"use strict";
// UI
// ------------------------------

//window.onload = function() {
//  scrollBottom('chat-logs-tab1');
//  scrollBottom('chat-logs-tab2');
//};

// チャットログを最下部まで
function scrollBottom(objId){
  const obj = document.getElementById(objId);
  obj.scrollTop = obj.scrollHeight;
}
// ログのスクロール位置を確認
function scrollCheck(objId){
  const obj = document.getElementById(objId);
  const bottom = obj.scrollHeight - obj.clientHeight;
  if (bottom - 100 <= obj.scrollTop) {
    return 1;
  }
}
// 入力欄拡張
autosize(document.querySelector('.autosize'));

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
  document.getElementById(id).style.transform = 'scaleY(1)';
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
  autosize($('#edit-topic-value'));
}
// NPCの開閉・保存
  //開く
function npcOpen(){
  boxOpen('edit-npc');
  let npcValue = '';
  for(let key in nameList){
    if (key == 0) continue;
    npcValue += nameList[key]['name']+'<>'+(nameList[key]['color']?nameList[key]['color']:'')+"\n";
  }
  document.getElementById('edit-npc-value').value = npcValue;
  autosize($('#edit-npc-value'));
}
  //保存
function npcSave(){
  const lines = document.getElementById('edit-npc-value').value.split(/\n/g);
  let newList = {
    0 : { 'name': nameList[0]['name'], 'color': nameList[0]['color'] }
  };
  for(let i=0; i<lines.length; i++){
    const data = lines[i].split(/<>|＜＞/g);
    if(!data[0]){ continue }
    newList[i+1] = {};
    newList[i+1]['name'] = data[0];
    newList[i+1]['color'] = data[1]?data[1]:'#FFFFFF';
  }
  nameList = newList;
  npcBoxSet();
  localStorage.setItem(roomId+'-name', JSON.stringify(nameList));
}
// セレクトボックスにセット
function npcBoxSet(){
  const select = document.getElementById('form-name');
  const nowSelectName = select.options[select.selectedIndex].text;
  let nowSelectValue = 0;
  while (0 < select.childNodes.length) {
    select.removeChild(select.childNodes[0]);
  }
  for(let key in nameList){
    let op = document.createElement("option");
    op.text = nameList[key]['name'];
    op.value = key;
    op.style.color = nameList[key]['color'];
    select.appendChild(op);
    if(nowSelectName === nameList[key]['name']) nowSelectValue = key;
  }
    
  $("#form-name").val(nowSelectValue);
}
// 名前変更
$("#form-name").change(function(){
  const num = $(this).val();
  document.getElementById('form-color').value = nameList[num]['color'];
  document.getElementById('form-color-text').value = nameList[num]['color'];
});
// 色変更
$("#form-color").change(function(){
  const color = $(this).val();
  document.getElementById('form-color-text').value = color;
  nameColorChange(color);
});
$("#form-color-text").change(function(){
  const color = $(this).val();
  document.getElementById('form-color').value = color;
  nameColorChange(color);
});
function nameColorChange(color){
  const num = document.getElementById('form-name').value;
  nameList[num]['color'] = color;
  $("#form-name option[value="+num+"]").css('color', color);
  localStorage.setItem(roomId+'-name', JSON.stringify(nameList));
}
// ユニット作成の色変更
$("#new-unit-color-value").change(function(){
  const color = $(this).val();
  document.getElementById('new-unit-color-value-text').value = color;
});
$("#new-unit-color-value-text").change(function(){
  const color = $(this).val();
  document.getElementById('new-unit-color-value').value = color;
});

// ユニット追加
function unitAdd(unitName){
  const unitId = randomId(8);
  unitList[unitName]['id'] = unitId;
  let newUnit = document.createElement('dl');
  newUnit.setAttribute("id",'stt-unit-'+unitId);
  newUnit.innerHTML = '<dt onclick="sheetSelect(\''+unitId+'\');sheetOpen();" style="color:'+unitList[unitName]['color']+';"><b class="check" id="stt-'+unitId+'-check"></b>'+unitName+'</dt>';
  if(unitList[unitName]['status'] === undefined) { unitList[unitName]['status'] = {}; }
  for(let i in setStatus) {
    newUnit.innerHTML += `<dd id="stt-${unitId}-${setStatus[i]}" style="display:${unitList[unitName]['status'][setStatus[i]] ? 'block' : 'none'}">${setStatus[i]}: <span id="stt-${unitId}-${setStatus[i]}-value">${unitList[unitName]['status'][setStatus[i]]}</span></dd>`;
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
          <button>データ読込</button>
        </p>
        <div class="status-remocon-area">
          <h3>ステータスリモコン</h3>
          <select>
          <option id="stt-calc-on-${unitId}">入力内容によって計算/部分更新する</option>
          <option>入力内容そのままで更新する</option>
          </select>
          <ul>${statusRemoconArea}
            <li class="dice-button half">
              <button onclick="commSend('@check',0,'${unitNameEscaped}','${unitList[unitName]['color']}');">✔</button><input type="text" value="@check" readonly>
            </li>
            <li class="dice-button half">
              <button onclick="commSend('@cancel',0,'${unitNameEscaped}','${unitList[unitName]['color']}');">×</button><input type="text" value="@cancel" readonly>
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
        <textarea id="memo-unit-${unitId}" class="autosize" placeholder="メモ" rows="2"></textarea>
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
function paletteEditOpen(id){
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
function paletteEditSave(id){
  document.getElementById('chat-palette-unit-'+id).style.display = 'block';
  document.getElementById('chat-palette-edit-unit-'+id).style.display = 'none';
  document.getElementById('chat-palette-button-open-unit-'+id).style.display = 'block';
  document.getElementById('chat-palette-button-save-unit-'+id).style.display = 'none';
  
  const lines = document.getElementById('chat-palette-edit-unit-'+id).value.split(/\n/g);
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

// タブ追加
function tabAdd (tabNum){
  let newTab = document.createElement('div');
  newTab.setAttribute("id",'chat-tab'+tabNum);
  newTab.classList.add('box','chat');
  if(mainTab == tabNum){ newTab.classList.add('main'); } else { newTab.classList.add('sub'); }
  newTab.dataset.tab = tabNum;
  newTab.innerHTML = '<h2><label><input type="radio" id="check-maintab-tab'+tabNum+'" name="check-maintab" value="'+tabNum+'"'+(mainTab == tabNum ? 'checked':'')+'><span>'+tabList[tabNum]+'</span></label></h2>'
    + '<div class="logs" id="chat-logs-tab'+tabNum+'"></div>'
    + '<div class="input-form"><div class="comm-area">'
    + '<textarea type="text" class="form-comm autosize" id="form-comm-tab'+tabNum+'" rows="1" placeholder="Shift+Enterで改行"></textarea>'
    + '<button onclick="formSubmit(\'form-comm-tab'+tabNum+'\');">送信</button>'
    + '</div></div>'
    + '<div class="option"><input class="option-fontsize-tab" type="range" min="80" max="120" step="1" value="100"></div>'
    + '<span class="close button">×</span>';
  document.getElementById("chat-area").appendChild(newTab);
  autosize(document.getElementById('form-comm-tab'+tabNum));
}
// メインタブの切り替え
$(function($){
  $(document).on("change", 'input[name="check-maintab"]:radio', function(e) {
    const num = $(e.target).val();
    const thisTab = document.getElementById('chat-tab'+num);
    const tabs = document.querySelectorAll('.box.chat');
    
    if(thisTab.classList.contains('close')) {
      $("#chat-area").append($(thisTab));
      thisTab.classList.add('sub');
      thisTab.classList.remove('close');
      document.getElementById('check-maintab-tab'+num).checked = false;
      scrollBottom('chat-logs-tab'+thisTab.dataset.tab);
    }
    else {
      for(let i=0; i<tabs.length; i++){
        tabs[i].classList.remove('main');
        tabs[i].classList.add('sub');
      }
      thisTab.classList.add('main');
      thisTab.classList.remove('sub','close');
    }
    
    for(let i=0; i<tabs.length; i++){
      scrollBottom('chat-logs-tab'+tabs[i].dataset.tab);
    }
    
    mainTab = num;
  });
  
  // タブ開閉
  $(document).on("click", '.chat .close.button', function(e) {
    const num = e.target.closest('.chat').dataset.tab;
    
    document.getElementById('chat-tab'+num).classList.add('close');
    document.getElementById('chat-tab'+num).classList.remove('main','sub');
    document.getElementById('check-maintab-tab'+num).checked = false;
    $("#chat-closes-area").append($("#chat-tab"+num));

    if(mainTab == num){ mainTab = 0 }
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


// jquery ui
$(function(){
  // ソート
  $('#status-body').sortable({handle:'dt'});
  $('#chat-area').sortable({handle:'h2'});
  // ドラッグ移動
  $('.float-box').draggable();
});
