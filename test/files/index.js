var HMM = require('../../');
var fs = require('fs');
var hmms = {};

fs.readdirSync(__dirname).forEach(function(f){
	if(f.slice(-3) == '.js' || f.slice(-4) == '.swp') return;
	var n = f.split('.').slice(0,-1).join('.');
	hmms[n] = HMM.parse(fs.readFileSync(__dirname+"/"+f, 'utf-8'));
});

module.exports = hmms;
