"use strict";
// スマホUI
// ------------------------------

function menuToggle(){
  document.getElementById('menubar').classList.toggle('open');
  document.getElementById('footer').classList.toggle('open');
  
  document.getElementById('sidebar').classList.remove('open');
}
function sideToggle(){
  document.getElementById('sidebar').classList.toggle('open');
  
  document.getElementById('menubar').classList.remove('open');
  document.getElementById('footer').classList.remove('open');
}