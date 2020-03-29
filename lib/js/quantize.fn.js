//int quantize(input int, quanta int[], returnIndex bool)
//int[] quantize(input int[], quanta int[], returnIndex bool)

//Finds the value within quanta nearest to input.
//Returns int for input int or int[] for input int[] or null on failure.

function quantize(input, quanta, returnIndex){
	if(!Array.isArray(quanta)){return null;}
	if(!quanta.length){return null;}
	if(quanta.length==1){return quanta[0];}
	quanta.sort(function(a,b){return a-b;});
	
	function getNearest(value){
		let count=0;
		let limit=quanta.length+1;
		let min=i=0;
		let max=quanta.length-1;
		while(count<limit && Math.abs(max-min)>1){
			if(value==quanta[i]){
				return i;
			}else if(value>quanta[i]){
				min=i;
			}else{
				max=i;
			}
			i=Math.floor((max+min)/2);
			count++;
		}
		if(count>=limit){return null;}
		return (Math.abs(quanta[max]-value)<Math.abs(value-quanta[min]))?max:min;
	}
	var output;
	if(Array.isArray(input)){
		output=[];
		for(var j=0; j<input.length; j++){
			let k=getNearest(input[j]);
			output[j]=(returnIndex)?k:quanta[k];
		}
	}else{
		let k=getNearest(input);
		output=(returnIndex)?k:quanta[k];
	}
	return output;
}