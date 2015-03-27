var assert = require('assert');
var HMM = require("../");

var hmms = require("./files");
var assertSimilar = function assert_similar(actual, expected){
	var diff = Math.abs(actual - expected),
		rdiff = Math.abs(diff / expected);
	if(diff < 1e-9 || rdiff < 1e-9) return;
	assert.fail(actual, expected, "different values", "~=")
};

describe('HMM', function(){
	describe('evaluate', function(){
		it("should return correct value for the example in Wikipedia", function(){
			assertSimilar(hmms.wikipedia.evaluate([0, 0, 2, 1]), 0.01110354);
		});
	});
});
