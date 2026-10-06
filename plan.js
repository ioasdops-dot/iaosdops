/* IAOS 휴무계획 공용 모듈 — PL v2 (그룹앱·사업부 앱이 같이 씁니다)
   사용: var P=IAOSPlan.init({rpc,canEdit,today,divName,render,div,divs,back,accounts}); html=P.view(); P.load();
   host.rpc(name,args)=Promise(결과) / host.render()=화면 다시 그리기 */
(function(){
'use strict';
if(window.IAOSPlan)return;
var VERSION='PL v2';
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function pad(n){return(n<10?'0':'')+n;}
function ymd(y,m,d){return y+'-'+pad(m)+'-'+pad(d);}
function daysIn(y,m){return new Date(y,m,0).getDate();}
function $(id){return document.getElementById(id);}
function injectCss(){if($('plxCss'))return;var st=document.createElement('style');st.id='plxCss';st.textContent="\n.plx{--card:#fff;--ink:#2B2F36;--mut:#7A8190;--line:#E3E6EB;font-family:-apple-system,\"Apple SD Gothic Neo\",\"Noto Sans KR\",sans-serif;color:var(--ink);font-size:14px;line-height:1.4}\n.plx *{box-sizing:border-box}\n.plx .card{background:var(--card);border-radius:18px;padding:13px 14px;margin-bottom:10px;border:1px solid var(--line)}\n.plx .card h3{font-size:13px;margin:0 0 10px;display:flex;justify-content:space-between;align-items:center;font-weight:800}\n.plx .card h3 small{font-weight:500;color:var(--mut);font-size:11px}\n.plx .empty{color:var(--mut);font-size:13px;text-align:center;padding:18px 0;line-height:1.5}\n.plx .note{font-size:11px;color:#9AA0AB;text-align:center;margin-top:10px}\n.plx .dp{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:10px}\n.plx .dp .md{display:flex;background:#E6E8EC;border-radius:99px;padding:2px}\n.plx .dp .md button{border:0;background:none;padding:5px 12px;border-radius:99px;font-size:12px;font-weight:700;color:var(--mut);font-family:inherit}\n.plx .dp .md button.on{background:#fff;color:var(--ink);box-shadow:0 1px 3px #2b2f3620}\n.plx .at-sheet{position:fixed;inset:0;background:rgba(20,24,32,.45);display:flex;align-items:flex-end;justify-content:center;z-index:100000}\n.plx .at-sh{background:#fff;border-radius:18px 18px 0 0;padding:16px 14px 20px;width:100%;max-width:560px;max-height:92vh;overflow-y:auto}\n.plx .at-sh h3{margin:0 0 10px;font-size:15px}.plx .at-sh h3 small{font-weight:600;color:var(--mut);font-size:11px;margin-left:6px}\n.plx .sp-in{width:100%;padding:10px;border:1.5px solid var(--line);border-radius:12px;font:inherit;font-size:14px;margin-bottom:8px;background:#fff;min-width:0;color:var(--ink)}\n.plx input.sp-in[type=date]{min-height:42px}\n.plx .sp-btn{border:0;border-radius:12px;padding:10px 14px;font-weight:800;font-size:13px;background:#2B2F36;color:#fff;font-family:inherit;cursor:pointer}\n.plx .sp-btn.g{background:#E6E8EC;color:var(--ink)}.plx .sp-btn.r{background:#FDE9ED;color:#C0485F}\n";document.head.appendChild(st);}
var H=null;
function init(host){
H=host;injectCss();
function render(){H.render();}
var PL={div:H.div||'ALL',emps:[],off:{},qs:{},rule:null,hol:[],hist:[],q:'',tab:'list',f:{off:'',pos:'',s:'',team:''},sheet:null,log:[],lf:'',lt:'',month:'',loaded:false};
var PL_DEF={company:'IAOS',site:'1000',day_weekday:'1',day_sat:'2',day_sun:'3',day_holiday:'7',tkg_code:'B0008',tm_base:'P01',tm_off:'P26',tm_leave:'P27',holiday_off:true,extra_holidays:[],codes_tkg:[],codes_tm:[],shifts:[{name:'일근',tkg:'B0008',tm:'P01'},{name:'총괄',tkg:'B0009',tm:'S03'},{name:'오전',tkg:'B0010',tm:'S01'},{name:'오후',tkg:'B0011',tm:'S06'},{name:'야간',tkg:'B0012',tm:'S07'}]};
var PL_DEFDIV=Object.assign({},PL_DEF,{tkg_code:'B0009',tm_base:'P01',holiday_off:false,shifts:[
  {name:'행정',tkg:'B0008',tm:'P01',hol:true},{name:'총괄',tkg:'B0009',tm:'S03',hol:false},{name:'오전',tkg:'B0010',tm:'S01',hol:false},
  {name:'오후',tkg:'B0011',tm:'S06',hol:false},{name:'야간',tkg:'B0012',tm:'S07',hol:false},{name:'일근',tkg:'B0009',tm:'P01',hol:false}]});
function plDivName(d){return d==='ALL'?'그룹':H.divName(d);}
function plDef(){return PL.div==='ALL'?PL_DEF:PL_DEFDIV;}
/* 그룹은 group_wf_*, 사업부는 group_dv_* 함수를 씁니다 */
function plRpc(n,a){a=a||{};if(PL.div==='ALL')return H.rpc('group_wf_'+n,a);var b={p_div:PL.div};for(var k in a)b[k]=a[k];return H.rpc('group_dv_'+n,b);}
var PL_WD=['일','월','화','수','목','금','토'], PL_WK=['월','화','수','목','금','토','일'];
function plQNow(){var t=H.today();return t.y+'-Q'+Math.ceil(t.m/3);}
function plQLabel(q){return q.slice(2,4)+'년 '+q.slice(6)+'분기';}
function plQList(){var t=H.today(),o=[];for(var y=t.y-1;y<=t.y+1;y++)for(var k=1;k<=4;k++)o.push(y+'-Q'+k);return o;}
function plRule(){return Object.assign({},plDef(),PL.rule||{});}
function plOffOf(no,q){var o=PL.off[no]||{};return o[q]||'';}
function plPrevQ(q){var y=+q.slice(0,4),k=+q.slice(6);return k===1?(y-1)+'-Q4':y+'-Q'+(k-1);}
function plEffQ(ds){var y=ds.slice(0,4),k=Math.ceil(+ds.slice(5,7)/3),cq=y+'-Q'+k,s=PL.qs[cq];return(s&&ds<s)?plPrevQ(cq):cq;}
function plParseOff(s){if(!s||s==='(없음)'||s==='(신규 등록)')return[];return String(s).split('·').filter(function(x){return x;});}
function plKstDate(iso){var d=new Date(new Date(iso).getTime()+9*3600000);return d.toISOString().slice(0,10);}
/* 어느 날짜에 이 사람이 쉬는 요일: 분기 적용 시작일 + 수정이력(수정일 전/후)까지 반영 */
function plOffOn(no,ds){
  var eq=plEffQ(ds),o=PL.off[no]||{},useQ=null,ks=Object.keys(o).sort();
  for(var i=0;i<ks.length;i++){if(ks[i]<=eq)useQ=ks[i];}
  if(!useQ)return[];
  var cur=plParseOff(o[useQ].replace(/^(.)(.)$/,'$1·$2'));
  var h=PL.hist.filter(function(x){return x.emp_no===no&&x.quarter===useQ;}).map(function(x){return{eff:plKstDate(x.changed_at),o:x.old_value,n:x.new_value};});
  if(!h.length)return cur;
  if(ds<h[0].eff)return plParseOff(h[0].o);
  var ap=h[0];for(var j=0;j<h.length;j++){if(h[j].eff<=ds)ap=h[j];else break;}
  return plParseOff(ap.n);
}
function plLoad(){
  if(!PL.q)PL.q=plQNow();
  if(!PL.month){var t=H.today();PL.month=t.y+'-'+pad(t.m);}
  return plRpc('load',{}).then(function(r){
    r=Array.isArray(r)?(r[0]||{}):(r||{});
    PL.emps=r.emps||[];PL.off={};PL.qs={};
    (r.off||[]).forEach(function(x){(PL.off[x.emp_no]=PL.off[x.emp_no]||{})[x.quarter]=(x.off_day1||'')+(x.off_day2||'');});
    (r.qstart||[]).forEach(function(x){PL.qs[x.quarter]=String(x.start_date).slice(0,10);});
    PL.rule=Object.assign({},plDef(),r.rule||{});PL.hol=r.holidays||[];PL.hist=r.hist||[];PL.loaded=true;render();
  }).catch(function(e){var el=$('p-at');if(el)el.innerHTML='<div class="card empty">휴무계획을 불러오지 못했어요.<br>'+esc((e&&e.message)||'')+'<br><small>SQL 29번을 실행했는지 확인해 주세요.</small></div>';});
}
function plFiltered(){
  var f=PL.f,q=PL.q;
  return PL.emps.filter(function(e){
    var off=plOffOf(e.emp_no,q);
    if(f.off&&off!==f.off&&off!==f.off[1]+f.off[0])return false;
    if(f.pos&&(e.position||'')!==f.pos)return false;
    if(f.team&&(e.team||'')!==f.team)return false;
    if(f.s&&(String(e.name)+String(e.emp_no)).indexOf(f.s)<0)return false;
    return true;
  });
}
function plListBody(){
  var rows=plFiltered(),q=PL.q;
  if(!rows.length)return'<div class="empty">'+(PL.emps.length?'조건에 맞는 직원이 없어요.':'등록된 직원이 없어요. 엑셀 업로드 또는 ＋직원 추가로 등록하세요.')+'</div>';
  return rows.map(function(e){
    var off=plOffOf(e.emp_no,q);
    return'<div '+(H.canEdit()?'data-plx="edit|'+esc(e.emp_no)+'" ':'')+'style="display:flex;align-items:center;gap:8px;border:1px solid var(--line);border-radius:14px;padding:10px 12px;margin-bottom:6px;background:#fff'+(H.canEdit()?';cursor:pointer':'')+'">'
     +'<div style="flex:1;min-width:0"><div style="font-size:14px;font-weight:800">'+esc(e.name)+' <small style="font-weight:600;color:var(--mut)">'+esc(e.position||'')+(PL.div==='ALL'?'':(e.team?' · '+esc(e.team):''))+(e.group_name?' · '+esc(e.group_name):'')+(e.shift_type?' · '+esc(e.shift_type):'')+'</small></div>'
     +'<div style="font-size:11px;color:var(--mut);margin-top:2px">'+esc(e.emp_no)+(e.leave_type?' · <b style="color:#C0392B">'+esc(e.leave_type)+' '+String(e.leave_start||'').slice(5)+'~'+String(e.leave_end||'').slice(5)+'</b>':'')+'</div></div>'
     +(off?'<span style="background:#F1F5F9;color:#334155;border-radius:10px;padding:6px 10px;font-size:13px;font-weight:800">'+off[0]+'·'+off[1]+'</span>':'<span style="color:#C0485F;font-size:12px;font-weight:700">미등록</span>')+'</div>';
  }).join('');
}
function plLogBody(){
  if(!PL.log.length)return'<div class="empty">조회된 이력이 없어요. 기간을 정하고 조회를 눌러주세요.</div>';
  return PL.log.map(function(x){
    var d=new Date(x.changed_at),ts=isNaN(d)?'':(d.getMonth()+1)+'/'+d.getDate()+' '+pad(d.getHours())+':'+pad(d.getMinutes());
    var m=String(x.changed_by||'').match(/^(.*)\s\((엑셀업로드|앱수정)\)$/),src=m?m[2]:'',who=m?m[1]:(x.changed_by||'-');
    return'<div style="border-bottom:1px solid #F0F1F4;padding:8px 2px;font-size:13px"><div><b>'+esc(x.emp_name||'')+'</b> <span style="color:var(--mut)">'+esc(x.emp_no||'')+'</span> · '+esc(x.field_name)+(x.quarter?' ('+esc(plQLabel(x.quarter))+')':'')
     +(src?' <span style="background:'+(src==='엑셀업로드'?'#FEF3E2':'#E6F6F3')+';border-radius:8px;padding:1px 6px;font-size:10.5px;font-weight:800">'+src+'</span>':'')+'</div>'
     +'<div style="color:var(--mut);font-size:11px;margin-top:2px">'+esc(x.old_value||'')+' → <b>'+esc(x.new_value||'')+'</b> · '+esc(who)+' · '+ts+'</div></div>';
  }).join('');
}
function plSheet(){
  var S=PL.sheet;if(!S)return'';
  var opt=function(sel){return'<option value="">(없음)</option>'+PL_WK.map(function(w){return'<option'+(w===sel?' selected':'')+'>'+w+'</option>';}).join('');};
  if(S.type==='rule'){
    var R=S.R||plRule(),fld=function(k,l){return'<label style="font-size:11px;color:var(--mut)">'+l+'<input class="sp-in" id="plR_'+k+'" value="'+esc(R[k])+'" style="margin-bottom:6px"></label>';};
    var sh=(R.shifts||[]).map(function(x,i){return'<div style="display:grid;grid-template-columns:1.1fr 1fr 1fr auto;gap:6px;align-items:start"><input class="sp-in" id="plRS_n'+i+'" value="'+esc(x.name||'')+'" placeholder="이름"><input class="sp-in" id="plRS_t'+i+'" value="'+esc(x.tkg||'')+'" placeholder="근무조코드"><input class="sp-in" id="plRS_m'+i+'" value="'+esc(x.tm||'')+'" placeholder="시간코드"><button type="button" class="sp-btn r" data-plx="rdelrow|'+i+'" style="padding:10px 11px">✕</button></div><label style="display:flex;gap:6px;align-items:center;font-size:11px;color:var(--mut);margin:-2px 0 8px 4px"><input type="checkbox" id="plRS_h'+i+'"'+((x.hol===undefined?R.holiday_off:x.hol)?' checked':'')+'> 이 근무조는 공휴일에 휴무 처리</label>';}).join('');
    return'<div class="at-sheet" data-plx="close"><div class="at-sh" style="max-height:88vh;overflow:auto"><h3>⚙ ERP 생성 규칙 <small>수정한 값으로 다운로드 파일이 만들어져요</small></h3>'
     +'<div style="font-size:12px;font-weight:800;margin:2px 0 6px">근무조 · 시간코드 표</div>'
     +'<div style="display:grid;grid-template-columns:1.1fr 1fr 1fr auto;gap:6px;font-size:10.5px;color:var(--mut);margin-bottom:2px"><span>근무조 이름</span><span>근무조코드</span><span>시간코드</span><span style="width:38px"></span></div>'+sh
     +'<button type="button" class="sp-btn g" data-plx="radd" style="width:100%;margin-bottom:8px">＋ 근무조 추가</button>'
     +'<div class="note" style="margin:0 0 10px">직원 수정 화면에서 근무조를 고르면 이 표의 코드가 적용돼요. 근무조를 안 고른 직원은 아래 기본값을 써요.</div>'
     +'<div style="font-size:12px;font-weight:800;margin:2px 0 6px">선택 목록에 미리 넣을 코드 <small style="font-weight:500;color:var(--mut)">쉼표로 구분 · 지우면 삭제</small></div>'
     +'<label style="font-size:11px;color:var(--mut)">근무조코드 목록<input class="sp-in" id="plR_ctkg" value="'+esc((R.codes_tkg||[]).join(','))+'" placeholder="예: B0013,B0014"></label>'
     +'<label style="font-size:11px;color:var(--mut)">시간코드 목록<input class="sp-in" id="plR_ctm" value="'+esc((R.codes_tm||[]).join(','))+'" placeholder="예: S02,S04"></label>'
     +'<div class="note" style="margin:0 0 10px">직원에게 이미 넣은 코드와 위 표의 코드는 자동으로 선택 목록에 나와요.</div>'
     +'<div style="font-size:12px;font-weight:800;margin:2px 0 6px">공통 코드</div>'
     +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:0 8px">'+fld('company','회사코드')+fld('site','사업장코드')+fld('day_weekday','일구분: 평일')+fld('day_sat','일구분: 토요일')+fld('day_sun','일구분: 일요일(주휴)')+fld('day_holiday','일구분: 공휴일')
     +fld('tkg_code','기본 근무조코드')+fld('tm_base','기본 시간코드(근무)')+fld('tm_off','시간코드: 휴무')+fld('tm_leave','시간코드: 휴직')+'</div>'
     +'<label style="display:flex;gap:6px;align-items:center;font-size:13px;margin:4px 0 8px"><input type="checkbox" id="plR_holiday_off"'+(R.holiday_off?' checked':'')+'> 근무조를 안 고른 직원은 공휴일 휴무 처리</label>'
     +'<label style="font-size:11px;color:var(--mut)">추가 공휴일 (날짜를 쉼표로, 예: 2026-12-24,2026-12-31)<input class="sp-in" id="plR_extra" value="'+esc((R.extra_holidays||[]).join(','))+'"></label>'
     +'<button type="button" class="sp-btn" data-plx="rsave" style="width:100%">규칙 저장</button><button type="button" class="sp-btn g" data-plx="rdef" style="width:100%;margin-top:6px">기본값으로 되돌리기(저장 전 확인)</button><button type="button" class="sp-btn g" data-plx="close" style="width:100%;margin-top:6px">닫기</button></div></div>';
  }
  var E=S.emp||{},isNew=!S.emp,q=PL.q,D=S.d||{},R0=plRule(),
      off=isNew?'':plOffOf(E.emp_no,q),
      acc=(H.accounts?H.accounts():[]).filter(function(p){return p.division_id==='ALL';});
  var gv=function(k,v){return D[k]!==undefined?D[k]:(v==null?'':v);};
  var f=function(id,l,v,ro){return'<label style="font-size:11px;color:var(--mut)">'+l+'<input class="sp-in" id="plE_'+id+'" value="'+esc(gv(id,v))+'"'+(ro?' readonly style="margin-bottom:6px;background:#F4F6F9"':' style="margin-bottom:6px"')+'></label>';};
  var opt=function(sel){return'<option value="">(없음)</option>'+PL_WK.map(function(w){return'<option'+(w===sel?' selected':'')+'>'+w+'</option>';}).join('');};
  var cat=plCodes(), shiftSel=gv('shift',E.shift_type);
  var csel=function(id,l,cur,list,lab,emptyTxt){
    var has=!cur||list.indexOf(cur)>=0;
    return'<label style="font-size:11px;color:var(--mut)">'+l+'<select class="sp-in" id="plE_'+id+'" data-plf="code" style="margin-bottom:6px"><option value="">'+emptyTxt+'</option>'
      +list.map(function(c){return'<option value="'+esc(c)+'"'+(c===cur?' selected':'')+'>'+esc(c)+(lab[c]?' ('+esc(lab[c])+')':'')+'</option>';}).join('')
      +(has?'':'<option value="'+esc(cur)+'" selected>'+esc(cur)+'</option>')+'<option value="__new">＋ 직접 입력…</option></select>'
      +'<input class="sp-in" id="plE_'+id+'_new" placeholder="새 코드 입력" style="display:none;margin-bottom:6px"></label>';
  };
  if(!S.days)S.days=(D.days!==undefined)?D.days.slice():(off?[off[0],off[1]]:[]);
  return'<div class="at-sheet" data-plx="close"><div class="at-sh" style="max-height:90vh;overflow:auto"><h3>'+(isNew?'직원 추가':esc(E.name)+' 수정')+' <small>'+esc(plQLabel(q))+' 기준</small></h3>'
   +(isNew&&acc.length&&PL.div==='ALL'?'<select class="sp-in" id="plE_pick" data-plf="pick"><option value="">가입 계정에서 이름 고르기(선택)</option>'+acc.map(function(p){return'<option>'+esc(p.name)+'</option>';}).join('')+'</select>':'')
   +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:0 8px">'+f('no','사번',E.emp_no,!isNew)+f('name','성명',E.name)+f('pos','직책',E.position)+f('grp','조(A/B조)',E.group_name)+'</div>'
   +(PL.div==='ALL'?'':'<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0 6px">'+f('team','근무팀(예: 1팀)',E.team)+f('hq','총괄(해당 시)',E.hq_team)+f('area','근무구역(오전/오후/야간)',E.work_area)+'</div>')
   +'<div style="display:flex;gap:6px;align-items:flex-end"><label style="flex:1;font-size:11px;color:var(--mut)">근무조(ERP 코드 기준)<select class="sp-in" id="plE_shift" style="margin-bottom:6px"><option value="">(기본값)</option>'+(R0.shifts||[]).map(function(x){return'<option'+(shiftSel===x.name?' selected':'')+'>'+esc(x.name)+'</option>';}).join('')+'</select></label>'
   +'<button type="button" class="sp-btn g" data-plx="shiftedit" style="padding:10px 12px;margin-bottom:6px;white-space:nowrap">✎ 근무조 편집</button></div>'
   +'<div style="font-size:11px;color:var(--mut);margin:2px 0 4px">고정휴무요일 <b>(2일 선택)</b></div><div style="display:grid;grid-template-columns:repeat(7,1fr);gap:5px;margin-bottom:8px">'+PL_WK.map(function(w){var on=S.days.indexOf(w)>=0;return'<button type="button" data-plx="day|'+w+'" style="border:1.5px solid '+(on?'#2B2F36':'#E1E5EC')+';background:'+(on?'#2B2F36':'#fff')+';color:'+(on?'#fff':'#2B2F36')+';border-radius:12px;padding:12px 0;font:inherit;font-size:14px;font-weight:800">'+w+'</button>';}).join('')+'</div>'
   +'<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0 6px">'+f('lt','휴직 구분',E.leave_type)+'<label style="font-size:11px;color:var(--mut)">시작<input class="sp-in" type="date" id="plE_ls" value="'+esc(gv('ls',String(E.leave_start||'').slice(0,10)))+'" style="margin-bottom:6px"></label><label style="font-size:11px;color:var(--mut)">종료<input class="sp-in" type="date" id="plE_le" value="'+esc(gv('le',String(E.leave_end||'').slice(0,10)))+'" style="margin-bottom:6px"></label></div>'
   +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:0 8px">'+csel('tkg','ERP 근무조코드',gv('tkg',E.tkg_code),cat.tkg,cat.tkgLab,'(근무조 표/기본값 사용)')+csel('tm','ERP 시간코드',gv('tm',E.tm_code_base),cat.tm,cat.tmLab,'(근무조 표/기본값 사용)')+'</div>'
   +'<button type="button" class="sp-btn" data-plx="esave" style="width:100%">저장</button>'
   +(isNew?'':'<button type="button" class="sp-btn r" data-plx="edel|'+esc(E.emp_no)+'" style="width:100%;margin-top:6px">직원 삭제</button>')
   +'<button type="button" class="sp-btn g" data-plx="close" style="width:100%;margin-top:6px">닫기</button></div></div>';
}
/* 코드 목록: 근무조 표 · 공통 코드 · 직원에게 이미 넣은 코드 · 직접 관리 목록을 합쳐서 선택지로 */
function plCodes(){
  var R=plRule(),tk={},tm={},tkL={},tmL={},add=function(m,c,lab,L){c=String(c||'').trim();if(!c)return;m[c]=1;if(lab&&!L[c])L[c]=lab;};
  add(tk,R.tkg_code,'기본',tkL);add(tm,R.tm_base,'기본 근무',tmL);add(tm,R.tm_off,'휴무',tmL);add(tm,R.tm_leave,'휴직',tmL);
  (R.shifts||[]).forEach(function(x){add(tk,x.tkg,x.name,tkL);add(tm,x.tm,x.name,tmL);});
  (R.codes_tkg||[]).forEach(function(c){add(tk,c,'',tkL);});(R.codes_tm||[]).forEach(function(c){add(tm,c,'',tmL);});
  PL.emps.forEach(function(e){add(tk,e.tkg_code,'',tkL);add(tm,e.tm_code_base,'',tmL);});
  return{tkg:Object.keys(tk).sort(),tm:Object.keys(tm).sort(),tkgLab:tkL,tmLab:tmL};
}
function plEmpRead(){
  var g=function(k){return plVal('plE_'+k);},c=function(k){var v=g(k);return v==='__new'?g(k+'_new').trim():v;};
  return{no:g('no'),name:g('name'),pos:g('pos'),grp:g('grp'),team:g('team'),hq:g('hq'),area:g('area'),shift:g('shift'),days:((PL.sheet&&PL.sheet.days)||[]).slice(),lt:g('lt'),ls:g('ls'),le:g('le'),tkg:c('tkg'),tm:c('tm')};
}

/* 통계: 선택한 분기의 고정휴무요일을 요일·팀·근무조로 집계 */
function plStatsView(){
  var q=PL.q,qs=plQList(),E=PL.emps,tot=E.length,cnt={},none=0,combo={},teams={},shifts={};
  PL_WK.forEach(function(w){cnt[w]=0;});
  function bucket(m,k,o){var b=m[k]=m[k]||{n:0,none:0,d:{}};b.n++;if(!o.length)b.none++;o.forEach(function(w){b.d[w]=(b.d[w]||0)+1;});}
  E.forEach(function(e){
    var o=plParseOff(plOffOf(e.emp_no,q).split('').join('·')),k=o.join('·');
    if(!o.length)none++;else{o.forEach(function(w){if(cnt[w]!==undefined)cnt[w]++;});combo[k]=(combo[k]||0)+1;}
    bucket(teams,e.team||'(팀 없음)',o);bucket(shifts,e.shift_type||e.work_area||'(미지정)',o);
  });
  var mx=Math.max.apply(null,PL_WK.map(function(w){return cnt[w];}).concat([1]));
  var h='<div class="card"><h3>📊 휴무 통계 <small>'+esc(plDivName(PL.div))+' · '+tot+'명</small></h3>'
   +'<select class="sp-in" data-plf="q">'+qs.map(function(x){return'<option value="'+x+'"'+(x===q?' selected':'')+'>'+plQLabel(x)+' 기준</option>';}).join('')+'</select>'
   +'<div style="font-size:12px;color:var(--mut);margin-bottom:8px">휴무요일 미등록 <b style="color:'+(none?'#C0485F':'inherit')+'">'+none+'명</b>'+(PL.qs[q]?' · 적용 시작일 '+esc(PL.qs[q]):'')+'</div>';
  if(!tot)return h+'<div class="empty">등록된 직원이 없어요.</div></div>';
  h+='<div style="font-size:12px;font-weight:800;margin:6px 0">요일별 휴무 인원</div>'
   +PL_WK.map(function(w){var v=cnt[w],pc=Math.round(v/mx*100);
     return'<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px"><b style="width:18px;font-size:13px;color:'+(w==='토'?'#3b6fd4':w==='일'?'#C0485F':'inherit')+'">'+w+'</b>'
      +'<div style="flex:1;background:#EDEFF2;border-radius:99px;height:16px;overflow:hidden"><div style="width:'+pc+'%;height:100%;background:#2B2F36;border-radius:99px"></div></div>'
      +'<span style="width:44px;text-align:right;font-size:13px;font-weight:800">'+v+'명</span></div>';}).join('')
   +'<div style="font-size:11px;color:var(--mut);margin:2px 0 10px">한 사람이 2일 쉬므로 합계는 인원의 2배예요. 특정 요일에 몰리면 그날 근무 인원이 부족할 수 있어요.</div>'
   +'<div style="font-size:12px;font-weight:800;margin:6px 0">휴무요일 조합</div><div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px">'
   +Object.keys(combo).sort(function(a,b){return combo[b]-combo[a];}).map(function(k){return'<span style="background:#F0F1F4;border-radius:99px;padding:4px 10px;font-size:12px;font-weight:700">'+esc(k)+' <b>'+combo[k]+'</b></span>';}).join('')+'</div></div>';
  var tbl=function(title,m,ord){
    var keys=Object.keys(m).sort(ord||function(a,b){return(parseInt(a)||99)-(parseInt(b)||99)||(a<b?-1:1);});
    return'<div class="card"><h3>'+title+' <small>요일별 휴무 인원</small></h3><div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px;text-align:center">'
     +'<tr style="color:var(--mut)"><th style="text-align:left;padding:4px">구분</th><th>인원</th>'+PL_WK.map(function(w){return'<th>'+w+'</th>';}).join('')+'<th>미등록</th></tr>'
     +keys.map(function(k){var b=m[k];return'<tr style="border-top:1px solid var(--line)"><td style="text-align:left;padding:6px 4px;font-weight:700">'+esc(k)+'</td><td>'+b.n+'</td>'
       +PL_WK.map(function(w){var v=b.d[w]||0;return'<td style="font-weight:'+(v?800:400)+';color:'+(v?'inherit':'#C5C9D1')+'">'+v+'</td>';}).join('')
       +'<td style="color:'+(b.none?'#C0485F':'#C5C9D1')+'">'+b.none+'</td></tr>';}).join('')+'</table></div></div>';
  };
  return h+tbl(PL.div==='ALL'?'조직별':'팀별',teams)+tbl('근무조별',shifts,function(a,b){return a<b?-1:1;});
}
function plView(){
  var ed=H.canEdit(),q=PL.q,qs=plQList();
  var h=(H.back?'<div style="margin-bottom:8px"><button type="button" class="sp-btn g" data-atback="1">← 근태 현황</button></div>':'')
   +((H.divs&&H.divs.length<2)?'':'<div class="dp" style="margin-bottom:8px"><div class="md" style="width:100%">'+(H.divs||[['ALL','그룹'],['T1','T1'],['T2','T2'],['BD','부대']]).map(function(x){return'<button type="button" data-plx="div|'+x[0]+'" class="'+(PL.div===x[0]?'on':'')+'" style="flex:1">'+x[1]+'</button>';}).join('')+'</div></div>')
   +'<div class="dp" style="margin-bottom:8px"><div class="md" style="width:100%">'+[['list','🏠 목록'],['stats','📊 통계'],['log','🕘 수정이력']].map(function(x){return'<button type="button" data-plx="tab|'+x[0]+'" class="'+(PL.tab===x[0]?'on':'')+'" style="flex:1">'+x[1]+'</button>';}).join('')+'</div></div>';
  if(!PL.loaded)return h+'<div class="card empty">불러오는 중…</div>';
  if(PL.tab==='stats')return h+plStatsView()+plSheet();
  if(PL.tab==='log'){
    return h+'<div class="card"><h3>수정이력 <small>누가 언제 바꿨는지</small></h3><div style="display:grid;grid-template-columns:1fr 1fr auto;gap:6px"><input class="sp-in" type="date" data-plf="lf" value="'+esc(PL.lf)+'"><input class="sp-in" type="date" data-plf="lt" value="'+esc(PL.lt)+'"><button type="button" class="sp-btn" data-plx="logq" style="margin-bottom:8px">조회</button></div><div id="plLog">'+plLogBody()+'</div></div>'+plSheet();
  }
  var pos={},teams={};PL.emps.forEach(function(e){if(e.position)pos[e.position]=1;if(e.team)teams[e.team]=1;});
  var pairs={};PL.emps.forEach(function(e){var o=plOffOf(e.emp_no,q);if(o)pairs[o]=1;});
  var bt=function(a,l,cls){return'<button type="button" class="sp-btn '+(cls||'g')+'" data-plx="'+a+'" style="padding:8px 10px;font-size:12px">'+l+'</button>';};
  h+='<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><b style="font-size:15px">휴무계획</b><span style="font-size:12px;color:var(--mut)">전체 '+PL.emps.length+'명</span></div>'
   +'<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px">'
   +'<select class="sp-in" data-plf="q" style="width:auto;margin:0;padding:8px 10px;font-size:12px;font-weight:800">'+qs.map(function(x){return'<option value="'+x+'"'+(x===q?' selected':'')+'>'+plQLabel(x)+' 기준</option>';}).join('')+'</select>'
   +(ed?bt('up','⬆ 엑셀 업로드'):'')+bt('tpl','📄 양식 다운로드')+bt('res','📥 휴무계획 결과 다운로드')+(ed?bt('add','＋ 직원 추가','k')+bt('clr','🗑 전체삭제','r'):'')+'</div>'
   +'<input type="file" id="plFile" accept=".xlsx,.xls" style="display:none">'
   +'<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px;align-items:center"><input class="sp-in" type="month" data-plf="month" value="'+esc(PL.month)+'" style="width:auto;margin:0;padding:8px 10px;font-size:12px">'+bt('erp','📥 ERP 다운로드','k')+(ed?bt('rule','⚙ ERP 규칙'):'')+'</div>'
   +'<div style="background:#EFFAF8;border:1px solid #CFEDE8;border-radius:12px;padding:10px;margin-bottom:8px;font-size:12px"><b>'+plQLabel(q)+' 휴무 적용 시작일</b> '
   +(ed?'<input class="sp-in" type="date" id="plQS" value="'+esc(PL.qs[q]||'')+'" style="width:auto;display:inline-block;margin:0 4px;padding:6px 8px;font-size:12px">'+bt('qs','저장'):'<b>'+esc(PL.qs[q]||'미설정')+'</b>')
   +'<div style="color:var(--mut);margin-top:4px">'+(PL.qs[q]?'이 날짜 전에는 직전 분기 휴무를 적용':'미설정 — 분기 첫날부터 적용')+'</div></div>'
   +(PL.div==='ALL'?'':'<select class="sp-in" data-plf="team"><option value="">팀 전체</option>'+Object.keys(teams).sort(function(a,b){return(parseInt(a)||99)-(parseInt(b)||99)||(a<b?-1:1);}).map(function(k){return'<option'+(PL.f.team===k?' selected':'')+'>'+esc(k)+'</option>';}).join('')+'</select>')
   +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px"><select class="sp-in" data-plf="off"><option value="">휴무요일 전체</option>'+Object.keys(pairs).sort().map(function(k){return'<option value="'+k+'"'+(PL.f.off===k?' selected':'')+'>'+k+'</option>';}).join('')+'</select>'
   +'<select class="sp-in" data-plf="pos"><option value="">직책 전체</option>'+Object.keys(pos).sort().map(function(k){return'<option'+(PL.f.pos===k?' selected':'')+'>'+esc(k)+'</option>';}).join('')+'</select></div>'
   +'<input class="sp-in" data-plf="s" placeholder="🔍 사번/성명 검색" value="'+esc(PL.f.s)+'">'
   +'<div id="plList">'+plListBody()+'</div></div>'+plSheet();
  return h;
}
function plShiftKey(e){
  if(PL.div==='ALL')return e.shift_type||'';
  if(e.team==='행정')return '행정';
  if(/총괄/.test(e.team||''))return '총괄';
  return e.shift_type||'';
}
function plShiftRow(e){var k=plShiftKey(e);return(plRule().shifts||[]).filter(function(z){return z.name===k;})[0]||null;}
function plTeamNorm(t){return String(t||'').trim().replace(/^환경미화/,'').replace(/^환경/,'');}
function plDeriveShift(team,area,pos,hq){
  if(/오전/.test(area))return'오전';if(/오후/.test(area))return'오후';if(/야간/.test(area))return'야간';
  if(team==='행정'||/총괄/.test(pos||'')||/총괄/.test(hq||'')||/총괄/.test(team||''))return'일근';
  var m=String(team).match(/(\d+)/),M={'1':'오전','2':'오전','3':'오전','4':'오전','6':'오후','7':'오후','8':'오후','9':'오후','5':'야간','10':'야간'};
  return(m&&M[m[1]])||'';
}
function plNum(v){return/^\d+$/.test(String(v))?Number(v):v;}
function plXlsx(){if(!window.XLSX){alert('엑셀 기능을 불러오지 못했어요. 인터넷 연결을 확인해주세요.');return false;}return true;}
var PL_HEAD=['사번','성명','직책','근무팀','근무조','1분기','2분기','3분기','4분기','휴직','시작일자','종료일자','비고'];
function plRowsAoa(list,year){
  return list.map(function(e){var o=function(k){return plOffOf(e.emp_no,year+'-Q'+k);};
    return[e.emp_no,e.name||'',e.position||'',e.team||(PL.div==='ALL'?'그룹':''),e.group_name||'',o(1),o(2),o(3),o(4),e.leave_type||'',e.leave_start?String(e.leave_start).slice(0,10):'',e.leave_end?String(e.leave_end).slice(0,10):'',''];});
}
function plSave(aoa,name,sheet,cols){
  var wb=XLSX.utils.book_new(),ws=XLSX.utils.aoa_to_sheet(aoa);ws['!cols']=cols||[{wch:9},{wch:9},{wch:8},{wch:12},{wch:8},{wch:7},{wch:7},{wch:7},{wch:7},{wch:8},{wch:12},{wch:12},{wch:22}];
  XLSX.utils.book_append_sheet(wb,ws,sheet);XLSX.writeFile(wb,name);
}
function plTemplate(){
  if(!plXlsx())return;var y=PL.q.slice(0,4),aoa;
  if(PL.emps.length){aoa=[[y+'년 '+plDivName(PL.div)+' 휴무계획 수정양식 — 변경할 분기 칸만 채워서 업로드하세요 (비워두면 그 분기는 그대로 유지됩니다)'],PL_HEAD].concat(plRowsAoa(PL.emps,y));}
  else aoa=[[y+'년 정기 휴무변경 (분기별 칸에 적용할 요일 2글자 기입, 예: 월화)'],PL_HEAD,
    [PL.div==='ALL'?'G0001':'140000','홍길동',PL.div==='ALL'?'그룹장':'팀장',PL.div==='ALL'?'그룹':'1팀','','토일','토일','토일','토일','','','','예시행 - 지우고 사용하세요'],
    [PL.div==='ALL'?'G0002':'140001','홍이동',PL.div==='ALL'?'담당':'조장',PL.div==='ALL'?'그룹':'1팀',PL.div==='ALL'?'':'A조','','','금토','금토','','','','3,4분기만 변경하는 예시'],
    [PL.div==='ALL'?'G0003':'140002','홍삼동',PL.div==='ALL'?'담당':'사원',PL.div==='ALL'?'그룹':'1팀',PL.div==='ALL'?'':'A조','일월','월화','화수','수목','휴직','2026-03-01','2027-02-28','분기마다 다른 요일 예시']];
  plSave(aoa,plDivName(PL.div)+'_휴무계획_업로드양식.xlsx','휴무계획업로드양식');
}
function plResult(){
  if(!PL.emps.length){alert('등록된 직원이 없어요.');return;}if(!plXlsx())return;var y=PL.q.slice(0,4);
  plSave([[y+'년 그룹 관리자 휴무계획 현황 (확인용 — 수정 후 다시 업로드하면 채운 분기만 반영됩니다)'],PL_HEAD].concat(plRowsAoa(PL.emps,y)),y+'년_'+plDivName(PL.div)+'_휴무계획.xlsx','휴무계획현황');
}
function plUpload(inp){
  var file=inp.files[0];if(!file)return;if(!plXlsx()){inp.value='';return;}
  var rd=new FileReader();
  rd.onload=function(ev){
    try{
      var wb=XLSX.read(ev.target.result,{type:'binary',cellDates:true}),ws=wb.Sheets[wb.SheetNames[0]];
      var aoa=XLSX.utils.sheet_to_json(ws,{header:1,defval:''});
      var hi=aoa.findIndex(function(r){return r.some(function(c){return String(c).trim()==='사번';});});
      if(hi<0){alert('"사번" 컬럼을 찾을 수 없어요. 양식을 확인해주세요.');inp.value='';return;}
      var hd=aoa[hi].map(function(h){return String(h).trim();});
      var title=aoa.slice(0,hi).map(function(r){return r.join(' ');}).join(' '),ym=title.match(/(20\d\d)년/),y=ym?ym[1]:PL.q.slice(0,4);
      var qcols=[1,2,3,4].map(function(k){return{h:k+'분기',q:y+'-Q'+k};}).filter(function(c){return hd.indexOf(c.h)>=0;});
      var emps=[],offs=[],bad=[];
      aoa.slice(hi+1).forEach(function(arr){
        var o={};hd.forEach(function(h,i){if(h)o[h]=arr[i]!==undefined?arr[i]:'';});
        var no=String(o['사번']||'').trim();if(!no)return;
        var nm=String(o['성명']||o['한글이름']||o['한글\n이름']||'').trim();if(!nm){bad.push(no);return;}
        var pos=String(o['직책']||o['직책\n직위']||'').trim();if(pos==='-')pos='';
        var gm=String(o['근무조']||'').trim().match(/([A-Ca-c])조$/);
        var em={emp_no:no,name:nm,position:pos,team:String(o['근무팀']||'').trim()||'그룹',group_name:gm?gm[1].toUpperCase()+'조':'',note:String(o['비고']||'')};
        if(PL.div!=='ALL'){var tmn=plTeamNorm(o['근무팀']),hq=String(o['총괄']||'').trim(),area=String(o['근무구역']||'').trim();
          em.position=pos||'사원';em.team=tmn;em.hq_team=hq;em.work_area=area;em.shift_type=plDeriveShift(tmn,area,em.position,hq);}
        var lt=String(o['휴직']||'').trim(),sr=o['시작일자'],er=o['종료일자'];
        if(lt&&sr&&er){var sd=sr instanceof Date?sr:new Date(sr),ed=er instanceof Date?er:new Date(er);
          if(!isNaN(sd)&&!isNaN(ed)){em.leave_type=lt;em.leave_start=ymd(sd.getFullYear(),sd.getMonth()+1,sd.getDate());em.leave_end=ymd(ed.getFullYear(),ed.getMonth()+1,ed.getDate());}}
        emps.push(em);
        qcols.forEach(function(c){var dv=String(o[c.h]||'').trim();if(/^[월화수목금토일]{2}$/.test(dv))offs.push({emp_no:no,quarter:c.q,off_day1:dv[0],off_day2:dv[1]});});
      });
      if(!emps.length){alert('유효한 직원 데이터가 없어요. 양식을 확인해주세요.');inp.value='';return;}
      if(!confirm(emps.length+'명, 휴무요일 '+offs.length+'건을 반영할까요?'+(bad.length?'\n(성명이 없어 제외: '+bad.join(', ')+')':'')))
        {inp.value='';return;}
      plRpc('save',{p_emps:emps,p_offs:offs,p_source:'엑셀업로드'}).then(function(){alert('✓ '+emps.length+'명 반영 완료');inp.value='';return plLoad();})
        .catch(function(e){inp.value='';alert('저장하지 못했어요: '+((e&&e.message)||''));});
    }catch(err){inp.value='';alert('엑셀 처리 오류: '+((err&&err.message)||err));}
  };
  rd.readAsBinaryString(file);
}
/* ERP: 선택한 달의 1일~말일을 직원별로 펼침 (규칙은 ⚙ 에서 수정) */
function plErp(){
  if(!PL.emps.length){alert('등록된 직원이 없어요.');return;}if(!plXlsx())return;
  var m=PL.month;if(!/^\d{4}-\d{2}$/.test(m)){alert('대상 월을 선택해주세요.');return;}
  var R=plRule(),y=+m.slice(0,4),mo=+m.slice(5),last=daysIn(y,mo),hs={};
  PL.hol.concat(R.extra_holidays||[]).forEach(function(d){hs[String(d).slice(0,10)]=1;});
  var row=function(e,d){
    var sh=plShiftRow(e),ds=ymd(y,mo,d),wd=new Date(y,mo-1,d).getDay(),dg=hs[ds]?R.day_holiday:wd===6?R.day_sat:wd===0?R.day_sun:R.day_weekday,tm;
    if(e.leave_type&&e.leave_start&&ds>=String(e.leave_start).slice(0,10)&&ds<=String(e.leave_end).slice(0,10))tm=R.tm_leave;
    else{var isOff=plOffOn(e.emp_no,ds).indexOf(PL_WD[wd])>=0;if(!isOff&&(sh&&sh.hol!==undefined?sh.hol:R.holiday_off)&&hs[ds])isOff=true;tm=isOff?R.tm_off:(e.tm_code_base||(sh&&sh.tm)||R.tm_base);}
    return[R.company,R.site,e.emp_no,plNum(dg),ds.replace(/-/g,''),e.tkg_code||(sh&&sh.tkg)||R.tkg_code,tm];
  };
  var head=['회사코드','사업장코드','사원번호','일구분코드','시작일','근무조코드','시간코드'],cols=[{wch:10},{wch:10},{wch:10},{wch:10},{wch:12},{wch:12},{wch:10}];
  var q=[],all=[head];
  PL.emps.forEach(function(e){for(var d=1;d<=last;d++)all.push(row(e,d));});
  q.push({n:plDivName(PL.div)+'_근무계획_더존ERP_'+m+'_전체.xlsx',a:all,s:'근무계획업로드(전체)'});
  ['월화','화수','수목','목금','금토','토일','일월'].forEach(function(p){
    var mem=PL.emps.filter(function(e){var o=plOffOn(e.emp_no,m+'-01').join('');return o===p||o===p[1]+p[0];});
    if(!mem.length)return;var a=[head];mem.forEach(function(e){for(var d=1;d<=last;d++)a.push(row(e,d));});
    q.push({n:plDivName(PL.div)+'_근무계획_더존ERP_'+m+'_'+p+'조.xlsx',a:a,s:p+'조('+mem.length+'명)'});
  });
  var i=0;(function nx(){if(i>=q.length){return;}var it=q[i++];plSave(it.a,it.n,it.s,cols);setTimeout(nx,400);})();
  alert('📥 파일 '+q.length+'개를 내려받습니다 (전체 '+(all.length-1)+'행).');
}
function plVal(id){var el=$(id);return el?el.value:'';}
function plRuleRead(){
  var R={};['company','site','day_weekday','day_sat','day_sun','day_holiday','tkg_code','tm_base','tm_off','tm_leave'].forEach(function(k){R[k]=plVal('plR_'+k).trim();});
  R.holiday_off=!!($('plR_holiday_off')||{}).checked;R.extra_holidays=plVal('plR_extra').split(/[,\s]+/).filter(function(d){return/^\d{4}-\d{2}-\d{2}$/.test(d);});
  R.codes_tkg=plVal('plR_ctkg').split(/[,\s]+/).filter(Boolean);R.codes_tm=plVal('plR_ctm').split(/[,\s]+/).filter(Boolean);
  R.shifts=[];for(var i=0;$('plRS_n'+i);i++){R.shifts.push({name:plVal('plRS_n'+i).trim(),tkg:plVal('plRS_t'+i).trim(),tm:plVal('plRS_m'+i).trim(),hol:!!($('plRS_h'+i)||{}).checked});}
  return R;
}
function plAct(x){
  var p=String(x).split('|'),a=p[0],arg=p.slice(1).join('|'),fail=function(m){return function(e){alert(m+((e&&e.message)||''));};};
  if(a==='close'){var bk=PL.sheet&&PL.sheet.back;PL.sheet=bk?{type:'emp',emp:bk.emp,d:bk.d,days:bk.d.days}:null;render();return;}
  if(a==='day'){var d0=plEmpRead();PL.sheet.d=d0;var ds=PL.sheet.days||[],ix=ds.indexOf(arg);if(ix>=0)ds.splice(ix,1);else{ds.push(arg);if(ds.length>2)ds.shift();}PL.sheet.days=ds;render();return;}
  if(a==='shiftedit'){var dr=plEmpRead();PL.sheet={type:'rule',R:JSON.parse(JSON.stringify(plRule())),back:{emp:PL.sheet.emp,d:dr}};render();return;}
  if(a==='div'){if(PL.div===arg)return;PL.div=arg;PL.loaded=false;PL.sheet=null;PL.rule=null;PL.f={off:'',pos:'',s:'',team:''};PL.log=[];PL.emps=[];render();return plLoad();}
  if(a==='tab'){PL.tab=arg;render();if(arg==='log')plAct('logq');return;}
  if(a==='up'){var f=$('plFile');if(f)f.click();return;}
  if(a==='tpl')return plTemplate();
  if(a==='res')return plResult();
  if(a==='erp')return plErp();
  if(a==='add'){PL.sheet={type:'emp',emp:null};render();return;}
  if(a==='edit'){var e=PL.emps.filter(function(z){return z.emp_no===arg;})[0];if(e){PL.sheet={type:'emp',emp:e};render();}return;}
  if(a==='rule'){PL.sheet={type:'rule',R:JSON.parse(JSON.stringify(plRule()))};render();return;}
  if(a==='radd'){var R1=plRuleRead();R1.shifts.push({name:'',tkg:'',tm:'',hol:false});PL.sheet.R=R1;render();return;}
  if(a==='rdelrow'){var R2=plRuleRead();R2.shifts.splice(+arg,1);PL.sheet.R=R2;render();return;}
  if(a==='rdef'){if(!confirm('모든 ERP 규칙을 기본값으로 되돌립니다 (저장 버튼을 눌러야 확정돼요).'))return;PL.sheet.R=JSON.parse(JSON.stringify(plDef()));render();return;}
  if(a==='rsave'){
    var R=plRuleRead();
    var nm={};for(var i=0;i<R.shifts.length;i++){var sx=R.shifts[i];if(!sx.name){alert('근무조 이름을 입력해주세요.');return;}if(nm[sx.name]){alert('근무조 이름이 중복돼요: '+sx.name);return;}nm[sx.name]=1;}
    if(!confirm('ERP 생성규칙을 저장할까요?\n저장하면 이 사업부의 이후 ERP 다운로드부터 새 규칙이 적용돼요.'))return;
    var bk2=PL.sheet&&PL.sheet.back;return plRpc('rule_save',{p_rule:R}).then(function(){PL.sheet=bk2?{type:'emp',emp:bk2.emp,d:bk2.d,days:bk2.d.days}:null;return plLoad();}).catch(fail('저장하지 못했어요: '));
  }
  if(a==='esave'){
    var EC=plEmpRead(),no=plVal('plE_no').trim(),nm=plVal('plE_name').trim();if(!no||!nm){alert('사번과 성명은 필수예요.');return;}
    var dys=((PL.sheet&&PL.sheet.days)||[]).slice().sort(function(a,b){return PL_WK.indexOf(a)-PL_WK.indexOf(b);}),d1=dys[0]||'',d2=dys[1]||'';if(dys.length===1){alert('휴무요일은 2일을 골라주세요.');return;}
    var lt=plVal('plE_lt').trim(),ls=plVal('plE_ls'),le=plVal('plE_le');if(lt&&(!ls||!le)){alert('휴직은 시작일과 종료일이 필요해요.');return;}
    var old=PL.sheet&&PL.sheet.emp,tm0=PL.div==='ALL'?'그룹':plTeamNorm(EC.team),pos0=plVal('plE_pos').trim()||(PL.div==='ALL'?'':'사원'),em={emp_no:no,name:nm,position:pos0,team:tm0,hq_team:PL.div==='ALL'?'':EC.hq.trim(),work_area:PL.div==='ALL'?'':EC.area.trim(),group_name:plVal('plE_grp').trim(),shift_type:plVal('plE_shift')||(PL.div==='ALL'?'':plDeriveShift(tm0,EC.area,pos0,EC.hq)),tkg_code:EC.tkg,tm_code_base:EC.tm,clear_codes:true,
      leave_type:lt,leave_start:ls,leave_end:le,clear_leave:!lt};
    var cur=old?plOffOf(no,PL.q):'',offs=[],ck=function(x){return x.split('').sort().join('');};if(ck(d1+d2)!==ck(cur))offs.push({emp_no:no,quarter:PL.q,off_day1:d1,off_day2:d2});
    if(old){if(!confirm(nm+'('+no+') 정보를 수정할까요?'+(offs.length?'\n'+plQLabel(PL.q)+' 휴무요일: '+(cur?cur.split('').join('·'):'(없음)')+' → '+(d1&&d2?d1+'·'+d2:'(없음)'):'')+'\n수정 내용은 수정이력에 기록돼요.'))return;}
    else if(!confirm(nm+'('+no+') 직원을 추가할까요?'+(d1&&d2?'\n'+plQLabel(PL.q)+' 휴무요일: '+d1+'·'+d2:'')))return;
    return plRpc('save',{p_emps:[em],p_offs:offs,p_source:'앱수정'}).then(function(){PL.sheet=null;return plLoad();}).catch(fail('저장하지 못했어요: '));
  }
  if(a==='edel'){var de=PL.emps.filter(function(z){return z.emp_no===arg;})[0];if(!confirm('"'+(de?de.name+' ('+arg+')':arg)+'" 직원을 삭제할까요?\n분기별 휴무 기록도 함께 삭제되고, 되돌릴 수 없어요.'))return;return plRpc('emp_delete',{p_emp_no:arg}).then(function(){PL.sheet=null;return plLoad();}).catch(fail('삭제하지 못했어요: '));}
  if(a==='clr'){if(!PL.emps.length){alert('삭제할 데이터가 없어요.');return;}if(prompt('전체 '+PL.emps.length+'명의 휴무계획 데이터를 삭제합니다.\n되돌릴 수 없어요. 계속하려면 "삭제"를 입력하세요.')!=='삭제')return;
    return plRpc('delete_all',{}).then(plLoad).catch(fail('삭제하지 못했어요: '));}
  if(a==='qs'){var v=plVal('plQS');if(!confirm(plQLabel(PL.q)+' 적용 시작일을 '+(v?v+'(으)로 저장':'지우고 미설정으로')+'할까요?'))return;return plRpc('qstart_set',{p_quarter:PL.q,p_date:v||null}).then(plLoad).catch(fail('저장하지 못했어요: '));}
  if(a==='logq'){return plRpc('log_list',{p_from:PL.lf||null,p_to:PL.lt||null,p_limit:500}).then(function(r){PL.log=Array.isArray(r)?r:[];var el=$('plLog');if(el)el.innerHTML=plLogBody();}).catch(fail('불러오지 못했어요: '));}
}


function view(){return'<div class="plx" data-plv="'+VERSION+'">'+plView()+'</div>';}
document.addEventListener('click',function(e){
  var at=e.target.closest&&e.target.closest('.plx [data-plx]');if(!at)return;
  if(at.classList.contains('at-sheet')&&e.target!==at)return;
  plAct(at.dataset.plx);
});
document.addEventListener('change',function(e){var t=e.target;if(!t)return;
  if(t.id==='plFile'){plUpload(t);return;}
  var k=t.dataset&&t.dataset.plf;if(!k||k==='s')return;
  if(k==='code'){var ni=$(t.id+'_new');if(ni)ni.style.display=t.value==='__new'?'block':'none';return;}
  if(k==='pick'){var n=$('plE_name');if(n&&t.value)n.value=t.value;return;}
  if(k==='q'){PL.q=t.value;render();return;}
  if(k==='month'){PL.month=t.value;return;}
  if(k==='lf'||k==='lt'){PL[k]=t.value;return;}
  PL.f[k]=t.value;var l=$('plList');if(l)l.innerHTML=plListBody();});
document.addEventListener('input',function(e){var t=e.target;if(t&&t.dataset&&t.dataset.plf==='s'){PL.f.s=t.value;var l=$('plList');if(l)l.innerHTML=plListBody();}});
function setDiv(d){if(PL.div===d&&PL.loaded)return plLoad();PL.div=d;PL.loaded=false;PL.sheet=null;PL.rule=null;PL.tab='list';PL.f={off:'',pos:'',s:'',team:''};PL.log=[];PL.emps=[];render();return plLoad();}
return{setDiv:setDiv,view:view,load:plLoad,state:PL,version:VERSION,reset:function(){PL.sheet=null;PL.tab='list';},act:plAct,erp:plErp};
}
window.IAOSPlan={init:init,version:VERSION};
})();
