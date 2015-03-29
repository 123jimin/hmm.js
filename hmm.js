var HMM = (function(){
var ARR = (typeof Float64Array) == 'function' ? Float64Array : Array;

var HMM = function(n, o){
	this.N = n; this.O = o;

	this.init_probs = new ARR(n);
	this.next_probs = new ARR(n*n);
	this.out_probs = new ARR(n*o);

	var obj, i, j;
	for(i=0; i<n*n; i++) this.next_probs[i] = 1/n;
	for(i=0; i<n*o; i++) this.out_probs[i] = 1/o;
	for(i=0; i<n; i++) this.init_probs[i] = 1/n;

	// for evaluate
	this._alpha_1 = new ARR(n);
	this._alpha_2 = new ARR(n);
};

HMM.prototype.randomize = function HMM$randomize(){
	var i, j, k, x, N = this.N;
	for(k=0; k<3*N; k++){
		i = 0|Math.random()*N;
		j = 0|Math.random()*N;
		if(i==j) continue;
		if(this.init_probs[i] + this.init_probs[j] >= 1) continue;
		x = Math.random()*this.init_probs[i];
		this.init_probs[i] -= x;
		this.init_probs[j] += x;
	}
};

HMM.prototype.evaluate = function HMM$evaluate(outputs){
	if(outputs.length == 0) return 1;
	
	var N = this.N,
		init_probs = this.init_probs,
		next_probs = this.next_probs,
		out_probs = this.out_probs;
	
	var alpha_1 = this._alpha_1,
		alpha_2 = this._alpha_2;
	
	var t, i, j, k, l, sum, output;
	
	for(i=0,j=outputs[0]*N; i<N; i++,j++) alpha_1[i] = init_probs[i] * out_probs[j];
	
	for(t=1; t<outputs.length; t++){
		output = outputs[t];
		for(j=0,k=output*N; j<N; j++,k++){
			for(sum=i=0,l=j; i<N; i++, l+=N) sum += alpha_1[i] * next_probs[l];
			alpha_2[j] = sum * out_probs[k];
		}
		if(++t >= outputs.length) break;

		output = outputs[t];
		for(j=0,k=output*N; j<N; j++,k++){
			for(sum=i=0,l=j; i<N; i++, l+=N) sum += alpha_2[i] * next_probs[l];
			alpha_1[j] = sum * out_probs[k];
		}
	}

	if(t&1) for(sum=i=0; i<N; i++) sum += alpha_1[i];
	else for(sum=i=0; i<N; i++) sum += alpha_2[i];
	return sum;
};

HMM.prototype.train = function HMM$train(outputs, rate){
	if(rate == null) rate = .05;
	
	var i,j,k,l,sum;
	var init = this.init_probs,
		next_probs = this.next_probs,
		out_probs = this.out_probs;
	var N = this.N, O = this.O, S = outputs.length;
	
	var alpha=[], beta=[];
	var gamma=[], kappa=[];
	
	// Expectation - step 1 (computing alpha and beta)
	for(i=0; i<S; i++){
		alpha[i] = new Array(N);
		beta[i] = new Array(N);
		gamma[i] = new Array(N);
		if(i<S-1) kappa[i] = new Array(N);
		if(i==0) for(j=0; j<N; j++) alpha[0][j] = init[j]*out_probs[j+outputs[0]*N];
		else for(j=0; j<N; j++){
			for(k=sum=0;k<N;k++) sum += alpha[i-1][k]*next_probs[k*N+j];
			alpha[i][j] = sum*out_probs[j+outputs[i]*N];
		}
	}
	for(i=S; i-->0; ){
		for(j=0; j<N; j++){
			if(i==S-1){
				beta[i][j] = 1;
			}else{
				beta[i][j] = 0;
				for(k=0; k<N; k++)
					beta[i][j] += next_probs[j*N+k]*out_probs[k+outputs[i+1]*N]*beta[i+1][k];
			}
		}
	}
	// Expectation - step 2 (computing gamma and kappa)
	for(i=0; i<S; i++){
		for(k=sum=0; k<N; k++) sum += alpha[i][k]*beta[i][k];
		for(j=0; j<N; j++){
			gamma[i][j] = alpha[i][j]*beta[i][j]/sum;
		}
		if(i==S-1) break;
		for(j=sum=0; j<N; j++) for(k=0; k<N; k++){
			sum += alpha[i][j]*next_probs[j*N+k]*out_probs[k+outputs[i+1]*N]*beta[i+1][k];
		}
		for(j=0; j<N; j++) for(kappa[i][j]=[],k=0; k<N; k++){
			kappa[i][j][k] = alpha[i][j]*next_probs[j*N+k]*out_probs[k+outputs[i+1]*N]*beta[i+1][k]/sum;
		}
	}

	// Maximum likelihood
	var a=[], b=[], p=[], del;
	for(i=0; i<N; i++){
		a[i]=[]; b[i]=[];
		for(k=sum=0; k<S-1; k++) sum += gamma[k][i];
		for(j=0; j<N; j++){
			for(k=a[i][j]=0;k<S-1;k++) a[i][j] += kappa[k][i][j];
			a[i][j] /= sum;
			
			del = a[i][j]-next_probs[i*N+j];
			next_probs[i*N+j] += del*rate;
		}
		sum += gamma[S-1][i];
		for(j=0; j<O; j++){
			for(k=b[i][j]=0; k<S; k++) if(outputs[k]==j) b[i][j] += gamma[k][i];
			b[i][j] /= sum;
			
			del = b[i][j]-out_probs[i+j*N];
			out_probs[i+j*N] += del*rate;
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
		Array.prototype.join.call(this.next_probs),
		'],[',
		Array.prototype.join.call(this.out_probs),
		'],[',
		Array.prototype.join.call(this.init_probs),
		']]'
	].join('');
};

HMM.parse = function HMM_parse(str){
	var json = JSON.parse(str);
	var hmm = new HMM(json[0], json[1]);
	hmm.next_probs = ARR.call(null, json[2]);
	hmm.out_probs = ARR.call(null, json[3]);
	hmm.init_probs = ARR.call(null, json[4]);

	return hmm;
};

return HMM;
})();

if(typeof module !== 'undefined' && typeof require !== 'undefined'){
	module.exports = HMM;
}
