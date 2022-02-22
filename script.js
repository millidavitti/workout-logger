'use strict';

// prettier-ignore

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
  date = new Date();
  id = +(Date.now() + '').slice(-15);
  name = inputType.value;

  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance; // in Km
    this.duration = duration; // in min
  }

  setDescription() {
    // prettier-ignore
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    this.description = `${this.name[0].toUpperCase()}${this.name.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

// Running
class Running extends Workout {
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this.setDescription();
  }
  // Prototype

  calcPace() {
    // min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

// Cycling
class Cycling extends Workout {
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this.setDescription();
  }

  calcSpeed() {
    // km/h
    this.speed = this.distance / (this.duration / 60);
  }
}

// const work1 = new Running([39, 12], 5.2, 24, 178);
// const work2 = new Cycling([39, 12], 27, 95, 949);

/////////////////////////////////////////////////
// App Architecture
class App {
  // Private Methods
  #getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this.#loadMap.bind(this),
        function () {
          alert(`Couldn't get your location`);
        }
      );
  }

  #loadMap(position) {
    const { latitude: lat, longitude: long } = position.coords;

    const coord = [lat, long];
    this.#map = L.map('map').setView(coord, this.#zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    //   Clicks on Map
    this.#map.on('click', this.#showForm.bind(this));

    this.#workouts.forEach(work => {
      this.#renderMarker(work);
    });
  }

  #showForm(e) {
    this.#mapEvent = e;
    form.classList.toggle('hidden');
    inputDistance.focus();
  }
  #toggleElevationFiled() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }
  #newWorkout(e) {
    e.preventDefault();

    function validate(...inputs) {
      return inputs.every(val => Number.isFinite(val));
    }

    function allPositive(...inputs) {
      return inputs.every(val => val > 0);
    }

    // Form Data values
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat: lat, lng: long } = this.#mapEvent.latlng;
    let workout;

    // Workout input Validation
    // Running
    if (type === 'running') {
      const cadence = +inputCadence.value;
      if (
        !validate(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence) /**/
      )
        return alert('Inputs have to be positive numbers');

      workout = new Running([lat, long], distance, duration, cadence);
      this.#workouts.push(workout);
      console.log(workout);
    }

    // Cycling
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      if (
        !validate(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('Inputs have to be positive numbers');

      workout = new Cycling([lat, long], distance, duration, elevation);
      this.#workouts.push(workout);
      console.log(workout);
    }

    this.#renderMarker(workout);
    this.#renderWorkout(workout);
    this.#showForm();
    this.#setLocalStorage();

    inputCadence.value =
      inputDistance.value =
      inputDuration.value =
      inputElevation.value =
        '';
  }

  #renderMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${inputType.value}-popup`,
        }).setContent(workout.description)
      )
      .openPopup();
  }

  #renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.name}" data-id=${workout.id}>
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.name === 'running' ? '🏃‍♂️' : '🚴‍♀️'
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
    `;
    if (workout.name === 'running')
      html += `
     <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>`;

    if (workout.name === 'cycling')
      html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>`;
    form.insertAdjacentHTML('afterend', html);
  }

  #panPopup(e) {
    const workElement = e.target.closest('.workout');
    if (!workElement) return;

    const workout = this.#workouts.find(
      work => work.id === +workElement.dataset.id
    );

    this.#map.setView(workout.coords, this.#zoom, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  #setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  #getLocalStorage() {
    const data = localStorage.getItem('workouts');

    if (!data) return;

    this.#workouts = JSON.parse(data);

    this.#workouts.forEach(work => {
      this.#renderWorkout(work);
    });
  }

  // Private Props
  #map;
  #mapEvent;
  #workouts = [];
  #zoom = 13;

  constructor() {
    this.#getLocalStorage();

    // Get position
    this.#getPosition();

    // Event Handlers
    form.addEventListener('submit', this.#newWorkout.bind(this));
    inputType.addEventListener('change', this.#toggleElevationFiled);
    containerWorkouts.addEventListener('click', this.#panPopup.bind(this));
  }
}

const app = new App();

// Local Storage
