var assert = require('assert');
var HMM = require("../");

var hmms = require("./files");

describe('HMM', function(){
	describe('train', function(){
		it("should improve results", function(){
			this.timeout(160);
			var i, j, test;
			for(i=0; i<20; i++){
				test = new HMM(8, 10);
				test.randomize();

				var train_sets = [
					[1, 2, 3, 4, 5],
					[3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5],
					[1, 4, 1, 4, 2, 1, 3, 5 ,6, 2, 3, 7, 3, 0, 9, 5, 0],
					[9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
				];
				
				for(j=0; j<20; j++) train_sets.forEach(function(a){
					var x = test.evaluate(a);
					test.train(a);
					var y = test.evaluate(a);
					assert.ok(0 < x && x < 1);
					assert.ok(0 < y && y < 1);
					assert.ok(x <= y);
				});
			}
		});
	});
});
