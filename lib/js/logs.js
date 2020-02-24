"use strict";
// LOGS
// ------------------------------
let mainTab = 1;

window.onload = function(){
  let lines = document.querySelectorAll('[data-tab="1"]');
  for(let i=0; i<lines.length; i++){
    lines[i].classList.add('main');
  };
  secretView();
  bgImageSet();
  bgScroll();
  
  const resizeObserver = new ResizeObserver(entries => {
    bgBorderSet();
  });
  resizeObserver.observe(document.getElementById('base'));
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
      bgImages.push(defaultImage);
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
// スクロール時該当背景チェック
function bgScroll(){
  const center = window.innerHeight / 2;
  for (let i = bgBorders.length-1; i>=0; i--) {
    if (document.scrollingElement.scrollTop > bgBorders[i] - center) {
      bgChange(i);
      break;
    }
  }
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