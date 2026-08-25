import React, { useState, useEffect, useRef } from 'react';
import './Calculator.css';

const SC_LOGO_URI = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAyOC4wLjAsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiA2LjAwIEJ1aWxkIDApICAtLT4NCjxzdmcgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiIHk9IjBweCINCgkgdmlld0JveD0iNDMwIDMwMCAxNjUgMTY1IiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDQzMCAzMDAgMTY1IDE2NTsiIHhtbDpzcGFjZT0icHJlc2VydmUiPg0KPHN0eWxlIHR5cGU9InRleHQvY3NzIj4NCgkuc3Qwe2ZpbGw6IzAwRkYwMDt9DQo8L3N0eWxlPg0KPGNpcmNsZSBjbGFzcz0ic3QwIiBjeD0iNTEyLjIiIGN5PSIzODMuNyIgcj0iNzYuNyIvPg0KPGc+DQoJPGc+DQoJCTxwYXRoIGQ9Ik00NzUuMiwzOTkuMmMtMC40LDAtMC43LDAuMS0xLjEsMC4xYy0wLjUsMC4xLTAuOSwwLjEtMS4zLDAuMmMtMS4xLDAuMi0yLjEsMC40LTMuMiwwLjdjLTEuMSwwLjItMi4zLDAuNS0zLjQsMC44DQoJCQljLTEuNSwwLjMtMi45LDAuNy00LjQsMWMtMC4yLDAuMS0wLjUsMC4xLTAuNywwLjJjLTAuNCwwLjItMC42LDAuNS0wLjUsMC45YzAsMC4yLDAuMSwwLjQsMC4yLDAuNmMwLjIsMC42LDAuNSwxLjIsMC43LDEuOA0KCQkJYzAuNiwxLjQsMS4yLDIuNywyLDRjMS41LDIuNywzLjQsNS4yLDUuNSw3LjVjMC41LDAuNSwxLDEuMSwxLjYsMS42YzAuOCwwLjgsMS43LDEuNiwyLjUsMi4zYzEuNSwxLjIsMywyLjQsNC42LDMuNQ0KCQkJYzIuMiwxLjUsNC42LDIuOSw3LDQuMmMxLjgsMC45LDMuNiwxLjgsNS41LDIuNmMyLjEsMC45LDQuMiwxLjcsNi4zLDIuNGMxLjcsMC42LDMuNCwxLDUuMSwxLjVjMS40LDAuNCwyLjgsMC43LDQuMiwxDQoJCQljMC44LDAuMiwxLjcsMC40LDIuNSwwLjVjMC45LDAuMiwxLjcsMC4zLDIuNiwwLjRjMC4zLDAsMC42LDAuMSwwLjksMC4xYzAuNCwwLDAuOCwwLjEsMS4yLDAuMWMwLjUsMCwxLDAuMSwxLjUsMC4xDQoJCQljMC42LDAsMS4xLDAuMSwxLjcsMC4xYzAuNiwwLDEuMiwwLjEsMS44LDAuMWMxLjEsMCwyLjIsMCwzLjMsMGMwLjgtMC4xLDEuNSwwLDIuMy0wLjFjMC41LDAsMS4xLTAuMSwxLjYtMC4xYzAsMCwwLjEsMCwwLjEsMA0KCQkJYzAuNCwwLDAuOC0wLjEsMS4yLTAuMWMwLjQsMCwwLjctMC4xLDEuMS0wLjFjMC43LTAuMSwxLjUtMC4yLDIuMi0wLjNjMS0wLjEsMi0wLjMsMy0wLjZjMS43LTAuNCwzLjQtMC44LDUuMS0xLjQNCgkJCWMzLjMtMSw2LjQtMi40LDkuNC00LjFjMi45LTEuNyw1LjUtMy42LDcuOS01LjljMC43LTAuNiwxLjMtMS4zLDEuOS0xLjljMC44LTAuOCwxLjUtMS43LDIuMi0yLjZjMS4xLTEuNSwyLjEtMywzLjEtNC42DQoJCQljMS4zLTIuMiwyLjMtNC41LDIuOS03YzAuMi0wLjksMC40LTEuOSwwLjYtMi44YzAuMS0wLjUsMC4xLTEsMC4yLTEuNWMwLjEtMC43LDAuMS0xLjMsMC4xLTJjMC4xLTEsMC0yLjEtMC4xLTMuMQ0KCQkJYy0wLjEtMC43LTAuMi0xLjUtMC4zLTIuMmMtMC4yLTEuMS0wLjUtMi4yLTAuOC0zLjNjLTAuOC0yLjUtMS44LTUtMy4yLTcuM2MtMS40LTIuNC0zLjEtNC42LTUtNi43Yy0xLjItMS4zLTIuNC0yLjUtMy43LTMuNg0KCQkJYy0xLjUtMS4zLTMtMi41LTQuNi0zLjZjLTIuMy0xLjYtNC44LTMuMS03LjMtNC40Yy0yLTEtNC0yLTYuMS0yLjljLTEuOS0wLjgtMy44LTEuNi01LjctMi4zYy0zLTEuMS02LTItOS0yLjcNCgkJCWMtMC45LTAuMi0xLjktMC40LTIuOC0wLjZjLTAuNi0wLjEtMS4yLTAuMi0xLjgtMC4zYy0wLjUtMC4xLTAuOS0wLjEtMS40LTAuMmMtMC4zLDAtMC43LTAuMS0xLjEtMC4xYy0wLjYtMC4xLTEuMS0wLjEtMS43LTAuMg0KCQkJYy0wLjEsMC0wLjEsMC0wLjIsMGMtMC42LTAuMS0xLjItMC4xLTEuOC0wLjJjLTAuNiwwLTEuMi0wLjEtMS44LTAuMWMtMC4xLDAtMC4xLDAtMC4yLDBjLTAuMywwLTAuNSwwLTAuOC0wLjENCgkJCWMtMC4zLDAtMC41LDAtMC44LTAuMWMtMC4xLDAuMS0wLjEsMC4xLTAuMiwwLjJjLTAuMiwwLTAuNCwwLTAuNiwwYy0wLjgsMC0xLjUsMC0yLjMsMGMtMC43LDAtMS4zLDAuMS0yLDAuMQ0KCQkJYy0wLjUsMC0wLjksMC4xLTEuNCwwLjFjLTAuNiwwLjEtMS4xLDAuMi0xLjcsMC4yYy0wLjksMC4xLTEuOCwwLjMtMi44LDAuNmMtMC4zLDAuMS0wLjUsMC4yLTAuOCwwLjJjLTAuMSwwLTAuMiwwLjEtMC4zLDAuMg0KCQkJYy0wLjQsMC4yLTAuNiwwLjYtMC42LDFjMCwwLjQsMCwwLjgsMC4xLDEuMmMwLjEsMC41LDAuMSwxLjEsMC4yLDEuNmMwLjEsMC44LDAuMywxLjYsMC40LDIuNGMwLjEsMC43LDAuMywxLjQsMC40LDINCgkJCWMwLjMsMS4xLDAuNiwyLjIsMSwzLjNjMCwwLjEsMC4xLDAuMiwwLjIsMC40YzAuMSwwLjIsMC4zLDAuMywwLjUsMC40YzAuMSwwLjEsMC4zLDAuMSwwLjUsMC4xYzAuNywwLDEuNCwwLDIuMSwwDQoJCQljMC43LDAsMS40LDAsMi4xLTAuMWMwLjYtMC4xLDEuMS0wLjEsMS43LTAuMWMwLDAsMC4xLDAsMC4xLDBjMC41LDAsMS0wLjEsMS40LTAuMWMwLjYsMCwxLjEtMC4xLDEuNy0wLjFjMCwwLDAuMSwwLDAuMSwwDQoJCQljMC44LTAuMSwxLjYtMC4xLDIuNC0wLjJjMC40LDAsMC45LDAsMS4zLDBjMS4xLDAsMi4yLDAsMy4zLDAuMWMwLDAsMC4xLDAsMC4xLDBjMC43LDAuMSwxLjMsMC4yLDIsMC4yYzAuNywwLjEsMS4zLDAuMiwyLDAuMw0KCQkJYzEsMC4yLDIsMC40LDIuOSwwLjZjMS45LDAuNSwzLjcsMSw1LjUsMS43YzIuNCwwLjksNC43LDIsNywzLjNjMS44LDEsMy42LDIuMSw1LjIsMy40YzEuNSwxLjIsMi45LDIuNSw0LjIsNA0KCQkJYzEuMywxLjUsMi40LDMuMiwzLjIsNS4xYzAuOSwyLjEsMS40LDQuMywxLjUsNi41YzAsMSwwLDIuMS0wLjEsMy4xYy0wLjEsMC45LTAuMywxLjgtMC42LDIuN2MtMC42LDIuMS0xLjUsNC0yLjcsNS45DQoJCQljLTAuOSwxLjQtMS45LDIuOC0zLjEsNC4xYy0xLjMsMS40LTIuNiwyLjctNC4xLDMuOWMtMiwxLjYtNC4yLDIuOS02LjYsMy45Yy0yLDAuOS00LjEsMS42LTYuMywyLjFjLTAuOCwwLjItMS41LDAuMy0yLjMsMC41DQoJCQljLTAuNiwwLjEtMS4xLDAuMi0xLjcsMC4yYy0wLjMsMC0wLjYsMC4xLTEsMC4xYy0wLjUsMC0xLDAuMS0xLjUsMC4xYy0xLjUsMC4xLTIuOSwwLjEtNC40LDBjLTAuMSwwLTAuMSwwLTAuMiwwDQoJCQljLTAuNSwwLTEuMS0wLjEtMS42LTAuMmMtMC40LDAtMC43LTAuMS0xLjEtMC4xYy0wLjUtMC4xLTEtMC4yLTEuNC0wLjJjLTAuOC0wLjEtMS43LTAuMy0yLjUtMC41Yy0xLjctMC40LTMuMy0wLjktNS0xLjUNCgkJCWMtMS43LTAuNi0zLjQtMS4zLTUtMmMtMi4zLTEuMS00LjYtMi40LTYuNy0zLjljLTEuMS0wLjgtMi4zLTEuNy0zLjMtMi43Yy0xLjItMS4xLTIuMy0yLjMtMy40LTMuNWMtMS4xLTEuNC0yLjItMi44LTMuMS00LjMNCgkJCWMtMC43LTEuMi0xLjQtMi40LTIuMS0zLjZjLTAuMy0wLjYtMC43LTEuMi0xLjEtMS44QzQ3NS43LDM5OS41LDQ3NS41LDM5OS4zLDQ3NS4yLDM5OS4yeiIvPg0KCQk8cGF0aCBkPSJNNTE4LjksNDA3LjljMC4xLDAsMC4xLDAsMC4yLDBjMC41LDAsMS4xLTAuMSwxLjYtMC4xYzAuOCwwLDEuNi0wLjEsMi4zLTAuMmMwLjctMC4xLDEuNS0wLjEsMi4yLTAuMg0KCQkJYzAuNy0wLjEsMS4zLTAuMSwyLTAuMmMwLjctMC4xLDEuNC0wLjIsMi4xLTAuM2MwLjgtMC4xLDEuNS0wLjMsMi4zLTAuNWMwLjIsMCwwLjQtMC4xLDAuNS0wLjJjMC4zLTAuMSwwLjQtMC4zLDAuNC0wLjcNCgkJCWMwLTAuMSwwLTAuMiwwLTAuM2MwLTAuMS0wLjEtMC4zLTAuMS0wLjRjLTAuMy0xLjItMC43LTIuMy0xLTMuNWMtMC4zLTEuMS0wLjctMi4zLTEuMS0zLjRjLTAuMy0wLjktMC42LTEuOC0wLjktMi42DQoJCQljLTAuMS0wLjItMC4yLTAuNC0wLjMtMC42Yy0wLjEtMC4yLTAuMi0wLjMtMC40LTAuM2MtMC4zLTAuMS0wLjUtMC4xLTAuOCwwYy0wLjIsMC0wLjUsMC0wLjcsMC4xYy0wLjcsMC0xLjQsMC4xLTIuMiwwLjENCgkJCWMwLDAsMCwwLDAsMGMtMC42LDAtMS4zLDAuMS0xLjksMC4xYy0wLjUsMC0xLjEsMC0xLjYsMC4xYy0wLjYsMC0xLjEsMC0xLjcsMC4xYy0wLjksMC4xLTEuOSwwLjEtMi44LDAuMWMtMSwwLTIuMSwwLTMuMS0wLjENCgkJCWMtMC4xLDAtMC4xLDAtMC4yLDBjLTAuNi0wLjEtMS4yLTAuMS0xLjgtMC4yYy0wLjQsMC0wLjgtMC4xLTEuMS0wLjFjLTAuNS0wLjEtMS4xLTAuMi0xLjYtMC4yYy0wLjgtMC4xLTEuNi0wLjItMi4zLTAuNA0KCQkJYy0wLjktMC4yLTEuOC0wLjQtMi43LTAuNmMtMi0wLjUtMy45LTEuMS01LjgtMS44Yy0xLjgtMC43LTMuNi0xLjUtNS4zLTIuNGMtMS4yLTAuNi0yLjQtMS4zLTMuNS0yLjFjLTEuNi0xLjEtMy4xLTIuMi00LjUtMy41DQoJCQljLTAuNy0wLjctMS40LTEuNC0yLjEtMi4yYy0xLTEuMi0xLjktMi41LTIuNi0zLjljLTEtMi4xLTEuNy00LjItMi02LjZjLTAuMS0wLjgtMC4xLTEuNi0wLjEtMi4zYzAtMC4zLDAtMC42LDAuMS0xDQoJCQljMC0wLjYsMC4xLTEuMywwLjItMS45YzAuMi0xLjIsMC41LTIuMywwLjktMy40YzAuNS0xLjUsMS4yLTIuOCwyLTQuMmMxLjctMi43LDMuNi01LjEsNi03LjJjMC45LTAuOCwxLjgtMS41LDIuOC0yLjINCgkJCWMxLjctMS4xLDMuNC0yLjEsNS4zLTIuOWMyLTAuOSw0LjEtMS41LDYuMi0yYzAuNy0wLjIsMS40LTAuMywyLjEtMC40YzAuNC0wLjEsMC45LTAuMSwxLjQtMC4yYzAuNCwwLDAuOC0wLjEsMS4xLTAuMQ0KCQkJYzAuNSwwLDEuMS0wLjEsMS42LTAuMWMxLjYsMCwzLjEtMC4xLDQuNywwYzAuNywwLjEsMS4zLDAuMSwyLDAuMmMwLjcsMC4xLDEuNCwwLjIsMi4xLDAuM2MwLjksMC4yLDEuNywwLjMsMi42LDAuNQ0KCQkJYzIuMiwwLjUsNC4zLDEuMiw2LjQsMmMyLjIsMC45LDQuNCwxLjksNi41LDNjMi40LDEuMyw0LjcsMi45LDYuOCw0LjhjMS4zLDEuMSwyLjQsMi40LDMuNSwzLjdjMS40LDEuOCwyLjcsMy44LDMuNyw1LjkNCgkJCWMwLjYsMS4zLDEuNSwyLjYsMi4yLDMuOGMwLjMsMC41LDAuNywwLjYsMS4zLDAuNWMwLjctMC4xLDEuNC0wLjMsMi0wLjRjMS0wLjIsMi0wLjQsMy0wLjdjMi42LTAuNyw1LjItMS41LDcuNy0yLjUNCgkJCWMwLjMtMC4xLDAuNi0wLjIsMC45LTAuNGMwLjQtMC4yLDAuNi0wLjUsMC42LTFjMC0wLjQtMC4xLTAuOS0wLjItMS4zYy0wLjUtMS41LTEuMi0zLTItNC40Yy0xLjEtMS45LTIuMy0zLjYtMy43LTUuMw0KCQkJYy0xLjItMS4zLTIuNC0yLjYtMy43LTMuOGMtMS41LTEuMy0zLjEtMi42LTQuNy0zLjdjLTIuNi0xLjktNS40LTMuNS04LjItNWMtMy41LTEuOC03LjEtMy40LTEwLjgtNC44Yy0yLjktMS4xLTUuOS0yLjEtOS0yLjgNCgkJCWMtMC43LTAuMi0xLjUtMC4zLTIuMi0wLjVjLTAuNy0wLjEtMS40LTAuMy0yLjEtMC40Yy0wLjQtMC4xLTAuOC0wLjEtMS4zLTAuMmMtMC40LTAuMS0wLjktMC4xLTEuMy0wLjJjLTAuNi0wLjEtMS4xLTAuMi0xLjctMC4yDQoJCQljLTAuNCwwLTAuNy0wLjEtMS4xLTAuMWMtMC42LTAuMS0xLjMtMC4xLTEuOS0wLjFjLTAuNywwLTEuNCwwLTIuMS0wLjFjLTEuNSwwLTIuOS0wLjEtNC40LDBjLTAuOCwwLTEuNywwLTIuNSwwLjENCgkJCWMtMC41LDAtMS4xLDAuMS0xLjYsMC4xYy0wLjIsMC0wLjUsMC4xLTAuNywwLjFjLTAuMywwLTAuNiwwLjEtMSwwLjFjLTAuMywwLTAuNiwwLjEtMSwwLjFjLTAuNSwwLjEtMSwwLjEtMS41LDAuMg0KCQkJYy0wLjYsMC4xLTEuMiwwLjItMS45LDAuM2MtMC43LDAuMS0xLjQsMC4zLTIuMSwwLjRjLTEuNSwwLjMtMywwLjgtNC41LDEuMmMtMi41LDAuNy01LDEuNy03LjQsMi45Yy0yLjIsMS4xLTQuMywyLjQtNi4zLDMuOQ0KCQkJYy0xLjUsMS4xLTIuOSwyLjMtNC4yLDMuNmMtMC42LDAuNi0xLjIsMS4yLTEuNywxLjhjLTAuOCwwLjgtMS41LDEuNy0yLjIsMi42Yy0xLDEuMy0yLDIuNy0yLjgsNC4yYy0xLjMsMi4xLTIuMyw0LjQtMyw2LjgNCgkJCWMtMC40LDEuNS0wLjcsMy0wLjksNC41Yy0wLjEsMC43LTAuMSwxLjQtMC4yLDIuMWMwLDEuMSwwLDIuMywwLjIsMy40YzAuMSwwLjUsMC4xLDEuMSwwLjIsMS42YzAuMiwxLjMsMC41LDIuNiwwLjksMy45DQoJCQljMC43LDIuNCwxLjcsNC42LDMsNi43YzEuNCwyLjQsMyw0LjUsNC44LDYuNWMxLjMsMS40LDIuNywyLjgsNC4yLDRjMS40LDEuMiwyLjksMi4zLDQuNSwzLjRjMS45LDEuMywzLjgsMi40LDUuOCwzLjUNCgkJCWMyLjgsMS41LDUuNiwyLjksOC42LDQuMWMyLjUsMSw1LDEuOSw3LjYsMi43YzIuMSwwLjYsNC4zLDEuMiw2LjQsMS42YzEuMSwwLjIsMi4xLDAuNCwzLjIsMC42YzAuNywwLjEsMS41LDAuMiwyLjIsMC4zDQoJCQljMC43LDAuMSwxLjMsMC4yLDIsMC4yYzAuNywwLjEsMS40LDAuMSwyLjEsMC4yYzAuNywwLDEuNSwwLjEsMi4yLDAuMWMwLjUsMCwwLjksMCwxLjQsMGMwLjQsMCwwLjksMCwxLjMsMA0KCQkJQzUxOC44LDQwNy44LDUxOC44LDQwNy44LDUxOC45LDQwNy45eiIvPg0KCTwvZz4NCjwvZz4NCjwvc3ZnPg0K';
const BCV_LOGO_URI = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2ZmZiIgcng9IjEwIi8+PHRleHQgeD0iNTAiIHk9IjU1IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMzUiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSIjMDc4YjM1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5CQ1Y8L3RleHQ+PC9zdmc+';

function parseNum(v){
  if(typeof v === 'number') return Number.isFinite(v) ? v : 0;
  let s = String(v ?? '').trim().replace(/\s/g,'');
  if(!s) return 0;
  if(s.includes(',') && s.includes('.')){
    if(s.lastIndexOf(',') > s.lastIndexOf('.')) s = s.replace(/\./g,'').replace(',','.');
    else s = s.replace(/,/g,'');
  } else if(s.includes(',')) {
    s = s.replace(',','.');
  }
  const n = Number(s.replace(/[^\d.-]/g,''));
  return Number.isFinite(n) ? n : 0;
}

function fmt(n, decimals=2){
  return Number(n||0).toLocaleString('es-VE',{minimumFractionDigits:decimals,maximumFractionDigits:decimals});
}

function loadCanvasImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function roundRect(ctx, x, y, w, h, r, fill, stroke) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
}

export default function Calculator() {
  const [usdTotal, setUsdTotal] = useState('16,00');
  const [bcvRate, setBcvRate] = useState('');
  const [discountBase, setDiscountBase] = useState('16,00');
  const [prices, setPrices] = useState(['12,00', '3,50', '', '', '', '']);
  const [rateStatus, setRateStatus] = useState({ text: 'Cargando...', state: 'warn' });
  const [footerMsg, setFooterMsg] = useState('Cambio BCV: intentando actualización automática desde fuente BCV.');
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  const canvasRef = useRef(null);

  const dateStr = new Date().toLocaleDateString('es-VE', { day: 'numeric', month: 'long', year: 'numeric' });

  useEffect(() => {
    const savedUsd = parseNum(localStorage.getItem('sc_usd'));
    if (savedUsd > 0) {
      setUsdTotal(fmt(savedUsd));
      setDiscountBase(fmt(savedUsd));
    }
    const savedPrices = JSON.parse(localStorage.getItem('sc_prices') || 'null');
    if (Array.isArray(savedPrices)) {
      setPrices(prev => prev.map((p, i) => savedPrices[i] !== undefined ? savedPrices[i] : p));
    }
    fetchBCV();
  }, []);

  const fetchBCV = async () => {
    setRateStatus({ text: 'Consultando...', state: 'warn' });
    setFooterMsg('Cambio BCV: consultando cotización oficial.');
    try {
      const r = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', { cache: 'no-store' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const d = await r.json();
      const rate = Number(d.promedio);
      if (!Number.isFinite(rate) || rate <= 0) throw new Error('Tasa inválida');
      
      setBcvRate(fmt(rate, 4));
      localStorage.setItem('sc_bcv', rate.toString());
      localStorage.setItem('sc_bcv_updated', d.fechaActualizacion || new Date().toISOString());
      setRateStatus({ text: 'BCV automático', state: 'ok' });
      setFooterMsg('Cambio BCV actualizado automáticamente · Fuente: DolarApi / BCV');
    } catch (e) {
      const saved = parseNum(localStorage.getItem('sc_bcv'));
      if (saved > 0) {
        setBcvRate(fmt(saved, 4));
        setRateStatus({ text: 'Último valor guardado', state: 'warn' });
        setFooterMsg('No se pudo consultar la tasa ahora. Se mantiene el último valor guardado; puede editarlo manualmente.');
      } else {
        setRateStatus({ text: 'Ingrese la tasa', state: 'warn' });
        setFooterMsg('No se pudo consultar la tasa automáticamente. Ingrese la tasa BCV manualmente.');
      }
    }
  };

  const handleUsdChange = (val) => {
    setUsdTotal(val);
    localStorage.setItem('sc_usd', parseNum(val).toString());
  };

  const handleUsdBlur = () => setUsdTotal(fmt(parseNum(usdTotal)));
  const handleBcvBlur = () => setBcvRate(fmt(parseNum(bcvRate), 4));
  const handleDiscountBlur = () => setDiscountBase(fmt(parseNum(discountBase)));

  const updatePrice = (index, val) => {
    const newPrices = [...prices];
    newPrices[index] = val;
    setPrices(newPrices);
    localStorage.setItem('sc_prices', JSON.stringify(newPrices));
  };

  const handlePriceBlur = (index) => {
    const newPrices = [...prices];
    newPrices[index] = fmt(parseNum(newPrices[index]));
    setPrices(newPrices);
    localStorage.setItem('sc_prices', JSON.stringify(newPrices));
  };

  const pricesTotalNum = prices.reduce((acc, p) => acc + parseNum(p), 0);
  const vesTotalNum = parseNum(usdTotal) * parseNum(bcvRate);
  const discountAmountNum = parseNum(discountBase) * 0.20;
  const discountFinalNum = parseNum(discountBase) * 0.80;

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2200);
  };

  const usePricesTotal = () => {
    setUsdTotal(fmt(pricesTotalNum));
    setDiscountBase(fmt(pricesTotalNum));
    localStorage.setItem('sc_usd', pricesTotalNum.toString());
    triggerToast('Total de precios colocado en el resumen');
  };

  const useDiscountTotal = () => {
    setUsdTotal(fmt(discountFinalNum));
    localStorage.setItem('sc_usd', discountFinalNum.toString());
    triggerToast('Total con 20% de descuento colocado en el resumen');
  };

  const drawExport = async () => {
    const c = canvasRef.current;
    if(!c) return null;
    const ctx = c.getContext('2d');
    const W = c.width, H = c.height;
    const usd = parseNum(usdTotal), rate = parseNum(bcvRate), ves = usd * rate;
    
    const [scLogo, bcvLogo] = await Promise.all([
      loadCanvasImage(SC_LOGO_URI),
      loadCanvasImage(BCV_LOGO_URI)
    ]);

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);

    ctx.shadowColor = 'rgba(0,0,0,.12)'; ctx.shadowBlur = 26; ctx.shadowOffsetY = 10;
    roundRect(ctx, 50, 50, 980, 1340, 28, '#ffffff');
    ctx.shadowColor = 'transparent';

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(50, 50, 980, 205, [28, 28, 0, 0]);
    ctx.clip();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(50, 50, 980, 205);
    ctx.restore();

    ctx.drawImage(scLogo, 88, 72, 128, 128);
    ctx.drawImage(bcvLogo, 864, 75, 122, 122);

    ctx.fillStyle = '#4b5563';
    ctx.font = '800 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('FECHA ACTUAL', 540, 112);
    ctx.fillStyle = '#078B35';
    ctx.font = '900 43px Arial';
    ctx.fillText(dateStr, 540, 165);
    ctx.textAlign = 'left';

    ctx.fillStyle = '#078B35';
    ctx.fillRect(90, 232, 900, 4);

    function line(y) {
      ctx.strokeStyle = '#d5d9de'; ctx.lineWidth = 2; ctx.setLineDash([7, 7]);
      ctx.beginPath(); ctx.moveTo(100, y); ctx.lineTo(980, y); ctx.stroke(); ctx.setLineDash([]);
    }
    function metric(label, value, unit, y, color = '#090b0d') {
      ctx.fillStyle = '#44484f'; ctx.font = '800 19px Arial'; ctx.fillText(label, 100, y);
      ctx.fillStyle = color; ctx.font = '900 74px Arial'; ctx.fillText(value, 100, y + 87);
      roundRect(ctx, 865, y + 16, 105, 78, 16, '#edf8f0');
      ctx.fillStyle = '#078b35'; ctx.font = '700 35px Arial'; ctx.textAlign = 'center';
      ctx.fillText(unit, 918, y + 67); ctx.textAlign = 'left';
    }

    metric('TOTAL EN $', fmt(usd), '$', 292);
    line(420);
    metric('CAMBIO BCV DEL DÍA', fmt(rate, 4), '↗', 474);
    line(602);
    metric('TOTAL EN BOLÍVARES', fmt(ves), 'Bs.', 656, '#057a2a');

    roundRect(ctx, 90, 1192, 900, 133, 18, '#fff2f4', '#ff9aa5');
    ctx.fillStyle = '#ff4b5e'; ctx.beginPath(); ctx.arc(145, 1258, 31, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '900 31px Arial'; ctx.textAlign = 'center'; ctx.fillText('!', 145, 1269); ctx.textAlign = 'left';
    ctx.fillStyle = '#ef2035'; ctx.font = '800 20px Arial';
    ctx.fillText('EL HORARIO DE RECEPCIÓN DE PAGOS ES HASTA LAS 5:00 P.M', 195, 1245);
    ctx.fillText('NO ACEPTAMOS PAGOS FUERA DEL HORARIO COMERCIAL', 195, 1282);

    return c;
  };

  const canvasToBlob = async (c) => {
    return await new Promise(resolve => c.toBlob(resolve, 'image/png', 1));
  };

  const downloadBlob = (blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    const d = new Date();
    a.download = `pago-sellos-chacaito-${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}.png`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const handleCopy = async () => {
    const c = await drawExport();
    if(!c) return;
    const blob = await canvasToBlob(c);
    try {
      if (!navigator.clipboard || !window.ClipboardItem) throw new Error('Clipboard no disponible');
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      triggerToast('Imagen copiada. Péguela en WhatsApp con Ctrl + V');
    } catch (e) {
      downloadBlob(blob);
      triggerToast('El navegador bloqueó la copia. Se descargó el PNG.');
    }
  };

  const handleDownload = async () => {
    const c = await drawExport();
    if(!c) return;
    downloadBlob(await canvasToBlob(c));
    triggerToast('PNG descargado');
  };

  return (
    <div className="calculator-wrapper">
      <main className="app">
        <div className="brand">
          <img className="brand-logo" src={SC_LOGO_URI} alt="Sellos Chacaito" />
          <div>
            <h1>Sellos Chacaito</h1>
            <p>Calculadora de Pagos</p>
          </div>
        </div>

        <section className="grid">
          <div>
            <article className="glass-card" id="summaryCard" style={{ overflow: 'hidden' }}>
              <div className="summary-header">
                <img className="summary-logo sc-logo" src={SC_LOGO_URI} alt="Sellos Chacaito" />
                <div className="summary-date">
                  <div className="eyebrow">Fecha actual</div>
                  <div id="dateText">{dateStr}</div>
                </div>
                <img className="summary-logo bcv-logo" src={BCV_LOGO_URI} alt="Banco Central de Venezuela" />
              </div>

              <div className="summary-body">
                <div className="metric">
                  <div className="metric-top"><label htmlFor="usdTotal">Total en $</label></div>
                  <div className="metric-input-row">
                    <input 
                      className="big-input" 
                      id="usdTotal" 
                      inputMode="decimal" 
                      value={usdTotal} 
                      onChange={e => handleUsdChange(e.target.value)}
                      onBlur={handleUsdBlur}
                      onFocus={e => e.target.select()}
                      aria-label="Total en dólares" 
                    />
                    <div className="unit">$</div>
                  </div>
                </div>

                <div className="metric">
                  <div className="metric-top">
                    <label htmlFor="bcvRate">Cambio BCV del día</label>
                    <div className="rate-wrap">
                      <span className="rate-status"><span className={`dot ${rateStatus.state}`}></span><span>{rateStatus.text}</span></span>
                      <button className="refresh" type="button" onClick={fetchBCV}>Actualizar</button>
                    </div>
                  </div>
                  <div className="metric-input-row">
                    <input 
                      className="big-input" 
                      id="bcvRate" 
                      inputMode="decimal" 
                      value={bcvRate} 
                      onChange={e => {
                        setBcvRate(e.target.value);
                        if(parseNum(e.target.value) > 0) localStorage.setItem('sc_bcv', parseNum(e.target.value).toString());
                      }}
                      onBlur={handleBcvBlur}
                      onFocus={e => e.target.select()}
                      placeholder="0,00" 
                      aria-label="Tasa BCV" 
                    />
                    <div className="unit">↗</div>
                  </div>
                </div>

                <div className="metric">
                  <div className="metric-top"><label>Total en bolívares</label></div>
                  <div className="metric-input-row">
                    <input className="big-input green" value={fmt(vesTotalNum)} readOnly aria-label="Total en bolívares" />
                    <div className="unit">Bs.</div>
                  </div>
                </div>

                <div className="alert">
                  <div className="alert-icon">!</div>
                  <div>
                    El horario de recepción de pagos es hasta las 5:00 P.M<br />
                    No aceptamos pagos fuera del horario comercial
                  </div>
                </div>
              </div>
            </article>

            <div className="actions">
              <button className="calc-action-btn primary" type="button" onClick={handleCopy}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                </svg>
                <span>Copiar Imagen</span>
              </button>

              <button className="calc-action-btn secondary" type="button" onClick={handleDownload}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                  <circle cx="9" cy="9" r="2"/>
                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                </svg>
                <span>Descargar PNG</span>
              </button>

              <button 
                className="calc-action-btn secondary" 
                type="button" 
                onClick={() => {
                  const paymentId = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
                  const url = `${window.location.origin}/pagar?monto=${parseNum(usdTotal)}&id=${paymentId}`;
                  const fullText = `¡Hola! Por acá te dejamos el link para completar tus datos de facturación y adjuntar tu comprobante:\n\n${url}\n\nAl finalizar, se nos enviará todo listo para agilizar tu entrega. ¡Feliz día!`;
                  navigator.clipboard.writeText(fullText);
                  triggerToast('¡Mensaje y link de pago copiados!');
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
                <span>Copiar Link de Pago</span>
              </button>
            </div>
          </div>

          <aside className="stack">
            <article className="glass-card panel">
              <div className="panel-title">
                <span>☷ &nbsp; LISTA DE PRECIOS</span>
                <span className="badge">6 casillas</span>
              </div>
              <div className="prices">
                {prices.map((price, i) => (
                  <div className="price-row" key={i}>
                    <div className="num">{i + 1}</div>
                    <div className="input-shell">
                      <input 
                        className="price-input" 
                        inputMode="decimal" 
                        value={price}
                        onChange={e => updatePrice(i, e.target.value)}
                        onBlur={() => handlePriceBlur(i)}
                        onFocus={e => e.target.select()}
                      />
                      <span className="suffix">$</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="total-strip">
                <b>TOTAL</b>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="total-value">{fmt(pricesTotalNum)} $</span>
                  <button className="mini-action" type="button" onClick={usePricesTotal}>Usar total</button>
                </div>
              </div>
            </article>

            <article className="card panel">
              <div className="panel-title">
                <span>% &nbsp; CALCULAR 20% DE DESCUENTO</span>
              </div>
              <div className="discount-grid">
                <div className="field-card">
                  <div className="field-label">Monto original ($)</div>
                  <div className="input-shell">
                    <input 
                      className="discount-input" 
                      inputMode="decimal" 
                      value={discountBase} 
                      onChange={e => setDiscountBase(e.target.value)}
                      onBlur={handleDiscountBlur}
                      onFocus={e => e.target.select()}
                    />
                    <span className="suffix">$</span>
                  </div>
                </div>
                <div className="field-card greenish">
                  <div className="field-label">20% descuento</div>
                  <div className="discount-amount"><span>{fmt(discountAmountNum)}</span><span>$</span></div>
                </div>
              </div>
              <div className="discount-total" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px' }}>
                <div style={{ textAlign: 'left' }}>
                  <div className="caption" style={{ margin: 0 }}>Total con descuento</div>
                  <div className="number" style={{ fontSize: '28px', lineHeight: 1.1 }}><span>{fmt(discountFinalNum)}</span> $</div>
                </div>
                <button className="mini-action" type="button" onClick={useDiscountTotal} style={{ background: 'white', borderColor: 'var(--green)', color: '#087f30' }}>
                  Usar total
                </button>
              </div>
            </article>
          </aside>
        </section>

        <footer>{footerMsg}</footer>
      </main>

      <canvas ref={canvasRef} width="1080" height="1440" hidden></canvas>
      <div className={`toast ${showToast ? 'show' : ''}`}>{toastMsg}</div>
    </div>
  );
}
