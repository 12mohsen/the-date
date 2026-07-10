const fs=require('fs');
let src=fs.readFileSync('i18n.js','utf8');
global.localStorage={ _d:{}, getItem(k){return this._d[k]??null;}, setItem(k,v){this._d[k]=v;} };
global.document={ documentElement:{}, title:'', querySelectorAll(){return [];}, getElementById(){return null;} };
const test=`
;(function(){
  const keysAr=Object.keys(TRANSLATIONS.ar).sort();
  for(const lang of ['en','id']){
    const ks=new Set(Object.keys(TRANSLATIONS[lang]));
    const missing=keysAr.filter(k=>!ks.has(k));
    console.log(lang,'missing keys vs ar:', missing.length? missing.join(', ') : 'NONE');
  }
  loadLanguage();
  let seq=[getLanguage()];
  for(let i=0;i<4;i++){ toggleLanguage(); seq.push(getLanguage()); }
  console.log('cycle:', seq.join(' -> '));
  setLanguage('id');
  console.log('id appTitle:', t('appTitle'));
  console.log('id yearsLabel(3):', t('yearsLabel',3));
  console.log('id savedCount(5):', t('savedCount',5));
  console.log('id joinRemaining:', t('joinRemaining',10,'12/7/2026','10/7/2026'));
  console.log('id equiv/of/era:', JSON.stringify([t('equivWord'),t('ofWord'),t('gEraSuffix')]));
  console.log('id trashPermDelete:', t('trashPermDelete',3,5));
  console.log('id dir:', getLanguage()==='ar'?'rtl':'ltr');
})();
`;
eval(src+test);
