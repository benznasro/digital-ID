'use strict';

const DB = {
  citizens: [
    { 
      
                         cni:'123456789', 
                         name_ar:'عبدالهادي ', name_fr:'ABDELHADI MERZOUG', 
                         dob:'2004-11-21', gender:'ذكر', 
                         address:  'في الةئام اااغواط',    
                         status:'active' 
                },
    {
       cni:'0698089281',
        name_ar:'عبدالكريم',
             name_fr:'ABDELHARIM GRIBEB',    
                    dob:'2005-07-02', gender:'ذكر',
   address:'   حي الوئام الاغواط', 
               status:'active' 
              },
    {
       cni:'111222333', 
             name_ar:'يوسف بوزيدي',
             name_fr:'BEN ZAHIA',  
              dob:'2006-05-01', 
              gender:'ذكر',
               address:'الجلفة حي الجديد', 
                 status:'active'
                 },
  ],
  passports: [],
  eligibility: {}, 
  nextRef: 1001,
};


const API = {
  async verifyCitizen(cni, dob) {
    await wait(1400);
       const c = DB.citizens.find(x => x.cni === cni);
                      if (!c) 
                        return {
                       ok: false, reason: 'لم يُعثر على بطاقة بهذا الرقم في قاعدة البيانات'
                       };
                               if (c.dob !== dob)
                           return {
                           ok: false, reason: 'تاريخ الميلاد لا يطابق السجل'
                           };
    return {  
      ok: true,
       citizen: c 
    };
  },

  async checkEligibility(cni) {


  if (DB.eligibility[cni]) 
        return
   DB.eligibility[cni];
  await wait(1800);
  
                          const result = { 
                            law: true,
                             mil: true,
                              tax: true
                             };
  
                          DB.eligibility[cni] = result;
  
                          return result;
  },

  async verifyFace(photoUrl, cni) {
    await wait(1700);
    return {
         ok: true, score: (93 + Math.random() * 6).toFixed(1) 
        
        };
  },

  createRequest(data) {
    const ref = 'DZ-' + String(DB.nextRef++).padStart(6, '0');
    const req = { ref, ...data, date: new Date().toISOString(), status: 'pending' };
    DB.passports.push(req);
    return req;
  },
};

function wait(ms) 
{ 
    return new Promise(r => 
      setTimeout(r, ms));
    }


const S = {
  step: 1,
  citizen: null,
  cni: '',
   dob: '',
    wilaya: '', 
    gender: '',
    ptype: 'ord',
  
    validity: '',
    reason: '',
     pickup: '',
      email: '',
       lostRef: '',
  photoUrl: '',
   photoVerified: false,
  eligOk: false,
};


function loading(t) {
  document.getElementById('ov-txt').textContent = t || 'جاري المعالجة...';
  document.getElementById('ov').classList.add('on');
}
function doneLoading() 
{ 
  
  
  document.getElementById('ov').classList.remove('on');


}

function valid(id, cond, msg) {
  const el = document.getElementById(id);
  if (!cond) {
     el.classList.add('err'); 
     if (msg)
       el.querySelector('.err-msg').textContent = msg; 
      return false;
     }

  el.classList.remove('err');

   el.classList.add('good'); 
   return true
   ;
}
function clearV(id)
 { 
  const el = document.getElementById(id);
   el.classList.remove('erorrrr','good');
   }

function go(n) 
{
  document.getElementById('p' + S.step).classList.remove('on');
  S.step = n;
 
  document.getElementById('p' + n).classList.add('on');
  
  updateSteps();

     window.scrollTo({ 

      top: 0,
      
      
      behavior: 'smooth' });
}

function updateSteps() {

  for (let i = 1; i <=5; i++) {

    const num = document.getElementById('sn' + i);

    const lbl = document.getElementById('sl' + i);

    num.className = 'step-num' + (i === S.step ? ' active' : i < S.step ? ' done' : '');
    lbl.className = 'step-lbl' + (i === S.step ? ' active' : '');
    
    if (i < S.step)

        num.textContent = '✓=->yess';
    else num.textContent =
     ['1','2','3','4','5'] 
                     [i-1]
     ;
    if (i < 5)
       document.getElementById('ln' + i).className = 'step-line' + (i < S.step ? ' done' : '');
  }
}


async function step1() {
     const cni  = document.getElementById('inp-cni').value.trim();
 
      const dob  = document.getElementById('inp-dob').value;
     const wil  = document.getElementById('inp-wil').value;
  const gen  = document.getElementById('inp-gen').value;

  let ok = true; 

  ok = valid('fg-cni', 
    cni.length >= 8, 

    'أدخل رقم البطاقة الوطنية') 
    && ok;
  ok = valid('fg-dob',
     !!dob, 'أدخل تاريخ ميلادك') 
     &&   ok;
  ok = valid('fg-wil', !!wil, 'اختر ولايتك')
   && ok;
  ok = valid('fg-gen', !!gen, 'اختر الجنس')
   && ok;
  if (!ok) 
    return;

  S.cni = cni;
    S.dob = dob;
     S.wilaya = wil;
      S.gender = gen;

  loading('جارٍ التحقق من البطاقة الوطنية...');
  const res = await API.verifyCitizen(cni, dob);
  doneLoading();

  if (!res.ok) {
    
    // ياودي هذي التحقق من nin
    
    document.getElementById('fg-cni').classList.add('err');
    document.getElementById('fg-cni').querySelector('.err-msg').textContent = res.reason;
    return;
  }

  S.citizen = res.citizen;

 




  const card = document.getElementById('profile-card');

  card.style.display = 'block';


  document.getElementById('profileGrid').innerHTML = `
    <div class="pf"><div class="pf-lbl">الاسم بالعربية</div><div class="pf-val hi">${res.citizen.name_ar}</div></div>
    <div class="pf"><div class="pf-lbl">Nom en français</div><div class="pf-val">${res.citizen.name_fr}</div></div>
    <div class="pf"><div class="pf-lbl">تاريخ الميلاد</div><div class="pf-val">${res.citizen.dob}</div></div>
    <div class="pf"><div class="pf-lbl">الجنس</div><div class="pf-val">${gen}</div></div>
    <div class="pf"><div class="pf-lbl">الولاية</div><div class="pf-val">${wil}</div></div>
    <div class="pf"><div class="pf-lbl">العنوان</div><div class="pf-val">${res.citizen.address}</div></div>
  `;
  card.scrollIntoView({ behavior: 'smooth', block: 'center' });

  

                // ],dvm دويرة

  await wait(600);
  go(2);
  runEligibility();
}


function selType(t) {
  S.ptype = t;
  document.getElementById('to-ord').classList.toggle('selected', t === 'ord');
  document.getElementById('to-ext').classList.toggle('selected', t === 'ext');
}

document.getElementById('inp-rsn').addEventListener('change', function () {
  document.getElementById('lost-row').style.display =
    (this.value === 'lost' || this.value === 'damaged') ? 'grid' : 'none';
});

async function runEligibility() {
  const checks = [
                         {
      id: 'chk-law', 
      sid: 'chk-law-s',
       delay: 700
      },

    {
       id: 'chk-mil',
        sid: 'chk-mil-s'
        , delay: 1300
       },

    { 
      id: 'chk-tax', sid: 'chk-tax-s', delay: 1900
                    },

  ];




  
  const res = await API.checkEligibility(S.cni);
  for (const c of checks) {
    await wait(c.delay);
    const el = document.getElementById(c.id);
    const st = document.getElementById(c.sid);
    el.classList.add('ok');
    st.className = 'chk-st ok';
    st.textContent = '✓ مؤكَّد';
  }
  S.eligOk = true;
  document.getElementById('elig-ok').style.display = 'block';
}

async function step2() {
  const val    = document.getElementById('inp-val').value;
  const rsn    = document.getElementById('inp-rsn').value;
  const pickup = document.getElementById('inp-pickup').value;

  let ok = true;
  ok = valid('fg-val', !!val, 'اختر مدة الصلاحية') && ok;
  ok = valid('fg-rsn', !!rsn, 'اختر سبب الطلب') && ok;
  if (!ok) return;

  S.validity = val; S.reason = rsn;
  S.pickup   = pickup || 'مقر الولاية';
  S.email    = document.getElementById('inp-email').value.trim();
  S.lostRef  = document.getElementById('inp-lost').value.trim();

  if (!S.eligOk) {
    loading('جارٍ فحص الأهلية...');
    await runEligibility();
    doneLoading();
  }

  go(3);
}


function loadPhoto(input) {
  const file = input.files[0];
  if (!file) return;
  S.photoUrl = URL.createObjectURL(file);
  const img = document.getElementById('prev-img');
  img.src = S.photoUrl;
  img.style.display = 'block';
  document.getElementById('pz-ph').style.display = 'none';
  runFaceCheck();
}

async function runFaceCheck() {
  const card = document.getElementById('face-card');
  const list = document.getElementById('face-checks');
  card.style.display = 'block';

  const items = [
    {
       label: 'جودة الصورة',           sub: 'الدقة والوضوح',             delay: 500
        },
    { 
      label: 'خلفية بيضاء',            sub: 'تم اكتشاف الخلفية',        delay: 900  },
    { 
      label: 'تطابق الوجه مع الهوية', sub: 'CNI ' + S.cni.slice(0,4)+'****',  delay: 1400 },
    { 
      label: 'Liveness Detection',     sub: 'ليست صورة مزيفة',          delay: 1900 },
  ];

  list.innerHTML = items.map((c, i) => `
    <div class="chk" id="fc${i}">
      <span class="chk-ico">⏳</span>
      <div class="chk-txt">
      <strong>${c.label}</strong><span>${c.sub}</span></div>
      <span class="chk-st pend">جارٍ الفحص</span>
    </div>`).join('');

  const res = await API.verifyFace(S.photoUrl, S.cni);
  const prs = ['pr1','pr2','pr3','pr4','pr5','pr6'];

  for (let i = 0; i < items.length; i++) {
    await wait(items[i].delay);
    const el = document.getElementById('fc' + i);
    el.classList.add('ok');
    el.querySelector('.chk-ico').textContent = '✅';
    el.querySelector('.chk-st').className = 'chk-st ok';
    el.querySelector('.chk-st').textContent = `✓ ${i === 2 ?
       res.score + '%' : 'مؤكَّد'}`;
    if (prs[i]) 
      document.getElementById(prs[i]).classList.add('ok');
  }
 
  document.getElementById('pr5').classList.add('ok');

  document.getElementById('pr6').classList.add('ok');

  S.photoVerified = true;

  card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function step3() {
  if (!S.photoUrl)     { 
    ('يرجى تحميل صورتك الشخصية أولاً');
     return; 
    
    }
  if (!S.photoVerified){
    ('انتظر انتهاء فحص الصورة');
    
    return; 
  }
  buildSummary();
  go(4);
}


const TYPES   = {
   ord: 'جواز عادي — 32 صفحة', 
   ext: 'جواز موسّع — 48 صفحة' 
  
  
  };
const REASONS = {
   new:'أول مرة',
    renew:'تجديد جواز منتهي',
     lost:'ضياع الجواز', 
     damaged:'تلف الجواز' 
    
    };

function buildSummary() {
  const c = S.citizen || {};
  const rows = [
    ['الاسم بالعربية',     c.name_ar || '—'],
    ['Nom en français',     c.name_fr || '—'],
    ['رقم البطاقة الوطنية', S.cni],
    ['تاريخ الميلاد',       c.dob || S.dob],
    ['الجنس',               S.gender],
    ['الولاية',             S.wilaya],
    ['نوع الجواز',          `<span class="tag g">${TYPES[S.ptype]}</span>`],
    ['مدة الصلاحية',        `<span class="tag o">${S.validity} سنوات</span>`],
    ['سبب الطلب',           REASONS[S.reason] || S.reason],
    ['مكان الاستلام',       S.pickup],
    ['البريد الإلكتروني',   S.email || '—'],
    ['التحقق البيومتري',    '<span class="tag g">✓ مُجتاز</span>'],
    ['فحوصات الأهلية',      '<span class="tag g">✓ مستوفاة</span>'],
  ];
  document.getElementById('sumTable').innerHTML =
    rows.map(([l, v]) => `<tr><td>${l}</td><td>${v}</td></tr>`).join('');
}

async function submit() {
  if (!document.getElementById('ck1').checked ||
      !document.getElementById('ck2').checked ||
      !document.getElementById('ck3').checked) {
    ('يرجى الموافقة على جميع البنود للمتابعة'); return;
  }

  loading('جارٍ إرسال طلبك...');
  await wait(2000);
  doneLoading();

  const req = API.createRequest({
    cni: S.cni, citizen: S.citizen, wilaya: S.wilaya, gender: S.gender,
    ptype: S.ptype, validity: S.validity, reason: S.reason,
    pickup: S.pickup, email: S.email,
  });

  document.getElementById('track-code').textContent = req.ref;
  document.getElementById('pickup-place').textContent = S.pickup || 'مقر الولاية';
  go(5);
}