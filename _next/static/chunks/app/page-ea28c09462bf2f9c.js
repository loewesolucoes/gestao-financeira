(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[931],{6338:function(e,n,s){Promise.resolve().then(s.bind(s,8836))},8836:function(e,n,s){"use strict";s.r(n),s.d(n,{default:function(){return d}});var a=s(7437);s(4612);var c=s(8792),t=s(2265),i=s(3930),r=s(3210),l=s(6468);function o(){let{isDbOk:e,repository:n}=(0,r.y$)(),[s,i]=(0,t.useState)(!0),[o,d]=(0,t.useState)([]);async function u(){i(!0);let e=await n.list();console.log(e),d(e),i(!1)}return(0,t.useEffect)(()=>{e&&u()},[e]),(0,a.jsx)("main",{className:"main container",children:(0,a.jsx)("section",{className:"home m-5",children:s?(0,a.jsx)("section",{className:"cards",children:(0,a.jsx)(l.a,{})}):0===o.length?(0,a.jsx)("div",{className:"alert alert-info",role:"alert",children:"Nenhuma simula\xe7\xe3o encontrada"}):(0,a.jsx)("section",{className:"cards",children:o.map(e=>(0,a.jsx)("div",{className:"card m-3",children:(0,a.jsxs)("div",{className:"card-body",children:[(0,a.jsx)("h5",{className:"card-title",children:e.id.toNumber()}),(0,a.jsx)(c.default,{href:"/orcamentos?sim=".concat(e.id),className:"btn btn-secondary",children:"Ver simula\xe7\xe3o"})]})},e.id.toNumber()))})})})}function d(){return(0,a.jsx)(i.A,{children:(0,a.jsx)(o,{})})}},4612:function(){}},function(e){e.O(0,[218,990,394,156,971,69,744],function(){return e(e.s=6338)}),_N_E=e.O()}]);