(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[931],{6338:function(e,s,a){Promise.resolve().then(a.bind(a,8836))},620:function(e,s,a){"use strict";a.d(s,{I:function(){return t}});var n=a(7437),l=a(2840),r=a(2151),c=a.n(r);function t(e){let{onChange:s,isNumber:a,groupSymbolLeft:r,groupSymbolRight:t,isPercent:i,value:d,...o}=e,u="number"===e.type||a,m="date"===e.type,x="month"===e.type,h=u?function(e,s){let{isPercent:a}=s;return null==e||isNaN(e.toNumber())?"":a?e.times(100).toNumber():e.toNumber()}(d,{isPercent:i}):m?c()(d).format("YYYY-MM-DD"):x?c()(d).format("YYYY-MM"):d||"",f=(0,n.jsx)("input",{className:"form-control",onChange:function(e){let{value:a}=e.target;(s||function(){})(i?(0,l.Z)(a).div(100):u?(0,l.Z)(a):m?c()(a,"YYYY-MM-DD").toDate():x?c()(a,"YYYY-MM").toDate():a)},value:h,...o});return r||t?(0,n.jsxs)("div",{className:"input-group mb-3",children:[r&&(0,n.jsx)("span",{className:"input-group-text",children:r}),f,t&&(0,n.jsx)("span",{className:"input-group-text",children:t})]}):f}},8836:function(e,s,a){"use strict";a.r(s),a.d(s,{default:function(){return u}});var n=a(7437);a(4612);var l=a(2265),r=a(3930),c=a(5309),t=a(6468),i=a(6274),d=a(620);function o(){let{isDbOk:e,repository:s}=(0,c.y$)(),[a,r]=(0,l.useState)(new Date),[o,u]=(0,l.useState)(!0),[m,x]=(0,l.useState)({});async function h(){u(!0);let e=await s.totais(a);console.log(e),x(e),u(!1)}(0,l.useEffect)(()=>{e&&h()},[e,a]);let{despesas:f,receitas:N,valorEmCaixa:j}=m,p=null==N?void 0:N.minus(null==f?void 0:f.abs());return(0,n.jsx)("main",{className:"main container",children:(0,n.jsx)("section",{className:"home m-5",children:o?(0,n.jsx)("section",{className:"cards",children:(0,n.jsx)(t.a,{})}):0===Object.keys(m).length?(0,n.jsx)("div",{className:"alert alert-info",role:"alert",children:"Nenhum dado encontrado"}):(0,n.jsxs)("section",{className:"d-flex flex-column gap-3",children:[(0,n.jsxs)("section",{className:"card border-primary",children:[(0,n.jsx)("h4",{className:"card-header",children:"Caixa Geral"}),(0,n.jsxs)("div",{className:"card-body",children:[(0,n.jsxs)("div",{className:"d-flex gap-3",children:[(0,n.jsx)("h5",{children:"Valor em caixa"}),(0,n.jsxs)("div",{className:"d-flex flex-column",children:[(0,n.jsx)("p",{className:"m-0",children:i.C.toCurrency(j)}),(0,n.jsx)("small",{children:i.C.extenso(j)})]})]}),(0,n.jsxs)("div",{className:"d-flex gap-3 mt-3",children:[(0,n.jsx)("h5",{children:"M\xeas atual"}),(0,n.jsxs)("div",{className:"form-floating",children:[(0,n.jsx)(d.I,{type:"month",className:"form-control",id:"data",placeholder:"M\xeas a aplicar",value:a,onChange:e=>r(e)}),(0,n.jsx)("label",{htmlFor:"data",className:"form-label",children:"M\xeas a aplicar"})]})]})]})]}),(0,n.jsxs)("section",{className:"card border-dark",children:[(0,n.jsx)("h4",{className:"card-header",children:"Caixa Mensal"}),(0,n.jsxs)("div",{className:"card-body",children:[(0,n.jsxs)("div",{className:"d-flex gap-3",children:[(0,n.jsx)("h5",{children:"Receitas:"}),(0,n.jsxs)("div",{className:"d-flex flex-column",children:[(0,n.jsx)("p",{className:"m-0",children:i.C.toCurrency(N)}),(0,n.jsx)("small",{children:i.C.extenso(N)})]})]}),(0,n.jsxs)("div",{className:"d-flex gap-3",children:[(0,n.jsx)("h5",{children:"Depesas:"}),(0,n.jsxs)("div",{className:"d-flex flex-column",children:[(0,n.jsx)("p",{className:"m-0",children:i.C.toCurrency(f)}),(0,n.jsx)("small",{children:i.C.extenso(f)})]})]}),(0,n.jsxs)("div",{className:"d-flex gap-3",children:[(0,n.jsx)("h5",{children:"Sobra:"}),(0,n.jsxs)("div",{className:"d-flex flex-column",children:[(0,n.jsx)("p",{className:"m-0",children:i.C.toCurrency(p)}),(0,n.jsx)("small",{children:i.C.extenso(p)})]})]})]})]})]})})})}function u(){return(0,n.jsx)(r.A,{children:(0,n.jsx)(o,{})})}},6274:function(e,s,a){"use strict";a.d(s,{C:function(){return t}});var n=a(2840),l=a(6947),r=a.n(l);let c=new Intl.NumberFormat("pt-br",{style:"currency",currency:"BRL"});class t{static extenso(e,s){var a;return(e instanceof n.Z&&(e=null==e?void 0:null===(a=e.integerValue())||void 0===a?void 0:a.toNumber()),null==e||isNaN(e)||!isFinite(e))?"":r()(e,s)}static toCurrency(e,s){return("string"==typeof e&&(e=Number(e)),e instanceof n.Z&&(e=null==e?void 0:e.toNumber()),null==e||isNaN(e)||!isFinite(e))?"":c.format(e)}}},4612:function(){}},function(e){e.O(0,[674,218,990,935,964,947,156,971,69,744],function(){return e(e.s=6338)}),_N_E=e.O()}]);