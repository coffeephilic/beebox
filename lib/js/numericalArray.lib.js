window.NumericalArray={};
(function(){
	
this.mean=function(input){
	if(!input.length){return null;}
	return input.reduce(function(a,b){return a+b;})/input.length;
}

this.median=function(input){
	//TODO
}

this.standardDeviation=function(input, subset){ //TODO modify to use optional subset array
	if(!input.length){return null;}
	let mean=this.mean(input);
	let sqDiff=input.map(function(val){return Math.pow((val-mean),2);});
	return Math.sqrt((sqDiff.reduce(function(a,b){return a+b;},0)/(input.length-1)));
}

// End
}).apply(NumericalArray);