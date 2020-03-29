(function(){
	let head=document.getElementsByTagName("head")[0];
	function loadScript(path){
		let script=document.createElement("script");
		script.src=path;
		head.appendChild(script);
	}
	function loadStyle(path){
		//TODO
	}
	loadScript("/../../lib/js/audioAnalysis.lib.js");
	loadScript("/../../lib/js/quantize.fn.js");
	loadScript("/../../lib/js/color.lib.js");
	loadScript("/../../lib/js/numericalArray.lib.js");
	//loadScript("/../../lib/js/sequentialArray.lib.js");
}());