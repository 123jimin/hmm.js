var HMM = (function(){
var ARR = (typeof Float64Array) == 'function' ? Float64Array : Array;

var _choose = function _choose(a, ao, as, al){
	var i, x = Math.random();
	for(i=0; i<al; i++){
		x -= a[ao+i*as];
		if(x < 0) return i;
	}
	return al-1;
};

var HMM = function(N, O){
	this.N = N; this.O = O;

	this.init_probs = new ARR(N);
	this.next_probs = new ARR(N*N); // curr*N + next
	this.out_probs = new ARR(N*O); // out*N + curr

	var obj, i, j;
	for(i=0; i<N*N; i++) this.next_probs[i] = 1/N;
	for(i=0; i<N*O; i++) this.out_probs[i] = 1/O;
	for(i=0; i<N; i++) this.init_probs[i] = 1/N;

	// for computing
	this._resize_tmp(16);
};

HMM.prototype._resize_tmp = function(s){
	if(s <= this._max_s) return;
	this._max_s = s;
	this._tmp = new ARR(this.N*(3*this._max_s+this.N));
};

HMM.prototype.init_probs = null;
HMM.prototype.next_probs = null;
HMM.prototype.out_probs = null;
HMM.prototype._tmp = null;
HMM.prototype._max_s = 0;

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

HMM.prototype.simulate = function HMM$simulate(in_state){
	var N = this.N, O = this.O;
	if(in_state == null) in_state = -1;
	var next_state = in_state == -1 ? _choose(this.init_probs, 0, 1, N) : _choose(this.next_probs, in_state*N, 1, N);
	var next_output = _choose(this.out_probs, next_state, N, O);
	return [next_state, next_output];
};

HMM.prototype.generate = function HMM$generate(process){
	var curr_state = -1,
		result_str = [];
	for(var i=0;;i++){
		var v = this.simulate(curr_state);
		curr_state = v[0];
		result_str.push(v[1]);
		if(!process(v[1], i)) return result_str;
	}
};

HMM.prototype.evaluate = function HMM$evaluate(outputs){
	if(outputs.length == 0) return 1;
	
	var N = this.N,
		init_probs = this.init_probs,
		next_probs = this.next_probs,
		out_probs = this.out_probs;
	
	var alphas = this._tmp;
	
	var t, i, j, k, l, sum, output;
	
	for(i=0,j=outputs[0]*N; i<N; i++,j++) alphas[i] = init_probs[i] * out_probs[j];
	
	for(t=1; t<outputs.length; t++){
		output = outputs[t];
		for(j=0,k=output*N; j<N; j++,k++){
			for(sum=i=0,l=j; i<N; i++, l+=N) sum += alphas[i] * next_probs[l];
			alphas[N+j] = sum * out_probs[k];
		}
		if(++t >= outputs.length) break;

		output = outputs[t];
		for(j=0,k=output*N; j<N; j++,k++){
			for(sum=i=0,l=j; i<N; i++, l+=N) sum += alphas[N+i] * next_probs[l];
			alphas[j] = sum * out_probs[k];
		}
	}

	if(t&1) for(sum=i=0; i<N; i++) sum += alphas[i];
	else for(sum=i=0; i<N; i++) sum += alphas[N+i];
	return sum;
};

HMM.prototype.train = function HMM$train(outputs, rate){
	if(rate == null) rate = .05;
	
	var i,j,k,l,sum;

	var init = this.init_probs,
		next_probs = this.next_probs,
		out_probs = this.out_probs;
	
	var n_next_probs = this._n_next_probs;
	
	var N = this.N, O = this.O, S = outputs.length;
	var outputs_N = outputs.map(function(v){return v*N;});

	this._resize_tmp(S);
	var BETA = N*S,
		GAMMA = 2*BETA,
		KAPPA = 3*BETA,
		arr = this._tmp;
	
	// Expectation - step 1 (computing alpha and beta)
	for(j=0; j<N; j++) arr[j] = init[j]*out_probs[j+outputs_N[0]];
	for(i=1; i<S; i++){
		for(j=l=0; j<N; j++){
			for(k=sum=0; k<N; k++,l++){
				arr[KAPPA+l] = 0; // init kappa here
				sum += arr[(i-1)*N+k]*next_probs[k*N+j];
			}
			arr[i*N+j] = sum*out_probs[j+outputs_N[i]];
		}
	}
	for(j=0,l=(S-1)*N; j<N; j++,l++){
		arr[BETA+l] = 1;
	}
	for(i=S-1; i-->0; ){
		for(j=0,l=i*N; j<N; j++, l++){
			arr[BETA+l] = 0;
			for(k=0; k<N; k++)
				arr[BETA+l] += next_probs[j*N+k]*out_probs[k+outputs_N[i+1]]*arr[BETA+(i+1)*N+k];
		}
	}

	// Expectation - step 2 (computing gamma and kappa)
	for(i=0; i<S; i++){
		for(k=sum=0; k<N; k++) sum += arr[i*N+k]*arr[BETA+i*N+k];
		for(j=0; j<N; j++){
			arr[GAMMA+i*N+j] = arr[i*N+j]*arr[BETA+i*N+j]/sum;
		}
		if(i==S-1) break;
		for(j=sum=0; j<N; j++) for(k=0; k<N; k++){
			sum += arr[i*N+j]*next_probs[j*N+k]*out_probs[k+outputs_N[i+1]]*arr[BETA+(i+1)*N+k];
		}
		for(l=j=0; j<N; j++) for(k=0; k<N; k++,l++){
			arr[KAPPA+l] += arr[i*N+j]*next_probs[l]*out_probs[k+outputs_N[i+1]]*arr[BETA+(i+1)*N+k]/sum;
		}
	}

	// Maximum likelihood
	var x, p=[], del;
	for(l=i=0; i<N; i++){
		for(k=sum=0; k<S-1; k++) sum += arr[GAMMA+k*N+i];
		for(j=0; j<N; j++,l++){
			del = arr[KAPPA+l]/sum-next_probs[l];
			next_probs[l] += del*rate;
		}
		sum += arr[GAMMA+(S-1)*N+i];
		for(j=0; j<O; j++){
			for(k=x=0; k<S; k++) if(outputs[k]==j) x += arr[GAMMA+k*N+i];
			del = x/sum-out_probs[i+j*N];
			out_probs[i+j*N] += del*rate;
		}
		del = arr[GAMMA+i]-init[i];
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
