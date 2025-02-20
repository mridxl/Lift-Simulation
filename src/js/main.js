const MAX_DISTANCE = 100000000;

// LiftSystem class
class LiftSystem {
	constructor(floors, lifts) {
		this.totalFloors = floors;
		this.totalLifts = lifts;

		this.liftState = new Array(lifts).fill().map(() => ({
			currentFloor: 0,
			requestQueue: [],
		}));

		this.pendingRequests = []; // global(kinda) request queue for requests that are not yet assigned to any lift
	}

	requestLift(floor) {
		// don't assign the request if it's already in the pendingRequests queue or in a lift's requestQueue
		if (
			this.pendingRequests.includes(floor) ||
			this.liftState.some((lift) => lift.requestQueue.includes(floor))
		) {
			return;
		}

		const liftToAssign = this.findClosestLift(floor);
		if (liftToAssign === -1) {
			if (!this.pendingRequests.includes(floor))
				this.pendingRequests.push(floor);
		} else {
			this.liftState[liftToAssign].requestQueue.push(floor);
			this.moveLift(liftToAssign);
		}
	}

	findClosestLift(floor) {
		let closestLift = -1;
		let minDistance = MAX_DISTANCE;

		for (let i = 0; i < this.totalLifts; i++) {
			const distance = Math.abs(this.liftState[i].currentFloor - floor);
			if (
				distance < minDistance &&
				this.liftState[i].requestQueue.length === 0
			) {
				minDistance = distance;
				closestLift = i;
			}
		}
		return closestLift; //returns index of lift closest of floor
	}

	async moveLift(liftIndex) {
		const liftState = this.liftState[liftIndex];
		const liftElement = document.querySelector(`.lift[data-id="${liftIndex}"]`);

		while (liftState.requestQueue.length > 0) {
			const targetFloor = liftState.requestQueue[0];
			const currentFloor = liftState.currentFloor;
			const floorsToMove = Math.abs(targetFloor - currentFloor);

			await new Promise((resolve) => {
				liftElement.style.transition = `bottom ${floorsToMove * 2}s linear`;
				console.log('Moving Lift', liftIndex, 'to Floor', targetFloor);
				liftElement.style.bottom = `${targetFloor * (100 / this.totalFloors)}%`;
				setTimeout(() => {
					liftState.currentFloor = targetFloor;
					resolve();
				}, floorsToMove * 2000);
			});

			liftElement.style.transition = '';

			await this.operateDoors(liftElement, 'open');
			await new Promise((resolve) => setTimeout(resolve, 2500));
			await this.operateDoors(liftElement, 'close');

			liftState.requestQueue.shift();
		}

		this.checkPendingRequests();
	}

	checkPendingRequests() {
		if (this.pendingRequests.length > 0) {
			const requestedFloor = this.pendingRequests.shift();
			const availableLift = this.findClosestLift(requestedFloor);
			if (availableLift !== -1) {
				this.liftState[availableLift].requestQueue.push(requestedFloor);
				this.moveLift(availableLift);
			} else {
				this.pendingRequests.unshift(requestedFloor);
			}
		}
	}

	async operateDoors(liftElement, todo) {
		const leftDoor = liftElement.querySelector('.left');
		const rightDoor = liftElement.querySelector('.right');

		if (todo === 'open') {
			leftDoor.classList.add('open');
			rightDoor.classList.add('open');
		} else {
			leftDoor.classList.remove('open');
			rightDoor.classList.remove('open');
		}

		await new Promise((resolve) => setTimeout(resolve, 2500));
	}
}

// UI Logic
document.addEventListener('DOMContentLoaded', () => {
	const submitButton = document.getElementById('submit');
	const liftInput = document.getElementById('lifts');
	const floorInput = document.getElementById('floors');

	submitButton.addEventListener('click', () => {
		const lifts = parseInt(liftInput.value);
		const floors = parseInt(floorInput.value);
		if (isNaN(lifts) || isNaN(floors)) {
			alert(
				'Please enter the number of lifts and floors to proceed with the simulation'
			);
			return;
		}
		if (lifts > 10 || floors > 10 || lifts <= 0 || floors < 2) {
			alert(
				'Please enter a valid number of lifts less than 10 and floors less than 10 to proceed with the simulation'
			);
			return;
		}

		const liftSystem = new LiftSystem(floors, lifts);
		console.log('Lift System Created', liftSystem);

		document.getElementById('screen-one').remove();
		document.getElementById('screen-two').style.display = 'flex';
		document.getElementById('header-container').classList.add('moved');

		generateFloors(liftSystem, floors);
		generateLifts(lifts, floors);
	});
});

function generateFloors(liftSystem, floors) {
	const floorContainer = document.getElementById('floor-container');
	for (let i = 0; i < floors; i++) {
		const floorElement = document.createElement('div');
		floorElement.classList.add('floor');
		floorElement.style.height = `${100 / floors}%`;

		const floorLabel = document.createElement('div');
		floorLabel.classList.add('floor-label');
		floorLabel.innerText = 'Floor ' + (floors - i);

		floorElement.append(floorLabel);
		floorContainer.append(floorElement);
		generateButtons(liftSystem, floorElement, i, floors);
	}
}

function generateLifts(lifts, floors) {
	const liftContainer = document.getElementById('lift-container');
	for (let i = 0; i < lifts; i++) {
		const liftElement = document.createElement('div');
		liftElement.classList.add('lift');
		liftElement.dataset.id = i;
		liftElement.style.height = `${100 / (floors + 1)}%`;
		liftElement.style.width = `${100 / (lifts + 5)}%`;
		liftElement.style.left = `${((i + 0.2) * 100) / lifts}%`;
		liftContainer.append(liftElement);
		generateDoors(liftElement);
	}
}

function generateButtons(liftSystem, floorElement, floorIndex, totalFloors) {
	const btnContainer = document.createElement('div');
	btnContainer.classList.add('button-container');

	const upButton = document.createElement('button');
	upButton.classList.add('up', 'lift-button');
	upButton.innerText = '▲';
	upButton.dataset.floor = totalFloors - floorIndex - 1;
	upButton.addEventListener('click', () => {
		liftSystem.requestLift(totalFloors - floorIndex - 1);
	});

	const downButton = document.createElement('button');
	downButton.classList.add('down', 'lift-button');
	downButton.innerText = '▼';
	downButton.dataset.floor = totalFloors - floorIndex - 1;
	downButton.addEventListener('click', () => {
		liftSystem.requestLift(totalFloors - floorIndex - 1);
	});

	floorElement.append(btnContainer);
	btnContainer.append(upButton, downButton);
}

function generateDoors(liftElement) {
	const leftDoor = document.createElement('div');
	leftDoor.classList.add('door', 'left');

	const rightDoor = document.createElement('div');
	rightDoor.classList.add('door', 'right');

	liftElement.append(leftDoor, rightDoor);
}
