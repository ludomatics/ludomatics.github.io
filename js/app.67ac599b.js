(function(e){function t(t){for(var n,r,o=t[0],c=t[1],l=t[2],m=0,v=[];m<o.length;m++)r=o[m],Object.prototype.hasOwnProperty.call(i,r)&&i[r]&&v.push(i[r][0]),i[r]=0;for(n in c)Object.prototype.hasOwnProperty.call(c,n)&&(e[n]=c[n]);u&&u(t);while(v.length)v.shift()();return s.push.apply(s,l||[]),a()}function a(){for(var e,t=0;t<s.length;t++){for(var a=s[t],n=!0,o=1;o<a.length;o++){var c=a[o];0!==i[c]&&(n=!1)}n&&(s.splice(t--,1),e=r(r.s=a[0]))}return e}var n={},i={app:0},s=[];function r(t){if(n[t])return n[t].exports;var a=n[t]={i:t,l:!1,exports:{}};return e[t].call(a.exports,a,a.exports,r),a.l=!0,a.exports}r.m=e,r.c=n,r.d=function(e,t,a){r.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:a})},r.r=function(e){"undefined"!==typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},r.t=function(e,t){if(1&t&&(e=r(e)),8&t)return e;if(4&t&&"object"===typeof e&&e&&e.__esModule)return e;var a=Object.create(null);if(r.r(a),Object.defineProperty(a,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var n in e)r.d(a,n,function(t){return e[t]}.bind(null,n));return a},r.n=function(e){var t=e&&e.__esModule?function(){return e["default"]}:function(){return e};return r.d(t,"a",t),t},r.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},r.p="/";var o=window["webpackJsonp"]=window["webpackJsonp"]||[],c=o.push.bind(o);o.push=t,o=o.slice();for(var l=0;l<o.length;l++)t(o[l]);var u=c;s.push([0,"chunk-vendors"]),a()})({0:function(e,t,a){e.exports=a("56d7")},"0213":function(e,t,a){"use strict";var n=a("21a9"),i=a.n(n);i.a},"21a9":function(e,t,a){},"27f6":function(e){e.exports=JSON.parse('{"institucion":"UNAM","annio":null,"area":"COMIPEMS","tipo":"bachillerato","numOpciones":4,"numReactivos":128,"materias":[{"nombre":"Biología","inicio":1,"fin":12,"numReactivos":12},{"nombre":"Habilidad Mat.","inicio":13,"fin":28,"numReactivos":16},{"nombre":"Química","inicio":29,"fin":40,"numReactivos":12},{"nombre":"Física","inicio":41,"fin":52,"numReactivos":12},{"nombre":"Geografía","inicio":53,"fin":64,"numReactivos":12},{"nombre":"Historia","inicio":65,"fin":76,"numReactivos":12},{"nombre":"FORCE","inicio":77,"fin":88,"numReactivos":12},{"nombre":"Español","inicio":89,"fin":100,"numReactivos":12},{"nombre":"Matemáticas","inicio":101,"fin":112,"numReactivos":12},{"nombre":"Habilidad Verbal","inicio":113,"fin":128,"numReactivos":16}],"respuestas":["C","C","B","A","D","B","C","D","C","D","C","D","B","A","D","C","A","A","B","D","C","C","C","A","D","B","C","A","D","C","D","C","A","B","B","D","C","A","C","A","A","A","C","C","C","D","B","A","B","D","B","A","A","D","A","B","D","B","B","A","C","C","A","C","B","C","B","C","D","B","A","D","C","C","C","A","C","A","B","C","D","C","C","B","A","A","A","B","D","B","A","D","C","B","C","C","D","C","D","B","D","A","B","C","A","B","C","A","B","C","A","D","D","B","C","B","D","C","C","A","B","D","B","B","C","C","A","C"]}')},"56d7":function(e,t,a){"use strict";a.r(t);a("e260"),a("e6cf"),a("cca6"),a("a79d");var n=a("2b0e"),i=function(){var e=this,t=e.$createElement,a=e._self._c||t;return a("div",{attrs:{id:"app"}},[e._m(0),a("router-view",{key:e.$route.path})],1)},s=[function(){var e=this,t=e.$createElement,a=e._self._c||t;return a("nav",{staticClass:"navbar navbar-expand-lg navbar-light bg-light"},[a("button",{staticClass:"navbar-toggler",attrs:{type:"button","data-toggle":"collapse","data-target":"#navbarTogglerDemo03","aria-controls":"navbarTogglerDemo03","aria-expanded":"false","aria-label":"Toggle navigation"}},[a("span",{staticClass:"navbar-toggler-icon"})]),a("a",{staticClass:"navbar-brand",attrs:{href:"#"}},[e._v("Ludomatics")]),a("div",{staticClass:"collapse navbar-collapse",attrs:{id:"navbarTogglerDemo03"}},[a("ul",{staticClass:"navbar-nav mr-auto mt-2 mt-lg-0"},[a("li",{staticClass:"nav-item active"},[a("a",{staticClass:"nav-link",attrs:{href:"#"}},[e._v("Horedi "),a("span",{staticClass:"sr-only"},[e._v("(current)")])])]),a("li",{staticClass:"nav-item"},[a("a",{staticClass:"nav-link",attrs:{href:"#"}},[e._v("Nosotros")])])]),a("ul",{staticClass:"navbar-nav mt-2 mt-lg-0"},[a("li",{staticClass:"nav-item"},[a("a",{staticClass:"nav-link",attrs:{href:"#"}},[e._v("Simulador")])])])])])}],r={name:"App"},o=r,c=a("2877"),l=Object(c["a"])(o,i,s,!1,null,null,null),u=l.exports,m=a("8c4f"),v=a("e399"),d=a.n(v),p=(a("4989"),a("ab8b"),a("2068"),function(){var e=this,t=e.$createElement;e._self._c;return e._m(0)}),f=[function(){var e=this,t=e.$createElement,a=e._self._c||t;return a("div",{staticClass:"container"},[a("div",{staticClass:"row mt-4"},[a("div",{staticClass:"col-md-12"},[a("h1",[e._v("Error 404!")]),a("br"),a("p",[e._v("La página que intentas visitar no existe, por favor revisa el URL.")])])])])}],C={},h=C,b=Object(c["a"])(h,p,f,!1,null,null,null),A=b.exports,g=function(){var e=this,t=e.$createElement;e._self._c;return e._m(0)},D=[function(){var e=this,t=e.$createElement,a=e._self._c||t;return a("div",{staticClass:"container"},[a("div",{staticClass:"row mt-4"},[a("div",{staticClass:"col-md-12"},[a("h1",[e._v("Bienvenido")]),a("br"),a("p",[e._v("Este es el inicio del ansheet.")])])])])}],_={},B=_,x=Object(c["a"])(B,g,D,!1,null,null,null),y=x.exports,P=function(){var e=this,t=e.$createElement,a=e._self._c||t;return a("div",{staticClass:"container-xl py-4"},[a("div",{staticClass:"row"},[a("div",{staticClass:"col-md-12"},[a("h5",[e._v("Examen de simulación "+e._s(e.examen.institucion)+" "+e._s(e.examen.area)+" "+e._s(e.examen.annio))])])]),e.examenTerminado?a("div",[a("div",{staticClass:"row"},[a("div",{staticClass:"col-md-6"},[a("h5",[e._v(e._s(e.datosAlumno.nombre))])]),a("div",{staticClass:"col-md-6 text-center"},[a("h5",[e._v("Aciertos totales: "+e._s(e.aciertos))])])]),e._l(e.aciertosPorMateria,(function(t){return a("div",{key:t.nombre,staticClass:"row"},[a("div",{staticClass:"col-md-2"},[a("h6",[e._v(e._s(t.nombre))])]),a("div",{staticClass:"col-md-8"},[a("div",{staticClass:"progress"},[a("div",{staticClass:"progress-bar",style:{width:t.porcentaje+"%"},attrs:{role:"progressbar","aria-valuenow":"25","aria-valuemin":"0","aria-valuemax":"100"}},[e._v(" "+e._s(t.aciertos)+" / "+e._s(t.numReactivos)+" ")])])])])}))],2):a("form",{staticClass:"pb-1 pt-2"},[a("div",{staticClass:"row"},[a("div",{staticClass:"col-md-6 col-sm-12 mb-2"},[a("input",{directives:[{name:"model",rawName:"v-model",value:e.datosAlumno.nombre,expression:"datosAlumno.nombre"}],staticClass:"form-control",attrs:{type:"text",placeholder:"Nombre"},domProps:{value:e.datosAlumno.nombre},on:{input:function(t){t.target.composing||e.$set(e.datosAlumno,"nombre",t.target.value)}}})])])]),a("div",{staticClass:"row mt-3"},[a("div",{staticClass:"col-md-12 multicol"},[a("ol",e._l(e.examen.numReactivos,(function(t){return a("div",{key:t},[e._l(e.examen.materias,(function(n){return a("div",{key:n.nombre},[t==n.inicio?a("label",[e._v(e._s(n.nombre))]):e._e()])})),a("li",[e._l(e.examen.numOpciones,(function(n){return a("div",{key:n,staticClass:"d-inline mr-1"},[a("label",{staticClass:"mr-1"},[e._v(e._s(String.fromCharCode(64+n)))]),e.respuestas?a("input",{directives:[{name:"model",rawName:"v-model",value:e.respuestas[t-1],expression:"respuestas[i-1]"}],attrs:{type:"radio",name:"test-"+t,disabled:e.examenTerminado||e.answers},domProps:{value:String.fromCharCode(64+n),checked:e._q(e.respuestas[t-1],String.fromCharCode(64+n))},on:{change:function(a){e.$set(e.respuestas,t-1,String.fromCharCode(64+n))}}}):e._e()])})),e.examenTerminado&&e.aciertoPorPregunta[t-1]?a("label",[e._v("✔")]):e._e(),e.examenTerminado&&!e.aciertoPorPregunta[t-1]?a("label",[e._v("✘")]):e._e(),e.showAnswers?a("label",{staticClass:"ml-1"},[a("small",[e._v(e._s(e.examen.respuestas[t-1]))])]):e._e()],2)],2)})),0)]),a("div",{staticClass:"col-md-4 offset-md-4 text-center mt-2"},[a("button",{staticClass:"btn btn-outline-primary btn-block",attrs:{type:"button"},on:{click:e.terminar}},[e._v("Terminar")])])])])},w=[],O=(a("cb29"),a("4de4"),a("fb6a"),a("b85c")),R={name:"Examen",props:["examen"],computed:{dimensionRespuestas:function(){var e=this.respuestas.filter((function(e){return""!==e})).length;return e},debug:function(){return"debug"===this.mode},master:function(){return"master"===this.mode},answers:function(){return"answers"===this.mode},showAnswers:function(){return!!this.examenTerminado&&(this.master||this.debug)}},data:function(){return{examenTerminado:!1,respuestas:null,datosAlumno:{nombre:""},aciertos:0,aciertosPorMateria:[],aciertoPorPregunta:[],mode:this.$route.params.debug}},created:function(){this.respuestas=new Array(this.examen.numReactivos).fill("");var e,t=Object(O["a"])(this.examen.materias);try{for(t.s();!(e=t.n()).done;){var a=e.value,n={nombre:a.nombre,numReactivos:a.numReactivos,inicio:a.inicio,fin:a.fin,aciertos:0,porcentaje:0};this.aciertosPorMateria.push(n)}}catch(o){t.e(o)}finally{t.f()}if(!0===this.debug){for(var i in this.respuestas){var s=Math.floor(4*Math.random())+1;this.respuestas[i]=String.fromCharCode(64+s)}this.datosAlumno.nombre="Francesco Paolo"}if(!0===this.answers)for(var r in this.respuestas)this.respuestas[r]=this.examen.respuestas[r]},beforeDestroy:function(){this.examenTerminado=!1,this.respuestas=null,this.aciertos=0,this.aciertosPorMateria=[],this.aciertoPorPregunta=[],this.datosAlumno.nombre=""},methods:{terminar:function(){this.datosAlumnoForm()?this.todasLasPreguntasContestadas()?(this.calificarExamen(),this.examenTerminado=!0):this.$toast.warning("Contesta todas las preguntas","OJO",{icon:"icon-person",position:"topCenter"}):this.$toast.warning("Ingresa tu nombre completo","OJO",{icon:"icon-person",position:"topCenter"})},calificarExamen:function(){for(var e=0;e<this.examen.respuestas.length;e++)this.examen.respuestas[e]===this.respuestas[e]?(this.aciertos++,this.aciertoPorPregunta.push(!0)):this.aciertoPorPregunta.push(!1);this.calificarAciertosPorMateria()},calificarAciertosPorMateria:function(){var e,t=[],a=Object(O["a"])(this.examen.materias);try{for(a.s();!(e=a.n()).done;){var n=e.value,i=this.aciertoPorPregunta.slice(n.inicio-1,n.fin),s=i.filter((function(e){return!0===e}));t.push(s.length)}}catch(u){a.e(u)}finally{a.f()}for(var r in this.aciertosPorMateria)this.aciertosPorMateria[r].aciertos=t[r];var o,c=Object(O["a"])(this.aciertosPorMateria);try{for(c.s();!(o=c.n()).done;){var l=o.value;l.porcentaje=l.aciertos/l.numReactivos*100}}catch(u){c.e(u)}finally{c.f()}},datosAlumnoForm:function(){return!(this.datosAlumno.nombre.length<3)},todasLasPreguntasContestadas:function(){return this.dimensionRespuestas===this.examen.numReactivos}}},M=R,j=(a("0213"),Object(c["a"])(M,P,w,!1,null,"1036bf96",null)),E=j.exports,T=a("27f6"),k=a("fb4f");n["a"].config.productionTip=!1;var S=new m["a"]({routes:[{path:"/",component:y},{path:"/comipems/:debug?",component:E,props:{examen:T}},{path:"/universidad/:debug?",component:E,props:{default:!0,examen:k}},{path:"*",component:A}]});n["a"].use(m["a"]),n["a"].use(d.a),new n["a"]({render:function(e){return e(u)},router:S}).$mount("#app")},fb4f:function(e){e.exports=JSON.parse('{"institucion":"IPN","annio":null,"area":null,"tipo":"licenciatura","numOpciones":4,"numReactivos":130,"materias":[{"nombre":"Matemáticas","inicio":1,"fin":50,"numReactivos":50},{"nombre":"Español","inicio":51,"fin":90,"numReactivos":40},{"nombre":"Biología","inicio":91,"fin":100,"numReactivos":10},{"nombre":"Química","inicio":101,"fin":115,"numReactivos":15},{"nombre":"Física","inicio":116,"fin":130,"numReactivos":15}],"respuestas":["B","C","C","B","D","D","A","B","D","B","C","D","A","A","A","C","B","B","A","D","D","C","A","B","C","A","D","D","B","D","D","A","D","D","B","C","D","A","B","D","A","D","A","D","B","D","C","C","D","D","C","C","A","C","C","D","D","A","A","A","B","B","D","B","C","A","A","B","D","C","B","C","D","A","D","C","C","C","D","C","D","D","C","B","A","A","C","D","D","C","A","A","B","A","D","A","D","A","B","D","D","C","A","D","C","C","B","D","C","C","D","B","B","C","C","C","A","C","B","B","A","D","D","C","A","C","C","B","C","D"]}')}});
//# sourceMappingURL=app.67ac599b.js.map