function Color(hex){
	var pos=0;
	if(hex.indexOf("#")>-1){pos = hex.indexOf("#")+1;}
	var red = hex.substring(pos, pos+2);
	var green = hex.substring(pos+2, pos+4);
	var blue = hex.substring(pos+4, pos+6);
	var alpha = hex.substring(pos+6, pos+8);
	
	this.r = parseInt(red, 16);
	this.g = parseInt(green, 16);
	this.b = parseInt(blue, 16);
	this.a = (alpha)?parseInt(alpha,16):255;
	
	red = this.r/255;
	green = this.g/255;
	blue = this.b/255;
	var max = Math.max(red, green, blue), min = Math.min(red, green, blue);
	var hue, saturation, lightness = (max + min) / 2;

	if(max == min){
			hue = saturation = 0;
	}else{
			var d = max - min;
			saturation = lightness > 0.5 ? d / (2 - max - min) : d / (max + min);
			switch(max){
					case red: hue = (green - blue) / d + (green < blue ? 6 : 0); break;
					case green: hue = (blue - red) / d + 2; break;
					case blue: hue = (red - green) / d + 4; break;
			}
			hue /= 6;
	}
	hue *=360;
	lightness *=100;
	saturation *=100;

	this.h = hue;
	this.s = saturation;
	this.l = lightness;
	
	this.getRGB = function(){
		var rHex=this.r.toString(16);
		var gHex=this.g.toString(16);
		var bHex=this.b.toString(16);
		if(rHex.length==1){rHex="0"+rHex;}
		if(gHex.length==1){gHex="0"+gHex;}
		if(bHex.length==1){bHex="0"+bHex;}
		return "#"+rHex+gHex+bHex;
	};
	this.getRGBA = function(){
		let aHex=this.a.toString(16);
		if(aHex.length==1){aHex="0"+aHex;}
		return this.getRGB()+aHex;
	}
	this.getHSL = function(){
		return "hsl("+this.h+","+this.s+"%,"+this.l+"%)";
	};
	this.getHSLA = function(){
		return "hsl("+this.h+","+this.s+"%,"+this.l+"%,"+this.a/255+")";
	}
}

function gradient(step, firstColor, lastColor, colorSpace="rgba"){
	var palette = [];
	let hRange=lastColor.h-firstColor.h;
	if(Math.abs(hRange)>180){
		hRange=(hRange>0)?hRange-360:hRange+360;
	}
	if(step > 1){
		var hStep=hRange/step;
		var sStep=(lastColor.s-firstColor.s)/step;
		var lStep=(lastColor.l-firstColor.l)/step;
		var rStep=(lastColor.r-firstColor.r)/step;
		var gStep=(lastColor.g-firstColor.g)/step;
		var bStep=(lastColor.b-firstColor.b)/step;
		var aStep=(lastColor.a-firstColor.a)/step;
	}else{
		var hStep=hRange;
		var sStep=lastColor.s-firstColor.s;
		var lStep=lastColor.l-firstColor.l;
		var rStep=lastColor.r-firstColor.r;
		var gStep=lastColor.g-firstColor.g;
		var bStep=lastColor.b-firstColor.b;
		var aStep=lastColor.a-firstColor.a;
	}
	for(var i=0; i<=step; i++){
		var nextH = firstColor.h+(hStep*i);
		var nextS = firstColor.s+(sStep*i);
		var nextL = firstColor.l+(lStep*i);
		var nextR = Math.round(firstColor.r+(rStep*i)).toString(16);
		var nextG = Math.round(firstColor.g+(gStep*i)).toString(16);
		var nextB = Math.round(firstColor.b+(bStep*i)).toString(16);
		var nextA = firstColor.a+(aStep*i);
		if(nextH<0){nextH+=360;}
		if(nextR.length==1){nextR="0"+nextR;}
		if(nextG.length==1){nextG="0"+nextG;}
		if(nextB.length==1){nextB="0"+nextB;}
		
		switch(colorSpace){
			case "hsl":
					palette.push("hsl("+nextH+", "+nextS+"%,"+nextL+"%)");
				break;
			case "hsla":
					palette.push("hsla("+nextH+", "+nextS+"%,"+nextL+"%,"+nextA/255+")");
				break;
			case "rgb":
					palette.push("#"+nextR+nextG+nextB);
				break;
			case "rgba":
					nextA=Math.round(nextA).toString(16);
					if(nextA.length==1){nextA="0"+nextA;}
					palette.push("#"+nextR+nextG+nextB+nextA);
				break;
		}
	}
	return palette;
}