(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[97],{4711:function(e,n,s){Promise.resolve().then(s.bind(s,6864))},6864:function(e,n,s){"use strict";s.r(n),s.d(n,{default:function(){return m}});var a=s(7437);s(6178);var c=s(3930),t=s(5309),i=s(2265),l=s(8034),o=s(7644),r=s(5507),u=s(6274),f=s(2163),x=s(6468);function d(){let{isDbOk:e,repository:n}=(0,t.y$)(),[s,c]=(0,i.useState)(l.Jd.ULTIMO_MES),[d,m]=(0,i.useState)(!0),[h,j]=(0,i.useState)(),[C,v]=(0,i.useState)({});async function y(){m(!0),await N(),m(!1)}async function N(){var e;let s=await n.totaisCaixa();console.info("loadTotals",s),j(s.valorEmCaixa),v(null===(e=s.transacoesAcumuladaPorMes)||void 0===e?void 0:e.reduce((e,n)=>(e[n.mes]=n,e),{}))}return(0,i.useEffect)(()=>{document.title="Caixa | ".concat("Gest\xe3o financeira")},[]),(0,i.useEffect)(()=>{e&&y()},[e,s]),(0,a.jsxs)("main",{className:"caixa container mt-3",children:[(0,a.jsxs)("section",{className:"d-flex justify-content-between flex-column flex-lg-row",children:[(0,a.jsx)("h1",{children:"Caixa"}),(0,a.jsxs)("div",{className:"d-flex justify-content-between gap-3",children:[(0,a.jsx)("h5",{children:"Valor em caixa: "}),d?(0,a.jsx)(x.a,{}):(0,a.jsxs)("p",{className:"d-flex flex-column",children:[u.C.toCurrency(h),(0,a.jsx)("small",{children:u.C.extenso(h,{mode:"currency",currency:{type:"BRL"}})})]})]})]}),(0,a.jsxs)("article",{className:"transacoes",children:[(0,a.jsxs)("section",{className:"forms",children:[(0,a.jsx)(o.w,{onChange:e=>c(e),value:s}),(0,a.jsx)(r.m,{})]}),(0,a.jsx)(f.B,{periodo:s,transacoesAcumuladaPorMes:C})]})]})}function m(){return(0,a.jsx)(c.A,{children:(0,a.jsx)(d,{})})}},6178:function(){}},function(e){e.O(0,[674,218,990,935,964,947,156,803,971,446,744],function(){return e(e.s=4711)}),_N_E=e.O()}]);