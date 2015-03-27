var HMM = (function(){
var HMM = function(n, o){
	this.N = n; this.O = o;
	this.states = new Array(n);
	this.init_prob = new Array(n);

	var obj, i, j;
	for(i=0; i<n; i++){
		obj = {
			'next': new Array(n),
			'prob': new Array(o)
		};
		for(j=0; j<n; j++) obj.next[j] = 1/n;
		for(j=0; j<o; j++) obj.prob[j] = 1/o;
		this.states[i] = obj;
		this.init_prob[i] = 1/n;
	}
	
};

HMM.prototype.randomize = function HMM$randomize(){
	var i, j, k, x;
	for(k=0; k<3*n; k++){
		i = 0|Math.random()*n;
		j = 0|Math.random()*n;
		if(i==j) continue;
		if(this.init_prob[i] + this.init_prob[j] >= 1) continue;
		x = Math.random()*this.init_prob[i];
		this.init_prob[i] -= x;
		this.init_prob[j] += x;
	}
};

HMM.prototype.evaluate = function HMM$evaluate(outputs){
	var alpha = [], i, j, k, sum, output;
	
	for(i=0; i<outputs.length; i++){
		alpha[i] = [];
		output = outputs[i];
		for(j=0; j<this.N; j++){
			if(i==0){
				alpha[0][j] = this.init_prob[j] * this.states[j].prob[output];
			}else{
				for(k=sum=0; k<this.N; k++) sum += alpha[i-1][k]*this.states[k].next[j];
				alpha[i][j] = sum*this.states[j].prob[output];
			}
		}
	}

	for(sum=i=0; i<this.N; i++) sum += alpha[outputs.length-1][i];
	return sum;
};

HMM.prototype.train = function HMM$train(outputs, rate){
	if(rate == null) rate = .05;
	
	var alpha=[], beta=[];
	var gamma=[], kappa=[];
	var input=[];
	var i,j,k,l,sum;
	var outputs = this.outputs, states = this.states, init = this.init_prob;
	var N = this.N, O = this.O, S = outputs.length;
	
	// Expectation - step 1
	for(i=0;i<outputs.length;i++){
		alpha[i] = []; beta[i] = [];
		gamma[i] = []; if(i<S-1) kappa[i] = [];
		input.push(outputs[i]);
		if(input[i] == -1) throw new Error('Invalid character: '+s[i]);
		for(j=0;j<N;j++){
			if(i==0){
				alpha[0][j] = init[j]*states[j].prob[input[0]];
			}else{
				for(k=sum=0;k<N;k++) sum += alpha[i-1][k]*states[k].next[j];
				alpha[i][j] = sum*states[j].prob[input[i]];
			}
		}
	}
	for(i=S;i-->0;){
		for(j=0;j<N;j++){
			if(i==S-1){
				beta[i][j] = 1;
			}else{
				beta[i][j] = 0;
				for(k=0;k<N;k++)
					beta[i][j] += states[j].next[k]*states[k].prob[input[i+1]]*beta[i+1][k];
			}
		}
	}
	// Expectation - step 2
	for(i=0;i<S;i++){
		for(k=sum=0;k<N;k++) sum += alpha[i][k]*beta[i][k];
		for(j=0;j<N;j++){
			gamma[i][j] = alpha[i][j]*beta[i][j]/sum;
		}
		if(i==S-1) break;
		for(j=sum=0;j<N;j++) for(k=0;k<N;k++){
			sum += alpha[i][j]*states[j].next[k]*states[k].prob[input[i+1]]*beta[i+1][k];
		}
		for(j=0;j<N;j++) for(kappa[i][j]=[],k=0;k<N;k++){
			kappa[i][j][k] = alpha[i][j]*states[j].next[k]*states[k].prob[input[i+1]]*beta[i+1][k]/sum;
		}
	}

	// Maximum likelihood
	var a=[], b=[], p=[], del;
	for(i=0;i<N;i++){
		a[i]=[]; b[i]=[];
		for(k=sum=0;k<S-1;k++) sum += gamma[k][i];
		for(j=0;j<N;j++){
			for(k=a[i][j]=0;k<S-1;k++) a[i][j] += kappa[k][i][j];
			a[i][j] /= sum;
			
			del = a[i][j]-states[i].next[j];
			states[i].next[j] += del*rate;
		}
		sum += gamma[S-1][i];
		for(j=0;j<O;j++){
			for(k=b[i][j]=0;k<S;k++) if(input[k]==j) b[i][j] += gamma[k][i];
			b[i][j] /= sum;
			
			del = b[i][j]-states[i].prob[j];
			states[i].prob[j] += del*rate;
		}
		p[i] = gamma[0][i];

		del = p[i]-init[i];
		init[i] += del*rate;
	}
};

HMM.prototype.toString = function HMM$toString(){
	return [
		'[',
		this.N, ',', this.O,
		',[',
		this.states.map(function(o){
			return [
				'[[',
				o.next.join(','),
				'],[',
				o.prob.join(','),
				']]'
			].join('');
		}).join(','),
		'],[',
		this.init_prob.join(','),
		']]'
	].join('');
};

HMM.parse = function HMM_parse(str){
	var json = JSON.parse(str);
	var hmm = new HMM(json[0], json[1]);
	hmm.states = json[2].map(function(o){
		return {
			'next': o[0], 'prob': o[1]
		};
	});
	hmm.init_prob = json[3];

	return hmm;
};

return HMM;
})();

if(typeof module !== 'undefined' && typeof require !== 'undefined'){
	module.exports = HMM;
}
