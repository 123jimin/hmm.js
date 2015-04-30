# hmm.js
An implementation of hidden Markov model (HMM) in JavaScript.

## Usage

```js
var HMM = requrie('(package name to be determined)');

// Create a HMM with 20 states and 10 characters.
var hmm = new HMM(20, 10);

// Randomize HMM (randomizing initial probabilities of each states)
hmm.randomize();

// Train HMM where the string is "0123456789".
hmm.train([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

// Train HMM where the string is "01457...2" and the learning rate is 0.05.
hmm.train([0, 1, 4, 5, 7, 9, 0, 4, 7, 8, 2], 0.05);

// Compute the probability of observing "5678".
hmm.evaluate([5, 6, 7, 8]);

// Convert HMM to String, to be saved and used again.
var string = hmm.toString();

hmm = HMM.parse(string);
```
