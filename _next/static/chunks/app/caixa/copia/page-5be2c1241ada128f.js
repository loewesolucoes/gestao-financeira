(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[888],{8203:function(e,a,n){Promise.resolve().then(n.bind(n,5187))},5507:function(e,a,n){"use strict";n.d(a,{m:function(){return c}});var l=n(7437),t=n(8034),s=n(620),o=n(2265),r=n(2840),i=n(5309);function c(e){let{transacao:a,cleanStyle:n,onClose:c,onCustomSubmit:u,onCustomDelete:m}=e;console.log("transacao",a);let{isDbOk:x,repository:f,refresh:h}=(0,i.y$)(),[p,b]=(0,o.useState)((null==a?void 0:a.valor)||(0,r.Z)()),[j,v]=(0,o.useState)((null==a?void 0:a.data)||new Date),[N,g]=(0,o.useState)(null==a?void 0:a.tipo),[y,C]=(0,o.useState)(null==a?void 0:a.local),[w,S]=(0,o.useState)(null==a?void 0:a.comentario),[Y,F]=(0,o.useState)(!1);async function D(e){e.preventDefault(),F(!0);let n={...a,valor:p,data:j,tipo:N,local:y,comentario:w};null==u?(console.info("onSubmitForm",await f.save(t.H$.TRANSACOES,n)),await h()):u(n),F(!1),c&&c()}async function k(){if(F(!0),null==a)throw Error("transacao invalida");null==m?(console.info("onDelete",await f.delete(t.H$.TRANSACOES,a.id)),h()):m(a),F(!1),c&&c()}return(0,l.jsxs)("form",{className:"transacao-form w-100 ".concat(!n&&"card"),onSubmit:D,children:[!n&&(0,l.jsx)("h5",{className:"card-header",children:"Adicione uma nova transa\xe7\xe3o"}),(0,l.jsxs)("div",{className:"d-flex flex-column px-3 py-2 gap-3",children:[(0,l.jsxs)("div",{className:"d-flex gap-3 flex-column flex-md-row w-100",children:[(0,l.jsxs)("div",{className:"flex-grow-1",children:[(0,l.jsx)("label",{htmlFor:"local",className:"form-label",children:"Local"}),(0,l.jsx)(s.I,{type:"text",className:"form-control",id:"local",onChange:e=>C(e),value:y,placeholder:"Local"})]}),(0,l.jsxs)("div",{className:"flex-grow-1",children:[(0,l.jsx)("label",{htmlFor:"comentario",className:"form-label",children:"Comentario (OBS)"}),(0,l.jsx)(s.I,{type:"text",className:"form-control",id:"comentario",onChange:e=>S(e),value:w,placeholder:"Comentario (OBS)"})]})]}),(0,l.jsxs)("div",{className:"d-flex gap-3 flex-column flex-md-row w-100",children:[(0,l.jsxs)("div",{className:"flex-grow-1",children:[(0,l.jsx)("label",{htmlFor:"valorAplicado",className:"form-label",children:"Valor aplicado"}),(0,l.jsx)(s.I,{type:"number",className:"form-control",id:"valorAplicado",groupSymbolLeft:"R$",onChange:e=>b(e),value:p})]}),(0,l.jsxs)("div",{className:"flex-grow-1",children:[(0,l.jsx)("label",{htmlFor:"data",className:"form-label",children:"Data"}),(0,l.jsx)(s.I,{type:"date",className:"form-control",id:"data",onChange:e=>v(e),value:j})]}),(0,l.jsxs)("div",{className:"flex-grow-1",children:[(0,l.jsx)("label",{htmlFor:"tipoReceita",className:"form-label",children:"Tipo de receita"}),(0,l.jsxs)("select",{className:"form-select",id:"tipoReceita",onChange:e=>g(e.target.value),defaultValue:N,children:[(0,l.jsx)("option",{value:t.$P.VARIAVEL,children:"Vari\xe1vel"}),(0,l.jsx)("option",{value:t.$P.FIXO,children:"Fixo"})]})]})]}),(0,l.jsx)(d,{isAllLoading:!x||Y,transacao:a,onClose:c,onDelete:k})]})]})}function d(e){let{isAllLoading:a,transacao:n,onClose:t,onDelete:s}=e,o="Adicionar";return null!=n&&(o="Salvar"),(0,l.jsxs)("div",{className:"d-flex gap-2 justify-content-end",children:[t&&(0,l.jsx)("button",{type:"button",onClick:t,className:"btn btn-secondary align-self-end mt-2",disabled:a,children:a?(0,l.jsxs)(l.Fragment,{children:[(0,l.jsx)("span",{className:"spinner-border spinner-border-sm","aria-hidden":"true"}),(0,l.jsxs)("span",{role:"status",children:[" ","Carregando..."]})]}):"Fechar"}),n&&s&&(0,l.jsx)("button",{type:"button",onClick:s,className:"btn btn-danger align-self-end mt-2",disabled:a,children:a?(0,l.jsxs)(l.Fragment,{children:[(0,l.jsx)("span",{className:"spinner-border spinner-border-sm","aria-hidden":"true"}),(0,l.jsxs)("span",{role:"status",children:[" ","Carregando..."]})]}):"Remover"}),(0,l.jsx)("button",{type:"submit",className:"btn btn-primary align-self-end mt-2",disabled:a,children:a?(0,l.jsxs)(l.Fragment,{children:[(0,l.jsx)("span",{className:"spinner-border spinner-border-sm","aria-hidden":"true"}),(0,l.jsxs)("span",{role:"status",children:[" ","Carregando..."]})]}):o})]})}},5187:function(e,a,n){"use strict";n.r(a),n.d(a,{default:function(){return j}});var l=n(7437),t=n(3930);n(6486);var s=n(7907),o=n(2151),r=n.n(o),i=n(5309),c=n(2265),d=n(8034),u=n(6468),m=n(6274),x=n(620),f=n(2021),h=n(5507),p=n(4468);function b(){let e=(0,s.useSearchParams)().get("month"),a=r()(e,"YYYY-MM"),n=(0,s.useRouter)(),{isDbOk:t,repository:o}=(0,i.y$)(),[b,j]=(0,c.useState)(!0),[v,N]=(0,c.useState)(new Date),[g,y]=(0,c.useState)([]),[C,w]=(0,c.useState)(),[S,Y]=(0,c.useState)(!1);async function F(){j(!0);let e=await o.listByMonth(d.H$.TRANSACOES,a.get("month"),a.get("year"));e.forEach(e=>{delete e.id,delete e.createdDate,delete e.updatedDate,e.data=new Date}),console.log(e),y(e),j(!1)}async function D(){j(!0),confirm("voc\xea tem certeza?")&&(await o.saveAll(d.H$.TRANSACOES,[...g]),j(!1),n.push("/caixa"))}function k(e){let a=g.indexOf(e),n=[...g];n.splice(a,1),y(n)}return(0,c.useEffect)(()=>{t&&F()},[t]),(0,l.jsxs)("main",{className:"caixa container mt-3 d-flex flex-column gap-3",children:[(0,l.jsxs)("h1",{children:["Copiar transa\xe7\xf5es do m\xeas: ",a.format("MMMM YYYY")]}),b?(0,l.jsx)(u.a,{className:"align-self-center my-5"}):(0,l.jsxs)(l.Fragment,{children:[(0,l.jsx)("div",{className:"d-flex justify-content-center justify-content-lg-end",children:(0,l.jsx)("div",{className:"d-flex gap-3 flex-column flex-lg-row",children:(0,l.jsx)("button",{type:"button",className:"btn btn-dark",onClick:e=>Y(!0),children:"Adicionar nova"})})}),(0,l.jsx)(p.Z5,{onDragEnd:function(e){var a;console.log(arguments);let n=[...g],l=null===(a=e.destination)||void 0===a?void 0:a.index,t=e.source.index,s=n[t];n.splice(t,1),n.splice(l,0,s),y(n)},children:(0,l.jsx)(p.bK,{droppableId:"droppable",children:(e,a)=>(0,l.jsxs)(l.Fragment,{children:[(0,l.jsx)("ul",{...e.droppableProps,className:"list-group ".concat(a.isDraggingOver&&"text-bg-dark"),ref:e.innerRef,children:g.map((e,a)=>(0,l.jsx)(p._l,{draggableId:"".concat(e.local,":").concat(a),index:a,children:(a,n)=>{var t,s;return(0,l.jsxs)("li",{ref:a.innerRef,...a.draggableProps,...a.dragHandleProps,style:a.draggableProps.style,className:"list-group-item ".concat(!(null===(t=e.valor)||void 0===t?void 0:t.toNumber())&&"list-group-item-warning"," ").concat(n.isDragging&&"active"),children:[(0,l.jsxs)("div",{className:"d-flex w-100 justify-content-between gap-3",children:[(0,l.jsx)("h5",{children:e.local}),(0,l.jsxs)("div",{className:"d-flex justify-content-between gap-3",children:[(0,l.jsx)("small",{children:r()(e.data).format("DD/MM/YY")}),(0,l.jsx)("small",{className:e.tipo===d.$P.FIXO?"text-primary":"text-info",children:e.tipo===d.$P.FIXO?"Fixo":"Vari\xe1vel"})]})]}),(0,l.jsxs)("div",{className:"d-flex w-100 justify-content-between gap-3",children:[(0,l.jsx)("p",{children:(null===(s=e.valor)||void 0===s?void 0:s.toNumber())?m.C.toCurrency(e.valor):"sem valor"}),(0,l.jsxs)("div",{className:"d-flex gap-3",children:[(0,l.jsx)("button",{className:"btn btn-secondary",onClick:a=>w(e),children:"Editar"}),(0,l.jsx)("button",{className:"btn btn-danger",onClick:a=>k(e),children:"Remover"})]})]}),(0,l.jsx)("small",{children:e.comentario})]})}},"".concat(e.local,":").concat(a)))}),e.placeholder]})})}),(0,l.jsx)("div",{className:"d-flex justify-content-center justify-content-lg-end",children:(0,l.jsxs)("div",{className:"d-flex gap-3 flex-column flex-lg-row",children:[(0,l.jsxs)("div",{className:"form-floating",children:[(0,l.jsx)(x.I,{type:"month",className:"form-control",id:"data",placeholder:"M\xeas a aplicar",value:v,onChange:e=>N(e)}),(0,l.jsx)("label",{htmlFor:"data",className:"form-label",children:"M\xeas a aplicar"})]}),(0,l.jsx)("button",{type:"button",className:"btn btn-primary",onClick:e=>D(),children:"Copiar transa\xe7\xf5es para o m\xeas"})]})})]}),C&&(0,l.jsx)(f.u,{hideFooter:!0,onClose:()=>w(null),title:"Detalhes da transa\xe7\xe3o: ".concat(null==C?void 0:C.local),children:(0,l.jsx)(h.m,{transacao:C,cleanStyle:!0,onClose:()=>w(null),onCustomSubmit:e=>(function(e,a){let n=g.indexOf(e),l=[...g];l[n]=a,y(l)})(C,e),onCustomDelete:e=>k(C)})}),S&&(0,l.jsx)(f.u,{hideFooter:!0,onClose:()=>Y(!1),title:"Adicionar transa\xe7\xe3o",children:(0,l.jsx)(h.m,{cleanStyle:!0,onClose:()=>Y(!1),onCustomSubmit:e=>(function(e){let a=[...g];a.push(e),y(a)})(e),onCustomDelete:e=>Y(!1)})})]})}function j(){return(0,l.jsx)(t.A,{children:(0,l.jsx)(b,{})})}},620:function(e,a,n){"use strict";n.d(a,{I:function(){return r}});var l=n(7437),t=n(2840),s=n(2151),o=n.n(s);function r(e){let{onChange:a,isNumber:n,groupSymbolLeft:s,groupSymbolRight:r,isPercent:i,value:c,...d}=e,u="number"===e.type||n,m="date"===e.type,x="month"===e.type,f=u?function(e,a){let{isPercent:n}=a;return null==e||isNaN(e.toNumber())?"":n?e.times(100).toNumber():e.toNumber()}(c,{isPercent:i}):m?o()(c).format("YYYY-MM-DD"):x?o()(c).format("YYYY-MM"):c||"",h=(0,l.jsx)("input",{className:"form-control",onChange:function(e){let{value:n}=e.target;(a||function(){})(i?(0,t.Z)(n).div(100):u?(0,t.Z)(n):m?o()(n,"YYYY-MM-DD").toDate():x?o()(n,"YYYY-MM").toDate():n)},value:f,...d});return s||r?(0,l.jsxs)("div",{className:"input-group mb-3",children:[s&&(0,l.jsx)("span",{className:"input-group-text",children:s}),h,r&&(0,l.jsx)("span",{className:"input-group-text",children:r})]}):h}},2021:function(e,a,n){"use strict";n.d(a,{u:function(){return s}});var l=n(7437),t=n(2265);function s(e){let{children:a,title:n,onClose:s,hideFooter:o}=e,[r,i]=(0,t.useState)(!0);function c(){i(!1),s&&s()}function d(e){var a;(null==e?void 0:null===(a=e.target)||void 0===a?void 0:a.id)==="modal"&&c()}function u(e){(null==e?void 0:e.key)==="Escape"&&c()}return(0,t.useEffect)(()=>(document.addEventListener("keydown",u,!1),()=>{document.removeEventListener("keydown",u,!1)}),[]),(0,l.jsxs)(l.Fragment,{children:[(0,l.jsx)("div",{className:"modal modal-lg fade ".concat(r&&"show"),id:"modal",tabIndex:-1,"aria-labelledby":"exampleModalLabel","aria-hidden":"true",style:{zIndex:99,display:r?"block":"none"},onClick:d,children:(0,l.jsx)("div",{className:"modal-dialog",children:(0,l.jsxs)("div",{className:"modal-content",children:[(0,l.jsxs)("div",{className:"modal-header",children:[(0,l.jsx)("h5",{className:"modal-title",id:"exampleModalLabel",children:n}),(0,l.jsx)("button",{type:"button",className:"btn-close","data-bs-dismiss":"modal","aria-label":"Close",onClick:c})]}),(0,l.jsx)("div",{className:"modal-body",children:a}),!o&&(0,l.jsx)("div",{className:"modal-footer",children:(0,l.jsx)("button",{type:"button",className:"btn btn-secondary","data-bs-dismiss":"modal",onClick:c,children:"Close"})})]})})}),(0,l.jsx)("div",{className:"modal-backdrop fade ".concat(r&&"show"),style:{zIndex:98},onClick:d})]})}},6274:function(e,a,n){"use strict";n.d(a,{C:function(){return r}});var l=n(2840),t=n(6947),s=n.n(t);let o=new Intl.NumberFormat("pt-br",{style:"currency",currency:"BRL"});class r{static extenso(e,a){var n;return(e instanceof l.Z&&(e=null==e?void 0:null===(n=e.integerValue())||void 0===n?void 0:n.toNumber()),null==e||isNaN(e)||!isFinite(e))?"":s()(e,a)}static toCurrency(e,a){return("string"==typeof e&&(e=Number(e)),e instanceof l.Z&&(e=null==e?void 0:e.toNumber()),null==e||isNaN(e)||!isFinite(e))?"":o.format(e)}}},6486:function(){}},function(e){e.O(0,[674,218,990,216,935,964,947,454,156,971,69,744],function(){return e(e.s=8203)}),_N_E=e.O()}]);