class Metronome {
	constructor(tempo = 120) {
		this.audioctx = null;
		this.beat = 0, this.measure = 0, this.tempo = tempo, this.next = 0, this.schedule_range = 50, this.ahead = 100;
		this.running = false, this.queue = [], this.repeat = null;
	};

	nextNote() {
		this.next += (60.0 / this.tempo);
		this.beat = (this.beat+1)%this.measure;
	}

	queueNote(beat, time) {
		this.queue.push({ note: beat, time: time });
		const osc = this.audioctx.createOscillator();
		const gain = this.audioctx.createGain();

		osc.frequency.value = (this.beat % this.measure == 0) ? 1000 : 800;
		gain.gain.value = 1;
		gain.gain.exponentialRampToValueAtTime(1, time + 0.001);
		gain.gain.exponentialRampToValueAtTime(0.001, time + 0.02);
		osc.connect(gain);
		gain.connect(this.audioctx.destination);
		osc.start(time);
		osc.stop(time + 0.03);
	}

	scheduler() {
		while (this.next < this.audioctx.currentTime + this.schedule_range) {
			this.queueNote(this.beat, this.next);
			this.nextNote();
		}
	}

	async closest_time(index) {
		if (this.queue.length == 0) return 0;

		var current_time = this.audioctx.currentTime, min = current_time - this.queue[0].time;

		for (var i = 0; i < this.queue.length; i++) {
			var difference = current_time - this.queue[i].time;
			if (difference > 0 && difference < min) {
				min = difference;
			}
		}
		return (1-min/(60.0/this.tempo)) * 100;
	}

	start() {
		if (this.running) return;
		if (this.audioctx == null) {
			this.audioctx = new (window.AudioContext || window.webkitAudioContext)();
		}
		this.running = true;
		this.beat = 0;
		this.next = this.audioctx.currentTime + 0.05;
		this.repeat = setInterval(() => this.scheduler(), this.ahead);
	}

	stop() {
		this.running = false;
		this.audioctx.close();
		clearInterval(this.repeat);
		this.queue = [];
	}
};

