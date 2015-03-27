var HMM = (function(){
var HMM = function(n, a){
	this.nodes = new Array(n);
	this.init_prob = new Array(n);
	this.alphabet = a;

	var obj, i, j, k, x;
	for(i=0; i<n; i++){
		obj = {
			'next': new Array(n),
			'prob': new Array(a.length)
		};
		for(j=0; j<n; j++) obj.next[j] = 1/n;
		for(j=0; j<a.length; j++) obj.prob[j] = 1/a.length;
		this.nodes[i] = obj;
		this.init_prob[i] = 1/n;
	}
	
	// randomize initial probabilities
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

HMM.prototype.train = function HMM$train(s, rate){
	if(rate == null) rate = .05;
	
	var alpha=[], beta=[];
	var gamma=[], kappa=[];
	var input=[];
	var i,j,k,l,sum;
	var alphabet = this.alphabet, nodes = this.nodes, init = this.init_prob;
	
	// E1
	for(i=0;i<s.length;i++){
		alpha[i] = []; beta[i] = [];
		gamma[i] = []; if(i<s.length-1) kappa[i] = [];
		input.push(alphabet.indexOf(s[i]));
		if(input[i] == -1) throw new Error('Invalid character: '+s[i]);
		for(j=0;j<nodes.length;j++){
			if(i==0){
				alpha[0][j] = init[j]*nodes[j].prob[input[0]];
			}else{
				for(k=sum=0;k<nodes.length;k++) sum += alpha[i-1][k]*nodes[k].next[j];
				alpha[i][j] = sum*nodes[j].prob[input[i]];
			}
		}
	}
	for(i=s.length;i-->0;){
		for(j=0;j<nodes.length;j++){
			if(i==s.length-1){
				beta[i][j] = 1;
			}else{
				beta[i][j] = 0;
				for(k=0;k<nodes.length;k++)
					beta[i][j] += nodes[j].next[k]*nodes[k].prob[input[i+1]]*beta[i+1][k];
			}
		}
	}
	// E2
	for(i=0;i<s.length;i++){
		for(k=sum=0;k<nodes.length;k++) sum += alpha[i][k]*beta[i][k];
		for(j=0;j<nodes.length;j++){
			gamma[i][j] = alpha[i][j]*beta[i][j]/sum;
		}
		if(i==s.length-1) break;
		for(j=sum=0;j<nodes.length;j++) for(k=0;k<nodes.length;k++){
			sum += alpha[i][j]*nodes[j].next[k]*nodes[k].prob[input[i+1]]*beta[i+1][k];
		}
		for(j=0;j<nodes.length;j++) for(kappa[i][j]=[],k=0;k<nodes.length;k++){
			kappa[i][j][k] = alpha[i][j]*nodes[j].next[k]*nodes[k].prob[input[i+1]]*beta[i+1][k]/sum;
		}
	}

	// M
	var a=[], b=[], p=[], del;
	for(i=0;i<nodes.length;i++){
		a[i]=[]; b[i]=[];
		for(k=sum=0;k<s.length-1;k++) sum += gamma[k][i];
		for(j=0;j<nodes.length;j++){
			for(k=a[i][j]=0;k<s.length-1;k++) a[i][j] += kappa[k][i][j];
			a[i][j] /= sum;
			
			del = a[i][j]-nodes[i].next[j];
			nodes[i].next[j] += del*rate;
		}
		sum += gamma[s.length-1][i];
		for(j=0;j<alphabet.length;j++){
			for(k=b[i][j]=0;k<s.length;k++) if(input[k]==j) b[i][j] += gamma[k][i];
			b[i][j] /= sum;
			
			del = b[i][j]-nodes[i].prob[j];
			nodes[i].prob[j] += del*rate;
		}
		p[i] = gamma[0][i];

		del = p[i]-init[i];
		init[i] += del*rate;
	}
};

HMM.prototype.toString = function HMM$toString(){
	return JSON.stringify(this);
};

HMM.parse = function HMM_parse(str){
	var _hmm = JSON.parse(data);
	var hmm = new HMM(_hmm.nodes.length, _hmm.alphabet);
	hmm.nodes = _hmm.nodes;
	hmm.init_prob = _hmm.init_prob;
	hmm.alphabet = _hmm.alphabet;

	return hmm;
};
})();

if(typeof module !== 'undefined' && typeof require !== 'undefined'){
	module.exports = HMM;
}
