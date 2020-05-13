(function(){
	let head=document.getElementsByTagName("head")[0];
	function loadScript(path){
		let script=document.createElement("script");
		script.src=path;
		head.appendChild(script);
	}
	if(!window.Color){loadScript("/lib/js/color.lib.js");}
}());

//Constructor requires an audio element.

function AudioAnalysis(element){
	var self=this;
	this.element=element;
	this.audioElementOverride;
	this.context;
	this.media;
	this.analyser;
	this.meterIsRunning=false;
	
	this.historyDepth=1;
	this.smoothingFactor=0;
	this.smoothingTimeConstant=0.9;
	this.fftSize=512;
	
	this.sampleHistory=[];
	this.loudnessHistory=[];
	
	this.activate=function(){
		this.context=(this.context)?this.context:new AudioContext();
		this.media=this.context.createMediaElementSource(self.element);
		//this.media=this.context.createMediaStreamSource(element.src);
		this.analyser=this.context.createAnalyser();
		
		this.analyser.smoothingTimeConstant=self.smoothingTimeConstant;
		this.analyser.fftSize=self.fftSize;
		this.media.connect(this.analyser);
		//this.analyser.connect(this.context.destination);
	}
	
	this.getWave=function(){
		if(!this.context){this.activate();}
		let data=new Uint8Array(this.analyser.fftSize);
		this.analyser.getByteTimeDomainData(data);
		return data;
	}
	this.getLoudness=function(){
		let data=this.getWave();
		let rms=data.reduce(function(a,b){return a+Math.pow(Math.abs(b-128),2);},0);
		rms = Math.sqrt(rms/data.length);
		
		return rms;
	}
	this.getFrequency=function(){
		if(!this.context){this.activate();}
		let data=new Uint8Array(this.analyser.fftSize);
		this.analyser.getByteFrequencyData(data);
		return data;
	}
	this.meterWave=function(stopCondition, callback, isLoop){
		if(this.meterIsRunning && !isLoop){return;}
		this.meterIsRunning=true;
		requestAnimationFrame(function(){
			let sampleData=self.getWave();
			
			callback && callback(sampleData);
			
			if(!stopCondition()){
				self.meterWave(stopCondition, callback, true);
			}else{
				self.meterIsRunning=false;
			}
		});
	}
	this.meterLoudness=function(stopCondition, callback, isLoop){
		if(this.meterIsRunning && !isLoop){return;}
		this.meterIsRunning=true;
		requestAnimationFrame(function(){
			let loudnessData=self.getLoudness();
			self.loudnessHistory.unshift(loudnessData);
			if(self.loudnessHistory.length>self.historyDepth){
				self.loudnessHistory.pop();
			}
			
			callback && callback(loudnessData);
			
			if(!stopCondition()){
				self.meterLoudness(stopCondition, callback, true);
			}else{
				self.meterIsRunning=false;
			}
		});
	}
	this.meterFrequency=function(stopCondition, callback, isLoop){
		if(this.meterIsRunning && !isLoop){return;}
		this.meterIsRunning=true;
		requestAnimationFrame(function(){
			let frequencyData=self.getFrequency();
			
			callback && callback(frequencyData);
			
			if(!stopCondition()){
				self.meterFrequency(stopCondition, callback, true);
			}else{
				self.meterIsRunning=false;
			}
		});
	}
	
	this.polymeter=function(stopCondition,callback,isLoop){
		if(this.meterIsRunning && !isLoop){return;}
		if(!this.context){this.activate();}
		requestAnimationFrame(function(){
			let sample=new AudioSample(self.analyser, (self.audioElementOverride)?self.audioElementOverride.currentTime:self.element.currentTime);
			sample.loudestFrequency=sample.frequency.indexOf(Math.max.apply(null, sample.frequency));
			if(self.smoothingFactor>0 && self.sampleHistory.length){
				let subset=self.sampleHistory.slice(0,self.smoothingFactor);
				sample.loudnessRMSSmooth=subset.reduce(function(a,b){return a+b.loudnessRMS},0)/self.smoothingFactor;
				sample.frequencyMeanSmooth=subset.reduce(function(a,b){return a+b.frequencyMean},0)/self.smoothingFactor;
			}
			if(self.meterIsRunning){
				sample.frequencyMeanDelta=sample.frequencyMean-self.sampleHistory[0].frequencyMean;
			}
			self.sampleHistory.unshift(sample);
			if(self.sampleHistory.length>self.historyDepth){self.sampleHistory.pop();}
			
			callback && callback(sample);
			
			self.meterIsRunning=true;
			if(!stopCondition()){
				self.polymeter(stopCondition, callback, true);
			}else{
				self.meterIsRunning=false;
			}
		});
	}
	
	this.getIndexOfLastMarker=function(){
		for(var i=0; i<this.sampleHistory.length; i++){
			if(this.sampleHistory[i].isMarker){return i;}
		}
		return null;
	}
}

function AudioSample(analyser, time){
	this.time=time;
	this.wave=new Uint8Array(analyser.fftSize);
	this.frequency=new Uint8Array(analyser.fftSize);
	this.loudnessRMS;
	this.frequencyMean;
	this.frequencyMeanDelta=null;
	this.loudestFrequency;
	this.isMarker=false;
	
	analyser.getByteTimeDomainData(this.wave);
	analyser.getByteFrequencyData(this.frequency);
	
	let rms=this.wave.reduce(function(a,b){return a+Math.pow(Math.abs(b-128),2);},0);
	this.loudnessRMS=Math.sqrt(rms/this.wave.length);
	
	this.frequencyMean=this.frequency.reduce(function(a,b,i){return a+(b*i);})/this.frequency.reduce(function(a,b){return a+b;});
}

function Gate(threshhold=0){
	this.active=true;
	this.threshhold=threshhold;
	this.floor=0;
	this.trigger;
	this.release;
	this.test=function(value){
		if(this.floor && value<this.floor){
			if(!this.active){
				this.active=true;
				this.release && this.release();
			}
			return false;
		}
		if(this.active && value>=this.threshhold){
			if(this.floor){this.active=false;}
			this.trigger && this.trigger();
			return true;
		}
	}
	this.run=function(value){
		if(this.trigger){this.test(value);}
	}
}

function MicrophoneListener(){
	var self=this;
	this.audio;
	this.analysis;
	this.recorder;
	this.recordBuffer=[];
	this.recorderArmed=false;
	this.onRecord;
	this.armed=false;
	this.onSample=function(){}
	this.start=function(){
		if(!this.armed){return;}
		if(!this.audio.srcObject){this.loadMicrophone(true).then(function(){
				if(self.recorderArmed){
					self.recordBuffer=[];
					self.recorder.start();
				}
			});
		}
		else{
			this.audio.play();
			if(this.recorderArmed){
				this.recordBuffer=[];
				this.recorder.start();
			}
		}
		this.onSample();
	}
	this.stop=function(){
		this.audio.pause();
		if(this.audio.srcObject){this.audio.srcObject.getAudioTracks()[0].stop();}
		this.audio.srcObject=null;
		this.armed=false;
		if(this.recorder && this.recorder.state=="recording"){this.recorder.stop();}
	}
	this.loadMicrophone=async function(play){
		if(play){
			this.audio.oncanplay=function(){
				self.audio.play();
				self.onSample();
			}
		}
		var stream=await navigator.mediaDevices.getUserMedia({audio:true});
		this.recorder=new MediaRecorder(stream);
		this.audio.srcObject=stream;
		this.audio.muted=true;
		this.analysis.media=this.analysis.context.createMediaStreamSource(stream);
		this.analysis.media.connect(this.analysis.analyser);
		this.recorder.addEventListener("dataavailable", function(e){
			if(!self.recorderArmed){return;}
			self.recordBuffer.push(e.data);
		});
		this.recorder.addEventListener("stop", function(){
			if(!self.recorderArmed){return;}
			if(self.onRecord){
				var audioURL=URL.createObjectURL(new Blob(self.recordBuffer));
				self.onRecord(audioURL);
			}
		});
	}
	
	this.audio=document.createElement("audio");
	this.audio.controls=false; 
	document.body.appendChild(this.audio);
	this.analysis=new AudioAnalysis(this.audio);
	//this.analysis.gate.active=false;
}

function Canvas(element, width=100, height=100, zoom=1){
	var self=this;
	this.canvas=(element)?element:document.createElement("canvas");
	this.context=this.canvas.getContext("2d");
	this.zoom=zoom;
	
	this.drawUnder=function(){}
	this.drawMeter=function(){}
	this.drawOver=function(){}
	
	this.draw=function(data){
		this.drawUnder(data);
		this.drawMeter(data);
		this.drawOver(data);
	}
	
	this.canvas.width=width;
	this.canvas.height=height;
}

function Spectrograph(canvas, width, height, zoom){
	Canvas.call(this,canvas,width,height,zoom);
	var self=this;
	this.drawMeter=function(sample){
		let cvs=this.canvas;
		let ctx=this.context;
		let xWarp=cvs.width*self.zoom/sample.frequency.length;
		let yWarp=cvs.height*self.zoom/255;
		
		ctx.clearRect(0,0,cvs.width,cvs.height);
		ctx.beginPath();
		ctx.moveTo(0,cvs.height);
		
		for(var i=0; i<sample.frequency.length; i++){
			ctx.lineTo(i*xWarp,cvs.height-(sample.frequency[i]*yWarp));
		}
		ctx.lineTo(cvs.width,cvs.height);
		ctx.strokeStyle="black";
		ctx.stroke();
		
		ctx.beginPath();
		ctx.moveTo(sample.frequencyMeanSmooth*xWarp,0);
		ctx.lineTo(sample.frequencyMeanSmooth*xWarp,cvs.height);
		ctx.strokeStyle="red";
		ctx.stroke();
	}
}

function Oscilloscope(canvas,width,height,zoom){
	Canvas.call(this,canvas,width,height,zoom);
	var self=this;
	this.drawMeter=function(sample){
		let cvs=this.canvas;
		let ctx=this.context;
		let xWarp=cvs.width*self.zoom/sample.wave.length;
		let yWarp=cvs.height*self.zoom/255;
		
		ctx.clearRect(0,0,cvs.width,cvs.height);
		ctx.beginPath();
		ctx.moveTo(0,cvs.height-(127*yWarp));
		ctx.lineTo(cvs.width,cvs.height-(127*yWarp));
		ctx.strokeStyle="blue";
		ctx.stroke();
		
		ctx.beginPath();
		ctx.moveTo(0,cvs.height-(127*yWarp));
		for(var i=0; i<sample.wave.length; i++){
			ctx.lineTo(i*xWarp,cvs.height-(sample.wave[i]*yWarp));
		}
		ctx.lineTo(cvs.width,cvs.height-(127*yWarp));
		ctx.strokeStyle="black";
		ctx.stroke();
	}
}

function Spectrogram(canvas,width,height,zoom){
	Canvas.call(this,canvas,width,height,zoom);
	var self=this;
	this.drawMeter=function(analysis){
		let cvs=this.canvas;
		let ctx=this.context;
		let xWarp=cvs.width*self.zoom/analysis.sampleHistory.length;
		let yWarp=cvs.height*self.zoom/analysis.sampleHistory[0].frequency.length;
		
		//TODO
	}
}

function WormGraph(canvas,width,height,zoom){
	Canvas.call(this,canvas,width,height,zoom);
	var self=this;
	this.histGradient=[];
	this.drawMeter=function(analysis){
		let hist=analysis.sampleHistory;
		if(!self.histGradient.length){
			self.histGradient=gradient(analysis.historyDepth-1, new Color("#0000ffff"), new Color("#ff000000"));
		}
		let cvs=this.canvas;
		let ctx=this.context;
		let xWarp=cvs.height*self.zoom/hist[0].frequency.length;
		let yWarp=cvs.width*self.zoom/127;
		
		ctx.clearRect(0,0,cvs.width,cvs.height);
		
		function positionX(index){return hist[index].frequencyMean*10*xWarp;}
		function positionY(index){return cvs.height-(hist[index].loudnessRMS*yWarp);}
		
		for(var i=1; i<hist.length; i++){
			ctx.strokeStyle=self.histGradient[i];
			ctx.beginPath();
			ctx.moveTo(positionX(i-1),positionY(i-1));
			ctx.lineTo(positionX(i),positionY(i));
			ctx.stroke();
		}
		
		for(var i=0; i<hist.length; i++){
			if(hist[i].isMarker){
				ctx.fillStyle="#000000"+self.histGradient[i].substr(7,2);
				ctx.beginPath();
				
			ctx.arc(positionX(i),positionY(i),i,0,2*Math.PI);
			ctx.fill();
			}
			ctx.fillStyle=self.histGradient[i];
			ctx.beginPath();
			ctx.arc(positionX(i),positionY(i),6,0,2*Math.PI);
			ctx.fill();
		}
	}
}
