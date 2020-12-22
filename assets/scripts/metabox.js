"use strict";!function(){var u,n,p,i,d,o,l,r,c,s,m,a,h,v;"undefined"!=typeof wp&&(u=wp.i18n.__,null!==(n=document.querySelector("#social-planner-metabox > .inside"))&&void 0!==window.socialPlannerMetabox&&(p=window.socialPlannerMetabox,i=function(e,t){var n=document.createElement("p");for(n.classList.add("social-planner-warning"),n.textContent=t;e.firstChild;)e.removeChild(e.lastChild);e.appendChild(n)},d=function(e,t){var n=function(e){e=e||Date.now(),p.offset=parseInt(p.offset)||0;var t=(new Date).getTimezoneOffset(),t=Date.now()+60*t*1e3;return e=new Date(t+1e3*p.offset),new Date(e)}(),a={hour:("0"+n.getHours()).slice(-2),minute:("0"+n.getMinutes()).slice(-2)},n=p.meta+"["+t+"]",l=document.createElement("input");l.setAttribute("type","text"),l.setAttribute("name",n+"[hour]"),l.value=a.hour,e.appendChild(l),l.addEventListener("change",function(){return l.value.match(/^\d+$/)?(l.value=("0"+parseInt(l.value)).slice(-2),23<l.value||l.value<0?l.value=a.hour:void(a.hour=l.value)):l.value=a.hour});t=document.createElement("span");t.textContent=":",e.appendChild(t);var r=document.createElement("input");r.setAttribute("type","text"),r.setAttribute("name",n+"[minute]"),r.value=a.minute,e.appendChild(r),r.addEventListener("change",function(){return r.value.match(/^\d+$/)?(r.value=("0"+r.value).slice(-2),59<r.value||r.value<0?r.value=a.minute:void(a.minute=r.value)):r.value=a.minute})},o=function(e,t,n){var a=document.createElement("option");return a.textContent=t,a.value=n||"",e.appendChild(a),a},l=function(e,t,n){var a=document.createElement("div");a.classList.add("social-planner-snippet"),e.appendChild(a);var l=p.meta+"["+t+"]",e=document.createElement("textarea");e.classList.add("social-planner-excerpt"),e.setAttribute("placeholder",u("Social networks summary","social-planner")),e.setAttribute("name",l+"[excerpt]"),n.result.sent&&e.setAttribute("readonly","readonly"),n.schedule&&e.setAttribute("readonly","readonly"),n.task.excerpt&&(e.textContent=n.task.excerpt),a.appendChild(e),function(e,t,n){if(wp.media){var a=document.createElement("figure");a.classList.add("social-planner-poster"),e.appendChild(a);var t=p.meta+"["+t+"]",l=document.createElement("button");l.classList.add("choose"),l.setAttribute("type","button"),l.textContent="+",n.result.sent||n.schedule||a.appendChild(l);var r=document.createElement("img"),s=document.createElement("input");s.setAttribute("type","hidden"),s.setAttribute("name",t+"[attachment]"),n.task.attachment&&(s.value=n.task.attachment),a.appendChild(s);var i=document.createElement("input");i.setAttribute("type","hidden"),i.setAttribute("name",t+"[thumbnail]"),n.task.thumbnail&&(i.value=n.task.thumbnail,r.setAttribute("src",n.task.thumbnail),a.appendChild(r)),a.appendChild(i),l.addEventListener("click",function(){var n=wp.media({title:u("Choose poster image","social-planner"),multiple:!1});n.on("select",function(){var e=n.state().get("selection").first().toJSON(),t=e.url;s.value=e.id,void 0!==e.sizes.thumbnail&&(t=e.sizes.thumbnail.url),i.value=t,r.setAttribute("src",t),r.parentNode||a.insertBefore(r,l)}),n.open()});t=document.createElement("button");t.classList.add("remove"),t.setAttribute("type","button"),n.result.sent||n.schedule||a.appendChild(t),t.addEventListener("click",function(e){e.stopPropagation(),s.value="",i.value="",a.removeChild(r)})}}(a,t,n)},r=function(e){delete p.tasks[e],v()},c=function(e,t,n){if(!p.action||!p.nonce)return i(e,u("Incorrect configuration of metbox options.","social-planner"));var a=document.getElementById("post_ID");if(null===a)return i(e,u("Post ID element is not defined.","social-planner"));var l=document.createElement("span");l.classList.add("spinner","is-active"),e.appendChild(l);l=new window.FormData;l.append("handler","cancel"),l.append("action",p.action),l.append("nonce",p.nonce),l.append("post",a.value),l.append("key",t);var r=new XMLHttpRequest;r.open("POST",ajaxurl),r.onerror=function(){return i(e,u("Something went wrong.","social-planner"))},r.onload=function(){if(!JSON.parse(r.responseText).success)return i(e,u("Something went wrong.","social-planner"));"function"==typeof n&&n()},r.send(l)},s=function(e,t,n){var a=document.createElement("div");if(a.classList.add("social-planner-scheduler"),e.appendChild(a),n.result.sent)return function(e,t){var n=document.createElement("span");n.classList.add("social-planner-calendar"),e.appendChild(n);n=document.createElement("span");n.textContent=u("Sent:","social-planner"),e.appendChild(n);n=document.createElement("strong");n.textContent=t.result.sent,e.appendChild(n)}(a,n);if(n.schedule)return function(t,n,e){var a=document.createElement("span");a.classList.add("social-planner-clock"),t.appendChild(a);a=document.createElement("span");a.textContent=u("Scheduled for:","social-planner"),t.appendChild(a);a=document.createElement("strong");if(a.textContent=e.schedule,t.appendChild(a),!window.FormData)return i(t,u("Your browser does not support the FormData feature.","social-planner"));a=document.createElement("button");a.classList.add("button-link"),a.textContent=u("Cancel","social-planner"),a.addEventListener("click",function(e){e.preventDefault(),c(t,n,function(){delete p.schedules[n],v()})}),t.appendChild(a)}(a,t,n);var n=p.meta+"["+t+"]",l=document.createElement("select");l.setAttribute("name",n+"[date]"),a.appendChild(l);var r,s=document.createElement("div");for(r in s.classList.add("social-planner-time"),a.appendChild(s),o(l,u("Do not send automatically","social-planner")),o(l,u("Publish immediately","social-planner"),"now"),p.calendar=p.calendar||{},p.calendar)o(l,p.calendar[r],r);l.addEventListener("change",function(){for(;s.firstChild;)s.removeChild(s.lastChild);l.value&&"now"!==l.value&&d(s,t)})},m=function(e,t,n){var a=document.createElement("div");a.classList.add("social-planner-targets"),e.appendChild(a);var l,r,s=p.meta+"["+t+"]";for(l in p.providers){var i,d,o,c=p.providers[l];c.label&&(n.task.targets=n.task.targets||[],n.schedule?0<=n.task.targets.indexOf(l)&&((i=function(e,t){var n=document.createElement("label");n.classList.add("social-planner-scheduled"),e.appendChild(n);var a=document.createElement("input");a.setAttribute("type","hidden"),n.appendChild(a);e=document.createElement("span");return e.textContent=t.label,n.appendChild(e),a}(a,c)).setAttribute("name",s+"[targets][]"),i.value=l):n.result.sent?(o=null,n.result.links&&n.result.links[l]&&((o="http"===(d=n.result.links[l]).substring(0,4)?(r=d,i=void 0,(i=document.createElement("a")).classList.add("social-planner-link"),i.setAttribute("href",r),i.setAttribute("target","_blank"),i.setAttribute("rel","noopener"),i):function(n,a){var e=document.createElement("button");return e.classList.add("social-planner-info"),e.setAttribute("type","button"),e.addEventListener("click",function(e){e.preventDefault();var t=n.querySelector(".social-planner-extended");if(null!==t)return n.removeChild(t);e="<strong>"+u("Sent message:","social-planner")+"</strong>";(t=document.createElement("p")).classList.add("social-planner-extended"),t.textContent=a,t.innerHTML=e+a,n.appendChild(t)}),e}(a,d)).textContent=c.label,a.appendChild(o)),n.result.errors&&n.result.errors[l]&&((o=function(n,a){var e=document.createElement("button");return e.classList.add("social-planner-error"),e.addEventListener("click",function(e){e.preventDefault();var t=n.querySelector(".social-planner-extended");if(null!==t)return n.removeChild(t);e="<strong>"+u("Sent error:","social-planner")+"</strong>";(t=document.createElement("p")).classList.add("social-planner-extended"),t.textContent=a,t.innerHTML=e+t.textContent,n.appendChild(t)}),e}(a,n.result.errors[l])).textContent=c.label,a.appendChild(o))):((c=function(e,t){var n=document.createElement("label");n.classList.add("social-planner-checkbox"),e.appendChild(n);var a=document.createElement("input");a.setAttribute("type","checkbox"),n.appendChild(a);e=document.createElement("span");return e.textContent=t.label,n.appendChild(e),a}(a,c)).setAttribute("name",s+"[targets][]"),c.value=l,0<=n.task.targets.indexOf(l)&&c.setAttribute("checked","checked")))}},a=function(e){var t=(new Date).getTime().toString(36);h(e,t)},h=function(e,t){var n={},a=document.createElement("fieldset");a.classList.add("social-planner-task"),e.appendChild(a),n.task={},p.tasks&&p.tasks[t]&&(n.task=p.tasks[t]),n.result={},p.results&&p.results[t]&&(n.result=p.results[t]),n.schedule=null,p.schedules&&p.schedules[t]&&(n.schedule=p.schedules[t]),m(a,t,n);e=document.createElement("button");e.classList.add("social-planner-remove"),e.setAttribute("type","button"),a.appendChild(e),e.addEventListener("click",function(){if(!n.schedule)return r(t);var e=a.querySelector(".social-planner-scheduler");c(e,t,function(){return r(t)})}),l(a,t,n),function(e,t,n){var a=document.createElement("label");a.classList.add("social-planner-preview"),e.appendChild(a);e=p.meta+"["+t+"]",t=document.createElement("input");t.setAttribute("name",e+"[preview]"),t.value=1,a.appendChild(t);e=document.createElement("span");if(a.appendChild(e),n.result.sent||n.schedule)return t.setAttribute("type","hidden"),e.textContent=u("Preview enabled","social-planner"),n.task.preview&&(t.value=0,e.textContent=u("Preview disabled","social-planner"));t.setAttribute("type","checkbox"),n.task.preview&&t.setAttribute("checked","checked"),e.textContent=u("Disable preview","social-planner")}(a,t,n),s(a,t,n)},v=function(){var e,t=n.querySelector(".social-planner-list");for(null===t&&((t=document.createElement("div")).classList.add("social-planner-list"),n.appendChild(t));t.firstChild;)t.removeChild(t.lastChild);for(e in p.tasks=p.tasks||{},p.tasks)h(t,e);return t.hasChildNodes()||a(t),t},function(){if(!p.meta||!p.providers)return i(n,u("Need to configure the plugin on the settings page.","social-planner"));var e,t=v();e=t,(t=document.createElement("button")).classList.add("social-planner-append","button"),t.setAttribute("type","button"),t.textContent=u("Add task","social-planner"),t.addEventListener("click",function(){a(e)}),n.appendChild(t)}()))}();