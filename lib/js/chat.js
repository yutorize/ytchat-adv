"use strict";
// CHAT
// ------------------------------
const cgiPath = './index.cgi';
let numPath;
let logKey;
let lastnumber = 0;
let userId;
let romMode = 0;
let mainTab = 1;
let tabList = {};
let nameList = [];
let unitList = {};
let chatPalettes = {};
let sheetMemos = {};
let selectedSheet = '';
let shareMemo = [];
let beforeComm = {};

// ロード時処理
window.onload = function(){
  // keyをチェック
  $.ajax({
    url: './room/'+roomId+'/log-key.dat',
    type: 'GET',
    cache: false,
    timeout: 10000,
    dataType: 'text',
  })
  .done( (data) => {
    //key取得後処理
    logKey = data;
    const savedName = localStorage.getItem(roomId+'-name'); //保存済みの名前取得
    userId = localStorage.getItem('userid'); //ユーザーID取得
    if(!userId){
      userId = randomId(7); //ランダムユーザーID付与
      localStorage.setItem('userid', userId);
    }
    if(savedName){
      nameList = JSON.parse(savedName);
      document.getElementById('in-name').value       = nameList[0]['name'];
      document.getElementById('in-color').value      = nameList[0]['color'];
      document.getElementById('in-color-text').value = nameList[0]['color'];
    }
    const savedMarkList  = JSON.parse(localStorage.getItem('markList'));
    markList     = savedMarkList  ? savedMarkList  : [];
    document.getElementById('mark-list-value').value = markList.join("\n");
    //入室済み
    if(savedName && logKey === localStorage.getItem(roomId+'-logKey')){
      if(nameList[0]){
        document.getElementById('form-color').value      = nameList[0]['color'];
        document.getElementById('form-color-text').value = nameList[0]['color'];
        const savedPalette   = JSON.parse(localStorage.getItem(roomId+'-palette'));
        const savedSheetMemo = JSON.parse(localStorage.getItem(roomId+'-sheetMemo'));
        const savedDiceForm  = JSON.parse(localStorage.getItem(roomId+'-diceForm'));
        chatPalettes = savedPalette   ? savedPalette   : {};
        sheetMemos   = savedSheetMemo ? savedSheetMemo : {};
        diceForms    = savedDiceForm  ? savedDiceForm  : [];
        roomLoad();
      }
    }
    //入室してない
    else {
      boxOpen('enter-form');
    }
  })
  .fail( (data) => { return; })
  .always( (data) => {  });
  // 音量セット
  volumeSet();
}
// 入室
function enterRoom() {
  const name = document.getElementById('in-name').value;
  let color = document.getElementById('in-color').value;
  if(name === ''){ return alert('名前が入力されていません'); }
  color = color ? color : '#FFFFFF';
  $.ajax({
    url: cgiPath,
    type: 'POST',
    cache: false,
    timeout: 10000,
    dataType: 'json',
    data: {
      'mode': 'write',
      'tab' : mainTab,
      'room': roomId,
      'logKey' : logKey,
      'player': name,
      'system': 'enter',
      'unitAdd' : document.getElementById('in-unitadd').checked ? 1 : 0,
      'color' : color,
      'userId': userId
    }
  })
  .done( (data) => {
    console.log('入室:'+name);
    if(data['status'] === 'ok'){
      nameList[0] = { 'name': name, 'color': color };
      localStorage.setItem(roomId+'-name', JSON.stringify(nameList));
      localStorage.setItem(roomId+'-logKey', logKey);
      boxClose('enter-form');
      roomLoad();
    }
    else {
      alert('入室に失敗しました。リロードが必要な可能性があります。');
    }
  })
  .fail( (data) => {
    alert('入室に失敗');
  });
}
// 見学入室
function enterRomRoom() {
  romMode = 1;
  document.body.classList.add('rom');
  boxClose('enter-form');
  roomLoad();
}
// 退室
function exitRoom() {
  if(romMode){ location.href = './'; return; } // 見学ちゃんは移動で済ます
  const name = nameList[0]['name'];
  if(name === ''){ return console.log('名前がありません'); }
  $.ajax({
    url: cgiPath,
    type: 'POST',
    cache: false,
    timeout: 10000,
    dataType: 'json',
    data: {
      'mode': 'write',
      'tab' : mainTab,
      'room': roomId,
      'logKey' : logKey,
      'player': name,
      'system': 'exit',
      'color' : "#FFFFFF",
      'userId': userId
    }
  })
  .done( (data) => {
    console.log('退室:'+name);
    localStorage.removeItem(roomId+'-logKey');
    location.href = './';
  })
  .fail( (data) => {
    alert('退室に失敗');
  });
}

// 部屋情報取得
function roomLoad(){
  $.ajax({
    url: './room/'+ roomId +'/room.dat',
    type: 'GET',
    cache: false,
    timeout: 10000,
    dataType: 'json',
  })
  .done( (data) => {
    //
    numPath = './room/'+ roomId +'/log-num-'+logKey+'.dat';
    //タブ取得
    tabList = data['tab'];
    for (let key in tabList) {
      tabAdd(key);
    }
    //トピック取得
    topicChange(data['topic'])
    //ユニット取得
    unitList = data['unit'] ? data['unit'] : {};
    for (let key in unitList) {
      unitAdd(key);
    }
    if(window.matchMedia('(max-width:1024px)').matches){ sheetClose(); }
    statusUpdate();
    //共有メモ取得
    shareMemo = data['memo'] ? data['memo'] : [];
    memoUpdate();
    //見学でない
    if(!romMode){
      //ユニット
      if(unitList[nameList[0]['name']]){ sheetSelect(unitList[nameList[0]['name']]['id']); }
      else { sheetSelect('default'); }
      //ダイス
      const diceNum = diceForms.length ? diceForms.length : 6;
      [...Array(diceNum)].map(() => diceAdd());
      diceLoad();
      //名前欄項目作成
      npcBoxSet();
      document.getElementById('main-name1').innerHTML   = nameList[0]['name'];
      document.getElementById('main-name1').style.color = nameList[0]['color'];
    }
    //
    document.getElementById('dark-back').style.display = 'none';
    //
    logCheck();
    if(bcdiceAPI){ bcdiceSystemInfo(); }
  })
  .fail( (data) => {
    alert('部屋データのロードに失敗');
  });
}

// 更新チェック
function logCheck() {
  $.ajax({
    url: numPath,
    type: 'GET',
    cache: false,
    timeout: 10000,
    dataType: 'text',
  })
  .done( (data) => {
    if(data != lastnumber){
      logGet();
    }
  })
  .fail( (jqXHR, textStatus, errorThrown) => {
    console.log('更新のチェックに失敗');
    console.log("jqXHR       : " + jqXHR.status); // HTTPステータスが取得
    console.log("textStatus  : " + textStatus);    // タイムアウト、パースエラー
    console.log("errorThrown : " + errorThrown.message); // 例外情報
    if(jqXHR.status === 404){
      alert('ログがリセットされました。退室してページを再読み込みします。');
      localStorage.removeItem(roomId+'-name');
      location.reload();
    }
  })
  .always( (data) => {
    //console.log(lastnumber);
    setTimeout( function(){logCheck();}, checkTimeMem);
  });
}

// 新規ログ取得
let lock = 0;
let beforeUser = {};
let beforeName = {};
let beforeColor = {};
let tabLogLinage = {};
let beforeLastnumber = 0;
function logGet(){
  if(lock) return 0;
  lock = 1;
  $.ajax({
    url: cgiPath,
    type: 'POST',
    cache: false,
    timeout: 10000,
    dataType: 'json',
    data: {
      'mode': 'read',
      'num': lastnumber,
      'room': roomId,
    }
  })
  .done( (data) => {
    let soundFlag = {};
    data.forEach( (value, index, array) => {
      const scrollOK = scrollCheck(value['tab']); //スクロールするかチェック
      
      const targetTab = document.getElementById("chat-logs-tab"+value['tab']);
      if(beforeUser[value['tab']] !== value['userId'] || beforeName[value['tab']] !== value['name'] || beforeColor[value['tab']] !== value['color']){
        let newLog = document.createElement('dl');
        newLog.dataset.user = value['userName'];
        newLog.dataset.id   = value['userId'];
        if(value['system'] && value['system'].match(/topic|unit-delete|ready/)){
          newLog.classList.add('system','bold');
          newLog.innerHTML = '<dt id="line-'+value['num']+'-name">'+ value['name'] +'</dt>';
        }
        else {
          newLog.innerHTML = '<dt id="line-'+value['num']+'-name" style="color:'+ value['color'] +'">'+ value['name'] +'</dt>';
        }
        targetTab.appendChild(newLog);
      }
      // システム処理
      if(value['system']){
        // TOPIC更新
        if(value['system'] === 'topic') { topicChange(value['info']); }
        // 共有メモ更新
        else if(value['system'].match(/^memo:([0-9]+)$/)) {
          const num = RegExp.$1;
          if(value['info']) { shareMemo[num] = value['info'].replace(/<br>/g, "\n"); } else { shareMemo[num] = ''; }
          value['info'] = '';
          value['comm'] = value['comm'].replace(/^共有メモ\(([0-9]+)\)/, "<button onclick=\"memoSelect("+num+")\">共有メモ($1)</button>");
          memoUpdate();
          if(selectedSheet == "memo" && selectedMemo == num){ memoSelect(num); }
        }
        // ユニット更新
        else if (value['system'] === 'unit'){
          const stts = value['info'].split(/ /);
          for (let i in stts) {
            if (!stts[i].includes(':')) continue;
            const array = stts[i].split(/:/);
            if (!unitList[value['name']]){
              unitList[value['name']] = { 'color': value['color'], 'status': {} };
              unitAdd(value['name']);
            }
            unitList[value['name']]['status'][array[0]] = array[1];
          }
          statusUpdate();
        }
        // チェック更新
        else if (value['system'].match(/^check:(0|1)/)){
          const check = Number(RegExp.$1);
          if (unitList[value['name']]){
            unitList[value['name']]['status']['check'] = check;
            statusUpdate();
          }
        }
        else if (value['system'].match(/^ready|round/)){
          for (let name in unitList) {
            unitList[name]['status']['check'] = '';
          }
          if(value['system'].match(/^ready/)){
             soundFlag['ready'] = 1;
          }
          else if(value['system'].match(/^round/)){
            document.getElementById('round-value').innerHTML = value['info'];
          }
          statusUpdate();
        }
        // 入室時ユニット作成
        else if (value['system'].match(/^enter/) && value['system'].match(/ unit/)){
          if (!unitList[value['userName']]){
            unitList[value['userName']] = { 'color': value['color'], 'status': {} };
            unitAdd(value['userName']);
          }
          statusUpdate();
        }
        // ユニット削除
        else if (value['system'].match(/^unit-delete:(.+)/)){
          const unitName = RegExp.$1;
          if(unitList[unitName]){
            const unitId = unitList[unitName]['id'];
            delete unitList[unitName];
            const ok = unitDelete(unitId);
            if(!ok == 1) {
              value['comm'] = 'ユニット「'+unitName+'」の削除中にエラーが発生しました。';
            }
          }
          else {
            value['comm'] = 'ユニット「'+unitName+'」は存在しないため削除できませんでした。';
          }
        }
        // 退室時ユニット削除
        //else if (value['system'].match(/^exit/)){
        //  console.log(value['userName']);
        //  if (unitList[value['userName']]){
        //    const unitId = unitList[value['userName']]['id'];
        //    delete unitList[value['userName']];
        //    const ok = unitDelete(unitId);
        //  }
        //}
      }
      // ユニット色更新
      if (unitList[value['name']]){
        unitList[value['name']]['color'] = value['color'];
        document.querySelector("#stt-unit-"+unitList[value['name']]['id']+" dt").style.color = value['color'];
        document.querySelector("#sheet-unit-"+unitList[value['name']]['id']+" h2").style.color = value['color'];
      }
      
      // コメント処理
      if(value['comm']){
        [soundFlag['mark'] , value['comm']] = wordMark(value['comm']);
        let newComm = document.createElement('dd');
        newComm.id = 'line-' + value['num'] + '-comm';
        newComm.classList.add('comm');
        newComm.dataset.date = value['date'];
        newComm.innerHTML = value['comm'];
        targetTab.lastElementChild.appendChild(newComm);
        soundFlag['normal'] = 1;
      }
      if(value['info']){
        let newInfo = document.createElement('dd');
        let addClass = 'dice';
        if(value['system']){
          if     (value['system'].match(/^topic/)){ addClass = 'topic'; }
          else if(value['system'].match(/^unit/) ){ addClass = 'unit'; }
          else if(value['system'].match(/^dice:?(.*)$/) ){ addClass = 'dice'; newInfo.dataset.game = RegExp.$1; }
        }
        newInfo.id = 'line-' + value['num'] + '-info';
        newInfo.classList.add('info',addClass);
        newInfo.dataset.date = value['date'];
        if(value['code']){ newInfo.dataset.code = htmlUnEscape(value['code']); }
        newInfo.innerHTML = value['info'];
        targetTab.lastElementChild.appendChild(newInfo);
        soundFlag['normal'] = 1;
      }
      // 指定行数(maxLinage)以上なら古い行を削除
      if (!tabLogLinage[value['tab']]) tabLogLinage[value['tab']] = 0;
      tabLogLinage[value['tab']]++;
      if(tabLogLinage[value['tab']] > maxLinage){
        const dlElement = document.getElementById('chat-logs-tab'+value['tab']).firstElementChild;
        const ddElement = dlElement.firstElementChild.nextElementSibling;
        if (dlElement && ddElement){ dlElement.removeChild(ddElement); }
        if (dlElement && dlElement.childElementCount <= 1){ dlElement.parentNode.removeChild(dlElement); } // 要素数が1つ以下（名前のみ）になったらそれごと削除
      }
      // 最終処理
      beforeUser[value['tab']] = value['userId'];
      beforeName[value['tab']] = value['name'];
      beforeColor[value['tab']] = value['color'];
      if(lastnumber < value['num']){ lastnumber = value['num']; }
      // スクロールする／しないなら未読数追加
      if(scrollOK) {
        scrollBottom(value['tab']);
      }
      else {
        let tabname = document.querySelector('#chat-tab'+value['tab']+' > h2 .tab-name');
        let notice  = document.querySelector('#chat-tab'+value['tab']+' > .notice-unread');
        tabname.dataset.unread = Number(tabname.dataset.unread) + 1;
        notice.dataset.unread  = Number( notice.dataset.unread) + 1;
      }
    });
    // 着信音声
    if(beforeLastnumber && Object.keys(soundFlag).length > 0){
      const master = document.getElementById("volume-master").value / 100;
      if(master > 0){
        let sound; let vol = 0;
        if     (soundFlag['ready']){ sound = readySE; vol = document.getElementById("volume-ready").value; }
        else if(soundFlag['mark'] ){ sound = markSE;  vol = document.getElementById("volume-mark").value; }
        if(vol < 1){
          sound = chatSE;
          vol = document.getElementById("volume-chat").value;
        }
        if(sound && vol > 0){
          const se = sound;
          se.volume = (vol / 100) * master;
          se.currentTime = 0;
          se.play();
        }
      }
    }
    beforeLastnumber = lastnumber;
  })
  .fail( (data) => {
    console.log('新規ログの取得に失敗');
  })
  .always( (data) => {
    lock = 0;
  });
}
// ワード強調処理
let markList = [];
function wordMark (comm){
  let hit = 0;
  comm = comm.replace(nameList[0]['name'], ()=>{ hit = 1; return "<mark>"+nameList[0]['name']+"</mark>"});
  for (let i in markList){
    comm = comm.replace(markList[i], ()=>{ hit = 1; return "<mark>"+markList[i]+"</mark>"});
  }
  
  return [hit,comm];
}

// トピック変更
function topicChange (topicValue){
  document.getElementById("topic-value").innerHTML = topicValue ? topicValue : '';
}
// ステータス表更新
function statusUpdate () {
  for (let name in unitList) {
    const id = unitList[name]['id'];
    for (let i in setStatus) {
      const stt = setStatus[i];
      document.getElementById('stt-'+id+'-'+stt+'-value').innerHTML = unitList[name]['status'][stt];
      // 値が入ってない項目は非表示
      if(unitList[name]['status'][stt] === undefined || unitList[name]['status'][stt] === ''){
        document.getElementById('stt-'+id+'-'+stt).style.display = 'none';
      }
      else {
        document.getElementById('stt-'+id+'-'+stt).style.display = 'block';
      }
    }
    document.getElementById('stt-'+id+'-check').innerHTML = unitList[name]['status']['check'] ? '✔' : '';
  }
}
// ユニット削除
function unitDelete (unitId) {
  let okFlag = 0;
  const sttElement   = document.getElementById(  'stt-unit-'+unitId);
  const sheetElement = document.getElementById('sheet-unit-'+unitId);
  if (sttElement)  { sttElement.parentNode.removeChild(sttElement);     okFlag = 1; }
  if (sheetElement){ sheetElement.parentNode.removeChild(sheetElement); okFlag = 1; }
  
  if(okFlag && selectedSheet === unitId){ sheetSelect('default'); }
  
  return okFlag;
}

// 送信
function commSend(comm,tab,name,color,stt,bcdice){
  if(name === '' || name === undefined){ return alert('送信する名前がありません'); }
  if(comm === '' || comm === undefined){ return alert('送信するテキストがありません'); }
  if(nameList[0] === undefined){ return alert('入室していません'); }
  //Perlに送信
  $.ajax({
    url: cgiPath,
    type: 'POST',
    cache: false,
    timeout: 10000,
    dataType: 'json',
    data: {
      'mode': 'write',
      'tab' : tab ? tab : mainTab,
      'room': roomId,
      'logKey' : logKey,
      'game': gameSystem,
      'player': nameList[0]['name'],
      'name'  : name,
      'color' : color,
      'comm'  : comm,
      'stt'   : stt,
      'bcdice': bcdice ? bcdice : '',
      'userId': userId
    }
  })
  .done( (data) => {
    console.log(data['text']);
    logGet();
  })
  .fail( (data) => {
    console.log('発言の送信に失敗');
  });
}
// 送信前処理
function formSubmit(objId,unitName){
  unitName = htmlEscape(unitName);
  const obj = document.getElementById(objId);
  let pre  = obj.dataset.commPre ? obj.dataset.commPre : '';
  let comm = obj.value;
  let commLock = obj.dataset.lock ? obj.dataset.lock : 0; //発言を送信後に消さないかどうか
  if(commLock === 'memo') { return; }
  if (!comm && !pre.match(/^\/topic/)) return console.log('発言が空欄'); // 発言が空なら処理中断（TOPIC除く）
  if(pre.match(/^[@＠]/)) { // ステータスリモコンからの入力前処理
    const calcOn = document.getElementById('stt-calc-on-'+unitList[unitName]['id']).selected;
    if(calcOn){
      if (!comm.match(/^[\+\-\/=:＋－／＝：]/)) { comm = '=' + comm; }
    }
    else {
      comm = ':' + comm;
      commLock = 'full';
    }
  }
  comm = (pre ? pre : '') + comm;
  beforeComm[objId] = comm;
  
  if(obj.dataset.paletteTarget){
    comm = paletteCheck(unitList[unitName]['id'], comm);
  }
  let target = 0;
  if(obj.closest('[data-tab]')){ target = obj.closest('[data-tab]').dataset.tab; }
  
  const nameNum = target ? 0 : document.getElementById('form-name').value;
  let name  = unitName ? unitName : nameList[nameNum]['name'];
  
  // 名前とコマンドチェック
  let stt;
  [name, comm, stt] = nameCheck(name, comm);
  
  const color = nameToColor[name];
  
  //発言が空になってたら処理中止
  if(comm == ''){ return }
  
  // 発言に使ったフォーム初期化処理
  if     (commLock === 'full'){  }
  else if(commLock === 'name'){ obj.value = name+"@"; }
  else{ obj.value = ''; }
  autosize.update(obj);
  obj.focus();
  
  //BCDice
  let bcdice;
  if(bcdiceAPI){
    let hit = 0;
    let halfComm = toHalfWidth(comm);
    if(bcdicePrefixs.length){ //システム用の接頭辞チェック
      for(let i in bcdicePrefixs){
        const reg = new RegExp("^"+bcdicePrefixs[i], 'i');
        if(halfComm.match(reg)){ hit = 1; }
      }
    }
    if(!hit){
      //通常ダイスbotにも反応するものを極力絞る
      if     (halfComm.match(/^[0-9\+\-\*\/=]+(\n|$)/i)){  }
      else if(halfComm.match(/^choice\[/i)){ hit = 1 }
      else if(halfComm.match(/^[^0-9]+(\n|$)/i)){  }
      else if(halfComm.match(/^[0-9]d(\n|$)/i)){ hit = 1 }
      else if(halfComm.match(/^[0-9bcdsu\+\-\*\/=\.@<>\(\)]{3,}/i)){ hit = 1 }
    }

    if(hit){
      bcdiceRoll(halfComm).done( (data) => {
        if(data['ok']){
          bcdice = bcdiceSystem+data['result'];
        }
      })
      .fail( (jqXHR, textStatus, errorThrown) => {
        //if(jqXHR.status !== 400){
        //  bcdice = 'BCDice-API: '+jqXHR.status+' '+textStatus+'('+errorThrown.message+')';
        //}
      })
      .always( (data) => {
        commSend(comm, target, name, color, stt, bcdice);
      });
    }
    else { commSend(comm, target, name, color, stt); }
  }
  // 通常送信処理
  else {
    commSend(comm, target, name, color, stt);
  }
}
//名前・ステータスコマンドチェック
let nameToColor = {};
function nameCheck(name, comm){
  // 名前リストを作る
  nameToColor = {};
  let names = [];
  for(let key in unitList){
    names.push(key);
    nameToColor[key] = unitList[key]['color'];
  }
  for(let i in nameList){
    names.push(nameList[i]['name']);
    nameToColor[nameList[i]['name']] = nameList[i]['color'];
  }
  // コメントチェック
  let stt = '';
  let reg = new RegExp("^("+names.join('|')+")?[@＠]((?:"+setStatus.join('|')+")|delete)?");
  let newComm = comm.replace(reg, function(){
    let after = '';
    if(RegExp.$1){ // 名前
      name = RegExp.$1;
    }
    else { after = '@' }
    if(RegExp.$2){ //ステータスコマンド
      if(unitList[name]){
        for(let i in setStatus) {
          stt += setStatus[i] +'='+ unitList[name]['status'][setStatus[i]] + '<>';
        }
      }
      after = '@'+RegExp.$2;
    }
    return after;
  });
  
  return [name, newComm, stt];
}
// BCDice-APIに送信
function bcdiceRoll(comm){
  return $.ajax({
    url: bcdiceAPI+'/v1/diceroll',
    type: 'GET',
    cache: false,
    timeout: 10000,
    dataType: 'json',
    data: {
      'system' : bcdiceSystem,
      'command': comm,
    }
  })
}
// BCDice-APIから情報取得
let bcdicePrefixs = [];
function bcdiceSystemInfo(){
  return $.ajax({
    url: bcdiceAPI+'/v1/systeminfo',
    type: 'GET',
    cache: false,
    timeout: 10000,
    dataType: 'json',
    data: {
      'system' : bcdiceSystem,
    }
  })
  .done( (data) => {
    bcdicePrefixs = data['systeminfo']['prefixs'];
    document.getElementById('help-bcdice-info').innerHTML = data['systeminfo']['info'].replace(/\n/g,"<br>");
  })
  .fail( (jqXHR, textStatus, errorThrown) => {
    alert('APIサーバーからの情報取得に失敗しました\n'+jqXHR.status+' '+textStatus+'\n('+errorThrown.message+')')
  });
}
// 新規ユニット送信処理
function newUnitSubmit(){
  let name  = document.getElementById('new-unit-name-value').value;
  let color = document.getElementById('new-unit-color-value').value;
  let comm  = '@' + document.getElementById('new-unit-stt-value').value;
  let target = 0;
  commSend(comm, target, name, color);
  if(document.getElementById('new-unit-addname').checked){
    nameList.push( { "name":name, "color":color } );
    npcBoxSet();
  }
}
// ラウンド更新送信
function roundSubmit(num){
  let name  = nameList[0]['name'];
  let comm  = '/round' + num;
  let target = 0;
  commSend(comm, target, name);
}
// メモ更新送信
function memoSubmit(){
  let name  = nameList[0]['name'];
  let comm  = '/memo' + selectedMemo + ' ' + document.getElementById("sheet-memo-value").value;
  let target = 0;
  commSend(comm, target, name);
}
// フォーム上のキー挙動
$(function($){
  $(document).on("keydown", ".form-comm", function(e) {
    // Enterで送信
    if (e.key === 'Enter') {
      if (e.shiftKey || e.target.dataset.lock === 'memo') {
        // 
      }
      else if ($(e.target).val().replace(/\r?\n/g, "").length <= 0) {
        e.preventDefault();
      }
      else {
        e.preventDefault();
        formSubmit(e.target.id, e.target.dataset.paletteTarget);
      }
    }
    // 前回送信した発言を取得
    else if (e.key === 'ArrowUp') {
      if(!$(e.target).val() && beforeComm[e.target.id]) {
        e.preventDefault();
        e.target.value = beforeComm[e.target.id];
        autosize.update(e.target);
      }
    }
  });
});
// チャットパレット
$(function($){
  // クリック
  $(document).on("click", "select.chat-palette option", function(e) {
    const diceValue =  e.target.value;
    const name = htmlEscape( $(e.target).parent("select").data('name') );
    document.getElementById("chat-palette-comm-unit-"+unitList[name]['id']).value = diceValue;
    autosize.update($('#chat-palette-comm-unit-'+unitList[name]['id']));
  });
  // ダブルクリック
  $(document).on("dblclick", "select.chat-palette option", function(e) {
    const name = htmlEscape( $(e.target).parent("select").data('name') );
    formSubmit("chat-palette-comm-unit-"+unitList[name]['id'],name);
  });
});
// チャットパレット変数チェック
let paletteSetNest;
function paletteCheck(id, comm){
  paletteSetNest = 0;
  return comm.replace(/[{｛](.+?)[｝}]/gi, function(all, varName){
    return paletteParamSet(id, varName);
  });
}
function paletteParamSet(id,varName){
  varName = toHalfWidth(varName);
  paletteSetNest++;
  if(paletteSetNest >= 100){ return '{'+varName+'}'; }
  const lines = document.getElementById('chat-palette-unit-'+id).options;
  const reg = new RegExp('^\/\/' + varName + '[=＝](.*?)$', 'i');
  for(let i=0; i<lines.length; i++){
    if(toHalfWidth(lines[i].value).match(reg)){
      return RegExp.$1.replace(/[{｛](.+?)[｝}]/gi, function(all, varName){
        return paletteParamSet(id, varName);
      });
    }
  }
  return '{'+varName+'}';
}
function toHalfWidth(text) {
  return text.replace(/[Ａ-Ｚａ-ｚ０-９！＂＃＄％＆＇（）＊＋，－．／：；＜＝＞？＠［＼］＾＿｀｛｜｝]/g, function(s){
    return String.fromCharCode(s.charCodeAt(0)-0xFEE0);
  })
  .replace(/[‐－―]/g, "-")
  .replace(/[～〜]/g, "~")
  .replace(/　/g, " ");
}

// ログリセット
function resetRoom(){
  const password = document.getElementById('room-reset-password').value;
  const roomResetAll = document.getElementById('room-reset-all').checked ? 1 : 0;
  $.ajax({
    url: cgiPath,
    type: 'POST',
    cache: false,
    timeout: 10000,
    dataType: 'json',
    data: {
      'mode': 'reset',
      'room': roomId,
      'logKey': logKey,
      'password': password,
      'allReset': roomResetAll,
    }
  })
  .done( (data) => {
    if(data['status'] === 'ok') {
      console.log(data['text']);
      alert('ログをリセットしました。リロードします。');
      boxClose('config-other');
      document.getElementById('room-reset-all').checked = false;
      document.getElementById('room-reset-password').value = '';
      location.reload();
    }
    else {
      alert(data['text']);
    }
  })
  .fail( (data) => {
    console.log('ログの削除に失敗');
  });
}

// エスケープ
function htmlEscape(str) {
    if (!str) return;
    return str.replace(/[<>]/g, function(match) {
      const escape = {
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        //'"': '&quot;',
        //"'": '&#39;',
        //'`': '&#x60;'
      };
      return escape[match];
    });
}
function htmlUnEscape(str) {
    if (!str) return;
    return str.replace(/(&lt;|&gt;)/g, function(match) {
      const escape = {
        '&lt;': '<',
        '&gt;': '>',
        '&amp;': '&',
      };
      return escape[match];
    });
}

// ランダムID
function randomId(num){
  const l = num;
  const c = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const cl = c.length;
  let r = "";
  for(var i=0; i<l; i++){
    r += c[Math.floor(Math.random()*cl)];
  }
  return r;
}