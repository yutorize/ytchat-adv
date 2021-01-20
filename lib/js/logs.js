"use strict";
// LOGS
// ------------------------------
let mainTab = 1;

window.onload = function(){
  //let lines = document.querySelectorAll('[data-tab="1"]');
  //for(let i=0; i<lines.length; i++){
  //  lines[i].classList.add('main');
  //};
  secretView();
  bgImageSet();
  bgMusicSet();
  bgScroll();
  
  const resizeObserver = new ResizeObserver(entries => {
    bgBorderSet();
    bgmBorderSet();
  });
  resizeObserver.observe(document.getElementById('base'));
  document.getElementById('loading').classList.add('loaded');
}
window.onscroll = function(){
  bgScroll();
}

// タブON/OFF ----------------------------------------
function tabSelect(num){
  let lines = document.querySelectorAll('[data-tab="'+num+'"]');
  const on = document.getElementById('tab-on-'+num).checked;
  for(let i=0; i<lines.length; i++){
    lines[i].style.display = on ? 'grid' : 'none';
  };
}

// 秘話ON/OFF ----------------------------------------
function secretView(){
  let lines = document.querySelectorAll('.secret');
  const on = document.getElementById('secret-on').checked;
  for(let i=0; i<lines.length; i++){
    lines[i].style.display = on ? 'grid' : 'none';
  };
}

// 背景 ----------------------------------------
let bgImages = [];
let bgBorders = [];
let currentBg = 0;
// 背景画像URL取得・一覧にセット
function bgImageSet(){
  const defaultImage = getComputedStyle(document.body).getPropertyValue('background-image');
  bgImages = [{'url':defaultImage,'title':'－'}];
  document.querySelectorAll('.bg-border').forEach(elm => {
    if(elm.dataset.url){
      bgImages.push( {'url':'url('+elm.dataset.url+')', 'title':elm.dataset.title } );
    }
    else {
      bgImages.push( {'url':defaultImage, 'title':'－' } );
    }
  });
  bgBorderSet();
}
// 背景変更位置セット
function bgBorderSet(){
  bgBorders = [0];
  document.querySelectorAll('.bg-border').forEach(elm => {
    bgBorders.push(elm.getBoundingClientRect().top + document.scrollingElement.scrollTop);
  });
}
// 背景変更処理
function bgChange(num){
  if(num != currentBg){
    document.querySelector('.bg-back').style.backgroundImage = document.querySelector('.bg-front').style.backgroundImage;
    document.body.removeChild(document.querySelector('.bg-front'));
    let bgFront =  document.createElement('div');
    bgFront.classList.add('bg-image','bg-front');
    bgFront.style.backgroundImage = bgImages[num]['url'];
    document.body.appendChild(bgFront);
    document.getElementById('bg-title').innerHTML = bgImages[num]['title'];
  }
  currentBg = num;
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
  document.getElementById('contents').addEventListener("click",(e) => {
    if (e.target.closest('.info.image img')) {
      imgView(e.target.src)
    }
    if (e.target.closest('.info.unit .chara-image')) {
      imgView( e.target.style.backgroundImage.replace(/^url\("?/,'').replace(/"?\)$/,'') );
    }
  });
  document.getElementById('image-box').addEventListener("click",(e) => {
    document.getElementById('image-box').style.display = 'none';
    document.getElementById('image-box-image').src = '';
  });
})();

// BGM ----------------------------------------
let bgMusic = new Audio('');
    bgMusic.loop = true;
    bgMusic.muted = true;
let bgMusics = [];
let bgmBorders = [];
let currentBgm = 0;
const ytPlayerArea = document.getElementById('yt-player-area');
setYoutubePlayer();
// Youtubeプレーヤー用意
function setYoutubePlayer(){
  let tag = document.createElement('script');
  tag.src = "https://www.youtube.com/player_api";
  let firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}
let ytPlayer;
function onYouTubePlayerAPIReady() {
  ytPlayer = new YT.Player('yt-player', {
    height: '100%',
    width : '100%',
    playerVars: {
      controls: 0,
    },
    events: {
      'onStateChange': ytPlayerLoop,
      'onReady': ytPlayerReady
    }
  });
}
let ytPlayerReadyOk = 0;
function ytPlayerReady(){
  ytPlayer.mute();
  ytPlayerReadyOk = 1;
  soundVolumeChange();
}
function ytPlayerLoop(e) {
  var ytStatus = e.target.getPlayerState();
  if (ytStatus == YT.PlayerState.ENDED) {
    ytPlayer.playVideo();
  }
}
// BGMURL取得・一覧にセット
function bgMusicSet(){
  bgMusics = [{'url':'','title':'－'}];
  let bgmExist = 0;
  document.querySelectorAll('.bgm-border').forEach(elm => {
    if(elm.dataset.url){
      bgMusics.push( {'url':elm.dataset.url, 'title':elm.dataset.title, 'vol':elm.dataset.vol } );
      bgmExist++;
    }
    else {
      bgMusics.push( {'url':'', 'title':'－', 'vol':0 } );
    }
  });
  bgmBorderSet();
  if(!bgmExist){
    document.querySelector('#options-sound').style.display = 'none';
  }
  else {
    document.getElementById('sound-confirm').style.display = 'grid';
  }
}
// サウンド確認メッセージを閉じる
function soundConfirmClose(){
  document.getElementById('sound-confirm').style.display = 'none';
}
// BGM変更位置セット
function bgmBorderSet(){
  bgmBorders = [0];
  document.querySelectorAll('.bgm-border').forEach(elm => {
    bgmBorders.push(elm.getBoundingClientRect().top + document.scrollingElement.scrollTop);
  });
}
// BGM変更処理
function bgmChange(num){
  if(!ytPlayerReadyOk) return;
  if(num != currentBgm){
    if(bgMusics[num]['url'] != bgMusics[currentBgm]['url']){
      if(bgMusics[num]['url'].match(/^https:\/\/youtu\.be\/(.+)$/)){
        bgMusic.pause();
        if(muteOn){ ytPlayer.cueVideoById(RegExp.$1); }
        else      { ytPlayer.loadVideoById(RegExp.$1); }
        ytPlayerArea.style.display = muteOn ? 'none' : 'block';
      }
      else {
        ytPlayerArea.style.display = 'none';
        ytPlayer.pauseVideo()
        ytPlayer.loadVideoById('');
        bgMusic.src = bgMusics[num]['url'];
        if(!muteOn){ bgMusic.play(); }
      }
    }
    const vol = (Number(bgMusics[num]['vol']) || 100) / 100 * soundVolume;
    bgMusic.volume = vol;
    ytPlayer.setVolume(Math.round(vol*100));
    document.getElementById('bgm-title').innerHTML = bgMusics[num]['title'];
  }
  currentBgm = num;
}

// スクロール時該当背景/BGMチェック ----------------------------------------
function bgScroll(){
  const center = window.innerHeight / 2;
  // 背景
  for (let i = bgBorders.length-1; i>=0; i--) {
    if (document.scrollingElement.scrollTop > bgBorders[i] - center) {
      bgChange(i);
      break;
    }
  }
  //BGM
  if(!muteOn){
    for (let i = bgmBorders.length-1; i>=0; i--) {
      if (document.scrollingElement.scrollTop > bgmBorders[i] - center) {
        bgmChange(i);
        break;
      }
    }
  }
}

// サウンドボリューム ----------------------------------------
let soundVolume = localStorage.getItem('logs-sound') || 0.8;
document.getElementById('option-sound').value = soundVolume;
document.getElementById('option-sound').oninput = function (e){
  soundVolume = e.target.value;
  soundVolumeChange();
  localStorage.setItem('logs-sound', soundVolume);
};
function soundVolumeChange() {
  const vol = bgMusics[currentBgm] ? (Number(bgMusics[currentBgm]['vol']) || 100) / 100 * soundVolume : 1;
  bgMusic.volume = vol;
  ytPlayer.setVolume(Math.round(vol*100));
  document.getElementById('option-sound-view').innerHTML = Math.round(soundVolume * 100);
}

// サウンドミュート ----------------------------------------
let muteOn = 1;
document.getElementById('option-mute-button').onclick = function (e){
  if (muteOn){ soundOn();  }
  else       { soundOff(); }
};
function soundOn(){
  document.getElementById('option-mute-button').classList.remove('muted');
  bgMusic.muted = false;
  ytPlayer.unMute();
  ytPlayer.playVideo();
  muteOn = 0;
  if(bgMusics[currentBgm]['url'].match(/^https:\/\/youtu\.be\/(.+)$/)){
    ytPlayerArea.style.display = 'block';
  }
}
function soundOff(){
  document.getElementById('option-mute-button').classList.add('muted');
  bgMusic.muted = true;
  ytPlayer.mute();
  ytPlayer.pauseVideo();
  muteOn = 1;
  ytPlayerArea.style.display = 'none';
}

// ボックス透過率 ----------------------------------------
let opacityValue = localStorage.getItem('logs-opacity') || 0.7;
document.getElementById('option-opacity').value = opacityValue;
opacityChange();
document.getElementById('option-opacity').oninput = function (e){
  opacityValue = e.target.value;
  opacityChange();
  localStorage.setItem('logs-opacity', opacityValue);
};
function opacityChange() {
  document.documentElement.style.setProperty('--box-bg-opacity', opacityValue);
  document.getElementById('option-opacity-view').innerHTML = Math.round(opacityValue * 100);
}

// フォントサイズ ----------------------------------------
let fontSize = localStorage.getItem('logs-fontSize') || 100;
document.getElementById('option-font-size').value = fontSize;
fontSizeChange();
document.getElementById('option-font-size').oninput = function (e){
  fontSize = e.target.value;
  fontSizeChange();
  localStorage.setItem('logs-fontSize', fontSize);
};
function fontSizeChange() {
  document.getElementById('contents').style.fontSize = fontSize+'%';
  document.getElementById('option-font-size-view').innerHTML = fontSize;
}

// フォント明暗 ----------------------------------------
let fontLightness = localStorage.getItem('fontLightness') || 100;
if(fontLightness) { document.getElementById('option-font-lightness').value = fontLightness; }
fontLightnessSet();
document.getElementById('option-font-lightness').oninput = function (e){
  fontLightness = e.target.value;
  fontLightnessSet();
  localStorage.setItem('fontLightness', fontLightness);
};
function fontLightnessSet() {
  document.documentElement.style.setProperty('--logs-font-color-lightness', fontLightness+'%');
  document.getElementById('option-font-lightness-view').innerHTML = fontLightness;
}

// フォントファミリー ----------------------------------------
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
  //document.getElementById('option-font-family-min').value = fontFamilyMin;
}
//document.getElementById('option-font-family-min').oninput = function (e){
//  fontFamilyMin = e.target.value;
//  fontFamilyMinSet();
//  localStorage.setItem('fontFamilyMin', fontFamilyMin);
//};
function fontFamilyMinSet() {
  document.documentElement.style.setProperty('--logs-font-family-min', fontFamilyMin);
}