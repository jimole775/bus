/**
 * Created by Andy on 2017/3/4.
 */
(function () {
	window.global = window.global ? window.global : {};
	window.global.hideList = function(){
		document.getElementById("friendFrame").style.display = "none";
		document.getElementById("headBarRight").style.display = "table";
	};

	var innerHtml = [
	'<h2 style="height:3rem;line-height:200%;text-align:center;background:#008eff;color:#fff">基友列表(在线)</h2>' +
	'<ul id="friendList" style="width:100%;height:100%;position: absolute;padding-top:3rem;box-sizing: border-box;top:0;left:0"></ul>',
	'<button onclick="global.hideList()" style="width:2rem;height:2rem;position:absolute;top:0;right:0;border:none;background: none;outline: none">' +
	'<i class="triangle-icon"></i>' +
	'</button>'
	].join("");

	var div = document.createElement("div");
	div.style.width = "40%";
	div.style.height = "30%";
	div.style.outline = "1px solid #949494";
	div.style.borderRight = "1px solid rgba(250,250,250,0.7)";
	div.style.position = "fixed";
	div.style.right = "1rem";
	div.style.top = "1rem";
	div.style.zIndex = "990";
	div.style.overflow = "hidden";
	div.style.background = "rgba(250,250,250,0.7)";
	div.style.boxShadow = "3px 3px 3px rgba(0,0,0,.7)";
	div.id = "friendFrame";
	div.innerHTML += innerHtml;
	document.body.appendChild(div);

}());