/* KSMU schedule import v2: normalized .xlsx/.csv/.json, offline review & scoped drafts.
   No external libraries, network calls, or silent publication. Modern Chrome/Edge required
   for native DecompressionStream('deflate-raw') when reading XLSX. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const html=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const csvParse=s=>{const header=String(s).replace(/^\uFEFF/,'').split(/\r?\n/,1)[0]||'';const delim=(header.match(/;/g)||[]).length>(header.match(/,/g)||[]).length?';':',';let rows=[],row=[],cell='',inside=false; s=s.replace(/^\uFEFF/,'');for(let i=0;i<s.length;i++){const c=s[i];if(inside){if(c==='"'&&s[i+1]==='"'){cell+='"';i++;}else if(c==='"')inside=false;else cell+=c;}else if(c==='"')inside=true;else if(c===delim){row.push(cell);cell='';}else if(c==='\n'){row.push(cell.replace(/\r$/,''));rows.push(row);row=[];cell='';}else cell+=c;}if(inside)throw Error('CSV: незакрытые кавычки');if(row.length||cell){row.push(cell.replace(/\r$/,''));rows.push(row);}return rows;};
const canon=s=>String(s??'').trim().toLowerCase().replace(/\s+/g,' ').replace(/ё/g,'е');
const definitions={group:['group','группа','номер группы'],day:['day','день','день недели'],start:['start','начало','время начала'],end:['end','окончание','время окончания'],subject:['subject','предмет','дисциплина','занятие'],weeks:['weeks','недели','учебные недели'],subgroup:['subgroup','подгруппа'],location:['location','аудитория','место','адрес'],teacher:['teacher','преподаватель'],lecture:['lecture','лекция'],lessonType:['lessontype','тип занятия','тип'],confirmedDay:['confirmedday','подтвержденный день']};
const names=Object.fromEntries(Object.entries(definitions).flatMap(([k,vs])=>vs.map(x=>[canon(x),k])));
const needed=['day','start','end','subject','weeks'];
const xdoc=s=>{const d=new DOMParser().parseFromString(s,'application/xml');if(d.querySelector('parsererror'))throw Error('Повреждён XML внутри XLSX');return d;};
const kids=(el,name)=>Array.from(el?.children||[]).filter(e=>e.localName===name);
const first=(el,name)=>kids(el,name)[0]||null;
const text=el=>el?.textContent||'';
const utf8=new TextDecoder('utf-8');
const cellColumn=ref=>{const letters=String(ref).match(/^[A-Z]+/i)?.[0]||'';let n=0;for(const ch of letters.toUpperCase())n=n*26+ch.charCodeAt(0)-64;return n-1;};
function zipReader(buffer){
 const data=new Uint8Array(buffer),dv=new DataView(buffer);let eocd=-1;
 for(let i=data.length-22;i>=Math.max(0,data.length-65557);i--)if(dv.getUint32(i,true)===0x06054b50){eocd=i;break;}
 if(eocd<0)throw Error('Это не XLSX/ZIP или архив повреждён');
 const num=dv.getUint16(eocd+10,true),cdLen=dv.getUint32(eocd+12,true),cdPos=dv.getUint32(eocd+16,true);
 if(num>250||cdPos+cdLen>data.length||cdLen>5e6)throw Error('XLSX слишком сложный или повреждён');
 let pos=cdPos;const entries=new Map();let allSize=0;
 for(let i=0;i<num;i++){
  if(dv.getUint32(pos,true)!==0x02014b50)throw Error('Повреждена таблица XLSX');
  const flag=dv.getUint16(pos+8,true),method=dv.getUint16(pos+10,true),size=dv.getUint32(pos+20,true),unzip=dv.getUint32(pos+24,true),nl=dv.getUint16(pos+28,true),extra=dv.getUint16(pos+30,true),comment=dv.getUint16(pos+32,true),off=dv.getUint32(pos+42,true);
  const name=utf8.decode(data.subarray(pos+46,pos+46+nl));pos+=46+nl+extra+comment;
  if(flag&1 || ![0,8].includes(method))throw Error('Зашифрованный или неподдерживаемый XLSX');
  if(size>16e6||unzip>24e6||(allSize+=unzip)>45e6)throw Error('XLSX превышает безопасные лимиты распаковки');
  if(!/^xl\//.test(name))continue;
  if(dv.getUint32(off,true)!==0x04034b50)throw Error('Ошибка локального ZIP-заголовка');
  const localStart=off+30+dv.getUint16(off+26,true)+dv.getUint16(off+28,true);
  if(localStart+size>data.length)throw Error('Обрезанный ZIP-файл');
  entries.set(name,{method,size,unzip,start:localStart});
 }
 return async name=>{
  const x=entries.get(name);if(!x)throw Error('В Excel нет файла '+name);
  const slice=data.subarray(x.start,x.start+x.size);
  if(x.method===0)return utf8.decode(slice);
  if(typeof DecompressionStream==='undefined')throw Error('Для Excel нужен современный Chrome или Edge');
  let out;try{out=new Uint8Array(await new Response(new Blob([slice]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());}catch(e){throw Error('Не удалось распаковать лист Excel: '+e.message)}
  if(out.byteLength!==x.unzip)throw Error('Неверный размер распакованного листа');return utf8.decode(out);
 };
}
async function xlsxSheets(buffer){
 const get=zipReader(buffer);const workbook=xdoc(await get('xl/workbook.xml'));
 const rel=xdoc(await get('xl/_rels/workbook.xml.rels'));const targets={};
 for(const r of Array.from(rel.getElementsByTagName('*')).filter(e=>e.localName==='Relationship'))targets[r.getAttribute('Id')]=r.getAttribute('Target');
 let ss=[];try{const d=xdoc(await get('xl/sharedStrings.xml'));ss=Array.from(d.getElementsByTagName('*')).filter(e=>e.localName==='si').map(e=>Array.from(e.getElementsByTagName('*')).filter(n=>n.localName==='t').map(text).join(''));}catch(e){if(!/нет файла/.test(e.message))throw e;}
 const sheets=[];for(const ws of Array.from(workbook.getElementsByTagName('*')).filter(e=>e.localName==='sheet')){
  const title=ws.getAttribute('name')||'Лист',relid=ws.getAttribute('r:id')||ws.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id');let target=targets[relid];if(!target)continue;
  target=target.replace(/^\//,'').replace(/^xl\//,'').replace(/^\.\//,'');if(target.includes('..'))throw Error('Небезопасная ссылка в Excel');
  const doc=xdoc(await get('xl/'+target));const rows=[];
  for(const r of Array.from(doc.getElementsByTagName('*')).filter(e=>e.localName==='row')){
   const vals=[],index=Number(r.getAttribute('r'))||rows.length+1;
   for(const c of kids(r,'c')){
    const col=cellColumn(c.getAttribute('r'));if(col<0||col>110)continue;
    const t=c.getAttribute('t'),f=first(c,'f'),v=first(c,'v');let val='';
    if(t==='inlineStr')val=Array.from(c.getElementsByTagName('*')).filter(e=>e.localName==='t').map(text).join('');
    else if(t==='s')val=ss[Number(text(v))]||'';
    else if(f&&!v)val='#FORMULA_WITHOUT_VALUE';
    else if(t==='b')val=text(v)==='1'?'да':'нет';
    else val=text(v);
    vals[col]=val;
   }
   rows.push({index,vals});
  }
  // Only fill cells covered by an explicitly merged GROUP column, never day/time/subject.
  const merge=Array.from(doc.getElementsByTagName('*')).filter(e=>e.localName==='mergeCell');
  sheets.push({title,rows,merge:merge.map(e=>e.getAttribute('ref')).filter(Boolean)});
 }
 if(!sheets.length)throw Error('В Excel не найдено листов с данными');return sheets;
}
function fields(row){const h={};row.forEach((x,i)=>{const k=names[canon(x)];if(k)h[k]=i;});return needed.every(x=>x in h)?h:null;}
function mergeGroups(sheet,h){if(!('group' in h))return;
 for(const ref of sheet.merge){const m=/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/i.exec(ref);if(!m)continue;
  const col=cellColumn(m[1]);if(col!==h.group||col!==cellColumn(m[3]))continue;
  const from=+m[2],to=+m[4];if(to-from>1000)continue;const source=sheet.rows.find(x=>x.index===from)?.vals[col];if(!source)continue;
  for(const row of sheet.rows)if(row.index>from&&row.index<=to&&!row.vals[col])row.vals[col]=source;
 }
}
function matrix(sheets){const items=[],issues=[],used=[];
 for(const sheet of sheets){let h=null;let start=0;
  for(let i=0;i<Math.min(sheet.rows.length,40);i++){h=fields(sheet.rows[i].vals);if(h){start=i+1;break;}}
  if(!h){if(sheet.rows.some(row=>row.vals.some(v=>String(v??'').trim())))issues.push(`Лист «${sheet.title}»: не обнаружены заголовки нормализованной таблицы. Лист пропущен — проверьте источник.`);continue;}mergeGroups(sheet,h);used.push(sheet.title);
  for(let i=start;i<sheet.rows.length;i++){
   const row=sheet.rows[i];if(!row.vals.some(x=>String(x??'').trim()))continue;
   if(fields(row.vals))continue;
   const obj=Object.fromEntries(Object.entries(h).map(([key,col])=>[key,row.vals[col]??'']));
   // Ignore footer notes only if no substantive lesson columns; report otherwise.
   if(!obj.subject&&!obj.start&&!obj.end&&!obj.group)continue;
   if(!obj.subject||!obj.start||!obj.end){issues.push(`${sheet.title} · строка ${row.index}: неполная строка (проверить вручную)`);continue;}
   items.push({...obj,_sheet:sheet.title,_line:row.index});
  }
 }
 if(!used.length)throw Error('Не найдена нормализованная таблица. Нужны столбцы День, Начало, Окончание, Предмет, Недели; для факультета/курса — ещё Группа. Сложную исходную сетку сначала проверяет секретариат.');
 return {items,issues,used};
}
const dayMap={'пн':0,'понедельник':0,'вт':1,'вторник':1,'ср':2,'среда':2,'чт':3,'четверг':3,'пт':4,'пятница':4,'сб':5,'суббота':5};
const day=s=>{let v=canon(s);if(Object.hasOwn(dayMap,v))return dayMap[v];if(/^\d+$/.test(v)&&+v>=0&&+v<=5)return +v;throw Error('неизвестный день «'+s+'»')};
const clock=s=>{if(typeof s==='number'||/^0[.,]\d+$/.test(String(s))){const v=Number(String(s).replace(',','.'));if(v>=0&&v<1){const t=Math.round(v*1440)%1440;return String(Math.floor(t/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0');}}
 const m=/^(\d{1,2})[:.](\d{2})(?::\d{2})?$/.exec(String(s??'').trim());if(!m||+m[1]>23||+m[2]>59)throw Error('время «'+s+'»');return m[1].padStart(2,'0')+':'+m[2];};
const weekList=s=>{const v=canon(s);if(['четные','четная','чётные'].includes(v))return Array.from({length:9},(_,i)=>(i+1)*2);if(['нечетные','нечетная','нечётные'].includes(v))return Array.from({length:9},(_,i)=>i*2+1);
 const out=new Set();for(const part of v.split(/[;,\s]+/).filter(Boolean)) {const m=/^(\d{1,2})[-–](\d{1,2})$/.exec(part);if(m){const a=+m[1],b=+m[2];if(a>b||b>18)throw Error('недели «'+s+'»');for(let j=a;j<=b;j++)out.add(j);}else if(/^\d{1,2}$/.test(part))out.add(+part);else throw Error('недели «'+s+'»');}
 if(!out.size||[...out].some(n=>n<1||n>18))throw Error('недели «'+s+'»');return [...out].sort((a,b)=>a-b);};
const truth=s=>['да','true','1','лекция'].includes(canon(s));
const sg=s=>{const v=String(s??'').trim().replace(/\.0$/,'');if(!v)return null;if(!['1','2','3'].includes(v))throw Error('неверная подгруппа «'+v+'»');return v;};
const looksLikeGroup=s=>/^\d{4}[а-я]?$/iu.test(String(s??'').trim().replace(/\.0$/,''));
function normalize(items,source,scope){
 const errors=[],seen=new Set(),result=new Map();let notInScope=0;
 const selectGroup=$('n-import-group')?.value||'';const prog=$('n-import-program')?.value||'';const course=$('n-import-course')?.value||'';
 const allowed=g=>scope==='group'?g===selectGroup:scope==='course'?(studyProgram(g)===prog&&studyCourse(g)===course):studyProgram(g)===prog;
 for(const [i,v] of items.entries()){
  try{
   let g=String(v.group||'').trim().replace(/\.0$/,'');if(!g&&scope==='group')g=selectGroup;
   if(!looksLikeGroup(g))throw Error('не указан корректный номер группы');
   if(!Object.hasOwn(ALL_SCHEDULES,g))throw Error('группа '+g+' отсутствует в каталоге');
   if(!allowed(g)){notInScope++;continue;}
   if(['1103','1203','1303'].includes(g))throw Error('группа '+g+' защищена заглушкой: публикация запрещена');
   const kind=canon(v.lessonType||'');if(['cycle','цикл','период цикла'].includes(kind)&&!truth(v.confirmedDay))throw Error('период цикла без подтверждённого конкретного дня');
   const start=clock(v.start),end=clock(v.end);if(end<=start)throw Error('окончание не позже начала');
   const subject=String(v.subject||'').trim();if(!subject||subject.length>240)throw Error('пустое либо слишком длинное название дисциплины');
   const weeks=Array.isArray(v.weeks)?v.weeks.map(Number):weekList(v.weeks);
   if(!weeks.length||weeks.some(x=>!Number.isInteger(x)||x<1||x>18))throw Error('неверные учебные недели');
   const entry={day:day(v.day),start,end,subject,fullSubject:subject,weeks,weekSpec:String(v.weekSpec||v.weeks),row:+v._line||i+1,subgroup:sg(v.subgroup),location:String(v.location||'').trim().slice(0,240),shortLocation:String(v.location||'').trim().slice(0,240),teacher:String(v.teacher||'').trim().slice(0,240),lecture:truth(v.lecture),sourceSheet:String(v._sheet||'').slice(0,50),sourceRow:+v._line||i+1};
   if(['cycle','цикл','период цикла'].includes(kind)){entry.lessonType='cycle';entry.confirmedDay=true;}
   const key=[g,entry.day,start,end,subject,entry.subgroup||'',weeks.join(',')].join('|');if(seen.has(key))throw Error('повторяющееся занятие');seen.add(key);
   if(!result.has(g))result.set(g,[]);result.get(g).push(entry);
  }catch(e){errors.push(`${v._sheet||source} · строка ${v._line||i+1}: ${e.message}`);}
 }
 if(!result.size&&!errors.length)errors.push('В файле нет занятий для выбранного факультета, курса или группы');
 if(notInScope)errors.push(`Есть ${notInScope} записей вне выбранного масштаба. Изменения заблокированы до загрузки файла нужного объёма.`);
 for(const [g,list] of result){if(list.length>1500)errors.push('Группа '+g+': более 1500 строк');}
 if(result.size>242)errors.push('Слишком много групп');
 const diffs=[];for(const [g,list] of result){const sig=e=>[e.day,e.start,e.end,e.subject,e.subgroup||'',e.weeks?.join(',')].join('|');const baseline=periodKey()===originalPeriod?(ALL_SCHEDULES[g]||[]).filter(e=>e.lessonType!=='cycle'):(semesterDrafts.get(periodKey())?.get(g)||[]);const before=new Set(baseline.map(sig)),after=new Set(list.map(sig));diffs.push({group:g,total:list.length,added:[...after].filter(v=>!before.has(v)).length,removed:[...before].filter(v=>!after.has(v)).length,cycleCount:periodKey()===originalPeriod?(ALL_SCHEDULES[g]||[]).filter(e=>e.lessonType==='cycle').length:0});}
 return {result,errors,diffs};
}
function toCSVItems(data){const rows=csvParse(data);const header=fields(rows[0]||[]);if(!header)throw Error('CSV: отсутствуют обязательные столбцы День, Начало, Окончание, Предмет, Недели');return {items:rows.slice(1).filter(r=>r.some(x=>String(x??'').trim())).map((r,i)=>Object.fromEntries([...Object.entries(header).map(([k,j])=>[k,r[j]||'']),['_sheet','CSV'],['_line',i+2]])),issues:[],used:['CSV']};}
function fromJSON(data){const j=JSON.parse(data);const meta={embeddedSemester:j.semester||null,embeddedYear:j.academic_year||null};if(j.group&&Array.isArray(j.lessons))return {...meta,items:j.lessons.map((x,i)=>({...x,group:j.group,_sheet:'JSON',_line:i+1})),issues:[],used:['JSON']};if(j.groups&&typeof j.groups==='object')return {...meta,items:Object.entries(j.groups).flatMap(([g,entries])=>(entries||[]).map((x,i)=>({...x,group:g,_sheet:'JSON',_line:i+1}))),issues:[],used:['JSON']};throw Error('JSON должен содержать group+lessons или groups');}
const out=$('n-import-preview'),fileEl=$('n-upload-file');if(!out||!fileEl)return;
const ui=document.createElement('div');ui.className='ks-import-scope';ui.innerHTML=`<div class="ks-import-head"><span class="ks-import-eyebrow">БЕЗОПАСНЫЙ МАСТЕР ОБНОВЛЕНИЯ</span><h3>Выберите, что обновляем</h3><p>Excel-файл преобразуется в черновик, который можно проверить до передачи редактором на сервер. Ничего не публикуется автоматически. Обновятся только группы, найденные в файле; другие группы останутся без изменений.</p></div><div class="ks-import-semester" aria-label="Период расписания"><div class="ks-import-period-title"><span class="ks-import-step-number">01</span><div><strong>Учебный период</strong><small>Осенний и весенний семестры хранятся раздельно</small></div></div><div class="ks-import-period-controls"><label class="ks-import-academic-year">Учебный год <span class="ks-year-field"><input id="n-import-academic-year" type="number" inputmode="numeric" min="1900" max="9998" step="1" value="2026" required aria-label="Первый год учебного года" aria-describedby="n-import-year-help"><span id="n-import-year-next" class="ks-year-next">/27</span></span><small id="n-import-year-help">Введите первый год, например 2035 → 2035/36</small></label><fieldset class="ks-import-semester-switch"><legend>Семестр</legend><div class="ks-import-segmented"><label><input type="radio" name="ksmu-import-semester" value="autumn" checked><span>Осенний</span></label><label><input type="radio" name="ksmu-import-semester" value="spring"><span>Весенний</span></label></div></fieldset></div><div id="n-import-semester-hint" class="ks-import-period-hint" role="status">Исходная база: осенний семестр 2026/27. Остальные периоды не затрагиваются.</div></div><div class="ks-import-period-title ks-import-step-heading"><span class="ks-import-step-number">02</span><div><strong>Кого обновляем</strong><small>Другие группы и курсы останутся без изменений</small></div></div><div class="ks-import-fields"><label>Масштаб <select id="n-import-scope"><option value="group">Одна группа</option><option value="course">Весь курс</option><option value="faculty">Направление / факультет</option></select></label><label>Направление <select id="n-import-program"></select></label><label id="n-import-course-box">Курс <select id="n-import-course"></select></label><label id="n-import-group-box">Группа <select id="n-import-group"></select></label></div><div class="ks-import-approval"><div class="ks-import-period-title"><span class="ks-import-step-number">03</span><div><strong>Документ и подтверждение</strong><small>Проверяем источник до обновления</small></div></div><div class="ks-import-approval-fields"><label>Дата утверждения <input type="date" id="n-import-signed-date" aria-label="Дата утверждения расписания"></label><label>Комментарий к изменению <input id="n-import-change-note" maxlength="200" placeholder="Например: изменения с 5-й недели"></label></div><label class="ks-import-check"><input type="checkbox" id="n-import-verified"><span>Я проверил(а) учебный год, семестр и оригинал расписания. Понимаю, что изменения сначала создают черновик.</span></label><label class="ks-import-check ks-import-danger-confirm" id="n-import-replace-box" hidden><input type="checkbox" id="n-import-full-replace"><span id="n-import-replace-message">Будут удалены старые записи. Подтверждаю, что в загружаемом файле есть полное новое расписание перечисленных групп.</span></label></div><div class="ks-import-notice">Поддерживается <strong>.xlsx</strong>, CSV и JSON со стандартными колонками: группа, день, начало, окончание, предмет, недели, подгруппа, аудитория, преподаватель. Объединённые номера группы распознаются, остальные неоднозначные ячейки требуют ручной проверки.</div><button class="ks-import-template" id="n-import-template" type="button">↓ Скачать образец Excel (.xlsx)</button></div>`;
const card=fileEl.closest('.n-import-card');card?.insertBefore(ui,card.firstChild);
const access=document.createElement('div');access.id='n-import-editor-state';access.className='ks-editor-state';access.setAttribute('role','status');access.setAttribute('aria-live','polite');
access.innerHTML='<span class="ks-editor-dot" aria-hidden="true"></span><div><b>Проверка без входа</b><small>Открывайте Excel и скачивайте результат. Отправка на сервер требует входа редактора.</small></div><button type="button" class="ks-editor-go" data-nview="profile">В профиль</button>';
ui.insertBefore(access,ui.firstChild);
const filterPanel=document.createElement('div');filterPanel.className='ks-import-filter';filterPanel.innerHTML='<label>Поиск в отчёте по группе <input type="search" id="n-import-report-filter" placeholder="Например, 1307" autocomplete="off"></label><span id="n-import-filter-count" class="ks-filter-count"></span>';
filterPanel.hidden=true;out.parentNode?.insertBefore(filterPanel,out);
fileEl.accept='.xlsx,.csv,.json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/json,text/csv';fileEl.previousElementSibling.textContent='Загрузите Excel, CSV или JSON (до 12 МБ)';
const dropzone=document.createElement('label');dropzone.htmlFor='n-upload-file';dropzone.className='ks-import-dropzone';
dropzone.innerHTML='<span class="ks-upload-symbol" aria-hidden="true">↑</span><span><b>Выбрать файл или перетащить сюда</b><small>Excel .xlsx, CSV, JSON · до 12 МБ · данные остаются в браузере до подтверждённой отправки</small></span>';
fileEl.insertAdjacentElement('afterend',dropzone);
for(const type of ['dragenter','dragover'])dropzone.addEventListener(type,e=>{e.preventDefault();dropzone.classList.add('is-dragging')});
for(const type of ['dragleave','drop'])dropzone.addEventListener(type,e=>{e.preventDefault();dropzone.classList.remove('is-dragging')});
dropzone.addEventListener('drop',e=>{const files=e.dataTransfer?.files;if(!files?.length)return;if(files.length!==1){out.textContent='Загрузите один файл за раз, чтобы проверить каждый источник отдельно.';return;}try{fileEl.files=files;fileEl.dispatchEvent(new Event('change',{bubbles:true}))}catch{out.textContent='Не получилось перенести файл. Выберите его обычной кнопкой.'}});
const reportDownload=document.createElement('button');reportDownload.type='button';reportDownload.className='n-secondary ks-report-download';reportDownload.id='n-import-report-download';reportDownload.textContent='↓ Скачать CSV-отчёт';reportDownload.disabled=true;
const actionRow=$('n-import-download')?.parentElement;actionRow?.insertBefore(reportDownload,$('n-import-download'));
const actions=$('n-import-stage')?.parentElement;const apply=document.createElement('button');apply.type='button';apply.className='n-secondary';apply.id='n-import-apply';apply.textContent='Просмотреть отчёт без изменения расписания';apply.disabled=true;actions?.insertBefore(apply,$('n-import-stage'));
const scopeEl=$('n-import-scope'),program=$('n-import-program'),course=$('n-import-course'),group=$('n-import-group');
const replaceEl=$('n-import-full-replace'),replaceBox=$('n-import-replace-box');
const yearEl=$('n-import-academic-year'),semesterRadio=()=>document.querySelector('input[name="ksmu-import-semester"]:checked'),verifiedEl=$('n-import-verified'),signedEl=$('n-import-signed-date'),noteEl=$('n-import-change-note');
const stageBtn=$('n-import-stage');let editorPermission=null;
const offline=()=>Boolean(window.KSMU_PREVIEW_ONLY||location.protocol==='file:'||!/^https?:$/.test(location.protocol));
const bearer=()=>typeof cloudSession!=='undefined'&&cloudSession?.access_token?{'Authorization':'Bearer '+cloudSession.access_token}:{};
const hasEditorRole=()=>Boolean(editorPermission?.authenticated&&['editor','publisher','admin'].includes(editorPermission.role));
const hasScope=()=>Boolean(hasEditorRole()&&prepared?.groups&&[...prepared.groups.keys()].every(g=>!Array.isArray(editorPermission.allowedGroups)||editorPermission.allowedGroups.includes('*')||editorPermission.allowedGroups.includes(g)));
function setStageAccess(){stageBtn.disabled=!(academicYear()&&prepared?.valid&&verifiedEl.checked&&(replaceBox.hidden||replaceEl.checked)&&hasScope());stageBtn.title=offline()?'Автономный режим: отправка недоступна':!hasEditorRole()?'Войдите редактором через сервер':!hasScope()?'Недостаточно прав для выбранных групп':'';}
async function refreshEditorAccess(){
 editorPermission=null;setStageAccess();
 if(offline()){access.dataset.level='offline';access.querySelector('b').textContent='Локальная проверка';access.querySelector('small').textContent='Расписание защищено: в автономной версии можно проверить Excel и скачать отчёт, но нельзя изменить или опубликовать расписание.';return;}
 access.dataset.level='checking';access.querySelector('b').textContent='Проверяем права редактора…';
 try{
  const r=await fetch('/api/auth/me',{method:'GET',cache:'no-store',credentials:'same-origin',headers:{...bearer()}});
  if(!r.ok)throw Error('сервер не подтвердил доступ');const j=await r.json();
  if(j.authenticated&&['editor','publisher','admin'].includes(j.role)){editorPermission=j;access.dataset.level='authorized';access.querySelector('b').textContent='Доступ подтверждён: '+(j.role==='editor'?'редактор':j.role==='publisher'?'утверждающий':'администратор');access.querySelector('small').textContent='Загрузка доступна по назначенным группам. Публикация — отдельное действие после проверки.';}
  else{access.dataset.level='guest';access.querySelector('b').textContent='Требуется вход редактора';access.querySelector('small').textContent='Просмотр Excel открыт всем, отправка и изменения расписания заблокированы.';}
 }catch(e){access.dataset.level='guest';access.querySelector('b').textContent='Серверные права не подтверждены';access.querySelector('small').textContent='Проверьте вход в профиле и подключение API авторизации.';}
 setStageAccess();
}
document.addEventListener('click',e=>{if(e.target.closest('[data-nview="import"]'))void refreshEditorAccess();},true);
window.addEventListener('ksmu:editor-session-changed',()=>void refreshEditorAccess());
access.querySelector('button').addEventListener('click',()=>document.querySelector('#n-profile')?.scrollIntoView({behavior:'smooth',block:'start'}));
setTimeout(()=>void refreshEditorAccess(),0);
const academicYear=()=>{const y=Number(yearEl.value);return /^\d{4}$/.test(yearEl.value)&&Number.isInteger(y)&&y>=1900&&y<=9998?`${y}-${y+1}`:''};
const updateYearCaption=()=>{const y=Number(yearEl.value),next=$('n-import-year-next');next.textContent=academicYear()?'/'+String((y+1)%100).padStart(2,'0'):'/??';yearEl.setAttribute('aria-invalid',academicYear()?'false':'true')};
const periodKey=()=>academicYear()+':'+semesterRadio().value;
const originalPeriod='2026-2027:autumn';
const semesterDrafts=new Map(); // explicit separation: spring cannot replace the autumn baseline
const periodName=()=>semesterRadio().value==='autumn'?'осенний':'весенний';
const renderSemesterHint=()=>{updateYearCaption();const current=periodKey()===originalPeriod;const hint=$('n-import-semester-hint');hint.textContent=!academicYear()?'Введите корректный четырёхзначный год от 1900 до 9998.':current?'Осень 2026/27 — исходный учебный период; просмотр не меняет действующее расписание.':`Выбран ${periodName()} семестр ${academicYear().replace('-', '/')}. Для него будет создан отдельный черновик; действующее осеннее расписание останется без изменений.`;hint.classList.toggle('is-separate',!current);};
const invalidate=message=>{prepared=null;apply.disabled=true;$('n-import-download').disabled=true;setStageAccess();filterPanel.hidden=true;reportDownload.disabled=true;out.textContent=message||'Загрузите файл после выбора периода и масштаба.';fileEl.value='';replaceEl.checked=false;replaceBox.hidden=true;};
const validateApproval=()=>{const ok=Boolean(academicYear()&&prepared?.valid&&verifiedEl.checked&&(replaceBox.hidden||replaceEl.checked));apply.disabled=!ok;$('n-import-download').disabled=!prepared?.valid;setStageAccess();};
yearEl.addEventListener('input',()=>{renderSemesterHint();verifiedEl.checked=false;invalidate(academicYear()?'Выбран другой учебный год. Загрузите соответствующий файл.':'Введите корректный год от 1900 до 9998.');});
document.querySelectorAll('input[name="ksmu-import-semester"]').forEach(el=>el.addEventListener('change',()=>{renderSemesterHint();verifiedEl.checked=false;invalidate('Выбран другой семестр. Загрузите соответствующий файл.');}));
verifiedEl.addEventListener('change',validateApproval);replaceEl.addEventListener('change',validateApproval);signedEl.addEventListener('change',validateApproval);noteEl.addEventListener('input',validateApproval);
renderSemesterHint();let prepared=null;
program.innerHTML=Object.entries(PROGRAM_CONFIG).map(([k,p])=>`<option value="${html(k)}">${html(p.label)}</option>`).join('');
function populate(){const courses=PROGRAM_CONFIG[program.value]?.courses||{};const c=course.value;course.innerHTML=Object.keys(courses).map(k=>`<option value="${html(k)}">${html(k)} курс</option>`).join('');if(c in courses)course.value=c;const gs=Object.values(courses[course.value]||{}).flat();const g=group.value;group.innerHTML=gs.map(v=>`<option value="${html(v)}">${html(v)}</option>`).join('');if(gs.includes(g))group.value=g;
 $('n-import-group-box').hidden=scopeEl.value!=='group';$('n-import-course-box').hidden=scopeEl.value==='faculty';
 invalidate('Выберите Excel, CSV или JSON после настройки масштаба.');
}
program.addEventListener('change',populate);course.addEventListener('change',populate);scopeEl.addEventListener('change',populate);group.addEventListener('change',()=>invalidate('Выберите файл для выбранной группы.'));
function syncCurrentStudyGroup(){
 const current=selectedStudyGroup||'1307',p=studyProgram(current),c=studyCourse(current);
 if(!Object.hasOwn(PROGRAM_CONFIG,p))return;
 if(program.value!==p){program.value=p;populate();}
 if(course.value!==c){course.value=c;populate();}
 if([...group.options].some(o=>o.value===current)&&group.value!==current){group.value=current;invalidate('Выберите файл для группы '+current+'.');}
}
program.value=studyProgram(selectedStudyGroup||'1307');populate();course.value=studyCourse(selectedStudyGroup||'1307');populate();syncCurrentStudyGroup();
document.addEventListener('click',e=>{if(e.target.closest('[data-nview="import"]'))syncCurrentStudyGroup();},true);
function save(name,obj){const u=URL.createObjectURL(new Blob([typeof obj==='string'?obj:JSON.stringify(obj,null,2)],{type:'application/json;charset=utf-8'}));const a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),2000);}
// Real .xlsx workbook, embedded for offline and hosted builds (no external download required).
const templateXlsxBase64Autumn='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';
const templateXlsxBase64Spring='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';
$('n-import-template').onclick=()=>{
 const bytes=Uint8Array.from(atob(semesterRadio().value==='spring'?templateXlsxBase64Spring:templateXlsxBase64Autumn),c=>c.charCodeAt(0));
 const url=URL.createObjectURL(new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
 const a=document.createElement('a');a.href=url;a.download='KSMU_Excel_Template_'+(academicYear()||'year')+'_'+semesterRadio().value+'.xlsx';a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);
};
fileEl.onchange=async()=>{
 prepared=null;verifiedEl.checked=false;replaceEl.checked=false;replaceBox.hidden=true;apply.disabled=true;$('n-import-download').disabled=true;setStageAccess();filterPanel.hidden=true;reportDownload.disabled=true;
 const file=fileEl.files?.[0];if(!file)return;
 if(file.size>12e6){out.textContent='Файл больше 12 МБ. Разделите обновление по курсам или группам.';return;}
 out.textContent='Читаем Excel и проверяем структуру…';
 try{const ext=file.name.split('.').pop().toLowerCase();let parsed;
 if(ext==='xlsx')parsed=matrix(await xlsxSheets(await file.arrayBuffer()));
 else if(ext==='csv')parsed=toCSVItems(await file.text());
 else if(ext==='json')parsed=fromJSON(await file.text());
 else throw Error('Поддерживаются только .xlsx, .csv или .json');
 const semester=semesterRadio().value,year=academicYear();if(!year)throw Error('Укажите корректный учебный год (начальный год от 1900 до 9998).');
 const namesOfSheets=parsed.used.map(canon),labelFall=namesOfSheets.some(n=>/осен|autumn|fall/.test(n)),labelSpring=namesOfSheets.some(n=>/весен|spring/.test(n));
 const errors=[...parsed.issues];if(labelFall&&semester==='spring')errors.push('В Excel указан осенний семестр, а выбран весенний. Уточните файл или период.');
 if(labelSpring&&semester==='autumn')errors.push('В Excel указан весенний семестр, а выбран осенний. Уточните файл или период.');
 if(parsed.embeddedSemester&&parsed.embeddedSemester!==semester)errors.push('Семестр из JSON не совпадает с выбранным периодом.');
 if(parsed.embeddedYear&&parsed.embeddedYear!==year)errors.push('Учебный год из JSON не совпадает с выбранным периодом.');
 const checked=normalize(parsed.items,file.name,scopeEl.value);errors.push(...checked.errors);
 const total=checked.diffs.reduce((n,x)=>n+x.total,0),valid=!errors.length&&total>0;
 prepared={valid,groups:checked.result,diffs:checked.diffs,source:file.name,scope:scopeEl.value,program:program.value,course:course.value,errors,academic_year:year,semester,period:periodKey(),signed_at:signedEl.value,comment:noteEl.value};
 const removalCount=checked.diffs.reduce((n,d)=>n+d.removed,0);
 replaceBox.hidden=!valid||!removalCount;replaceEl.checked=false;
 if(removalCount)$('n-import-replace-message').textContent=`Исчезают ${removalCount} старых записей. Подтверждаю: файл содержит полное новое расписание выбранных групп, удаление прежних пар проверено.`;
 out.innerHTML=`<div class="ks-import-result"><strong>${valid?'Черновик подготовлен':'Требуется исправление'}</strong><span>${checked.diffs.length} групп · ${total} занятий · ${parsed.used.length} листов · ${semester==='autumn'?'Осенний':'Весенний'} ${year.replace('-', '/')}</span></div><div class="ks-import-statgrid"><span><b>${checked.diffs.reduce((n,d)=>n+d.added,0)}</b><small>Новых строк</small></span><span><b>${checked.diffs.reduce((n,d)=>n+d.removed,0)}</b><small>Исчезающих строк</small></span><span><b>${checked.diffs.length}</b><small>Групп с данными</small></span></div>`+(checked.diffs.length?`<div class="ks-import-table-wrap"><table class="ks-import-table"><thead><tr><th>Группа</th><th>Записей</th><th>Добавлено</th><th>Исчезает</th></tr></thead><tbody>${checked.diffs.map(d=>`<tr><td>${html(d.group)}</td><td>${d.total}</td><td>+${d.added}</td><td>−${d.removed}</td></tr>`).join('')}</tbody></table></div>`:'')+(errors.length?`<div class="ks-import-errors" role="alert"><b>Исправить перед продолжением (${errors.length}):</b><ul>${errors.slice(0,12).map(e=>`<li>${html(e)}</li>`).join('')}</ul>${errors.length>12?'<p>Показаны первые 12 ошибок.</p>':''}</div>`:'<div class="ks-import-success">Структура проверена. Перед публикацией сравните расписание с подписанным документом.</div>')+`<details class="ks-import-details"><summary>Показать примеры занятий из файла</summary><div>${[...checked.result].slice(0,3).map(([g,rows])=>`<div class="ks-import-example"><b>Группа ${html(g)}</b>${rows.slice(0,4).map(v=>`<span>${['Пн','Вт','Ср','Чт','Пт','Сб'][v.day]} · ${html(v.start)}–${html(v.end)} · ${html(v.subject)}</span>`).join('')}${rows.length>4?`<small>И ещё ${rows.length-4} записей</small>`:''}</div>`).join('')}</div></details>`;
 reportDownload.disabled=!checked.diffs.length;filterPanel.hidden=!checked.diffs.length;
 $('n-import-report-filter').value='';$('n-import-filter-count').textContent=checked.diffs.length+' групп';
 validateApproval();
 }catch(err){out.textContent='Ошибка чтения: '+err.message;replaceBox.hidden=true;}
};
$('n-import-report-filter').addEventListener('input',e=>{
 const q=e.target.value.trim().toLowerCase();let n=0;
 out.querySelectorAll('.ks-import-table tbody tr').forEach(row=>{const show=row.cells[0]?.textContent.toLowerCase().includes(q);row.hidden=!show;if(show)n++});
 $('n-import-filter-count').textContent=n+' из '+(prepared?.diffs.length||0);
});
reportDownload.onclick=()=>{
 if(!prepared?.diffs.length)return;
 const rows=[['Группа','Учебный год','Семестр','Всего занятий','Добавлено','Исчезает'],...prepared.diffs.map(d=>[d.group,prepared.academic_year,prepared.semester,d.total,d.added,d.removed])];
 const csv='\uFEFF'+rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(';')).join('\r\n');
 const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='KSMU_отчёт_'+prepared.academic_year+'_'+prepared.semester+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),2500);
};
$('n-import-download').onclick=()=>{if(!prepared?.valid)return;const groups=Object.fromEntries(prepared.groups);save('KSMU_'+prepared.academic_year+'_'+prepared.semester+'_'+prepared.scope+'_review.json',{format:'ksmu-schedule-import-batch-v2',source:prepared.source,scope:prepared.scope,program:prepared.program,course:prepared.course,academic_year:prepared.academic_year,semester:prepared.semester,signed_at:signedEl.value||null,comment:noteEl.value.trim(),verified_by_operator:verifiedEl.checked,confirmed_full_replace:replaceBox.hidden||replaceEl.checked,created_at:new Date().toISOString(),groups});};
apply.onclick=()=>{
 if(!prepared?.valid||!academicYear()||!verifiedEl.checked||(!replaceBox.hidden&&!replaceEl.checked))return;
 const detail=out.querySelector('.ks-import-details');
 if(detail){detail.open=!detail.open;detail.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'nearest'});}
};
$('n-import-stage').onclick=async()=>{
 if(!prepared?.valid||!academicYear()||!verifiedEl.checked||(!replaceBox.hidden&&!replaceEl.checked))return;
 if(!signedEl.value){out.insertAdjacentHTML('beforeend','<p class="ks-import-errors">Укажите дату утверждения документа перед серверной проверкой.</p>');return;}
 if(offline()){out.insertAdjacentHTML('beforeend','<p class="ks-import-errors">Автономная версия: отправка заблокирована. Проверить и скачать отчёт можно без входа.</p>');return;}
 await refreshEditorAccess();
 if(!hasScope()){out.insertAdjacentHTML('beforeend','<p class="ks-import-errors" role="alert">Сервер не подтвердил роль редактора или доступ к одной из выбранных групп. Войдите через «Мой профиль».</p>');return;}
 if(!confirm('Передать '+prepared.groups.size+' групп на серверную проверку? Действующее расписание не изменится до отдельного утверждения.'))return;
 const b=$('n-import-stage');b.disabled=true;
 try{
  const response=await fetch('/api/schedule/batch-drafts',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json',...bearer()},body:JSON.stringify({format:'ksmu-schedule-import-batch-v2',academic_year:prepared.academic_year,semester:prepared.semester,signed_at:signedEl.value,source:prepared.source,comment:noteEl.value.trim(),change_mode:'full-replace',confirmed_full_replace:Boolean(replaceBox.hidden||replaceEl.checked),groups:Object.fromEntries(prepared.groups)})});
  const payload=await response.json();if(!response.ok)throw Error(payload.error||String(response.status));
  out.insertAdjacentHTML('beforeend',`<p class="ks-import-success">Весь пакет (${payload.groups} групп) передан на проверку одним действием. Публикация выполняется отдельно уполномоченным сотрудником.</p>`);
 }catch(e){out.insertAdjacentHTML('beforeend',`<p class="ks-import-errors">Не удалось передать пакет: ${html(e.message)}. Черновик можно скачать в JSON, чтобы не потерять проверенные данные.</p>`);}
 await refreshEditorAccess();
};
window.KSMUExcelImport={xlsxSheets,normalize,fromJSON,toCSVItems,semesterDrafts,periodKey,academicYear,refreshEditorAccess};
})();
