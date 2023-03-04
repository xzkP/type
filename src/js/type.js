var text, words = getWords(), started = false;
var metronome, initialized = false, p = 0, total = 0;

async function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateText(maxSize) {
	var phrase = "";
	var wordCount = Math.round(maxSize*(Math.random()+1));
	for (var i = 0; i < wordCount; i++) {
		phrase += words[Math.random() * words.length | 0] + " ";
	}
	return phrase;
}

async function isValid(c) {
	return c.length === 1 &&
		(( 'a' <= c && c <= 'z') ||
			( 'A' <= c && c <= 'Z') ||
			( '0' <= c && c <= '9') ||
			(c == ' ')
	);
}

class Color {
	constructor(R, G, B) {
		this.R = Math.max(Math.min(255, R), 0);
		this.G = Math.max(Math.min(255, G), 0);
		this.B = Math.max(Math.min(255, B), 0);
	}

	getColor() {
		var s = `#${this.R>=10?this.R.toString(16):"0"+this.R}${this.G>=10?this.G.toString(16):"0"+this.G}${this.B>=10?this.B.toString(16):"0"+this.G}`;
		return s;
	}
};

class Character {
	constructor(character) {
		this.char = character;
		this.color = undefined;
	}

	async getColor() {
		return this.color.getColor();
	}
};

class Text {
	constructor(text) {
		this.characters = [], this.spaces = [], this.start = undefined;
		this.message = text, this.completed = false, this.index = 0, this.wc = 0, this.correct = 0;
		this.textbox = document.querySelector("#textbox");
		var parsing = this.add_characters(text);
	}

	async matching(character) {
		return (this.characters[this.index].char == character);
	}

	async get_wc() {
		for (var i = 0; i < this.spaces.length; i++) {
			if (this.index > this.spaces[i]) {
				this.wc = i+1;
			}
		}
	}

	async add_characters(text) {
		if (this.textbox == undefined) this.textbox = this.querySelector("#textbox");
		for (var i = 0; i < text.length; i++) {
			var char = await new Character(text[i]);
			this.characters.push(char);
			if (text[i] == ' ' ) {
				this.spaces.push(i);
			}
			this.textbox.innerHTML += this.message[i];
		}
	}

	async progress(event) {
		var character = event.key;
		if (character == "Backspace" && this.index > 0 && !this.completed) {
			this.characters[--this.index].color = undefined;
		}

		let valid = await isValid(character);

		if (valid && this.index < this.message.length && !this.completed) {
			if (this.start == undefined) {
				this.start = performance.now();
			}
			let match = await this.matching(character);
			if (match) {
				this.characters[this.index].color = new Color(77, 238, 234);
			} else {
				this.characters[this.index].color = new Color(237, 40, 133);
			}
			this.index++;
		}
		if (this.index == this.message.length-1) this.completed = true;
		await this.draw();
		await accuracy();
	}

	async draw() {
		this.textbox.innerHTML = "";
		for (var i = 0; i < this.message.length; i++) {
			var letter = document.createElement('character');
			letter.innerHTML = this.message[i];
			if (this.characters[i].color != undefined) {
				let color = this.characters[i].color.getColor();
				letter.style.color = color;
			}
			if (i == this.index) {
				letter.style.textDecoration = "underline";
				letter.style.fontWeight = "bold";
			}
			this.textbox.appendChild(letter);
		}
	}
};

async function accuracy() {
	var t = await metronome.closest_time();
	p += t;
	total++;
}

async function stats() {
	if (text.start != undefined && !text.completed) {
		let wc = await text.get_wc();
		var elapsed = document.getElementById("elapsed"), now = performance.now(),
				wpm = document.getElementById("wpm"), count = (text.wc+1) * (60000/(now - text.start));
		elapsed.innerHTML = `TIME ELAPSED: ${(now - text.start)/1000}s`;
		wpm.innerHTML = `WPM: ${isNaN(count)?0.00:count.toFixed(2)}`;
	}

	if (text.completed && metronome.running) {
		metronome.stop();
		alert(p/total);
	}
}

window.onload = function() {
	main();
}

async function main() {
	var x = await generateText(10);
	text = new Text(x);
	setInterval(stats, 10);
	document.addEventListener('keydown', function(event) {
		text.progress(event);
		if (!initialized) {
			metronome = new Metronome(100);
			initialized = true;
			metronome.start();
		}
	});
}
