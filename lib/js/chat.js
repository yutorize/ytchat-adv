"use strict";
// CHAT （送受信・ロードに関わる記述）
// ------------------------------
const cgiPath = './index.cgi';
let numPath;
let logKey;
let lastnumber = 0;
let userId;
let romMode = 0;
let mainTab = 1;
let tabList = {};
let memberList = {};
let nameList = [];
let unitList = {};
let chatPalettes = {};
let sheetMemos = {};
let selectedSheet = '';
let shareMemo = [];
let beforeComm = {};
let bgHistory = {};
let chatLogs = {};

// ロード時処理 ----------------------------------------
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
    document.cookie = 'ytchat-userid='+userId; //Cookieに保存（ログ用）
    if(savedName){
      nameList = JSON.parse(savedName);
      document.getElementById('in-name').value       = nameList[0]['name'];
      document.getElementById('in-color').value      = nameList[0]['color'];
      document.getElementById('in-color-text').value = nameList[0]['color'];
      $("#in-color").spectrum("set", nameList[0]['color']);
    }
    const layoutSide  = localStorage.getItem('layout-side') || 'right-top';
    const layoutSheet = localStorage.getItem('layout-sheet') || 'R';
    document.getElementById('window-layout-sidebar').value = layoutSide;
    document.getElementById('window-layout-sheet').value   = layoutSheet;
    layoutChange();
    
    markName = localStorage.getItem('markName') || 1;   
    if(markName == 1) { document.getElementById('mark-name-check').checked = true; }
    markList = JSON.parse(localStorage.getItem('markList')) || [];
    document.getElementById('mark-list-value').value = markList.join("\n");
    autosizeUpdate(document.getElementById('mark-list-value'));
    exceptList = JSON.parse(localStorage.getItem('exceptList')) || [];
    document.getElementById('except-list-value').value = exceptList.join("\n"); 
    autosizeUpdate(document.getElementById('except-list-value'));
    
    //入室済み
    if(savedName && logKey === localStorage.getItem(roomId+'-logKey')){
      chatPalettes = JSON.parse(localStorage.getItem(roomId+'-palette'))   || {};
      sheetMemos   = JSON.parse(localStorage.getItem(roomId+'-sheetMemo')) || {};
      if(nameList[0] && nameList[0]['name']){
        console.log('自動再入室:'+nameList[0]['name']);
        memberCheck();
        roomLoad(1);
      }
      else {
        console.log('自動再入室失敗');
        boxOpen('enter-form');
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
  //コンフィグ反映
  if(document.getElementById('config-room-game')){
    document.getElementById('config-room-game').value = bcdiceAPI ? 'bcdice' : gameSystem;
    if(bcdiceAPI){
      document.getElementById('config-room-bcdice-url').value = bcdiceAPI;
      BCDiceGet(bcdiceAPI, 1);
      document.getElementById('config-room-bcdice-options').style.display = 'block';
    }
  }
}
// 入室 ----------------------------------------
function enterRoom() {
  const name = document.getElementById('in-name').value;
  let color = document.getElementById('in-color').value;
  if(name === ''){ return alert('名前が入力されていません'); }
  color = color || '#FFFFFF';
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
  sheetClose();
  roomLoad();
}
// 退室 ----------------------------------------
function exitRoom() {
  if(romMode){ location.href = './'; return; } // 見学ちゃんは移動で済ます
  const name = nameList[0]['name'];
  const color = nameList[0]['color'] || '#FFFFFF';
  if(name === ''){ return console.log('退室:名前がありません'); }
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
      'color' : color,
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

// 部屋情報取得 ----------------------------------------
function roomLoad(re){
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
    const saveFontSize = JSON.parse(localStorage.getItem(roomId+'-fontSize'));
    if(saveFontSize) fontSize = saveFontSize;
    tabList = data['tab'];
    for (let key in tabList) {
      tabAdd(key);
    }
    //背景取得
    if(data['bg']) {
      document.querySelector('.bg-front').style.backgroundImage = 'url('+data['bg']['url']+')';
      document.getElementById('bg-title').innerHTML = `<a target="_target" href="${data['bg']['url']}">${data['bg']['title']}</a>`;
    }
    bgHistory = data['bg-history'] || {};
    bgHistoryUpdate();
    //トピック取得
    topicChange(data['topic'])
    //ラウンド取得
    if(!data['round']){ data['round'] = 0; }
    document.getElementById('round-value').innerHTML = data['round'];
    //ユニット取得
    unitList = data['unit'] || {};
    for (let key in unitList) {
      unitAdd(key);
    }
    const statusList = JSON.parse(localStorage.getItem(roomId+'-statusList')) || [];
    const statusBody = document.getElementById('status-body');
    statusList.reverse().forEach(function(name) {
      if(unitList[name] && unitList[name]['id']){
        const obj = document.getElementById('stt-unit-'+unitList[name]['id']);
        statusBody.insertBefore(obj, statusBody.firstElementChild);
      }
    });
    statusUpdate();
    if(window.matchMedia('(max-width:1024px)').matches){ sheetClose(); }
    //共有メモ取得
    shareMemo = data['memo'] || [];
    memoUpdate();
    //メンバー
    memberList = data['member'] || {};
    addressUpdate();
    //見学でない
    if(!romMode){
      //ユニット
      if(unitList[nameList[0]['name']]){ sheetSelect(unitList[nameList[0]['name']]['id']); }
      else { sheetSelect('default'); }
      //ダイス
      const savedDiceColumn = JSON.parse(localStorage.getItem(roomId+'-diceColumn'));
      if(savedDiceColumn){ diceColumn = savedDiceColumn; }
      const savedDiceForms  = JSON.parse(localStorage.getItem(roomId+'-diceForms'));
      let diceNum0 = 1;
      let diceNum1 = 6;
      if(savedDiceForms) {
        diceForms  = savedDiceForms;
        diceNum0 = diceForms[0].length;
        diceNum1 = diceForms[1].length;
      }
      [...Array(diceNum0)].map(() => diceAdd(0));
      [...Array(diceNum1)].map(() => diceAdd(1));
      diceLoad(0,re); diceScale(0,diceColumn[0]);
      diceLoad(1,re); diceScale(1,diceColumn[1]);
      //名前欄項目作成
      document.getElementById('main-name1').value       = nameList[0]['name'];
      document.getElementById('main-name1').style.color = nameList[0]['color'];
      document.getElementById('form-color').value       = nameList[0]['color'];
      document.getElementById('form-color-text').value  = nameList[0]['color'];
      $("#form-color").spectrum("set", nameList[0]['color']);
      npcBoxSet();
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

// 入室者チェック ----------------------------------------
function memberCheck() {
  const name = nameList[0]['name'];
  $.ajax({
    url: cgiPath,
    type: 'POST',
    cache: false,
    timeout: 10000,
    dataType: 'json',
    data: {
      'mode': 'write',
      'room': roomId,
      'logKey' : logKey,
      'player': name,
      'system': 'reload',
      'userId': userId
    }
  })
  .done( (data) => {
    console.log('入室チェック');
    memberList = data;
    addressUpdate();
  });
}

// 更新チェック ----------------------------------------
let logCheckCount = 0;
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
    if(jqXHR.status === 404 && !resetFlag){
      alert('ログがリセットされました。退室してページを再読み込みします。');
      localStorage.removeItem(roomId+'-name');
      location.reload();
    }
  })
  .always( (data) => {
    //console.log(lastnumber);
    logCheckCount += 1;
    if(!romMode && logCheckCount >= 150){ memberCheck(); logCheckCount = 0; }
    setTimeout( function(){logCheck();}, checkTimeMem);
  });
}

// 新規ログ取得 ----------------------------------------
let lock = 0;
let beforeUser = {};
let beforeName = {};
let beforeColor = {};
let beforeSecret = {};
let beforeLater = {};
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
    let statusUpdateFlag = 0;
    data.forEach( (value, index, array) => {
      // 秘話チェック
      if(value['address'] && !(userId === value['address'] || userId === value['userId'])){
        lastnumber = value['num'];
        return true; 
      }
      const scrollOK = scrollCheck(value['tab']); //スクロールするかチェック
      
      const targetTab = document.getElementById("chat-logs-tab"+value['tab']);
      if(   beforeUser[value['tab']] !== value['userId']
         || beforeName[value['tab']] !== value['name']
         || beforeColor[value['tab']] !== value['color']
         || beforeSecret[value['tab']] !== value['address']
         || beforeLater[value['tab']] !== value['openlater']
         || value['name'] == '!SYSTEM'
        ){
        let newLog = document.createElement('dl');
        newLog.dataset.user = value['userName'];
        newLog.dataset.id   = value['userId'];
        if(value['name'] == '!SYSTEM'){
          newLog.classList.add('system');
          if     (value['system'].match(/^topic/)){ newLog.classList.add('topic'); }
          else if(value['system'].match(/^memo/) ){ newLog.classList.add('memo'); }
          else if(value['system'].match(/^bg/)   ){ newLog.classList.add('bg'); }
          else if(value['system'].match(/^ready/)){ newLog.classList.add('ready'); }
          else if(value['system'].match(/^round/)){ newLog.classList.add('round'); }
          else if(value['system'].match(/^enter/)){ newLog.classList.add('enter'); }
          else if(value['system'].match(/^exit/)) { newLog.classList.add('exit'); }
          else if(value['system'].match(/^change/)){ newLog.classList.add('change'); }
          newLog.innerHTML = '<dt id="line-'+value['num']+'-name"></dt>';
        }
        else {
          newLog.innerHTML = '<dt id="line-'+value['num']+'-name" style="color:'+ value['color'] +'">'+ value['name'] +'</dt>';
          if(value['address']){
            newLog.classList.add('secret');
            if(value['openlater']){
              newLog.classList.add('openlater');
            }
          }
        }
        targetTab.appendChild(newLog);
      }
      // システム処理（読み込み時は飛ばす）
      if(beforeLastnumber && value['system']){
        // ルーム設定変更
        if(value['system'] === 'change'){
          alert("ゲームルーム設定が変更されました。\nリロードします。");
          location.reload();
        }
        // TOPIC更新
        else if(value['system'] === 'topic') { topicChange(value['info']); }
        // ユニット更新
        else if (value['system'] === 'unit'){
          const stts = value['info'].split(/ /);
          for (let i in stts) {
            if (!stts[i].includes(':')) continue;
            let array = stts[i].split(/:/);
            const sttName = array.shift();
            if (!unitList[value['name']]){
              unitList[value['name']] = { 'color': value['color'], 'status': {} };
              unitAdd(value['name']);
              statusListSave();
            }
            unitList[value['name']]['status'][sttName] = array.join(":");
          }
          statusUpdateFlag = 1;
        }
        // チェック更新
        else if (value['system'].match(/^check:(0|1)/)){
          const check = Number(RegExp.$1);
          if (unitList[value['name']]){
            unitList[value['name']]['status']['check'] = check;
            statusUpdateFlag = 1;
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
            document.getElementById('round-value').innerHTML = value['info'].replace("ラウンド: ", "");
          }
          statusUpdateFlag = 1;
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
        // 入室時
        else if (value['system'].match(/^enter/)){
          //ユニット作成
          if(value['system'].match(/ unit/)){
            if (!unitList[value['userName']]){
              unitList[value['userName']] = { 'color': value['color'], 'status': {} };
              unitAdd(value['userName']);
              statusListSave();
            }
            statusUpdateFlag = 1;
          }
        }
        //メンバー追加
        if(value['userId']){
          const updateFlag = !memberList[value['userId']] ? 1 : 0
          memberList[value['userId']] = { 'name':value['userName'], 'date':Math.floor(Date.now() / 1000) };
          if(updateFlag){ addressUpdate(); }
        }
        // 退室時メンバー削除
        if (value['system'].match(/^exit/)){
          if(value['userId']){
            delete memberList[value['userId']];
            addressUpdate();
          }
        }
        //背景処理
        else if(value['system'].match(/^bg/)) {
          let bgUrl; let bgTitle;
          if(value['system'].match(/^bg:(.+)$/)){
            bgUrl  = 'url('+RegExp.$1+')';
            bgTitle = ` <a target="_blank" href="${RegExp.$1}">${value['info']}</a>`;
            bgHistory[RegExp.$1] = value['info'];
            bgHistoryUpdate();
          }
          else {
            bgUrl = getComputedStyle(document.body).getPropertyValue('background-image');
            bgTitle = '－';
          }
          document.getElementById('bg-title').innerHTML = bgTitle;
          document.querySelector('.bg-back').style.backgroundImage = document.querySelector('.bg-front').style.backgroundImage;
          document.body.removeChild(document.querySelector('.bg-front'));
          let bgFront =  document.createElement('div');
          bgFront.classList.add('bg-image','bg-front');
          bgFront.style.backgroundImage = bgUrl;
          document.body.appendChild(bgFront);
        }
      }
      // システム処理
      if(value['system']){
        // 共有メモ更新
        if(value['system'].match(/^memo:([0-9]+)$/)) {
          const num = RegExp.$1;
          let head = value['info'] ? value['info'] : shareMemo[num];
          if(value['info']) { shareMemo[num] = value['info'].replace(/<br>/g, "\n"); } else { shareMemo[num] = ''; }
          value['info'] = '';
          head = head.replace(/(\n|<br>).*?$/, '');
          if(head.length > 8){ head = head.substr(0,8)+'...'; }
          value['comm'] = value['comm'].replace(/^共有メモ([0-9]+)/, "<button onclick=\"memoSelect("+num+")\">共有メモ$1"+(head?"("+head+")":'')+"</button>");
          memoUpdate();
          if(selectedSheet == "memo" && selectedMemo == num){ memoSelect(num); }
        }
        // 背景
        else if(value['system'].match(/^bg$/)) {
          value['info'] = '';
        }
      }
      // ユニット色更新
      if (unitList[value['name']]){
        unitList[value['name']]['color'] = value['color'];
        document.querySelector("#stt-unit-"+unitList[value['name']]['id']+" dt").style.color = value['color'];
        document.querySelector("#sheet-unit-"+unitList[value['name']]['id']+" h2").style.color = value['color'];
      }
      
      // コメント処理
      if(value['comm']){
        if(!romMode && userId !== value['userId']){ [soundFlag['mark'] , value['comm']] = wordMark(value['comm']); }
        value['comm'] = dashSet(value['comm']);
        let newComm = document.createElement('dd');
        newComm.id = 'line-' + value['num'] + '-comm';
        newComm.classList.add('comm');
        newComm.dataset.date = value['date'];
        newComm.innerHTML = value['comm'];
        targetTab.lastElementChild.appendChild(newComm);
        soundFlag['normal'] = 1;
      }
      if(value['info']){
        value['info'] = dashSet(value['info']);
        let newInfo = document.createElement('dd');
        if(value['system']){
          if     (value['system'].match(/^unit/)){ newInfo.classList.add('unit'); }
          else if(value['system'].match(/^choice/)){ newInfo.classList.add('choice'); }
          else if(value['system'].match(/^check/)){ newInfo.classList.add('dice'); }
          else if(value['system'].match(/^dice:?(.*)$/) ){ newInfo.classList.add('dice'); newInfo.dataset.game = RegExp.$1; }
        }
        newInfo.classList.add('info');
        newInfo.id = 'line-' + value['num'] + '-info';
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
      beforeSecret[value['tab']] = value['address'];
      beforeLater[value['tab']] = value['later'];
      if(lastnumber < value['num']){ lastnumber = value['num']; }
      // スクロールする／しないなら未読数追加
      if(scrollOK) {
        scrollBottom(value['tab']);
      }
      else {
        const tabname = document.querySelector('#chat-tab'+value['tab']+' > h2 .tab-name');
        const notice  = document.querySelector('#chat-tab'+value['tab']+' > .notice-unread');
        const list    = document.querySelector('#tablist-tab'+value['tab']);
        tabname.dataset.unread = Number(tabname.dataset.unread) + 1;
        notice.dataset.unread  = Number( notice.dataset.unread) + 1;
        list.dataset.unread    = Number(   list.dataset.unread) + 1;
      }
    });
    // ステータス更新
    if(statusUpdateFlag){
      statusUpdate();
    }
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
        if(!muteOn && sound && vol > 0){
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
// 連続ダッシュ接続 ----------------------------------------
function dashSet (comm){
  return comm.replace(/(―+)/g,'<span class="dash">$1</span>');
}
// ワード強調処理 ----------------------------------------
let markName = 1;
let markList = [];
let exceptList = [];
function wordMark (comm){
  let hit = 0;
  let wordList = markList.concat();
  if(markName == 1) { wordList.unshift(nameList[0]['name']); }
  for (let i in exceptList){
    if(exceptList[i] && comm.match(exceptList[i])) return [0,comm];
  }
  for (let i in wordList){
    if(!wordList[i]) continue;
    comm = comm.replace(wordList[i], ( str, offset, s ) => {
      const greater = s.indexOf( '>', offset );
      const lesser = s.indexOf( '<', offset );
      if( greater < lesser || ( greater != -1 && lesser == -1 ) ) { return str; }
      else { hit = 1; return '<mark>' + str +'</mark>'; }
    });
  }
  return [hit,comm];
}

// トピック変更 ----------------------------------------
function topicChange (topicValue){
  document.getElementById("topic-value").innerHTML = topicValue ? topicValue : '';
}
// ステータス表更新 ----------------------------------------
function statusUpdate () {
  for (let name in unitList) {
    const id = unitList[name]['id'];
    for (let i in setStatus) {
      const stt = setStatus[i];
      let value = unitList[name]['status'][stt];
      const valueNum = document.querySelector('#stt-'+id+'-'+stt+'-value .value');
      const valueGauge = document.querySelector('#stt-'+id+'-'+stt+'-value .gauge');
      const valueGaugeNow = document.querySelector('#stt-'+id+'-'+stt+'-value .gauge i');
      if(value && value.match(/&nbsp;|\s/)){
        valueNum.innerHTML = '<span>'+value.split(/&nbsp;|\s/).join('</span> <span>', )+'</span>';
        valueGauge.style.display = 'none';
      }
      else if (value && value.match(/^-?[0-9]+\/[0-9]+$/)){
        const [now, max] = value.split("/");
        let per = (now / max) * 100;
        const signal = (per >= 75) ? 'safe'
                     : (per >= 50) ? 'caution'
                     : (per >= 25) ? 'warning'
                     : (per >=  1) ? 'danger'
                     : 'knockdown';
        if(per < 0) { per = 0; }
        if(valueNum.innerHTML !== value){
          valueNum.innerHTML = value;
          valueGauge.style.display = 'block';
          gaugeUpdate(valueGauge,valueGaugeNow,per,signal);
        }
      }
      else if (stt === '侵蝕' && value){
        const per = (value / 200) * 100;
        const signal = (value >= 400) ? 'monster' : (value >= 300) ? 'grave'
                     : (value >= 240) ? 'fatal'   : (value >= 200) ? 'critical'
                     : (value >= 160) ? 'danger'  : (value >= 130) ? 'warning'
                     : (value >= 100) ? 'caution' : (value >=  80) ? 'attention'
                     : (value >=  60) ? 'notice'  : 'safe';
        if(valueNum.innerHTML !== value){
          valueNum.innerHTML = value;
          valueGauge.style.display = 'block';
          gaugeUpdate(valueGauge,valueGaugeNow,per,signal);
        }
      }
      else { valueNum.innerHTML = value; valueGauge.style.display = 'none'; }
      // 値が入ってない項目は非表示
      if(value === undefined || value === ''){
        document.getElementById('stt-'+id+'-'+stt).style.display = 'none';
      }
      else {
        document.getElementById('stt-'+id+'-'+stt).style.display = 'block';
      }
    }
    if(Number(unitList[name]['status']['check'])){ document.getElementById('stt-unit-'+id).classList.add('check'); }
    else { document.getElementById('stt-unit-'+id).classList.remove('check'); }
  }
  document.getElementById('status').dataset.num = Object.keys(unitList).length;
}
let gaugePromise = Promise.resolve();
function gaugeUpdate(maxObj,nowObj,per,signal){
  gaugePromise = gaugePromise.then(() => {
    return new Promise(resolve => {
      setTimeout( function(){
        maxObj.dataset.signal = signal;
        nowObj.style.width = per+'%';
        resolve();
      }, 50);
    });
  });
}
// ユニット削除 ----------------------------------------
function unitDelete (unitId) {
  let okFlag = 0;
  const sttElement   = document.getElementById(  'stt-unit-'+unitId);
  const sheetElement = document.getElementById('sheet-unit-'+unitId);
  if (sttElement)  { sttElement.parentNode.removeChild(sttElement);     okFlag = 1; }
  if (sheetElement){ sheetElement.parentNode.removeChild(sheetElement); okFlag = 1; }
  
  if(okFlag && selectedSheet === unitId){ sheetSelect('default'); }
  
  document.getElementById('status').dataset.num = Object.keys(unitList).length;
  
  return okFlag;
}

// 送信 ----------------------------------------
function commSend(comm,tab,name,color,address,bcdice){
  if(romMode){ return alert('見学入室では送信できません'); }
  if(name === undefined){ return alert('送信する名前がありません'); }
  if(comm === '' || comm === undefined){ return alert('送信するテキストがありません'); }
  if(nameList[0] === undefined){ return alert('入室していません'); }
  const openlater = (address && document.getElementById('secret-openlater').checked) ? 1 : '';
  //Perlに送信
  $.ajax({
    url: cgiPath,
    type: 'POST',
    cache: false,
    timeout: 10000,
    dataType: 'json',
    data: {
      'mode': 'write',
      'tab' : tab || mainTab,
      'room': roomId,
      'logKey' : logKey,
      'game': gameSystem,
      'status' : setStatus.join(' '),
      'player' : nameList[0]['name'],
      'name'   : name,
      'color'  : color,
      'comm'   : comm,
      'bcdice' : bcdice || '',
      'userId' : userId,
      'address': address || '',
      'addressName': address ? memberList[address]['name'] : '',
      'openlater': openlater,
    }
  })
  .done( (data) => {
    console.log(data['text']);
    if(data['status'] === 'error'){
      alert(data['text']);
    }
    else { logGet(); }
  })
  .fail( (data) => {
    console.log('発言の送信に失敗');
  });
}
// 送信前処理 ----------------------------------------
function formSubmit(objId,unitName){
  unitName = htmlEscape(unitName);
  const obj = document.getElementById(objId);
  let pre  = obj.dataset.commPre || '';
  let part = obj.dataset.part || '';
  let comm = obj.value;
  let commLock = obj.dataset.lock || 0; //発言を送信後に消さないかどうか
  if(commLock === 'memo') { return; }
  if(pre.match(/^[@＠]/)) { // ステータスリモコンからの入力前処理
    const calcOn = document.getElementById('stt-calc-on-'+unitList[unitName]['id']).selected;
    if(calcOn){
      if (!comm.match(/^[\+\-\/=:＋－／＝：]/)) { comm = '=' + comm; }
    }
    else {
      comm = ':"' + comm+'"';
      commLock = 'full';
    }
  }
  if (!comm && !pre.match(/^\/topic/)) return console.log('発言が空欄'); // 発言が空なら処理中断（TOPIC除く）
  beforeComm[objId] = comm; // 直前の送信履歴に保存
  comm = pre + comm;
  
  if(obj.dataset.paletteTarget){
    comm = paletteCheck(unitList[unitName]['id'], comm);
  }
  // 発言先タブチェック
  let target = 0;
  if(obj.closest('[data-tab]')){ target = obj.closest('[data-tab]').dataset.tab; }
  
  // どの名前で送信するかチェック
  const nameNum = target ? 0 : document.getElementById('form-name').value;
  let name  = unitName || nameList[nameNum]['name'];
  
  // 秘話送信先チェック
  let address = '';
  if(!target && !unitName){
    address = document.getElementById('form-address').value;
  }
  
  // 部位名
  if(part !== ''){ name = document.getElementById("edit-stt-"+part+"-name").value; }
  
  // タブと名前とコマンドチェック
  let tabname;
  [target, comm, tabname] = tabCheck(target, comm);
  [name, comm]   = nameCheck(name, comm);
  
  // 名前色
  const color = nameToColor[name];
  
  // 発言が空になってたら処理中止
  if(comm == ''){ return }
  
  // 発言に使ったフォーム初期化処理
  
  if     (commLock === 'full'){  }
  else if(commLock === 'dice'){ obj.value = obj.value.split(/\s/)[0]; }
  else if(commLock === 'name'){ obj.value = (tabname?`[${tabname}]`:'')+name+"@"; }
  else if(commLock === 'off'){  obj.value = (tabname?`[${tabname}]`:''); }
  else{ obj.value = ''; }
  autosizeUpdate(obj);
  obj.focus();
  if(commLock === 'dice' || commLock === 'name' || commLock === 'off'){
    diceForms[obj.dataset.area][obj.dataset.num]['value'] = obj.value;
    diceSave();
  }
  
  //BCDice
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
      let bcdice;
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
        commSend(comm, target, name, color, address, bcdice);
      });
    }
    else { commSend(comm, target, name, color, address); }
  }
  // 通常送信処理
  else {
    commSend(comm, target, name, color, address);
  }
}
// タブコマンドチェック ----------------------------------------
function tabCheck(tab, comm){
  let tabname;
  let reg = new RegExp("^(?:[\\[［]("+Object.values(tabList).join('|')+")?[\\]］])?");
  let newComm = comm.replace(reg, function(whole, mTab){
    if(mTab){ tab = tabnameToNum[mTab]; tabname = mTab; }
    return '';
  });
  return [tab, newComm, tabname];
}
// 名前・ステータスコマンドチェック ----------------------------------------
let nameToColor = {};
function nameCheck(name, comm){
  // 名前リストを作る
  nameToColor = {};
  let names = [];
  for(let key in unitList){
    names.push(escapeRegExp(key));
    nameToColor[key] = unitList[key]['color'];
  }
  for(let i in nameList){
    names.push(escapeRegExp(nameList[i]['name']));
    nameToColor[nameList[i]['name']] = nameList[i]['color'];
  }
  // コメントチェック
  let reg = new RegExp("^("+names.join('|')+")?[@＠]((?:"+setStatus.join('|')+")|delete)?");
  let newComm = comm.replace(reg, function(whole, mName, mStatus){
    let after = '';
    if(mName){ // 名前
      name = mName;
    }
    else { after = '@' }
    if(mStatus){ //ステータスコマンド
      after = '@'+mStatus;
    }
    return after;
  });
  return [name, newComm];
}
function escapeRegExp(str) {
  return str.replace(/[-\/\\^$*+?.()\[\]{}]/g, '\\$&');
}
// BCDice-APIに送信 ----------------------------------------
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
// BCDice-APIから情報取得 ----------------------------------------
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
// 新規ユニット送信処理 ----------------------------------------
autosizeUpdate(document.getElementById('new-unit-stt-value'));
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
// ユニット操作送信処理 ----------------------------------------
function unitCommandSubmit(type,unitId,n){
  let name  = unitId ? unitIdToName[unitId] :  nameList[document.getElementById('form-name').value]['name'];
  if(n){ name = document.getElementById("edit-stt-"+unitId+"-"+n+"-name").value; }
  if(!unitList[name]){ return alert('ユニット「'+name+'」は存在しません'); }
  const color  = unitList[name]['color'] ? unitList[name]['color'] : '';
  const comm   = '@' + type;
  const target = 0;
  if(type === 'delete'){
    const flag = confirm(name+"を削除します");
    if(!flag){ return }
  }
  commSend(comm, target, name, color);
  if(!unitId){
    document.getElementById('form-comm-main').focus();
  }
}

// ラウンド更新送信 ----------------------------------------
function roundSubmit(num){
  let comm  = '/round' + num;
  commSend(comm,0,nameList[0]['name']);
}
// メモ更新送信 ----------------------------------------
function memoSubmit(){
  let comm  = '/memo' + selectedMemo + ' ' + document.getElementById("sheet-memo-value").value;
  commSend(comm,0,nameList[0]['name']);
}
// 背景更新送信 ----------------------------------------
function bgSubmit(){
  const url   = document.getElementById("bg-set-url");
  const title = document.getElementById("bg-set-title");
  if (!url.value.match(/^https?:\/\/./)) return;
  let comm = '/bg ' + title.value + ' ' + url.value;
  commSend(comm,0,nameList[0]['name']);
  
  url.value = '';
  title.value = '';
  document.getElementById("bg-set-preview").src = '';
}

// チャットパレット ----------------------------------------
$(function($){
  // クリック
  $(document).on("click", "select.chat-palette option", function(e) {
    const diceValue =  e.target.value;
    const name = htmlEscape( $(e.target).parent("select").data('name') );
    document.getElementById("chat-palette-comm-unit-"+unitList[name]['id']).value = diceValue;
    autosizeUpdate(document.getElementById('chat-palette-comm-unit-'+unitList[name]['id']));
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
// ルーム設定変更 ----------------------------------------
function roomChange(){
  let flag = confirm("この内容で更新します。\nよろしいですか？\n（更新すると、ページのリロードが入ります）");
  if(!flag){ return false; }
  $.ajax({
    url: cgiPath,
    type: 'POST',
    cache: false,
    timeout: 10000,
    dataType: 'json',
    data: {
      'mode': 'change',
      'room': roomId,
      'logKey': logKey,
      'config-room-password': document.getElementById('config-room-password').value,
      'config-room-name': document.getElementById('config-room-name').value,
      'config-room-tab': document.getElementById('config-room-tab').value,
      'config-room-status': document.getElementById('config-room-status').value,
      'config-room-game': document.getElementById('config-room-game').value,
      'config-room-bcdice-url': document.getElementById('config-room-bcdice-url').value,
      'config-room-bcdice-game': document.getElementById('config-room-bcdice-game').value,
    }
  })
  .done( (data) => {
    if(data['status'] === 'ok') {
      location.reload();
    }
    else {
      alert(data['text']);
    }
  })
  .fail( (data) => {
    console.log('ルームの設定変更に失敗');
  });
}

// ログリセット ----------------------------------------
let resetFlag = 0;
function resetRoom(){
  const password = document.getElementById('room-reset-password').value;
  const logtitle = document.getElementById('room-reset-logtitle').value;
  const filename = document.getElementById('room-reset-filename').value;
  const roomResetAll = document.getElementById('room-reset-all').checked ? 1 : 0;
  const roomDelete   = document.getElementById('room-delete').checked ? 1 : 0;
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
      'title': logtitle || '',
      'filename': filename || '',
      'allReset': roomResetAll,
      'roomDelete': roomDelete,
    }
  })
  .done( (data) => {
    if(data['status'] === 'ok') {
      resetFlag = 1;
      console.log(data['text']);
      alert("ルームをリセットしました。作成したログに移動します。\nログを作成せず、ルームの削除のみ場合、トップページに移動します。");
      location.href = data['url'];
    }
    else {
      alert(data['text']);
    }
  })
  .fail( (data) => {
    console.log('ログの削除に失敗');
  });
}
// ファイル名取得 ----------------------------------------
function getFileName(){
  $.ajax({
    url: cgiPath,
    type: 'POST',
    cache: false,
    timeout: 10000,
    dataType: 'json',
    data: {
      'mode': 'getfilename',
      'room': roomId,
    }
  })
  .done( (data) => {
    if(data['status'] === 'ok') {
      document.getElementById('room-reset-filename').value = data['filename'];
    }
  })
  .fail( (data) => {
  });
}

// エスケープ ----------------------------------------
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

// ランダムID ----------------------------------------
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