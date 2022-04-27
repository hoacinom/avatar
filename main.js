class Category {
	constructor (name, zindex) {
		this.name = name;
		this.zindex = zindex;
		this.items = new Map();
	}

	addAvailableItem(item) {
		this.items.set(item.name, item);
	}

	chooseItem(itemName) {
		if (itemName === null) {
			this.activeItem = null;
			return;
		}

		if (this.items.get(itemName)) {
			this.activeItem = this.items.get(itemName);
		} else {
			throw new Error('tried to use unavailable item', item, 'for category', this);
		}
	}
}

class AsyncImage {
	constructor (src) {
		this.src = src;
		this.image = null;
		this.request = null;
	}

	load () {
		if (!this.request) {
			this.request = new Promise((f, r) => {
				fetch(this.src)
					.then(res => res.blob())
					.then(blob => createImageBitmap(blob))
					.then((img) => {
						this.image = img;
						f();
					});
			});
		}

		return this.request;
	}
}

class Item {
	constructor (name, category) {
		this.name = name;
		this.category = category;
		this.image = new AsyncImage(`./assets/${this.category.name}-${this.name}.PNG`);
	}

	load() {
		return this.image.load();
	}
}

// create categories
const layers = [
	'Base',
	'Blink',
	'FaceDetail',
	'FacialHair',
	'Eyebrow',
	'Legs',
	'Feet',
	'Top',
	'Waist',
	'Shoulder',
	'Arms',
	'Hair',
];

const bgImg = new AsyncImage(`./assets/BG-1.JPG`);

function runAnimationSteps(steps) {
	if (steps.length) {
		const [[f, t], ...rest] = steps;

		requestAnimationFrame(() => {
			f();

			if (t) {
				setTimeout(() => {
					runAnimationSteps(rest);
				}, t);
			}
		});
	}
}

class Character {
	constructor() {
		this.orderedItems = [];

		this.categories = new Map();


		for (let [idx, name] of Object.entries(layers)) {
			this.categories.set(name, new Category(name, Number(idx) + 1));
		}

		// cateogry order here doesn't matter
		const itemDB = {
			'Base': [
				'Default'
			],
			'Blink': [
				'Half',
				'Closed'
			],
			'FacialHair': [
				'Movember'
			],
			'FaceDetail': [
				'Freckles'
			],
			'Eyebrow': [
				'Thick'
			],
			'Hair': [
				'Afro',
				'A',
				'Classic',
				'Rika',
				'Stylish',
				'Nurro',
				'Pumpkin'
			],
			'Arms': [
				'Default'
			],
			'Legs': [
				'Default'
			],
			'Shoulder': [
				'Default'
			],
			'Top': [
				'Normal'
			],
			'Feet': [
				'Boots'
			],
			'Waist': [
				'Bag'
			]
		};

		const categoryContainerEl = document.getElementById('categoryContainer');

		// load item db
		for (let [categoryName, category] of this.categories) {
			const items = itemDB[categoryName] || [];

			let frag = document.createDocumentFragment();

			const labelEl = document.createElement('label');
			labelEl.innerHTML = categoryName;
			labelEl.setAttribute('for', categoryName + 'Select');
			const selectEl = document.createElement('select');
			selectEl.setAttribute('id', categoryName + 'Select');

			frag.appendChild(labelEl);
			frag.appendChild(selectEl);

			const optionEl = document.createElement('option');
			optionEl.setAttribute('value', null);
			optionEl.innerHTML = 'None';
			selectEl.appendChild(optionEl);

			for (let itemName of items) {
				category.addAvailableItem(new Item(itemName, category));

				const optionEl = document.createElement('option');
				optionEl.setAttribute('value', itemName);
				optionEl.innerHTML = itemName;
				selectEl.appendChild(optionEl);
			}

			selectEl.addEventListener('change', () => {
				const itemName = selectEl.options[selectEl.selectedIndex].value;

				this.equip(categoryName, itemName === "null" ? null : itemName);
			});

			if (!['Base', 'Blink'].includes(categoryName)) {
				categoryContainerEl.appendChild(frag);
			}
		}

		this.equip('Base', 'Default');
	}

	equip(categoryName, itemName) {
		const catEl = document.getElementById(categoryName + 'Select');

		if (catEl) {
			catEl.value = itemName;
		}

		this.categories.get(categoryName).chooseItem(itemName);
		this.render();
	}

	blink() {
		runAnimationSteps([
			[() => {this.equip('Blink', 'Half')}, 40],
			[() => {this.equip('Blink', 'Closed')}, 150],
			[() => {this.equip('Blink', null)}]
		]);
	}

	render(blink) {
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// background
		if (bgImg.image) {
			ctx.drawImage(bgImg.image, 0, 0);
		} else {
			bgImg.load().then(() => {
				this.render();
			});
		}

		for (let categoryName of layers) {
			let category = this.categories.get(categoryName);

			if (category.activeItem) {
				const item = category.activeItem;

				if (item.image.image) {
					ctx.drawImage(item.image.image, 0, 0);
				} else {
					item.load().then(() => {
						this.render();
					});
				}
			}
		}
	}
}

canvas.width = 900;
canvas.height = 1800;
canvas.style.width = canvas.width / 2 + 'px';
canvas.style.height = canvas.height / 2 + 'px';

const ctx = canvas.getContext('2d');

const me = new Character();

function repeatWithRandomInterval(f, min, max) {
	function loop() {
		setTimeout(() => {
			f();
			loop();
		}, Math.random() * (max - min) + min);
	}

	loop();
}


repeatWithRandomInterval(() => {
	me.blink();
}, 5000, 10000);
