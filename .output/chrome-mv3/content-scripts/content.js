var content=(function(){function e(e){return e}var t=globalThis.browser?.runtime?.id?globalThis.browser:globalThis.chrome,n=[`input#email`,`input[name="email"]`,`input[type="email"]`,`input[autocomplete="email"]`],r=[`button[type="submit"]`,`form button:not([type="button"])`];function i(){if(location.hostname!==`chatgpt.com`&&location.hostname!==`auth.openai.com`)return!1;if(location.pathname.startsWith(`/auth/login`))return!0;let e=document.querySelector(`input#email, input[name="email"], input[type="email"], input[autocomplete="email"]`);return!!(e&&a(e)||location.hostname===`auth.openai.com`&&document.querySelector(`input[name="email"], input[type="email"]`))}function a(e){let t=e,n=window.getComputedStyle(t),r=t.getBoundingClientRect();return n.display!==`none`&&n.visibility!==`hidden`&&r.width>0&&r.height>0}async function o(e){let t=c(n);if(!t)return p(`没有找到邮箱输入框`);l(t,e),t.dispatchEvent(new Event(`input`,{bubbles:!0})),t.dispatchEvent(new Event(`change`,{bubbles:!0})),await u();let r=s();return r?(r.disabled&&await d(r,2500),r.disabled?p(`继续按钮仍然不可点击`):(r.click(),f(`已填入邮箱并点击继续`))):p(`没有找到继续按钮`)}function s(){for(let e of r){let t=document.querySelector(e);if(t)return t}return Array.from(document.querySelectorAll(`button`)).find(e=>{let t=(e.textContent||``).trim();return t===`继续`||t.toLowerCase()===`continue`})??null}function c(e){for(let t of e){let e=document.querySelector(t);if(e)return e}return null}function l(e,t){Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,`value`)?.set?.call(e,t)}function u(){return new Promise(e=>window.setTimeout(e,60))}function d(e,t){let n=Date.now();return new Promise(r=>{let i=()=>{if(!e.disabled||Date.now()-n>=t){r();return}window.setTimeout(i,100)};i()})}function f(e){return{ok:!0,message:e}}function p(e){return{ok:!1,message:e}}var m=[`input[name="code"]`,`input[name="otp"]`,`input[autocomplete="one-time-code"]`,`input[inputmode="numeric"]`,`input[type="text"]`];function h(){if(location.hostname!==`auth.openai.com`||!location.pathname.startsWith(`/email-verification`))return!1;let e=(document.body?.textContent||``).toLowerCase();return!(e.includes(`已验证`)||e.includes(`verified`)||e.includes(`email verified`))}async function g(e){let t=e.replace(/\D/g,``);if(!t)return C(`验证码不能为空`);let n=y();if(!n)return C(`没有找到验证码输入框`);if(await _(n,t),await v(200),!n.value)return C(`验证码未写入输入框（React 框架兼容问题）`);let r=b();return r?(r.disabled&&await x(r,3e3),r.disabled?C(`验证码继续按钮仍然不可点击`):(r.click(),S(`已填入验证码并点击继续`))):C(`没有找到验证码继续按钮`)}async function _(e,t){if(e.focus(),e.dispatchEvent(new FocusEvent(`focus`,{bubbles:!0})),e.dispatchEvent(new FocusEvent(`focusin`,{bubbles:!0})),await v(100),e.select(),document.execCommand(`selectAll`),document.execCommand(`delete`),await v(50),!document.execCommand(`insertText`,!1,t)||e.value!==t){let n=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(e),`value`)?.set||Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,`value`)?.set;n?n.call(e,t):e.value=t,e.dispatchEvent(new InputEvent(`input`,{bubbles:!0,cancelable:!0,inputType:`insertText`,data:t}))}await v(100),e.dispatchEvent(new Event(`change`,{bubbles:!0}))}function v(e){return new Promise(t=>window.setTimeout(t,e))}function y(){for(let e of m){let t=document.querySelector(e);if(t)return t}return Array.from(document.querySelectorAll(`input`)).find(e=>{let t=[e.placeholder,e.ariaLabel,e.name,e.id].join(` `).toLowerCase();return t.includes(`code`)||t.includes(`otp`)||t.includes(`验证`)})??null}function b(){return document.querySelector(`button[type="submit"]`)||(Array.from(document.querySelectorAll(`button`)).find(e=>{let t=(e.textContent||``).trim();return t===`继续`||t.toLowerCase()===`continue`})??null)}function x(e,t){let n=Date.now();return new Promise(r=>{let i=()=>{if(!e.disabled||Date.now()-n>=t){r();return}window.setTimeout(i,100)};i()})}function S(e){return{ok:!0,message:e}}function C(e){return{ok:!1,message:e}}var w=[`input[name="name"]`,`input[name="fullName"]`,`input[autocomplete="name"]`,`input[type="text"]`],T=[`input[name="age"]`,`input[inputmode="numeric"]`,`input[type="number"]`,`input[type="text"]`],ee=[`Arlen`,`Brennan`,`Calvin`,`Darian`,`Elliot`,`Finley`,`Gavin`,`Harlan`,`Jasper`,`Kieran`,`Landon`,`Morgan`,`Nolan`,`Parker`,`Rowan`,`Sawyer`,`Tristan`,`Warren`];function E(){return location.hostname===`auth.openai.com`&&location.pathname.startsWith(`/about-you`)}async function D(){let e=te(),t=ne(e);if(!e)return fe(`没有找到全名输入框`);if(!t)return fe(`没有找到年龄输入框`);let n=le(),r=String(ue(25,55));if(await O(e,n),await k(300),await O(t,r),await k(300),!e.value&&!t.value)return fe(`资料填写失败：值未写入输入框`);let i=se();return i?(i.disabled&&await ce(i,3e3),i.disabled?fe(`完成账户创建按钮仍然不可点击`):(i.click(),de(`已填写 ${n} / ${r} 并点击创建`))):fe(`没有找到完成账户创建按钮`)}async function O(e,t){if(e.focus(),e.dispatchEvent(new FocusEvent(`focus`,{bubbles:!0})),e.dispatchEvent(new FocusEvent(`focusin`,{bubbles:!0})),await k(100),e.select(),document.execCommand(`selectAll`),document.execCommand(`delete`),await k(50),!document.execCommand(`insertText`,!1,t)||e.value!==t){let n=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(e),`value`)?.set||Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,`value`)?.set;n?n.call(e,t):e.value=t,e.dispatchEvent(new InputEvent(`input`,{bubbles:!0,cancelable:!0,inputType:`insertText`,data:t}))}await k(100),e.dispatchEvent(new Event(`change`,{bubbles:!0})),e.dispatchEvent(new FocusEvent(`blur`,{bubbles:!0})),e.dispatchEvent(new FocusEvent(`focusout`,{bubbles:!0}))}function k(e){return new Promise(t=>window.setTimeout(t,e))}function te(){let e=re([`全名`,`名字`,`name`,`full name`]);if(e)return e;for(let e of w){let t=document.querySelector(e);if(t&&!oe(t))return t}return ae().find(e=>!oe(e))??null}function ne(e){let t=re([`年龄`,`age`]);if(t&&t!==e)return t;for(let t of T){let n=Array.from(document.querySelectorAll(t)).find(t=>t!==e&&oe(t));if(n)return n}return ae().find(t=>t!==e)??null}function re(e){let t=ae();for(let n of t){let t=[n.name,n.id,n.placeholder,n.ariaLabel,n.getAttribute(`aria-labelledby`)?ie(n.getAttribute(`aria-labelledby`)||``):``,n.closest(`label`)?.textContent||``,n.parentElement?.textContent||``].join(` `).toLowerCase();if(e.some(e=>t.includes(e.toLowerCase())))return n}return null}function ie(e){return e.split(/\s+/).map(e=>document.getElementById(e)?.textContent||``).join(` `)}function ae(){return Array.from(document.querySelectorAll(`input`)).filter(e=>{let t=(e.type||`text`).toLowerCase();return[`text`,`number`,`tel`,``].includes(t)})}function oe(e){let t=[e.name,e.id,e.placeholder,e.ariaLabel,e.inputMode,e.type,e.parentElement?.textContent||``].join(` `).toLowerCase();return t.includes(`age`)||t.includes(`年龄`)||t.includes(`numeric`)||e.type===`number`}function se(){return document.querySelector(`button[type="submit"]`)||(Array.from(document.querySelectorAll(`button`)).find(e=>{let t=(e.textContent||``).trim().toLowerCase();return t.includes(`完成帐户创建`)||t.includes(`完成账户创建`)||t.includes(`create account`)||t.includes(`continue`)})??null)}function ce(e,t){let n=Date.now();return new Promise(r=>{let i=()=>{if(!e.disabled||Date.now()-n>=t){r();return}window.setTimeout(i,100)};i()})}function le(){return ee[ue(0,ee.length-1)]}function ue(e,t){return Math.floor(Math.random()*(t-e+1))+e}function de(e){return{ok:!0,message:e}}function fe(e){return{ok:!1,message:e}}var pe=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;function me(e){let t=e.trim();if(!t)return he(`empty`,`请输入邮箱或 Outlook 账号行`);let n=t.split(/\r?\n/).map(e=>e.trim()).find(Boolean)||``;if(n.includes(`----`)){let e=n.split(`----`).map(e=>e.trim()),t=e[0]||``;return pe.test(t)?e.length<4||!e[2]||!e[3]?he(`invalid`,`Outlook 行需要 email----password----client_id----refresh_token`):{ok:!0,mode:`outlook-line`,email:t,accountLine:n,message:`Outlook API 自动验证码`}:he(`invalid`,`Outlook 行里的邮箱格式不正确`)}return pe.test(n)?{ok:!0,mode:`email`,email:n,accountLine:``,message:`单邮箱模式，验证码手动输入`}:he(`invalid`,`邮箱格式不正确`)}function he(e,t){return{ok:!1,mode:e,email:``,accountLine:``,message:t}}var ge=/"accessToken"\s*:\s*"([^"]+)"/,_e=/"accessToken"\s*:\s*"?([A-Za-z0-9_.-]+)/,ve=/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/,A={planName:`chatgptplusplan`,uiMode:`hosted`,region:`US`,workspaceName:`MyTeam`,seatQuantity:5};function ye(e){let t=String(e||``).trim();if(!t)throw Error(`请输入包含 accessToken 的 JSON 或字符串`);let n=Te(t)||De(t)||Oe(t);if(!n)throw Error(`未找到 accessToken`);if(n.split(`.`).length!==3)throw Error(`accessToken 格式不正确`);return n}function be(e){let t=ke(e)?e:{};return{planName:xe(t.planName),uiMode:Se(t.uiMode),region:Ce(t.region||t.country),workspaceName:String(t.workspaceName||t.workspace_name||A.workspaceName).trim()||A.workspaceName,seatQuantity:we(t.seatQuantity)}}function xe(e){return e===`chatgptplusplan`||e===`chatgptteamplan`?e:A.planName}function Se(e){return e===`hosted`?`hosted`:`custom`}function Ce(e){let t=String(e||A.region).trim().toUpperCase();return t===`ID`||t===`DE`||t===`JP`||t===`US`?t:A.region}function we(e){let t=Number(e||A.seatQuantity);if(!Number.isInteger(t)||t<1)throw Error(`team_plan_data.seat_quantity 必须是大于 0 的整数`);return t}function Te(e){try{return Ee(JSON.parse(e))}catch{return``}}function Ee(e,t=0){if(!ke(e)||t>4)return``;if(typeof e.accessToken==`string`)return e.accessToken.trim();for(let n of Object.values(e)){let e=Ee(n,t+1);if(e)return e}return``}function De(e){let t=ge.exec(e);if(t?.[1])return t[1].trim();let n=_e.exec(e);if(!n?.[1])return``;let r=n[1].trim().replace(/[",}\]\s]+$/,``);return ve.exec(r)?.[0]?.trim()||r}function Oe(e){return ve.exec(e)?.[0]?.trim()||``}function ke(e){return!!(e&&typeof e==`object`)}var Ae=`http://127.0.0.1:8787`,je=`opx.registerAssist.state`,Me={rawInput:``,email:``,accountLine:``,inputMode:`empty`,autoOtp:!1,apiBase:Ae,otpRequestedAt:0,updatedAt:0},Ne={checkoutOptions:A,updatedAt:0},Pe={rawInput:``,history:[],updatedAt:0};async function j(){return We((await t.storage.local.get(je))[je])}async function Fe(e){let n=We({...await j(),activeTab:e});return await t.storage.local.set({[je]:n}),n}async function Ie(e){let n=We({...await j(),panelCollapsed:e});return await t.storage.local.set({[je]:n}),n}async function Le(){return(await j()).register}async function Re(e){let n=await j(),r=Ge({...n.register,...e,updatedAt:Date.now()}),i=We({...n,register:r});return await t.storage.local.set({[je]:i}),i.register}async function ze(){return(await j()).linkExtractor}async function Be(e){let n=await j(),r=Ke({...n.linkExtractor,...e,updatedAt:Date.now()}),i=We({...n,linkExtractor:r});return await t.storage.local.set({[je]:i}),i.linkExtractor}async function Ve(){return(await j()).smsRelay}async function He(e){let n=await j(),r=qe({...n.smsRelay,...e,updatedAt:Date.now()}),i=We({...n,smsRelay:r});return await t.storage.local.set({[je]:i}),i.smsRelay}function Ue(e){return e===`auto`||e===`register`||e===`link`||e===`address`||e===`sms`}function We(e){let t=M(e)?e:{},n=M(t.register)?t.register:t,r=M(t.linkExtractor)?t.linkExtractor:t,i=M(t.smsRelay)?t.smsRelay:Pe;return{activeTab:Ue(String(t.activeTab||``))?t.activeTab:`auto`,panelCollapsed:!!t.panelCollapsed,register:Ge(n),linkExtractor:Ke(r),smsRelay:qe(i)}}function Ge(e){let t=M(e)?e:{};return{rawInput:String(t.rawInput||Me.rawInput),email:String(t.email||Me.email),accountLine:String(t.accountLine||Me.accountLine),inputMode:Ye(t.inputMode),autoOtp:!!t.autoOtp,apiBase:String(t.apiBase||Me.apiBase),otpRequestedAt:Number(t.otpRequestedAt||Me.otpRequestedAt),updatedAt:Number(t.updatedAt||Me.updatedAt)}}function Ke(e){let t=M(e)?e:{};return{checkoutOptions:be(t.checkoutOptions||Ne.checkoutOptions),updatedAt:Number(t.updatedAt||Ne.updatedAt)}}function qe(e){let t=M(e)?e:{},n=Array.isArray(t.history)?t.history.map(Je).filter(e=>!!e):Pe.history;return{rawInput:String(t.rawInput||Pe.rawInput),history:n,updatedAt:Number(t.updatedAt||Pe.updatedAt)}}function Je(e){if(!M(e))return null;let t=String(e.phone||``).trim(),n=String(e.code||``).trim();if(!t||!n)return null;let r=Number(e.receivedAt||0)||Date.now();return{id:String(e.id||`${t}-${n}-${r}`),phone:t,code:n,message:String(e.message||``).trim(),receivedAt:r}}function Ye(e){return e===`email`||e===`outlook-line`||e===`invalid`?e:`empty`}function M(e){return!!(e&&typeof e==`object`)}var Xe=!1;function Ze(){return{getPageState:Qe,loadState:Le,saveInput:async e=>{let t=me(e);return Re({rawInput:e,email:t.email,accountLine:t.accountLine,inputMode:t.mode,autoOtp:t.mode===`outlook-line`})},fillEmailFromInput:async()=>{let e=me((await Le()).rawInput);return e.ok?i()?(await Re({email:e.email,accountLine:e.accountLine,inputMode:e.mode,autoOtp:e.mode===`outlook-line`,otpRequestedAt:Date.now()}),o(e.email)):N(`当前页面不是 ChatGPT 登录页`):N(e.message)},fillOtp:async e=>h()?g(e):N(`当前页面不是邮箱验证码页`),waitForOutlookOtp:async()=>{if(!h())return N(`当前页面不是邮箱验证码页`);let e=await Le();if(!e.accountLine)return N(`当前输入不是 Outlook 账号行，不能自动接收验证码`);let n=await t.runtime.sendMessage({type:`opx:wait-outlook-otp`,accountLine:e.accountLine,apiBase:e.apiBase,since:e.otpRequestedAt||e.updatedAt||Date.now(),timeoutMs:18e4,intervalMs:5e3});if(!$e(n))return N(`Outlook API 没有返回有效结果`);if(!n.ok||!n.code)return n;let r=await g(n.code);return{...r,code:n.code,message:r.ok?`已收到并提交验证码：${n.code}`:r.message}},fillProfileAndCreate:async()=>E()?D():N(`当前页面不是资料填写页`),autoRunForCurrentPage:async()=>{!E()||Xe||(Xe=!0,await et(),await D())}}}function Qe(){return i()?{kind:`login`,label:`ChatGPT 登录页`,canFillEmail:!0,canFillOtp:!1,canFillProfile:!1}:h()?{kind:`email-verification`,label:`邮箱验证码页`,canFillEmail:!1,canFillOtp:!0,canFillProfile:!1}:E()?{kind:`about-you`,label:`资料填写页`,canFillEmail:!1,canFillOtp:!1,canFillProfile:!0}:{kind:`unknown`,label:`未识别页面`,canFillEmail:!1,canFillOtp:!1,canFillProfile:!1}}function N(e){return{ok:!1,message:e}}function $e(e){return!!(e&&typeof e==`object`&&typeof e.ok==`boolean`&&typeof e.message==`string`)}function et(){return new Promise(e=>window.setTimeout(e,800))}var tt=`opx.extension.settings`,P={payOpenAiEnabled:!0,payPalSignupEnabled:!0,countryCode:`US`,city:``,lastAddress:null,updatedAt:0},nt={email:``,password:``,updatedAt:0},rt={addressAutofill:P,paypalAccount:nt,updatedAt:0},it=new Set([`RANDOM`,`US`,`CA`,`AU`,`JP`,`TW`,`KR`,`HK`,`GB`,`DE`,`SG`,`FR`,`IT`,`ES`,`NL`,`MY`,`RU`,`CN`,`TH`,`PH`,`AR`,`TR`,`VN`]);async function at(){return ot((await t.storage.local.get(tt))[tt])}async function F(e){let n=await at(),r=ut({...n.addressAutofill,...e,updatedAt:Date.now()}),i=ot({...n,addressAutofill:r,updatedAt:Date.now()});return await t.storage.local.set({[tt]:i}),i.addressAutofill}async function I(){return(await at()).addressAutofill}function ot(e){let t=L(e)?e:{};return{addressAutofill:ut(t.addressAutofill),paypalAccount:st(t.paypalAccount),updatedAt:Number(t.updatedAt||rt.updatedAt)}}function st(e){let t=L(e)?e:{};return{email:String(t.email||nt.email).trim(),password:String(t.password||nt.password),updatedAt:Number(t.updatedAt||nt.updatedAt)}}async function ct(){return(await at()).paypalAccount}async function lt(e){let n=await at(),r=st({...n.paypalAccount,...e,updatedAt:Date.now()}),i=ot({...n,paypalAccount:r,updatedAt:Date.now()});return await t.storage.local.set({[tt]:i}),i.paypalAccount}function ut(e){let t=L(e)?e:{};return{payOpenAiEnabled:t.payOpenAiEnabled===void 0?P.payOpenAiEnabled:!!t.payOpenAiEnabled,payPalSignupEnabled:t.payPalSignupEnabled===void 0?P.payPalSignupEnabled:!!t.payPalSignupEnabled,countryCode:ht(t.countryCode||t.country),city:String(t.city||t.region||P.city),lastAddress:dt(t.lastAddress),updatedAt:Number(t.updatedAt||P.updatedAt)}}function dt(e){if(!L(e))return null;let t=String(e.line1||``).trim(),n=String(e.city||``).trim(),r=String(e.countryCode||e.country||`US`).trim().toUpperCase(),i=String(e.state||``).trim(),a=r===`US`?i.toUpperCase():i,o=String(e.postalCode||``).trim();return!t||!n||!a||!o?null:{id:String(e.id||`${Date.now()}`),fullName:String(e.fullName||``).trim(),line1:t,line2:String(e.line2||``).trim(),city:n,state:a,stateFull:String(e.stateFull||``).trim(),postalCode:o,countryCode:r,countryLabel:String(e.countryLabel||``).trim(),countryPath:String(e.countryPath||``).trim(),phone:String(e.phone||``).trim(),identity:ft(e.identity),employment:pt(e.employment),creditCard:mt(e.creditCard),source:e.source===`fallback`?`fallback`:`meiguodizhi`,fetchedAt:Number(e.fetchedAt||0)}}function ft(e){let t=L(e)?e:{};return{gender:String(t.gender||``).trim(),title:String(t.title||``).trim(),birthday:String(t.birthday||``).trim(),username:String(t.username||``).trim(),password:String(t.password||``).trim(),temporaryMail:String(t.temporaryMail||``).trim(),system:String(t.system||``).trim(),userAgent:String(t.userAgent||``).trim(),website:String(t.website||``).trim(),securityQuestion:String(t.securityQuestion||``).trim(),securityAnswer:String(t.securityAnswer||``).trim()}}function pt(e){let t=L(e)?e:{};return{educationalBackground:String(t.educationalBackground||``).trim(),occupation:String(t.occupation||``).trim(),employmentStatus:String(t.employmentStatus||``).trim(),monthlySalary:String(t.monthlySalary||``).trim(),companySize:String(t.companySize||``).trim(),companyName:String(t.companyName||``).trim()}}function mt(e){let t=L(e)?e:{},n=String(t.number||``).replace(/\D/g,``),r=String(t.last4||n.slice(-4)||``).replace(/\D/g,``).slice(-4);return{type:String(t.type||``).trim(),number:n,cvv:String(t.cvv||``).trim(),expires:String(t.expires||``).trim(),last4:r,maskedNumber:String(t.maskedNumber||(r?`**** **** **** ${r}`:``)).trim()}}function L(e){return!!(e&&typeof e==`object`)}function ht(e){let t=String(e||P.countryCode).trim().toUpperCase();return it.has(t)?t:P.countryCode}var gt=[{code:`US`,label:`美国`,path:`/`},{code:`CA`,label:`加拿大`,path:`/ca-address`},{code:`AU`,label:`澳大利亚`,path:`/au-address`},{code:`JP`,label:`日本`,path:`/jp-address`},{code:`TW`,label:`台湾`,path:`/tw-address`},{code:`KR`,label:`韩国`,path:`/kr-address`},{code:`HK`,label:`香港`,path:`/hk-address`},{code:`GB`,label:`英国`,path:`/uk-address`},{code:`DE`,label:`德国`,path:`/de-address`},{code:`SG`,label:`新加坡`,path:`/sg-address`},{code:`FR`,label:`法国`,path:`/fr-address`},{code:`IT`,label:`意大利`,path:`/it-address`},{code:`ES`,label:`西班牙`,path:`/es-address`},{code:`NL`,label:`荷兰`,path:`/nl-address`},{code:`MY`,label:`马来西亚`,path:`/my-address`},{code:`RU`,label:`俄罗斯`,path:`/ru-address`},{code:`CN`,label:`中国`,path:`/cn-address`},{code:`TH`,label:`泰国`,path:`/th-address`},{code:`PH`,label:`菲律宾`,path:`/ph-address`},{code:`AR`,label:`阿根廷`,path:`/ar-address`},{code:`TR`,label:`土耳其`,path:`/tr-address`},{code:`VN`,label:`越南`,path:`/vn-address`}],R=`[OPX Pay Autofill]`,_t=!1,vt=!1,yt=null,bt=null,xt=``;function St(){_t||location.hostname!==`pay.openai.com`||(_t=!0,Vt(),Bt(),Ht(800))}async function Ct(){if(!vt){vt=!0;try{let e=await I();if(!e.payOpenAiEnabled){console.info(`${R} disabled`);return}let t=await Tt(e);if(!t){console.info(`${R} no address available`);return}let n=await wt(t);console.info(`${R} ${n.message}`,{city:t.city,state:t.state,postalCode:t.postalCode,country:t.countryCode,source:t.source})}catch(e){console.warn(`${R} failed`,e)}finally{vt=!1}}}async function wt(e){if(location.hostname!==`pay.openai.com`)return{ok:!1,filled:0,message:`当前不是 pay.openai.com 页面`};Ot(),await Yt(450),await Jt(3e3);let t=await Dt(e);return{ok:t>0,filled:t,message:t>0?`已填写 OpenAI 支付页 ${t} 项`:`未找到可填写的 OpenAI 支付字段`}}async function Tt(e){let t=`${e.countryCode}|${e.city}`;return bt&&xt===t?bt:(bt=await Et(e),xt=t,bt)}async function Et(e){let n=await t.runtime.sendMessage({type:`opx:fetch-random-address`,countryCode:e.countryCode,city:e.city});return!Xt(n)||!n.ok||!n.address?(console.warn(`${R} address fetch failed`,n),null):(await F({lastAddress:n.address}),n.address)}async function Dt(e){let t=0;return t+=kt(`#billingName`,e.fullName,!0),t+=jt(`#billingCountry`,e.countryCode,[e.countryLabel,e.countryCode]),document.querySelector(`#billingCountry`)&&await Yt(550),t+=kt(`#billingAddressLine1`,e.line1,!0),qt(),await Yt(300),t+=kt(`#billingAddressLine2`,e.line2,!0),t+=kt(`#billingLocality`,e.city,!0),t+=Nt(`#billingAdministrativeArea`,e.state,[e.stateFull,e.state]),t+=kt(`#billingPostalCode`,e.postalCode,!0),t+=kt(`#phoneNumber`,e.phone,!1),t+=At(`billing address-line1`,e.line1),qt(),await Yt(300),t+=At(`billing address-line2`,e.line2),t+=At(`billing address-level2`,e.city),t+=At(`billing postal-code`,e.postalCode),t+=Pt(`billing address-level1`,e.state,[e.stateFull,e.state]),t+=Mt(`billing country`,e.countryCode,[e.countryLabel,e.countryCode]),t+=Lt(),t}function Ot(){let e=document.querySelector(`#payment-method-accordion-item-title-paypal`);if(e?.checked||e?.getAttribute(`aria-checked`)===`true`)return!0;let t=document.querySelector(`#payment-method-label-paypal`);if(t&&z(t))return zt(t),console.info(`${R} 已点击 PayPal label`),!0;let n=document.querySelector(`button[data-testid="paypal-accordion-item-button"]`);if(n&&z(n))return zt(n),console.info(`${R} 已点击 PayPal button`),!0;if(e){let t=e.closest(`.PaymentMethodFormAccordionItemTitle, .flex-container.direction-row.align-items-center, label, [role="radio"]`);return t&&z(t)?(zt(t),console.info(`${R} 已点击 PayPal radio 容器`),!0):(zt(e),console.info(`${R} 已点击 PayPal radio`),!0)}let r=Array.from(document.querySelectorAll(`div, span, label`)).filter(z).find(e=>B(e.textContent)===`paypal`);return r?(zt(r),console.info(`${R} 通过文本匹配点击了 PayPal`),!0):(console.warn(`${R} 未找到 PayPal 选项`),!1)}function kt(e,t,n){if(!t)return 0;let r=document.querySelector(e);return!Wt(r)||!z(r)||Ut(r)||!n&&r.value.trim()||r.value===t?0:(It(r,t),1)}function At(e,t){let n=`input[autocomplete="${Kt(e)}"], textarea[autocomplete="${Kt(e)}"]`,r=document.querySelector(n);return!Wt(r)||!z(r)||r.value===t||Ut(r)?0:(It(r,t),1)}function jt(e,t,n){let r=document.querySelector(e);return!Gt(r)||!z(r)?0:Ft(r,t,n)}function Mt(e,t,n){let r=document.querySelector(`select[autocomplete="${Kt(e)}"]`);return!Gt(r)||!z(r)?0:Ft(r,t,n)}function Nt(e,t,n){let r=document.querySelector(e);return Gt(r)?z(r)?Ft(r,t,n):0:Wt(r)?kt(e,t,!0):0}function Pt(e,t,n){let r=document.querySelector(`select[autocomplete="${Kt(e)}"]`);return Gt(r)?z(r)?Ft(r,t,n):0:At(e,t||n[0]||``)}function Ft(e,t,n){let r=Array.from(e.options).filter(e=>!e.disabled&&e.value),i=B(t),a=n.map(e=>B(e)).filter(Boolean),o=r.find(e=>B(e.value)===i)||r.find(e=>a.some(t=>B(`${e.text} ${e.value}`).includes(t)));return!o||e.value===o.value?0:(e.value=o.value,Rt(e),1)}function It(e,t){let n=e instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,r=Object.getOwnPropertyDescriptor(n,`value`);r?.set?r.set.call(e,t):e.value=t,Rt(e)}function Lt(){let e=0,t=Array.from(document.querySelectorAll(`input[type="checkbox"]`)).filter(z).filter(e=>!e.checked).filter(e=>{let t=B([e.id,e.name,e.getAttribute(`aria-label`),e.closest(`label`)?.textContent,e.parentElement?.textContent].join(` `));return t.includes(`terms`)||t.includes(`consent`)||t.includes(`使用条款`)||t.includes(`隐私政策`)||t.includes(`取消`)||e.id===`termsOfServiceConsentCheckbox`});for(let n of t)n.click(),e+=1;return e}function Rt(e){e.dispatchEvent(new Event(`input`,{bubbles:!0})),e.dispatchEvent(new Event(`change`,{bubbles:!0})),e.dispatchEvent(new Event(`blur`,{bubbles:!0}))}function zt(e){e.scrollIntoView({block:`center`,inline:`center`});for(let t of[`pointerdown`,`mousedown`,`pointerup`,`mouseup`,`click`]){let n=t.startsWith(`pointer`)?PointerEvent:MouseEvent;e.dispatchEvent(new n(t,{bubbles:!0,cancelable:!0,composed:!0,button:0,buttons:+!!t.endsWith(`down`),pointerId:1,pointerType:`mouse`}))}e.click()}function Bt(){new MutationObserver(()=>Ht(250)).observe(document.documentElement,{childList:!0,subtree:!0})}function Vt(){t.storage.onChanged.addListener((e,t)=>{t===`local`&&Object.keys(e).some(e=>e.includes(`settings`))&&(bt=null,xt=``,Ht(100))})}function Ht(e){yt&&window.clearTimeout(yt),yt=window.setTimeout(()=>{yt=null,Ct()},e)}function z(e){let t=e;if(`disabled`in t&&t.disabled)return!1;let n=window.getComputedStyle(t),r=t.getBoundingClientRect();return n.visibility!==`hidden`&&n.display!==`none`&&r.width>0&&r.height>0}function Ut(e){let t=B([e.getAttribute(`aria-label`),e.getAttribute(`placeholder`),e.getAttribute(`autocomplete`),e.getAttribute(`name`),e.getAttribute(`id`)].join(` `));return[`cc-number`,`card number`,`credit card`,`security code`,`cvc`,`cvv`,`expiry`,`expiration`].some(e=>t.includes(e))}function Wt(e){return!!(e&&(e instanceof HTMLInputElement||e instanceof HTMLTextAreaElement))}function Gt(e){return!!(e&&e instanceof HTMLSelectElement)}function B(e){return String(e||``).replace(/\s+/g,` `).trim().toLowerCase()}function Kt(e){return typeof CSS<`u`&&typeof CSS.escape==`function`?CSS.escape(e):e.replace(/"/g,`\\"`)}function qt(){let e=document.activeElement;e&&(e.dispatchEvent(new KeyboardEvent(`keydown`,{key:`Escape`,code:`Escape`,bubbles:!0})),e.dispatchEvent(new KeyboardEvent(`keyup`,{key:`Escape`,code:`Escape`,bubbles:!0})),e.blur());let t=document.querySelectorAll(`.pac-container`);for(let e of Array.from(t))e.style.display=`none`;let n=document.querySelectorAll(`a, button, span, div`);for(let e of Array.from(n)){let t=B(e.textContent||``);if((t.includes(`enter address manually`)||t.includes(`手动输入地址`)||t.includes(`manual`))&&z(e)){e.click();break}}}async function Jt(e){let t=Date.now()+e,n=[`#billingName`,`#billingAddressLine1`,`#billingCountry`,`input[autocomplete="billing address-line1"]`,`input[name="billingName"]`];for(;Date.now()<t;){for(let e of n){let t=document.querySelector(e);if(t&&z(t))return!0}await Yt(300)}return!1}function Yt(e){return new Promise(t=>window.setTimeout(t,e))}function Xt(e){return!!(e&&typeof e==`object`&&typeof e.ok==`boolean`&&typeof e.message==`string`)}var Zt=`[OPX PayPal Autofill]`,Qt=`opx.paypal.autofill.address`,$t=`opx.paypal.autofill.pendingManual`,en=`data-opx-paypal-filled`,tn=`opx-paypal-random-fill`,nn=3,rn={AR:`Argentina`,AU:`Australia`,CA:`Canada`,CN:`China`,DE:`Germany`,ES:`Spain`,FR:`France`,GB:`United Kingdom`,HK:`Hong Kong`,IT:`Italy`,JP:`Japan`,KR:`South Korea`,MY:`Malaysia`,NL:`Netherlands`,PH:`Philippines`,RU:`Russia`,SG:`Singapore`,TH:`Thailand`,TR:`Turkey`,TW:`Taiwan`,US:`United States`,VN:`Vietnam`},an=!1,on=!1,sn=null,V=null,cn=null,ln=``,un=0,dn=``;function fn(){an||!_r()||(an=!0,Yn(),rr(),Jn(),lr()?or(900):ir(800))}async function pn(e,t=!1,n=!0){if(!_r())return{ok:!1,filled:0,message:`当前不是 PayPal 注册支付页`,countryChanged:!1};let r=await I(),i=e||await hn(r);if(!i)return{ok:!1,filled:0,message:`没有可用地址资料`,countryChanged:!1};dr(i),t&&!n&&ar(),t&&(Ln(),Bn());let a=await gn(i,n);return Rn(i,a.countryChanged,n),t&&!n&&(dn=Vn(i),a.countryChanged?(cr(),or(1600)):ur()),{ok:a.filled>0||a.countryChanged,filled:a.filled,countryChanged:a.countryChanged,message:a.countryChanged?`已选择 PayPal 国家：${i.countryCode}，等待页面重新加载`:a.filled>0?`已填写 PayPal ${a.filled} 项`:`未找到可填写的 PayPal 字段`}}async function mn(){if(!on&&!(dn&&ln===dn)){on=!0;try{if(!(await I()).payPalSignupEnabled){console.info(`${Zt} disabled`);return}let e=await pn();console.info(`${Zt} ${e.message}`),(!e.ok||zn())&&(cn?.disconnect(),cn=null)}catch(e){console.warn(`${Zt} failed`,e)}finally{on=!1}}}async function hn(e){if(V&&fr(V,e))return V;let n=sr();if(n&&fr(n,e))return V=n,V;let r=await t.runtime.sendMessage({type:`opx:fetch-random-address`,countryCode:e.countryCode,city:e.city});return!wr(r)||!r.ok||!r.address?(console.warn(`${Zt} address fetch failed`,r),null):(V=r.address,dr(r.address),await F({lastAddress:r.address}),V)}async function gn(e,t){let n=0;if(_n(e))return t&&ir(1500),{filled:1,countryChanged:!0};let r=await vn(e),i=mr(e.fullName),a=pr(e.creditCard.expires);return n+=H(K.email,r,!0),n+=bn(r),xn(r),n+=H(K.phone,e.phone,!0),n+=H(K.cardNumber,e.creditCard.number,!0),n+=H(K.expiry,a.short,!0),n+=H(K.csc,e.creditCard.cvv,!0),n+=H(K.fullName,e.fullName,!0),n+=H(K.firstName,i.first,!0),n+=H(K.lastName,i.last,!0),n+=H(K.address1,e.line1,!0),n+=H(K.address2,e.line2,!0),n+=H(K.city,e.city,!0),n+=Sn(K.state,e.state,[e.stateFull,e.state]),n+=H(K.postalCode,e.postalCode,!0),n+=Cn(e,i),n+=Sn(K.expiryMonth,a.month,[a.month]),n+=Sn(K.expiryYear,a.year4,[a.year4,a.year2]),n>0&&setTimeout(()=>vr(),800),{filled:n,countryChanged:!1}}function _n(e){let t=kn(K.country);return!t||!U(t)?!1:Gn(t,e.countryCode,[e.countryCode,rn[e.countryCode]||``,e.countryLabel])}async function vn(e){let t=await Le(),n=me(t.rawInput);return n.ok&&Sr(n.email)?n.email:Sr(t.email)?t.email:Sr(e.identity.temporaryMail)?e.identity.temporaryMail:hr(e)}function H(e,t,n){if(!t)return 0;let r=On(e);return!r||!U(r)?0:yn(r,t,n)}function yn(e,t,n){if(!t||!U(e))return 0;let r=e.value.trim();return e.getAttribute(en)===`1`||Hn(r,t)?(e.setAttribute(en,`1`),0):!n&&r?0:(Kn(e,t),e.setAttribute(en,`1`),1)}function bn(e){if(!e)return 0;let t=document.querySelector(`input#password`)||On(K.password);if(!t||!U(t))return 0;let n=gr(e);return Hn(t.value.trim(),n)?0:(Kn(t,n),1)}function xn(e){let t=er();if(!t)return;let n=gr(e);bn(n);let r=`opx-paypal-password-note`,i=`当前密码：${n}`,a=document.getElementById(r);a||(a=document.createElement(`div`),a.id=r,Object.assign(a.style,{color:`#93e4bd`,fontSize:`12px`,lineHeight:`18px`,margin:`4px 0 10px`,padding:`6px 10px`,border:`1px solid rgba(47, 209, 124, 0.36)`,borderRadius:`6px`,background:`rgba(15, 23, 42, 0.82)`,display:`block`}));let o=t.parentElement;o&&(o.insertBefore(a,t),a.textContent=i)}function Sn(e,t,n){if(!t&&!n.some(Boolean))return 0;let r=kn(e);return r&&U(r)?+!!Gn(r,t,n):H(e,t||n.find(Boolean)||``,!0)}function Cn(e,t){let n=En();if(!n)return 0;let r=Array.from(n.querySelectorAll(`input, textarea, select`)).filter(e=>(W(e)||xr(e))&&U(e)&&!yr(e)&&!br(e)),i=0;return i+=wn(n,[`first name`,`given name`],t.first,r[0]),i+=wn(n,[`last name`,`family name`,`surname`],t.last,r[1]),i+=wn(n,[`street address`,`address line 1`,`address 1`],e.line1,r[2]),i+=wn(n,[`apt`,`ste`,`bldg`,`address line 2`,`address 2`],e.line2,r[3]),i+=wn(n,[`city`,`locality`],e.city,r[4]),i+=Tn(n,[`state`,`province`,`region`],e.state,[e.stateFull,e.state],r[5]),i+=wn(n,[`zip`,`postal code`,`postcode`],e.postalCode,r[6]),i}function wn(e,t,n,r){let i=r&&W(r)?r:null,a=Dn(e,t,W)||i;return a?yn(a,n,!0):0}function Tn(e,t,n,r,i){let a=i&&xr(i)?i:null,o=Dn(e,t,xr)||a;if(o)return+!!Gn(o,n,r);let s=i&&W(i)?i:null,c=Dn(e,t,W)||s;return c?yn(c,n||r.find(Boolean)||``,!0):0}function En(){return Array.from(document.querySelectorAll(`fieldset, [role="group"], section, form > div`)).find(e=>{let t=G(e.textContent||``);return t.includes(`billing address`)&&(t.includes(`street address`)||t.includes(`address`))&&(t.includes(`first name`)||t.includes(`last name`))})||null}function Dn(e,t,n){let r=t.map(G).filter(Boolean);return Array.from(e.querySelectorAll(`input, textarea, select`)).filter(n).map(e=>({control:e,score:Nn(e,r)})).filter(e=>e.score>0&&U(e.control)&&!yr(e.control)).sort((e,t)=>t.score-e.score)[0]?.control||null}function On(e){for(let t of e){let e=An(t);if(W(e))return e}return Mn(e,W)}function kn(e){for(let t of e){let e=An(t);if(xr(e))return e}return Mn(e,xr)}function An(e){if(!jn(e))return null;try{return document.querySelector(e)}catch{return null}}function jn(e){let t=e.trim();return/^[.#[]/.test(t)||/^(input|select|textarea|button|label|form|fieldset|section|div)([#.[\s:]|$)/i.test(t)}function Mn(e,t){let n=e.filter(e=>!e.includes(`[`)&&!e.includes(`#`)&&!e.includes(`.`)).map(G).filter(Boolean);return n.length&&Array.from(document.querySelectorAll(`input, textarea, select`)).filter(t).map(e=>({control:e,score:Nn(e,n)})).filter(e=>e.score>0&&U(e.control)&&!yr(e.control)).sort((e,t)=>t.score-e.score)[0]?.control||null}function Nn(e,t){if(!U(e)||yr(e))return 0;let n=G([e.id,e.name,`placeholder`in e?e.placeholder:``,`autocomplete`in e?e.autocomplete:``,e.getAttribute(`aria-label`),Pn(e),Fn(e)].join(` `)),r=G([e.previousElementSibling?.textContent,e.nextElementSibling?.textContent,In(e)].join(` `)),i=G(e.parentElement?.textContent||``);return t.some(e=>n.includes(e))?30:t.some(e=>r.includes(e))?20:i.length<=120&&t.some(e=>i.includes(e))?5:0}function Pn(e){let t=[],n=e.getAttribute(`aria-labelledby`);if(n)for(let e of n.split(/\s+/)){let n=document.getElementById(e);n?.textContent&&t.push(n.textContent)}let r=e.id;if(r)for(let e of Array.from(document.querySelectorAll(`label[for="${Wn(r)}"]`)))t.push(e.textContent||``);return t.join(` `)}function Fn(e){return e.closest(`label`)?.textContent||``}function In(e){let t=e.closest(`div, label, section`)?.textContent||``;return t.length<=160?t:``}function Ln(){for(let e of Array.from(document.querySelectorAll(`[${en}]`)))e.removeAttribute(en)}function Rn(e,t,n){let r=Vn(e);ln!==r&&(ln=r,un=0),un+=1,n&&!t&&un<nn&&ir(1200)}function zn(){return!!(ln&&un>=nn)}function Bn(){ln=``,un=0,dn=``}function Vn(e){return[location.origin,location.pathname,new URLSearchParams(location.search).get(`token`)||``,e.id].join(`|`)}function Hn(e,t){return!e||!t?!1:e===t?!0:Un(e)===Un(t)}function Un(e){return e.toLowerCase().replace(/[^a-z0-9]/g,``)}function Wn(e){return typeof CSS<`u`&&typeof CSS.escape==`function`?CSS.escape(e):e.replace(/"/g,`\\"`)}function Gn(e,t,n){let r=G(t),i=n.map(G).filter(Boolean),a=Array.from(e.options).filter(e=>!e.disabled&&e.value),o=a.find(e=>G(e.value)===r)||a.find(e=>i.some(t=>G(`${e.text} ${e.value}`).includes(t)));return!o||e.value===o.value?!1:(e.value=o.value,qn(e),!0)}function Kn(e,t){e.focus();let n=e instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,r=Object.getOwnPropertyDescriptor(n,`value`);r?.set?r.set.call(e,t):e.value=t,qn(e)}function qn(e){e.dispatchEvent(new Event(`input`,{bubbles:!0})),e.dispatchEvent(new Event(`change`,{bubbles:!0})),e.dispatchEvent(new Event(`blur`,{bubbles:!0}))}function Jn(){cn?.disconnect(),cn=new MutationObserver(()=>{Yn(),!(dn&&ln===dn)&&(zn()||ir(350))}),cn.observe(document.documentElement,{childList:!0,subtree:!0})}function Yn(){if(!_r()||document.getElementById(tn))return;let e=$n(),t=Qn(),n=Xn();if(e?.parentElement){n.style.marginTop=`8px`,n.style.marginBottom=`12px`,e.parentElement.insertBefore(n,e.nextSibling);return}t?.parentElement&&t.parentElement.insertBefore(n,t)}function Xn(){let e=document.createElement(`div`);e.id=tn,e.setAttribute(`data-opx-paypal-random-fill`,`1`),Object.assign(e.style,{display:`flex`,alignItems:`center`,justifyContent:`flex-end`,gap:`8px`,margin:`10px 0 14px`,minHeight:`32px`});let t=document.createElement(`button`);t.type=`button`,t.textContent=`随机输入`,Object.assign(t.style,{appearance:`none`,border:`0`,borderRadius:`6px`,background:`#10b981`,color:`#ffffff`,cursor:`pointer`,fontSize:`13px`,fontWeight:`700`,lineHeight:`1`,minHeight:`32px`,padding:`0 14px`,whiteSpace:`nowrap`});let n=document.createElement(`span`);return Object.assign(n.style,{color:`#64748b`,fontSize:`12px`,lineHeight:`16px`,minWidth:`0`}),t.addEventListener(`click`,()=>{Zn(t,n)}),e.append(t,n),e}async function Zn(e,n){e.disabled=!0,e.textContent=`获取中...`,Object.assign(e.style,{cursor:`wait`,opacity:`0.72`}),n.textContent=`正在获取新资料`;try{let e=await I(),r=await t.runtime.sendMessage({type:`opx:fetch-random-address`,countryCode:e.countryCode,city:e.city});if(!wr(r)||!r.ok||!r.address){n.textContent=r?.message||`获取失败`;return}V=r.address,dr(r.address),await F({lastAddress:r.address});let i=await pn(r.address,!0,!1);n.textContent=i.countryChanged?`已切换国家，刷新后继续填写`:i.ok?`已随机输入 ${i.filled} 项`:i.message}catch(e){n.textContent=`失败：${Cr(e)}`}finally{e.disabled=!1,e.textContent=`随机输入`,Object.assign(e.style,{cursor:`pointer`,opacity:`1`})}}function Qn(){let e=On(K.cardNumber);return e?.closest(`div, label, section`)||e}function $n(){let e=document.querySelector(`div.css-ltr-cssveg > form > section.css-ltr-4jicje:nth-of-type(1) > p.css-ltr-6pd54h.css-ltr-16jt5za-text_body`);return e&&U(e)?e:Array.from(document.querySelectorAll(`form section p, form p`)).filter(e=>U(e)).map(e=>({element:e,score:nr(e)})).filter(e=>e.score>0).sort((e,t)=>t.score-e.score)[0]?.element||null}function er(){let e=document.querySelector(`section.css-ltr-h5yxuz:nth-of-type(3) > div.css-ltr-h5yxuz:nth-of-type(2) > div.css-ltr-1lvkl1r:nth-of-type(2) > p.css-ltr-abbmt5:nth-of-type(1)`);if(e&&U(e))return e;let t=document.querySelector(`input#password`)||On(K.password),n=t?.closest(`section`)||document;return Array.from(n.querySelectorAll(`p`)).filter(e=>U(e)).map(e=>({element:e,score:tr(e,t)})).filter(e=>e.score>0).sort((e,t)=>t.score-e.score)[0]?.element||null}function tr(e,t){let n=G(e.textContent||``);return!n||![`by creating an account`,`confirm you’re at least 18 years old`,`confirm you're at least 18 years old`,`agree to the`,`privacy statement`].some(e=>n.includes(G(e)))?0:t&&t.compareDocumentPosition(e)&Node.DOCUMENT_POSITION_FOLLOWING?20:10}function nr(e){let t=G(e.textContent||``);return t&&[`we don’t share your financial details with the merchant`,`we don't share your financial details with the merchant`,`financial details`,`merchant`].some(e=>t.includes(G(e)))?10:0}function rr(){t.storage.onChanged.addListener((e,t)=>{t===`local`&&Object.keys(e).some(e=>e.includes(`settings`))&&(V=null,Bn(),ir(100))})}function ir(e){ar(),sn=window.setTimeout(()=>{sn=null,mn()},e)}function ar(){sn&&=(window.clearTimeout(sn),null)}function or(e){window.setTimeout(()=>{let e=sr();if(!e){ur();return}pn(e,!0,!1)},e)}function sr(){try{let e=sessionStorage.getItem(Qt);return e?JSON.parse(e):null}catch{return null}}function cr(){try{sessionStorage.setItem($t,`1`)}catch{}}function lr(){try{let e=sessionStorage.getItem($t)===`1`;return e&&sessionStorage.removeItem($t),e}catch{return!1}}function ur(){try{sessionStorage.removeItem($t)}catch{}}function dr(e){try{sessionStorage.setItem(Qt,JSON.stringify(e))}catch{}}function fr(e,t){let n=t.countryCode===`RANDOM`||e.countryCode===t.countryCode,r=!t.city.trim()||G(e.city)===G(t.city);return n&&r}function pr(e){let t=e.match(/\d+/g)||[],n=(t[0]||``).padStart(2,`0`).slice(0,2),r=t[1]||``,i=r.length===2?`20${r}`:r.slice(0,4),a=i.slice(-2);return{month:n,year2:a,year4:i,short:n&&a?`${n}/${a}`:e}}function mr(e){let t=e.replace(/[^a-zA-Z]/g,``);if(t&&!e.includes(` `))return{first:t.slice(0,Math.max(1,Math.floor(t.length/2))),last:t.slice(Math.max(1,Math.floor(t.length/2)))||t};let n=e.split(/\s+/).map(e=>e.trim()).filter(Boolean);return{first:n[0]||t||`Alex`,last:n.slice(1).join(` `)||`Walker`}}function hr(e){return`${(e.identity.username||e.fullName||`outlookuser`).toLowerCase().replace(/[^a-z0-9]/g,``).slice(0,18)||`outlookuser`}${(e.id+e.fetchedAt).replace(/\D/g,``).slice(-6)||String(Date.now()).slice(-6)}@outlook.com`}function gr(e){let t=/[a-zA-Z]/.test(e),n=/\d/.test(e);if(t&&n&&e.length>=8)return e;let r=e.replace(/@.*$/,``).replace(/[^a-zA-Z0-9]/g,``)||`Paypal`;for(/[a-zA-Z]/.test(r)||(r=`Pp`+r),/\d/.test(r)||(r+=`2024`);r.length<8;)r+=`x1`;return r.charAt(0).toUpperCase()+r.slice(1)}function _r(){return location.hostname.endsWith(`paypal.com`)&&location.pathname.startsWith(`/checkoutweb/signup`)}function vr(){let e=Array.from(document.querySelectorAll(`button[type="submit"], button`));for(let t of e){if(!U(t)||t.disabled)continue;let e=G(t.textContent||``);if(e.includes(`agree and create account`)||e.includes(`同意并创建账户`)||e.includes(`同意并创建帐户`)||e.includes(`create account`)||e.includes(`创建账户`)||e.includes(`创建帐户`)){t.click(),console.info(`${Zt} 已点击创建帐户按钮`);return}}}function yr(e){return e instanceof HTMLSelectElement||e instanceof HTMLTextAreaElement?!1:[`hidden`,`radio`,`checkbox`,`submit`,`button`].includes((e.type||``).toLowerCase())}function br(e){let t=G([e.id,e.name,`placeholder`in e?e.placeholder:``,`autocomplete`in e?e.autocomplete:``,e.getAttribute(`aria-label`),Pn(e)].join(` `));return[`email`,`phone`,`mobile`,`card`,`credit`,`expiry`,`expiration`,`cvv`,`csc`,`security code`].some(e=>t.includes(e))}function U(e){let t=e;if(`disabled`in t&&t.disabled)return!1;let n=window.getComputedStyle(t),r=t.getBoundingClientRect();return n.visibility!==`hidden`&&n.display!==`none`&&r.width>0&&r.height>0}function W(e){return!!(e&&(e instanceof HTMLInputElement||e instanceof HTMLTextAreaElement))}function xr(e){return!!(e&&e instanceof HTMLSelectElement)}function Sr(e){return/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)}function G(e){return String(e||``).replace(/\s+/g,` `).trim().toLowerCase()}function Cr(e){return e instanceof Error?e.message:String(e)}function wr(e){return!!(e&&typeof e==`object`&&typeof e.ok==`boolean`&&typeof e.message==`string`)}var K={country:[`select#country`,`select[name="country"]`,`select[name="country.x"]`,`country`,`country or region`],email:[`input#email`,`input[name="email"]`,`input[type="email"]`,`input[autocomplete="email"]`,`email`],password:[`input#password`,`input[name="password"]`,`input[type="password"]`,`input[autocomplete="new-password"]`,`create password`,`password`],phone:[`input#phone`,`input#phoneNumber`,`input[name="phone"]`,`input[name="phoneNumber"]`,`input[type="tel"]`,`phone number`,`mobile`],cardNumber:[`input#cardNumber`,`input#card_number`,`input[name="cardNumber"]`,`input[name="card_number"]`,`input[autocomplete="cc-number"]`,`card number`,`credit card number`],expiry:[`input#expiryDate`,`input#expirationDate`,`input#cardExpiry`,`input[name="expiryDate"]`,`input[name="expirationDate"]`,`input[name="cardExpiry"]`,`input[autocomplete="cc-exp"]`,`expiration`,`expiry`,`有效期限`],expiryMonth:[`select#expMonth`,`select#expiryMonth`,`select[name="expMonth"]`,`select[name="expiryMonth"]`,`expiration month`,`expiry month`],expiryYear:[`select#expYear`,`select#expiryYear`,`select[name="expYear"]`,`select[name="expiryYear"]`,`expiration year`,`expiry year`],csc:[`input#cvv`,`input#csc`,`input#securityCode`,`input[name="cvv"]`,`input[name="csc"]`,`input[name="securityCode"]`,`input[autocomplete="cc-csc"]`,`csc`,`cvv`,`security code`],fullName:[`input#cardholderName`,`input#nameOnCard`,`input#fullName`,`input[name="cardholderName"]`,`input[name="nameOnCard"]`,`input[name="fullName"]`,`input[autocomplete="cc-name"]`,`name on card`,`full name`],firstName:[`input#firstName`,`input#billingFirstName`,`input[name="firstName"]`,`input[name="billingFirstName"]`,`input[autocomplete="given-name"]`,`first name`],lastName:[`input#lastName`,`input#billingLastName`,`input[name="lastName"]`,`input[name="billingLastName"]`,`input[autocomplete="family-name"]`,`last name`],address1:[`input#address1`,`input#addressLine1`,`input#billingAddressLine1`,`input#billingLine1`,`input[name="address1"]`,`input[name="addressLine1"]`,`input[name="billingLine1"]`,`input[autocomplete="address-line1"]`,`address line 1`,`street address`],address2:[`input#address2`,`input#addressLine2`,`input#billingAddressLine2`,`input#billingLine2`,`input[name="address2"]`,`input[name="addressLine2"]`,`input[name="billingLine2"]`,`input[autocomplete="address-line2"]`,`address line 2`],city:[`input#city`,`input#billingLocality`,`input#billingCity`,`input[name="city"]`,`input[name="billingCity"]`,`input[autocomplete="address-level2"]`,`city`],state:[`select#state`,`input#state`,`select#billingAdministrativeArea`,`input#billingAdministrativeArea`,`select#billingState`,`input#billingState`,`select[name="state"]`,`input[name="state"]`,`select[name="billingState"]`,`input[name="billingState"]`,`select[autocomplete="address-level1"]`,`input[autocomplete="address-level1"]`,`state`,`province`],postalCode:[`input#zip`,`input#postalCode`,`input#billingPostalCode`,`input#billingZip`,`input[name="zip"]`,`input[name="postalCode"]`,`input[name="billingPostalCode"]`,`input[name="billingZip"]`,`input[autocomplete="postal-code"]`,`zip code`,`postal code`]};function Tr(e){let n=document.createElement(`div`);n.className=`opx-summary`;let r=Dr(),i=document.createElement(`input`);i.className=`opx-input`,i.type=`text`,i.placeholder=`城市留空即随机，例如 Tokyo / Berlin / New York`,i.autocomplete=`off`;let a=document.createElement(`div`);a.className=`opx-grid`,a.append(Or(`地址国家`,r),Or(`指定城市`,i));let o=document.createElement(`div`);o.className=`opx-button-row opx-address-actions`;let s=kr(`获取地址`);o.append(s);let c=document.createElement(`div`);c.className=`opx-copy-list`;let l=document.createElement(`div`);l.className=`opx-status`,e.append(n,a,o,c,l),r.addEventListener(`change`,()=>void d(`国家已保存`)),i.addEventListener(`change`,()=>void d(`城市已保存`)),s.addEventListener(`click`,()=>void f());let u=async()=>{m(await I())};return u(),{update:u};async function d(e){let t=await I(),n=r.value,a=i.value.trim();m(await F({countryCode:n,city:a,lastAddress:t.countryCode!==n||t.city.trim()!==a?null:t.lastAddress})),jr(l,e,`ok`)}async function f(){s.disabled=!0,jr(l,`正在获取随机地址...`,`pending`);try{let e=await t.runtime.sendMessage({type:`opx:fetch-random-address`,countryCode:r.value,city:i.value.trim()});if(!Nr(e)||!e.ok||!e.address){jr(l,e?.message||`获取地址失败`,`error`);return}m(await F({countryCode:r.value,city:i.value.trim(),lastAddress:e.address}));let n=await p(e.address);jr(l,n?`${e.message}；${n}`:e.message,`ok`)}catch(e){jr(l,`获取地址失败：${Mr(e)}`,`error`)}finally{s.disabled=!1}}async function p(e){return location.hostname===`pay.openai.com`?(await wt(e)).message:location.hostname.endsWith(`paypal.com`)?(await pn(e,!0,!1)).message:``}function m(e){r.value=e.countryCode,i.value=e.city,h(e),g(e.lastAddress)}function h(e){n.textContent=`${r.selectedOptions[0]?.textContent||e.countryCode} · ${e.city||`随机城市`}`}function g(e){if(c.textContent=``,!e){c.append(Ar(`暂无地址，点击“获取地址”。`));return}for(let t of Er(e))c.append(v(t))}function _(e,t){let n=document.createElement(`button`);n.className=`opx-copy-row`,n.type=`button`,n.title=`点击复制`;let r=document.createElement(`span`);r.className=`opx-copy-label`,r.textContent=`${e}：`;let i=document.createElement(`strong`);i.textContent=t;let a=document.createElement(`span`);a.className=`opx-copy-feedback`,a.textContent=`已复制`,a.hidden=!0;let o=null;return n.append(r,i,a),n.addEventListener(`click`,async()=>{await navigator.clipboard.writeText(t),o&&window.clearTimeout(o),n.classList.add(`is-copied`),a.hidden=!1,o=window.setTimeout(()=>{n.classList.remove(`is-copied`),a.hidden=!0,o=null},1400)}),n}function v(e){let t=document.createElement(`div`);t.className=`opx-copy-section-body`;for(let n of e.items)n.value&&t.append(_(n.label,n.value));if(e.collapsed){let n=document.createElement(`details`);n.className=`opx-accordion-section`;let r=document.createElement(`summary`);return r.textContent=e.title,n.append(r,t),n}let n=document.createElement(`section`);n.className=`opx-copy-section`;let r=document.createElement(`div`);return r.className=`opx-copy-section-title`,r.textContent=e.title,n.append(r,t),n}}function Er(e){return[{title:`地址资料`,items:[{label:`国家`,value:`${e.countryLabel||e.countryCode} / ${e.countryCode}`},{label:`姓名`,value:e.fullName},{label:`电话`,value:e.phone},{label:`地址1`,value:e.line1},{label:`地址2`,value:e.line2},{label:`城市`,value:e.city},{label:`州/省`,value:e.stateFull?`${e.stateFull} / ${e.state}`:e.state},{label:`邮编`,value:e.postalCode}]},{title:`信用卡资料`,items:[{label:`卡类型`,value:e.creditCard.type},{label:`卡号`,value:e.creditCard.number},{label:`CVV`,value:e.creditCard.cvv},{label:`有效期`,value:e.creditCard.expires},{label:`后四位`,value:e.creditCard.last4}]},{title:`身份资料`,collapsed:!0,items:[{label:`性别`,value:e.identity.gender},{label:`称谓`,value:e.identity.title},{label:`生日`,value:e.identity.birthday},{label:`用户名`,value:e.identity.username},{label:`密码`,value:e.identity.password},{label:`临时邮箱`,value:e.identity.temporaryMail},{label:`系统`,value:e.identity.system},{label:`网站`,value:e.identity.website},{label:`安全问题`,value:e.identity.securityQuestion},{label:`安全答案`,value:e.identity.securityAnswer}]},{title:`就业资料`,collapsed:!0,items:[{label:`公司`,value:e.employment.companyName},{label:`职业`,value:e.employment.occupation},{label:`就业状态`,value:e.employment.employmentStatus},{label:`月薪`,value:e.employment.monthlySalary},{label:`公司规模`,value:e.employment.companySize},{label:`教育背景`,value:e.employment.educationalBackground}]}]}function Dr(){let e=document.createElement(`select`);e.className=`opx-select`;let t=document.createElement(`option`);t.value=`RANDOM`,t.textContent=`随机国家`,e.append(t);for(let t of gt){let n=document.createElement(`option`);n.value=t.code,n.textContent=`${t.label} / ${t.code}`,e.append(n)}return e}function Or(e,t){let n=document.createElement(`label`);n.className=`opx-field`;let r=document.createElement(`span`);return r.className=`opx-label`,r.textContent=e,n.append(r,t),n}function kr(e,t=`opx-button`){let n=document.createElement(`button`);return n.className=t,n.type=`button`,n.textContent=e,n}function Ar(e){let t=document.createElement(`div`);return t.className=`opx-empty-inline`,t.textContent=e,t}function jr(e,t,n){e.textContent=t,e.dataset.type=n}function Mr(e){return e instanceof Error?e.message:String(e)}function Nr(e){return!!(e&&typeof e==`object`&&typeof e.ok==`boolean`&&typeof e.message==`string`)}var Pr=`[OPX HostedFill]`,Fr=[`.AddressAutocomplete-results`,`[class*="AddressAutocomplete"]`,`#billing-address-autocomplete-results`,`.pac-container`],Ir=null;function Lr(){let e=String(location?.host||``).toLowerCase();return e.includes(`pay.openai.com`)||e.includes(`checkout.stripe.com`)}async function Rr(e){if(!Lr())return{ok:!1,filled:0,message:`当前不是 pay.openai.com / Stripe hosted 页面`,clicked:!1,verificationPopupVisible:!1};await ei(),Xr(),Yr(),$r(),await J(2e3);let t=Br();t?(Jr(t),await J(500),Jr(t),console.info(`${Pr} clicked PayPal twice`)):console.warn(`${Pr} PayPal accordion button not found`),await J(3e3);let n=0,r=Vr();r&&(qr(r,e.countryCode||`US`)&&(n+=1),await J(550)),Gr(`#billingAddressLine1`,e.line1)&&(n+=1),Yr(),await J(300),Gr(`#billingAddressLine2`,e.line2)&&(n+=1),Gr(`#billingLocality`,e.city)&&(n+=1),Gr(`#billingPostalCode`,e.postalCode)&&(n+=1),Kr(`billingAdministrativeArea`,e.stateFull||e.state)&&(n+=1),Gr(`#billingName`,e.fullName)&&(n+=1),Gr(`#phoneNumber`,e.phone)&&(n+=1);let i=document.getElementById(`termsOfServiceConsentCheckbox`);i&&!i.checked&&(Jr(i),n+=1),document.activeElement?.blur?.();for(let e=0;e<10;e+=1)Yr(),await J(300);await J(3500);let a=await Ur(0);return{ok:n>0||a.clicked,filled:n,clicked:a.clicked,verificationPopupVisible:a.verificationPopupVisible,message:a.clicked?`已填 ${n} 项并点击订阅`:n>0?`已填 ${n} 项,但订阅按钮未点击成功`:`未填到任何字段`}}function zr(){return!!document.getElementById(`ci-ciBasic-0`)}function Br(){return document.querySelector(`[data-testid="paypal-accordion-item-button"]`)||document.querySelector(`.paypal-accordion-item button`)||document.querySelector(`#payment-method-label-paypal`)||document.querySelector(`button[aria-label*="PayPal" i]`)}function Vr(){return document.querySelector(`#billingCountry`)||document.querySelector(`select[name="billingCountry"]`)||document.querySelector(`select[autocomplete="billing country"]`)}function Hr(){return document.querySelector(`button[data-testid="submit-button"]`)||document.querySelector(`button[data-testid="hosted-payment-submit-button"]`)||document.querySelector(`button[data-atomic-wait-intent="Submit_Email"]`)||document.querySelector(`button.SubmitButton--complete`)||Array.from(document.querySelectorAll(`button`)).find(e=>{let t=q(e.textContent||``);return t===`下一页`||t===`订阅`||t===`Subscribe`||t===`Next`||t===`Pay`||t===`Continue`||t===`Agree`||t.toLowerCase().includes(`subscribe`)||t.toLowerCase().includes(`start trial`)})||null}async function Ur(e){Qr()&&$r();let t=Hr();if(!t)return e>=10?{clicked:!1,verificationPopupVisible:!1,buttonText:``}:(await J(1e3),Ur(e+1));let n=q(t.textContent||``);if(t.disabled||t.getBoundingClientRect().height===0)return e>=10?{clicked:!1,verificationPopupVisible:!1,buttonText:n}:(await J(1e3),Ur(e+1));if(Zr(),Yr(),document.activeElement?.blur?.(),Jr(t),await J(1e3),Xr(),Yr(),Qr()&&$r(),zr())return{clicked:!0,verificationPopupVisible:!0,buttonText:n};let r=q(t.textContent||``);return!/processing/i.test(r)&&r===n?e>=10?{clicked:!0,verificationPopupVisible:!1,buttonText:n}:(await J(2e3),Ur(e+1)):{clicked:!0,verificationPopupVisible:!1,buttonText:n}}function Wr(e,t){let n=e instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,r=Object.getOwnPropertyDescriptor(n,`value`);r?.set?r.set.call(e,t):e.value=t,e.dispatchEvent(new Event(`input`,{bubbles:!0})),e.dispatchEvent(new Event(`change`,{bubbles:!0}))}function Gr(e,t){let n=String(t||``).trim();if(!n)return!1;let r=document.querySelector(e);return!r||r.value===n?!1:(Wr(r,n),!0)}function Kr(e,t){let n=document.getElementById(e),r=q(t);if(!n||!r)return!1;let i=Array.from(n.options||[]).find(e=>{let t=q(e?.textContent||e?.label||``),n=q(e?.value||``);return t.toLowerCase().includes(r.toLowerCase())||n.toLowerCase().includes(r.toLowerCase())});return!i||n.value===i.value?!1:(n.value=i.value,n.dispatchEvent(new Event(`change`,{bubbles:!0})),!0)}function qr(e,t){let n=String(t||``).trim().toUpperCase();if(!n)return!1;let r=Array.from(e.options).find(e=>e.value.toUpperCase()===n||q(e.textContent).toUpperCase()===n);return!r||e.value===r.value?!1:(e.value=r.value,e.dispatchEvent(new Event(`change`,{bubbles:!0})),!0)}function Jr(e){let t=e.getBoundingClientRect(),n={bubbles:!0,cancelable:!0,composed:!0,view:window,button:0,buttons:1,clientX:t.left+t.width/2,clientY:t.top+t.height/2,pointerId:1,pointerType:`mouse`};try{e.dispatchEvent(new PointerEvent(`pointerdown`,n))}catch{}e.dispatchEvent(new MouseEvent(`mousedown`,n));try{e.dispatchEvent(new PointerEvent(`pointerup`,{...n,buttons:0}))}catch{}e.dispatchEvent(new MouseEvent(`mouseup`,{...n,buttons:0})),e.dispatchEvent(new MouseEvent(`click`,n))}function Yr(){document.querySelectorAll(Fr.join(`, `)).forEach(e=>{try{e.style.setProperty(`display`,`none`,`important`),e.style.setProperty(`visibility`,`hidden`,`important`),e.style.setProperty(`pointer-events`,`none`,`important`),e.style.setProperty(`height`,`0`,`important`),e.style.setProperty(`overflow`,`hidden`,`important`)}catch{}})}function Xr(){Ir||!Lr()||(Ir=new MutationObserver(()=>Yr()),Ir.observe(document.documentElement||document.body,{childList:!0,subtree:!0}))}function Zr(){Ir&&=(Ir.disconnect(),null)}function Qr(){return!!(document.querySelector(`iframe[name="recaptcha"]`)||document.getElementById(`captchaHeading`)||document.querySelector(`#captcha-standalone`)||document.querySelector(`form[action="/auth/validatecaptcha"]`))}function $r(){[`#captcha-standalone`,`.captcha-overlay`,`.captcha-container`].forEach(e=>{document.querySelectorAll(e).forEach(e=>{try{e.remove()}catch{}})})}async function ei(){let e=Date.now();for(;document.readyState!==`complete`&&!(Date.now()-e>15e3);)await J(200);await J(1e3)}function q(e){return String(e||``).replace(/\s+/g,` `).trim()}function J(e){return new Promise(t=>window.setTimeout(t,e))}var ti=`[OPX PayPalLogin]`;function ni(){let e=oi(),t=si(),n=di(),r=mi(e,t);return{url:location.href,needsLogin:!!r,loginPhase:r,hasEmailInput:!!e,hasPasswordInput:!!t,approveReady:!!(n&&Si(n)),approveButtonText:n?Ci(n):``,hasPasskeyPrompt:pi()}}async function ri(e){await Ei();let t=wi(e.email),n=String(e.password||``);if(!n)return{submitted:!1,phase:`noop`,error:`PayPal 密码为空`};let r=si(),i=oi(),a=ci();if(i&&a&&Si(a)&&(!r||!ui()))return _i(i,t),yi(a),console.info(`${ti} email submitted (two-step)`),{submitted:!1,phase:`email_submitted`,awaiting:`password_page`};if(!r&&i&&t){_i(i,t);let e=await Ti(()=>{let e=ci()||li();return e&&Si(e)?e:null},8e3);return e?(yi(e),console.info(`${ti} email submitted (no password yet)`),{submitted:!1,phase:`email_submitted`,awaiting:`password_page`}):{submitted:!1,phase:`noop`,error:`PayPal 邮箱页找不到 Next 按钮`}}if(!r&&i&&!t)return{submitted:!1,phase:`noop`,error:`PayPal 账号为空`};if(i&&t&&_i(i,t),r||=await Ti(()=>si(),8e3),!r)return{submitted:!1,phase:`noop`,error:`PayPal 密码框未出现`};vi(r,n),await Di(1e3);let o=await Ti(()=>{let e=gi([/login|sign\s*in|log\s*in|continue/i,/登录|登入|继续/i]);return e&&Si(e)?e:null},8e3);return o?(yi(o),console.info(`${ti} password submitted`),{submitted:!0,phase:`password_submitted`,awaiting:`redirect_or_approval`}):{submitted:!1,phase:`noop`,error:`PayPal 密码页找不到登录按钮`}}async function ii(){await Ei();let e=fi(),t=0;for(let n of e)!xi(n)||!Si(n)||(yi(n),t+=1,await Di(500));return t>0&&console.info(`${ti} dismissed ${t} prompts`),{clicked:t}}async function ai(){await Ei(),await ii().catch(()=>({clicked:0}));let e=di();return!e||!Si(e)?{clicked:!1,buttonText:e?Ci(e):``}:(yi(e),console.info(`${ti} clicked approve`),{clicked:!0,buttonText:Ci(e)})}function oi(){return document.querySelector(`input#email`)||document.querySelector(`input[name="login_email"]`)||document.querySelector(`input[name="email"]`)||document.querySelector(`input[type="email"]`)||hi([/login_?email/i,/email|邮箱|账户/i])}function si(){return document.querySelector(`input#password`)||document.querySelector(`input[name="login_password"]`)||document.querySelector(`input[name="password"]`)||document.querySelector(`input[type="password"]`)||hi([/login_?password/i,/password|密码/i])}function ci(){return document.querySelector(`#btnNext`)||document.querySelector(`button[name="btnNext"]`)||gi([/^\s*(next|continue|下一步|继续)\s*$/i])}function li(){return document.querySelector(`#btnLogin`)||document.querySelector(`button[name="btnLogin"]`)||gi([/^\s*(log\s*in|sign\s*in|login|登录|登入)\s*$/i])}function ui(){return document.querySelector(`#btnLogin`)||document.querySelector(`button[name="btnLogin"]`)||gi([/login|sign\s*in|log\s*in|continue/i,/登录|登入|继续/i])}function di(){return document.querySelector(`#consentButton`)||document.querySelector(`#payment-submit-btn`)||document.querySelector(`button[name="ConfirmButtons"]`)||gi([/^\s*(agree\s*(and|&)\s*continue|continue|pay\s*now|complete\s*purchase|confirm)\s*$/i,/^\s*(同意并继续|同意.{0,4}继续|继续|确认|立即付款)\s*$/])}function fi(){let e=wi(document.body?.innerText||``);return/passkey|通行密钥|安全密钥|下次登录|faster|save\s*your\s*info/i.test(e)?bi(`button, a, [role="button"]`).filter(e=>{let t=Ci(e),n=e.getAttribute?.(`aria-label`)||``;return/取消|稍后|不保存|不用|关闭|cancel|not now|maybe later|skip|close|^x$|^×$/i.test(t)||/close|关闭/i.test(n)}):[]}function pi(){return fi().length>0}function mi(e,t){let n=ci(),r=ui();return e&&n&&Si(n)&&(!t||!r)?`email`:e&&t?`login_combined`:t?`password`:e?`email`:``}function hi(e){return Array.from(document.querySelectorAll(`input`)).find(t=>{if(!xi(t))return!1;let n=[t.id,t.name,t.placeholder,t.getAttribute(`aria-label`),t.autocomplete].filter(Boolean).join(` `);return e.some(e=>e.test(n))})||null}function gi(e){return bi(`button, a, [role="button"], input[type="submit"]`).find(t=>{let n=Ci(t);return e.some(e=>e.test(n))})||null}function _i(e,t){try{e.focus()}catch{}vi(e,``),vi(e,t),console.info(`${ti} 已填写输入框 [login_email]`);try{e.blur()}catch{}}function vi(e,t){let n=e instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,r=Object.getOwnPropertyDescriptor(n,`value`);r?.set?r.set.call(e,t):e.value=t,e.dispatchEvent(new Event(`input`,{bubbles:!0})),e.dispatchEvent(new Event(`change`,{bubbles:!0}))}function yi(e){try{e.scrollIntoView({block:`center`,inline:`center`})}catch{}let t=e.getBoundingClientRect(),n={bubbles:!0,cancelable:!0,composed:!0,view:window,button:0,buttons:1,clientX:t.left+t.width/2,clientY:t.top+t.height/2,pointerId:1,pointerType:`mouse`};try{e.dispatchEvent(new PointerEvent(`pointerdown`,n))}catch{}e.dispatchEvent(new MouseEvent(`mousedown`,n));try{e.dispatchEvent(new PointerEvent(`pointerup`,{...n,buttons:0}))}catch{}e.dispatchEvent(new MouseEvent(`mouseup`,{...n,buttons:0})),e.dispatchEvent(new MouseEvent(`click`,n));try{e.click?.()}catch{}}function bi(e){return Array.from(document.querySelectorAll(e)).filter(xi)}function xi(e){if(!e)return!1;let t=e;if(`disabled`in t&&t.disabled)return!1;let n=window.getComputedStyle(t);if(n.visibility===`hidden`||n.display===`none`||n.opacity===`0`)return!1;let r=t.getBoundingClientRect();return r.width>0&&r.height>0}function Si(e){if(!e)return!1;let t=e;return!(`disabled`in t&&t.disabled||e.getAttribute(`aria-disabled`)===`true`)}function Ci(e){return wi(e.textContent||e.getAttribute(`aria-label`)||e.getAttribute(`value`)||``)}function wi(e){return String(e||``).replace(/\s+/g,` `).trim()}async function Ti(e,t){let n=Date.now();for(;Date.now()-n<t;){let t=e();if(t)return t;await Di(250)}return null}async function Ei(){let e=Date.now();for(;document.readyState!==`complete`&&!(Date.now()-e>15e3);)await Di(200)}function Di(e){return new Promise(t=>window.setTimeout(t,e))}var Oi=8,ki=4,Ai=new Set([`data`,`message`,`msg`,`content`,`text`,`body`,`sms`,`otp`,`code`,`verifycode`,`verificationcode`,`captcha`,`result`,`value`]),ji=new Set([`status`,`statuscode`,`httpstatus`,`ret`,`errno`,`errorcode`]),Mi=/^(no\s*message|no\s*sms|empty|none|null|暂无|没有|未收到)$/i,Ni=/^(ok|success|successful|true|请求成功|成功)$/i;function Pi(e){let t=[],n=[],r=new Set;return e.split(/\r?\n/).map(e=>e.trim()).filter(Boolean).forEach((e,i)=>{let a=e.indexOf(`----`);if(a<0){n.push(`第 ${i+1} 行缺少 ---- 分隔符`);return}let o=e.slice(0,a).trim(),s=e.slice(a+4).trim();if(!o||!s){n.push(`第 ${i+1} 行号码或 API 链接为空`);return}if(!qi(s)){n.push(`第 ${i+1} 行 API 链接不是 http/https 地址`);return}let c=`${o}\n${s}`;r.has(c)||(r.add(c),t.push({id:Ji(o,s),phone:o,url:s}))}),{targets:t,errors:n}}function Fi(e){let t=e.trim();return!t||Mi.test(t)?``:t.match(RegExp(`\\b\\d{${ki},${Oi}}\\b`,`g`))?.[0]||``}function Ii(e){let t=Li(e),n=t.map(e=>({...e,code:Fi(e.text)})).filter(e=>e.text&&!Bi(e.text)&&!Vi(e.text)).sort((e,t)=>Ri(t)-Ri(e))[0];return n?.code?{code:n.code,message:n.text}:{code:``,message:t.map(e=>e.text).find(e=>e&&!Bi(e)&&!Vi(e))||``}}function Li(e){let t=[],n=new WeakSet;return r(e,``,0),t;function r(e,t,o){if(!(e==null||o>6)){if(typeof e==`string`){i(e,t,o),a(e,t,o);return}if(typeof e==`number`){Gi(t)&&i(String(e),t,o);return}if(typeof e==`object`&&!n.has(e)){if(n.add(e),Array.isArray(e)){e.forEach((e,n)=>r(e,t||String(n),o+1));return}for(let[t,n]of Object.entries(e))Wi(t)||r(n,t,o+1)}}}function i(e,n,r){let i=e.trim();!i||i.length>600||Wi(n)||t.push({text:i,key:n,depth:r,fromPreferredField:Ui(n)})}function a(e,t,n){let i=e.trim();if(!(!i||!/^[{[]/.test(i)))try{r(JSON.parse(i),t,n+1)}catch{}}}function Ri(e){let t=0;return e.code&&(t+=100),e.fromPreferredField&&(t+=30),zi(e.text)&&(t+=20),Gi(e.key)&&(t+=10),Hi(e.text)&&(t-=8),t-=e.depth,t}function zi(e){return/code|验证码|驗證碼|verify|verification|security|otp|paypal|openai|chatgpt/i.test(e)}function Bi(e){return Mi.test(e.trim())}function Vi(e){return Ni.test(e.trim())}function Hi(e){return/^[{[]/.test(e.trim())}function Ui(e){return Ai.has(Ki(e))}function Wi(e){return ji.has(Ki(e))}function Gi(e){let t=Ki(e);return t===`otp`||t===`smscode`||t===`verifycode`||t===`verificationcode`||t===`captcha`}function Ki(e){return e.toLowerCase().replace(/[^a-z0-9]/g,``)}function qi(e){try{let t=new URL(e);return t.protocol===`http:`||t.protocol===`https:`}catch{return!1}}function Ji(e,t){return`${e}|${t}`}async function Yi(e){let n;try{n=await t.runtime.sendMessage({type:`opx:fetch-sms-relay`,url:e.url})}catch(t){return{kind:`error`,target:e,message:`请求失败：${Zi(t)}`}}if(!Xi(n)||!n.ok)return{kind:`error`,target:e,message:n?.message||`API 返回结果无效`};let r=Ii({raw:n.raw,data:n.data,text:n.text,message:n.message}),i=r.message,a=r.code;return a?{kind:`code`,target:e,code:a,message:i}:{kind:`empty`,target:e,message:i||n.data||n.message||`暂无短信`}}function Xi(e){return!!(e&&typeof e==`object`&&typeof e.ok==`boolean`&&typeof e.message==`string`)}function Zi(e){return e instanceof Error?e.message:String(e)}var Qi=`opx.orchestrator.state`,$i=`[OPX Auto]`,ea=2e3,ta=5e3,na=18e4,ra=!1,ia=null,aa=[],oa={enabled:!1,currentStep:`idle`,statusMessage:`等待开始`,startedAt:0,completedSteps:[],lastError:``,generatedLink:``,updatedAt:0};function sa(e){return aa.push(e),()=>{aa=aa.filter(t=>t!==e)}}async function ca(){return Sa((await t.storage.local.get(Qi))[Qi])}async function Y(e){let n=Sa({...await ca(),...e,updatedAt:Date.now()});return await t.storage.local.set({[Qi]:n}),xa(n),n}async function la(){if(!(await Le()).rawInput.trim()){await Y({enabled:!1,currentStep:`error`,lastError:`请先在注册 tab 输入 Outlook 账号行`,statusMessage:`请先输入账号`});return}await Y({enabled:!0,currentStep:`idle`,statusMessage:`自动化已启动，正在检测页面...`,startedAt:Date.now(),completedSteps:[],lastError:``,generatedLink:``}),da()}async function ua(){pa(),await Y({enabled:!1,currentStep:`idle`,statusMessage:`已停止`})}function da(){ia||(ia=window.setInterval(()=>void ma(),ea),ma())}async function fa(){let e=await ca();e.enabled&&e.currentStep!==`done`&&e.currentStep!==`error`&&da()}function pa(){ia&&=(window.clearInterval(ia),null)}async function ma(){if(!ra){ra=!0;try{let e=await ca();if(!e.enabled){pa();return}await ha(e)}catch(e){console.warn(`${$i} tick error`,e),await Y({currentStep:`error`,lastError:wa(e),statusMessage:`出错：${wa(e)}`})}finally{ra=!1}}}async function ha(e){let n=location.hostname,r=location.href;if(i()){if(e.completedSteps.includes(`fill-email`)){await X(`wait-otp`,`已填过邮箱，等待跳转到验证码页...`);return}await X(`fill-email`,`检测到登录页，正在填入邮箱...`);let t=await Ze().fillEmailFromInput();t.ok?await Z(`fill-email`,`邮箱已填入，等待验证码页...`):await X(`error`,t.message,t.message);return}if(h()){if(e.completedSteps.includes(`wait-otp`)){let e=await t.runtime.sendMessage({type:`opx:fetch-chatgpt-session`});if(e?.ok&&e.session?.accessToken){await Z(`fill-profile`,`老号已登录，跳过资料填写`),await Z(`fetch-session`,`Session 已读取：${e.session.email}`),await ga(e.session.accessToken);return}await X(`fill-profile`,`验证码已处理，等待资料页或登录跳转...`);return}await X(`wait-otp`,`检测到验证码页，正在等待 Outlook 验证码...`);let n=await Ze().waitForOutlookOtp();n.ok?await Z(`wait-otp`,`验证码已填入：${n.code||``}`):await X(`error`,n.message,n.message);return}if(E()){if(e.completedSteps.includes(`fill-profile`)){await X(`fetch-session`,`资料已填，等待跳转到 chatgpt.com...`);return}await X(`fill-profile`,`检测到资料页，正在填写...`);let t=await Ze().fillProfileAndCreate();t.ok?await Z(`fill-profile`,`资料已填写并提交`):await X(`error`,t.message,t.message);return}if(n===`chatgpt.com`&&!r.includes(`/auth`)&&!i()){if(e.completedSteps.includes(`generate-link`)&&e.generatedLink){await X(`open-checkout`,`正在打开支付链接...`),window.location.href=e.generatedLink;return}e.completedSteps.includes(`fill-profile`)||await Z(`fill-profile`,`已登录，跳过资料填写`),await X(`fetch-session`,`正在读取 ChatGPT session...`);let n=await t.runtime.sendMessage({type:`opx:fetch-chatgpt-session`});if(!n?.ok||!n.session?.accessToken){await X(`fetch-session`,n?.message||`等待登录完成...`);return}e.completedSteps.includes(`fetch-session`)||await Z(`fetch-session`,`Session 已读取：${n.session.email}`),await ga(n.session.accessToken);return}if(n===`pay.openai.com`){if(e.completedSteps.includes(`open-checkout`)||await Z(`open-checkout`,`已到达支付页`),e.completedSteps.includes(`wait-payment-page`)){await X(`wait-payment-page`,`支付页已填写，等待跳转 PayPal...`);return}await X(`wait-payment-page`,`支付页已到达，正在选择 PayPal 并填写地址...`);let n=await t.runtime.sendMessage({type:`opx:fetch-random-address`,countryCode:`US`,city:``});if(!n?.ok||!n?.address){await X(`wait-payment-page`,`获取地址失败，等待手动操作...`);return}let r=await Rr(n.address);if(r.ok)await Z(`wait-payment-page`,`支付页已填写 ${r.filled} 项并点击订阅，等待跳转 PayPal...`);else{let e=n.address;(await wt(e)).ok?await Z(`wait-payment-page`,`支付页已填写(回退方式)，等待跳转 PayPal...`):await X(`wait-payment-page`,r.message||`填写未完成，等待手动操作...`)}return}if(n===`www.paypal.com`||n===`paypal.com`){if(e.completedSteps.includes(`wait-payment-page`)||await Z(`wait-payment-page`,`已跳转 PayPal`),e.completedSteps.includes(`paypal-login`)){await X(`wait-paypal-return`,`PayPal 授权完成，等待回跳到 ChatGPT/OpenAI...`);return}await X(`paypal-login`,`PayPal 页面检测中...`);let t=ni();if(t.needsLogin){let e=await ct();if(!e.email||!e.password){await X(`paypal-login`,`PayPal 需要登录但未配置账号，请在设置中填写 PayPal 邮箱和密码`);return}await X(`paypal-login`,`正在填写 PayPal 登录信息...`);let t=await ri({email:e.email,password:e.password});if(t.error){await X(`error`,`PayPal 登录失败：${t.error}`,t.error);return}t.phase===`email_submitted`?await X(`paypal-login`,`PayPal 邮箱已提交，等待密码页...`):t.phase===`password_submitted`&&await X(`paypal-login`,`PayPal 密码已提交，等待授权页...`);return}if(t.hasPasskeyPrompt){await X(`paypal-login`,`检测到 Passkey 弹窗，正在关闭...`),await ii();return}if(t.approveReady){await X(`paypal-login`,`正在点击 PayPal"同意并继续"...`),(await ai()).clicked?await Z(`paypal-login`,`PayPal 授权已完成，等待回跳...`):await X(`paypal-login`,`授权按钮点击未成功，继续等待...`);return}if(_a()){await X(`wait-paypal-sms`,`检测到 PayPal 短信验证页，正在接码...`);let e=await va();e.ok?await Z(`wait-paypal-sms`,`短信验证码已填入：${e.code}`):await X(`wait-paypal-sms`,e.message);return}await X(`paypal-login`,`PayPal 页面等待中...`);return}if((n===`chatgpt.com`||n.endsWith(`.openai.com`))&&e.completedSteps.includes(`paypal-login`)&&!e.completedSteps.includes(`wait-paypal-return`)){await Z(`wait-paypal-return`,`已从 PayPal 回跳到 ChatGPT/OpenAI`),await X(`done`,`全流程完成！`),await Y({enabled:!1}),pa();return}if(n===`auth.openai.com`){if(e.completedSteps.includes(`wait-otp`)&&!e.completedSteps.includes(`fill-profile`)){if(E()){await X(`fill-profile`,`检测到资料页，正在填写...`);let e=await Ze().fillProfileAndCreate();e.ok?await Z(`fill-profile`,`资料已填写并提交`):await X(`error`,e.message,e.message);return}let e=await t.runtime.sendMessage({type:`opx:fetch-chatgpt-session`});if(e?.ok&&e.session?.accessToken){await Z(`fill-profile`,`已注册账号，跳过资料填写`),await Z(`fetch-session`,`Session 已读取：${e.session.email}`),await ga(e.session.accessToken);return}await X(`fill-profile`,`验证完成，等待页面跳转到资料页...`);return}if(e.completedSteps.includes(`fill-profile`)&&!e.completedSteps.includes(`fetch-session`)){await X(`fetch-session`,`资料已提交，正在读取 session...`);let e=await t.runtime.sendMessage({type:`opx:fetch-chatgpt-session`});if(e?.ok&&e.session?.accessToken){await Z(`fetch-session`,`Session 已读取：${e.session.email}`),await ga(e.session.accessToken);return}await X(`fetch-session`,`Session 还未生成，继续等待...`);return}if(e.completedSteps.includes(`fetch-session`)&&!e.completedSteps.includes(`generate-link`)){let e=(await t.runtime.sendMessage({type:`opx:fetch-chatgpt-session`}))?.session?.accessToken||``;if(e){await ga(e);return}await X(`generate-link`,`等待 session...`);return}await X(e.currentStep,`在 auth.openai.com 中间页，等待跳转...`);return}}async function ga(e){await X(`generate-link`,`正在生成 Plus 订阅链接...`);let n=await ze(),r=await t.runtime.sendMessage({type:`opx:create-checkout-link`,raw:e,options:n.checkoutOptions}),i=r?.link||r?.url||``;if(!r?.ok||!i){await X(`error`,r?.message||`生成链接失败`,r?.message||``);return}await Y({generatedLink:i}),await Z(`generate-link`,`链接已生成`),await X(`open-checkout`,`正在跳转到支付页...`),window.location.href=i}async function X(e,t,n){let r={currentStep:e,statusMessage:t};n&&(r.lastError=n),await Y(r),console.info(`${$i} [${e}] ${t}`)}async function Z(e,t){let n=[...(await ca()).completedSteps];n.includes(e)||n.push(e),await Y({completedSteps:n,statusMessage:t}),console.info(`${$i} [DONE] ${e}: ${t}`)}function _a(){if(document.querySelector(`input[name="otpCode"], input[data-testid="otpCode"], input[aria-label*="验证码"], input[aria-label*="code" i], input[placeholder*="code" i]`)||document.querySelector(`input[name="ciBasic-0"], input[id="ci-ciBasic-0"], input[name^="ciBasic-"]`))return!0;let e=(document.body?.textContent||``).toLowerCase();return e.includes(`enter the code`)||e.includes(`verification code`)||e.includes(`输入验证码`)||e.includes(`confirm your number`)}async function va(){let e=ba((await Ve()).rawInput);if(!e.length)return{ok:!1,code:``,message:`没有配置接码 API 链接，请在接码 tab 输入`};let t=e[0],n=Date.now()+na;for(;Date.now()<n;){let e=await Yi(t);if(e.kind===`code`&&e.code)return ya(e.code),{ok:!0,code:e.code,message:`已收到验证码：${e.code}`};await Ta(ta)}return{ok:!1,code:``,message:`等待短信验证码超时`}}function ya(e){let t=document.querySelectorAll(`input[name^="ciBasic-"]`);if(t.length>0&&e.length>=t.length){let n=Array.from(t).sort((e,t)=>(parseInt(e.name.replace(`ciBasic-`,``),10)||0)-(parseInt(t.name.replace(`ciBasic-`,``),10)||0));for(let t=0;t<n.length;t++){let r=n[t],i=e[t]||``,a=HTMLInputElement.prototype,o=Object.getOwnPropertyDescriptor(a,`value`);o?.set?o.set.call(r,i):r.value=i,r.dispatchEvent(new Event(`input`,{bubbles:!0})),r.dispatchEvent(new Event(`change`,{bubbles:!0}))}setTimeout(()=>{let e=document.querySelector(`button[type="submit"], button[data-testid="submit"], button.primary`);e&&!e.disabled&&e.click()},500);return}let n=document.querySelectorAll(`input[id^="ci-ciBasic-"]`);if(n.length>0&&e.length>=n.length){let t=Array.from(n).sort((e,t)=>(parseInt(e.id.replace(`ci-ciBasic-`,``),10)||0)-(parseInt(t.id.replace(`ci-ciBasic-`,``),10)||0));for(let n=0;n<t.length;n++){let r=t[n],i=e[n]||``,a=HTMLInputElement.prototype,o=Object.getOwnPropertyDescriptor(a,`value`);o?.set?o.set.call(r,i):r.value=i,r.dispatchEvent(new Event(`input`,{bubbles:!0})),r.dispatchEvent(new Event(`change`,{bubbles:!0}))}setTimeout(()=>{let e=document.querySelector(`button[type="submit"], button[data-testid="submit"], button.primary`);e&&!e.disabled&&e.click()},500);return}let r=document.querySelector(`input[name="otpCode"], input[data-testid="otpCode"], input[aria-label*="验证码"], input[aria-label*="code" i], input[placeholder*="code" i]`);if(!r)return;let i=HTMLInputElement.prototype,a=Object.getOwnPropertyDescriptor(i,`value`);a?.set?a.set.call(r,e):r.value=e,r.dispatchEvent(new Event(`input`,{bubbles:!0})),r.dispatchEvent(new Event(`change`,{bubbles:!0})),setTimeout(()=>{let e=document.querySelector(`button[type="submit"], button[data-testid="submit"], button.primary`);e&&!e.disabled&&e.click()},500)}function ba(e){let t=e.split(`
`).map(e=>e.trim()).filter(Boolean),n=[];for(let e of t){let t=e.split(/[\s|]+/),r=t.find(e=>e.startsWith(`http`)),i=t.find(e=>/^\+?\d{7,}$/.test(e))||``;r&&n.push({id:`${i||`auto`}-${Date.now()}`,phone:i,url:r})}return n}function xa(e){for(let t of aa)try{t(e)}catch{}}function Sa(e){if(!e||typeof e!=`object`)return{...oa};let t=e;return{enabled:!!t.enabled,currentStep:Ca(t.currentStep)?t.currentStep:`idle`,statusMessage:String(t.statusMessage||oa.statusMessage),startedAt:Number(t.startedAt||0),completedSteps:Array.isArray(t.completedSteps)?t.completedSteps.filter(Ca):[],lastError:String(t.lastError||``),generatedLink:String(t.generatedLink||``),updatedAt:Number(t.updatedAt||0)}}function Ca(e){return typeof e==`string`&&[`idle`,`fill-email`,`wait-otp`,`fill-profile`,`fetch-session`,`generate-link`,`open-checkout`,`wait-payment-page`,`paypal-login`,`wait-paypal-return`,`wait-paypal-sms`,`done`,`error`].includes(e)}function wa(e){return e instanceof Error?e.message:String(e)}function Ta(e){return new Promise(t=>setTimeout(t,e))}var Ea={idle:`等待开始`,"fill-email":`填入邮箱`,"wait-otp":`等待验证码`,"fill-profile":`填写资料`,"fetch-session":`读取 Session`,"generate-link":`生成订阅链接`,"open-checkout":`打开支付页`,"wait-payment-page":`等待支付页填写`,"paypal-login":`PayPal 登录授权`,"wait-paypal-return":`等待回跳确认`,"wait-paypal-sms":`等待 PayPal 短信验证`,done:`全流程完成`,error:`出错`};function Da(e){let t=document.createElement(`div`);t.className=`opx-auto-panel`;let n=document.createElement(`div`);n.className=`opx-hint`,n.textContent=`一键自动化：输入 Outlook 账号后点击开始，全流程自动执行。`;let r=document.createElement(`div`);r.className=`opx-button-row`,r.style.marginTop=`12px`;let i=document.createElement(`button`);i.className=`opx-button`,i.type=`button`,i.textContent=`一键开始`;let a=document.createElement(`button`);a.className=`opx-button opx-button-secondary`,a.type=`button`,a.textContent=`停止`,a.disabled=!0;let o=document.createElement(`button`);o.className=`opx-button opx-button-secondary`,o.type=`button`,o.textContent=`重置`,r.append(i,a,o);let s=document.createElement(`div`);s.className=`opx-status`,s.style.marginTop=`12px`,s.textContent=`等待开始`;let c=document.createElement(`div`);c.className=`opx-steps-list`,c.style.marginTop=`12px`;let l=[`fill-email`,`wait-otp`,`fill-profile`,`fetch-session`,`generate-link`,`open-checkout`,`wait-payment-page`,`paypal-login`,`wait-paypal-return`,`wait-paypal-sms`],u={};for(let e of l){let t=document.createElement(`div`);t.style.cssText=`display:flex;align-items:center;gap:6px;padding:3px 0;font-size:12px;color:#94a3b8;`;let n=document.createElement(`span`);n.style.cssText=`width:16px;text-align:center;`,n.textContent=`○`;let r=document.createElement(`span`);r.textContent=Ea[e],t.append(n,r),c.append(t),u[e]=t}let d=document.createElement(`div`);d.className=`opx-hint`,d.style.marginTop=`8px`,d.style.wordBreak=`break-all`,t.append(n,r,s,c,d),e.append(t),i.addEventListener(`click`,async()=>{i.disabled=!0,a.disabled=!1,await la()}),a.addEventListener(`click`,async()=>{a.disabled=!0,i.disabled=!1,await ua()}),o.addEventListener(`click`,async()=>{await ua(),i.disabled=!1,a.disabled=!0,f({...Oa})}),sa(e=>{f(e)});function f(e){i.disabled=e.enabled,a.disabled=!e.enabled,s.textContent=e.statusMessage,s.dataset.type=e.currentStep===`error`?`error`:e.currentStep===`done`?`ok`:`pending`;for(let t of l){let n=u[t],r=n?.firstElementChild;!n||!r||(e.completedSteps.includes(t)?(r.textContent=`✔`,n.style.color=`#10b981`):e.currentStep===t?(r.textContent=`●`,n.style.color=`#f59e0b`):(r.textContent=`○`,n.style.color=`#94a3b8`))}e.generatedLink?d.textContent=`订阅链接：${e.generatedLink}`:d.textContent=``}let p=async()=>{f(await ca())};return p(),{update:p}}var Oa={enabled:!1,currentStep:`idle`,statusMessage:`等待开始`,startedAt:0,completedSteps:[],lastError:``,generatedLink:``,updatedAt:0},ka=[[`ID`,`印尼 / IDR`],[`DE`,`德国 / EUR`],[`JP`,`日本 / JPY`],[`US`,`美国 / USD`]];function Aa(e){let n=document.createElement(`div`);n.className=`opx-summary`;let r=document.createElement(`div`);r.className=`opx-session-card`;let i=ja(`邮箱`,`未读取`),a=ja(`套餐`,`未读取`),o=ja(`Token`,`未读取`);r.append(i.row,a.row,o.row);let s=Ma(`读取 ChatGPT session`,`opx-button opx-button-secondary`),c=Pa([[`chatgptplusplan`,`ChatGPT Plus`],[`chatgptteamplan`,`ChatGPT Team`]]),l=Pa([[`custom`,`短链接 / custom`],[`hosted`,`长链接 / hosted`]]),u=Pa(ka),d=Na(`Workspace 名称`,`text`),f=Na(`席位数量`,`number`);f.min=`2`,f.step=`1`;let p=document.createElement(`div`);p.className=`opx-grid`;let m=Fa(`套餐类型`,c),h=Fa(`链接形式`,l),g=Fa(`计费区域`,u);p.append(m,h,g);let _=document.createElement(`div`);_.className=`opx-team-options`;let v=document.createElement(`div`);v.className=`opx-grid`,v.append(Fa(`Workspace`,d),Fa(`席位`,f)),_.append(v);let y=document.createElement(`textarea`);y.className=`opx-textarea opx-token-textarea`,y.placeholder=`自动读取或手动粘贴 ChatGPT session JSON / Access Token`,y.autocomplete=`off`,y.spellcheck=!1;let b=document.createElement(`div`);b.className=`opx-hint`,b.textContent=`切到提链接 tab 会读取 /api/auth/session；token 只在当前页面内使用。`;let x=Ma(`生成订阅链接`),S=document.createElement(`textarea`);S.className=`opx-textarea opx-output`,S.placeholder=`生成后的订阅链接`,S.readOnly=!0,S.spellcheck=!1;let C=document.createElement(`div`);C.className=`opx-button-row`;let w=Ma(`复制链接`,`opx-button opx-button-secondary`),T=Ma(`打开链接`,`opx-button opx-button-secondary`),ee=Ma(`清空`,`opx-button opx-button-secondary`);C.append(w,T,ee);let E=document.createElement(`div`);E.className=`opx-status`,E.textContent=`等待读取 ChatGPT session。`;let D=``,O=``,k=!1,te=!1,ne=async()=>{oe((await ze()).checkoutOptions)},re=async()=>{await ae()},ie=async()=>{try{let e=se();await Be({checkoutOptions:e}),ce(e),Q(E,`本地参数已更新`,`ok`)}catch(e){Q(E,Ia(e),`error`)}};for(let e of[c,l,u,d,f])e.addEventListener(`change`,()=>void ie()),e.addEventListener(`input`,()=>void ie());return s.addEventListener(`click`,()=>void ae()),y.addEventListener(`paste`,()=>window.setTimeout(()=>le(!1),0)),y.addEventListener(`input`,()=>{O=``,(y.value.includes(`accessToken`)||y.value.length>900)&&le(!1)}),x.addEventListener(`click`,async()=>{Q(E,`正在生成订阅链接...`,`pending`);let e=y.value.trim()?le(!0):O;if(!e){Q(E,`没有 accessToken，请先读取 session 或手动粘贴。`,`error`);return}let n;try{n=se(),await Be({checkoutOptions:n})}catch(e){Q(E,Ia(e),`error`);return}let r;try{r=await t.runtime.sendMessage({type:`opx:create-checkout-link`,raw:e,options:n})}catch(e){Q(E,`生成失败：${String(e)}`,`error`);return}let i=r?.link||r?.url||``;if(!La(r)||!r.ok||!i){Q(E,r?.message||`生成失败：返回结果无效`,`error`),ue(``);return}ue(i),Q(E,r.message,`ok`)}),w.addEventListener(`click`,async()=>{D&&(await navigator.clipboard.writeText(D),Q(E,`已复制链接`,`ok`))}),T.addEventListener(`click`,()=>{D&&window.open(D,`_blank`,`noopener,noreferrer`)}),ee.addEventListener(`click`,()=>{y.value=``,O=``,b.textContent=`切到提链接 tab 会读取 /api/auth/session；token 只在当前页面内使用。`,b.classList.remove(`is-ok`),ue(``),de(``,``,``),Q(E,`已清空`,`ok`),y.focus()}),e.append(n,r,s,p,_,y,b,x,Fa(`订阅链接`,S),C,E),ne(),ue(``),{update:ne,onShow:re};async function ae(){if(!k){k=!0,s.disabled=!0,Q(E,`正在读取 https://chatgpt.com/api/auth/session ...`,`pending`);try{let e=await t.runtime.sendMessage({type:`opx:fetch-chatgpt-session`});if(te=!0,!Ra(e)){Q(E,`session 返回结果无效`,`error`);return}let n=e.session;de(n?.email||``,n?.planType||``,n?.accessToken||``),n?.accessToken&&(O=n.accessToken,y.value=n.accessToken,b.textContent=`已从 ChatGPT session 读取 accessToken。`,b.classList.add(`is-ok`)),Q(E,e.message,e.ok?`ok`:`error`)}catch(e){Q(E,`读取 session 失败：${String(e)}`,`error`)}finally{s.disabled=!1,k=!1}}}function oe(e){let t=be(e);c.value=t.planName,l.value=t.uiMode,u.value=t.region,d.value=t.workspaceName,f.value=String(t.seatQuantity),ce(t)}function se(){return be({planName:c.value,uiMode:l.value,region:u.value,workspaceName:d.value,seatQuantity:Number(f.value||5)})}function ce(e){let t=e.planName===`chatgptteamplan`?`Team · ${e.seatQuantity} seats`:`Plus`,r=e.uiMode===`hosted`?`长链接 hosted`:`短链接 custom`,i=te?`session 已请求`:`session 待读取`;n.textContent=`${t} · ${r} · ${e.region} · ${i}`,_.hidden=e.planName!==`chatgptteamplan`,g.hidden=e.planName===`chatgptteamplan`}function le(e){try{let e=ye(y.value);return y.value.trim()!==e&&(y.value=e),b.textContent=`已本地提取 accessToken。`,b.classList.add(`is-ok`),e}catch(t){return b.classList.remove(`is-ok`),e&&Q(E,Ia(t),`error`),``}}function ue(e){D=e,S.value=e,w.disabled=!e,T.disabled=!e}function de(e,t,n){i.value.textContent=e||`未读取`,a.value.textContent=t||`未读取`,o.value.textContent=n?`已获取`:`未获取`}}function ja(e,t){let n=document.createElement(`div`);n.className=`opx-session-row`;let r=document.createElement(`span`);r.textContent=e;let i=document.createElement(`strong`);return i.textContent=t,n.append(r,i),{row:n,value:i}}function Ma(e,t=`opx-button`){let n=document.createElement(`button`);return n.className=t,n.type=`button`,n.textContent=e,n}function Na(e,t){let n=document.createElement(`input`);return n.className=`opx-input`,n.type=t,n.placeholder=e,n}function Pa(e){let t=document.createElement(`select`);t.className=`opx-select`;for(let[n,r]of e){let e=document.createElement(`option`);e.value=n,e.textContent=r,t.append(e)}return t}function Fa(e,t){let n=document.createElement(`label`);n.className=`opx-field`;let r=document.createElement(`span`);return r.className=`opx-label`,r.textContent=e,n.append(r,t),n}function Q(e,t,n){e.textContent=t,e.dataset.type=n}function Ia(e){return e instanceof Error?e.message:String(e)}function La(e){return!!(e&&typeof e==`object`&&typeof e.ok==`boolean`&&typeof e.message==`string`)}function Ra(e){return!!(e&&typeof e==`object`&&typeof e.ok==`boolean`&&typeof e.message==`string`)}function za(e,t){let n=document.createElement(`textarea`);n.className=`opx-textarea`,n.placeholder=`邮箱或 Outlook 行`,n.autocomplete=`off`,n.spellcheck=!1;let r=document.createElement(`div`);r.className=`opx-hint`,r.textContent=`支持 user@example.com 或 email----password----client_id----refresh_token`;let i=Ba(`填入邮箱并继续`),a=document.createElement(`input`);a.className=`opx-input`,a.type=`text`,a.inputMode=`numeric`,a.placeholder=`验证码`,a.autocomplete=`one-time-code`;let o=Ba(`填入验证码并继续`),s=Ba(`自动接收并填入验证码`,`opx-button opx-button-secondary`),c=Ba(`填写资料并创建`),l=document.createElement(`div`);l.className=`opx-status`,l.textContent=`等待操作`;let u=async()=>{let e=t.getPageState(),a=await t.loadState();n.value!==a.rawInput&&(n.value=a.rawInput),i.disabled=!e.canFillEmail,o.disabled=!e.canFillOtp,s.disabled=!e.canFillOtp||!a.autoOtp,c.disabled=!e.canFillProfile,r.textContent=a.autoOtp?`Outlook 行模式：验证码页会通过本地 API 自动收码`:`单邮箱模式：验证码需要手动输入`};return n.addEventListener(`input`,async()=>{r.textContent=(await t.saveInput(n.value)).autoOtp?`Outlook 行模式：验证码页会通过本地 API 自动收码`:`单邮箱模式：验证码需要手动输入`}),i.addEventListener(`click`,async()=>{Ha(l,`正在提交邮箱...`,`pending`),await t.saveInput(n.value),Va(l,await t.fillEmailFromInput()),await u()}),o.addEventListener(`click`,async()=>{Ha(l,`正在提交验证码...`,`pending`),Va(l,await t.fillOtp(a.value)),await u()}),s.addEventListener(`click`,async()=>{Ha(l,`等待 Outlook 验证码...`,`pending`),Va(l,await t.waitForOutlookOtp()),await u()}),c.addEventListener(`click`,async()=>{Ha(l,`正在填写资料...`,`pending`),Va(l,await t.fillProfileAndCreate()),await u()}),e.append(n,r,i,a,o,s,c,l),u(),{update:u}}function Ba(e,t=`opx-button`){let n=document.createElement(`button`);return n.className=t,n.type=`button`,n.textContent=e,n}function Va(e,t){Ha(e,t.message,t.ok?`ok`:`error`)}function Ha(e,t,n){e.textContent=t,e.dataset.type=n}var Ua=`opx.versionCheck.state`,Wa={ignoredVersion:``,lastCheckedAt:0,latest:null};async function Ga(){return Ja((await t.storage.local.get(Ua))[Ua])}async function Ka(e){let n=Ja({...await Ga(),...e});return await t.storage.local.set({[Ua]:n}),n}async function qa(e){return Ka({ignoredVersion:Xa(e)})}function Ja(e){let t=Za(e)?e:{};return{ignoredVersion:Xa(t.ignoredVersion),lastCheckedAt:Number(t.lastCheckedAt||Wa.lastCheckedAt),latest:Ya(t.latest)}}function Ya(e){if(!Za(e))return null;let t=Xa(e.version),n=String(e.htmlUrl||``).trim();return!t||!n?null:{version:t,tagName:String(e.tagName||t).trim(),name:String(e.name||e.tagName||t).trim(),body:String(e.body||``).trim(),htmlUrl:n,downloadUrl:String(e.downloadUrl||n).trim(),publishedAt:String(e.publishedAt||``).trim()}}function Xa(e){return String(e||``).trim().replace(/^v/i,``)}function Za(e){return!!(e&&typeof e==`object`)}var Qa=`https://api.github.com/repos/suyancc/openai-plus-vxt/releases/latest`,$a=1800*1e3;async function eo(e=!1){let n=io(t.runtime.getManifest().version),r=await Ga();if(!e&&r.latest&&Date.now()-r.lastCheckedAt<$a)return no(n,r.latest,r.ignoredVersion);try{let e=await fetch(Qa,{headers:{Accept:`application/vnd.github+json`},cache:`no-store`});if(e.status===404)return await Ka({latest:null,lastCheckedAt:Date.now()}),{currentVersion:n,latest:null,updateAvailable:!1,ignored:!1,error:`当前仓库还没有 GitHub Release`};if(!e.ok)throw Error(`GitHub API ${e.status}`);let t=ro(await e.json());return await Ka({latest:t,lastCheckedAt:Date.now()}),no(n,t,r.ignoredVersion)}catch(e){return{currentVersion:n,latest:r.latest,updateAvailable:!!(r.latest&&to(r.latest.version,n)>0),ignored:!!(r.latest&&r.ignoredVersion===r.latest.version),error:e instanceof Error?e.message:String(e)}}}function to(e,t){let n=io(e).split(`.`).map(ao),r=io(t).split(`.`).map(ao),i=Math.max(n.length,r.length);for(let e=0;e<i;e+=1){let t=(n[e]||0)-(r[e]||0);if(t!==0)return t>0?1:-1}return 0}function no(e,t,n){return{currentVersion:e,latest:t,updateAvailable:!!(t&&to(t.version,e)>0),ignored:!!(t&&n===t.version)}}function ro(e){let t=String(e.tag_name||``).trim(),n=io(t),r=String(e.html_url||``).trim();if(!n||!r)return null;let i=e.assets?.find(e=>{let t=String(e.name||``).toLowerCase();return t.endsWith(`.zip`)&&t.includes(`chrome`)})?.browser_download_url||e.assets?.find(e=>String(e.name||``).toLowerCase().endsWith(`.zip`))?.browser_download_url;return{version:n,tagName:t,name:String(e.name||t).trim(),body:String(e.body||``).trim(),htmlUrl:r,downloadUrl:String(i||r).trim(),publishedAt:String(e.published_at||``).trim()}}function io(e){return e.trim().replace(/^v/i,``)}function ao(e){let t=Number.parseInt(e.replace(/\D.*$/,``),10);return Number.isFinite(t)?t:0}var oo=`https://t.me/fuck_open`;function so(e={}){let n=document.createElement(`div`);n.className=`opx-settings-overlay`,n.hidden=!0;let r=document.createElement(`section`);r.className=`opx-settings-dialog`,r.setAttribute(`role`,`dialog`),r.setAttribute(`aria-modal`,`true`),r.setAttribute(`aria-label`,`插件设置`);let i=document.createElement(`div`);i.className=`opx-settings-header`;let a=document.createElement(`div`);a.className=`opx-settings-title`;let o=document.createElement(`strong`);o.textContent=`设置`;let s=document.createElement(`span`);s.className=`opx-version-badge`,s.textContent=`v${t.runtime.getManifest().version}`;let c=uo(`×`,`关闭设置`);a.append(o,s),i.append(a,c);let l=document.createElement(`input`);l.type=`checkbox`,l.className=`opx-checkbox`;let u=document.createElement(`input`);u.type=`checkbox`,u.className=`opx-checkbox`;let d=co(l,`OpenAI 支付页自动填写`,`用于 pay.openai.com/c/pay 页面，填写姓名、国家、地址、邮编、电话并勾选条款。`),f=co(u,`PayPal 注册页自动填写`,`用于 paypal.com/checkoutweb/signup 页面，填写国家、邮箱、卡资料、姓名、地址和密码提示。`),p=document.createElement(`div`);p.className=`opx-setting-item`;let m=document.createElement(`div`);m.style.cssText=`font-weight:600;font-size:13px;margin-bottom:4px;`,m.textContent=`PayPal 登录账号(自动授权用)`;let h=document.createElement(`div`);h.className=`opx-setting-description`,h.textContent=`从 pay.openai 跳转到 paypal.com 时自动填邮箱、密码并点同意并继续。`;let g=document.createElement(`input`);g.type=`email`,g.className=`opx-input`,g.placeholder=`PayPal 邮箱`,g.style.cssText=`width:100%;margin-top:6px;padding:6px 8px;font-size:12px;box-sizing:border-box;`,g.autocomplete=`off`;let _=document.createElement(`input`);_.type=`password`,_.className=`opx-input`,_.placeholder=`PayPal 密码`,_.style.cssText=`width:100%;margin-top:6px;padding:6px 8px;font-size:12px;box-sizing:border-box;`,_.autocomplete=`off`,p.append(m,h,g,_),g.addEventListener(`change`,async()=>{await lt({email:g.value.trim()}),$(x,`PayPal 账号已保存`,`ok`)}),_.addEventListener(`change`,async()=>{await lt({password:_.value}),$(x,`PayPal 密码已保存`,`ok`)});let v=document.createElement(`button`);v.className=`opx-external-link-button`,v.type=`button`,v.title=`立即检查 GitHub Release 最新版本`,v.textContent=`检测更新`;let y=document.createElement(`button`);y.className=`opx-external-link-button`,y.type=`button`,y.title=`打开 TG 群组`,y.append(lo(),document.createTextNode(`TG 群组：t.me/fuck_open`));let b=document.createElement(`div`);b.className=`opx-hint`,b.textContent=`国家、城市和获取地址在“地址”tab 中操作。`;let x=document.createElement(`div`);x.className=`opx-status`,r.append(i,d,f,p,v,y,b,x),n.append(r),c.addEventListener(`click`,C),n.addEventListener(`click`,e=>{e.target===n&&C()}),l.addEventListener(`change`,async()=>{await F({payOpenAiEnabled:l.checked}),$(x,`设置已保存`,`ok`)}),u.addEventListener(`change`,async()=>{await F({payPalSignupEnabled:u.checked}),$(x,`设置已保存`,`ok`)}),y.addEventListener(`click`,()=>{window.open(oo,`_blank`,`noopener,noreferrer`)}),v.addEventListener(`click`,async()=>{v.disabled=!0,$(x,`正在检测 GitHub 最新版本...`,`pending`);try{let t=await eo(!0);await e.onVersionChecked?.(),t.latest&&t.updateAvailable?$(x,`发现新版本 v${t.latest.version}，顶部已显示更新提示`,`ok`):t.latest?$(x,`当前已是最新版本 v${t.currentVersion}`,`ok`):$(x,t.error||`暂未找到可用 Release`,`pending`)}catch(e){$(x,e instanceof Error?e.message:String(e),`error`)}finally{v.disabled=!1}});let S=async()=>{let e=await I();l.checked=e.payOpenAiEnabled,u.checked=e.payPalSignupEnabled;let t=await ct();g.value=t.email||``,_.value=t.password||``;let n=Number(e.payOpenAiEnabled)+Number(e.payPalSignupEnabled);$(x,t.email&&t.password?`已开启 ${n} 项自动填写,PayPal 账号已配置`:n>0?`已开启 ${n} 项自动填写(尚未配置 PayPal 账号)`:`自动填写未开启`,n>0?`ok`:`pending`)};return{element:n,open:()=>{n.hidden=!1,S()},update:S};function C(){n.hidden=!0}}function co(e,t,n){let r=document.createElement(`div`);r.className=`opx-setting-item`;let i=document.createElement(`label`);i.className=`opx-check-row`;let a=document.createElement(`span`);a.textContent=t,i.append(e,a);let o=document.createElement(`div`);return o.className=`opx-setting-description`,o.textContent=n,r.append(i,o),r}function lo(){let e=document.createElementNS(`http://www.w3.org/2000/svg`,`svg`);e.classList.add(`opx-telegram-icon`),e.setAttribute(`viewBox`,`0 0 24 24`),e.setAttribute(`aria-hidden`,`true`);let t=document.createElementNS(`http://www.w3.org/2000/svg`,`path`);return t.setAttribute(`fill`,`currentColor`),t.setAttribute(`d`,`M21.9 4.3 18.7 19c-.2 1-.8 1.2-1.6.8l-4.6-3.4-2.2 2.1c-.2.2-.4.4-.9.4l.3-4.7 8.5-7.7c.4-.3-.1-.5-.6-.2L7.1 12.9 2.6 11.5c-1-.3-1-1 0-1.4L20.2 3.3c.8-.3 1.5.2 1.7 1Z`),e.append(t),e}function uo(e,t){let n=document.createElement(`button`);return n.className=`opx-icon-button`,n.type=`button`,n.textContent=e,n.title=t,n.setAttribute(`aria-label`,t),n}function $(e,t,n){e.textContent=t,e.dataset.type=n}var fo=3e3;function po(e){let t=document.createElement(`div`);t.className=`opx-summary`;let n=document.createElement(`textarea`);n.className=`opx-textarea opx-sms-input`,n.placeholder=`+14642649811----https://xxxx.com/xxx
每行一个号码和 API 链接`,n.autocomplete=`off`,n.spellcheck=!1;let r=document.createElement(`div`);r.className=`opx-button-row opx-sms-actions`;let i=ho(`保存并开始`),a=ho(`立即获取`,`opx-button opx-button-secondary`),o=ho(`清空历史`,`opx-button opx-button-secondary`);r.append(i,a,o);let s=go(`当前号码`),c=document.createElement(`div`);c.className=`opx-sms-targets`;let l=go(`验证码历史`),u=document.createElement(`div`);u.className=`opx-sms-table`;let d=document.createElement(`div`);d.className=`opx-status`;let f=new Map,p=null,m=null,h=``,g=null,_=!1;e.append(t,mo(`接码信息`,n),r,s,c,l,u,d),n.addEventListener(`input`,()=>{y(),S()}),n.addEventListener(`focus`,()=>{_=!0}),n.addEventListener(`blur`,()=>{_=!1,b()}),i.addEventListener(`click`,async()=>{await b(),S(),await w()}),a.addEventListener(`click`,async()=>{await b(),S(),await w()}),o.addEventListener(`click`,async()=>{let e=await He({history:[]});p=e,D(e.history),bo(d,`验证码历史已清空，输入内容已保留。`,`ok`)});let v=async()=>{let e=await Ve();p=e,!_&&n.value!==e.rawInput&&(n.value=e.rawInput,h=e.rawInput,S()),D(e.history),C()};return v(),{update:v,onShow:async()=>{await v(),x()}};function y(){g&&window.clearTimeout(g),g=window.setTimeout(()=>void b(),450)}async function b(){g&&=(window.clearTimeout(g),null);let e=n.value;e!==h&&(p=await He({rawInput:e}),h=e,C())}function x(){m===null&&(m=window.setInterval(()=>void w(),fo))}function S(){let e=Pi(n.value),t=new Set(e.targets.map(e=>e.id));for(let[e]of f)t.has(e)||f.delete(e);for(let t of e.targets){let e=f.get(t.id);e?e.target=t:f.set(t.id,{target:t,status:`waiting`,message:`等待获取`,code:``,lastCheckedAt:0,inFlight:!1})}if(c.textContent=``,!e.targets.length)c.append(_o(e.errors[0]||`暂无号码，按每行“号码----API链接”输入。`));else for(let t of e.targets){let e=f.get(t.id);e&&c.append(E(e))}e.errors.length?bo(d,e.errors.join(`；`),`error`):e.targets.length?bo(d,`已加载 ${e.targets.length} 个接码链接，每 3 秒自动获取。`,`pending`):bo(d,`输入内容会自动保存。`,`pending`),C()}function C(){let e=Pi(n.value),r=p?.history.length||0,i=[...f.values()].filter(e=>e.code).length;t.textContent=`${e.targets.length} 个接码链接 · ${i} 个当前验证码 · ${r} 条历史`}async function w(){let e=Pi(n.value);!e.targets.length||e.errors.length||(await b(),await Promise.all(e.targets.map(e=>T(e))),S(),D(p?.history||[]))}async function T(e){let t=f.get(e.id);if(!t||t.inFlight)return;t.inFlight=!0,t.status=t.code?`found`:`waiting`,t.message=`正在获取...`,S();let n=await Yi(e);if(t.inFlight=!1,t.lastCheckedAt=Date.now(),n.kind===`code`){t.status=`found`,t.code=n.code,t.message=n.message,await ee(e.phone,n.code,n.message),bo(d,`${e.phone} 收到验证码 ${n.code}`,`ok`);return}if(n.kind===`error`){t.status=`error`,t.message=n.message,bo(d,`${e.phone} 获取失败：${n.message}`,`error`);return}t.status=`waiting`,t.message=n.message}async function ee(e,t,n){let r=p||await Ve();if(r.history.some(r=>r.phone===e&&r.code===t&&r.message===n)){p=r;return}p=await He({history:[{id:`${e}-${t}-${Date.now()}`,phone:e,code:t,message:n,receivedAt:Date.now()},...r.history].slice(0,80)})}function E(e){let t=document.createElement(`div`);t.className=`opx-sms-target-row`,t.dataset.status=e.status;let n=document.createElement(`div`);n.className=`opx-sms-target-main`;let r=document.createElement(`strong`);r.textContent=e.target.phone;let i=document.createElement(`span`);i.textContent=e.code?e.message:e.message||`等待获取`,n.append(r,i);let a=document.createElement(`button`);return a.className=`opx-sms-code-chip`,a.type=`button`,a.textContent=e.code||(e.inFlight?`...`:`等待`),a.disabled=!e.code,a.title=e.code?`点击复制验证码`:`尚未收到验证码`,a.addEventListener(`click`,()=>void O(e.code,a)),t.append(n,a),t}function D(e){u.textContent=``;let t=document.createElement(`div`);if(t.className=`opx-sms-table-row opx-sms-table-head`,t.append(vo(`号码`),vo(`验证码`),vo(`时间`)),u.append(t),!e.length){let e=document.createElement(`div`);e.className=`opx-empty-inline`,e.textContent=`暂无验证码历史。`,u.append(e);return}for(let t of e){let e=document.createElement(`div`);e.className=`opx-sms-table-row`;let n=document.createElement(`button`);n.className=`opx-sms-code-chip`,n.type=`button`,n.textContent=t.code,n.title=t.message||`点击复制验证码`,n.addEventListener(`click`,()=>void O(t.code,n)),e.append(vo(t.phone),yo(n),vo(xo(t.receivedAt))),u.append(e)}}async function O(e,t){if(!e)return;await navigator.clipboard.writeText(e);let n=t.textContent||e;t.textContent=`已复制`,t.classList.add(`is-copied`),window.setTimeout(()=>{t.textContent=n,t.classList.remove(`is-copied`)},1200)}}function mo(e,t){let n=document.createElement(`label`);n.className=`opx-field`;let r=document.createElement(`span`);return r.className=`opx-label`,r.textContent=e,n.append(r,t),n}function ho(e,t=`opx-button`){let n=document.createElement(`button`);return n.className=t,n.type=`button`,n.textContent=e,n}function go(e){let t=document.createElement(`div`);return t.className=`opx-section-title`,t.textContent=e,t}function _o(e){let t=document.createElement(`div`);return t.className=`opx-empty-inline`,t.textContent=e,t}function vo(e){let t=document.createElement(`div`);return t.className=`opx-sms-table-cell`,t.textContent=e,t}function yo(e){let t=document.createElement(`div`);return t.className=`opx-sms-table-cell`,t.append(e),t}function bo(e,t,n){e.textContent=t,e.dataset.type=n}function xo(e){return e?new Date(e).toLocaleTimeString(`zh-CN`,{hour12:!1,hour:`2-digit`,minute:`2-digit`,second:`2-digit`}):`-`}function So(){let e=document.createElement(`section`);e.className=`opx-version-notice`,e.hidden=!0;let t=document.createElement(`div`);t.className=`opx-version-notice-title`;let n=document.createElement(`div`);n.className=`opx-version-notice-body`;let r=document.createElement(`div`);r.className=`opx-version-notice-actions`;let i=document.createElement(`button`);i.className=`opx-mini-button`,i.type=`button`,i.textContent=`下载更新`;let a=document.createElement(`button`);a.className=`opx-mini-button opx-mini-button-secondary`,a.type=`button`,a.textContent=`更新说明`;let o=document.createElement(`button`);o.className=`opx-mini-button opx-mini-button-secondary`,o.type=`button`,o.textContent=`忽略`,r.append(i,a,o),e.append(t,n,r);let s=null;return i.addEventListener(`click`,()=>{s?.downloadUrl&&window.open(s.downloadUrl,`_blank`,`noopener,noreferrer`)}),a.addEventListener(`click`,()=>{s?.htmlUrl&&window.open(s.htmlUrl,`_blank`,`noopener,noreferrer`)}),o.addEventListener(`click`,async()=>{s&&(await qa(s.version),e.hidden=!0)}),{element:e,update:async(r=!1)=>{let i=await eo(r);s=i.latest,Co(i,e,t,n)}}}function Co(e,t,n,r){if(!e.latest||!e.updateAvailable||e.ignored){t.hidden=!0;return}n.textContent=`发现新版本 v${e.latest.version}`,r.textContent=wo(e.currentVersion,e.latest),t.hidden=!1}function wo(e,t){let n=t.body.split(/\r?\n/).map(e=>e.replace(/^#+\s*/,``).trim()).filter(Boolean).slice(0,2).join(` / `),r=`当前 v${e}，最新 ${t.tagName||`v${t.version}`}`;return n?`${r}。${n}`:r}var To=`
:host {
  all: initial;
  color-scheme: light dark;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.opx-shell {
  position: fixed;
  top: 72px;
  right: 0;
  z-index: 2147483647;
  display: flex;
  align-items: flex-start;
  max-height: calc(100vh - 88px);
}

.opx-panel {
  box-sizing: border-box;
  width: min(320px, calc(100vw - 42px));
  max-height: calc(100vh - 88px);
  margin-right: 18px;
  padding: 10px;
  border: 1px solid rgba(54, 211, 153, 0.28);
  border-radius: 8px;
  background: #0b1220;
  color: #e5f7ef;
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.32);
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-color: rgba(47, 209, 124, 0.55) rgba(15, 23, 42, 0.72);
  scrollbar-width: thin;
}

.opx-panel::-webkit-scrollbar {
  width: 8px;
}

.opx-panel::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.72);
  border-radius: 999px;
}

.opx-panel::-webkit-scrollbar-thumb {
  background: rgba(47, 209, 124, 0.55);
  border-radius: 999px;
}

.opx-collapse-toggle {
  box-sizing: border-box;
  width: 32px;
  min-height: 64px;
  margin: 8px 0 0 0;
  padding: 8px 6px;
  border: 1px solid rgba(47, 209, 124, 0.36);
  border-right: 0;
  border-radius: 8px 0 0 8px;
  background: #0b1220;
  color: #93e4bd;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  line-height: 14px;
  writing-mode: vertical-rl;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.28);
}

.opx-shell.is-collapsed .opx-panel {
  display: none;
}

.opx-shell.is-collapsed .opx-collapse-toggle {
  margin-right: 0;
  border-radius: 8px 0 0 8px;
  background: #102019;
}

.opx-topbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 34px;
  gap: 6px;
  align-items: stretch;
  margin-bottom: 8px;
}

.opx-tabs {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 4px;
  margin-bottom: 0;
  padding: 3px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.8);
}

.opx-tab {
  height: 30px;
  min-width: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  font-weight: 650;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.opx-tab.is-active {
  background: #2fd17c;
  color: #04130a;
}

.opx-icon-button {
  box-sizing: border-box;
  width: 34px;
  height: 36px;
  border: 1px solid rgba(47, 209, 124, 0.36);
  border-radius: 8px;
  background: #111827;
  color: #93e4bd;
  cursor: pointer;
  font: inherit;
  font-size: 17px;
  font-weight: 700;
  line-height: 1;
}

.opx-icon-button:hover {
  border-color: rgba(47, 209, 124, 0.74);
  color: #bbf7d0;
}

.opx-state {
  margin: 0 0 8px;
  color: #93e4bd;
  font-size: 12px;
  line-height: 16px;
}

.opx-version-notice {
  display: grid;
  gap: 7px;
  margin: 0 0 8px;
  padding: 8px;
  border: 1px solid rgba(47, 209, 124, 0.42);
  border-radius: 7px;
  background: rgba(47, 209, 124, 0.1);
  color: #dcfce7;
}

.opx-version-notice[hidden] {
  display: none;
}

.opx-version-notice-title {
  color: #bbf7d0;
  font-size: 12px;
  font-weight: 800;
  line-height: 16px;
}

.opx-version-notice-body {
  color: #cbd5e1;
  font-size: 11px;
  line-height: 15px;
  overflow-wrap: anywhere;
}

.opx-version-notice-actions {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 54px;
  gap: 5px;
}

.opx-mini-button {
  box-sizing: border-box;
  min-width: 0;
  height: 28px;
  border: 0;
  border-radius: 6px;
  background: #2fd17c;
  color: #04130a;
  cursor: pointer;
  font: inherit;
  font-size: 11px;
  font-weight: 750;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.opx-mini-button-secondary {
  border: 1px solid rgba(47, 209, 124, 0.34);
  background: rgba(15, 23, 42, 0.72);
  color: #93e4bd;
}

.opx-view {
  display: block;
}

.opx-view[hidden] {
  display: none;
}

.opx-empty-view {
  min-height: 84px;
  display: grid;
  place-items: center;
  border: 1px dashed rgba(148, 163, 184, 0.28);
  border-radius: 8px;
  color: #94a3b8;
  font-size: 13px;
}

.opx-input,
.opx-select,
.opx-textarea {
  box-sizing: border-box;
  width: 100%;
  height: 36px;
  margin: 0 0 8px;
  padding: 0 10px;
  border: 1px solid rgba(148, 163, 184, 0.32);
  border-radius: 6px;
  background: #111827;
  color: #e5f7ef;
  font: inherit;
  font-size: 13px;
  outline: none;
}

.opx-select {
  appearance: none;
}

.opx-textarea {
  min-height: 72px;
  max-height: 140px;
  padding: 9px 10px;
  resize: vertical;
  line-height: 18px;
}

.opx-input:focus,
.opx-select:focus,
.opx-textarea:focus {
  border-color: #2fd17c;
}

.opx-hint {
  margin: -2px 0 8px;
  color: #94a3b8;
  font-size: 11px;
  line-height: 15px;
}

.opx-hint.is-ok {
  color: #86efac;
}

.opx-summary {
  margin: 0 0 8px;
  padding: 7px 8px;
  border: 1px solid rgba(47, 209, 124, 0.28);
  border-radius: 6px;
  background: rgba(47, 209, 124, 0.08);
  color: #bbf7d0;
  font-size: 11px;
  line-height: 15px;
  word-break: break-word;
  white-space: pre-line;
}

.opx-session-card {
  display: grid;
  gap: 5px;
  margin: 0 0 8px;
  padding: 8px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 6px;
  background: rgba(15, 23, 42, 0.72);
}

.opx-session-row {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  gap: 6px;
  color: #94a3b8;
  font-size: 11px;
  line-height: 15px;
}

.opx-session-row strong {
  min-width: 0;
  color: #e5f7ef;
  font-weight: 600;
  word-break: break-word;
}

.opx-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 8px;
}

.opx-team-options[hidden] {
  display: none;
}

.opx-field {
  display: block;
  min-width: 0;
}

.opx-label {
  display: block;
  margin: 0 0 4px;
  color: #94a3b8;
  font-size: 11px;
  line-height: 14px;
}

.opx-token-textarea {
  min-height: 92px;
}

.opx-output {
  min-height: 58px;
  resize: vertical;
}

.opx-button-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}

.opx-address-actions {
  grid-template-columns: minmax(0, 1fr);
}

.opx-button {
  box-sizing: border-box;
  width: 100%;
  height: 34px;
  margin: 0 0 10px;
  border: 0;
  border-radius: 6px;
  background: #2fd17c;
  color: #04130a;
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
}

.opx-button-secondary {
  background: #182235;
  color: #93e4bd;
  border: 1px solid rgba(47, 209, 124, 0.36);
}

.opx-button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.opx-status {
  min-height: 18px;
  color: #cbd5e1;
  font-size: 12px;
  line-height: 18px;
  word-break: break-word;
}

.opx-status[data-type="ok"] {
  color: #86efac;
}

.opx-status[data-type="error"] {
  color: #fca5a5;
}

.opx-settings-overlay {
  position: fixed;
  inset: 0;
  z-index: 2147483647;
  display: grid;
  place-items: start center;
  padding: 22px 10px;
  background: rgba(2, 6, 23, 0.58);
}

.opx-settings-overlay[hidden] {
  display: none;
}

.opx-settings-dialog {
  box-sizing: border-box;
  width: min(300px, calc(100vw - 52px));
  max-height: calc(100vh - 44px);
  overflow-y: auto;
  padding: 10px;
  border: 1px solid rgba(47, 209, 124, 0.38);
  border-radius: 8px;
  background: #0b1220;
  color: #e5f7ef;
  box-shadow: 0 20px 52px rgba(0, 0, 0, 0.42);
}

.opx-settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin: 0 0 10px;
  color: #bbf7d0;
  font-size: 14px;
  line-height: 18px;
}

.opx-settings-title {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}

.opx-version-badge {
  padding: 1px 6px;
  border: 1px solid rgba(47, 209, 124, 0.34);
  border-radius: 999px;
  background: rgba(47, 209, 124, 0.08);
  color: #93e4bd;
  font-size: 11px;
  font-weight: 700;
  line-height: 16px;
}

.opx-settings-header .opx-icon-button {
  width: 28px;
  height: 28px;
  font-size: 18px;
}

.opx-settings-dialog .opx-grid {
  grid-template-columns: minmax(0, 1fr);
  gap: 0;
}

.opx-setting-item {
  margin: 0 0 8px;
  padding: 8px;
  border: 1px solid rgba(47, 209, 124, 0.22);
  border-radius: 6px;
  background: rgba(15, 23, 42, 0.54);
}

.opx-setting-item .opx-check-row {
  margin-bottom: 4px;
}

.opx-setting-description {
  margin-left: 26px;
  color: #94a3b8;
  font-size: 11px;
  line-height: 15px;
}

.opx-external-link-button {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  width: 100%;
  min-height: 34px;
  margin: 0 0 8px;
  padding: 8px 10px;
  border: 1px solid rgba(47, 209, 124, 0.34);
  border-radius: 6px;
  background: rgba(47, 209, 124, 0.1);
  color: #bbf7d0;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  line-height: 16px;
  text-align: left;
}

.opx-telegram-icon {
  flex: 0 0 auto;
  width: 14px;
  height: 14px;
}

.opx-external-link-button:hover {
  border-color: rgba(47, 209, 124, 0.7);
  background: rgba(47, 209, 124, 0.16);
  color: #dcfce7;
}

.opx-external-link-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.opx-check-row {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr);
  gap: 8px;
  align-items: center;
  margin: 0 0 10px;
  color: #e5f7ef;
  cursor: pointer;
  font-size: 12px;
  line-height: 16px;
}

.opx-checkbox {
  width: 16px;
  height: 16px;
  accent-color: #2fd17c;
}

.opx-address-summary {
  min-height: 68px;
}

.opx-settings-buttons {
  margin-top: 2px;
}

.opx-section-title {
  margin: 10px 0 6px;
  color: #bbf7d0;
  font-size: 12px;
  font-weight: 700;
  line-height: 16px;
}

.opx-copy-list {
  display: grid;
  gap: 5px;
}

.opx-copy-section {
  display: grid;
  gap: 5px;
  margin: 5px 0 1px;
}

.opx-copy-section-title {
  color: #93e4bd;
  font-size: 11px;
  font-weight: 700;
  line-height: 15px;
}

.opx-copy-section-body {
  display: grid;
  gap: 5px;
}

.opx-accordion-section {
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 6px;
  background: rgba(15, 23, 42, 0.56);
}

.opx-accordion-section summary {
  padding: 7px 8px;
  color: #93e4bd;
  cursor: pointer;
  font-size: 11px;
  font-weight: 700;
  line-height: 15px;
  list-style-position: inside;
}

.opx-accordion-section .opx-copy-section-body {
  padding: 0 6px 6px;
}

.opx-copy-row,
.opx-empty-inline {
  box-sizing: border-box;
  width: 100%;
  min-height: 30px;
  padding: 7px 8px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 6px;
  background: rgba(15, 23, 42, 0.72);
  color: #cbd5e1;
  font: inherit;
  font-size: 11px;
  line-height: 15px;
  text-align: left;
  word-break: break-word;
}

.opx-copy-row {
  cursor: pointer;
}

.opx-copy-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 4px;
  align-items: start;
}

.opx-copy-row:hover {
  border-color: rgba(47, 209, 124, 0.48);
  color: #e5f7ef;
}

.opx-copy-row.is-copied {
  border-color: rgba(47, 209, 124, 0.72);
  background: rgba(47, 209, 124, 0.12);
}

.opx-copy-label {
  color: #94a3b8;
  white-space: nowrap;
}

.opx-copy-row strong {
  min-width: 0;
  color: #e5f7ef;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.opx-copy-feedback {
  align-self: start;
  padding: 1px 5px;
  border-radius: 999px;
  background: rgba(47, 209, 124, 0.16);
  color: #86efac !important;
  font-size: 10px;
  font-weight: 700;
  line-height: 14px;
  white-space: nowrap;
}

.opx-copy-feedback[hidden] {
  display: none;
}

.opx-empty-inline {
  color: #94a3b8;
  border-style: dashed;
}

.opx-sms-input {
  min-height: 88px;
}

.opx-sms-actions {
  grid-template-columns: minmax(0, 1fr) minmax(0, 0.86fr) minmax(0, 0.86fr);
}

.opx-sms-targets {
  display: grid;
  gap: 6px;
}

.opx-sms-target-row {
  box-sizing: border-box;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
  min-height: 44px;
  padding: 7px 8px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 6px;
  background: rgba(15, 23, 42, 0.72);
}

.opx-sms-target-row[data-status="found"] {
  border-color: rgba(47, 209, 124, 0.5);
  background: rgba(47, 209, 124, 0.1);
}

.opx-sms-target-row[data-status="error"] {
  border-color: rgba(248, 113, 113, 0.42);
  background: rgba(127, 29, 29, 0.2);
}

.opx-sms-target-main {
  min-width: 0;
  display: grid;
  gap: 2px;
}

.opx-sms-target-main strong,
.opx-sms-target-main span {
  min-width: 0;
  overflow-wrap: anywhere;
}

.opx-sms-target-main strong {
  color: #e5f7ef;
  font-size: 12px;
  line-height: 16px;
}

.opx-sms-target-main span {
  color: #94a3b8;
  font-size: 11px;
  line-height: 15px;
}

.opx-sms-code-chip {
  box-sizing: border-box;
  min-width: 56px;
  max-width: 92px;
  min-height: 28px;
  padding: 4px 8px;
  border: 1px solid rgba(47, 209, 124, 0.44);
  border-radius: 999px;
  background: #182235;
  color: #bbf7d0;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  line-height: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.opx-sms-code-chip:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.opx-sms-code-chip.is-copied {
  background: #2fd17c;
  color: #04130a;
}

.opx-sms-table {
  display: grid;
  gap: 5px;
}

.opx-sms-table-row {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(64px, 0.8fr) 62px;
  gap: 6px;
  align-items: center;
  min-height: 32px;
  padding: 5px 6px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 6px;
  background: rgba(15, 23, 42, 0.58);
}

.opx-sms-table-head {
  min-height: 24px;
  background: transparent;
  border-color: transparent;
  color: #93e4bd;
  font-weight: 700;
}

.opx-sms-table-cell {
  min-width: 0;
  color: #cbd5e1;
  font-size: 11px;
  line-height: 15px;
  overflow-wrap: anywhere;
}

@media (max-height: 640px) {
  .opx-shell {
    top: 12px;
    max-height: calc(100vh - 24px);
  }

  .opx-panel {
    max-height: calc(100vh - 24px);
  }
}
`;function Eo(e,t){e.innerHTML=``;let n=document.createElement(`style`);n.textContent=To;let r=document.createElement(`div`);r.className=`opx-shell`;let i=document.createElement(`button`);i.className=`opx-collapse-toggle`,i.type=`button`,i.textContent=`收起`,i.title=`收起侧边栏`,i.setAttribute(`aria-expanded`,`true`);let a=document.createElement(`aside`);a.className=`opx-panel`;let o=document.createElement(`div`);o.className=`opx-topbar`;let s=document.createElement(`div`);s.className=`opx-tabs`;let c=ko(`register`,`注册`),l=ko(`link`,`提链接`),u=ko(`address`,`地址`),d=ko(`sms`,`接码`),f=ko(`auto`,`一键`);s.append(f,c,l,u,d);let p=document.createElement(`button`);p.className=`opx-icon-button`,p.type=`button`,p.textContent=`⚙`,p.title=`打开设置`,p.setAttribute(`aria-label`,`打开设置`);let m=document.createElement(`div`);m.className=`opx-state`;let h=Oo(),g=Oo(),_=Oo(),v=Oo(),y=Oo(),b={auto:Da(y),register:za(h,t),link:Aa(g),address:Tr(_),sms:po(v)},x=So(),S=so({onVersionChecked:()=>x.update(!0)}),C=`auto`,w=e=>{r.classList.toggle(`is-collapsed`,e),i.textContent=e?`展开`:`收起`,i.title=e?`展开侧边栏`:`收起侧边栏`,i.setAttribute(`aria-expanded`,e?`false`:`true`)},T=async e=>{Ue(e)&&(C=e,await Fe(e),ee(),await b[e].onShow?.(),await E())},ee=()=>{for(let e of[f,c,l,u,d])e.classList.toggle(`is-active`,e.dataset.tab===C);y.hidden=C!==`auto`,h.hidden=C!==`register`,g.hidden=C!==`link`,_.hidden=C!==`address`,v.hidden=C!==`sms`},E=async()=>{let e=await j();C=e.activeTab,w(e.panelCollapsed),ee(),m.textContent=Do(C,t),await b[C].update()};c.addEventListener(`click`,()=>void T(`register`)),l.addEventListener(`click`,()=>void T(`link`)),u.addEventListener(`click`,()=>void T(`address`)),d.addEventListener(`click`,()=>void T(`sms`)),f.addEventListener(`click`,()=>void T(`auto`)),p.addEventListener(`click`,()=>S.open()),i.addEventListener(`click`,()=>{let e=!r.classList.contains(`is-collapsed`);w(e),Ie(e)}),o.append(s,p),a.append(o,x.element,m,y,h,g,_,v,S.element),r.append(i,a),e.append(n,r),window.setInterval(()=>void E(),1e3),window.setTimeout(()=>void x.update(),800),E().then(()=>{b[C].onShow?.()})}function Do(e,t){return e===`auto`?`一键自动化`:e===`register`?t.getPageState().label:e===`link`?`提链接：ChatGPT session`:e===`address`?`地址：随机资料`:`接码：短信验证码`}function Oo(){let e=document.createElement(`section`);return e.className=`opx-view`,e}function ko(e,t){let n=document.createElement(`button`);return n.className=`opx-tab`,n.type=`button`,n.dataset.tab=e,n.textContent=t,n}var Ao=`opx-assistant-root`;function jo(){if(document.getElementById(Ao))return;let e=document.createElement(`div`);e.id=Ao,document.documentElement.append(e);let t=e.attachShadow({mode:`open`}),n=Ze();Eo(t,n),n.autoRunForCurrentPage()}var Mo=`__opx_assistant_content_loaded__`,No=e({matches:[`https://chatgpt.com/*`,`https://auth.openai.com/*`,`https://pay.openai.com/*`,`https://www.paypal.com/*`,`https://paypal.com/*`],runAt:`document_idle`,registration:`manifest`,main(){let e=globalThis;if(!e[Mo]){e[Mo]=!0,jo();try{St()}catch(e){console.warn(`[OPX] pay autofill init failed`,e)}try{fn()}catch(e){console.warn(`[OPX] PayPal autofill init failed`,e)}try{fa()}catch(e){console.warn(`[OPX] orchestrator resume failed`,e)}}}}),Po={debug:(...e)=>([...e],void 0),log:(...e)=>([...e],void 0),warn:(...e)=>([...e],void 0),error:(...e)=>([...e],void 0)},Fo=class e extends Event{static EVENT_NAME=Io(`wxt:locationchange`);constructor(t,n){super(e.EVENT_NAME,{}),this.newUrl=t,this.oldUrl=n}};function Io(e){return`${t?.runtime?.id}:content:${e}`}var Lo=typeof globalThis.navigation?.addEventListener==`function`;function Ro(e){let t,n=!1;return{run(){n||(n=!0,t=new URL(location.href),Lo?globalThis.navigation.addEventListener(`navigate`,e=>{let n=new URL(e.destination.url);n.href!==t.href&&(window.dispatchEvent(new Fo(n,t)),t=n)},{signal:e.signal}):e.setInterval(()=>{let e=new URL(location.href);e.href!==t.href&&(window.dispatchEvent(new Fo(e,t)),t=e)},1e3))}}}var zo=class e{static SCRIPT_STARTED_MESSAGE_TYPE=Io(`wxt:content-script-started`);id;abortController;locationWatcher=Ro(this);constructor(e,t){this.contentScriptName=e,this.options=t,this.id=Math.random().toString(36).slice(2),this.abortController=new AbortController,this.stopOldScripts(),this.listenForNewerScripts()}get signal(){return this.abortController.signal}abort(e){return this.abortController.abort(e)}get isInvalid(){return t.runtime?.id??this.notifyInvalidated(),this.signal.aborted}get isValid(){return!this.isInvalid}onInvalidated(e){return this.signal.addEventListener(`abort`,e),()=>this.signal.removeEventListener(`abort`,e)}block(){return new Promise(()=>{})}setInterval(e,t){let n=setInterval(()=>{this.isValid&&e()},t);return this.onInvalidated(()=>clearInterval(n)),n}setTimeout(e,t){let n=setTimeout(()=>{this.isValid&&e()},t);return this.onInvalidated(()=>clearTimeout(n)),n}requestAnimationFrame(e){let t=requestAnimationFrame((...t)=>{this.isValid&&e(...t)});return this.onInvalidated(()=>cancelAnimationFrame(t)),t}requestIdleCallback(e,t){let n=requestIdleCallback((...t)=>{this.signal.aborted||e(...t)},t);return this.onInvalidated(()=>cancelIdleCallback(n)),n}addEventListener(e,t,n,r){t===`wxt:locationchange`&&this.isValid&&this.locationWatcher.run(),e.addEventListener?.(t.startsWith(`wxt:`)?Io(t):t,n,{...r,signal:this.signal})}notifyInvalidated(){this.abort(`Content script context invalidated`),Po.debug(`Content script "${this.contentScriptName}" context invalidated`)}stopOldScripts(){document.dispatchEvent(new CustomEvent(e.SCRIPT_STARTED_MESSAGE_TYPE,{detail:{contentScriptName:this.contentScriptName,messageId:this.id}})),this.options?.noScriptStartedPostMessage||window.postMessage({type:e.SCRIPT_STARTED_MESSAGE_TYPE,contentScriptName:this.contentScriptName,messageId:this.id},`*`)}verifyScriptStartedEvent(e){let t=e.detail?.contentScriptName===this.contentScriptName,n=e.detail?.messageId===this.id;return t&&!n}listenForNewerScripts(){let t=e=>{!(e instanceof CustomEvent)||!this.verifyScriptStartedEvent(e)||this.notifyInvalidated()};document.addEventListener(e.SCRIPT_STARTED_MESSAGE_TYPE,t),this.onInvalidated(()=>document.removeEventListener(e.SCRIPT_STARTED_MESSAGE_TYPE,t))}},Bo={debug:(...e)=>([...e],void 0),log:(...e)=>([...e],void 0),warn:(...e)=>([...e],void 0),error:(...e)=>([...e],void 0)};return(async()=>{try{let{main:e,...t}=No;return await e(new zo(`content`,t))}catch(e){throw Bo.error(`The content script "content" crashed on startup!`,e),e}})()})();
content;