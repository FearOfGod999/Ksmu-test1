/* KSMU Community Nova — clean presentation layer on top of V8.7.1 state & handlers.
   It does not alter Supabase credentials, the underlying notes, or the original records. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const icon=(name,size=20)=>{
 const paths={
  home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
  grid:'<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  cal:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 11h18"/>',
  flag:'<path d="M5 21V4m0 1c6-4 8 4 15 0v11c-7 4-9-4-15 0"/>',
  link:'<path d="M10 13a5 5 0 0 0 7 .5l3-3a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7-.5l-3 3a5 5 0 0 0 7 7l2-2"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M2 12h3M19 12h3M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
  chevron:'<path d="m9 18 6-6-6-6"/>',
  left:'<path d="m15 18-6-6 6-6"/>',
  down:'<path d="m6 9 6 6 6-6"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/>',
  moon:'<path d="M21 13A9 9 0 0 1 11 3a9 9 0 1 0 10 10z"/>',
  monitor:'<rect x="3" y="4" width="18" height="14" rx="2"/><path d="M8 21h8m-4-3v3"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/>',
  book:'<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 1 4 17.5zm0 13A2.5 2.5 0 0 1 6.5 15H20"/>',
  upload:'<path d="M12 16V3m-5 5 5-5 5 5M4 17v4h16v-4"/>',
  alert:'<path d="M12 3 2 21h20L12 3zM12 9v5m0 3h.01"/>',
  external:'<path d="M13 3h8v8m0-8-10 10"/><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/>',
  mail:'<rect x="2" y="4" width="20" height="16" rx="3"/><path d="m3 6 9 7 9-7"/>',
  shield:'<path d="M12 22c6-3 8-7 8-12V5l-8-3-8 3v5c0 5 2 9 8 12z"/><path d="m9 12 2 2 4-4"/>',
  check:'<path d="m5 12 5 5L20 7"/>',
  logout:'<path d="M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4m4-4 5-5-5-5m5 5H9"/>',
  info:'<circle cx="12" cy="12" r="10"/><path d="M12 11v6m0-10h.01"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/>',
  menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
  telegram:'<path d="m22 2-7 20-4-9-9-4 20-7zm0 0L11 13"/>',
  pause:'<path d="M8 4v16M16 4v16"/>',
  file:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>'
 };
 return `<svg class="n-ic" xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.grid}</svg>`;
};
const clean=(v)=>esc(String(v??''));
const nav=[['profile','user','Мой профиль'],['today','home','Сегодня'],['schedule','grid','Расписание'],['calendar','cal','Календарь'],['modules','flag','Модули'],['resources','link','Полезное']];
const other=[['search','search','Поиск'],['settings','settings','Настройки'],['contacts','mail','Контакты'],['import','upload','Импорт расписания']];
let extra=null, chooserState={program:'lechebnoe',course:'3',query:''};
let modalSlot=null;
const heroLogo=()=>{
 const img=document.querySelector('.mini-logo img')||document.querySelector('.chooser-logo img');
 return img?img.src:'./icon-192.png';
};
const legacySetView=setView, legacyRenderToday=renderToday, legacyShowChooser=showGroupChooser, legacyHideChooser=hideGroupChooser;
const legacyActivate=activateStudyGroup, legacyApplyTheme=applyTheme;
const main=document.querySelector('#appRoot main');
const shell=document.createElement('div');shell.className='n-shell';
const side=document.createElement('aside');side.className='n-side';side.id='n-side-drawer';side.setAttribute('aria-label','Навигация KSMU Community');side.setAttribute('aria-hidden','true');side.inert=true;
const shade=document.createElement('button');shade.type='button';shade.className='n-drawer-shade';shade.id='n-drawer-shade';shade.setAttribute('aria-label','Закрыть меню');shade.tabIndex=-1;
side.innerHTML=`<div class="n-drawer-head"><div class="n-brand"><img alt="Герб КГМУ" src="${heroLogo()}"><div><strong>KSMU <span>Community</span></strong><small>КГМУ · студенческий сервис</small></div></div><button id="n-drawer-close" class="n-drawer-close" type="button" aria-label="Закрыть меню">${icon('left',20)}</button></div><button type="button" class="n-drawer-group" id="n-drawer-group">${icon('grid',18)}<span>Сменить группу · <b id="n-drawer-group-label">—</b></span>${icon('chevron',16)}</button>
 <div class="n-side-label">ПРОСТРАНСТВО СТУДЕНТА</div><nav aria-label="Основная навигация">${nav.map(n=>`<button class="n-nav" data-nview="${n[0]}">${icon(n[1])}<span>${n[2]}</span></button>`).join('')}</nav>
 <div class="n-side-label">АККАУНТ И СЕРВИСЫ</div><nav aria-label="Дополнительная навигация">${other.map(n=>`<button class="n-nav" data-nview="${n[0]}">${icon(n[1])}<span>${n[2]}</span></button>`).join('')}</nav>
 <div class="n-side-bottom"><span class="n-dot"></span> Расписание осень 2026/27 <small>Тестовая версия · КГМУ</small></div>`;
const content=document.createElement('div');content.className='n-content';
const top=document.createElement('header');top.className='n-top';
top.innerHTML=`<button class="n-menu-button" type="button" id="n-menu-button" aria-label="Открыть меню" aria-controls="n-side-drawer" aria-expanded="false">${icon('menu',22)}</button><div class="n-top-brand"><img alt="Герб КГМУ" src="${heroLogo()}"><strong>KSMU</strong><span>Community</span></div><div class="n-top-context"><span class="n-top-eyebrow" id="n-top-eyebrow">ВАШЕ РАСПИСАНИЕ</span><h1 id="n-top-title">Сегодня</h1></div>
<div class="n-top-actions"><button class="n-group-button" id="n-change-group" title="Выбрать группу">${icon('grid',18)} <span id="n-group-label">Группа</span> ${icon('down',15)}</button><button class="n-icon-button" id="n-search" title="Поиск" aria-label="Поиск">${icon('search')}</button><button class="n-avatar" data-nview="profile" title="Профиль" aria-label="Профиль">${icon('user')}</button></div>`;
content.append(top,main);shell.append(content);
document.getElementById('appRoot').prepend(shell);document.getElementById('appRoot').append(shade,side);

const home=document.createElement('div');home.id='n-home';home.className='n-home';$('todayView').prepend(home);
const chooser=document.createElement('section');chooser.id='n-chooser';chooser.className='n-chooser';chooser.hidden=true;
chooser.innerHTML=`<div class="n-chooser-layout"><aside class="n-chooser-intro"><div class="n-brand n-chooser-brand"><img alt="Герб КГМУ" src="${heroLogo()}"><div><strong>KSMU <span>Community</span></strong><small>КГМУ · расписание занятий</small></div></div><div><span class="n-kicker">НАЧНИТЕ ЗДЕСЬ</span><h1>Ваш университет.<br><em>Ваш ритм.</em></h1><p>Выберите направление и группу один раз — дальше покажем только нужные занятия, модули и изменения.</p></div><div class="n-chooser-footer">© 2026 КГМУ · Студенческий проект</div></aside>
<div class="n-chooser-form"><div class="n-chooser-head"><div><span class="n-kicker">ШАГ 01 / 03</span><h2>Выберите группу</h2><p>В любой момент можно изменить выбор в шапке или настройках.</p></div><button type="button" id="n-chooser-back" class="n-small" hidden>${icon('left')} Назад</button></div><h3>Направление подготовки</h3><div id="n-chooser-programs" class="n-programs"></div><div class="n-chooser-row"><div><h3>Курс</h3><div id="n-chooser-courses" class="n-courses"></div></div><div><h3>Найти группу</h3><label class="n-search-field">${icon('search',17)}<input id="n-group-search" placeholder="Например, 1307" autocomplete="off" inputmode="search"></label></div></div><div class="n-chooser-groups-head"><h3>Группы</h3><span id="n-chooser-count"></span></div><div id="n-chooser-groups" class="n-groups"></div></div></div>`;
document.body.insertBefore(chooser,document.getElementById('appRoot'));
const extras=document.createElement('div');extras.id='n-extra';extras.hidden=true;
extras.innerHTML=`
<section class="n-extra-page" id="n-resources"><div class="n-section-head"><span class="n-kicker">ВСЁ ПОЛЕЗНОЕ</span><h2>Студенческие сервисы</h2><p>Ссылки университета, кафедры и образовательные материалы — в одном месте.</p></div><div class="n-resource-grid">
 <a href="https://kazangmu.ru/" target="_blank" rel="noopener noreferrer" class="n-resource">${icon('external')}<div><strong>Сайт КГМУ</strong><small>Новости, учебный процесс и документы</small></div>${icon('arrow')}</a>
 <a href="https://lk.kazangmu.ru/" target="_blank" rel="noopener noreferrer" class="n-resource">${icon('user')}<div><strong>Личный кабинет КГМУ</strong><small>Официальный кабинет студента</small></div>${icon('arrow')}</a>
 <a href="https://kazangmu.ru/obuchenie/studentam/raspisanie-zanyatij" target="_blank" rel="noopener noreferrer" class="n-resource">${icon('cal')}<div><strong>Официальные расписания</strong><small>Файлы, опубликованные университетом</small></div>${icon('arrow')}</a>
 <a href="https://t.me/libavicenna" target="_blank" rel="noopener noreferrer" class="n-resource">${icon('book')}<div><strong>LibAvicenna</strong><small>База знаний и сообщество студентов</small></div>${icon('arrow')}</a>
 <a href="https://e.kazangmu.ru/" target="_blank" rel="noopener noreferrer" class="n-resource">${icon('book')}<div><strong>Образовательный портал</strong><small>Дистанционное обучение · e.kazangmu.ru</small></div>${icon('arrow')}</a>
 <a href="https://kazangmu.ru/departments" target="_blank" rel="noopener noreferrer" class="n-resource">${icon('grid')}<div><strong>Все кафедры КГМУ</strong><small>Официальный каталог кафедр со ссылками на каждую</small></div>${icon('arrow')}</a></div></section>
<section class="n-extra-page" id="n-contacts"><div class="n-section-head"><span class="n-kicker">СВЯЗАТЬСЯ С НАМИ</span><h2>Контакты команды</h2><p>Заметили ошибку или есть предложение? Напишите разработчикам.</p></div>
<div class="n-contact-grid"><div class="n-contact-card"><span>РАЗРАБОТКА САЙТА</span><a href="https://t.me/brainfucker01" target="_blank" rel="noopener noreferrer">@brainfucker01 ${icon('external',16)}</a><a href="mailto:fearofgod999@mail.ru">fearofgod999@mail.ru</a></div><div class="n-contact-card"><span>TELEGRAM-БОТ И MINI APP</span><a href="https://t.me/dkkk111111" target="_blank" rel="noopener noreferrer">@dkkk111111 ${icon('external',16)}</a></div></div><button class="n-primary" id="n-report" type="button">${icon('alert',17)} Сообщить о проблеме</button></section>
<section class="n-extra-page" id="n-profile"><div class="n-section-head"><span class="n-kicker">ЛИЧНЫЙ КАБИНЕТ</span><h2>Профиль студента</h2><p>Вход редактора по логину и паролю, а также подготовленная авторизация через Telegram.</p></div><div class="n-profile-card"><div class="n-profile-avatar">${icon('user',32)}</div><div><h3 id="n-auth-name">Гостевой режим</h3><p id="n-auth-meta">Расписание доступно без регистрации.</p></div></div><div id="n-password-auth" class="n-password-auth"><div class="n-password-intro"><b>Вход по логину и паролю</b><span id="n-password-state">Используйте учётную запись редактора Supabase для доступа к серверным записям.</span></div></div><div class="n-auth-actions"><button type="button" data-nview="settings" class="n-secondary">${icon('settings')} Настройки</button><button type="button" id="n-auth-login" class="n-primary">${icon('telegram')} Войти через Telegram</button><button type="button" id="n-auth-logout" class="n-secondary" hidden>${icon('logout')} Выйти</button></div><div class="n-hint" id="n-auth-hint">Вход в Telegram Mini App проверяется на сервере. Выдача прав администратора возможна только уполномоченным лицом и записывается в журнал.</div><div class="n-info-panel">${icon('shield')} <span>Вход в Telegram <b>не подтверждает</b> статус студента КГМУ. Для университетских данных понадобится отдельная проверка личности.</span></div></section>
<section class="n-extra-page" id="n-import"><div class="n-section-head"><span class="n-kicker">ДЛЯ СЕКРЕТАРИАТА И РЕДАКТОРОВ</span><h2>Импорт расписания</h2><p>Проверяйте файл и сравнивайте занятия без входа. Отправить проверенный пакет на сервер может только редактор с подтверждёнными правами.</p></div><div class="n-import-steps"><span>1. Загрузить</span>${icon('arrow',16)}<span>2. Проверить</span>${icon('arrow',16)}<span>3. Утвердить</span></div>
<div class="n-import-card"><label for="n-upload-file">Файл Excel, CSV или JSON по шаблону KSMU</label><input type="file" id="n-upload-file" accept=".json,.csv,application/json,text/csv"><p>Для сложной визуальной сетки с неопределёнными днями и циклами сначала используйте прилагаемый инструмент <code>tools/prepare_import.py</code>. Он формирует черновик для просмотра, а неоднозначные строки требует проверить вручную.</p><div id="n-import-preview" class="n-import-preview">Файл ещё не выбран.</div><div class="n-import-actions"><button id="n-import-download" class="n-secondary" type="button" disabled>${icon('file',17)} Скачать нормализованный JSON</button><button id="n-import-stage" class="n-primary" type="button" disabled>${icon('upload',17)} Отправить на проверку</button></div></div>
<div class="n-info-panel">${icon('info')} <span>Публикация — отдельное действие редактора-утверждающего. История версий хранится на сервере; ошибочную версию можно отозвать.</span></div><div id="n-import-moderation"></div></section>`;
main.append(extras);
// Reuse the V8.7.1 password login and server session in the profile. No password reimplementation.
const originalLoginForm=document.getElementById('cloudLoginForm');
if(originalLoginForm)document.getElementById('n-password-auth').appendChild(originalLoginForm);
const logoutInProfile=document.createElement('button');logoutInProfile.type='button';logoutInProfile.className='n-secondary';logoutInProfile.id='n-password-logout';logoutInProfile.textContent='Выйти из учётной записи';logoutInProfile.hidden=true;document.getElementById('n-password-auth').appendChild(logoutInProfile);logoutInProfile.addEventListener('click',()=>cloudLogout());
document.documentElement.classList.toggle('ksmu-offline',Boolean(window.KSMU_PREVIEW_ONLY));
if(window.KSMU_PREVIEW_ONLY) {const state=document.getElementById('n-password-state');if(state)state.textContent='Локальная сборка: авторизация отключена, чтобы не обращаться к рабочей базе. В серверной сборке форма действует как в V8.7.1.';}

const foot=document.createElement('footer');foot.className='n-footer';foot.innerHTML='<span>© 2026 КГМУ</span><button type="button" id="n-privacy">Политика конфиденциальности</button><button type="button" id="n-footer-report">Сообщить о проблеме</button>';content.append(foot);
const privacy=document.createElement('dialog');privacy.id='n-privacy-dialog';privacy.className='n-dialog';privacy.innerHTML=`<div class="n-modal-head"><h2>Конфиденциальность</h2><button type="button" id="n-close-privacy" aria-label="Закрыть">×</button></div><p>Это тестовая версия студенческого сервиса. Расписание доступно без входа. Выбор группы и настройки могут сохраняться локально в браузере. Авторизация Telegram, права доступа и хранение данных на сервере требуют отдельной настройки и утверждённой политики КГМУ.</p><p>Данный текст — предварительная информация, <b>не утверждённая университетская политика</b>.</p>`;document.body.append(privacy);
const lessonDlg=document.createElement('dialog');lessonDlg.id='n-lesson-dialog';lessonDlg.className='n-dialog';lessonDlg.innerHTML='<div class="n-modal-head"><h2>Информация о занятии</h2><button type="button" id="n-close-lesson" aria-label="Закрыть">×</button></div><div id="n-lesson-body"></div><div class="n-lesson-actions"><button id="n-to-calendar" class="n-primary" type="button">Открыть в календаре</button></div>';document.body.append(lessonDlg);


/* Accessible off-canvas navigation: one menu for all viewport sizes. */
let drawerOpen=false, drawerReturnFocus=null;
const menuButton=$('n-menu-button'),drawerClose=$('n-drawer-close');
function setDrawer(open,restore=true){
 if(drawerOpen===open)return;
 drawerOpen=open;
 if(open){drawerReturnFocus=document.activeElement;side.inert=false;side.setAttribute('aria-hidden','false');}
 document.body.classList.toggle('n-drawer-open',open);
 menuButton.setAttribute('aria-expanded',String(open));
 if(open){drawerClose.focus({preventScroll:true});}
 else{side.setAttribute('aria-hidden','true');side.inert=true;if(restore)(drawerReturnFocus?.isConnected?drawerReturnFocus:menuButton).focus({preventScroll:true});}
}
menuButton.addEventListener('click',()=>setDrawer(true));
drawerClose.addEventListener('click',()=>setDrawer(false));
shade.addEventListener('click',()=>setDrawer(false));
$('n-drawer-group').addEventListener('click',()=>{setDrawer(false);showGroupChooser();$('n-group-search').focus({preventScroll:true});});
document.addEventListener('keydown',e=>{
 if(!drawerOpen)return;
 if(e.key==='Escape'){e.preventDefault();setDrawer(false);return;}
 if(e.key==='Tab'){
  const list=[...side.querySelectorAll('button:not([disabled]),a[href]')].filter(n=>!n.hidden&&n.getClientRects().length);
  const first=list[0],last=list[list.length-1];
  if(!first)return;
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
 }
});
const prettyDay=k=>{const date=parseISO(k);return date.toLocaleDateString('ru-RU',{day:'numeric',month:'long',weekday:'long'});};
const addDate=(d,n)=>{let x=parseISO(d);x.setDate(x.getDate()+n);return dateISO(x);};
const tmin=t=>{const a=String(t||'0:0').split(':');return Number(a[0])*60+Number(a[1]);};
const fmtMin=n=>`${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`;
const heading=(name,secondary)=>`<div class="n-card-head"><h2>${clean(name)}</h2>${secondary?`<span>${clean(secondary)}</span>`:''}</div>`;
const progress=(pc)=>`<div class="n-progress-track"><span style="width:${Math.round(Math.min(100,Math.max(0,pc)))}%"></span></div>`;
function layoutStatus(list,now,isToday){
 const durations=list.filter(slot=>slot[0]?.lessonType!=='cycle'&&!['cancel','moved-away'].includes(slot[0]?.changeFlag)).map(s=>({start:tmin(s[0].start),end:tmin(s[0].end),slot:s})).filter(s=>s.end>s.start).sort((a,b)=>a.start-b.start);
 const current=isToday?durations.find(x=>x.start<=now&&x.end>now):null;
 const upcoming=durations.find(x=>x.start>now);
 const prior=[...durations].reverse().find(x=>x.end<=now);
 const between=isToday&&!current&&prior&&upcoming&&upcoming.start>prior.end&&now>=prior.end&&now<upcoming.start;
 if(between){const total=upcoming.start-prior.end,pct=100*(now-prior.end)/total,left=upcoming.start-now;return {kind:'break', title:'Сейчас перемена',detail:`${left} мин до следующей пары · ${fmtMin(prior.end)}–${fmtMin(upcoming.start)}`,progress:pct,bottom:`Следующее: ${subjTitle(upcoming.slot[0].subject)}`};}
 if(current){const e=current.slot[0],span=current.end-current.start;return {kind:'lesson', title:subjTitle(e.subject),detail:`Сейчас идёт пара · ${e.start}–${e.end}`,progress:100*(now-current.start)/span,bottom:`До конца ${current.end-now} мин`};}
 if(upcoming){const e=upcoming.slot[0];return {kind:'next',title:subjTitle(e.subject),detail:`Ближайшая пара в ${e.start}`,progress:null,bottom:isToday?`Начнётся через ${upcoming.start-now} мин`:'Начало занятий'};}
 return {kind:'end',title:durations.length?'Занятия завершились':'На сегодня занятий нет',detail:'Проверьте календарь и предстоящие модули.',progress:null,bottom:''};
}
function renderModernHome(){
 if(!selectedStudyGroup)return;
 const key=addDate(kazanTodayKey(),todayOffset),dt=parseISO(key),w=dateWeek(key),dow=(dt.getDay()+6)%7;
 const animationKey=selectedStudyGroup+':'+key;const softRefresh=home.dataset.renderKey===animationKey;home.classList.toggle('n-quiet-refresh',softRefresh);home.dataset.renderKey=animationKey;
 const daily=w>=1&&w<=18&&dow<6?slots(w,dow):[];
 const now=kazanClockMinutes(),isToday=todayOffset===0;
 const active=daily.filter(s=>!['cancel','moved-away'].includes(s[0]?.changeFlag));
 const periods=uniqueCycles(key);
 const status=layoutStatus(active,isToday?now:-1,isToday);
 if(periods.length&&status.kind==='end'&&!active.length){status.title='Период клинического цикла';status.detail='Дни отдельных занятий требуют уточнения';status.bottom='Периоды показаны ниже';}
 const dayname=dt.toLocaleDateString('ru-RU',{weekday:'long'}),daystamp=dt.toLocaleDateString('ru-RU',{day:'numeric',month:'long'});
 const related=visibleNotes(key),mods=related.filter(x=>x.type==='module'),hws=related.filter(x=>x.type==='homework');
 const weekStart=new Date(dt);weekStart.setDate(dt.getDate()-(dt.getDay()+6)%7);
 let days='';for(let i=0;i<7;i++){const d=new Date(weekStart);d.setDate(weekStart.getDate()+i);const k=dateISO(d);days+=`<button type="button" class="n-day${k===key?' active':''}${k===kazanTodayKey()?' current':''}" data-n-date="${k}" aria-pressed="${k===key}"><small>${['Пн','Вт','Ср','Чт','Пт','Сб','Вс'][i]}</small><strong>${d.getDate()}</strong></button>`;}
 let lessons='',prev=null;
 const sorted=[...active].sort((a,b)=>tmin(a[0].start)-tmin(b[0].start));
 for(let i=0;i<sorted.length;i++){
  const slot=sorted[i],e=slot[0],start=tmin(e.start),end=tmin(e.end),cycle=e.lessonType==='cycle';
  if(prev&&!cycle&&!prev.cycle&&start>prev.end){const dur=start-prev.end,ongoing=isToday&&now>=prev.end&&now<start;
   lessons+=`<div class="n-break-row ${ongoing?'active':''}"><div>${icon('pause',15)}<span>Перемена · ${dur} мин</span>${ongoing?`<strong>Осталось ${start-now} мин</strong>`:''}</div>${ongoing?progress(100*(now-prev.end)/dur):''}</div>`;
  }
  const names=[...new Set(slot.map(x=>subjTitle(x.subject)))].join(' / ');
  const loc=[...new Set(slot.map(x=>x.shortLocation||x.location).filter(Boolean))].join(' · ');
  const underway=!cycle&&isToday&&now>=start&&now<end;
  const noteBadges=[mods.some(n=>names.includes(n.subject))?'Модуль':'',hws.some(n=>names.includes(n.subject))?'ДЗ':''].filter(Boolean);
  lessons+=`<button class="n-lesson ${underway?'underway':''}${cycle?' cycle':''}" data-n-lesson="${i}" type="button"><div class="n-time"><strong>${clean(e.start)}</strong><span>${clean(e.end)}</span></div><div class="n-lesson-info"><div class="n-lesson-meta"><span class="n-lesson-type">${cycle?'ПЕРИОД ЦИКЛА':e.lecture?'ЛЕКЦИЯ':'ПРАКТИКА'}</span>${e.subgroup?`<span>${clean(e.subgroup)}-я подгруппа</span>`:''}${noteBadges.map(x=>`<span class="n-alert-pill">${x}</span>`).join('')}</div><strong>${clean(names)}</strong><p>${clean(loc||'Место уточняется')}</p>${underway?progress(100*(now-start)/(end-start)):''}${cycle?'<p class="n-cycle-explain">Период по исходному Excel, не подтверждение ежедневной пары</p>':''}</div><span class="n-lesson-arrow">${icon('chevron',17)}</span></button>`;
  if(!cycle){prev={end,cycle:false};}else{prev=null;}
 }
 if(!sorted.length)lessons='<div class="n-empty">На этот день в исходном расписании нет занятий. Проверьте официальное расписание.</div>';
 const stateIcon=status.kind==='break'?'pause':status.kind==='lesson'?'clock':'cal';
 home.innerHTML=`<div class="n-hero"><div><span class="n-kicker">${w>=1&&w<=18?`${w}-Я УЧЕБНАЯ НЕДЕЛЯ`:'ВНЕ СЕМЕСТРА'}</span><h2>${clean(dayname)}, <span>${clean(daystamp)}</span></h2><p>Группа ${clean(selectedStudyGroup)} · ${clean(PROGRAM_CONFIG[studyProgram(selectedStudyGroup)]?.label||'КГМУ')}</p></div><div class="n-hero-actions"><button id="n-day-prev" aria-label="Предыдущий день">${icon('left')}</button><button id="n-day-now" class="n-hero-now">Сегодня</button><button id="n-day-next" aria-label="Следующий день">${icon('chevron')}</button></div></div>
 <div class="n-weekstrip" aria-label="Дни учебной недели">${days}</div>
 <section class="n-status ${status.kind}"><div class="n-status-sign">${icon(stateIcon,18)}<span>${status.kind==='break'?'ВРЕМЯ ОТДОХНУТЬ':status.kind==='lesson'?'ИДЁТ ЗАНЯТИЕ':'ВАШ УЧЕБНЫЙ ДЕНЬ'}</span></div><h3>${clean(status.title)}</h3><p>${clean(status.detail)}</p>${status.progress!==null?progress(status.progress):''}<div class="n-status-bottom">${clean(status.bottom||'Расписание и изменения всегда под рукой')}</div></section>
 <section class="n-lesson-section">${heading('Занятия',active.length+' записей')}<div class="n-lessons">${lessons}</div></section>
 <div class="n-dashboard-grid"><button data-nview="calendar" class="n-dash-card"><span class="n-dash-icon">${icon('book')}</span><div><b>Домашние задания</b><small>${hws.length?`${hws.length} на выбранный день`:'Посмотреть в календаре'}</small></div>${icon('chevron',17)}</button><button data-nview="modules" class="n-dash-card"><span class="n-dash-icon">${icon('flag')}</span><div><b>Модули и зачёты</b><small>${mods.length?`${mods.length} на выбранный день`:'Ближайшие события'}</small></div>${icon('chevron',17)}</button></div>
 <div class="n-home-footnote">${GROUP_INFO[selectedStudyGroup]?.hasCycles?'Периоды циклов не являются подтверждёнными ежедневными занятиями. ':''}При расхождениях сверяйтесь с официальными файлами КГМУ.</div>`;
 const review=GROUP_INFO[selectedStudyGroup]?.reviewStatus==='needs-manual-confirmation';
 if(review){const source=GROUP_INFO[selectedStudyGroup]?.source||'Excel КГМУ';const note=document.createElement('div');note.className='n-source-review';note.textContent='Расписание импортировано из '+source+'. Требуется подтверждение секретариата; сообщите об обнаруженных ошибках.';home.prepend(note);}
 if(periods.length){const section=document.createElement('div');section.className='n-periods-modern';section.innerHTML=renderCyclePeriods(key);home.append(section);}
 home._slots=sorted;home._date=key;
}
function renderChooser(){
 const entries=Object.entries(PROGRAM_CONFIG),courses=PROGRAM_CONFIG[chooserState.program]?.courses||{},selectedCourse=courses[chooserState.course]?chooserState.course:Object.keys(courses)[0];
 chooserState.course=selectedCourse;
 $('n-chooser-programs').innerHTML=entries.map(([id,o])=>`<button class="n-program ${id===chooserState.program?'active':''}" data-n-program="${clean(id)}" aria-pressed="${id===chooserState.program}"><span>${clean(o.label)}</span>${id===chooserState.program?icon('check',17):icon('chevron',17)}</button>`).join('');
 $('n-chooser-courses').innerHTML=Object.keys(courses).map(v=>`<button type="button" class="n-course ${v===selectedCourse?'active':''}" data-n-course="${clean(v)}" aria-pressed="${v===selectedCourse}">${clean(v)} курс</button>`).join('');
 const groups=Object.values(courses[selectedCourse]||{}).flat();const query=chooserState.query.toLowerCase().trim();const matches=groups.filter(n=>n.toLowerCase().includes(query));
 $('n-chooser-count').textContent=matches.length+' групп';
 $('n-chooser-groups').innerHTML=matches.map(n=>`<button type="button" data-n-group="${clean(n)}" class="n-group-pick"><strong>${clean(n)}</strong><small>${isDevGroup(n)?'В разработке':'Открыть расписание'}</small>${icon('arrow',17)}</button>`).join('')||'<p class="n-empty">Группа не найдена в выбранном курсе.</p>';
 $('n-group-search').value=chooserState.query;
 $('n-chooser-back').hidden=!selectedStudyGroup;
}
function syncShell(){
 if(drawerOpen)setDrawer(false);
 const chooseShown=!$('groupChooser').hidden||!selectedStudyGroup;
 chooser.hidden=!chooseShown;
 document.body.classList.toggle('n-choosing',chooseShown);
 if(chooseShown){$('appRoot').hidden=true;renderChooser();return;}
 $('appRoot').hidden=false;
 const info=GROUP_INFO[selectedStudyGroup];$('n-group-label').textContent=selectedStudyGroup||'Группа';$('n-drawer-group-label').textContent=selectedStudyGroup||'—';
 const page=extra||activeView;
 const captions={today:'Сегодня',schedule:'Расписание по неделям',calendar:'Календарь',modules:'Модули и зачёты',resources:'Полезные ресурсы',contacts:'Контакты',profile:'Профиль',import:'Импорт расписания',search:'Поиск',settings:'Настройки'};
 $('n-top-title').textContent=captions[page]||'Расписание';$('n-top-eyebrow').textContent=`${info?.course||'—'} курс · ${PROGRAM_CONFIG[studyProgram(selectedStudyGroup)]?.label||'КГМУ'}`;
 document.querySelectorAll('[data-nview]').forEach(b=>{const active=b.dataset.nview===page;b.classList.toggle('active',active);b.setAttribute('aria-current',active?'page':'false');});
 extras.hidden=!extra;
 for(const section of extras.querySelectorAll('.n-extra-page'))section.hidden=section.id!=='n-'+extra;
 $('todayView').hidden=!!extra||activeView!=='today';
 if(!extra&&activeView==='today')renderModernHome();
}
function go(view){
 if(drawerOpen)setDrawer(false);
 if(['resources','profile','import','contacts'].includes(view)){
  extra=view;legacySetView('today');syncShell();if(view==='profile')loadAuth();if(view==='import')loadDraftList();window.scrollTo({top:0,behavior:'instant'});return;
 }
 extra=null;legacySetView(view);syncShell();
}
setView=function(view){extra=null;legacySetView(view);syncShell();};
renderToday=function(){legacyRenderToday();if(!extra&&activeView==='today'&&selectedStudyGroup)renderModernHome();};
showGroupChooser=function(first){legacyShowChooser(first);syncShell();};
hideGroupChooser=function(){legacyHideChooser();syncShell();};
activateStudyGroup=function(id){legacyActivate(id);chooserState.program=studyProgram(id);chooserState.course=studyCourse(id);chooserState.query='';extra=null;syncShell();window.scrollTo({top:0,behavior:'instant'});loadLiveSchedule(id);};
applyTheme=function(){legacyApplyTheme();document.documentElement.dataset.nTheme=document.documentElement.dataset.theme||'light';};
side.addEventListener('click',e=>{const b=e.target.closest('[data-nview]');if(b)go(b.dataset.nview);});

top.addEventListener('click',e=>{const b=e.target.closest('[data-nview]');if(b)go(b.dataset.nview);});
$('n-change-group').addEventListener('click',()=>showGroupChooser());$('n-search').addEventListener('click',()=>go('search'));
chooser.addEventListener('click',e=>{const p=e.target.closest('[data-n-program]'),c=e.target.closest('[data-n-course]'),g=e.target.closest('[data-n-group]');if(p){chooserState.program=p.dataset.nProgram;chooserState.course=Object.keys(PROGRAM_CONFIG[chooserState.program].courses)[0];chooserState.query='';renderChooser();}else if(c){chooserState.course=c.dataset.nCourse;chooserState.query='';renderChooser();}else if(g){activateStudyGroup(g.dataset.nGroup);}});
$('n-group-search').addEventListener('input',e=>{chooserState.query=e.target.value;const count=$('n-chooser-count'),groups=$('n-chooser-groups');const list=Object.values(PROGRAM_CONFIG[chooserState.program]?.courses?.[chooserState.course]||{}).flat().filter(n=>n.toLowerCase().includes(chooserState.query.toLowerCase().trim()));count.textContent=list.length+' групп';groups.innerHTML=list.map(n=>`<button type="button" data-n-group="${clean(n)}" class="n-group-pick"><strong>${clean(n)}</strong><small>${isDevGroup(n)?'В разработке':'Открыть расписание'}</small>${icon('arrow',17)}</button>`).join('')||'<p class="n-empty">Группа не найдена в выбранном курсе.</p>';});
$('n-chooser-back').addEventListener('click',()=>{hideGroupChooser();});
main.addEventListener('click',e=>{
 const btn=e.target.closest('[data-nview]');if(btn){go(btn.dataset.nview);return;}
 const d=e.target.closest('[data-n-date]');if(d){changeTodayOffset(diffDays(kazanTodayKey(),d.dataset.nDate));return;}
 const lesson=e.target.closest('[data-n-lesson]');if(lesson){const slot=home._slots?.[Number(lesson.dataset.nLesson)];if(!slot)return;modalSlot=slot;
  const ob=slot[0];$('n-lesson-body').innerHTML=`<h3>${clean([...new Set(slot.map(x=>subjTitle(x.subject)))].join(' / '))}</h3><p>${clean(home._date)} · ${clean(ob.start)}–${clean(ob.end)}</p><p><b>Формат:</b> ${ob.lessonType==='cycle'?'Период цикла':ob.lecture?'Лекция':'Практика'}</p><p><b>Аудитория:</b> ${clean(ob.location||'Не указана')}</p>${ob.teacher?`<p><b>Преподаватель:</b> ${clean(ob.teacher)}</p>`:''}`;
  lessonDlg.showModal();return;}
 });
 home.addEventListener('click',e=>{if(e.target.closest('#n-day-prev'))changeTodayOffset(todayOffset-1);if(e.target.closest('#n-day-next'))changeTodayOffset(todayOffset+1);if(e.target.closest('#n-day-now'))changeTodayOffset(0);});
 $('n-close-lesson').onclick=()=>lessonDlg.close();$('n-to-calendar').onclick=()=>{lessonDlg.close();go('calendar');selectDate(home._date);};
 $('n-privacy').onclick=()=>privacy.showModal();$('n-close-privacy').onclick=()=>privacy.close();
 $('n-footer-report').onclick=()=>reportProblem();$('n-report').onclick=()=>reportProblem();

async function loadAuth(){
 if(typeof cloudSession!=='undefined' && cloudSession?.user?.email){$('n-auth-name').textContent=cloudSession.user.email;$('n-auth-meta').textContent=cloudCanAdmin()?'Администратор Supabase':cloudCanEdit()?'Редактор группы':'Пользователь Supabase';}
 if(window.KSMU_PREVIEW_ONLY){$('n-auth-name').textContent='Гостевой режим';$('n-auth-meta').textContent='Безопасный тест: серверный вход отключён';$('n-auth-login').hidden=false;$('n-auth-logout').hidden=true;return;}
 if(typeof cloudSession!=='undefined' && cloudSession?.user?.email){$('n-auth-login').hidden=true;$('n-auth-logout').hidden=true;return;}
 const meta=$('n-auth-meta'),name=$('n-auth-name');
 try{const res=await fetch('/api/auth/me',{credentials:'same-origin',headers:ksmuBearer()});if(!res.ok)throw Error('unauthorized');const j=await res.json();
  if(j.authenticated){name.textContent=j.name||('Telegram #'+j.telegram_id);meta.textContent='Доступ: '+(j.role||'student');$('n-auth-login').hidden=true;$('n-auth-logout').hidden=false;}
  else{ name.textContent='Гостевой режим';meta.textContent='Расписание доступно без регистрации.';$('n-auth-login').hidden=false;$('n-auth-logout').hidden=true;}
 }catch(e){name.textContent='Гостевой режим';meta.textContent='Для входа требуется серверное развёртывание.';}
}
$('n-auth-login').onclick=async()=>{
 if(window.KSMU_PREVIEW_ONLY){$('n-auth-hint').textContent='В этой тестовой сборке авторизация отключена; для подключения нужен отдельный сервер.';return;}
 if(location.protocol==='file:'){$('n-auth-hint').textContent='В автономном HTML авторизация недоступна. Откройте проект на HTTPS с настроенным Telegram-ботом и сервером.';return;}
 const data=window.Telegram?.WebApp?.initData;
 if(data){try{const r=await fetch('/api/auth/telegram-mini',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({initData:data})});if(!r.ok)throw Error('Telegram подтверждение не прошло');await loadAuth();}catch(err){$('n-auth-hint').textContent=err.message;}}
 else location.href='/api/auth/start';
};
$('n-auth-logout').onclick=async()=>{await fetch('/api/auth/logout',{method:'POST',credentials:'same-origin'});await loadAuth();};


const ksmuBearer=()=>typeof cloudSession!=='undefined'&&cloudSession?.access_token?{'Authorization':'Bearer '+cloudSession.access_token}:{};
async function loadDraftList(){
 if(window.KSMU_PREVIEW_ONLY){$('n-import-moderation').innerHTML='<div class="n-hint">Серверные черновики в офлайн-версии отключены. Excel/CSV/JSON можно проверить и скачать локально.</div>';return;}
 const box=$('n-import-moderation');if(!box)return;
 if(location.protocol==='file:'){box.innerHTML='<div class="n-hint">В автономном HTML модерация не подключается. На сервере здесь будет список черновиков.</div>';return;}
 try{
  const u=await (await fetch('/api/auth/me',{credentials:'same-origin',headers:ksmuBearer()})).json();
  if(!u.authenticated||!['editor','publisher','admin'].includes(u.role)){box.innerHTML='<div class="n-hint">Для просмотра черновиков необходим вход редактора или утверждающего.</div>';return;}
  const r=await fetch('/api/schedule/drafts',{credentials:'same-origin',headers:ksmuBearer()});if(!r.ok)throw Error('Не удалось загрузить черновики');
  const j=await r.json();const list=j.drafts||[];
  box.innerHTML='<h3 class="n-review-title">Черновики на проверке</h3>'+(list.map(d=>`<div class="n-review-row"><b>Группа ${clean(d.group_id)} · ${clean(d.academic_year||"—")} · ${d.semester==="spring"?"Весенний":"Осенний"}</b><span>${clean(d.status)} · ${clean(d.signed_at||"без даты")} · ${clean(d.id.slice(0,8))}</span><button class="n-secondary" data-n-preview-draft="${clean(d.id)}">Проверить</button></div>`).join('')||'<div class="n-hint">Черновиков пока нет.</div>')+'<div id="n-review-detail"></div>';
  box.dataset.role=u.role;
 }catch(err){box.innerHTML='<div class="n-hint">'+clean(err.message)+'</div>';}
}
$('n-import-moderation').addEventListener('click',async e=>{
 const button=e.target.closest('[data-n-preview-draft],[data-n-publish]');if(!button)return;
 const id=button.dataset.nPreviewDraft||button.dataset.nPublish;
 const detail=$('n-review-detail');
 try{
  if(button.dataset.nPublish){if(!confirm('Вы уверены, что сверили этот файл с оригиналом? После публикации он заменит расписание выбранной группы.'))return;
   const res=await fetch('/api/schedule/publish',{method:'POST',headers:{'Content-Type':'application/json',...ksmuBearer()},credentials:'same-origin',body:JSON.stringify({draft_id:id})}),j=await res.json();if(!res.ok)throw Error(j.error||'Невозможно утвердить');detail.innerHTML='<div class="n-hint">Опубликована версия '+clean(j.version)+' группы '+clean(j.group)+'</div>';loadDraftList();return;
  }
  const r=await fetch('/api/schedule/draft?id='+encodeURIComponent(id),{credentials:'same-origin',headers:ksmuBearer()}),j=await r.json();if(!r.ok)throw Error(j.error||'Ошибка');
  const sample=(j.lessons||[]).slice(0,8).map(x=>`<tr><td>${clean(x.day)}</td><td>${clean(x.start)}–${clean(x.end)}</td><td>${clean(x.subject)}</td><td>${clean(x.weeks?.join(','))}</td></tr>`).join('');
  detail.innerHTML=`<div class="n-import-card"><b>Группа ${clean(j.group)} · ${j.lessons.length} записей · ${clean(j.academic_year||'—')} · ${j.semester==='spring'?'Весенний':'Осенний'} семестр</b><p>Источник: ${clean(j.source||'—')}. Утверждено: ${clean(j.signed_at||'не указано')}. ${clean(j.comment||'')}</p><p>Первые восемь записей (полный файл требуется сверить по исходному документу):</p><div style="overflow-x:auto"><table class="n-review-table"><thead><tr><th>День</th><th>Время</th><th>Предмет</th><th>Недели</th></tr></thead><tbody>${sample}</tbody></table></div>${['publisher','admin'].includes($('n-import-moderation').dataset.role)?`<button class="n-primary" type="button" data-n-publish="${clean(id)}">Утвердить и опубликовать</button>`:''}</div>`;
 }catch(err){detail.textContent='Ошибка: '+err.message;}
});

let normalized=null;
const csvRows=s=>{
 // RFC4180 basic parser with multiline quotes and CRLF.
 let all=[],row=[],val='',quoted=false;for(let i=0;i<s.length;i++){const c=s[i];if(quoted){if(c==='"'&&s[i+1]==='"'){val+='"';i++;}else if(c==='"')quoted=false;else val+=c;}else if(c==='"')quoted=true;else if(c===','){row.push(val);val='';}else if(c==='\n'){row.push(val.replace(/\r$/,''));all.push(row);row=[];val='';}else val+=c;}
 if(quoted)throw Error('Не закрыты кавычки в CSV');if(row.length||val){row.push(val.replace(/\r$/,''));all.push(row);}return all;
};
const normalize=(body,filename)=>{
 let groupId,entries;
 if(filename.toLowerCase().endsWith('.json')){const j=JSON.parse(body);groupId=String(j.group||'').trim();entries=j.lessons||j.entries;}
 else{const rows=csvRows(body);const header=rows.shift().map(x=>x.trim().toLowerCase());const required=['group','day','start','end','subject','weeks'];for(const k of required)if(!header.includes(k))throw Error('Нет столбца '+k);
  const objs=rows.filter(r=>r.some(v=>v.trim())).map(row=>Object.fromEntries(header.map((col,i)=>[col,row[i]||''])));
  const groups=[...new Set(objs.map(x=>x.group.trim()))];if(groups.length!==1)throw Error('Для безопасного импорта выберите CSV ровно одной группы');groupId=groups[0];entries=objs.map(x=>({...x,day:Number(x.day),weeks:x.weeks.split(/[;\s]+/).filter(Boolean).map(Number)}));
 }
 if(!/^\d{4}[а-я]?$/iu.test(groupId))throw Error('Неверный номер группы');if(!Array.isArray(entries)||entries.length<1||entries.length>1500)throw Error('Ожидалось от 1 до 1500 занятий');
 const errors=[];const list=entries.map((v,i)=>{
  if(!v||typeof v!=='object'){errors.push('Строка '+(i+1)+': недопустимое значение');return null;}
  let weeks=Array.isArray(v.weeks)?v.weeks.map(Number):[];
  const x={...v,day:Number(v.day),weeks,start:String(v.start||''),end:String(v.end||''),subject:String(v.subject||'').trim(),row:Number(v.row??i+1)};
  if(!Number.isInteger(x.day)||x.day<0||x.day>5)errors.push('Строка '+(i+1)+': день от 0 до 5');
  if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(x.start)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(x.end)||tmin(x.end)<=tmin(x.start))errors.push('Строка '+(i+1)+': неверное время');
  if(!x.subject||x.subject.length>240)errors.push('Строка '+(i+1)+': название предмета');
  if(!weeks.length||weeks.some(w=>!Number.isInteger(w)||w<1||w>18))errors.push('Строка '+(i+1)+': недели должны быть 1–18');
  if(v.subgroup!=null&&!['1','2','',null].includes(String(v.subgroup)))errors.push('Строка '+(i+1)+': подгруппа 1/2/пусто');
  return x;
 });
 if(errors.length)throw Error(errors.slice(0,8).join('; ')+(errors.length>8?' (и другие)':''));
 const key=e=>[e.day,e.start,e.end,e.subject,e.subgroup||'',e.weeks.join(',')].join('|');const unique=new Set(list.map(key));if(unique.size!==list.length)throw Error('Найдены дублирующиеся занятия; исправьте перед импортом');
 return {format:'ksmu-schedule-draft-v1',group:groupId,lessons:list,source:filename,created_at:new Date().toISOString()};
};
$('n-upload-file').onchange=async(e)=>{
 const file=e.target.files?.[0];normalized=null;$('n-import-download').disabled=true;$('n-import-stage').disabled=true;
 if(!file)return;if(file.size>6_000_000){$('n-import-preview').textContent='Файл слишком большой (максимум 6 МБ).';return;}
 try{normalized=normalize(await file.text(),file.name);$('n-import-preview').innerHTML=`<b>Группа ${clean(normalized.group)}</b><p>${normalized.lessons.length} записей. Формат и базовые ограничения проверены. Перед публикацией требуется сверка с исходным файлом и утверждение.</p>`;
 $('n-import-download').disabled=false;$('n-import-stage').disabled=false;
 }catch(err){$('n-import-preview').textContent='Ошибка импорта: '+err.message;}
};
$('n-import-download').onclick=()=>{if(!normalized)return;const blob=new Blob([JSON.stringify(normalized,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='ksmu_'+normalized.group+'_draft.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('n-import-stage').onclick=async()=>{if(!normalized)return;if(window.KSMU_PREVIEW_ONLY){$('n-import-preview').textContent+=' Серверная отправка в тестовой сборке отключена.';return;}if(location.protocol==='file:'){$('n-import-preview').textContent+=' Предпросмотр работает локально; отправка требует сервера и прав редактора.';return;}
 try{const res=await fetch('/api/schedule/drafts',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(normalized)});const data=await res.json();if(!res.ok)throw Error(data.error||'Нет прав для черновика');$('n-import-preview').innerHTML=`<b>Черновик #${clean(data.id)}</b><p>Сохранён для отдельной проверки и утверждения сотрудником с ролью publisher.</p>`;}
 catch(err){$('n-import-preview').textContent='Не удалось отправить: '+err.message;}
};

async function loadLiveSchedule(id){
 if(window.KSMU_PREVIEW_ONLY)return;
 if(!id||!/^https?:$/.test(location.protocol))return;
 try{const r=await fetch('/api/schedule/current?group='+encodeURIComponent(id),{cache:'no-store'});if(!r.ok)return;
 const data=await r.json();if(data?.group!==id||!Array.isArray(data.lessons)||!data.lessons.length)return;
 // Published revisions are validated before use and replace only the selected group's baseline.
 const tentative=normalize(JSON.stringify({group:id,lessons:data.lessons}),'published.json');
 ALL_SCHEDULES[id]=tentative.lessons;if(selectedStudyGroup===id){EVENT_DATA=ALL_SCHEDULES[id];render();syncShell();}
 }catch(err){console.info('Сохранён локальный архив:',err.message);}
}

// Initial setup after original application has attached its listeners.
if(selectedStudyGroup){chooserState.program=studyProgram(selectedStudyGroup);chooserState.course=studyCourse(selectedStudyGroup);}
applyTheme();syncShell();if(selectedStudyGroup)loadLiveSchedule(selectedStudyGroup);
setInterval(()=>{if(selectedStudyGroup&&!extra&&activeView==='today'&&!document.hidden)renderModernHome();},45000);
})();
