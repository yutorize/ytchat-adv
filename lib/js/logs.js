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
  bgImages = [defaultImage];
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
  document.querySelectorAll('.box').forEach(function(obj) {
    obj.style.backgroundColor = 'rgba(0,0,0,'+ opacityValue +')';
  });
  document.getElementById('option-opacity-view').innerHTML = Math.round(opacityValue * 100);
}

// フォントサイズ ----------------------------------------
let fontSizeValue = localStorage.getItem('logs-fontSize') || 100;
document.getElementById('option-fontsize').value = fontSizeValue;
fontSizeChange();
document.getElementById('option-fontsize').oninput = function (e){
  fontSizeValue = e.target.value;
  fontSizeChange();
  localStorage.setItem('logs-fontSize', fontSizeValue);
};
function fontSizeChange() {
  document.getElementById('contents').style.fontSize = fontSizeValue+'%';
  document.getElementById('option-fontsize-view').innerHTML = fontSizeValue;
}

// フォントサイズ ----------------------------------------
let fontFamilyValue = localStorage.getItem('fontFamily') || '';
if(fontFamilyValue) { document.getElementById('option-fontfamily').value = fontFamilyValue; }
fontFamilyChange();
document.getElementById('option-fontfamily').oninput = function (e){
  fontFamilyValue = e.target.value;
  fontFamilyChange();
  localStorage.setItem('fontFamily', fontFamilyValue);
};
function fontFamilyChange() {
  document.getElementById('contents').style.fontFamily = '"Lato",'+fontFamilyValue+',"BIZ UDGothic","Meiryo","YuKyokasho Yoko"';
}
