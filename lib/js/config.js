"use strict";
// CONFIG
// ------------------------------
const numPath = './room/'+ roomId +'/log-num.dat';
const cgiPath = './index.cgi';
const checkTimeMem = 2000;
const maxLinage = 50;
let lastnumber = 0;
let selectedSheet = '';

let userId;

let mainTab = 1;

let tabList = {};

let nameList = {};

let unitList = {};