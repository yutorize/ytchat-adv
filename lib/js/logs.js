"use strict";
// LOGS
// ------------------------------
let mainTab = 1;
var liteMode = Number(liteMode || localStorage.getItem('ytchatLiteMode') || 0);

window.onload = function(){
  createTableOfContents();
  pageSet();

  if(liteMode){
    document.body.classList.add('lite');
    document.getElementById('option-view-mode').value = 'lite';
  }
  else{
    secretView();
    bgImageSet();
    bgMusicSet();
    bgScroll();
    
    const resizeObserver = new ResizeObserver(entries => {
      bgBorderSet();
      bgmBorderSet();
    });
    resizeObserver.observe(document.getElementById('base'));

    window.addEventListener('scroll', scrollEvent)
  }
  document.getElementById('loading').classList.add('loaded');

  {
    const obj    = document.getElementById('loglist-area');
    const target = document.querySelector('#loglist-area a.bold');
    const scroll = target.getBoundingClientRect().y - obj.getBoundingClientRect().y - (obj.clientHeight / 2);
    obj.scrollBy(0,scroll);
  }
  const hash = location.hash;
  if(hash){
    anchorMove(hash.replace(/^#/,''));
  }
}
const scrollEvent = () => { bgScroll(); }

// 表示モード切替 ----------------------------------------
document.getElementById('option-view-mode').addEventListener('change', function(e) {
  const type = e.target.value;
  if(type === 'lite'){
    liteMode = 1;
    localStorage.setItem('ytchatLiteMode', 1);
    document.body.classList.add('lite');
    window.removeEventListener('scroll', scrollEvent);
    ytPlayerArea.innerHTML = '<div id="yt-player"></div>';
    if(document.getElementById('yt-api-cdn')) document.getElementById('yt-api-cdn').remove();
    bgImages = [];
    bgBorders = [];
    currentBg = 0;
    ytPlayerReadyOk = 0;
    if(bgMusic){ bgMusic.pause(); }
  }
  else if(type === 'simple'){
    const url = location.href.replace(/#(.+)$/,'').replace(/&type=(.+?)(&|$)/,'').replace(/&page=(.+?)(&|$)/,'') + '&type=simple';
    open(url);
    e.target.value = liteMode ? 'lite' : 'normal';
    return;
  }
  else {
    liteMode = 0;
    localStorage.setItem('ytchatLiteMode', 0);
    document.body.classList.remove('lite');
    bgImageSet();
    bgMusicSet();
    const resizeObserver = new ResizeObserver(entries => {
      bgBorderSet();
      bgmBorderSet();
    });
    resizeObserver.observe(document.getElementById('base'));
    window.addEventListener('scroll', scrollEvent);
  }

  const url = new URL(location.href);
  url.searchParams.set('type', type);
  history.replaceState(null, '', url.toString().replace('id=%40', 'id=@'));
})

// ページ分け ----------------------------------------
let currentPage = 1; let pageTurning = 0;
function pageSet(set) {
  console.log('pageSet('+set+')')
  if     (set ==  'all'){ currentPage=0; pageTurnSet('top');    location.hash = 'all'; }
  else if(set == 'next'){ currentPage++; pageTurnSet('top');    location.hash = 'page-'+currentPage; }
  else if(set == 'prev'){ currentPage--; pageTurnSet('bottom'); location.hash = 'page-'+currentPage; }
  else if(set > 0){ currentPage = set; location.hash = 'page-'+currentPage; }
  else { currentPage = Number(set) || 1 }
  let i = 0;
  let pagination = '';
  document.querySelectorAll('#contents .logs').forEach(obj => {
    i++;
    obj.dataset.page = i;
    obj.id = 'page-'+i+'-area';
    if     (!currentPage)   { obj.classList.remove('prev-page','next-page'); }
    else if(i < currentPage){ obj.classList.add('prev-page'); }
    else if(i > currentPage){ obj.classList.add('next-page'); }
    else { obj.classList.remove('prev-page','next-page'); }
    pagination += (i == currentPage) ? `<b>${i}</b> ` : `<a href="#page-${i}">${i}</a> `;
  });
  if(!currentPage){ pagination += '<b>ALL</b>' }
  else if (i >  1){ pagination += '<a href="#all">ALL</a>' }
  else if (i == 1){ pagination  = '<b>ALL</b>' }
  document.getElementById('pagination').innerHTML = pagination;
  document.getElementById('prev-button').style.display = (!currentPage || currentPage == 1) ? 'none' : '';
  document.getElementById('next-button').style.display = (!currentPage || currentPage == i) ? 'none' : '';

  document.getElementById('toc').dataset.numberOfPages = i.toString();
}
function pageTurnSet(set) {
  pageTurning = set;
  window.setTimeout(()=>{
    pageTurning = 0;
  }, 1000);
}

// 目次生成 ----------------------------------------
function createTableOfContents(){
  console.log('createTableOfContents()');
  let num = 0;
  const ul = document.getElementById('toc-headline');
  document.querySelectorAll(`[data-headline]`).forEach(obj => {
    const id = obj.id || 'headline-'+num;
    obj.id = id;
    let text = obj.innerHTML.replace(/<br>/gi,' ').replace(/<.+?>/g,'');
    let li = document.createElement('li');
    li.dataset.lv = obj.dataset.headline;
    let anchor = document.createElement('a');
    anchor.href = '#'+id;
    anchor.text = text;
    li.append(anchor);
    ul.append(li);
    num++;
  });
}

// アンカー移動 ----------------------------------------
let autoScrollCancel = 0;
window.addEventListener('hashchange', () => {
  if (autoScrollCancel){ autoScrollCancel = 0; return; }
  anchorMove( location.hash.replace(/^#/,'') );
})
function anchorMove(id){
  if(!id) return;
  console.log('anchorMove('+id+')')
  if(id === 'all'){
    pageSet('all');
    window.scrollTo(0,0);
  }
  else if(document.getElementById(id) && document.getElementById(id).classList.contains('credit')){
    document.getElementById(id).showModal();
  }
  else if(!currentPage){
    if(id.match(/^page-([0-9]+)$/)){
      pageSet(RegExp.$1);
      window.scrollTo(0,0);
    }
    else { return; }
  }
  else {
    const target = document.querySelector(`.logs#${id}`) || document.querySelector(`.logs#${id}-area`) || document.getElementById(id).closest('.logs');
    if(target){
      const targetPage = Number(target.dataset.page);
      if(targetPage != currentPage){ pageSet(targetPage) }
      if(pageTurning == 'bottom'){ document.querySelector('#page-bottom').scrollIntoView({block:'nearest'}) }
      else { window.scrollTo(0,0); }
    }
    window.location = "#"+id;
  }
  bgScroll();
}
document.querySelectorAll('dialog.credit').forEach(obj => {
  obj.addEventListener("click", e => {
    autoScrollCancel = 1;
    const rect = obj.getBoundingClientRect();
    const inDialog =
      rect.top <= e.clientY &&
      e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX &&
      e.clientX <= rect.left + rect.width;
    if (!inDialog) {
      obj.close();
      location.hash = currentPage == 0 ? 'all' : currentPage ? 'page-'+currentPage : '';
    }
  });
});
// タブON/OFF ----------------------------------------
function tabSelect(num){
  let lines = document.querySelectorAll('[data-tab="'+num+'"]');
  const on = document.getElementById('tab-on-'+num).checked;
  for(let i=0; i<lines.length; i++){
    lines[i].classList.toggle('hide', !on);
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
  bgImages = [{'url':defaultImage,'title':'－','page':1}];
  document.querySelectorAll('.bg-border').forEach(elm => {
    const page = Number(elm.closest(".logs").dataset.page);
    if(elm.dataset.url){
      bgImages.push( {'url':'url('+elm.dataset.url+')', 'title':elm.dataset.title, 'page':page } );
    }
    else {
      bgImages.push( {'url':defaultImage, 'title':'－', 'page':page } );
    }
  });
  bgBorderSet();
}
// 背景変更位置セット
function bgBorderSet(){
  bgBorders = [0];
  document.querySelectorAll('.bg-border').forEach(elm => {
    const num = bgBorders.length;
    const value = currentPage && bgImages[num]['page'] < currentPage ? 0
                : currentPage && bgImages[num]['page'] > currentPage ? Infinity
                : (elm.getBoundingClientRect().top + document.scrollingElement.scrollTop);
    bgBorders.push(value);
  });
}
// 背景変更処理
function bgChange(num){
  if(num != currentBg){
    console.log(`bgChange(${num})`);
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
  document.getElementById('image-box').showModal();
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
    document.getElementById('image-box').close();
    document.getElementById('image-box-image').src = '';
  });
})();

// BGM ----------------------------------------
let bgMusic;
let bgMusics = [];
let bgmBorders = [];
let currentBgm = 0;
const ytPlayerArea = document.getElementById('yt-player-area');
// Youtubeプレーヤー用意
function setYoutubePlayer(){
  console.log('setYoutubePlayer()');
  let tag = document.createElement('script');
  tag.id = "yt-api-cdn";
  tag.src = "https://www.youtube.com/player_api";
  let firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}
let ytPlayer;
function onYouTubePlayerAPIReady() {
  console.log('onYouTubePlayerAPIReady()');
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
  console.log('ytPlayerReady()');
  ytPlayer.mute();
  ytPlayerReadyOk = 1;
  soundVolumeChange();
}
function ytPlayerLoop(e) {
  console.log('ytPlayerLoop()');
  var ytStatus = e.target.getPlayerState();
  if (ytStatus == YT.PlayerState.ENDED) {
    ytPlayer.playVideo();
  }
}
// BGMURL取得・一覧にセット
function bgMusicSet(){
  console.log('bgMusicSet()');
  bgMusics = [{'url':'','title':'－','page':1}];
  let bgmExist = 0;
  document.querySelectorAll('.bgm-border').forEach(elm => {
    const page = Number(elm.closest(".logs").dataset.page);
    if(elm.dataset.url){
      bgMusics.push( {'url':elm.dataset.url, 'title':elm.dataset.title, 'vol':elm.dataset.vol, 'page':page } );
      bgmExist++;
    }
    else {
      bgMusics.push( {'url':'', 'title':'－', 'vol':0, 'page':page } );
    }
  });
  bgmBorderSet();
  if(!bgmExist){
    document.querySelector('#options-sound').style.display = 'none';
  }
  else {
    bgMusic = new Audio('');
    bgMusic.loop = true;
    bgMusic.muted = true;
    setYoutubePlayer();
    if(ytPlayer){ onYouTubePlayerAPIReady(); }
    document.getElementById('sound-confirm').showModal();
  }
}
// サウンド確認メッセージを閉じる
function soundConfirmClose(){
  document.getElementById('sound-confirm').close();
}
// BGM変更位置セット
function bgmBorderSet(){
  bgmBorders = [0];
  document.querySelectorAll('.bgm-border').forEach(elm => {
    const num = bgmBorders.length;
    const value = currentPage && bgMusics[num]['page'] < currentPage ? 0
                : currentPage && bgMusics[num]['page'] > currentPage ? Infinity
                : (elm.getBoundingClientRect().top + document.scrollingElement.scrollTop);
    bgmBorders.push(value);
  });
}
// BGM変更処理
function bgmChange(num){
  if(!ytPlayerReadyOk) return;
  if(num != currentBgm){
    console.log(`bgmChange(${num})`);
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
  if (pageTurning){
    if(pageTurning == 'bottom'){
      if(window.pageYOffset + document.getElementById( "foot-area" ).getBoundingClientRect().top > center) { pageTurning = 0; }
    }
    else { if(document.scrollingElement.scrollTop < center) { pageTurning = 0; } }
    return;
  }
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
  console.log('soundOn');
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
  console.log('soundOff');
  document.getElementById('option-mute-button').classList.add('muted');
  bgMusic.muted = true;
  ytPlayer.mute();
  ytPlayer.pauseVideo();
  muteOn = 1;
  ytPlayerArea.style.display = 'none';
}

// ボックス透過率 ----------------------------------------
let opacityValue = localStorage.getItem('ytchatLogsOpacity') || 0.7;
{
  const obj = document.getElementById('option-opacity');
  if(obj){
    obj.value = opacityValue;
    opacityChange();
    obj.addEventListener('input', e => {
      opacityValue = e.target.value;
      opacityChange();
      localStorage.setItem('ytchatLogsOpacity', opacityValue);
    });
  }
}
function opacityChange() {
  document.documentElement.style.setProperty('--box-bg-opacity', opacityValue);
  document.getElementById('option-opacity-view').innerHTML = Math.round(opacityValue * 100);
}

// フォントサイズ ----------------------------------------
let fontSize = localStorage.getItem('ytchatLogsFontSize') || 100;
{
  const obj = document.getElementById('option-font-size');
  if(obj){
    obj.value = fontSize;
    fontSizeChange();
    obj.addEventListener('input', e => {
      fontSize = e.target.value;
      fontSizeChange();
      localStorage.setItem('logs-fontSize', fontSize);
    });
  }
}
function fontSizeChange() {
  document.getElementById('contents').style.fontSize = fontSize+'%';
  document.getElementById('option-font-size-view').innerHTML = fontSize;
}
// フォント明暗 ----------------------------------------
let fontLightness = Number(localStorage.getItem('ytchatLogsFontLightness')) || 100;
if     (fontLightness <  50){ fontLightness =  50 }
else if(fontLightness > 100){ fontLightness = 100 }
{
  const obj = document.getElementById('option-font-lightness');
  if(obj){
    fontLightnessSet();
    
    obj.value = fontLightness;
    
    obj.addEventListener('input', e => {
      fontLightness = e.target.value;
      fontLightnessSet();
      localStorage.setItem('ytchatLogsLightness', fontLightness);
    });
  }
}
function fontLightnessSet() {
  document.documentElement.style.setProperty('--logs-font-color-lightness', fontLightness+'%');
  document.getElementById('option-font-lightness-view').innerHTML = fontLightness;
}

// フォント縁取り ----------------------------------------
let fontShadow = localStorage.getItem('ytchatLogsFontShadow') == 0 ? 0 : 1;
{
  const obj = document.getElementById('option-font-shadow');
  if(obj){
    fontShadowSet();
    obj.checked = fontShadow ? true : false;

    obj.addEventListener('change', e => {
      fontShadow = e.target.checked ? 1 : 0;
      fontShadowSet();
      localStorage.setItem('ytchatLogsFontShadow', fontShadow);
    });
  }
}
function fontShadowSet() {
  document.body.classList.toggle('no-text-shadow', !fontShadow)
}

// フォントファミリー ----------------------------------------
let config = localStorage.getItem('ytchatCommonConfig') ? JSON.parse(localStorage.getItem('ytchatCommonConfig')) : {};
config.fontFamily    ||= localStorage.getItem('fontFamily') || '';
config.fontFamilyMin ||= localStorage.getItem('fontFamilyMin') || '';
if(config.fontFamily) {
  fontFamilySet();
  document.getElementById('option-font-family-jp').value = config.fontFamily;
}
document.getElementById('option-font-family-jp').oninput = function (e){
  config.fontFamily = e.target.value;
  fontFamilySet();
  localStorage.setItem('ytchatCommonConfig', JSON.stringify(config));
};
function fontFamilySet() {
  document.documentElement.style.setProperty('--logs-font-family-jp', config.fontFamily);
}

if(config.fontFamilyMin) {
  fontFamilyMinSet();
  //document.getElementById('option-font-family-min').value = fontFamilyMin;
}
//document.getElementById('option-font-family-min').oninput = function (e){
//  fontFamilyMin = e.target.value;
//  fontFamilyMinSet();
//  localStorage.setItem('fontFamilyMin', fontFamilyMin);
//};
function fontFamilyMinSet() {
  document.documentElement.style.setProperty('--logs-font-family-min', config.fontFamilyMin);
}

// ログ保存 ----------------------------------------
let downloading = 0;
async function downloadAllLogs(evt){
  if(downloading){ return; }
  downloading = 1;
  document.getElementById('dl-button').style.cursor = 'wait';
  const title = document.querySelector('header h1').innerHTML || document.querySelector('header h2').innerHTML;
  let zip = new JSZip();
  zip.file('./lib/css/base.css',   await JSZipUtils.getBinaryContent('./lib/css/base.css'));
  zip.file('./lib/css/config.css', await JSZipUtils.getBinaryContent('./lib/css/config.css'));
  zip.file('./lib/css/logs.css',   await JSZipUtils.getBinaryContent('./lib/css/logs.css'));
  zip.file('./lib/js/logs.js',     await JSZipUtils.getBinaryContent('./lib/js/logs.js'));
  if(customCSS){ zip.file(customCSS, await JSZipUtils.getBinaryContent(customCSS)); }
  const url = location.href.replace(/#(.+)$/,'').replace(/&type=(.+?)(&|$)/,'').replace(/&page=(.+?)(&|$)/,'') + '&type=download';
  zip.file('log.html', await JSZipUtils.getBinaryContent(url));
  zip.generateAsync({type:"blob"})
    .then(function(content) {
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      document.body.appendChild(a);
      a.download = title+'.zip';
      a.href = url;
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      document.getElementById('dl-button').style.cursor = '';
      downloading = 0;
    });
}