/*
  Muuttujat ja id-tunnisteet nimetään englanniksi.
  Moniosaiset nimet kirjoitetaan camelCase-merkinnällä.
*/

// Sivun elementit valitaan querySelector-metodilla.
const playerNameInput = document.querySelector("#playerName");
const registerButton = document.querySelector("#registerButton");
const playerMessage = document.querySelector("#playerMessage");

const newGameButton = document.querySelector("#newGameButton");
const guessInput = document.querySelector("#guessInput");
const guessButton = document.querySelector("#guessButton");
const guessHistory = document.querySelector("#guessHistory");

const scoreTableBody = document.querySelector("#scoreTableBody");

// Pelin aikana käytettävät muuttujat.
let randomNumber = 0;
let guessCount = 0;
let activePlayer = "";
let gameActive = false;

// Pistetaulukon tulokset tallennetaan tähän taulukkoon.
let scores = JSON.parse(localStorage.getItem("guessingGameScores")) || [];

/*
  Rekisteröi syöttökenttään kirjoitetun nimimerkin
  aktiiviseksi pelaajaksi.
*/
function registerPlayer() {
  const playerName = playerNameInput.value.trim();

  // Nimimerkki ei saa olla tyhjä.
  if (playerName === "") {
    playerMessage.textContent = "Kirjoita nimimerkki.";
    playerNameInput.focus();
    return;
  }

  // Tallennetaan nimimerkki aktiiviseksi pelaajaksi.
  activePlayer = playerName;

  playerMessage.textContent = `Pelaaja: ${activePlayer}`;

  // Tyhjennetään nimimerkkikenttä rekisteröinnin jälkeen.
  playerNameInput.value = "";
}

/*
  Käynnistää uuden pelin.
  Uusi satunnainen kokonaisluku arvotaan väliltä 1–100.
*/
function startNewGame() {
  // Pelaaja pitää rekisteröidä ennen pelin aloittamista.
  if (activePlayer === "") {
    playerMessage.textContent =
      "Rekisteröi pelaaja ennen pelin aloittamista.";

    playerNameInput.focus();
    return;
  }

  // Arvotaan kokonaisluku väliltä 1–100.
  randomNumber = Math.floor(Math.random() * 100) + 1;

  // Nollataan arvausten määrä.
  guessCount = 0;

  // Merkitään peli aktiiviseksi.
  gameActive = true;

  /*
    Tyhjennetään edellisen pelin arvaushistoria.
    replaceChildren-metodia käytetään, koska innerHTML
    ei ole tehtävänannossa sallittu.
  */
  guessHistory.replaceChildren();

  // Tyhjennetään ja aktivoidaan arvauskenttä.
  guessInput.value = "";
  guessInput.disabled = false;
  guessButton.disabled = false;

  // Siirretään kohdistus arvauskenttään.
  guessInput.focus();
}

/*
  Tarkistaa käyttäjän antaman arvauksen
  ja vertaa arvausta arvottuun lukuun.
*/
function checkGuess() {
  // Jos peli ei ole käynnissä, funktio lopetetaan.
  if (!gameActive) {
    return;
  }

  /*
    checkValidity tarkistaa required-, min-, max-
    ja step-ominaisuudet.
  */
  if (!guessInput.checkValidity()) {
    guessInput.reportValidity();
    return;
  }

  // Muutetaan kentän arvo numeroksi.
  const guessedNumber = Number(guessInput.value);

  // Varmistetaan, että annettu arvo on kokonaisluku.
  if (!Number.isInteger(guessedNumber)) {
    guessInput.setCustomValidity("Syötä kokonaisluku.");
    guessInput.reportValidity();
    guessInput.setCustomValidity("");
    return;
  }

  // Kasvatetaan arvausten määrää yhdellä.
  guessCount += 1;

  // Luodaan uusi listan kohta arvaushistoriaa varten.
  const historyItem = document.createElement("li");

  // Tarkistetaan, osuiko arvaus oikeaan.
  if (guessedNumber === randomNumber) {
    historyItem.textContent =
      `Arvasit ${guessCount} kertaa. ` +
      `Arvasit oikein. Luku oli ${randomNumber}.`;

    // Peli päättyy oikeaan arvaukseen.
    gameActive = false;

    // Arvauskenttä ja painike poistetaan käytöstä.
    guessInput.disabled = true;
    guessButton.disabled = true;

    // Tallennetaan pelaajan tulos pistetaulukkoon.
    saveScore();
  } else if (guessedNumber < randomNumber) {
    /*
      Käyttäjän arvaus on pienempi kuin arvottu luku,
      joten oikea luku on suurempi.
    */
    historyItem.textContent =
      `Arvasit ${guessCount} kertaa. Luku on suurempi.`;
  } else {
    /*
      Käyttäjän arvaus on suurempi kuin arvottu luku,
      joten oikea luku on pienempi.
    */
    historyItem.textContent =
      `Arvasit ${guessCount} kertaa. Luku on pienempi.`;
  }

  // Lisätään uusi arvaus näkyviin arvaushistoriaan.
  guessHistory.appendChild(historyItem);

  // Tyhjennetään arvauskenttä seuraavaa arvausta varten.
  guessInput.value = "";

  // Palautetaan kohdistus kenttään, jos peli jatkuu.
  if (gameActive) {
    guessInput.focus();
  }
}

/*
  Tallentaa pelaajan tuloksen.
  Samalta nimimerkiltä säilytetään vain paras tulos.
*/
function saveScore() {
  /*
    Etsitään pistetaulukosta aktiivisen pelaajan
    aikaisempi tulos.
  */
  const oldScore = scores.find(
    (score) => score.playerName === activePlayer
  );

  // Jos pelaajalla ei ole aikaisempaa tulosta, lisätään uusi.
  if (oldScore === undefined) {
    scores.push({
      playerName: activePlayer,
      guesses: guessCount
    });
  } else if (guessCount < oldScore.guesses) {
    /*
      Pienempi arvausten määrä on parempi tulos.
      Aikaisempi tulos korvataan vain paremmalla tuloksella.
    */
    oldScore.guesses = guessCount;
  }

  // Järjestetään tulokset parhaasta huonoimpaan.
  scores.sort(
    (firstScore, secondScore) =>
      firstScore.guesses - secondScore.guesses
  );

  // Taulukkoon jätetään korkeintaan viisi parasta tulosta.
  scores = scores.slice(0, 5);

  // Tallennetaan tulokset localStorageen.
  localStorage.setItem("guessingGameScores", JSON.stringify(scores));

  // Päivitetään HTML-taulukko.
  updateScoreTable();
}

/*
  Rakentaa pistetaulukon scores-taulukon perusteella.
*/
function updateScoreTable() {
  /*
    Tyhjennetään taulukon vanhat rivit.
    innerHTML-ominaisuutta ei käytetä.
  */
  scoreTableBody.replaceChildren();

  // Käydään jokainen pistetulos läpi.
  scores.forEach((score) => {
    // Luodaan uusi taulukkorivi.
    const row = document.createElement("tr");

    // Luodaan nimimerkin solu.
    const playerCell = document.createElement("td");
    playerCell.textContent = score.playerName;

    // Luodaan arvausmäärän solu.
    const guessesCell = document.createElement("td");
    guessesCell.textContent = score.guesses;

    // Lisätään solut taulukkoriville.
    row.append(playerCell, guessesCell);

    // Lisätään valmis rivi pistetaulukkoon.
    scoreTableBody.appendChild(row);
  });
}

// Rekisteröintipainikkeen tapahtumankäsittelijä.
registerButton.addEventListener("click", registerPlayer);

// Uuden pelin painikkeen tapahtumankäsittelijä.
newGameButton.addEventListener("click", startNewGame);

// Arvauspainikkeen tapahtumankäsittelijä.
guessButton.addEventListener("click", checkGuess);

// Alustetaan pistetaulukko sivun latautuessa.
updateScoreTable();

/*
  Pelaajan voi rekisteröidä myös painamalla
  Enter-näppäintä nimimerkkikentässä.
*/
playerNameInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    registerPlayer();
  }
});

/*
  Arvauksen voi lähettää myös painamalla
  Enter-näppäintä arvauskentässä.
*/
guessInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    checkGuess();
  }
});